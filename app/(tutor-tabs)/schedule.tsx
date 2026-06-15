import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";
import { formatFrequency, formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";
const CAL_BG = "#dde3f8";

type Status = "upcoming" | "pending" | "completed";

type SessionRow = {
  id: string;
  session_date: string;   // "YYYY-MM-DD"
  session_time: string;
  duration: number;
  subject: string;
  status: Status;
  format: string;
  frequency: string;
  price: number | null;
  student_name: string;
  meeting_url: string | null;
};

/* ─── Week helpers ─── */
function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun, 1 = Mon …
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function buildWeek(monday: Date) {
  const labels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label,
      date: d.getDate(),
      fullDate: d.toISOString().split("T")[0],
    };
  });
}

function todayDateStr() {
  return new Date().toISOString().split("T")[0];
}

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

const STATUS_LABEL: Record<Status, string> = { upcoming: "Upcoming", pending: "Pending", completed: "Completed" };
const STATUS_COLOR: Record<Status, string> = { upcoming: PRIMARY, pending: "#f59e0b", completed: "#10b981" };
const STATUS_BG:    Record<Status, string> = { upcoming: CARD_BG,  pending: "#fffbeb", completed: "#ecfdf5" };

export default function TutorScheduleScreen() {
  const { profile } = useAuth();

  const todayStr = todayDateStr();
  const monday   = getMondayOfWeek(new Date());
  const WEEK     = buildWeek(monday);
  const todayDay = WEEK.find((d) => d.fullDate === todayStr)?.date ?? WEEK[0].date;

  const [selectedDate,   setSelectedDate]   = useState(todayDay);
  const [sessions,       setSessions]       = useState<SessionRow[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [linkSession,    setLinkSession]    = useState<SessionRow | null>(null);
  const [linkInput,      setLinkInput]      = useState("");
  const [notesSession,   setNotesSession]   = useState<SessionRow | null>(null);
  const [notesInput,     setNotesInput]     = useState("");
  const [notesLoading,   setNotesLoading]   = useState(false);

  // Month label for the strip header
  const monthLabel = monday.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  useFocusEffect(useCallback(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]));

  async function loadData() {
    if (sessions.length === 0) setLoading(true);
    try {
      const weekStart = WEEK[0].fullDate;
      const weekEnd   = WEEK[6].fullDate;

      const { data } = await supabase
        .from("sessions")
        .select(`
          id, session_date, session_time, duration, subject, status, format, frequency, price, meeting_url,
          student_profile:profiles!sessions_student_profile_id_fkey(full_name),
          managed_student:students!sessions_student_id_fkey(full_name)
        `)
        .eq("tutor_id", profile!.id)
        .gte("session_date", weekStart)
        .lte("session_date", weekEnd)
        .order("session_time", { ascending: true });

      const mapped: SessionRow[] = (data ?? []).map((s: any) => ({
        id:           s.id,
        session_date: s.session_date,
        session_time: s.session_time,
        duration:     s.duration,
        subject:      s.subject,
        status:       s.status as Status,
        format:       s.format ?? "Virtual",
        frequency:    s.frequency ?? "One-time",
        price:        s.price ?? null,
        student_name: s.student_profile?.full_name ?? s.managed_student?.full_name ?? "Student",
        meeting_url:  s.meeting_url ?? null,
      }));

      setSessions(mapped);
    } finally {
      setLoading(false);
    }
  }

  /* ─── Selected day's sessions ─── */
  const selectedFullDate = WEEK.find((d) => d.date === selectedDate)?.fullDate ?? "";
  const daySessions = sessions
    .filter((s) => s.session_date === selectedFullDate)
    .sort((a, b) => a.session_time.localeCompare(b.session_time));

  /* ─── Week-level stats ─── */
  const weekSessions = sessions;
  const weekHours    = weekSessions.reduce((sum, s) => sum + s.duration / 60, 0);
  const weekEarnings = weekSessions.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const pendingCount = sessions.filter((s) => s.status === "pending").length;

  const dayHours    = daySessions.reduce((sum, s) => sum + s.duration / 60, 0);
  const dayEarnings = daySessions.reduce((sum, s) => sum + (s.price ?? 0), 0);

  const dotsByDate = WEEK.reduce<Record<number, { total: number; pending: number }>>((acc, d) => {
    const ds = sessions.filter((s) => s.session_date === d.fullDate);
    acc[d.date] = { total: ds.length, pending: ds.filter((s) => s.status === "pending").length };
    return acc;
  }, {});

  /* ─── Actions (optimistic + Supabase update) ─── */
  async function acceptSession(id: string) {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: "upcoming" } : s));
    await supabase.from("sessions").update({ status: "upcoming" }).eq("id", id);
  }

  async function declineSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("sessions").update({ status: "cancelled" as any }).eq("id", id);
  }

  async function saveMeetingLink() {
    if (!linkSession) return;
    const url = linkInput.trim();
    if (!url) return;
    setSessions((prev) => prev.map((s) => s.id === linkSession.id ? { ...s, meeting_url: url } : s));
    setLinkSession(null);
    setLinkInput("");
    await supabase.from("sessions").update({ meeting_url: url }).eq("id", linkSession.id);
  }

  async function openNotes(s: SessionRow) {
    setNotesSession(s);
    setNotesInput("");
    setNotesLoading(true);
    const { data } = await supabase
      .from("session_notes")
      .select("content")
      .eq("session_id", s.id)
      .maybeSingle();
    setNotesInput(data?.content ?? "");
    setNotesLoading(false);
  }

  async function saveNotes() {
    if (!notesSession || !profile?.id) return;
    const content = notesInput.trim();
    await supabase.from("session_notes").upsert(
      { session_id: notesSession.id, tutor_id: profile.id, content, updated_at: new Date().toISOString() },
      { onConflict: "session_id" }
    );
    setNotesSession(null);
    setNotesInput("");
  }

  async function cancelSession(id: string) {
    Alert.alert("Cancel Session", "Are you sure you want to cancel this session?", [
      { text: "No" },
      {
        text: "Yes, Cancel", style: "destructive",
        onPress: async () => {
          setSessions((prev) => prev.filter((s) => s.id !== id));
          await supabase.from("sessions").update({ status: "cancelled" as any }).eq("id", id);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      {/* ── Weekly summary ── */}
      <View style={styles.weekSummary}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryTile, { backgroundColor: CARD_BG }]}>
            <Text style={styles.summaryTileValue}>{weekSessions.length}</Text>
            <Text style={styles.summaryTileLabel}>Sessions</Text>
          </View>
          <View style={[styles.summaryTile, { backgroundColor: CARD_BG }]}>
            <Text style={styles.summaryTileValue}>{weekHours % 1 === 0 ? weekHours : weekHours.toFixed(1)}</Text>
            <Text style={styles.summaryTileLabel}>Hours</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryTile, { backgroundColor: "#ecfdf5" }]}>
            <Text style={[styles.summaryTileValue, { color: "#10b981" }]}>${weekEarnings.toFixed(0)}</Text>
            <Text style={styles.summaryTileLabel}>This Week</Text>
          </View>
          <View style={[styles.summaryTile, { backgroundColor: pendingCount > 0 ? "#fffbeb" : CARD_BG }]}>
            <Text style={[styles.summaryTileValue, { color: pendingCount > 0 ? "#f59e0b" : PRIMARY }]}>{pendingCount}</Text>
            <Text style={styles.summaryTileLabel}>Pending</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.todayBtn} onPress={() => setSelectedDate(todayDay)}>
          <Ionicons name="today-outline" size={14} color={PRIMARY} />
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* ── Calendar strip ── */}
        <View style={styles.calSection}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStrip}
          >
            {WEEK.map((day) => {
              const isSelected = day.date === selectedDate;
              const isToday    = day.fullDate === todayStr;
              const info = dotsByDate[day.date] ?? { total: 0, pending: 0 };
              return (
                <TouchableOpacity
                  key={day.fullDate}
                  style={[styles.dayPill, isSelected && styles.dayPillActive]}
                  onPress={() => setSelectedDate(day.date)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>{day.date}</Text>
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>{day.label}</Text>
                  <View style={styles.dotsRow}>
                    {info.total > 0 && [...Array(Math.min(info.total, 3))].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          isSelected ? styles.dotActive : (i < info.pending ? styles.dotPending : styles.dotUpcoming),
                        ]}
                      />
                    ))}
                  </View>
                  {isToday && !isSelected && <View style={styles.todayUnderline} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Day header ── */}
        <View style={styles.dayHeader}>
          <View>
            <Text style={styles.dayTitle}>
              {selectedFullDate === todayStr ? "Today" : (() => {
                const d = new Date(selectedFullDate + "T00:00:00");
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              })()}
              {"  "}
              <Text style={styles.dayCount}>
                {daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
              </Text>
            </Text>
          </View>
          {daySessions.length > 0 && (
            <View style={styles.dayEarnings}>
              <Text style={styles.dayEarningsLabel}>{dayHours % 1 === 0 ? dayHours : dayHours.toFixed(1)} ·</Text>
              <Text style={styles.dayEarningsValue}>${dayEarnings.toFixed(0)}</Text>
            </View>
          )}
        </View>

        {/* ── Session list ── */}
        <View style={styles.listSection}>
          {daySessions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={44} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Nothing scheduled</Text>
              <Text style={styles.emptyBody}>No sessions for this day.</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {daySessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onAccept={() => acceptSession(s.id)}
                  onDecline={() => declineSession(s.id)}
                  onCancel={() => cancelSession(s.id)}
                  onSetLink={() => { setLinkSession(s); setLinkInput(s.meeting_url ?? ""); }}
                  onNotes={() => openNotes(s)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Session Notes Modal ── */}
      <Modal visible={!!notesSession} transparent animationType="slide" onRequestClose={() => setNotesSession(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setNotesSession(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Session Notes</Text>
          <Text style={styles.modalSub}>For {notesSession?.student_name} · {notesSession?.subject}</Text>
          {notesLoading ? (
            <ActivityIndicator color={PRIMARY} style={{ marginVertical: 24 }} />
          ) : (
            <TextInput
              style={[styles.modalInput, { height: 140, textAlignVertical: "top" }]}
              placeholder="Add notes about this session — topics covered, homework assigned, areas to focus on…"
              placeholderTextColor="#94a3b8"
              value={notesInput}
              onChangeText={setNotesInput}
              multiline
              autoCorrect={false}
            />
          )}
          <TouchableOpacity
            style={[styles.modalSaveBtn, (notesLoading || !notesInput.trim()) && { opacity: 0.4 }]}
            onPress={saveNotes}
            disabled={notesLoading || !notesInput.trim()}
          >
            <Text style={styles.modalSaveBtnText}>Save Notes</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Add Meet Link Modal ── */}
      <Modal visible={!!linkSession} transparent animationType="slide" onRequestClose={() => setLinkSession(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLinkSession(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Google Meet Link</Text>
          <Text style={styles.modalSub}>Paste the link for {linkSession?.student_name}'s session</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            placeholderTextColor="#94a3b8"
            value={linkInput}
            onChangeText={setLinkInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity
            style={[styles.modalSaveBtn, !linkInput.trim() && { opacity: 0.4 }]}
            onPress={saveMeetingLink}
            disabled={!linkInput.trim()}
          >
            <Text style={styles.modalSaveBtnText}>Save Link</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SessionCard({
  session: s,
  onAccept,
  onDecline,
  onCancel,
  onSetLink,
  onNotes,
}: {
  session: SessionRow;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onSetLink: () => void;
  onNotes: () => void;
}) {
  const color = avatarColor(s.id);

  return (
    <View style={card.card}>
      {/* Time + status strip */}
      <View style={card.topStrip}>
        <View style={card.timeChip}>
          <Ionicons name="time-outline" size={12} color={PRIMARY} />
          <Text style={card.timeChipText}>{formatTime(s.session_time)} · {s.duration} min</Text>
        </View>
        <View style={[card.statusBadge, { backgroundColor: STATUS_BG[s.status] }]}>
          <Text style={[card.statusText, { color: STATUS_COLOR[s.status] }]}>{STATUS_LABEL[s.status]}</Text>
        </View>
      </View>

      {/* Top */}
      <View style={card.top}>
        <View style={[card.avatar, { backgroundColor: color }]}>
          <Text style={card.avatarText}>{getInitials(s.student_name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={card.name}>{s.student_name}</Text>
          <Text style={card.subject}>{s.subject}</Text>
          <View style={card.metaRow}>
            <View style={[card.formatDot, { backgroundColor: s.format === "Virtual" ? "#3b82f6" : "#10b981" }]} />
            <Text style={card.metaText}>
              {s.format}{s.frequency && s.frequency !== "One-time" ? `, ${formatFrequency(s.frequency)}` : ""}
            </Text>
          </View>
        </View>
        {s.price != null && (
          <Text style={card.earningsText}>${s.price % 1 === 0 ? s.price.toFixed(0) : s.price.toFixed(2)}</Text>
        )}
      </View>

      {/* Divider + actions */}
      <View style={card.divider} />
      <View style={card.actions}>
        {s.status === "pending" ? (
          <>
            <TouchableOpacity style={card.declineBtn} onPress={onDecline}>
              <Ionicons name="close" size={15} color="#ef4444" />
              <Text style={card.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={card.acceptBtn} onPress={onAccept}>
              <Ionicons name="checkmark" size={15} color="#fff" />
              <Text style={card.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </>
        ) : s.status === "completed" ? (
          <TouchableOpacity style={card.notesBtn} onPress={onNotes}>
            <Ionicons name="document-text-outline" size={15} color={PRIMARY} />
            <Text style={card.notesBtnText}>Notes</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={card.cancelBtn} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={15} color="#ef4444" />
              <Text style={card.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            {s.format === "Virtual" && (
              s.meeting_url ? (
                <>
                  <TouchableOpacity style={card.linkBtn} onPress={onSetLink}>
                    <Ionicons name="pencil-outline" size={13} color={PRIMARY} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={card.joinBtn}
                    onPress={() => Linking.openURL(s.meeting_url!)}
                  >
                    <Ionicons name="videocam-outline" size={15} color="#fff" />
                    <Text style={card.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={card.addLinkBtn} onPress={onSetLink}>
                  <Ionicons name="link-outline" size={14} color={PRIMARY} />
                  <Text style={card.addLinkBtnText}>Add Meet Link</Text>
                </TouchableOpacity>
              )
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
  headerTitle: { color: "#0f172a", fontSize: 26, fontWeight: "800" },

  weekSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryTile: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    gap: 4,
  },
  summaryTileValue: { fontSize: 22, fontWeight: "800", color: PRIMARY },
  summaryTileLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  todayBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: CARD_BG, borderRadius: 14,
    paddingVertical: 12,
  },
  todayBtnText: { color: PRIMARY, fontSize: 14, fontWeight: "600" },

  calSection: {
    backgroundColor: CAL_BG,
    borderRadius: 24,
    marginHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  monthLabel: {
    color: "#1e293b", fontSize: 14, fontWeight: "700",
    textAlign: "center", marginBottom: 10,
  },
  weekStrip: { paddingHorizontal: 8, gap: 2 },
  dayPill: {
    alignItems: "center", paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: 14, minWidth: 48, gap: 2,
  },
  dayPillActive: { backgroundColor: PRIMARY },
  dayNum: { fontSize: 17, fontWeight: "800", color: "#1e293b" },
  dayNumActive: { color: "#fff" },
  dayLabel: { fontSize: 10, fontWeight: "600", color: "#64748b" },
  dayLabelActive: { color: "rgba(255,255,255,0.75)" },
  dotsRow: { flexDirection: "row", gap: 3, marginTop: 2, height: 6, alignItems: "center" },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotUpcoming: { backgroundColor: PRIMARY },
  dotPending: { backgroundColor: "#f59e0b" },
  dotActive: { backgroundColor: "rgba(255,255,255,0.8)" },
  todayUnderline: { width: 18, height: 2, borderRadius: 1, backgroundColor: PRIMARY, marginTop: 1 },

  dayHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 10,
  },
  dayTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  dayCount: { fontSize: 13, fontWeight: "400", color: "#94a3b8" },
  dayEarnings: { flexDirection: "row", alignItems: "center" },
  dayEarningsLabel: { fontSize: 13, color: "#94a3b8" },
  dayEarningsValue: { fontSize: 13, fontWeight: "700", color: "#10b981" },

  listSection: { paddingHorizontal: 16 },
  cardList: { gap: 14 },

  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { color: "#94a3b8", fontSize: 16, fontWeight: "600" },
  emptyBody: { color: "#cbd5e1", fontSize: 13, textAlign: "center", maxWidth: 220 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 12,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  modalSub: { fontSize: 13, color: "#64748b" },
  modalInput: {
    borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 14, color: "#0f172a", backgroundColor: "#f8fafc",
  },
  modalSaveBtn: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 14, alignItems: "center", marginTop: 4,
  },
  modalSaveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

const card = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  topStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  timeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: CARD_BG, borderRadius: 20,
    paddingHorizontal: 11, paddingVertical: 5,
  },
  timeChipText: { color: PRIMARY, fontSize: 12, fontWeight: "700" },
  top: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  name: { color: "#0f172a", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  subject: { color: "#475569", fontSize: 12, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "#64748b", fontSize: 12 },
  formatDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "700" },
  earningsText: { fontSize: 15, fontWeight: "800", color: "#10b981" },

  divider: { height: 1, backgroundColor: "#f1f5f9" },
  actions: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 8, justifyContent: "flex-end" },

  joinBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  joinBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  acceptBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#10b981", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  acceptBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  declineBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fff1f1", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#fecaca" },
  declineBtnText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fff1f1", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#fecaca" },
  cancelBtnText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  addLinkBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  addLinkBtnText: { color: PRIMARY, fontSize: 13, fontWeight: "600" },
  linkBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center" },
  notesBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  notesBtnText: { color: PRIMARY, fontSize: 13, fontWeight: "600" },
});
