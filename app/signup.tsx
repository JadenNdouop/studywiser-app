import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const INPUT_BG = "#eef2ff";

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [role, setRole] = useState<"parent" | "tutor">("parent");

  function handleNext() {
    if (!fullName || !email) {
      Alert.alert("Missing fields", "Please enter your name and email.");
      return;
    }
    router.push({
      pathname: "/set-password",
      params: { fullName, email, mobile, dob, role },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Account</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Jane Smith"
            placeholderTextColor="#aab4d4"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@example.com"
            placeholderTextColor="#aab4d4"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Mobile Number */}
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 000-0000"
            placeholderTextColor="#aab4d4"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="DD / MM / YYYY"
            placeholderTextColor="#aab4d4"
            value={dob}
            onChangeText={setDob}
            keyboardType="numbers-and-punctuation"
          />

          {/* Role selection */}
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === "parent" && styles.roleBtnActive]}
              onPress={() => setRole("parent")}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color={role === "parent" ? "#fff" : PRIMARY}
              />
              <Text style={[styles.roleBtnText, role === "parent" && styles.roleBtnTextActive]}>
                Parent / Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === "tutor" && styles.roleBtnActive]}
              onPress={() => setRole("tutor")}
            >
              <Ionicons
                name="school-outline"
                size={20}
                color={role === "tutor" ? "#fff" : PRIMARY}
              />
              <Text style={[styles.roleBtnText, role === "tutor" && styles.roleBtnTextActive]}>
                Tutor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to{" "}
            <Text style={styles.termsLink}>Terms of Use</Text>
            {" "}and{" "}
            <Text style={styles.termsLink}>Privacy Policy.</Text>
          </Text>

          {/* Next button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Next</Text>
          </TouchableOpacity>

          {/* Social divider */}
          <Text style={styles.orText}>or sign up with</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-google" size={22} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-facebook" size={22} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="finger-print" size={22} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Log in link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={styles.switchLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { paddingHorizontal: 28, paddingBottom: 40 },
  label: { color: "#1e293b", fontSize: 14, fontWeight: "500", marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 16,
  },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  roleBtnActive: { backgroundColor: PRIMARY },
  roleBtnText: { color: PRIMARY, fontSize: 14, fontWeight: "600" },
  roleBtnTextActive: { color: "#fff" },
  terms: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
    marginTop: 8,
  },
  termsLink: { color: PRIMARY, fontWeight: "500" },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  orText: { textAlign: "center", color: "#94a3b8", fontSize: 13, marginBottom: 16 },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 28 },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  switchRow: { flexDirection: "row", justifyContent: "center" },
  switchText: { color: "#64748b", fontSize: 13 },
  switchLink: { color: PRIMARY, fontSize: 13, fontWeight: "600" },
});
