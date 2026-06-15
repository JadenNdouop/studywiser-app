import { Stack } from "expo-router";
import { AuthProvider } from "../context/auth";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="welcome" options={{ animation: "fade" }} />
        <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="signup" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="set-password" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="profile-edit" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="edit-subjects" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="edit-availability" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="all-sessions" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="parent-payment" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="profile-settings" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="profile-notifications" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="profile-password" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="profile-privacy" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="profile-help" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="message-detail" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="tutor-profile" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="book-session" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="booking-confirmation" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(parent-tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(tutor-tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(student-tabs)" options={{ animation: "fade" }} />
      </Stack>
    </AuthProvider>
  );
}
