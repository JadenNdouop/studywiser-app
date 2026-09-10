import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const NAVY = "#013a8f";
const MINT = "#96f4dd";
const swLogo = require("../assets/images/swlogo-white.jpg");

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      {/* Soft gradient accents */}
      <View style={[styles.blob, styles.blobMint]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobPeach]} pointerEvents="none" />

      <View style={styles.container}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoTile}>
            <Image source={swLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brand}>StudyWiser</Text>
        </View>

        {/* Bottom area */}
        <View style={styles.bottom}>
          <Text style={styles.tagline}>
            Connect with expert tutors, track progress, and achieve your
            academic goals.
          </Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/login")}
            activeOpacity={0.9}
          >
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => router.push("/role-select")}
            activeOpacity={0.9}
          >
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f9fb" },
  blob: { position: "absolute", borderRadius: 9999, opacity: 0.35 },
  blobMint: { width: 300, height: 300, backgroundColor: "#c9f7ec", top: -80, right: -70 },
  blobPeach: { width: 300, height: 300, backgroundColor: "#ffe6d6", bottom: 40, left: -90 },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  logoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  logoTile: {
    width: 132,
    height: 132,
    borderRadius: 36,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#0b3a7a",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 5,
  },
  logo: { width: "62%", height: "62%" },
  brand: {
    color: PRIMARY,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  bottom: { gap: 16 },
  tagline: {
    textAlign: "center",
    color: "#414751",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  loginBtn: {
    backgroundColor: NAVY,
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },
  loginText: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
  signupBtn: {
    backgroundColor: MINT,
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#3fbfa3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },
  signupText: { color: "#04241d", fontSize: 17, fontWeight: "700" },
});
