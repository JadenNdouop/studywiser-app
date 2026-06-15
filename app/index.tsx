import { router, useRootNavigationState } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/auth";

const PRIMARY = "#014aad";
const splashIcon = require("../assets/images/swlogo-blue.png");

// ─── DEV BYPASS ─── set to "tutor" | "parent" | "student" | null (null = normal auth flow)
const DEV_ROLE: "tutor" | "parent" | "student" | null = "null";

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const { session, profile, loading } = useAuth();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return;

    let cancelled = false;

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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.logoContainer}>
          <Image source={splashIcon} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>StudyWiser</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brand: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
