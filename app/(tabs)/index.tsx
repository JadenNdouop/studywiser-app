import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";

// from app/(tabs)/index.tsx → ../../assets/images/swlogo.jpg
const swLogo = require("../../assets/images/swlogo.jpg");

type Session = {
  id: string;
  student: string;
  subject: string;
  start: string;
  length: string;
  meet: string;
  tutor: string;
};

const DEMO_SESSIONS: Session[] = [
  {
    id: "s1",
    student: "Bradley Davis",
    subject: "Math — Fractions",
    start: "Today, 6:00 PM",
    length: "60 min",
    meet: "https://meet.google.com/abc-defg-hij",
    tutor: "Mihith",
  },
  {
    id: "s2",
    student: "Evelyn Park",
    subject: "Reading — Main Ideas",
    start: "Thu, 4:30 PM",
    length: "60 min",
    meet: "https://meet.google.com/xyz-1234-zzz",
    tutor: "TBD",
  },
  {
    id: "s3",
    student: "Amina Khan",
    subject: "Pre-Algebra — Ratios",
    start: "Fri, 5:00 PM",
    length: "90 min",
    meet: "https://meet.google.com/rat-io-123",
    tutor: "M. Mandala",
  },
  {
    id: "s4",
    student: "Leo Carter",
    subject: "Writing — Structure",
    start: "Mon, 3:30 PM",
    length: "60 min",
    meet: "https://meet.google.com/wri-te-456",
    tutor: "K. Lin",
  },
  {
    id: "s5",
    student: "Sophia Lee",
    subject: "Science — Ecosystems",
    start: "Tue, 5:00 PM",
    length: "60 min",
    meet: "https://meet.google.com/sci-eco-001",
    tutor: "J. Patel",
  },
  {
    id: "s6",
    student: "Noah Kim",
    subject: "Algebra — Equations",
    start: "Wed, 7:00 PM",
    length: "60 min",
    meet: "https://meet.google.com/al-g-bra",
    tutor: "Mihith",
  },
  {
    id: "s7",
    student: "Isabella Cruz",
    subject: "Reading — Comprehension",
    start: "Thu, 6:30 PM",
    length: "60 min",
    meet: "https://meet.google.com/read-123",
    tutor: "TBD",
  },
  {
    id: "s8",
    student: "Liam Johnson",
    subject: "Geometry — Angles",
    start: "Fri, 4:00 PM",
    length: "60 min",
    meet: "https://meet.google.com/geo-456",
    tutor: "K. Lin",
  },
  {
    id: "s9",
    student: "Olivia Brown",
    subject: "Writing — Essays",
    start: "Sat, 10:00 AM",
    length: "90 min",
    meet: "https://meet.google.com/write-789",
    tutor: "J. Patel",
  },
  {
    id: "s10",
    student: "Ethan Smith",
    subject: "Math — Decimals",
    start: "Sat, 1:00 PM",
    length: "60 min",
    meet: "https://meet.google.com/math-101",
    tutor: "M. Mandala",
  },
  {
    id: "s11",
    student: "Mia Garcia",
    subject: "Science — Forces",
    start: "Sun, 11:00 AM",
    length: "60 min",
    meet: "https://meet.google.com/sci-202",
    tutor: "TBD",
  },
  {
    id: "s12",
    student: "James Wilson",
    subject: "Pre-Algebra — Integers",
    start: "Sun, 2:00 PM",
    length: "60 min",
    meet: "https://meet.google.com/pre-int",
    tutor: "Mihith",
  },
];

export default function HomeScreen() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_SESSIONS;
    return DEMO_SESSIONS.filter(
      (s) =>
        s.student.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.tutor.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Image
                source={swLogo}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.brandTiny}>StudyWiser</Text>
              <Text style={styles.brandTitle}>Dashboard</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <IconButton onPress={() => {}}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={PRIMARY}
              />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Ionicons name="add" size={20} color={PRIMARY} />
            </IconButton>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.searchIcon}>
              <Ionicons name="search" size={16} color="#94a3b8" />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search students, subjects, tutors…"
              placeholderTextColor="#94a3b8"
              style={[styles.input, { paddingLeft: 36 }]}
            />
          </View>
          <Button onPress={() => setQuery("")} label="Clear" />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat label="Upcoming" value="4" />
          <Stat label="Tutors" value="8" />
          <Stat label="Requests" value="3" />
        </View>

        {/* Upcoming list */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Upcoming Sessions</Text>
            <Button label="View all" small onPress={() => {}} />
          </View>

          <View style={styles.cardBody}>
            {filtered.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
            {filtered.length === 0 && (
              <Text style={styles.emptyText}>No matches found.</Text>
            )}
          </View>
        </View>

        {/* TEMP: make sure there's enough content to scroll */}
        <View style={{ height: 600 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Small helpers ---------- */

function IconButton({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iconButton}>
      {children}
    </TouchableOpacity>
  );
}

function Button({
  label,
  onPress,
  small,
}: {
  label: string;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, small && styles.buttonSmall]}
    >
      <Text style={[styles.buttonText, small && styles.buttonTextSmall]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SessionRow({ s }: { s: Session }) {
  const firstName = s.student.split(" ")[0] || "";
  const initial = firstName[0]?.toUpperCase() ?? "?";

  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionTop}>
        <View style={styles.sessionLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text numberOfLines={1} style={styles.sessionStudent}>
              {s.student}
            </Text>
            <Text style={styles.sessionTutor}>Tutor: {s.tutor}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => Linking.openURL(s.meet)}
          style={styles.videoButton}
        >
          <Ionicons name="videocam-outline" size={18} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.sessionBottom}>
        <View style={styles.sessionMetaItem}>
          <Ionicons name="calendar-outline" size={14} color={PRIMARY} />
          <Text style={styles.sessionMetaText}>{s.start}</Text>
        </View>
        <View style={styles.sessionMetaItem}>
          <Ionicons name="time-outline" size={14} color={PRIMARY} />
          <Text style={styles.sessionMetaText}>{s.length}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{s.subject}</Text>
        </View>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  brandTiny: { fontSize: 12, color: "#94a3b8", letterSpacing: 0.6 },
  brandTitle: { fontSize: 20, fontWeight: "800", color: PRIMARY },

  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: 12,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0f172a",
  },

  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    backgroundColor: "white",
    padding: 12,
  },
  statLabel: { color: "#64748b", fontSize: 12, marginBottom: 4 },
  statValue: { color: PRIMARY, fontSize: 18, fontWeight: "700" },

  card: {
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginHorizontal: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  cardTitle: { color: "#0f172a", fontWeight: "700", fontSize: 14 },
  emptyText: { color: "#64748b", fontSize: 13 },

  button: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  buttonText: {
    color: PRIMARY,
    fontWeight: "600",
    fontSize: 14,
  },
  buttonTextSmall: {
    fontSize: 12,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  sessionRow: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "white",
  },
  sessionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(1,74,173,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: 18,
  },
  sessionStudent: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  sessionTutor: {
    fontSize: 12,
    color: "#475569",
  },
  videoButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  sessionBottom: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  sessionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionMetaText: {
    color: "#334155",
    fontSize: 12,
  },
  badge: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
  },
  badgeText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 12,
  },
});

