import { router, useRootNavigationState } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/auth";

const PRIMARY = "#0060ac";
const splashIcon = require("../assets/images/swlogo-white.jpg");

// ─── DEV BYPASS ─── set to "tutor" | "parent" | "student" | null (null = normal auth flow)
// Leave null to land on the welcome screen. Use the floating dev switcher to jump between roles.
const DEV_ROLE: "tutor" | "parent" | "student" | null = null;

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const { session, profile, loading } = useAuth();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return;

    let cancelled = false;

    // Loading bar fills while the splash is visible
    Animated.timing(progress, {
      toValue: 1,
      duration: 1700,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const anim = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    anim.start(() => {
      if (cancelled) return;

      // DEV bypass — skip auth entirely
      if (DEV_ROLE === "tutor")   { router.replace("/(tutor-tabs)");   return; }
      if (DEV_ROLE === "parent")  { router.replace("/(parent-tabs)");  return; }
      if (DEV_ROLE === "student") { router.replace("/(student-tabs)"); return; }

      // Real auth flow
      if (loading) return;
      if (session && profile) {
        if (profile.role === "tutor")        router.replace("/(tutor-tabs)");
        else if (profile.role === "student") router.replace("/(student-tabs)");
        else                                 router.replace("/(parent-tabs)");
      } else {
        router.replace("/welcome");
      }
    });

    return () => {
      cancelled = true;
      anim.stop();
    };
  }, [navState?.key, session, profile, loading]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Soft ambient accents */}
      <View style={[styles.blob, styles.blobMint]} />
      <View style={[styles.blob, styles.blobBlue]} />

      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.logoTile}>
          <Image source={splashIcon} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>StudyWiser</Text>
        <Text style={styles.tagline}>Learning, reimagined.</Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>
        <Text style={styles.loadingText}>Initializing creative workspace…</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fb",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  blob: { position: "absolute", borderRadius: 9999, opacity: 0.16 },
  blobMint: { width: 340, height: 340, backgroundColor: "#96f4dd", top: -100, right: -110 },
  blobBlue: { width: 380, height: 380, backgroundColor: "#a4c9ff", bottom: -120, left: -120 },
  content: {
    alignItems: "center",
    width: "78%",
  },
  logoTile: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#0b3a7a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  logo: { width: 96, height: 96, borderRadius: 48 },
  brand: {
    color: "#191c1e",
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tagline: {
    color: "#414751",
    fontSize: 17,
    fontWeight: "500",
    marginTop: 6,
    marginBottom: 44,
  },
  progressTrack: {
    width: "70%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e3e5",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 16,
  },
});
