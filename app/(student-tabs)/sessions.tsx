import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../context/auth";
import { formatFrequency, formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

type Status = "upcoming" | "pending" | "completed" | "cancelled";

type SessionRow = {
  id: string;
  subject: string;
  tutor_name: string;
  session_date: string;
  session_time: string;
  duration: number;
  format: string;
  frequency: string;
  status: Status;
  meeting_url: string | null;
};

const SUBJECT_TIER: Record<string, "Basic" | "Upper" | "SAT"> = {};
const TIER_SUBJECTS = {
  Basic: ["Reading & Writing", "Math", "Science", "Social Studies", "Spelling"],
  Upper: ["Algebra I / II", "Geometry", "Pre-Calculus / Calculus", "Biology", "Chemistry", "Physics", "English / Literature", "US History / World History"],
  SAT:   ["SAT Math", "SAT Reading & Writing", "ACT", "PSAT"],
};
Object.entries(TIER_SUBJECTS).forEach(([tier, subjects]) => {
  subjects.forEach((s) => { SUBJECT_TIER[s] = tier as "Basic" | "Upper" | "SAT"; });
});
const TIER_COLOR: Record<string, { color: string; bg: string }> = {
  Basic: { color: "#0369a1", bg: "#e0f2fe" },
  Upper: { color: "#7c3aed", bg: "#ede9fe" },
  SAT:   { color: "#b45309", bg: "#fef3c7" },
};

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
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type FilterTab = "All" | "Upcoming" | "Completed";
const FILTER_TABS: FilterTab[] = ["All", "Upcoming", "Completed"];

export default function StudentSessionsScreen() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [profile?.id])
  );

  async function loadSessions() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from("sessions")
      .select(`
        id, subject, session_date, session_time, duration, format, frequency, status, meeting_url,
        tutor:profiles!sessions_tutor_id_fkey(full_name)
      `)
      .eq("student_profile_id", userId)
      .order("session_date", { ascending: false })
      .order("session_time", { ascending: false });

    setSessions(
      (data ?? []).map((s: any) => ({
        id:           s.id,
        subject:      s.subject,
        tutor_name:   s.tutor?.full_name ?? "Match Pending",
        session_date: s.session_date,
        session_time: s.session_time,
        duration:     s.duration,
        format:       s.format ?? "Virtual",
        frequency:    s.frequency ?? "One-time",
        status:       s.status as Status,
        meeting_url:  s.meeting_url ?? null,
      }))
    );
  }

  const filtered = sessions.filter((s) => {
    if (activeFilter === "All") return s.status !== "cancelled";
    return s.status === activeFilter.toLowerCase();
  });

  const completedCount = sessions.filter((s) => s.status === "completed").length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sessions</Text>
        {completedCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{completedCount} completed</Text>
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeFilter === tab && styles.tabActive]}
            onPress={() => setActiveFilter(tab)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeFilter === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={52} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No sessions here</Text>
            <Text style={styles.emptyBody}>
              {activeFilter === "All"
                ? "You don't have any sessions yet."
                : `No ${activeFilter.toLowerCase()} sessions to show.`}
            </Text>
          </View>
        ) : (
          filtered.map((s) => {
            const tier = SUBJECT_TIER[s.subject] ?? "Basic";
            const tc   = TIER_COLOR[tier];
            const isPending = s.status === "pending";

            return (
              <View key={s.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.timeChip}>
                    <Ionicons name="time-outline" size={12} color={PRIMARY} />
                    <Text style={styles.timeChipText}>
                      {formatDateLabel(s.session_date)} · {formatTime(s.session_time)} · {s.duration} min
                    </Text>
                  </View>
                  <View style={[styles.tierBadge, { backgroundColor: tc.bg }]}>
                    <Text style={[styles.tierBadgeText, { color: tc.color }]}>{tier}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor(s.id) }]}>
                    <Text style={styles.avatarText}>
                      {isPending ? "?" : getInitials(s.tutor_name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subject}>{s.subject}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.formatDot, { backgroundColor: s.format === "Virtual" ? "#3b82f6" : "#10b981" }]} />
                      <Text style={styles.metaText}>{s.format}</Text>
                      {s.frequency !== "One-time" && (
                        <>
                          <Text style={styles.metaDot}>·</Text>
                          <Text style={styles.metaText}>{formatFrequency(s.frequency)}</Text>
                        </>
                      )}
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaText}>{s.tutor_name}</Text>
                    </View>
                  </View>
                  {s.status === "completed" && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    </View>
                  )}
                </View>

                {s.status === "upcoming" && s.format === "Virtual" && s.meeting_url && (
                  <>
                    <View style={styles.cardDivider} />
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => Linking.openURL(s.meeting_url!)}
                      >
                        <Ionicons name="videocam-outline" size={15} color="#fff" />
                        <Text style={styles.joinBtnText}>Join</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  headerBadge: { backgroundColor: "#ecfdf5", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  headerBadgeText: { fontSize: 12, fontWeight: "700", color: "#10b981" },

  tabBar: {
    flexDirection: "row", marginHorizontal: 20, marginBottom: 12,
    backgroundColor: CARD_BG, borderRadius: 16, padding: 4, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: "center" },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  scroll: { paddingHorizontal: 20, paddingBottom: 110, gap: 12 },

  card: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 18, overflow: "hidden" },
  cardTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  timeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  timeChipText: { color: PRIMARY, fontSize: 11, fontWeight: "600" },
  tierBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  tierBadgeText: { fontSize: 10, fontWeight: "700" },

  cardBody: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  subject: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  formatDot: { width: 5, height: 5, borderRadius: 3 },
  metaText: { fontSize: 11, color: "#94a3b8" },
  metaDot: { fontSize: 11, color: "#cbd5e1" },
  completedBadge: { padding: 4 },

  cardDivider: { height: 1, backgroundColor: "#f1f5f9" },
  cardActions: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, justifyContent: "flex-end" },
  joinBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: PRIMARY },
  joinBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { color: "#64748b", fontSize: 18, fontWeight: "700" },
  emptyBody: { color: "#94a3b8", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
