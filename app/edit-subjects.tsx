import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { USE_MOCK } from "../constants/mockData";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

const ALL_SUBJECTS = {
  "Basic (K–8)": {
    tier: "Basic",
    color: "#0369a1",
    bg: "#e0f2fe",
    items: ["Math", "Reading & Writing", "Science", "Social Studies", "Spelling"],
  },
  "Upper (9–12)": {
    tier: "Upper",
    color: "#7c3aed",
    bg: "#ede9fe",
    items: ["Algebra I / II", "Geometry", "Pre-Calculus / Calculus", "Biology", "Chemistry", "Physics", "English / Literature", "US History / World History"],
  },
  "SAT / Test Prep": {
    tier: "SAT",
    color: "#b45309",
    bg: "#fef3c7",
    items: ["SAT Math", "SAT Reading & Writing", "ACT", "PSAT"],
  },
};

export default function EditSubjectsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("tutor_profiles")
      .select("subjects")
      .eq("id", userId)
      .single();
    if (data?.subjects) setSelected(new Set(data.subjects));
  }

  function toggle(subject: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  }

  async function handleSave() {
    if (selected.size === 0) {
      Alert.alert("No subjects selected", "Please select at least one subject.");
      return;
    }
    if (USE_MOCK) {
      Alert.alert("Saved!", "Your subjects have been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      Alert.alert("Error", "You must be logged in to save changes.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("tutor_profiles")
      .upsert({ id: userId, subjects: Array.from(selected) })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    Alert.alert("Saved!", "Your subjects have been updated.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subjects</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.hint}>Tap subjects to add or remove them from your profile.</Text>

        {(Object.entries(ALL_SUBJECTS) as [string, typeof ALL_SUBJECTS[keyof typeof ALL_SUBJECTS]][]).map(
          ([tierLabel, { color, bg, items }]) => (
            <View key={tierLabel} style={styles.tierBlock}>
              <Text style={[styles.tierLabel, { color }]}>{tierLabel}</Text>
              <View style={styles.chipRow}>
                {items.map((subject) => {
                  const active = selected.has(subject);
                  return (
                    <TouchableOpacity
                      key={subject}
                      style={[
                        styles.chip,
                        active ? { backgroundColor: bg, borderColor: color } : styles.chipInactive,
                      ]}
                      onPress={() => toggle(subject)}
                      activeOpacity={0.75}
                    >
                      {active && (
                        <Ionicons name="checkmark-circle" size={13} color={color} />
                      )}
                      <Text style={[styles.chipText, active ? { color } : styles.chipTextInactive]}>
                        {subject}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )
        )}

        <View style={styles.countRow}>
          <Text style={styles.countText}>{selected.size} subject{selected.size !== 1 ? "s" : ""} selected</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  hint: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 24,
    marginTop: 4,
    lineHeight: 19,
  },

  tierBlock: {
    marginBottom: 24,
  },
  tierLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipInactive: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextInactive: { color: "#94a3b8" },

  countRow: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 4,
  },
  countText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },

  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
