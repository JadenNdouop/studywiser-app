import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";
import { supabase } from "../../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

const AVATAR_COLORS = ["#c7d2fe","#fde8d8","#d1fae5","#fef9c3","#fee2e2","#ddd6fe"];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const GRADE_OPTIONS = ["K", ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];

type Student = {
  id: string;
  full_name: string;
  grade_level: string | null;
};

export default function ParentProfileScreen() {
  const { profile, signOut } = useAuth();
  const displayName  = profile?.full_name ?? "Parent";
  const displayEmail = profile?.email     ?? "";

  const [students, setStudents] = useState<Student[]>([]);

  // Add-student modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newName,      setNewName]      = useState("");
  const [newGrade,     setNewGrade]     = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("students")
      .select("id, full_name, grade_level")
      .eq("parent_id", userId)
      .order("full_name");
    setStudents(data ?? []);
  }

  function openModal() {
    setNewName("");
    setNewGrade(null);
    setModalVisible(true);
    setTimeout(() => nameInputRef.current?.focus(), 200);
  }

  function closeModal() {
    setModalVisible(false);
    setNewName("");
    setNewGrade(null);
  }

  async function handleAddStudent() {
    if (!profile?.id) {
      Alert.alert("Error", "You must be logged in to add a student.");
      return;
    }
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter the student's full name.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .insert({ parent_id: profile.id, full_name: trimmed, grade_level: newGrade })
        .select("id, full_name, grade_level")
        .single();
      if (error) throw error;
      setStudents((prev) => [...prev, data].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      closeModal();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not add student. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStudent(id: string, name: string) {
    Alert.alert("Remove Student", `Remove ${name} from your account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          setStudents((prev) => prev.filter((s) => s.id !== id));
          await supabase.from("students").delete().eq("id", id);
        },
      },
    ]);
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => { await signOut(); router.replace("/login"); },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.displayEmail}>{displayEmail}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Parent</Text>
          </View>
        </View>

        {/* My Students */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Students</Text>
            <TouchableOpacity onPress={openModal} activeOpacity={0.8}>
              <Text style={styles.sectionLink}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.studentList}>
            {students.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={22} color="#cbd5e1" />
                <Text style={styles.emptyBoxText}>
                  No students yet — tap{" "}
                  <Text style={{ color: PRIMARY, fontWeight: "600" }}>+ Add</Text>{" "}
                  to add one
                </Text>
              </View>
            ) : (
              students.map((st, i) => (
                <View key={st.id}>
                  <View style={styles.studentRow}>
                    <View style={[styles.studentAvatar, { backgroundColor: avatarColor(st.id) }]}>
                      <Text style={styles.studentAvatarText}>{getInitials(st.full_name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{st.full_name}</Text>
                      {st.grade_level ? (
                        <Text style={styles.studentGrade}>{st.grade_level}</Text>
                      ) : (
                        <Text style={styles.studentGradeMuted}>No grade set</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteStudent(st.id, st.full_name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fca5a5" />
                    </TouchableOpacity>
                  </View>
                  {i < students.length - 1 && <View style={styles.studentDivider} />}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Account settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Account</Text>
          <View style={styles.settingsList}>
            {[
              { icon: "person-outline",        label: "Edit Profile",   route: "/profile-edit"          },
              { icon: "notifications-outline", label: "Notifications",  route: "/profile-notifications" },
              { icon: "settings-outline",      label: "Settings",       route: "/profile-settings"      },
              { icon: "lock-closed-outline",   label: "Privacy",        route: "/profile-privacy"       },
              { icon: "help-circle-outline",   label: "Help & Support", route: "/profile-help"          },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingsIconWrap}>
                    <Ionicons name={item.icon as any} size={20} color={PRIMARY} />
                  </View>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Add Student Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />

          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Add Student</Text>

            {/* Name input */}
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.textInput}
              placeholder="e.g. Emma Johnson"
              placeholderTextColor="#94a3b8"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              returnKeyType="done"
            />

            {/* Grade selector */}
            <Text style={[styles.inputLabel, { marginTop: 18 }]}>Grade Level</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gradeRow}
            >
              {GRADE_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeChip, newGrade === g && styles.gradeChipActive]}
                  onPress={() => setNewGrade(g === newGrade ? null : g)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.gradeChipText, newGrade === g && styles.gradeChipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={closeModal} activeOpacity={0.75}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleAddStudent}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Add Student"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 110 },

  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },

  identityCard: {
    alignItems: "center", paddingVertical: 28, paddingHorizontal: 20,
    marginHorizontal: 20, backgroundColor: CARD_BG,
    borderRadius: 24, marginBottom: 28, gap: 6,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  avatarText:    { color: "#fff", fontSize: 28, fontWeight: "700" },
  displayName:   { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  displayEmail:  { fontSize: 13, color: "#64748b" },
  roleBadge:     { marginTop: 4, backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  roleBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  section:    { paddingHorizontal: 20, marginBottom: 28 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  sectionLink:  { fontSize: 13, color: PRIMARY, fontWeight: "600" },

  studentList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 18, overflow: "hidden" },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 18, paddingHorizontal: 16,
  },
  emptyBoxText: { color: "#94a3b8", fontSize: 13, flex: 1 },

  studentRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, paddingHorizontal: 14,
  },
  studentAvatar:     { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  studentAvatarText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  studentName:       { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  studentGrade:      { fontSize: 12, color: "#64748b" },
  studentGradeMuted: { fontSize: 12, color: "#cbd5e1" },
  studentDivider:    { height: 1, backgroundColor: "#f1f5f9" },

  settingsList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 18, overflow: "hidden" },
  settingsRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  settingsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center",
  },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1e293b" },
  divider:       { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },

  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginHorizontal: 20, borderWidth: 1.5, borderColor: "#fecaca",
    borderRadius: 30, paddingVertical: 14, backgroundColor: "#fff1f1",
  },
  signOutText: { color: "#ef4444", fontSize: 15, fontWeight: "700" },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 14,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0",
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 20 },

  inputLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 8 },
  textInput: {
    borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: "#0f172a", backgroundColor: "#f8fafc",
  },

  gradeRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  gradeChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, backgroundColor: CARD_BG,
    borderWidth: 1.5, borderColor: "transparent",
  },
  gradeChipActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  gradeChipText:       { fontSize: 13, fontWeight: "600", color: "#64748b" },
  gradeChipTextActive: { color: "#fff" },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 28 },
  cancelModalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#e2e8f0", alignItems: "center",
  },
  cancelModalText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: PRIMARY, alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
