import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

type Status = "upcoming" | "pending" | "completed";

type SessionRow = {
  id: string;
  student_name: string;
  subject: string;
  format: string;
  frequency: string;
  session_date: string;
  session_time: string;
  duration: number;
  price: number | null;
  status: Status;
};

const TABS: { key: Status | "all"; label: string }[] = [
  { key: "all",       label: "All"       },
  { key: "upcoming",  label: "Upcoming"  },
  { key: "pending",   label: "Pending"   },
  { key: "completed", label: "Completed" },
];

const STATUS_COLOR: Record<Status, string> = {
  upcoming:  PRIMARY,
  pending:   "#f59e0b",
  completed: "#10b981",
};
const STATUS_BG: Record<Status, string> = {
  upcoming:  CARD_BG,
  pending:   "#fffbeb",
  completed: "#ecfdf5",
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

export default function AllSessionsScreen() {
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ filter?: string }>();
  const initial = (params.filter as Status | "all") ?? "all";

  const [activeTab, setActiveTab] = useState<Status | "all">(initial);
  const [sessions,  setSessions]  = useState<SessionRow[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadSessions();
  }, [profile?.id]);

  async function loadSessions() {
    setLoading(true);
    const { data } = await supabase
      .from("sessions")
      .select(`
        id, session_date, session_time, duration, subject, status, format, frequency, price,
        student_profile:profiles!sessions_student_profile_id_fkey(full_name),
        managed_student:students!sessions_student_id_fkey(full_name)
      `)
      .eq("tutor_id", profile!.id)
      .order("session_date", { ascending: false })
      .order("session_time", { ascending: false });

    const mapped: SessionRow[] = (data ?? []).map((s: any) => ({
      id:           s.id,
      student_name: s.student_profile?.full_name ?? s.managed_student?.full_name ?? "Student",
      subject:      s.subject,
      format:       s.format ?? "Virtual",
      frequency:    s.frequency ?? "One-time",
      session_date: s.session_date,
      session_time: s.session_time,
      duration:     s.duration,
      price:        s.price ?? null,
      status:       s.status as Status,
    }));

    setSessions(mapped);
    setLoading(false);
  }

  const filtered = activeTab === "all"
    ? sessions
    : sessions.filter((s) => s.status === activeTab);

  const totalEarnings = filtered.reduce((sum, s) => sum + (s.price ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sessions</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary bar */}
      {!loading && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryCount}>
            {filtered.length} session{filtered.length !== 1 ? "s" : ""}
          </Text>
          {activeTab !== "pending" && totalEarnings > 0 && (
            <Text style={styles.summaryEarnings}>${totalEarnings.toFixed(0)} total</Text>
          )}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyBody}>Loading…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={44} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No sessions here</Text>
            <Text style={styles.emptyBody}>Nothing to show for this filter.</Text>
          </View>
        ) : (
          filtered.map((s) => {
            const color = avatarColor(s.id);
            return (
              <View key={s.id} style={styles.card}>
                {/* Top row: date/time + status */}
                <View style={styles.cardTopRow}>
                  <View style={styles.timeChip}>
                    <Ionicons name="time-outline" size={12} color={PRIMARY} />
                    <Text style={styles.timeChipText}>
                      {formatDateLabel(s.session_date)} · {s.session_time} · {s.duration} min
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[s.status] }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[s.status] }]}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Body: avatar + info + price */}
                <View style={styles.cardBody}>
                  <View style={[styles.avatar, { backgroundColor: color }]}>
                    <Text style={styles.avatarText}>{getInitials(s.student_name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{s.student_name}</Text>
                    <Text style={styles.subjectText}>{s.subject}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.formatDot, { backgroundColor: s.format === "Virtual" ? "#3b82f6" : "#10b981" }]} />
                      <Text style={styles.metaText}>
                        {s.format}{s.frequency && s.frequency !== "One-time" ? `, ${s.frequency}` : ""}
                      </Text>
                    </View>
                  </View>
                  {s.price != null && (
                    <Text style={styles.earningsText}>${s.price % 1 === 0 ? s.price.toFixed(0) : s.price.toFixed(2)}</Text>
                  )}
                </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: PRIMARY, fontSize: 18, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 4,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 13,
    alignItems: "center",
  },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  summaryCount: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  summaryEarnings: { fontSize: 13, color: "#10b981", fontWeight: "700" },

  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 12 },

  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    overflow: "hidden",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timeChipText: { color: PRIMARY, fontSize: 11, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "700" },

  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  studentName: { color: "#0f172a", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  subjectText: { color: "#475569", fontSize: 12, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  formatDot: { width: 6, height: 6, borderRadius: 3 },
  metaText: { color: "#64748b", fontSize: 11 },
  earningsText: { fontSize: 15, fontWeight: "800", color: "#10b981" },

  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { color: "#94a3b8", fontSize: 16, fontWeight: "600" },
  emptyBody: { color: "#cbd5e1", fontSize: 13 },
});
