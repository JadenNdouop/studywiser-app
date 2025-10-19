import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";

type Session = {
  id: string;
  student: string;
  subject: string;
  start: string;
  length: string;
  meet: string;
  tutor: string;
  image?: string;
};

const DEMO_SESSIONS: Session[] = [
  {
    id: "s1",
    student: "Bradley Davis",
    subject: "Math — Fractions",
    start: "Today, 6:00 PM",
    length: "60 min",
    meet: "https://meet.google.com/abc-defg-hij",
    tutor: "Mihith Mandala",
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600",
  },
  {
    id: "s2",
    student: "Evelyn Park",
    subject: "Reading — Main Ideas",
    start: "Thu, 4:30 PM",
    length: "60 min",
    meet: "https://meet.google.com/xyz-1234-zzz",
    tutor: "TBD",
    image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=600",
  },
  {
    id: "s3",
    student: "Amina Khan",
    subject: "Pre-Algebra — Ratios",
    start: "Fri, 5:00 PM",
    length: "90 min",
    meet: "https://meet.google.com/rat-io-123",
    tutor: "M. Mandala",
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600",
  },
  {
    id: "s4",
    student: "Leo Carter",
    subject: "Writing — Structure",
    start: "Mon, 3:30 PM",
    length: "60 min",
    meet: "https://meet.google.com/wri-te-456",
    tutor: "K. Lin",
    image:
      "https://images.unsplash.com/photo-1520975922190-2c7ef5b03831?q=80&w=600",
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
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <View>
            <Text style={styles.brandTiny}>StudyWiser</Text>
            <Text style={styles.brandTitle}>Dashboard</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <IconButton onPress={() => {}} icon={<Ionicons name="notifications-outline" size={18} color={PRIMARY} />} />
          <IconButton onPress={() => {}} icon={<Ionicons name="add" size={20} color={PRIMARY} />} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <View style={{ position: "absolute", left: 12, top: 12 }}>
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
        <Stat label="Upcoming" value="4" icon={<Ionicons name="calendar-outline" size={16} color={PRIMARY} />} />
        <Stat label="Tutors" value="8" icon={<Ionicons name="people-outline" size={16} color={PRIMARY} />} />
        <Stat label="Requests" value="3" icon={<Ionicons name="chatbubble-ellipses-outline" size={16} color={PRIMARY} />} />
      </View>

      {/* Upcoming list */}
      <Card>
        <CardHeader>
          <Text style={styles.cardTitle}>Upcoming Sessions</Text>
          <Button label="View all" small onPress={() => {}} />
        </CardHeader>
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
          {filtered.map((s) => (
            <SessionRow key={s.id} s={s} />
          ))}
          {filtered.length === 0 && (
            <Text style={{ color: "#64748b", fontSize: 13 }}>No matches found.</Text>
          )}
        </View>
      </Card>
    </SafeAreaView>
  );
}

/* ---------- UI pieces (RN versions of your web primitives) ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
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
      }}
    >
      {children}
    </View>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {children}
    </View>
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
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "white",
        paddingHorizontal: small ? 10 : 14,
        paddingVertical: small ? 6 : 10,
      }}
    >
      <Text style={{ color: PRIMARY, fontWeight: "600", fontSize: small ? 12 : 14 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function IconButton({ icon, onPress }: { icon: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      {icon}
    </TouchableOpacity>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: "flex-start",
        backgroundColor: "#f8fafc",
      }}
    >
      <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 12 }}>{text}</Text>
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statHead}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={{ opacity: 0.8 }}>{icon}</View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SessionRow({ s }: { s: Session }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 16,
        padding: 12,
        backgroundColor: "white",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "rgba(1,74,173,0.10)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {s.image ? (
              <Image source={{ uri: s.image }} style={{ width: "100%", height: "100%" }} />
            ) : (
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={20} color={PRIMARY} />
            )}
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>
              {s.student}
            </Text>
            <Text style={{ fontSize: 12, color: "#475569" }}>Tutor: {s.tutor}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => Linking.openURL(s.meet)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#e2e8f0",
          }}
        >
          <Ionicons name="videocam-outline" size={18} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          marginTop: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="calendar-outline" size={14} color={PRIMARY} />
          <Text style={{ color: "#334155", fontSize: 12 }}>{s.start}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="time-outline" size={14} color={PRIMARY} />
          <Text style={{ color: "#334155", fontSize: 12 }}>{s.length}</Text>
        </View>
        <Badge text={s.subject} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "white", fontWeight: "800" },
  brandTiny: { fontSize: 12, color: "#94a3b8", letterSpacing: 0.6 },
  brandTitle: { fontSize: 20, fontWeight: "800", color: PRIMARY },

  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
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

  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    backgroundColor: "white",
    padding: 12,
  },
  statHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  statLabel: { color: "#64748b", fontSize: 12, fontWeight: "500" },
  statValue: { color: PRIMARY, fontSize: 20, fontWeight: "800" },

  cardTitle: { color: "#0f172a", fontWeight: "700", fontSize: 14 },
});
