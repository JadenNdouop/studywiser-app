import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SWEmptyState,
  SWHeader,
  SWSectionHeader,
  SWStatTile,
  avatarTint,
  getInitials,
  subjectTint,
} from "../../components/sw";
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
function currentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
}
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

type NextSession = {
  id: string;
  subject: string;
  tutor_name: string;
  tutor_id: string;
  session_date: string;
  session_time: string;
  duration: number;
  format: string;
  meeting_url: string | null;
} | null;

type UpcomingSession = {
  id: string;
  subject: string;
  tutor_name: string;
  tutor_id: string;
  session_date: string;
  session_time: string;
  duration: number;
  format: string;
};

type Tutor = {
  id: string;
  name: string;
  subject: string;
  sessions: number;
};

export default function StudentHomeScreen() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";

  const [nextSession,  setNextSession]  = useState<NextSession>(null);
  const [upcoming,     setUpcoming]     = useState<UpcomingSession[]>([]);
  const [stats,        setStats]        = useState({ thisWeek: 0, completed: 0, hours: 0 });
  const [tutors,       setTutors]       = useState<Tutor[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [profile?.id])
  );

  async function loadAll() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const today = new Date().toISOString().split("T")[0];
    const { start, end } = currentWeekRange();

    const [nextRes, upcomingRes, completedRes, weekRes] = await Promise.all([
      // Next single upcoming session
      supabase.from("sessions")
        .select(`id, subject, session_date, session_time, duration, format, meeting_url,
          tutor:profiles!sessions_tutor_id_fkey(id, full_name)`)
        .eq("student_profile_id", userId)
        .eq("status", "upcoming")
        .gte("session_date", today)
        .order("session_date").order("session_time")
        .limit(1),

      // Next 3 upcoming sessions (for "Coming Up" list)
      supabase.from("sessions")
        .select(`id, subject, session_date, session_time, duration, format,
          tutor:profiles!sessions_tutor_id_fkey(id, full_name)`)
        .eq("student_profile_id", userId)
        .eq("status", "upcoming")
        .gte("session_date", today)
        .order("session_date").order("session_time")
        .range(1, 4),

      // All completed sessions (for stats + tutors)
      supabase.from("sessions")
        .select(`id, subject, duration, tutor:profiles!sessions_tutor_id_fkey(id, full_name)`)
        .eq("student_profile_id", userId)
        .eq("status", "completed"),

      // This week sessions
      supabase.from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("student_profile_id", userId)
        .gte("session_date", start)
        .lte("session_date", end),
    ]);

    // Next session
    const ns = nextRes.data?.[0];
    setNextSession(ns ? {
      id:           ns.id,
      subject:      ns.subject,
      tutor_name:   (ns.tutor as any)?.full_name ?? "Match Pending",
      tutor_id:     (ns.tutor as any)?.id ?? ns.id,
      session_date: ns.session_date,
      session_time: ns.session_time,
      duration:     ns.duration,
      format:       ns.format ?? "Virtual",
      meeting_url:  ns.meeting_url ?? null,
    } : null);

    // Upcoming list
    setUpcoming((upcomingRes.data ?? []).map((s: any) => ({
      id:           s.id,
      subject:      s.subject,
      tutor_name:   s.tutor?.full_name ?? "Match Pending",
      tutor_id:     s.tutor?.id ?? s.id,
      session_date: s.session_date,
      session_time: s.session_time,
      duration:     s.duration,
      format:       s.format ?? "Virtual",
    })));

    // Stats
    const completed = completedRes.data ?? [];
    const totalHours = Math.round(completed.reduce((sum: number, s: any) => sum + (s.duration ?? 0), 0) / 60);
    setStats({
      thisWeek:  weekRes.count ?? 0,
      completed: completed.length,
      hours:     totalHours,
    });

    // My Tutors — deduplicate by tutor id
    const tutorMap: Record<string, Tutor> = {};
    completed.forEach((s: any) => {
      const tid = s.tutor?.id;
      const tname = s.tutor?.full_name ?? "Unknown";
      if (!tid) return;
      if (!tutorMap[tid]) tutorMap[tid] = { id: tid, name: tname, subject: s.subject, sessions: 0 };
      tutorMap[tid].sessions++;
    });
    setTutors(Object.values(tutorMap).sort((a, b) => b.sessions - a.sessions).slice(0, 3));
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <SWHeader initials={getInitials(profile?.full_name)} />

        {/* Greeting */}
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>Hi, {firstName}!</Text>
          <Text style={styles.subheading}>{getGreeting()} — ready for another productive day of learning?</Text>
        </View>

        {/* Next Session hero */}
        {nextSession ? (
          <View style={styles.nextCard}>
            <View style={styles.nextTopRow}>
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>Next Session</Text>
              </View>
              <Ionicons name="school-outline" size={24} color="rgba(255,255,255,0.9)" />
            </View>
            <View style={styles.nextMain}>
              <View style={[styles.nextAvatar, { backgroundColor: avatarTint(nextSession.tutor_id).bg }]}>
                <Text style={[styles.nextAvatarText, { color: avatarTint(nextSession.tutor_id).fg }]}>
                  {getInitials(nextSession.tutor_name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextSubject}>{nextSession.subject}</Text>
                <View style={styles.nextTutorRow}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.nextTutor}>
                    {nextSession.tutor_name} · {formatDateLabel(nextSession.session_date)} at {formatTime(nextSession.session_time)}
                  </Text>
                </View>
              </View>
            </View>
            {nextSession.format === "Virtual" ? (
              nextSession.meeting_url ? (
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => Linking.openURL(nextSession.meeting_url!)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="videocam-outline" size={18} color={PRIMARY} />
                  <Text style={styles.joinBtnText}>Join Session</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.locationRow}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText}>Meeting link not posted yet</Text>
                </View>
              )
            ) : (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText}>In-person — location sent by tutor</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noSessionCard}>
            <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.6)" />
            <Text style={styles.noSessionText}>No upcoming sessions</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push("/(student-tabs)/sessions")} activeOpacity={0.8}>
            <SWStatTile value={stats.thisWeek} label="This week" variant="lavender" />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push("/(student-tabs)/sessions")} activeOpacity={0.8}>
            <SWStatTile value={stats.hours} label="Total hours" variant="mint" />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push("/(student-tabs)/sessions")} activeOpacity={0.8}>
            <SWStatTile value={stats.completed} label="Completed" variant="coral" />
          </TouchableOpacity>
        </View>

        {/* Coming Up */}
        <View style={styles.section}>
          <SWSectionHeader
            title="Coming Up"
            actionLabel="See all"
            onAction={() => router.push("/(student-tabs)/sessions")}
          />

          {upcoming.length === 0 ? (
            <SWEmptyState icon="calendar-outline" title="No upcoming sessions scheduled" />
          ) : (
            <View style={{ gap: SW.space.stack }}>
              {upcoming.map((s) => {
                const subj = subjectTint(s.subject);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.upcomingCard}
                    onPress={() => router.push("/(student-tabs)/sessions")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIcon, { backgroundColor: subj.bg }]}>
                      <Ionicons name={subj.icon as any} size={20} color={subj.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upcomingSubject}>{s.subject} with {s.tutor_name.split(" ")[0]}</Text>
                      <Text style={styles.upcomingMetaText}>
                        {formatDateLabel(s.session_date)} {formatTime(s.session_time)} · {s.duration} min · {s.format}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={SW.color.outline} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* My Tutors */}
        <View style={styles.section}>
          <SWSectionHeader title="My Tutors" />
          {tutors.length === 0 ? (
            <SWEmptyState
              icon="people-outline"
              title="No tutors yet"
              subtitle="Your tutors will appear here after your first session."
            />
          ) : (
            <View style={styles.tutorPanel}>
              <View style={styles.tutorRow}>
                {tutors.map((t) => {
                  const tint = avatarTint(t.id);
                  return (
                    <View key={t.id} style={styles.tutorItem}>
                      <View style={[styles.tutorAvatar, { backgroundColor: tint.bg }]}>
                        <Text style={[styles.tutorAvatarText, { color: tint.fg }]}>{getInitials(t.name)}</Text>
                      </View>
                      <Text style={styles.tutorName} numberOfLines={1}>
                        {t.name.split(" ")[0]} {t.name.split(" ")[1]?.[0] ?? ""}.
                      </Text>
                      <Text style={styles.tutorSessions}>{t.sessions} session{t.sessions !== 1 ? "s" : ""}</Text>
                    </View>
                  );
                })}
              </View>
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
  heading: { ...SW.type.headlineLg, color: SW.color.onSurface },
  subheading: { ...SW.type.bodyMd, color: SW.color.muted, marginTop: 4 },

  nextCard: {
    backgroundColor: SW.color.primaryContainer,
    borderRadius: SW.radius.xl,
    marginHorizontal: SW.space.margin,
    padding: SW.space.cardPad + 4,
    marginBottom: 20,
    gap: 16,
    ...SW.shadow(SW.color.primaryContainer, 0.35),
  },
  nextTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: SW.radius.full, paddingHorizontal: 14, paddingVertical: 6,
  },
  nextBadgeText: { ...SW.type.labelMd, color: "#fff" },
  nextMain: { flexDirection: "row", alignItems: "center", gap: 14 },
  nextAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  nextAvatarText: { fontFamily: SW.font.bold, fontSize: 20 },
  nextSubject: { fontFamily: SW.font.bold, fontSize: 22, lineHeight: 28, color: "#fff" },
  nextTutorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  nextTutor: { ...SW.type.bodyMd, fontSize: 14, color: "rgba(255,255,255,0.9)", flexShrink: 1 },
  joinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#fff", borderRadius: SW.radius.full, paddingVertical: 14,
  },
  joinBtnText: { fontFamily: SW.font.bold, fontSize: 16, color: PRIMARY },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { ...SW.type.bodyMd, fontSize: 13, color: "rgba(255,255,255,0.8)" },

  noSessionCard: {
    backgroundColor: SW.color.primaryContainer,
    borderRadius: SW.radius.xl,
    marginHorizontal: SW.space.margin, padding: 28, marginBottom: 20,
    alignItems: "center", gap: 10,
    ...SW.shadow(SW.color.primaryContainer, 0.3),
  },
  noSessionText: { ...SW.type.bodyLg, color: "rgba(255,255,255,0.85)" },

  statsRow: { flexDirection: "row", marginHorizontal: SW.space.margin, gap: 12, marginBottom: 28 },

  section: { paddingHorizontal: SW.space.margin, marginBottom: 28 },

  upcomingCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    paddingHorizontal: 16, paddingVertical: 14,
    ...SW.shadow(SW.color.outline, 0.2),
  },
  subjectIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  upcomingSubject: { ...SW.type.bodyLg, fontFamily: SW.font.bold, fontSize: 15, color: SW.color.onSurface },
  upcomingMetaText: { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted, marginTop: 3 },

  tutorPanel: {
    backgroundColor: SW.color.card,
    borderRadius: SW.radius.lg,
    padding: SW.space.cardPad,
    ...SW.shadow(SW.color.outline, 0.22),
  },
  tutorRow: { flexDirection: "row", gap: 20 },
  tutorItem: { alignItems: "center", gap: 4, width: 76 },
  tutorAvatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  tutorAvatarText: { fontFamily: SW.font.bold, fontSize: 20 },
  tutorName: { ...SW.type.labelMd, fontSize: 13, color: SW.color.onSurface },
  tutorSessions: { ...SW.type.labelSm, fontFamily: SW.font.medium, fontSize: 11, color: SW.color.muted },
});
