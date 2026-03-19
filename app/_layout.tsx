import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/auth";

function RootLayoutNav() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace("/(tabs)");
    }
  }, [session, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: "fade" }} />
      <Stack.Screen name="welcome" options={{ animation: "fade" }} />
      <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="signup" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="set-password"           options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profile-edit"           options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profile-settings"       options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profile-notifications"  options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profile-password"       options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profile-privacy"        options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profile-help"           options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notifications"           options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="message-detail"          options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="tutor-profile"           options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="book-session"            options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="booking-confirmation"    options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
