import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";

const TERMS = [
  "By using StudyWiser, you agree to our Terms of Service and acknowledge our Privacy Policy. We collect information you provide when creating an account, booking sessions, or contacting support.",
  "Session data, including dates, subjects, and communications between tutors and students, may be stored to improve service quality and resolve disputes.",
  "We do not sell your personal information to third parties. Your data may be shared with trusted service providers who assist us in operating the platform.",
  "You may request deletion of your account and associated data at any time by contacting our support team or through the Settings menu.",
];

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last Update: 14/08/2024</Text>

        <Text style={styles.body}>
          StudyWiser is committed to protecting your privacy. This policy explains
          what information we collect, how we use it, and your rights regarding
          your personal data when you use our tutoring platform.
        </Text>

        <Text style={styles.body}>
          We collect information you provide when registering, booking sessions,
          or communicating through the app. This includes your name, email address,
          phone number, and any messages exchanged with tutors or students.
        </Text>

        <Text style={styles.body}>
          Your data helps us match you with the right tutors, process payments
          securely, and improve the quality of our services. We use
          industry-standard encryption to protect your information in transit
          and at rest.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Terms &amp; Conditions</Text>

        {TERMS.map((text, i) => (
          <View key={i} style={styles.termRow}>
            <Text style={styles.termNumber}>{i + 1}.</Text>
            <Text style={styles.termText}>{text}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  updated: { color: PRIMARY, fontSize: 12, marginBottom: 16 },
  body: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 20 },
  sectionTitle: { color: PRIMARY, fontSize: 16, fontWeight: "700", marginBottom: 16 },
  termRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  termNumber: { color: PRIMARY, fontWeight: "700", fontSize: 13, width: 18 },
  termText: { flex: 1, color: "#475569", fontSize: 13, lineHeight: 22 },
});
