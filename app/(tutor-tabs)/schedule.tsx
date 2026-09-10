import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SWBottomSheet, SWHeader, avatarTint, getInitials as swInitials } from "../../components/sw";
import { SW, STATUS_COLORS } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { formatFrequency, formatTime } from "../../lib/format";
import { MOCK_SESSION_NOTES, MOCK_TUTOR_SESSIONS, USE_MOCK } from "../../constants/mockData";
import { supabase } from "../../lib/supabase";

const PRIMARY = SW.color.primary;
const CARD_BG = SW.color.lavenderSoft;

// Week-strip day pill sizing (used for centering the selected day)
const DAY_ITEM_W = 60;
const DAY_ITEM_GAP = 8;

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
const STATUS_COLOR: Record<Status, string> = {
  upcoming: STATUS_COLORS.upcoming.fg, pending: STATUS_COLORS.pending.fg, completed: STATUS_COLORS.completed.fg,
};
const STATUS_BG: Record<Status, string> = {
  upcoming: STATUS_COLORS.upcoming.bg, pending: STATUS_COLORS.pending.bg, completed: STATUS_COLORS.completed.bg,
};

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
  const [linkOpen,       setLinkOpen]       = useState(false);
  const [linkInput,      setLinkInput]      = useState("");
  const [notesSession,   setNotesSession]   = useState<SessionRow | null>(null);
  const [notesOpen,      setNotesOpen]      = useState(false);
  const [notesInput,     setNotesInput]     = useState("");
  const [notesLoading,   setNotesLoading]   = useState(false);

  // Month label for the strip header
  const monthLabel = monday.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Keep the selected day centered in the week strip
  const stripRef = useRef<ScrollView>(null);
  useEffect(() => {
    const idx = WEEK.findIndex((d) => d.date === selectedDate);
    if (idx < 0) return;
    const stride = DAY_ITEM_W + DAY_ITEM_GAP;
    const visibleW = Dimensions.get("window").width - SW.space.margin * 2;
    const target = idx * stride + DAY_ITEM_W / 2 - visibleW / 2;
    const t = setTimeout(
      () => stripRef.current?.scrollTo({ x: Math.max(0, target), animated: true }),
      60,
    );
    return () => clearTimeout(t);
  }, [selectedDate]);

  useFocusEffect(useCallback(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]));

  async function loadData() {
    if (sessions.length === 0) setLoading(true);
    if (USE_MOCK) { setSessions(MOCK_TUTOR_SESSIONS as any); setLoading(false); return; }
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
    if (!USE_MOCK) await supabase.from("sessions").update({ status: "upcoming" }).eq("id", id);
  }

  async function declineSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (!USE_MOCK) await supabase.from("sessions").update({ status: "cancelled" as any }).eq("id", id);
  }

  async function saveMeetingLink() {
    if (!linkSession) return;
    const url = linkInput.trim();
    if (!url) return;
    setSessions((prev) => prev.map((s) => s.id === linkSession.id ? { ...s, meeting_url: url } : s));
    setLinkOpen(false);
    setLinkInput("");
    if (!USE_MOCK) await supabase.from("sessions").update({ meeting_url: url }).eq("id", linkSession.id);
  }

  async function openNotes(s: SessionRow) {
    setNotesSession(s);
    setNotesOpen(true);
    setNotesInput("");
    setNotesLoading(true);
    if (USE_MOCK) {
      setNotesInput(MOCK_SESSION_NOTES[s.id] ?? "");
      setNotesLoading(false);
      return;
    }
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
    if (!USE_MOCK) {
      await supabase.from("session_notes").upsert(
        { session_id: notesSession.id, tutor_id: profile.id, content, updated_at: new Date().toISOString() },
        { onConflict: "session_id" }
      );
    }
    setNotesOpen(false);
    setNotesInput("");
  }

  async function cancelSession(id: string) {
    Alert.alert("Cancel Session", "Are you sure you want to cancel this session?", [
      { text: "No" },
      {
        text: "Yes, Cancel", style: "destructive",
        onPress: async () => {
          setSessions((prev) => prev.filter((s) => s.id !== id));
          if (!USE_MOCK) await supabase.from("sessions").update({ status: "cancelled" as any }).eq("id", id);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <SWHeader initials={swInitials(profile?.full_name)} />

        {/* ── Heading ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <Text style={styles.headerSub}>Manage your upcoming sessions</Text>
        </View>

        {/* ── Weekly summary ── */}
        <View style={styles.weekSummary}>
          <View style={[styles.summaryTile, styles.summaryTileBig, { backgroundColor: SW.color.lavender }]}>
            <Text style={[styles.summaryTileLabel, { color: PRIMARY }]}>Sessions</Text>
            <Text style={[styles.summaryTileValue, { color: PRIMARY }]}>{weekSessions.length}</Text>
            <Text style={[styles.summaryTileLabel, { color: PRIMARY }]}>This Week</Text>
          </View>
          <View style={{ flex: 1, gap: 10 }}>
            <View style={[styles.summaryTile, styles.summaryTileWide, { backgroundColor: SW.color.mint }]}>
              <View>
                <Text style={[styles.summaryTileLabel, { color: SW.color.onMint }]}>Time</Text>
                <Text style={[styles.summaryTileValue, { color: SW.color.onMint }]}>
                  {weekHours % 1 === 0 ? weekHours : weekHours.toFixed(1)}h
                </Text>
              </View>
              <Ionicons name="time-outline" size={20} color={SW.color.onMint} />
            </View>
            <View style={[styles.summaryTile, styles.summaryTileWide, { backgroundColor: SW.color.coral }]}>
              <View>
                <Text style={[styles.summaryTileLabel, { color: SW.color.onCoral }]}>
                  {pendingCount > 0 ? `Earned · ${pendingCount} pending` : "Earned"}
                </Text>
                <Text style={[styles.summaryTileValue, { color: SW.color.onCoral }]}>${weekEarnings.toFixed(0)}</Text>
              </View>
              <Ionicons name="card-outline" size={20} color={SW.color.onCoral} />
            </View>
          </View>
        </View>

        {/* ── Calendar strip ── */}
        <View style={styles.calSection}>
          <View style={styles.monthRow}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => setSelectedDate(todayDay)}>
              <Text style={styles.todayLink}>Today</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={stripRef}
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
                  onSetLink={() => { setLinkSession(s); setLinkOpen(true); setLinkInput(s.meeting_url ?? ""); }}
                  onNotes={() => openNotes(s)}
                  onMessage={() => router.push({ pathname: "/message-detail", params: { name: `${s.student_name}'s Parent` } })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Session Notes Sheet ── */}
      <SWBottomSheet visible={notesOpen} onClose={() => setNotesOpen(false)}>
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
      </SWBottomSheet>

      {/* ── Add Meet Link Sheet ── */}
      <SWBottomSheet visible={linkOpen} onClose={() => setLinkOpen(false)}>
        <Text style={styles.modalTitle}>Google Meet Link</Text>
        <Text style={styles.modalSub}>Paste the link for {linkSession?.student_name}&apos;s session</Text>
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
      </SWBottomSheet>
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
  onMessage,
}: {
  session: SessionRow;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onSetLink: () => void;
  onNotes: () => void;
  onMessage: () => void;
}) {
  const tint = avatarTint(s.id);

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
        <View style={[card.avatar, { backgroundColor: tint.bg }]}>
          <Text style={[card.avatarText, { color: tint.fg }]}>{getInitials(s.student_name)}</Text>
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
          <>
            <TouchableOpacity style={[card.notesBtn, card.leftPush]} onPress={onNotes}>
              <Ionicons name="document-text-outline" size={15} color={PRIMARY} />
              <Text style={card.notesBtnText}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={card.msgBtn} onPress={onMessage}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={PRIMARY} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Cancel (far left) → Edit → Message → Join */}
            <TouchableOpacity style={[card.cancelBtn, card.leftPush]} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={15} color="#ef4444" />
              <Text style={card.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            {s.format === "Virtual" && s.meeting_url && (
              <TouchableOpacity style={card.linkBtn} onPress={onSetLink}>
                <Ionicons name="pencil-outline" size={13} color={PRIMARY} />
              </TouchableOpacity>
            )}
            {s.format === "Virtual" && !s.meeting_url && (
              <TouchableOpacity style={card.addLinkBtn} onPress={onSetLink}>
                <Ionicons name="link-outline" size={14} color={PRIMARY} />
                <Text style={card.addLinkBtnText}>Add Meet Link</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={card.msgBtn} onPress={onMessage}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={PRIMARY} />
            </TouchableOpacity>
            {s.format === "Virtual" && s.meeting_url && (
              <TouchableOpacity
                style={card.joinBtn}
                onPress={() => Linking.openURL(s.meeting_url!)}
              >
                <Ionicons name="videocam-outline" size={15} color="#fff" />
                <Text style={card.joinBtnText}>Join</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SW.color.surface },
  header: { paddingHorizontal: SW.space.margin, paddingBottom: 16 },
  headerTitle: { ...SW.type.headlineLg, color: SW.color.onSurface },
  headerSub: { ...SW.type.bodyMd, color: SW.color.muted, marginTop: 4 },

  weekSummary: {
    flexDirection: "row",
    marginHorizontal: SW.space.margin,
    marginBottom: 18,
    gap: 10,
  },
  summaryTile: {
    borderRadius: SW.radius.lg,
    padding: 16,
  },
  summaryTileBig: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
    ...SW.shadow(SW.color.lavender, 0.5),
  },
  summaryTileWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  summaryTileValue: { fontFamily: SW.font.bold, fontSize: 24, lineHeight: 30 },
  summaryTileLabel: { ...SW.type.labelSm, fontFamily: SW.font.semibold },

  calSection: {
    marginHorizontal: SW.space.margin,
    marginBottom: 18,
  },
  monthRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12,
  },
  monthLabel: { ...SW.type.headlineMd, fontSize: 18, color: SW.color.onSurface },
  todayLink: { ...SW.type.labelMd, color: PRIMARY },
  weekStrip: { gap: DAY_ITEM_GAP, paddingVertical: 6 },
  dayPill: {
    alignItems: "center", paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: SW.radius.md, width: DAY_ITEM_W, gap: 2,
    backgroundColor: SW.color.card,
    borderWidth: 1,
    borderColor: SW.color.surfaceHigh,
  },
  dayPillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  dayLabel: { ...SW.type.labelSm, fontSize: 11, fontFamily: SW.font.semibold, color: SW.color.muted },
  dayLabelActive: { color: "rgba(255,255,255,0.85)" },
  dayNum: { fontFamily: SW.font.bold, fontSize: 20, color: SW.color.onSurface },
  dayNumActive: { color: "#fff" },
  dotsRow: { flexDirection: "row", gap: 3, marginTop: 2, height: 6, alignItems: "center" },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotUpcoming: { backgroundColor: SW.color.onMint },
  dotPending: { backgroundColor: SW.color.onCoral },
  dotActive: { backgroundColor: "rgba(255,255,255,0.9)" },
  todayUnderline: { width: 18, height: 2, borderRadius: 1, backgroundColor: PRIMARY, marginTop: 1 },

  dayHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SW.space.margin, marginBottom: 12,
  },
  dayTitle: { ...SW.type.headlineMd, color: SW.color.onSurface },
  dayCount: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted },
  dayEarnings: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: SW.color.mintSoft, borderRadius: SW.radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  dayEarningsLabel: { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.onMint },
  dayEarningsValue: { ...SW.type.labelSm, color: SW.color.onMint },

  listSection: { paddingHorizontal: SW.space.margin },
  cardList: { gap: 16 },

  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { ...SW.type.bodyLg, fontFamily: SW.font.bold, color: SW.color.muted },
  emptyBody: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.outline, textAlign: "center", maxWidth: 220 },

  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: SW.color.card, borderTopLeftRadius: SW.radius.xl, borderTopRightRadius: SW.radius.xl,
    padding: 24, gap: 12, overflow: "hidden",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: SW.color.outline, alignSelf: "center", marginBottom: 4 },
  modalTitle: { ...SW.type.headlineMd, color: SW.color.onSurface },
  modalSub: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted },
  modalInput: {
    borderRadius: SW.radius.md,
    paddingHorizontal: 16, paddingVertical: 14,
    minHeight: 52,
    fontFamily: SW.font.medium, fontSize: 15,
    color: SW.color.onSurface, backgroundColor: SW.color.inputBg,
    textAlignVertical: "center",
  },
  modalSaveBtn: {
    backgroundColor: PRIMARY, borderRadius: SW.radius.full,
    paddingVertical: 15, alignItems: "center", marginTop: 4,
  },
  modalSaveBtnText: { fontFamily: SW.font.bold, fontSize: 15, color: "#fff" },
});

const card = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: SW.color.card,
    borderRadius: SW.radius.lg,
    overflow: "hidden",
    ...SW.shadow(SW.color.outline, 0.22),
  },
  topStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  timeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: CARD_BG, borderRadius: SW.radius.full,
    paddingHorizontal: 11, paddingVertical: 5,
  },
  timeChipText: { ...SW.type.labelSm, color: PRIMARY },
  top: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: SW.font.bold, fontSize: 15 },
  name: { ...SW.type.bodyLg, fontFamily: SW.font.bold, fontSize: 16, color: SW.color.onSurface },
  subject: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.onSurfaceVariant, marginTop: 1, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted },
  formatDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SW.radius.full },
  statusText: { ...SW.type.labelSm, fontSize: 10, letterSpacing: 0.6 },
  earningsText: { fontFamily: SW.font.bold, fontSize: 16, color: SW.color.onMint },
  msgBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: SW.color.lavenderSoft,
    alignItems: "center", justifyContent: "center",
  },

  divider: { height: 1, backgroundColor: SW.color.surfaceLow },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 8, justifyContent: "flex-end" },
  leftPush: { marginRight: "auto" },

  joinBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: PRIMARY, borderRadius: SW.radius.full, paddingHorizontal: 18, paddingVertical: 10 },
  joinBtnText: { fontFamily: SW.font.bold, fontSize: 13, color: "#fff" },
  acceptBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: SW.color.success, borderRadius: SW.radius.full, paddingHorizontal: 18, paddingVertical: 10 },
  acceptBtnText: { fontFamily: SW.font.bold, fontSize: 13, color: "#fff" },
  declineBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "transparent", borderRadius: SW.radius.full, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1.5, borderColor: SW.color.outline },
  declineBtnText: { ...SW.type.labelMd, fontSize: 13, color: SW.color.onSurfaceVariant },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: SW.color.errorSoft, borderRadius: SW.radius.full, paddingHorizontal: 16, paddingVertical: 9 },
  cancelBtnText: { ...SW.type.labelMd, fontSize: 13, color: SW.color.error },
  addLinkBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: CARD_BG, borderRadius: SW.radius.full, paddingHorizontal: 16, paddingVertical: 9 },
  addLinkBtnText: { ...SW.type.labelMd, fontSize: 13, color: PRIMARY },
  linkBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center" },
  notesBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: CARD_BG, borderRadius: SW.radius.full, paddingHorizontal: 16, paddingVertical: 9 },
  notesBtnText: { ...SW.type.labelMd, fontSize: 13, color: PRIMARY },
});
