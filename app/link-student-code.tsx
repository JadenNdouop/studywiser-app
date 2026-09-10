import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

const PRIMARY = "#014aad";
const INPUT_BG = "#eef2ff";

export default function LinkStudentCodeScreen() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  function goToApp() {
    router.replace("/(student-tabs)");
  }

  async function handleLink() {
    const trimmed = code.replace(/\s/g, "");
    if (trimmed.length < 6) {
      Alert.alert("Enter your code", "Ask your parent for the 6-character code from their app.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("link_student_by_code", { p_code: trimmed });
    setLoading(false);
    if (error) {
      Alert.alert("Couldn't link account", error.message);
      return;
    }
    Alert.alert("Linked!", "Your account is now connected to your parent.", [
      { text: "Continue", onPress: goToApp },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.headerTitle}>Link to Your Parent</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="link-outline" size={32} color={PRIMARY} />
          </View>

          <Text style={styles.description}>
            If a parent already added you as a student in StudyWiser, ask them
            for your link code and enter it below. This connects your new
            account to the sessions they book for you.
          </Text>

          <Text style={styles.label}>Link Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. A B 1 2 C D"
            placeholderTextColor="#aab4d4"
            value={code}
            onChangeText={(t) => {
              const raw = t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
              setCode(raw.split("").join(" "));
            }}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleLink}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? "Linking…" : "Link Account"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={goToApp} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  scroll: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 24, alignItems: "center" },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: INPUT_BG,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  description: {
    color: "#64748b", fontSize: 14, lineHeight: 21,
    textAlign: "center", marginBottom: 28,
  },
  label: { color: "#1e293b", fontSize: 14, fontWeight: "500", marginBottom: 8, alignSelf: "flex-start" },
  input: {
    width: "100%",
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  skipBtn: { marginTop: 18, paddingVertical: 8 },
  skipBtnText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
});
