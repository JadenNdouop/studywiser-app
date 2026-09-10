import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView, Modal, Platform,
  ScrollView, Share, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SWButton, SWHeader, SWSectionHeader, avatarTint, getInitials } from "../../components/sw";
import { SW } from "../../constants/theme";
import { MOCK_STUDENTS, USE_MOCK } from "../../constants/mockData";
import { useAuth } from "../../context/auth";
import { supabase } from "../../lib/supabase";
import { useAvatarUrl } from "../../lib/useAvatarUrl";

const PRIMARY = SW.color.primary;

const GRADE_OPTIONS = ["K", ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];

type Student = {
  id: string;
  full_name: string;
  grade_level: string | null;
  profile_id: string | null;
  link_code: string;
};

const SETTINGS_ITEMS = [
  { icon: "person-outline",        label: "Edit Profile",   route: "/profile-edit",          tint: SW.color.lavenderSoft, fg: SW.color.primary },
  { icon: "notifications-outline", label: "Notifications",  route: "/profile-notifications", tint: SW.color.mintSoft,     fg: SW.color.onMint },
  { icon: "settings-outline",      label: "Settings",       route: "/profile-settings",      tint: SW.color.coralSoft,    fg: SW.color.onCoral },
  { icon: "lock-closed-outline",   label: "Privacy",        route: "/profile-privacy",       tint: SW.color.mintSoft,     fg: SW.color.onMint },
  { icon: "help-circle-outline",   label: "Help & Support", route: "/profile-help",          tint: SW.color.coralSoft,    fg: SW.color.onCoral },
];

export default function ParentProfileScreen() {
  const { profile, signOut } = useAuth();
  const displayName  = profile?.full_name ?? "Parent";
  const displayEmail = profile?.email     ?? "";
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

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
    if (USE_MOCK) { setStudents(MOCK_STUDENTS as any); return; }
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("students")
      .select("id, full_name, grade_level, profile_id, link_code")
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
      if (USE_MOCK) {
        const local = {
          id: `local-${Date.now()}`, full_name: trimmed, grade_level: newGrade ?? "",
          profile_id: null, link_code: "DEMO01",
        };
        setStudents((prev) => [...prev, local].sort((a, b) => a.full_name.localeCompare(b.full_name)));
        closeModal();
        return;
      }
      const { data, error } = await supabase
        .from("students")
        .insert({ parent_id: profile.id, full_name: trimmed, grade_level: newGrade })
        .select("id, full_name, grade_level, profile_id, link_code")
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

  async function handleShareCode(name: string, code: string) {
    try {
      await Share.share({
        message: `Join me on StudyWiser! Use code ${code} when you sign up as a student to link your account to ${name}'s profile.`,
      });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  async function handleDeleteStudent(id: string, name: string) {
    Alert.alert("Remove Student", `Remove ${name} from your account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          setStudents((prev) => prev.filter((s) => s.id !== id));
          if (!USE_MOCK) await supabase.from("students").delete().eq("id", id);
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
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <SWHeader initials={getInitials(displayName)} />

        {/* Identity */}
        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.avatarEdit}
              onPress={() => router.push("/profile-edit" as any)}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          {displayEmail ? <Text style={styles.displayEmail}>{displayEmail}</Text> : null}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Parent Account</Text>
          </View>
        </View>

        {/* My Students */}
        <View style={styles.section}>
          <SWSectionHeader title="My Students" actionLabel="+ Add" onAction={openModal} />

          {students.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={22} color={SW.color.muted} />
              <Text style={styles.emptyBoxText}>
                No students yet — tap <Text style={{ color: PRIMARY, fontFamily: SW.font.bold }}>+ Add</Text> to add one
              </Text>
            </View>
          ) : (
            <View style={styles.studentList}>
              {students.map((st) => {
                const tint = avatarTint(st.id);
                return (
                  <View key={st.id} style={styles.studentRow}>
                    <View style={[styles.studentAvatar, { backgroundColor: tint.bg }]}>
                      <Text style={[styles.studentAvatarText, { color: tint.fg }]}>
                        {getInitials(st.full_name)}
                      </Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>{st.full_name}</Text>
                      <Text style={styles.studentGrade}>{st.grade_level ?? "No grade set"}</Text>
                    </View>
                    {st.profile_id ? (
                      <View style={styles.linkedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={SW.color.onMint} />
                        <Text style={styles.linkedBadgeText}>Linked</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.codeBadge}
                        onPress={() => handleShareCode(st.full_name.split(" ")[0], st.link_code)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="share-outline" size={12} color={PRIMARY} />
                        <Text style={styles.codeBadgeText}>{st.link_code}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.studentDelete}
                      onPress={() => handleDeleteStudent(st.id, st.full_name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={16} color={SW.color.muted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.addStudentRow} onPress={openModal} activeOpacity={0.7}>
            <View style={styles.addStudentIcon}>
              <Ionicons name="add" size={18} color={SW.color.onSurfaceVariant} />
            </View>
            <Text style={styles.addStudentText}>Add Student</Text>
          </TouchableOpacity>
        </View>

        {/* Account settings */}
        <View style={styles.section}>
          <SWSectionHeader title="Account Settings" />
          <View style={styles.settingsCard}>
            {SETTINGS_ITEMS.map((item, i, arr) => (
              <View key={item.label}>
                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.settingsIconWrap, { backgroundColor: item.tint }]}>
                    <Ionicons name={item.icon as any} size={19} color={item.fg} />
                  </View>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={SW.color.outline} />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <SWButton
          label="Logout"
          icon="log-out-outline"
          variant="danger"
          onPress={handleSignOut}
          style={{ marginHorizontal: SW.space.margin }}
        />

        <Text style={styles.footer}>StudyWiser · Made with ❤️ for lifelong learners</Text>
      </ScrollView>

      {/* ── Add Student Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Add Student</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.textInput}
              placeholder="e.g. Emma Johnson"
              placeholderTextColor={SW.color.muted}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              returnKeyType="done"
            />

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
  safe: { flex: 1, backgroundColor: SW.color.surface },
  scroll: { paddingBottom: 130 },

  identity: { alignItems: "center", marginBottom: 28, gap: 4 },
  avatarWrap: { marginBottom: 10 },
  avatarCircle: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: SW.color.lavender,
    borderWidth: 4, borderColor: SW.color.card,
    alignItems: "center", justifyContent: "center",
    ...SW.shadow(SW.color.primary, 0.2),
  },
  avatarText: { fontFamily: SW.font.bold, fontSize: 36, color: PRIMARY },
  avatarImage: { width: "100%", height: "100%", borderRadius: 54 },
  avatarEdit: {
    position: "absolute", right: 0, bottom: 2,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: SW.color.card,
  },
  displayName: { ...SW.type.headlineLg, fontSize: 26, color: SW.color.onSurface },
  displayEmail: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted },
  roleBadge: {
    marginTop: 6, backgroundColor: SW.color.coralSoft,
    borderRadius: SW.radius.full, paddingHorizontal: 16, paddingVertical: 6,
  },
  roleBadgeText: { ...SW.type.labelMd, color: SW.color.onCoral },

  section: { paddingHorizontal: SW.space.margin, marginBottom: 28 },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: SW.color.surfaceLow, borderRadius: SW.radius.md,
    paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12,
  },
  emptyBoxText: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, flex: 1 },

  studentList: { gap: 12, marginBottom: 14 },
  studentRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    paddingVertical: 14, paddingHorizontal: 16,
    ...SW.shadow(SW.color.outline, 0.22),
  },
  studentAvatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: "center", justifyContent: "center",
  },
  studentAvatarText: { fontFamily: SW.font.bold, fontSize: 17 },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { ...SW.type.bodyLg, fontFamily: SW.font.bold, fontSize: 16, color: SW.color.onSurface },
  studentGrade: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, marginTop: 1 },
  studentDelete: { padding: 2 },
  linkedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: SW.color.mintSoft, borderRadius: SW.radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  linkedBadgeText: { ...SW.type.labelSm, fontSize: 11, color: SW.color.onMint, fontFamily: SW.font.semibold },
  codeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: SW.color.lavenderSoft, borderRadius: SW.radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  codeBadgeText: { ...SW.type.labelSm, fontSize: 11, color: PRIMARY, fontFamily: SW.font.bold, letterSpacing: 0.5 },

  addStudentRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 2, borderStyle: "dashed", borderColor: SW.color.outline,
    borderRadius: SW.radius.lg, paddingVertical: 18,
  },
  addStudentIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: SW.color.surfaceContainer,
    alignItems: "center", justifyContent: "center",
  },
  addStudentText: { ...SW.type.labelMd, fontSize: 15, color: SW.color.onSurfaceVariant },

  settingsCard: {
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg, overflow: "hidden",
    ...SW.shadow(SW.color.outline, 0.22),
  },
  settingsRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  settingsIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  settingsLabel: { flex: 1, ...SW.type.bodyMd, fontSize: 15, fontFamily: SW.font.semibold, color: SW.color.onSurface },
  divider: { height: 1, backgroundColor: SW.color.surfaceLow, marginHorizontal: 18 },

  footer: {
    ...SW.type.bodyMd, fontSize: 12, color: SW.color.muted,
    textAlign: "center", marginTop: 24,
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: SW.color.card, borderTopLeftRadius: SW.radius.xl, borderTopRightRadius: SW.radius.xl,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 14,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: SW.color.outline,
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: { ...SW.type.headlineMd, color: SW.color.onSurface, marginBottom: 20 },

  inputLabel: { ...SW.type.labelMd, fontSize: 13, color: SW.color.onSurfaceVariant, marginBottom: 8 },
  textInput: {
    borderRadius: SW.radius.md,
    paddingHorizontal: 16, paddingVertical: 14,
    ...SW.type.bodyMd, color: SW.color.onSurface, backgroundColor: SW.color.inputBg,
  },

  gradeRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  gradeChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: SW.radius.full, backgroundColor: SW.color.surfaceContainer,
  },
  gradeChipActive:     { backgroundColor: SW.color.mint },
  gradeChipText:       { ...SW.type.labelMd, fontFamily: SW.font.medium, fontSize: 13, color: SW.color.onSurfaceVariant },
  gradeChipTextActive: { color: SW.color.onMint, fontFamily: SW.font.bold },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 28 },
  cancelModalBtn: {
    flex: 1, paddingVertical: 15, borderRadius: SW.radius.full,
    borderWidth: 1.5, borderColor: SW.color.outline, alignItems: "center",
  },
  cancelModalText: { ...SW.type.labelMd, color: SW.color.onSurfaceVariant },
  saveBtn: {
    flex: 2, paddingVertical: 15, borderRadius: SW.radius.full,
    backgroundColor: PRIMARY, alignItems: "center",
  },
  saveBtnText: { fontFamily: SW.font.bold, fontSize: 15, color: "#fff" },
});
