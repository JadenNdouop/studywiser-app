import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { AvatarCropper } from "../components/AvatarCropper";
import { USE_MOCK } from "../constants/mockData";
import { useAuth } from "../context/auth";
import { formatDOBInput, toDisplayDate, toISODate } from "../lib/dob";
import { formatPhoneInput } from "../lib/phone";
import { uploadAvatar } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { useAvatarUrl } from "../lib/useAvatarUrl";

const PRIMARY = "#014aad";
const INPUT_BG = "#eef2ff";
const FIELD_BG = "#eef1f5";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropSourceUri, setCropSourceUri] = useState<string | null>(null);
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setEmail(profile.email ?? "");
      setDob(toDisplayDate(profile.dob));
    }
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    if (dob && !toISODate(dob)) {
      Alert.alert("Invalid date", "Please enter your date of birth as MM / DD / YYYY.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone, email, dob: dob ? toISODate(dob) : null })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      await refreshProfile();
      router.back();
    }
  }

  async function handlePickAvatar() {
    if (!user) return;
    if (USE_MOCK) {
      Alert.alert("Demo mode", "Photo uploads are disabled in demo mode.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to update your profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setCropSourceUri(result.assets[0].uri);
  }

  async function handleCropConfirm(croppedUri: string) {
    setCropSourceUri(null);
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const path = await uploadAvatar(user.id, croppedUri);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))}
            style={styles.backCircle}
          >
            <Ionicons name="arrow-back" size={22} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.cameraBadge}
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHelp}>
              Your profile photo will be visible to tutors and peers during study
              sessions.
            </Text>
          </View>

          {/* Fields card */}
          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.field}>
              <Ionicons name="person-outline" size={20} color={PRIMARY} />
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholder="Your name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.field}>
              <Ionicons name="call-outline" size={20} color={PRIMARY} />
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={(t) => setPhone(formatPhoneInput(t))}
                keyboardType="number-pad"
                placeholder="(555) 000-0000"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={20} color={PRIMARY} />
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.field}>
              <Ionicons name="calendar-outline" size={20} color={PRIMARY} />
              <TextInput
                style={styles.fieldInput}
                value={dob}
                onChangeText={(t) => setDob(formatDOBInput(t))}
                placeholder="MM / DD / YYYY"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Update Profile"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AvatarCropper
        visible={!!cropSourceUri}
        uri={cropSourceUri}
        onCancel={() => setCropSourceUri(null)}
        onConfirm={handleCropConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f9fb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eceef0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: { width: 44, height: 44 },
  headerTitle: { color: "#191c1e", fontSize: 22, fontWeight: "700" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  avatarSection: { alignItems: "center", paddingTop: 20, paddingBottom: 8 },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e2ecfb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarInitial: { color: PRIMARY, fontSize: 46, fontWeight: "700" },
  avatarImage: { width: "100%", height: "100%", borderRadius: 60 },
  cameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#00327d",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#f7f9fb",
  },
  avatarHelp: {
    color: "#414751",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: "#005da7",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 2,
  },
  label: { color: "#414751", fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: FIELD_BG,
    borderRadius: 9999,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: "#191c1e",
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 17,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
