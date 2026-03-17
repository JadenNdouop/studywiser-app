import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: "fade" }} />
      <Stack.Screen name="welcome" options={{ animation: "fade" }} />
      <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="signup" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="set-password" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
    </Stack>
  );
}
