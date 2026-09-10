import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { SWEmptyState, SWHeader, SWStatusBadge, getInitials, subjectTint } from "../../components/sw";
import { SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { formatFrequency, formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

const PRIMARY = SW.color.primary;

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

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <SWHeader initials={getInitials(profile?.full_name)} />

      <View style={styles.headingWrap}>
        <Text style={styles.heading}>My Sessions</Text>
        <Text style={styles.subheading}>Manage your learning journey and upcoming meetings.</Text>
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
          <SWEmptyState
            icon="calendar-outline"
            title="No sessions here"
            subtitle={
              activeFilter === "All"
                ? "You don't have any sessions yet."
                : `No ${activeFilter.toLowerCase()} sessions to show.`
            }
            style={{ marginTop: 40 }}
          />
        ) : (
          filtered.map((s) => {
            const subj = subjectTint(s.subject);
            const isPending = s.status === "pending";
            const isCompleted = s.status === "completed";

            return (
              <View key={s.id} style={[styles.card, SW.shadow(subj.fg, 0.14)]}>
                <View style={styles.cardTop}>
                  <View style={[styles.subjectIcon, { backgroundColor: subj.bg }]}>
                    <Ionicons name={subj.icon as any} size={22} color={subj.fg} />
                  </View>
                  <SWStatusBadge status={s.status} />
                </View>

                <Text style={styles.subject}>{s.subject}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color={SW.color.onSurfaceVariant} />
                  <Text style={styles.metaText}>
                    {formatDateLabel(s.session_date)} · {formatTime(s.session_time)} ({s.duration} min)
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={14} color={SW.color.onSurfaceVariant} />
                  <Text style={styles.metaText}>
                    {isPending ? "Match Pending" : s.tutor_name}
                    {" · "}{s.format}
                    {s.frequency !== "One-time" ? ` · ${formatFrequency(s.frequency)}` : ""}
                  </Text>
                </View>

                {s.status === "upcoming" && s.format === "Virtual" && s.meeting_url && (
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() => Linking.openURL(s.meeting_url!)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="videocam-outline" size={16} color="#fff" />
                    <Text style={styles.joinBtnText}>Join Session</Text>
                  </TouchableOpacity>
                )}
                {isCompleted && (
                  <View style={styles.completedRow}>
                    <Ionicons name="checkmark-circle" size={18} color={SW.color.onMint} />
                    <Text style={styles.completedText}>Session completed</Text>
                  </View>
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
  safe: { flex: 1, backgroundColor: SW.color.surface },

  headingWrap: { paddingHorizontal: SW.space.margin, marginBottom: 16 },
  heading: { ...SW.type.headlineLg, color: SW.color.onSurface },
  subheading: { ...SW.type.bodyMd, color: SW.color.muted, marginTop: 4 },

  tabBar: {
    flexDirection: "row", marginHorizontal: SW.space.margin, marginBottom: 16,
    backgroundColor: SW.color.surfaceContainer, borderRadius: SW.radius.full, padding: 4, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: SW.radius.full, alignItems: "center" },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { ...SW.type.labelMd, color: SW.color.onSurfaceVariant },
  tabTextActive: { color: "#fff" },

  scroll: { paddingHorizontal: SW.space.margin, paddingBottom: 130, gap: 16 },

  card: {
    backgroundColor: SW.color.card,
    borderRadius: SW.radius.lg,
    padding: SW.space.cardPad,
  },
  cardTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12,
  },
  subjectIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  subject: { ...SW.type.headlineMd, color: SW.color.onSurface, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 6 },
  metaText: { ...SW.type.bodyMd, fontSize: 14, color: SW.color.onSurfaceVariant, flexShrink: 1 },

  joinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: PRIMARY, borderRadius: SW.radius.full,
    paddingVertical: 13, marginTop: 10,
    ...SW.shadow(PRIMARY, 0.25),
  },
  joinBtnText: { fontFamily: SW.font.bold, fontSize: 15, color: "#fff" },
  completedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  completedText: { ...SW.type.labelMd, fontSize: 13, color: SW.color.onMint },
});
