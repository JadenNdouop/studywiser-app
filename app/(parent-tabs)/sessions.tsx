import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";
import { formatFrequency, formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

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

const STATUS_COLOR: Record<string, string> = {
  upcoming:  PRIMARY,
  pending:   "#f59e0b",
  completed: "#10b981",
  cancelled: "#94a3b8",
};
const STATUS_BG: Record<string, string> = {
  upcoming:  CARD_BG,
  pending:   "#fffbeb",
  completed: "#ecfdf5",
  cancelled: "#f1f5f9",
};

type FilterTab = "All" | "Upcoming" | "Completed";
const FILTER_TABS: FilterTab[] = ["All", "Upcoming", "Completed"];

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

export default function ParentSessionsScreen() {
  const { profile } = useAuth();
  const [sessions,     setSessions]     = useState<SessionRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
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
    setNotesModal({ sessionId, tutor_name, content: null, loading: true });
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sessions</Text>
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
            const color = avatarColor(s.id);
            const isPending = s.status === "pending";
            const tutorLabel = isPending ? "Match Pending" : s.tutor_name;
            const tutorInitials = isPending ? "?" : getInitials(s.tutor_name);

            return (
              <View key={s.id} style={styles.card}>
                {/* Time strip */}
                <View style={styles.cardTopRow}>
                  <View style={styles.timeChip}>
                    <Ionicons name="time-outline" size={12} color={PRIMARY} />
                    <Text style={styles.timeChipText}>
                      {formatDateLabel(s.session_date)} · {formatTime(s.session_time)} · {s.duration} min
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[s.status] }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[s.status] }]}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Body */}
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
                        {s.format}{s.frequency && s.frequency !== "One-time" ? `, ${formatFrequency(s.frequency)}` : ""}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tutorBadge}>
                    <View style={[styles.tutorAvatar, isPending && { backgroundColor: "#f1f5f9" }]}>
                      <Text style={[styles.tutorAvatarText, isPending && { color: "#94a3b8" }]}>{tutorInitials}</Text>
                    </View>
                    <Text style={styles.tutorName} numberOfLines={2}>{tutorLabel}</Text>
                  </View>
                </View>

                {/* Actions */}
                {(s.status === "upcoming" || s.status === "completed") && (
                  <>
                    <View style={styles.cardDivider} />
                    <View style={styles.cardActions}>
                      {s.status === "upcoming" && (
                        <>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(s.id)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          {s.format === "Virtual" && s.meeting_url && (
                            <TouchableOpacity
                              style={styles.joinBtn}
                              onPress={() => Linking.openURL(s.meeting_url!)}
                            >
                              <Ionicons name="videocam-outline" size={15} color="#fff" />
                              <Text style={styles.joinBtnText}>Join</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                      {s.status === "completed" && (
                        <TouchableOpacity
                          style={styles.notesBtn}
                          onPress={() => openNotes(s.id, s.tutor_name)}
                        >
                          <Ionicons name="document-text-outline" size={15} color={PRIMARY} />
                          <Text style={styles.notesBtnText}>View Notes</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Session Notes Modal ── */}
      <Modal
        visible={!!notesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNotesModal(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setNotesModal(null)} />
        <View style={styles.notesSheet}>
          <View style={styles.notesHandle} />
          <Text style={styles.notesTitle}>Session Notes</Text>
          <Text style={styles.notesSub}>From {notesModal?.tutor_name}</Text>
          {notesModal?.loading ? (
            <ActivityIndicator color={PRIMARY} style={{ marginVertical: 32 }} />
          ) : notesModal?.content ? (
            <ScrollView style={styles.notesScrollArea} showsVerticalScrollIndicator={false}>
              <Text style={styles.notesContent}>{notesModal.content}</Text>
            </ScrollView>
          ) : (
            <View style={styles.notesEmpty}>
              <Ionicons name="document-outline" size={44} color="#cbd5e1" />
              <Text style={styles.notesEmptyTitle}>No notes yet</Text>
              <Text style={styles.notesEmptyBody}>Your tutor hasn't added notes for this session yet.</Text>
            </View>
          )}
          <TouchableOpacity style={styles.notesDoneBtn} onPress={() => setNotesModal(null)}>
            <Text style={styles.notesDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },

  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 20, backgroundColor: CARD_BG },
  filterChipActive: { backgroundColor: PRIMARY },
  filterChipText: { color: "#64748b", fontSize: 13, fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },

  scroll: { paddingHorizontal: 20, paddingBottom: 110, gap: 12 },

  card: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 18, overflow: "hidden" },
  cardTopRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  timeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  timeChipText: { color: PRIMARY, fontSize: 11, fontWeight: "600" },
  statusBadge:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 10, fontWeight: "700" },

  cardBody: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  avatar:      { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText:  { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  studentName: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  subjectText: { fontSize: 12, color: "#475569", marginBottom: 4 },
  metaRow:     { flexDirection: "row", alignItems: "center", gap: 5 },
  formatDot:   { width: 6, height: 6, borderRadius: 3 },
  metaText:    { fontSize: 11, color: "#64748b" },

  sessionPrice: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  tutorBadge:   { alignItems: "center", gap: 4, flexShrink: 0 },
  tutorAvatar:  {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center",
  },
  tutorAvatarText: { color: PRIMARY, fontSize: 11, fontWeight: "700" },
  tutorName:    { fontSize: 10, color: "#64748b", fontWeight: "500", width: 80, textAlign: "center" },

  cardDivider:  { height: 1, backgroundColor: "#f1f5f9" },
  cardActions:  { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 8, justifyContent: "flex-end" },
  cancelBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff1f1" },
  cancelBtnText:{ color: "#ef4444", fontSize: 13, fontWeight: "600" },
  joinBtn:      { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: PRIMARY },
  joinBtnText:  { color: "#fff", fontSize: 13, fontWeight: "700" },

  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle:     { color: "#64748b", fontSize: 18, fontWeight: "700" },
  emptyBody:      { color: "#94a3b8", fontSize: 14, textAlign: "center", lineHeight: 20 },

  notesBtn:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  notesBtnText: { color: PRIMARY, fontSize: 13, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  notesSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 12, maxHeight: "70%",
  },
  notesHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 4 },
  notesTitle:    { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  notesSub:      { fontSize: 13, color: "#64748b", marginBottom: 4 },
  notesScrollArea: { flexGrow: 0, maxHeight: 260 },
  notesContent:  { fontSize: 14, color: "#1e293b", lineHeight: 22 },
  notesEmpty:    { alignItems: "center", paddingVertical: 32, gap: 10 },
  notesEmptyTitle: { color: "#64748b", fontSize: 16, fontWeight: "600" },
  notesEmptyBody:  { color: "#94a3b8", fontSize: 13, textAlign: "center", lineHeight: 18, maxWidth: 240 },
  notesDoneBtn:     { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  notesDoneBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
