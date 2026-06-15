import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const PRIMARY = "#014aad";
const INPUT_BG = "#eef2ff";

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function formatDOB(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  const [role, setRole] = useState<"parent" | "tutor" | "student">("parent");

  async function handleOAuth(provider: "google" | "facebook") {
    try {
      const redirectTo = Linking.createURL("/");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error("No OAuth URL returned");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success") {
        const fragment = result.url.split("#")[1] ?? "";
        const params = new URLSearchParams(fragment);
        const accessToken  = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data: sessionData } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken,
          });
          if (sessionData.session?.user) {
            const { data: profile } = await supabase
              .from("profiles").select("role").eq("id", sessionData.session.user.id).single();
            if (profile?.role === "tutor")        router.replace("/(tutor-tabs)");
            else if (profile?.role === "student") router.replace("/(student-tabs)");
            else                                  router.replace("/(parent-tabs)");
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Sign up failed", err.message ?? "Something went wrong");
    }
  }

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
            placeholder="XXX-XXX-XXXX"
            placeholderTextColor="#aab4d4"
            value={mobile}
            onChangeText={(t) => setMobile(formatPhone(t))}
            keyboardType="number-pad"
          />

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#aab4d4"
            value={dob}
            onChangeText={(t) => setDob(formatDOB(t))}
            keyboardType="number-pad"
          />

          {/* Role selection */}
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === "parent" && styles.roleBtnActive]}
              onPress={() => setRole("parent")}
            >
              <Ionicons name="people-outline" size={20} color={role === "parent" ? "#fff" : PRIMARY} />
              <Text style={[styles.roleBtnText, role === "parent" && styles.roleBtnTextActive]}>
                Parent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === "student" && styles.roleBtnActive]}
              onPress={() => setRole("student")}
            >
              <Ionicons name="school-outline" size={20} color={role === "student" ? "#fff" : PRIMARY} />
              <Text style={[styles.roleBtnText, role === "student" && styles.roleBtnTextActive]}>
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === "tutor" && styles.roleBtnActive]}
              onPress={() => setRole("tutor")}
            >
              <Ionicons name="briefcase-outline" size={20} color={role === "tutor" ? "#fff" : PRIMARY} />
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
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.7}
              onPress={() => handleOAuth("google")}
            >
              <Ionicons name="logo-google" size={22} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.7}
              onPress={() => handleOAuth("facebook")}
            >
              <Ionicons name="logo-facebook" size={22} color={PRIMARY} />
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
