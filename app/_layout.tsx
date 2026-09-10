import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
  useFonts,
} from "@expo-google-fonts/quicksand";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DevRoleSwitcher from "../components/DevRoleSwitcher";
import { AuthProvider } from "../context/auth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: "fade" }} />
          <Stack.Screen name="welcome" options={{ animation: "fade" }} />
          <Stack.Screen name="role-select" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="onboarding-documents" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="signup" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="set-password" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="link-student-code" options={{ animation: "slide_from_right" }} />
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
          <Stack.Screen name="messages" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="message-detail" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="(parent-tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="(tutor-tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="(student-tabs)" options={{ animation: "fade" }} />
        </Stack>
        <DevRoleSwitcher />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
