import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const INPUT_BG = "#eef2ff";

export default function SetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Password</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Text style={styles.description}>
            Your all-in-one study companion. Organize notes, track progress,
            and boost your grades.
          </Text>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••••••"
              placeholderTextColor="#aab4d4"
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
                color="#aab4d4"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={[styles.passwordRow, { marginBottom: 36 }]}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••••••"
              placeholderTextColor="#aab4d4"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Ionicons
                name={showConfirm ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#aab4d4"
              />
            </TouchableOpacity>
          </View>

          {/* Create button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Create New Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: PRIMARY,
    fontSize: 18,
    fontWeight: "700",
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    paddingTop: 8,
  },
  description: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 28,
  },
  label: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 16,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    marginBottom: 16,
    paddingRight: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
