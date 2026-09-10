import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SWEmptyState, SWHeader, SWSectionHeader, SWStatTile, avatarTint, getInitials, subjectTint } from "../../components/sw";
import { MOCK_TUTOR_SESSIONS, USE_MOCK } from "../../constants/mockData";
import { SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

const PRIMARY = SW.color.primary;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type SessionRow = {
  id: string;
  subject: string;
  session_date: string;
  session_time: string;
  duration: number;
  format: string;
  student_name: string;
  meeting_url: string | null;
};

export default function TutorHomeScreen() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const [sessions, setSessions]   = useState<SessionRow[]>([]);
  const [stats, setStats]         = useState({ thisWeek: 0, pending: 0, completed: 0 });
  const [loading, setLoading]     = useState(true);

  useFocusEffect(useCallback(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]));

  async function loadData() {
    if (sessions.length === 0) setLoading(true);
    if (USE_MOCK) {
      const today = new Date().toISOString().split("T")[0];
      const upcoming = MOCK_TUTOR_SESSIONS.filter((s) => s.status === "upcoming" && s.session_date >= today);
      setSessions(upcoming.map((s) => ({ id: s.id, subject: s.subject, session_date: s.session_date, session_time: s.session_time, duration: s.duration, format: s.format, student_name: s.student_name, meeting_url: s.meeting_url ?? null })));
      setStats({
        thisWeek:  upcoming.length,
        pending:   MOCK_TUTOR_SESSIONS.filter((s) => s.status === "pending").length,
        completed: MOCK_TUTOR_SESSIONS.filter((s) => s.status === "completed").length,
      });
      setLoading(false);
      return;
    }
    const userId = profile!.id;
    const today  = new Date().toISOString().split("T")[0];
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Upcoming sessions (next 30 days), with student names via join
    const { data: sessionData } = await supabase
      .from("sessions")
      .select(`
        id, subject, session_date, session_time, duration, format, meeting_url,
        student_profile:profiles!sessions_student_profile_id_fkey(full_name),
        managed_student:students!sessions_student_id_fkey(full_name)
      `)
      .eq("tutor_id", userId)
      .eq("status", "upcoming")
      .gte("session_date", today)
      .order("session_date", { ascending: true })
      .order("session_time", { ascending: true })
      .limit(10);

    const mapped: SessionRow[] = (sessionData ?? []).map((s: any) => ({
      id: s.id,
      subject: s.subject,
      session_date: s.session_date,
      session_time: s.session_time,
      duration: s.duration,
      format: s.format,
      student_name: s.student_profile?.full_name ?? s.managed_student?.full_name ?? "Student",
      meeting_url: s.meeting_url ?? null,
    }));
    setSessions(mapped);

    // Stats counts
    const [thisWeekRes, pendingRes, completedRes] = await Promise.all([
      supabase.from("sessions").select("*", { count: "exact", head: true })
        .eq("tutor_id", userId).eq("status", "upcoming")
        .gte("session_date", today).lte("session_date", weekEnd),
      supabase.from("sessions").select("*", { count: "exact", head: true })
        .eq("tutor_id", userId).eq("status", "pending" as any),
      supabase.from("sessions").select("*", { count: "exact", head: true })
        .eq("tutor_id", userId).eq("status", "completed"),
    ]);

    setStats({
      thisWeek:  thisWeekRes.count  ?? 0,
      pending:   pendingRes.count   ?? 0,
      completed: completedRes.count ?? 0,
    });

    setLoading(false);
  }

  const nextSession = sessions[0] ?? null;
  const comingUp    = sessions.slice(1);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return { label: "Today",    num: d.getDate() };
    if (diff === 1) return { label: "Tomorrow", num: d.getDate() };
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      num:   d.getDate(),
    };
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <SWHeader initials={getInitials(profile?.full_name)} />

        {/* Greeting */}
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>{getGreeting()}, {firstName}!</Text>
          <Text style={styles.subheading}>Ready to inspire some young minds today?</Text>
        </View>

        {/* Next Session hero */}
        {nextSession ? (
          <View style={styles.nextCard}>
            <View style={styles.nextTopRow}>
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>UPCOMING NOW</Text>
              </View>
              <View style={styles.nextIconTile}>
                <Ionicons name={subjectTint(nextSession.subject).icon as any} size={24} color="#fff" />
              </View>
            </View>
            <Text style={styles.nextName}>{nextSession.student_name}</Text>
            <Text style={styles.nextSubject}>{nextSession.subject}</Text>
            <View style={styles.nextMeta}>
              {(() => { const d = formatDate(nextSession.session_date); return (
                <View style={styles.nextMetaPill}>
                  <Ionicons name="time-outline" size={14} color="#fff" />
                  <Text style={styles.nextMetaText}>{d.label} at {formatTime(nextSession.session_time)}</Text>
                </View>
              ); })()}
              <View style={styles.nextMetaPill}>
                <Ionicons name="stopwatch-outline" size={14} color="#fff" />
                <Text style={styles.nextMetaText}>{nextSession.duration} min</Text>
              </View>
            </View>
            {nextSession.format === "Virtual" ? (
              nextSession.meeting_url ? (
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => Linking.openURL(nextSession.meeting_url!)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.joinBtnText}>Join Session</Text>
                  <Ionicons name="videocam-outline" size={18} color={PRIMARY} />
                </TouchableOpacity>
              ) : (
                <View style={styles.inPersonRow}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.inPersonText}>Add a meeting link from your Schedule</Text>
                </View>
              )
            ) : (
              <View style={styles.inPersonRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.inPersonText}>In-person — location sent separately</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noSessionCard}>
            <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.6)" />
            <Text style={styles.noSessionText}>No upcoming sessions scheduled</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: "/all-sessions", params: { filter: "upcoming" } } as any)}
            activeOpacity={0.8}
          >
            <SWStatTile value={stats.thisWeek} label="Sessions this week" variant="mint" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: "/all-sessions", params: { filter: "pending" } } as any)}
            activeOpacity={0.8}
          >
            <SWStatTile value={stats.pending} label="Pending requests" variant="coral" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: "/all-sessions", params: { filter: "completed" } } as any)}
            activeOpacity={0.8}
          >
            <SWStatTile value={stats.completed} label="Completed" variant="lavender" />
          </TouchableOpacity>
        </View>

        {/* Coming up */}
        <View style={styles.section}>
          <SWSectionHeader
            title="Coming Up Next"
            actionLabel="View Calendar"
            onAction={() => router.push("/(tutor-tabs)/schedule")}
          />
          {comingUp.length === 0 ? (
            <SWEmptyState
              icon="calendar-outline"
              title="Nothing coming up"
              subtitle="Accept a request to fill your schedule."
            />
          ) : (
            <View style={{ gap: SW.space.stack }}>
              {comingUp.map((s) => {
                const d = formatDate(s.session_date);
                const tint = avatarTint(s.id);
                const subj = subjectTint(s.subject);
                return (
                  <View key={s.id} style={styles.upcomingCard}>
                    <View style={[styles.upcomingAvatar, { backgroundColor: tint.bg }]}>
                      <Text style={[styles.upcomingAvatarText, { color: tint.fg }]}>{getInitials(s.student_name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upcomingName}>{s.student_name}</Text>
                      <View style={styles.upcomingSubjectRow}>
                        <Ionicons name={subj.icon as any} size={13} color={SW.color.onSurfaceVariant} />
                        <Text style={styles.upcomingSubject}>{s.subject}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.upcomingDate}>{d.label}</Text>
                      <Text style={styles.upcomingTime}>{formatTime(s.session_time)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SW.color.surface },
  scroll: { paddingBottom: 130 },

  headingWrap: { paddingHorizontal: SW.space.margin, marginBottom: 20 },
  heading: { ...SW.type.headlineLg, fontSize: 32, lineHeight: 40, color: SW.color.onSurface },
  subheading: { ...SW.type.bodyLg, color: SW.color.muted, marginTop: 6 },

  nextCard: {
    backgroundColor: SW.color.primaryContainer,
    borderRadius: SW.radius.xl,
    marginHorizontal: SW.space.margin,
    padding: SW.space.cardPad + 4,
    marginBottom: 20,
    ...SW.shadow(SW.color.primaryContainer, 0.35),
  },
  nextTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  nextBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: SW.radius.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  nextBadgeText: { ...SW.type.labelSm, color: "#fff", letterSpacing: 1 },
  nextIconTile: {
    width: 52, height: 52, borderRadius: SW.radius.md,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  nextName: { fontFamily: SW.font.bold, fontSize: 26, lineHeight: 32, color: "#fff" },
  nextSubject: { ...SW.type.bodyLg, color: "rgba(255,255,255,0.9)", marginTop: 2, marginBottom: 16 },
  nextMeta: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 18 },
  nextMetaPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)",
    borderRadius: SW.radius.full, paddingHorizontal: 14, paddingVertical: 8,
  },
  nextMetaText: { ...SW.type.labelMd, color: "#fff" },
  joinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#fff", borderRadius: SW.radius.full, paddingVertical: 15,
  },
  joinBtnText: { fontFamily: SW.font.bold, fontSize: 17, color: PRIMARY },
  inPersonRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inPersonText: { ...SW.type.bodyMd, fontSize: 13, color: "rgba(255,255,255,0.8)" },

  noSessionCard: {
    backgroundColor: SW.color.primaryContainer,
    borderRadius: SW.radius.xl,
    marginHorizontal: SW.space.margin, padding: 28, marginBottom: 20,
    alignItems: "center", gap: 10,
    ...SW.shadow(SW.color.primaryContainer, 0.3),
  },
  noSessionText: { ...SW.type.bodyMd, color: "rgba(255,255,255,0.8)" },

  statsRow: { flexDirection: "row", marginHorizontal: SW.space.margin, gap: 12, marginBottom: 28 },

  section: { paddingHorizontal: SW.space.margin },

  upcomingCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    paddingHorizontal: 16, paddingVertical: 14,
    ...SW.shadow(SW.color.outline, 0.2),
  },
  upcomingAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  upcomingAvatarText: { fontFamily: SW.font.bold, fontSize: 16 },
  upcomingName: { ...SW.type.bodyLg, fontFamily: SW.font.bold, fontSize: 16, color: SW.color.onSurface },
  upcomingSubjectRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  upcomingSubject: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.onSurfaceVariant },
  upcomingDate: { ...SW.type.labelMd, color: PRIMARY },
  upcomingTime: { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted, marginTop: 2 },
});
