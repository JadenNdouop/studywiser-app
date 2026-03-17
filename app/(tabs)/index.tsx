import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

/* ─── Helpers ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const TODAY_DATE = "Tuesday, March 17";

/* ─── Demo sessions (ordered by date/time) ─── */
type Session = {
  id: string;
  student: string;
  subject: string;
  day: string;
  date: number;
  time: string;
  duration: number;
  isToday: boolean;
  avatarColor: string;
  initials: string;
};

const SESSIONS: Session[] = [
  { id: "s1", student: "Bradley Davis",  subject: "Math — Fractions",        day: "Today",  date: 17, time: "6:00 PM",  duration: 60, isToday: true,  avatarColor: "#c7d2fe", initials: "BD" },
  { id: "s2", student: "Evelyn Park",    subject: "Reading — Main Ideas",     day: "Wed",    date: 18, time: "4:30 PM",  duration: 60, isToday: false, avatarColor: "#fde8d8", initials: "EP" },
  { id: "s3", student: "Amina Khan",     subject: "Pre-Algebra — Ratios",     day: "Thu",    date: 19, time: "5:00 PM",  duration: 90, isToday: false, avatarColor: "#d1fae5", initials: "AK" },
  { id: "s4", student: "Isabella Cruz",  subject: "Reading — Comprehension",  day: "Thu",    date: 19, time: "6:30 PM",  duration: 60, isToday: false, avatarColor: "#fef9c3", initials: "IC" },
  { id: "s5", student: "Liam Johnson",   subject: "Geometry — Angles",        day: "Fri",    date: 20, time: "4:00 PM",  duration: 60, isToday: false, avatarColor: "#fee2e2", initials: "LJ" },
  { id: "s6", student: "Sophia Lee",     subject: "Science — Ecosystems",     day: "Fri",    date: 20, time: "5:00 PM",  duration: 60, isToday: false, avatarColor: "#ddd6fe", initials: "SL" },
];

const NEXT = SESSIONS[0];
const COMING_UP = SESSIONS.slice(1);

/* ─── Stats ─── */
const STATS = [
  { label: "This Week",  value: "6",  icon: "calendar-outline" },
  { label: "Pending",    value: "2",  icon: "time-outline" },
  { label: "Completed",  value: "48", icon: "checkmark-circle-outline" },
];

/* ─── Screen ─── */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, John 👋</Text>
            <Text style={styles.dateText}>{TODAY_DATE}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Next Session card ── */}
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>NEXT SESSION</Text>

          <View style={styles.nextTop}>
            <View style={[styles.nextAvatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.nextAvatarText}>{NEXT.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextName}>{NEXT.student}</Text>
              <Text style={styles.nextSubject}>{NEXT.subject}</Text>
            </View>
          </View>

          <View style={styles.nextMeta}>
            <View style={styles.nextMetaPill}>
              <Ionicons name="today-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.nextMetaText}>{NEXT.day}</Text>
            </View>
            <View style={styles.nextMetaPill}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.nextMetaText}>{NEXT.time}</Text>
            </View>
            <View style={styles.nextMetaPill}>
              <Ionicons name="hourglass-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.nextMetaText}>{NEXT.duration} min</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => Alert.alert("Join Session", "Opening meeting link…")}
            activeOpacity={0.85}
          >
            <Ionicons name="videocam-outline" size={18} color={PRIMARY} />
            <Text style={styles.joinBtnText}>Join Session</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statChip}>
              <Ionicons name={s.icon as any} size={18} color={PRIMARY} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Coming up ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Up</Text>

          <View style={styles.upcomingList}>
            {COMING_UP.map((s, i) => (
              <View key={s.id}>
                <View style={styles.upcomingRow}>
                  {/* Date pill */}
                  <View style={styles.datePill}>
                    <Text style={styles.datePillDay}>{s.day}</Text>
                    <Text style={styles.datePillNum}>{s.date}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingName}>{s.student}</Text>
                    <Text style={styles.upcomingSubject}>{s.subject}</Text>
                    <View style={styles.upcomingTimeLine}>
                      <Ionicons name="time-outline" size={12} color="#94a3b8" />
                      <Text style={styles.upcomingTime}>{s.time} · {s.duration} min</Text>
                    </View>
                  </View>

                  {/* Avatar */}
                  <View style={[styles.upcomingAvatar, { backgroundColor: s.avatarColor }]}>
                    <Text style={styles.upcomingAvatarText}>{s.initials}</Text>
                  </View>
                </View>

                {/* Divider (not after last item) */}
                {i < COMING_UP.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 110 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  dateText: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  headerRight: { flexDirection: "row", gap: 10, marginTop: 4 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center",
  },

  // Next session card
  nextCard: {
    backgroundColor: PRIMARY,
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
    gap: 14,
  },
  nextLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  nextTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  nextAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
  },
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
    gap: 8, backgroundColor: "#fff",
    borderRadius: 30, paddingVertical: 13,
  },
  joinBtnText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  statChip: {
    flex: 1, alignItems: "center",
    backgroundColor: CARD_BG, borderRadius: 18,
    paddingVertical: 14,
  },
  statValue: { color: PRIMARY, fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#64748b", fontSize: 11, marginTop: 2 },

  // Coming up
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 14 },
  upcomingList: {
    borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 20, overflow: "hidden",
  },
  upcomingRow: {
    flexDirection: "row", alignItems: "center",
    gap: 14, padding: 16,
  },
  datePill: {
    width: 46, alignItems: "center",
    backgroundColor: CARD_BG, borderRadius: 14,
    paddingVertical: 8,
  },
  datePillDay: { color: PRIMARY, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  datePillNum: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginTop: 2 },
  upcomingInfo: { flex: 1, gap: 2 },
  upcomingName: { color: "#0f172a", fontSize: 14, fontWeight: "700" },
  upcomingSubject: { color: "#64748b", fontSize: 12 },
  upcomingTimeLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  upcomingTime: { color: "#94a3b8", fontSize: 11 },
  upcomingAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  upcomingAvatarText: { color: PRIMARY, fontSize: 14, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },
});
