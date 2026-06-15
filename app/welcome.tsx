import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const swLogo = require("../assets/images/swlogo.jpg");

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Image source={swLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brand}>StudyWiser</Text>
        </View>

        {/* Bottom area */}
        <View style={styles.bottom}>
          <Text style={styles.tagline}>
            Connect with expert tutors, track progress, and achieve your
            academic goals — all in one place.
          </Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => router.push("/signup")}
            activeOpacity={0.85}
          >
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  logoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brand: {
    color: PRIMARY,
    fontSize: 26,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  bottom: {
    gap: 14,
  },
  tagline: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  loginBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  signupBtn: {
    backgroundColor: "#c7d7f5",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  signupText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: "600",
  },
});
