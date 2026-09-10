import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SWButton, SWHeader, SWSectionHeader, avatarTint, getInitials, subjectTint } from "../../components/sw";
import { SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { supabase } from "../../lib/supabase";
import { useAvatarUrl } from "../../lib/useAvatarUrl";

const PRIMARY = SW.color.primary;

type Tutor = { id: string; name: string; subject: string; sessions: number };

const SETTINGS_ITEMS = [
  { icon: "person-outline",        label: "Edit Profile",   route: "/profile-edit",          tint: SW.color.lavenderSoft, fg: SW.color.primary },
  { icon: "notifications-outline", label: "Notifications",  route: "/profile-notifications", tint: SW.color.mintSoft,     fg: SW.color.onMint },
  { icon: "settings-outline",      label: "Settings",       route: "/profile-settings",      tint: SW.color.coralSoft,    fg: SW.color.onCoral },
  { icon: "help-circle-outline",   label: "Help & Support", route: "/profile-help",          tint: SW.color.mintSoft,     fg: SW.color.onMint },
];

const LINK_PARENT_ITEM = {
  icon: "link-outline", label: "Link to Parent", route: "/link-student-code",
  tint: SW.color.coralSoft, fg: SW.color.onCoral,
};

export default function StudentProfileScreen() {
  const { profile, signOut } = useAuth();
  const displayName  = profile?.full_name ?? "Student";
  const displayEmail = profile?.email     ?? "";
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  const [stats,    setStats]    = useState({ sessions: 0, hours: 0, tutors: 0 });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tutors,   setTutors]   = useState<Tutor[]>([]);
  const [linkedToParent, setLinkedToParent] = useState(true); // assume linked until we know otherwise, to avoid a flash

  useFocusEffect(
    useCallback(() => {
      loadData();
      checkLinked();
    }, [profile?.id])
  );

  async function checkLinked() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    setLinkedToParent(!!data);
  }

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

  const STATS_TILES = [
    { value: stats.sessions, label: "SESSIONS", bg: SW.color.surfaceContainer, fg: SW.color.onSurfaceVariant },
    { value: stats.hours,    label: "HOURS",    bg: SW.color.mint,             fg: SW.color.onMint },
    { value: stats.tutors,   label: "TUTORS",   bg: SW.color.coral,            fg: SW.color.onCoral },
  ];

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
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{displayEmail || "Student"}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS_TILES.map((s) => (
            <View key={s.label} style={[styles.statTile, { backgroundColor: s.bg, ...SW.shadow(s.bg, 0.4) }]}>
              <Text style={[styles.statValue, { color: s.fg }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: s.fg }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* My Subjects */}
        <View style={styles.section}>
          <SWSectionHeader title="My Subjects" />
          {subjects.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="book-outline" size={20} color={SW.color.muted} />
              <Text style={styles.emptyBoxText}>Subjects you&apos;ve studied will appear here.</Text>
            </View>
          ) : (
            <View style={styles.chipRow}>
              {subjects.map((s) => {
                const ts = subjectTint(s);
                return (
                  <View key={s} style={[styles.subjectChip, { backgroundColor: ts.bg }]}>
                    <Text style={[styles.subjectChipText, { color: ts.fg }]}>{s}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* My Tutors */}
        <View style={styles.section}>
          <SWSectionHeader title="My Tutors" />
          {tutors.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={20} color={SW.color.muted} />
              <Text style={styles.emptyBoxText}>Your tutors will appear here after your first session.</Text>
            </View>
          ) : (
            <View style={{ gap: SW.space.stack }}>
              {tutors.map((t) => {
                const tint = avatarTint(t.id);
                return (
                  <View key={t.id} style={styles.tutorCard}>
                    <View style={[styles.tutorAvatar, { backgroundColor: tint.bg }]}>
                      <Text style={[styles.tutorAvatarText, { color: tint.fg }]}>{getInitials(t.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tutorName}>{t.name}</Text>
                      <Text style={styles.tutorSubject}>{t.subject}</Text>
                    </View>
                    <Text style={styles.tutorSessions}>{t.sessions} session{t.sessions !== 1 ? "s" : ""}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            {(linkedToParent ? SETTINGS_ITEMS : [LINK_PARENT_ITEM, ...SETTINGS_ITEMS]).map((item, i, arr) => (
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
          label="Sign out"
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

  identity: { alignItems: "center", marginBottom: 24, gap: 4 },
  avatarWrap: { marginBottom: 10 },
  avatarCircle: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: SW.color.coral,
    borderWidth: 4, borderColor: SW.color.card,
    alignItems: "center", justifyContent: "center",
    ...SW.shadow(SW.color.coral, 0.5),
  },
  avatarText: { fontFamily: SW.font.bold, fontSize: 36, color: SW.color.onCoral },
  avatarImage: { width: "100%", height: "100%", borderRadius: 54 },
  avatarEdit: {
    position: "absolute", right: 0, bottom: 2,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: SW.color.card,
  },
  heroName: { ...SW.type.headlineLg, fontSize: 26, color: SW.color.onSurface },
  heroEmail: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted },

  statsRow: { flexDirection: "row", marginHorizontal: SW.space.margin, gap: 12, marginBottom: 28 },
  statTile: {
    flex: 1, borderRadius: SW.radius.xl,
    paddingVertical: 20, alignItems: "center", gap: 2,
  },
  statValue: { fontFamily: SW.font.bold, fontSize: 24 },
  statLabel: { ...SW.type.labelSm, fontSize: 11, letterSpacing: 0.8 },

  section: { paddingHorizontal: SW.space.margin, marginBottom: 28 },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: SW.color.surfaceLow, borderRadius: SW.radius.md,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  emptyBoxText: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, flex: 1 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  subjectChip: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: SW.radius.full },
  subjectChipText: { ...SW.type.labelMd, fontSize: 14 },

  tutorCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    paddingHorizontal: 16, paddingVertical: 14,
    ...SW.shadow(SW.color.outline, 0.2),
  },
  tutorAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  tutorAvatarText: { fontFamily: SW.font.bold, fontSize: 16 },
  tutorName: { ...SW.type.bodyLg, fontFamily: SW.font.bold, fontSize: 15, color: SW.color.onSurface },
  tutorSubject: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, marginTop: 1 },
  tutorSessions: { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted },

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
  divider: { height: 1, backgroundColor: SW.color.surfaceLow },
});
