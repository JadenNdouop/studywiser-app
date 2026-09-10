import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#014aad";

const INTRO = [
  "StudyWiser is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your personal data when you use our tutoring platform.",
  "We collect information you provide when registering, booking sessions, or communicating through the app. This includes your name, email address, phone number, and any messages exchanged with tutors or students.",
  "Your data helps us match you with the right tutors, process payments securely, and improve the quality of our services. We use industry-standard encryption to protect your information in transit and at rest.",
];

const TERMS = [
  "By using StudyWiser, you agree to our Terms of Service and acknowledge our Privacy Policy. We collect information you provide when creating an account, booking sessions, or contacting support.",
  "Session data, including dates, subjects, and communications between tutors and students, may be stored to improve service quality and resolve disputes.",
  "We do not sell your personal information to third parties. Your data may be shared with trusted service providers who assist us in operating the platform.",
  "You may request deletion of your account and associated data at any time by contacting our support team or through the Settings menu.",
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated 08/14/2024</Text>

        <View style={styles.card}>
          {INTRO.map((text, i) => (
            <Text key={i} style={[styles.body, i > 0 && styles.bodySpacing]}>
              {text}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Terms &amp; Conditions</Text>

        <View style={styles.card}>
          {TERMS.map((text, i) => (
            <View key={i}>
              <View style={styles.termRow}>
                <View style={styles.termBadge}>
                  <Text style={styles.termNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.termText}>{text}</Text>
              </View>
              {i < TERMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
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
    paddingBottom: 8,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eceef0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: { width: 44, height: 44 },
  headerTitle: { color: "#191c1e", fontSize: 22, fontWeight: "700" },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  updated: { color: "#717783", fontSize: 12, fontWeight: "600", marginBottom: 16 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#005da7",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 2,
  },
  body: { color: "#414751", fontSize: 13, lineHeight: 22 },
  bodySpacing: { marginTop: 14 },
  sectionTitle: { color: "#191c1e", fontSize: 18, fontWeight: "700", marginBottom: 14 },
  termRow: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  termBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  termNumber: { color: PRIMARY, fontWeight: "700", fontSize: 12 },
  termText: { flex: 1, color: "#414751", fontSize: 13, lineHeight: 21 },
  divider: { height: 1, backgroundColor: "#f1f5f9" },
});
