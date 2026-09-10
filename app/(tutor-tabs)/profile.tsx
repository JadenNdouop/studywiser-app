import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SWButton, SWHeader, SWSectionHeader, getInitials } from "../../components/sw";
import { MOCK_TUTOR_PROFILE, USE_MOCK } from "../../constants/mockData";
import { SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";
import { useAvatarUrl } from "../../lib/useAvatarUrl";

const PRIMARY = SW.color.primary;

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
  Basic: { color: SW.color.onMint,  bg: SW.color.mint },
  Upper: { color: SW.color.primary, bg: SW.color.lavender },
  SAT:   { color: SW.color.onCoral, bg: SW.color.coral },
};

const SETTINGS_ITEMS = [
  { icon: "person-outline",        label: "Edit Profile",   route: "/profile-edit",          tint: SW.color.lavenderSoft, fg: SW.color.primary },
  { icon: "notifications-outline", label: "Notifications",  route: "/profile-notifications", tint: SW.color.mintSoft,     fg: SW.color.onMint },
  { icon: "help-circle-outline",   label: "Help & Support", route: "/profile-help",          tint: SW.color.coralSoft,    fg: SW.color.onCoral },
];

export default function TutorProfileScreen() {
  const { profile, signOut } = useAuth();
  const name  = profile?.full_name ?? "Tutor";
  const email = profile?.email     ?? "";
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

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
    if (USE_MOCK) {
      setSubjects(MOCK_TUTOR_PROFILE.subjects);
      setAvail(MOCK_TUTOR_PROFILE.availability);
      setStats(MOCK_TUTOR_PROFILE.stats);
      setLoading(false);
      return;
    }
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
      ? { day, times: `${formatTime(slot.start)} – ${formatTime(slot.end)}`, active: true }
      : { day, times: "Unavailable", active: false };
  });

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <SWHeader initials={getInitials(name)} />

        {/* Identity */}
        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.avatarEdit}
              onPress={() => router.push("/profile-edit" as any)}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroName}>{name}</Text>
          {email ? <Text style={styles.heroEmail}>{email}</Text> : null}
          <View style={styles.statsBadge}>
            <Ionicons name="star" size={14} color={SW.color.onMint} />
            <Text style={styles.statsBadgeText}>
              {stats.sessions} Session{stats.sessions !== 1 ? "s" : ""} · {stats.students} Student{stats.students !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* My Subjects */}
        <View style={styles.section}>
          <SWSectionHeader
            title="My Subjects"
            actionLabel="Edit"
            onAction={() => router.push("/edit-subjects" as any)}
          />

          {subjects.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="add-circle-outline" size={22} color={SW.color.muted} />
              <Text style={styles.emptyBoxText}>
                No subjects yet — tap <Text style={{ color: PRIMARY, fontFamily: SW.font.bold }}>Edit</Text> to add some
              </Text>
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
              <TouchableOpacity
                style={styles.addChip}
                onPress={() => router.push("/edit-subjects" as any)}
              >
                <Ionicons name="add" size={18} color={SW.color.muted} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <SWSectionHeader
            title="Availability"
            actionLabel="Edit Hours"
            onAction={() => router.push("/edit-availability" as any)}
          />

          <View style={styles.availCard}>
            {availabilityRows.map((row, i) => (
              <View key={row.day}>
                <View style={styles.availRow}>
                  <View>
                    <Text style={[styles.availDay, !row.active && styles.mutedText]}>{row.day}</Text>
                    <Text style={[styles.availTimes, !row.active && styles.mutedText]}>{row.times}</Text>
                  </View>
                  <View style={[styles.availPill, { backgroundColor: row.active ? SW.color.success : SW.color.surfaceContainer }]}>
                    <View style={[styles.availKnob, row.active ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]} />
                  </View>
                </View>
                {i < availabilityRows.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
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
          label="Sign Out"
          icon="log-out-outline"
          variant="danger"
          onPress={handleSignOut}
          style={{ marginHorizontal: SW.space.margin }}
        />

      </ScrollView>
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
    backgroundColor: SW.color.mint,
    borderWidth: 4, borderColor: SW.color.card,
    alignItems: "center", justifyContent: "center",
    ...SW.shadow(SW.color.mint, 0.5),
  },
  avatarText: { fontFamily: SW.font.bold, fontSize: 36, color: SW.color.onMint },
  avatarImage: { width: "100%", height: "100%", borderRadius: 54 },
  avatarEdit: {
    position: "absolute", right: 0, bottom: 2,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: SW.color.card,
  },
  heroName:  { ...SW.type.headlineLg, fontSize: 26, color: SW.color.onSurface },
  heroEmail: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted },
  statsBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 8, backgroundColor: SW.color.mint,
    borderRadius: SW.radius.full, paddingHorizontal: 16, paddingVertical: 8,
  },
  statsBadgeText: { ...SW.type.labelMd, color: SW.color.onMint },

  section: { paddingHorizontal: SW.space.margin, marginBottom: 28 },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: SW.color.surfaceLow, borderRadius: SW.radius.md,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  emptyBoxText: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, flex: 1 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  subjectChip: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: SW.radius.full },
  subjectChipText: { ...SW.type.labelMd, fontSize: 14 },
  addChip: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderStyle: "dashed", borderColor: SW.color.outline,
    alignItems: "center", justifyContent: "center",
  },

  availCard: {
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    paddingHorizontal: 18, overflow: "hidden",
    ...SW.shadow(SW.color.outline, 0.22),
  },
  availRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14,
  },
  availDay: { ...SW.type.bodyLg, fontFamily: SW.font.bold, fontSize: 16, color: SW.color.onSurface },
  availTimes: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.onSurfaceVariant, marginTop: 2 },
  mutedText: { color: SW.color.muted },
  availPill: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: "center" },
  availKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  divider: { height: 1, backgroundColor: SW.color.surfaceLow },

  settingsCard: {
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    paddingHorizontal: 18, overflow: "hidden",
    ...SW.shadow(SW.color.outline, 0.22),
  },
  settingsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 14 },
  settingsIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  settingsLabel: { flex: 1, ...SW.type.bodyMd, fontSize: 15, fontFamily: SW.font.semibold, color: SW.color.onSurface },
});
