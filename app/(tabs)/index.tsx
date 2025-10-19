// app/(tabs)/index.tsx
import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tutor = {
  id: string;
  name: string;
  subject: string;
  rate: string;
  image: string; // using remote placeholder images so you don't need assets
};

const TUTORS: Tutor[] = [
  {
    id: "1",
    name: "Mihith Mandala",
    subject: "Math • Online",
    rate: "$30/hr",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=600",
  },
  {
    id: "2",
    name: "Ava Chen",
    subject: "English • Hybrid",
    rate: "$28/hr",
    image:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=600",
  },
  {
    id: "3",
    name: "Noah Patel",
    subject: "Science • In-person",
    rate: "$32/hr",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600",
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Welcome back 👋</Text>
          <Text style={styles.title}>StudyWiser</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={{ color: "white", fontWeight: "700" }}>JW</Text>
        </View>
      </View>

      {/* Search */}
      <TextInput
        placeholder="Search subjects or tutors"
        placeholderTextColor="#6b7280"
        style={styles.search}
      />

      {/* Section title */}
      <Text style={styles.sectionTitle}>Popular tutors</Text>

      {/* Horizontal cards */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TUTORS}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => <TutorCard tutor={item} />}
      />

      {/* Nearest / upcoming (simple example) */}
      <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Upcoming</Text>
      <View style={styles.upcoming}>
        <Text style={{ fontWeight: "600" }}>Bradley – 1st Grade</Text>
        <Text style={{ color: "#475569" }}>Tue 5:00–6:00 PM • Google Meet</Text>
      </View>
    </SafeAreaView>
  );
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.card}>
      <Image source={{ uri: tutor.image }} style={styles.cardImage} />
      <View style={{ padding: 12 }}>
        <Text style={styles.cardName}>{tutor.name}</Text>
        <Text style={styles.cardMeta}>{tutor.subject}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tutor.rate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greet: { color: "#64748b", fontSize: 14 },
  title: { color: "#014aad", fontSize: 28, fontWeight: "800" },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#014aad",
    alignItems: "center",
    justifyContent: "center",
  },

  search: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8fafc",
  },

  sectionTitle: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  card: {
    width: 220,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 120 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  cardMeta: { color: "#475569", marginTop: 2, marginBottom: 8 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e6eeff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "#014aad", fontWeight: "700" },

  upcoming: {
    marginHorizontal: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
  },
});
