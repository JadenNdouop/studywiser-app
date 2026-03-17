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

export default function EditProfileScreen() {
  const [name, setName] = useState("John Doe");
  const [phone, setPhone] = useState("+123 567 89000");
  const [email, setEmail] = useState("johndoe@example.com");
  const [dob, setDob] = useState("");

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
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="settings-outline" size={22} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>J</Text>
              </View>
              <TouchableOpacity style={styles.cameraBadge}>
                <Ionicons name="camera-outline" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Fields */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Date Of Birth</Text>
          <TextInput
            style={[styles.input, { marginBottom: 36 }]}
            value={dob}
            onChangeText={setDob}
            placeholder="DD / MM / YYY"
            placeholderTextColor="#aab4d4"
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Update Profile</Text>
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
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: INPUT_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: PRIMARY, fontSize: 36, fontWeight: "700" },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  label: { color: "#1e293b", fontSize: 14, fontWeight: "500", marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
