import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SWBottomSheet, SWButton, SWEmptyState, SWHeader, SWStatusBadge, getInitials, subjectTint } from "../../components/sw";
import { MOCK_PARENT_SESSIONS, MOCK_SESSION_NOTES, USE_MOCK } from "../../constants/mockData";
import { SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { formatFrequency, formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

type Status = "upcoming" | "pending" | "completed" | "cancelled";

type SessionRow = {
  id: string;
  student_name: string;
  subject: string;
  tutor_name: string;
  session_date: string;
  session_time: string;
  duration: number;
  format: string;
  frequency: string;
  price: number | null;
  status: Status;
  meeting_url: string | null;
};

type FilterTab = "All" | "Upcoming" | "Completed";
const FILTER_TABS: FilterTab[] = ["All", "Upcoming", "Completed"];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ParentSessionsScreen() {
  const { profile } = useAuth();
  const [sessions,     setSessions]     = useState<SessionRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [notesOpen,    setNotesOpen]    = useState(false);
  const [notesModal,   setNotesModal]   = useState<{
    sessionId: string;
    tutor_name: string;
    content: string | null;
    loading: boolean;
  } | null>(null);

  useFocusEffect(useCallback(() => {
    loadSessions();
  }, [profile?.id]));

  async function loadSessions() {
    if (USE_MOCK) { setSessions(MOCK_PARENT_SESSIONS as any); return; }
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("sessions")
      .select(`
        id, subject, session_date, session_time, duration, format, frequency, price, status, meeting_url,
        student_profile:profiles!sessions_student_profile_id_fkey(full_name),
        managed_student:students!sessions_student_id_fkey(full_name),
        tutor:profiles!sessions_tutor_id_fkey(full_name)
      `)
      .eq("parent_id", userId)
      .order("session_date", { ascending: false })
      .order("session_time", { ascending: false });

    setSessions(
      (data ?? []).map((s: any) => ({
        id:           s.id,
        student_name: s.student_profile?.full_name ?? s.managed_student?.full_name ?? "Student",
        subject:      s.subject,
        tutor_name:   s.tutor?.full_name ?? "Match Pending",
        session_date: s.session_date,
        session_time: s.session_time,
        duration:     s.duration,
        format:       s.format ?? "Virtual",
        frequency:    s.frequency ?? "One-time",
        price:        s.price ?? null,
        status:       s.status as Status,
        meeting_url:  s.meeting_url ?? null,
      }))
    );
  }

  async function openNotes(sessionId: string, tutor_name: string) {
    setNotesOpen(true);
    setNotesModal({ sessionId, tutor_name, content: null, loading: true });
    if (USE_MOCK) {
      setNotesModal({ sessionId, tutor_name, content: MOCK_SESSION_NOTES[sessionId] ?? null, loading: false });
      return;
    }
    const { data } = await supabase
      .from("session_notes")
      .select("content")
      .eq("session_id", sessionId)
      .maybeSingle();
    setNotesModal({ sessionId, tutor_name, content: data?.content ?? null, loading: false });
  }

  async function handleCancel(id: string) {
    Alert.alert("Cancel Session", "Are you sure you want to cancel this session?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel", style: "destructive",
        onPress: async () => {
          setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: "cancelled" } : s));
          await supabase.from("sessions").update({ status: "cancelled" as any }).eq("id", id);
        },
      },
    ]);
  }

  const filtered = sessions.filter((s) => {
    if (activeFilter === "All") return s.status !== "cancelled";
    return s.status === activeFilter.toLowerCase();
  });

  const upcomingCount = sessions.filter((s) => s.status === "upcoming").length;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <SWHeader initials={getInitials(profile?.full_name)} />

      <View style={styles.headingWrap}>
        <Text style={styles.heading}>My Sessions</Text>
        <Text style={styles.subheading}>
          {upcomingCount > 0
            ? `You have ${upcomingCount} learning adventure${upcomingCount !== 1 ? "s" : ""} scheduled!`
            : "Manage your learning journey and upcoming meetings."}
        </Text>
      </View>

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, activeFilter === tab && styles.filterChipActive]}
            onPress={() => setActiveFilter(tab)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, activeFilter === tab && styles.filterChipTextActive]}>
              {tab}
            </Text>
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
            const tint = subjectTint(s.subject);
            const isPending = s.status === "pending";
            const tutorLabel = isPending ? "Match Pending" : s.tutor_name;

            return (
              <View key={s.id} style={[styles.card, SW.shadow(tint.fg, 0.14)]}>
                <View style={styles.cardTopRow}>
                  <SWStatusBadge status={s.status} />
                  <View style={[styles.subjectIcon, { backgroundColor: tint.bg }]}>
                    <Ionicons name={tint.icon as any} size={18} color={tint.fg} />
                  </View>
                </View>

                <Text style={styles.cardTitle}>{s.subject}</Text>

                <View style={styles.withRow}>
                  <Text style={styles.withLabel}>with</Text>
                  <View style={styles.personChip}>
                    <Text style={styles.personChipText}>{tutorLabel}</Text>
                  </View>
                  <Text style={styles.withLabel}>for</Text>
                  <View style={styles.personChip}>
                    <Text style={styles.personChipText}>{s.student_name.split(" ")[0]}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={15} color={SW.color.onSurfaceVariant} />
                  <Text style={styles.metaText}>{formatDateLabel(s.session_date)}</Text>
                  <Ionicons name="time-outline" size={15} color={SW.color.onSurfaceVariant} style={{ marginLeft: 10 }} />
                  <Text style={styles.metaText}>{formatTime(s.session_time)} · {s.duration} min</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons
                    name={s.format === "Virtual" ? "videocam-outline" : "location-outline"}
                    size={15}
                    color={SW.color.onSurfaceVariant}
                  />
                  <Text style={styles.metaText}>
                    {s.format}
                    {s.frequency && s.frequency !== "One-time" ? ` · ${formatFrequency(s.frequency)}` : ""}
                  </Text>
                </View>

                {(s.status === "upcoming" || s.status === "completed") && (
                  <View style={styles.actionRow}>
                    {s.status === "upcoming" && (
                      <>
                        {s.format === "Virtual" && s.meeting_url ? (
                          <SWButton
                            label="Join Session"
                            icon="videocam-outline"
                            onPress={() => Linking.openURL(s.meeting_url!)}
                            style={{ flex: 1, paddingVertical: 13 }}
                            textStyle={{ fontSize: 15 }}
                          />
                        ) : (
                          <View style={{ flex: 1 }} />
                        )}
                        {!isPending && (
                          <TouchableOpacity
                            style={styles.msgCircle}
                            onPress={() => router.push({ pathname: "/message-detail", params: { name: s.tutor_name } })}
                          >
                            <Ionicons name="chatbubble-ellipses-outline" size={19} color={SW.color.primary} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.cancelCircle} onPress={() => handleCancel(s.id)}>
                          <Ionicons name="close" size={20} color={SW.color.onSurfaceVariant} />
                        </TouchableOpacity>
                      </>
                    )}
                    {s.status === "completed" && (
                      <>
                        <SWButton
                          label="View Notes"
                          variant="outline"
                          onPress={() => openNotes(s.id, s.tutor_name)}
                          style={{ flex: 1, paddingVertical: 12 }}
                          textStyle={{ fontSize: 15 }}
                        />
                        <TouchableOpacity
                          style={styles.msgCircle}
                          onPress={() => router.push({ pathname: "/message-detail", params: { name: s.tutor_name } })}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={19} color={SW.color.primary} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Session Notes Sheet ── */}
      <SWBottomSheet visible={notesOpen} onClose={() => setNotesOpen(false)}>
        <Text style={styles.notesTitle}>Session Notes</Text>
        <Text style={styles.notesSub}>From {notesModal?.tutor_name}</Text>
        {notesModal?.loading ? (
          <ActivityIndicator color={SW.color.primary} style={{ marginVertical: 32 }} />
        ) : notesModal?.content ? (
          <ScrollView style={styles.notesScrollArea} showsVerticalScrollIndicator={false}>
            <Text style={styles.notesContent}>{notesModal.content}</Text>
          </ScrollView>
        ) : (
          <SWEmptyState
            icon="document-outline"
            title="No notes yet"
            subtitle="Your tutor hasn't added notes for this session yet."
          />
        )}
        <SWButton label="Done" onPress={() => setNotesOpen(false)} style={{ marginTop: 8 }} />
      </SWBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SW.color.surface },

  headingWrap: { paddingHorizontal: SW.space.margin, marginBottom: 16 },
  heading: { ...SW.type.headlineLg, color: SW.color.onSurface },
  subheading: { ...SW.type.bodyMd, color: SW.color.muted, marginTop: 4 },

  filterRow: {
    flexDirection: "row",
    marginHorizontal: SW.space.margin,
    marginBottom: 16,
    backgroundColor: SW.color.surfaceContainer,
    borderRadius: SW.radius.full,
    padding: 4,
    gap: 4,
  },
  filterChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: SW.radius.full,
  },
  filterChipActive: { backgroundColor: SW.color.mint },
  filterChipText: { ...SW.type.labelMd, color: SW.color.onSurfaceVariant },
  filterChipTextActive: { color: SW.color.onMint },

  scroll: { paddingHorizontal: SW.space.margin, paddingBottom: 130, gap: 16 },

  card: {
    backgroundColor: SW.color.card,
    borderRadius: SW.radius.lg,
    padding: SW.space.cardPad,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subjectIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { ...SW.type.headlineMd, color: SW.color.onSurface, marginBottom: 8 },

  withRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  withLabel: { ...SW.type.bodyMd, fontSize: 14, color: SW.color.muted },
  personChip: {
    backgroundColor: SW.color.surfaceLow,
    borderRadius: SW.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  personChipText: { ...SW.type.labelMd, color: SW.color.onSurface },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  metaText: { ...SW.type.bodyMd, fontSize: 14, color: SW.color.onSurfaceVariant },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  cancelCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: SW.color.outline,
    alignItems: "center", justifyContent: "center",
  },
  msgCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: SW.color.primarySoft,
    backgroundColor: SW.color.lavenderSoft,
    alignItems: "center", justifyContent: "center",
  },

  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  notesSheet: {
    backgroundColor: SW.color.card,
    borderTopLeftRadius: SW.radius.xl,
    borderTopRightRadius: SW.radius.xl,
    padding: 24, gap: 12, maxHeight: "70%",
    overflow: "hidden",
  },
  notesHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: SW.color.outline, alignSelf: "center", marginBottom: 4 },
  notesTitle: { ...SW.type.headlineMd, color: SW.color.onSurface },
  notesSub: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, marginBottom: 4 },
  notesScrollArea: { flexGrow: 0, maxHeight: 260 },
  notesContent: { ...SW.type.bodyMd, color: SW.color.onSurfaceVariant },
});
