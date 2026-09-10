import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  Image,
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
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const PRIMARY = "#014aad";
const BUTTON_NAVY = "#00327d";
const INPUT_BG = "#f1f5f9";
const swLogo = require("../assets/images/swlogo-white.jpg");

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
  const insets = useSafeAreaInsets();
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

  async function handleOAuth(provider: "google") {
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

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      {/* Soft ambient background blobs */}
      <View style={[styles.blob, styles.blobMint]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobBlue]} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Back button */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.brandArea}>
            <View style={styles.logoTile}>
              <Image source={swLogo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.tagline}>Your creative learning playground</Text>
          </View>

          {/* Login card */}
          <View style={styles.card}>
            {/* Email */}
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
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
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Log In button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "Logging in..." : "Log In"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.divider} />
            </View>

            {/* Google sign-in */}
            <GoogleButton
              style={loading && { opacity: 0.7 }}
              onPress={() => handleOAuth("google")}
              disabled={loading}
            />
          </View>

          {/* Sign up link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/role-select")}>
              <Text style={styles.switchLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f9fb" },
  blob: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.18,
  },
  blobMint: {
    width: 360,
    height: 360,
    backgroundColor: "#96f4dd",
    top: -120,
    left: -120,
  },
  blobBlue: {
    width: 440,
    height: 440,
    backgroundColor: "#a4c9ff",
    bottom: -160,
    right: -160,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, justifyContent: "center" },
  brandArea: { alignItems: "center", marginBottom: 28 },
  logoTile: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#0b3a7a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 16,
  },
  logo: { width: "78%", height: "78%" },
  tagline: { color: "#414751", fontSize: 15, fontWeight: "500" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#005da7",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 6,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
    color: "#191c1e",
    marginBottom: 14,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 9999,
    marginBottom: 6,
    paddingRight: 18,
  },
  passwordInput: { flex: 1, marginBottom: 0, backgroundColor: "transparent" },
  eyeBtn: { padding: 4 },
  forgotWrap: { alignItems: "flex-end", marginBottom: 20, marginTop: 4 },
  forgotText: { color: PRIMARY, fontSize: 14, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: BUTTON_NAVY,
    borderRadius: 9999,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 22,
  },
  primaryBtnText: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#c1c7d3" },
  dividerText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  switchText: { color: "#414751", fontSize: 14 },
  switchLink: { color: PRIMARY, fontSize: 14, fontWeight: "700" },
});
