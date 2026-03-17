import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const CAL_BG = "#d1d9ff";
const CARD_BG = "#eef2ff";
const TODAY = 17; // Mar 17 2026 (Tuesday)

/* ─── Types ─── */
type Status = "upcoming" | "pending" | "completed";

type Session = {
  id: string;
  date: number;
  time: string;
  duration: number;
  name: string;
  initials: string;
  subject: string;
  status: Status;
  avatarColor: string;
};

/* ─── Demo data ─── */
const TUTOR_SESSIONS: Session[] = [
  { id: "t1",  date: 16, time: "3:30 PM", duration: 60,  name: "Leo Carter",     initials: "LC", subject: "Writing — Structure",       status: "upcoming",  avatarColor: "#c7d2fe" },
  { id: "t2",  date: 17, time: "6:00 PM", duration: 60,  name: "Bradley Davis",  initials: "BD", subject: "Math — Fractions",          status: "upcoming",  avatarColor: "#ddd6fe" },
  { id: "t3",  date: 17, time: "7:30 PM", duration: 60,  name: "Noah Kim",       initials: "NK", subject: "Algebra — Equations",       status: "pending",   avatarColor: "#fde8d8" },
  { id: "t4",  date: 18, time: "4:30 PM", duration: 60,  name: "Evelyn Park",    initials: "EP", subject: "Reading — Main Ideas",      status: "upcoming",  avatarColor: "#d1fae5" },
  { id: "t5",  date: 19, time: "5:00 PM", duration: 90,  name: "Amina Khan",     initials: "AK", subject: "Pre-Algebra — Ratios",      status: "upcoming",  avatarColor: "#fef9c3" },
  { id: "t6",  date: 19, time: "6:30 PM", duration: 60,  name: "Isabella Cruz",  initials: "IC", subject: "Reading — Comprehension",   status: "upcoming",  avatarColor: "#c7d2fe" },
  { id: "t7",  date: 20, time: "4:00 PM", duration: 60,  name: "Liam Johnson",   initials: "LJ", subject: "Geometry — Angles",         status: "upcoming",  avatarColor: "#fee2e2" },
  { id: "t8",  date: 20, time: "5:00 PM", duration: 60,  name: "Sophia Lee",     initials: "SL", subject: "Science — Ecosystems",      status: "upcoming",  avatarColor: "#d1fae5" },
  { id: "t9",  date: 21, time: "10:00 AM", duration: 90, name: "Olivia Brown",   initials: "OB", subject: "Writing — Essays",          status: "upcoming",  avatarColor: "#ddd6fe" },
  { id: "t10", date: 21, time: "1:00 PM",  duration: 60, name: "Ethan Smith",    initials: "ES", subject: "Math — Decimals",           status: "upcoming",  avatarColor: "#fde8d8" },
  { id: "t11", date: 22, time: "11:00 AM", duration: 60, name: "Mia Garcia",     initials: "MG", subject: "Science — Forces",          status: "pending",   avatarColor: "#fee2e2" },
  { id: "t12", date: 22, time: "2:00 PM",  duration: 60, name: "James Wilson",   initials: "JW", subject: "Pre-Algebra — Integers",    status: "upcoming",  avatarColor: "#c7d2fe" },
];

const STUDENT_SESSIONS: Session[] = [
  { id: "s1", date: 17, time: "3:00 PM", duration: 60, name: "Sarah Johnson, M.Ed.", initials: "SJ", subject: "Mathematics",      status: "upcoming", avatarColor: "#c7d2fe" },
  { id: "s2", date: 19, time: "5:30 PM", duration: 60, name: "Aisha Williams, B.Ed.", initials: "AW", subject: "English & Writing", status: "upcoming", avatarColor: "#fde8d8" },
  { id: "s3", date: 20, time: "3:00 PM", duration: 60, name: "Robert Kim, M.S.",      initials: "RK", subject: "Computer Science",  status: "pending",  avatarColor: "#d1fae5" },
  { id: "s4", date: 21, time: "2:00 PM", duration: 60, name: "Marcus Chen, Ph.D.",    initials: "MC", subject: "Science & Physics",  status: "pending",  avatarColor: "#ddd6fe" },
];

const WEEK = [
  { label: "MON", date: 16 },
  { label: "TUE", date: 17 },
  { label: "WED", date: 18 },
  { label: "THU", date: 19 },
  { label: "FRI", date: 20 },
  { label: "SAT", date: 21 },
  { label: "SUN", date: 22 },
];

/* ─── Status helpers ─── */
const STATUS_LABEL: Record<Status, string> = {
  upcoming:  "Upcoming",
  pending:   "Pending",
  completed: "Completed",
};
const STATUS_COLOR: Record<Status, string> = {
  upcoming:  PRIMARY,
  pending:   "#f59e0b",
  completed: "#10b981",
};
const STATUS_BG: Record<Status, string> = {
  upcoming:  "#eef2ff",
  pending:   "#fffbeb",
  completed: "#ecfdf5",
};

/* ─── Main screen ─── */
export default function ScheduleScreen() {
  const [role, setRole] = useState<"tutor" | "student">("tutor");
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [sessions, setSessions] = useState({ tutor: TUTOR_SESSIONS, student: STUDENT_SESSIONS });

  const allSessions = role === "tutor" ? sessions.tutor : sessions.student;
  const daySessions = allSessions
    .filter((s) => s.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcomingCount = allSessions.filter((s) => s.status === "upcoming").length;
  const pendingCount  = allSessions.filter((s) => s.status === "pending").length;

  /* dot count per day */
  const dotsByDate = WEEK.reduce<Record<number, number>>((acc, d) => {
    acc[d.date] = allSessions.filter((s) => s.date === d.date).length;
    return acc;
  }, {});

  /* actions */
  const acceptSession = (id: string) =>
    setSessions((prev) => ({
      ...prev,
      tutor: prev.tutor.map((s) => (s.id === id ? { ...s, status: "upcoming" } : s)),
    }));

  const declineSession = (id: string) =>
    setSessions((prev) => ({
      ...prev,
      tutor: prev.tutor.filter((s) => s.id !== id),
    }));

  const cancelSession = (id: string, roleKey: "tutor" | "student") =>
    Alert.alert("Cancel Session", "Are you sure you want to cancel this session?", [
      { text: "No" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () =>
          setSessions((prev) => ({
            ...prev,
            [roleKey]: prev[roleKey].filter((s) => s.id !== id),
          })),
      },
    ]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert("New Session", "Session booking coming soon!")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Role toggle ── */}
      <View style={styles.roleToggle}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "tutor" && styles.roleBtnActive]}
          onPress={() => setRole("tutor")}
        >
          <Ionicons
            name="school-outline"
            size={16}
            color={role === "tutor" ? "#fff" : "#64748b"}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.roleBtnText, role === "tutor" && styles.roleBtnTextActive]}>
            Tutor View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === "student" && styles.roleBtnActive]}
          onPress={() => setRole("student")}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={role === "student" ? "#fff" : "#64748b"}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.roleBtnText, role === "student" && styles.roleBtnTextActive]}>
            Student View
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Summary chips ── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryNum}>{upcomingCount}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
        <View style={[styles.summaryChip, styles.summaryChipOrange]}>
          <Text style={[styles.summaryNum, { color: "#f59e0b" }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <TouchableOpacity
          style={styles.todayChip}
          onPress={() => setSelectedDate(TODAY)}
        >
          <Ionicons name="today-outline" size={14} color={PRIMARY} style={{ marginRight: 4 }} />
          <Text style={styles.todayChipText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* ── Calendar section ── */}
        <View style={styles.calSection}>
          <Text style={styles.monthLabel}>March 2026</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStrip}
          >
            {WEEK.map((day) => {
              const isSelected = day.date === selectedDate;
              const isToday = day.date === TODAY;
              const dotCount = dotsByDate[day.date] ?? 0;
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[styles.dayPill, isSelected && styles.dayPillActive]}
                  onPress={() => setSelectedDate(day.date)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                    {day.date}
                  </Text>
                  <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                    {day.label}
                  </Text>
                  {/* session dots */}
                  {dotCount > 0 && (
                    <View style={styles.dotsRow}>
                      {[...Array(Math.min(dotCount, 3))].map((_, i) => (
                        <View
                          key={i}
                          style={[styles.dot, isSelected && styles.dotActive]}
                        />
                      ))}
                    </View>
                  )}
                  {isToday && !isSelected && <View style={styles.todayLine} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Session list ── */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>
            {selectedDate === TODAY ? "Today" : `Mar ${selectedDate}`}
            {"  "}
            <Text style={styles.listCount}>{daySessions.length} session{daySessions.length !== 1 ? "s" : ""}</Text>
          </Text>

          {daySessions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No sessions</Text>
              <Text style={styles.emptyBody}>
                {role === "tutor"
                  ? "You have no sessions scheduled for this day."
                  : "You have no sessions booked for this day."}
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {daySessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  role={role}
                  onAccept={() => acceptSession(s.id)}
                  onDecline={() => declineSession(s.id)}
                  onCancel={() => cancelSession(s.id, role)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Session card ─── */
function SessionCard({
  session: s,
  role,
  onAccept,
  onDecline,
  onCancel,
}: {
  session: Session;
  role: "tutor" | "student";
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={cardStyles.card}>
      {/* Top row */}
      <View style={cardStyles.top}>
        {/* Avatar */}
        <View style={[cardStyles.avatar, { backgroundColor: s.avatarColor }]}>
          <Text style={cardStyles.avatarText}>{s.initials}</Text>
        </View>

        {/* Info */}
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{s.name}</Text>
          <Text style={cardStyles.subject}>{s.subject}</Text>
          <View style={cardStyles.timeLine}>
            <Ionicons name="time-outline" size={13} color="#64748b" />
            <Text style={cardStyles.time}>{s.time}</Text>
            <Text style={cardStyles.duration}>· {s.duration} min</Text>
          </View>
        </View>

        {/* Status badge */}
        <View style={[cardStyles.badge, { backgroundColor: STATUS_BG[s.status] }]}>
          <Text style={[cardStyles.badgeText, { color: STATUS_COLOR[s.status] }]}>
            {STATUS_LABEL[s.status]}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={cardStyles.divider} />

      {/* Action row */}
      <View style={cardStyles.actions}>
        {s.status === "pending" && role === "tutor" ? (
          /* Tutor: accept or decline a request */
          <>
            <TouchableOpacity style={cardStyles.declineBtn} onPress={onDecline}>
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={cardStyles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cardStyles.acceptBtn} onPress={onAccept}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={cardStyles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </>
        ) : s.status === "pending" && role === "student" ? (
          /* Student: cancel a pending booking */
          <TouchableOpacity style={cardStyles.cancelBtn} onPress={onCancel}>
            <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
            <Text style={cardStyles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        ) : (
          /* Upcoming: join or cancel */
          <>
            <TouchableOpacity style={cardStyles.cancelBtn} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
              <Text style={cardStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={cardStyles.joinBtn}
              onPress={() => Alert.alert("Join Session", "Opening Google Meet link…")}
            >
              <Ionicons name="videocam-outline" size={16} color="#fff" />
              <Text style={cardStyles.joinBtnText}>Join</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: { color: "#0f172a", fontSize: 22, fontWeight: "800" },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },

  roleToggle: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: CARD_BG,
    borderRadius: 30,
    padding: 4,
    marginBottom: 14,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 26,
  },
  roleBtnActive: { backgroundColor: PRIMARY },
  roleBtnText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  roleBtnTextActive: { color: "#fff" },

  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  summaryChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  summaryChipOrange: { backgroundColor: "#fffbeb" },
  summaryNum: { color: PRIMARY, fontSize: 18, fontWeight: "800" },
  summaryLabel: { color: "#64748b", fontSize: 12 },
  todayChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  todayChipText: { color: PRIMARY, fontSize: 13, fontWeight: "600" },

  calSection: {
    backgroundColor: CAL_BG,
    borderRadius: 24,
    marginHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  monthLabel: {
    color: "#1e293b",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  weekStrip: { paddingHorizontal: 10, gap: 4 },
  dayPill: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 16,
    minWidth: 50,
    gap: 3,
  },
  dayPillActive: { backgroundColor: PRIMARY },
  dayNum: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  dayNumActive: { color: "#fff" },
  dayName: { fontSize: 10, fontWeight: "600", color: "#64748b" },
  dayNameActive: { color: "rgba(255,255,255,0.8)" },
  dotsRow: { flexDirection: "row", gap: 3, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: PRIMARY },
  dotActive: { backgroundColor: "rgba(255,255,255,0.8)" },
  todayLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: PRIMARY,
    marginTop: 2,
  },

  listSection: { paddingHorizontal: 16 },
  listTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
  listCount: { fontSize: 14, fontWeight: "400", color: "#94a3b8" },

  cardList: { gap: 12 },

  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: { color: "#94a3b8", fontSize: 16, fontWeight: "600" },
  emptyBody: { color: "#cbd5e1", fontSize: 13, textAlign: "center", maxWidth: 240 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    overflow: "hidden",
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  info: { flex: 1, gap: 3 },
  name: { color: PRIMARY, fontSize: 14, fontWeight: "700" },
  subject: { color: "#475569", fontSize: 13 },
  timeLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  time: { color: "#334155", fontSize: 12, fontWeight: "600" },
  duration: { color: "#94a3b8", fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 14 },

  actions: {
    flexDirection: "row",
    padding: 12,
    gap: 10,
    justifyContent: "flex-end",
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10b981",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff1f1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  declineBtnText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff1f1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelBtnText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
});
