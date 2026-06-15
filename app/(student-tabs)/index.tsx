import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";
import { formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

const AVATAR_COLORS = ["#c7d2fe","#fde8d8","#d1fae5","#fef9c3","#fee2e2","#ddd6fe"];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
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

const TODAY_DATE = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric",
});

type NextSession = {
  id: string;
  subject: string;
  tutor_name: string;
  tutor_id: string;
  session_date: string;
  session_time: string;
  duration: number;
  format: string;
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
        .select(`id, subject, session_date, session_time, duration, format,
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
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {firstName} 👋</Text>
            <Text style={styles.dateText}>{TODAY_DATE}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Next Session */}
        {nextSession ? (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>NEXT SESSION</Text>
            <View style={styles.nextTop}>
              <View style={[styles.nextAvatar, { backgroundColor: avatarColor(nextSession.tutor_id) }]}>
                <Text style={styles.nextAvatarText}>{getInitials(nextSession.tutor_name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextSubject}>{nextSession.subject}</Text>
                <Text style={styles.nextTutor}>with {nextSession.tutor_name}</Text>
              </View>
            </View>
            <View style={styles.nextMeta}>
              <View style={styles.nextMetaPill}>
                <Ionicons name="today-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.nextMetaText}>{formatDateLabel(nextSession.session_date)}</Text>
              </View>
              <View style={styles.nextMetaPill}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.nextMetaText}>{formatTime(nextSession.session_time)}</Text>
              </View>
              <View style={styles.nextMetaPill}>
                <Ionicons name="hourglass-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.nextMetaText}>{nextSession.duration} min</Text>
              </View>
            </View>
            {nextSession.format === "Virtual" ? (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => Alert.alert("Join Session", "Opening meeting link…")}
                activeOpacity={0.85}
              >
                <Ionicons name="videocam-outline" size={18} color={PRIMARY} />
                <Text style={styles.joinBtnText}>Join Session</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.locationText}>In-person — location sent by tutor</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noSessionCard}>
            <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.5)" />
            <Text style={styles.noSessionText}>No upcoming sessions</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "This Week", value: String(stats.thisWeek), icon: "calendar-outline"         },
            { label: "Completed", value: String(stats.completed), icon: "checkmark-circle-outline" },
            { label: "Hours",     value: String(stats.hours),     icon: "time-outline"             },
          ].map((s) => (
            <TouchableOpacity
              key={s.label}
              style={styles.statChip}
              onPress={() => router.push("/(student-tabs)/sessions")}
              activeOpacity={0.75}
            >
              <Ionicons name={s.icon as any} size={18} color={PRIMARY} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Up */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Coming Up</Text>
            <TouchableOpacity onPress={() => router.push("/(student-tabs)/sessions")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {upcoming.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>No upcoming sessions scheduled.</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {upcoming.map((s, i) => {
                const d = new Date(s.session_date + "T00:00:00");
                return (
                  <View key={s.id}>
                    <View style={styles.upcomingRow}>
                      <View style={styles.datePill}>
                        <Text style={styles.datePillDay}>
                          {d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                        </Text>
                        <Text style={styles.datePillNum}>{d.getDate()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.upcomingSubject}>{s.subject}</Text>
                        <View style={styles.upcomingMeta}>
                          <Ionicons name="time-outline" size={12} color="#94a3b8" />
                          <Text style={styles.upcomingMetaText}>{formatTime(s.session_time)} · {s.duration} min</Text>
                          <View style={[styles.formatDot, { backgroundColor: s.format === "Virtual" ? "#3b82f6" : "#10b981" }]} />
                          <Text style={styles.upcomingMetaText}>{s.format}</Text>
                        </View>
                      </View>
                      <View style={[styles.tutorAvatar, { backgroundColor: avatarColor(s.tutor_id) }]}>
                        <Text style={styles.tutorAvatarText}>{getInitials(s.tutor_name)}</Text>
                      </View>
                    </View>
                    {i < upcoming.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* My Tutors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Tutors</Text>
          {tutors.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>Your tutors will appear here after your first session.</Text>
            </View>
          ) : (
            <View style={styles.tutorCards}>
              {tutors.map((t) => (
                <View key={t.id} style={styles.tutorCard}>
                  <View style={[styles.tutorCardAvatar, { backgroundColor: avatarColor(t.id) }]}>
                    <Text style={styles.tutorCardAvatarText}>{getInitials(t.name)}</Text>
                  </View>
                  <Text style={styles.tutorName}>{t.name}</Text>
                  <Text style={styles.tutorSubject}>{t.subject}</Text>
                  <Text style={styles.tutorSessions}>{t.sessions} session{t.sessions !== 1 ? "s" : ""}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 110 },

  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  dateText: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center", marginTop: 4,
  },

  nextCard: {
    backgroundColor: PRIMARY, borderRadius: 24,
    marginHorizontal: 20, padding: 20, marginBottom: 20, gap: 14,
  },
  noSessionCard: {
    backgroundColor: PRIMARY, borderRadius: 24,
    marginHorizontal: 20, padding: 28, marginBottom: 20,
    alignItems: "center", gap: 10,
  },
  noSessionText: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "600" },
  nextLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  nextTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  nextAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  nextAvatarText: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  nextSubject: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  nextTutor: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "500" },
  nextMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  nextMetaPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  nextMetaText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "500" },
  joinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#fff", borderRadius: 30, paddingVertical: 13,
  },
  joinBtnText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { color: "rgba(255,255,255,0.65)", fontSize: 12 },

  statsRow: { flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 28 },
  statChip: {
    flex: 1, alignItems: "center", backgroundColor: CARD_BG,
    borderRadius: 18, paddingVertical: 14,
  },
  statValue: { color: PRIMARY, fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#64748b", fontSize: 11, marginTop: 2 },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 14 },
  seeAll: { fontSize: 13, color: PRIMARY, fontWeight: "600" },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f8fafc", borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  emptyBoxText: { color: "#94a3b8", fontSize: 13, flex: 1 },

  cardList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20, overflow: "hidden" },
  upcomingRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  datePill: {
    width: 46, alignItems: "center", backgroundColor: CARD_BG,
    borderRadius: 14, paddingVertical: 8,
  },
  datePillDay: { color: PRIMARY, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  datePillNum: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginTop: 2 },
  upcomingSubject: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  upcomingMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  upcomingMetaText: { fontSize: 11, color: "#94a3b8" },
  formatDot: { width: 5, height: 5, borderRadius: 3 },
  tutorAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  tutorAvatarText: { color: PRIMARY, fontSize: 13, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },

  tutorCards: { flexDirection: "row", gap: 12 },
  tutorCard: {
    flex: 1, backgroundColor: CARD_BG, borderRadius: 20,
    padding: 16, alignItems: "center", gap: 4,
  },
  tutorCardAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  tutorCardAvatarText: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  tutorName: { fontSize: 14, fontWeight: "700", color: "#0f172a", textAlign: "center" },
  tutorSubject: { fontSize: 11, color: "#64748b", textAlign: "center" },
  tutorSessions: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
});
