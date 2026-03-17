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

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="••••••••••••"
          placeholderTextColor="#aab4d4"
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(!show)}>
          <Ionicons
            name={show ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#aab4d4"
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

export default function PasswordManagerScreen() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Password Manager</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PasswordField label="Current Password" value={current} onChange={setCurrent} />

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <PasswordField label="New Password" value={next} onChange={setNext} />

          <View style={{ marginBottom: 36 }}>
            <PasswordField
              label="Confirm New Password"
              value={confirm}
              onChange={setConfirm}
            />
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Change Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  label: { color: "#1e293b", fontSize: 14, fontWeight: "500", marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1e293b",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingRight: 14,
  },
  eyeBtn: { padding: 4 },
  forgotWrap: { alignItems: "flex-end", marginTop: 8, marginBottom: 4 },
  forgotText: { color: PRIMARY, fontSize: 13, fontWeight: "500" },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
