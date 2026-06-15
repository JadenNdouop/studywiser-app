import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  if (!name) return "S";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SUBJECT_TIER: Record<string, { color: string; bg: string }> = {
  "Math":                        { color: "#0369a1", bg: "#e0f2fe" },
  "Reading & Writing":           { color: "#0369a1", bg: "#e0f2fe" },
  "Science":                     { color: "#0369a1", bg: "#e0f2fe" },
  "Social Studies":               { color: "#0369a1", bg: "#e0f2fe" },
  "Spelling":                    { color: "#0369a1", bg: "#e0f2fe" },
  "Algebra I / II":              { color: "#7c3aed", bg: "#ede9fe" },
  "Geometry":                    { color: "#7c3aed", bg: "#ede9fe" },
  "Pre-Calculus / Calculus":     { color: "#7c3aed", bg: "#ede9fe" },
  "Biology":                     { color: "#7c3aed", bg: "#ede9fe" },
  "Chemistry":                   { color: "#7c3aed", bg: "#ede9fe" },
  "Physics":                     { color: "#7c3aed", bg: "#ede9fe" },
  "English / Literature":        { color: "#7c3aed", bg: "#ede9fe" },
  "US History / World History":  { color: "#7c3aed", bg: "#ede9fe" },
  "SAT Math":                    { color: "#b45309", bg: "#fef3c7" },
  "SAT Reading & Writing":       { color: "#b45309", bg: "#fef3c7" },
  "ACT":                         { color: "#b45309", bg: "#fef3c7" },
  "PSAT":                        { color: "#b45309", bg: "#fef3c7" },
};

type Tutor = { id: string; name: string; subject: string; sessions: number };

export default function StudentProfileScreen() {
  const { profile, signOut } = useAuth();
  const displayName  = profile?.full_name ?? "Student";
  const displayEmail = profile?.email     ?? "";

  const [stats,    setStats]    = useState({ sessions: 0, hours: 0, tutors: 0 });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tutors,   setTutors]   = useState<Tutor[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [profile?.id])
  );

  async function loadData() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from("sessions")
      .select(`id, subject, duration, tutor:profiles!sessions_tutor_id_fkey(id, full_name)`)
      .eq("student_profile_id", userId)
      .eq("status", "completed");

    const rows = data ?? [];

    const totalHours = Math.round(rows.reduce((sum, s: any) => sum + (s.duration ?? 0), 0) / 60);

    // Unique subjects
    const subjectSet = new Set<string>(rows.map((s: any) => s.subject).filter(Boolean));
    setSubjects(Array.from(subjectSet));

    // Unique tutors
    const tutorMap: Record<string, Tutor> = {};
    rows.forEach((s: any) => {
      const tid = s.tutor?.id;
      if (!tid) return;
      if (!tutorMap[tid]) tutorMap[tid] = { id: tid, name: s.tutor.full_name ?? "Unknown", subject: s.subject, sessions: 0 };
      tutorMap[tid].sessions++;
    });
    const tutorList = Object.values(tutorMap).sort((a, b) => b.sessions - a.sessions);
    setTutors(tutorList);

    setStats({ sessions: rows.length, hours: totalHours, tutors: tutorList.length });
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

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{displayEmail}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Student</Text>
          </View>

          <View style={styles.statsRow}>
            {[
              { value: String(stats.sessions), label: "Sessions", color: PRIMARY    },
              { value: String(stats.hours),    label: "Hours",    color: "#7c3aed"  },
              { value: String(stats.tutors),   label: "Tutors",   color: "#10b981"  },
            ].map((s, i) => (
              <View key={s.label} style={styles.statItem}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statContent}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* My Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Subjects</Text>
          {subjects.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="book-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>Subjects you've studied will appear here.</Text>
            </View>
          ) : (
            <View style={styles.chipRow}>
              {subjects.map((s) => {
                const ts = SUBJECT_TIER[s] ?? { color: "#0369a1", bg: "#e0f2fe" };
                return (
                  <View key={s} style={[styles.subjectChip, { backgroundColor: ts.bg }]}>
                    <Text style={[styles.subjectChipText, { color: ts.color }]}>{s}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* My Tutors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Tutors</Text>
          {tutors.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>Your tutors will appear here after your first session.</Text>
            </View>
          ) : (
            <View style={styles.tutorList}>
              {tutors.map((t, i) => (
                <View key={t.id}>
                  <View style={styles.tutorRow}>
                    <View style={[styles.tutorAvatar, { backgroundColor: avatarColor(t.id) }]}>
                      <Text style={styles.tutorAvatarText}>{getInitials(t.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tutorName}>{t.name}</Text>
                      <Text style={styles.tutorSubject}>{t.subject}</Text>
                    </View>
                    <Text style={styles.tutorSessions}>{t.sessions} session{t.sessions !== 1 ? "s" : ""}</Text>
                  </View>
                  {i < tutors.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Settings</Text>
          <View style={styles.settingsList}>
            {[
              { icon: "person-outline",        label: "Edit Profile",   route: "/profile-edit"          },
              { icon: "notifications-outline", label: "Notifications",  route: "/profile-notifications" },
              { icon: "settings-outline",      label: "Settings",       route: "/profile-settings"      },
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 110 },

  hero: {
    alignItems: "center", backgroundColor: CARD_BG,
    marginHorizontal: 20, marginTop: 18, marginBottom: 28,
    borderRadius: 28, paddingTop: 24, paddingBottom: 20, paddingHorizontal: 20, gap: 6,
  },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
    shadowColor: PRIMARY, shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
  },
  avatarText:    { color: "#fff", fontSize: 28, fontWeight: "700" },
  heroName:      { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  heroEmail:     { fontSize: 13, color: "#64748b" },
  roleBadge:     { backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  roleBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  statsRow: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 18, marginTop: 10, width: "100%", paddingVertical: 14,
  },
  statItem:    { flex: 1, flexDirection: "row", alignItems: "center" },
  statDivider: { width: 1, height: 32, backgroundColor: "#e2e8f0" },
  statContent: { flex: 1, alignItems: "center", gap: 2 },
  statValue:   { fontSize: 20, fontWeight: "800" },
  statLabel:   { fontSize: 11, color: "#94a3b8", fontWeight: "500" },

  section:      { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 12 },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f8fafc", borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  emptyBoxText: { color: "#94a3b8", fontSize: 13, flex: 1 },

  chipRow:         { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subjectChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  subjectChipText: { fontSize: 13, fontWeight: "600" },

  tutorList:     { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20, overflow: "hidden" },
  tutorRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  tutorAvatar:   { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  tutorAvatarText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  tutorName:     { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  tutorSubject:  { fontSize: 12, color: "#64748b" },
  tutorSessions: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  divider:       { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },

  settingsList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 18, overflow: "hidden" },
  settingsRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  settingsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center",
  },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1e293b" },

  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginHorizontal: 20, borderWidth: 1.5, borderColor: "#fecaca",
    borderRadius: 30, paddingVertical: 14, backgroundColor: "#fff1f1",
  },
  signOutText: { color: "#ef4444", fontSize: 15, fontWeight: "700" },
});
