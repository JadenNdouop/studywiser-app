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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const TODAY_DATE = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric",
});

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = ["#c7d2fe","#fde8d8","#d1fae5","#fef9c3","#fee2e2","#ddd6fe"];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type SessionRow = {
  id: string;
  subject: string;
  session_date: string;
  session_time: string;
  duration: number;
  format: string;
  student_name: string;
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
    const userId = profile!.id;
    const today  = new Date().toISOString().split("T")[0];
    const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Upcoming sessions (next 30 days), with student names via join
    const { data: sessionData } = await supabase
      .from("sessions")
      .select(`
        id, subject, session_date, session_time, duration, format,
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

        {/* Next Session card */}
        {nextSession ? (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>NEXT SESSION</Text>
            <View style={styles.nextTop}>
              <View style={[styles.nextAvatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Text style={styles.nextAvatarText}>{getInitials(nextSession.student_name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextName}>{nextSession.student_name}</Text>
                <Text style={styles.nextSubject}>{nextSession.subject}</Text>
              </View>
            </View>
            <View style={styles.nextMeta}>
              {(() => { const d = formatDate(nextSession.session_date); return (
                <View style={styles.nextMetaPill}>
                  <Ionicons name="today-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.nextMetaText}>{d.label}</Text>
                </View>
              ); })()}
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
              <View style={styles.inPersonRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.inPersonText}>In-person — location sent separately</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noSessionCard}>
            <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.5)" />
            <Text style={styles.noSessionText}>No upcoming sessions scheduled</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "This Week", value: stats.thisWeek,  icon: "calendar-outline",         filter: "upcoming"  },
            { label: "Pending",   value: stats.pending,   icon: "time-outline",             filter: "pending"   },
            { label: "Completed", value: stats.completed, icon: "checkmark-circle-outline", filter: "completed" },
          ].map((s) => (
            <TouchableOpacity
              key={s.label}
              style={styles.statChip}
              onPress={() => router.push({ pathname: "/all-sessions", params: { filter: s.filter } } as any)}
              activeOpacity={0.75}
            >
              <Ionicons name={s.icon as any} size={18} color={PRIMARY} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming up */}
        {comingUp.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coming Up</Text>
            <View style={styles.upcomingList}>
              {comingUp.map((s, i) => {
                const d = formatDate(s.session_date);
                const color = avatarColor(s.id);
                return (
                  <View key={s.id}>
                    <View style={styles.upcomingRow}>
                      <View style={styles.datePill}>
                        <Text style={styles.datePillDay}>{d.label.toUpperCase().slice(0,3)}</Text>
                        <Text style={styles.datePillNum}>{d.num}</Text>
                      </View>
                      <View style={styles.upcomingInfo}>
                        <Text style={styles.upcomingName}>{s.student_name}</Text>
                        <Text style={styles.upcomingSubject}>{s.subject}</Text>
                        <View style={styles.upcomingTimeLine}>
                          <Ionicons name="time-outline" size={12} color="#94a3b8" />
                          <Text style={styles.upcomingTime}>{formatTime(s.session_time)} · {s.duration} min</Text>
                        </View>
                      </View>
                      <View style={[styles.upcomingAvatar, { backgroundColor: color }]}>
                        <Text style={styles.upcomingAvatarText}>{getInitials(s.student_name)}</Text>
                      </View>
                    </View>
                    {i < comingUp.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

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
  greeting: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  dateText:  { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center", marginTop: 4,
  },

  nextCard: {
    backgroundColor: PRIMARY, borderRadius: 24,
    marginHorizontal: 20, padding: 20, marginBottom: 20, gap: 14,
  },
  nextLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  nextTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  nextAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  nextAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  nextName: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 3 },
  nextSubject: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  nextMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
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
  inPersonRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inPersonText: { color: "rgba(255,255,255,0.65)", fontSize: 12 },

  noSessionCard: {
    backgroundColor: PRIMARY, borderRadius: 24,
    marginHorizontal: 20, padding: 28, marginBottom: 20,
    alignItems: "center", gap: 10,
  },
  noSessionText: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "500" },

  statsRow: { flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 28 },
  statChip: {
    flex: 1, alignItems: "center",
    backgroundColor: CARD_BG, borderRadius: 18, paddingVertical: 14,
  },
  statValue: { color: PRIMARY, fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#64748b", fontSize: 11, marginTop: 2 },

  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 14 },
  upcomingList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20, overflow: "hidden" },
  upcomingRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  datePill: {
    width: 46, alignItems: "center",
    backgroundColor: CARD_BG, borderRadius: 14, paddingVertical: 8,
  },
  datePillDay: { color: PRIMARY, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  datePillNum: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginTop: 2 },
  upcomingInfo: { flex: 1, gap: 2 },
  upcomingName: { color: "#0f172a", fontSize: 14, fontWeight: "700" },
  upcomingSubject: { color: "#64748b", fontSize: 12 },
  upcomingTimeLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  upcomingTime: { color: "#94a3b8", fontSize: 11 },
  upcomingAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  upcomingAvatarText: { color: PRIMARY, fontSize: 14, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },
});
