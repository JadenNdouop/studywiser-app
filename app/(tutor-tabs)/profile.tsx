import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";
import { supabase } from "../../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Map each subject to its tier for chip coloring
const SUBJECT_TIER: Record<string, "Basic" | "Upper" | "SAT"> = {};
const TIER_SUBJECTS = {
  Basic: ["Reading & Writing", "Math", "Science", "Social Studies", "Spelling"],
  Upper: ["Algebra I / II", "Geometry", "Pre-Calculus / Calculus", "Biology", "Chemistry", "Physics", "English / Literature", "US History / World History"],
  SAT:   ["SAT Math", "SAT Reading & Writing", "ACT", "PSAT"],
};
Object.entries(TIER_SUBJECTS).forEach(([tier, subjects]) => {
  subjects.forEach((s) => { SUBJECT_TIER[s] = tier as "Basic" | "Upper" | "SAT"; });
});
const TIER_STYLE = {
  Basic: { color: "#0369a1", bg: "#e0f2fe" },
  Upper: { color: "#7c3aed", bg: "#ede9fe" },
  SAT:   { color: "#b45309", bg: "#fef3c7" },
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TutorProfileScreen() {
  const { profile, signOut } = useAuth();
  const name  = profile?.full_name ?? "Tutor";
  const email = profile?.email     ?? "";

  const [subjects, setSubjects]     = useState<string[]>([]);
  const [availability, setAvail]    = useState<Record<string, { start: string; end: string }>>({});
  const [stats, setStats]           = useState({ sessions: 0, students: 0 });
  const [loading, setLoading]       = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    setLoading(true);
    try {
      const { data: tp } = await supabase
        .from("tutor_profiles")
        .select("subjects, availability")
        .eq("id", userId)
        .single();

      if (tp) {
        setSubjects(tp.subjects ?? []);
        setAvail(tp.availability ?? {});
      }

      const { count: sessionCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("tutor_id", userId)
        .eq("status", "completed");

      const { data: sessionRows } = await supabase
        .from("sessions")
        .select("student_profile_id, student_id")
        .eq("tutor_id", userId);

      const uniqueStudents = new Set([
        ...(sessionRows?.map((s) => s.student_profile_id).filter(Boolean) ?? []),
        ...(sessionRows?.map((s) => s.student_id).filter(Boolean) ?? []),
      ]).size;

      setStats({ sessions: sessionCount ?? 0, students: uniqueStudents });
    } finally {
      setLoading(false);
    }
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

  const availabilityRows = DAYS_ORDER.map((day) => {
    const slot = availability[day];
    return slot
      ? { day, times: `${slot.start} – ${slot.end}`, active: true }
      : { day, times: "Unavailable", active: false };
  });

  const STATS_DISPLAY = [
    { value: String(stats.sessions), label: "Sessions", color: PRIMARY    },
    { value: String(stats.students), label: "Students", color: "#7c3aed"  },
    { value: "—",                    label: "Rating",   color: "#f59e0b"  },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.settingsGear}
            onPress={() => router.push("/profile-settings" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>

          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroEmail}>{email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Tutor</Text>
          </View>

          <View style={styles.statsRow}>
            {STATS_DISPLAY.map((s, i) => (
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
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Subjects</Text>
            <TouchableOpacity onPress={() => router.push("/edit-subjects" as any)} activeOpacity={0.7}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          {subjects.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="add-circle-outline" size={22} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>No subjects yet — tap <Text style={{ color: PRIMARY, fontWeight: "600" }}>Edit</Text> to add some</Text>
            </View>
          ) : (
            <View style={styles.chipRow}>
              {subjects.map((s) => {
                const tier = SUBJECT_TIER[s] ?? "Basic";
                const ts = TIER_STYLE[tier];
                return (
                  <View key={s} style={[styles.subjectChip, { backgroundColor: ts.bg }]}>
                    <Text style={[styles.subjectChipText, { color: ts.color }]}>{s}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* My Availability */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Availability</Text>
            <TouchableOpacity onPress={() => router.push("/edit-availability" as any)} activeOpacity={0.7}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.availList}>
            {availabilityRows.map((row, i) => (
              <View key={row.day}>
                <View style={styles.availRow}>
                  <Text style={[styles.availDay, !row.active && styles.mutedText]}>{row.day}</Text>
                  <Text style={[styles.availTimes, !row.active && styles.mutedText]}>{row.times}</Text>
                  <View style={[styles.availDot, { backgroundColor: row.active ? "#10b981" : "#e2e8f0" }]} />
                </View>
                {i < availabilityRows.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Settings</Text>
          <View style={styles.settingsList}>
            {[
              { icon: "person-outline",        label: "Edit Profile",   route: "/profile-edit"          },
              { icon: "notifications-outline", label: "Notifications",  route: "/profile-notifications" },
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
  settingsGear: {
    position: "absolute", top: 16, right: 16,
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
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
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  heroName:  { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  heroEmail: { fontSize: 13, color: "#64748b" },
  roleBadge: { backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  roleBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  statsRow: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 18, marginTop: 10, width: "100%", paddingVertical: 14,
  },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center" },
  statDivider: { width: 1, height: 32, backgroundColor: "#e2e8f0" },
  statContent: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  editLink: { fontSize: 13, color: PRIMARY, fontWeight: "600" },
  emptyText: { color: "#94a3b8", fontSize: 13 },
  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f8fafc", borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  emptyBoxText: { color: "#94a3b8", fontSize: 13, flex: 1 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  subjectChipText: { fontSize: 13, fontWeight: "600" },

  availList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 18, overflow: "hidden" },
  availRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  availDay: { width: 38, fontSize: 13, fontWeight: "700", color: "#0f172a" },
  availTimes: { flex: 1, fontSize: 13, color: "#475569" },
  mutedText: { color: "#cbd5e1" },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },

  settingsList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 18, overflow: "hidden" },
  settingsRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
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
