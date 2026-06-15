import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as LocalAuthentication from "expo-local-authentication";
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

async function navigateByRole(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profile?.role === "tutor")        router.replace("/(tutor-tabs)");
  else if (profile?.role === "student") router.replace("/(student-tabs)");
  else                                  router.replace("/(parent-tabs)");
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert("Login failed", error.message);
      return;
    }
    if (data.user) {
      await navigateByRole(data.user.id);
    }
    setLoading(false);
  }

  async function handleOAuth(provider: "google" | "facebook") {
    setLoading(true);
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
            await navigateByRole(sessionData.session.user.id);
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Sign in failed", err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometric() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Biometrics unavailable",
          "Your device doesn't have biometrics configured. Please log in with your email and password."
        );
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert(
          "No saved session",
          "Log in with your email and password first. After that, biometrics will work on future visits."
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to StudyWiser",
        cancelLabel:   "Cancel",
        fallbackLabel: "Use password",
      });

      if (result.success) {
        await navigateByRole(session.user.id);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
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
          <Text style={styles.headerTitle}>Log In</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome heading */}
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.subheading}>
            Your all-in-one study companion. Organize notes, track progress,
            and boost your grades.
          </Text>

          {/* Email field */}
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

          {/* Password field */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••••••"
              placeholderTextColor="#aab4d4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#aab4d4"
              />
            </TouchableOpacity>
          </View>

          {/* Forget password */}
          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forget Password</Text>
          </TouchableOpacity>

          {/* Log In button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? "Logging in..." : "Log In"}</Text>
          </TouchableOpacity>

          {/* Social divider */}
          <Text style={styles.orText}>or sign in with</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.7}
              onPress={() => handleOAuth("google")}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={22} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.7}
              onPress={() => handleOAuth("facebook")}
              disabled={loading}
            >
              <Ionicons name="logo-facebook" size={22} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.7}
              onPress={handleBiometric}
              disabled={loading}
            >
              <Ionicons name="finger-print" size={22} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/signup")}>
              <Text style={styles.switchLink}>Sign Up</Text>
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
  heading: { color: PRIMARY, fontSize: 24, fontWeight: "700", marginBottom: 8, marginTop: 8 },
  subheading: { color: "#64748b", fontSize: 13, lineHeight: 20, marginBottom: 28 },
  label: { color: "#1e293b", fontSize: 14, fontWeight: "500", marginBottom: 8 },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 16,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    marginBottom: 8,
    paddingRight: 14,
  },
  eyeBtn: { padding: 4 },
  forgotWrap: { alignItems: "flex-end", marginBottom: 28 },
  forgotText: { color: PRIMARY, fontSize: 13, fontWeight: "500" },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  orText: { textAlign: "center", color: "#94a3b8", fontSize: 13, marginBottom: 16 },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 32 },
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
