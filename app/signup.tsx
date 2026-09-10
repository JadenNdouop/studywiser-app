import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleButton } from "../components/GoogleButton";
import { formatDOBInput } from "../lib/dob";
import { formatPhoneInput } from "../lib/phone";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const PRIMARY = "#014aad";
const FIELD_BG = "#e6e8ea";

type Role = "parent" | "tutor" | "student";

const ROLE_OPTIONS: {
  role: Role;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeBg: string;
  accent: string;
  tint: string;
}[] = [
  { role: "parent",  label: "Parent",  icon: "people",    badgeBg: "#ffdcc4", accent: "#8b4c11", tint: "#fff4ec" },
  { role: "student", label: "Student", icon: "school",    badgeBg: "#96f4dd", accent: "#006b5b", tint: "#e6fbf5" },
  { role: "tutor",   label: "Tutor",   icon: "briefcase", badgeBg: "#d4e3ff", accent: "#014aad", tint: "#eaf1ff" },
];

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");

  const params = useLocalSearchParams<{ role?: string }>();
  const initialRole =
    params.role === "tutor" || params.role === "student" ? params.role : "parent";
  const [role, setRole] = useState<Role>(initialRole);

  async function handleOAuth(provider: "google") {
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
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={26} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
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
            placeholderTextColor="#9aa0ab"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="hello@studio.com"
            placeholderTextColor="#9aa0ab"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Mobile Number */}
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="(555) 000-0000"
            placeholderTextColor="#9aa0ab"
            value={mobile}
            onChangeText={(t) => setMobile(formatPhoneInput(t))}
            keyboardType="number-pad"
          />

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="MM / DD / YYYY"
            placeholderTextColor="#9aa0ab"
            value={dob}
            onChangeText={(t) => setDob(formatDOBInput(t))}
            keyboardType="number-pad"
          />

          {/* Role selection */}
          <Text style={styles.roleHeading}>I am joining as a...</Text>
          <View style={styles.roleRow}>
            {ROLE_OPTIONS.map((opt) => {
              const selected = role === opt.role;
              return (
                <TouchableOpacity
                  key={opt.role}
                  style={[
                    styles.roleCard,
                    selected && { borderColor: opt.accent, backgroundColor: opt.tint },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setRole(opt.role)}
                >
                  <View style={[styles.roleBadge, { backgroundColor: opt.badgeBg }]}>
                    <Ionicons name={opt.icon} size={26} color={opt.accent} />
                  </View>
                  <Text style={styles.roleLabel}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms</Text>
            {" "}and{" "}
            <Text style={styles.termsLink}>Privacy Policy.</Text>
          </Text>

          {/* Get Started button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Social divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR JOIN WITH</Text>
            <View style={styles.divider} />
          </View>

          <GoogleButton onPress={() => handleOAuth("google")} style={styles.googleBtnSpacing} />

          {/* Log in link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already a member? </Text>
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
  safe: { flex: 1, backgroundColor: "#f7f9fb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: PRIMARY, fontSize: 22, fontWeight: "700" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  label: { color: "#616770", fontSize: 14, fontWeight: "600", marginBottom: 8, marginLeft: 6, marginTop: 12 },
  input: {
    backgroundColor: FIELD_BG,
    borderRadius: 9999,
    paddingHorizontal: 22,
    paddingVertical: 16,
    fontSize: 16,
    color: "#191c1e",
    fontWeight: "500",
    borderWidth: 2,
    borderColor: "transparent",
  },
  roleHeading: { color: "#414751", fontSize: 15, fontWeight: "700", marginTop: 24, marginBottom: 14, marginLeft: 6 },
  roleRow: { flexDirection: "row", gap: 12 },
  roleCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#e0e3e5",
    backgroundColor: "#f2f4f6",
  },
  roleBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  roleLabel: { color: "#191c1e", fontSize: 13, fontWeight: "700" },
  terms: {
    textAlign: "center",
    color: "#717783",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 24,
    marginBottom: 22,
    paddingHorizontal: 12,
  },
  termsLink: { color: PRIMARY, fontWeight: "700" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 19,
    marginBottom: 30,
    shadowColor: "#005da7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#c1c7d3" },
  dividerText: { color: "#717783", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  googleBtnSpacing: { marginBottom: 28 },
  switchRow: { flexDirection: "row", justifyContent: "center" },
  switchText: { color: "#414751", fontSize: 14, fontWeight: "600" },
  switchLink: { color: PRIMARY, fontSize: 14, fontWeight: "700" },
});
