import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#014aad";

type Role = "parent" | "tutor" | "student";

type RoleOption = {
  role: Role;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  badgeBg: string;
};

// Accent palette lifted from the design (primary blue / secondary mint / tertiary amber)
const ROLES: RoleOption[] = [
  {
    role: "parent",
    title: "Parent",
    subtitle: "Supporting my child's learning journey",
    icon: "people",
    accent: "#014aad",
    badgeBg: "#e2ecfb",
  },
  {
    role: "tutor",
    title: "Tutor",
    subtitle: "Ready to inspire and share knowledge",
    icon: "school",
    accent: "#006b5b",
    badgeBg: "#d3f5ec",
  },
  {
    role: "student",
    title: "Student",
    subtitle: "Exploring new subjects and skills",
    icon: "book",
    accent: "#8b4c11",
    badgeBg: "#fbe6d3",
  },
];

export default function RoleSelectScreen() {
  const insets = useSafeAreaInsets();
  function choose(role: Role) {
    router.push({ pathname: "/signup", params: { role } });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/welcome");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Branding */}
        <Text style={styles.brand}>StudyWiser</Text>
        <Text style={styles.tagline}>
          Welcome to the future of learning.{"\n"}Choose your role to get started.
        </Text>

        {/* Role cards */}
        <View style={styles.cards}>
          {ROLES.map((opt) => (
            <TouchableOpacity
              key={opt.role}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => choose(opt.role)}
            >
              <View style={[styles.badge, { backgroundColor: opt.badgeBg }]}>
                <Ionicons name={opt.icon} size={34} color={opt.accent} />
              </View>
              <Text style={styles.cardTitle}>{opt.title}</Text>
              <Text style={styles.cardSubtitle}>{opt.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Log in link */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.switchLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f9fb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  brand: {
    textAlign: "center",
    color: PRIMARY,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 8,
  },
  tagline: {
    textAlign: "center",
    color: "#414751",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  cards: { gap: 16, marginBottom: 28 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#0b3a7a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#191c1e",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#414751",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  switchRow: { flexDirection: "row", justifyContent: "center" },
  switchText: { color: "#64748b", fontSize: 14 },
  switchLink: { color: PRIMARY, fontSize: 14, fontWeight: "700" },
});
