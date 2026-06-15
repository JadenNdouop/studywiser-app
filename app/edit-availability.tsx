import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";
const INPUT_BG = "#f8fafc";

type DayEntry = {
  day: string;
  fullDay: string;
  active: boolean;
  start: string;
  end: string;
};

const DAY_META = [
  { day: "Mon", fullDay: "Monday"    },
  { day: "Tue", fullDay: "Tuesday"   },
  { day: "Wed", fullDay: "Wednesday" },
  { day: "Thu", fullDay: "Thursday"  },
  { day: "Fri", fullDay: "Friday"    },
  { day: "Sat", fullDay: "Saturday"  },
  { day: "Sun", fullDay: "Sunday"    },
];

function buildDefaultDays(avail: Record<string, { start: string; end: string }>): DayEntry[] {
  return DAY_META.map(({ day, fullDay }) => {
    const slot = avail[day];
    return slot
      ? { day, fullDay, active: true,  start: slot.start, end: slot.end }
      : { day, fullDay, active: false, start: "",          end: ""       };
  });
}

export default function EditAvailabilityScreen() {
  const { profile } = useAuth();
  const [days,   setDays]   = useState<DayEntry[]>(buildDefaultDays({}));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("tutor_profiles")
      .select("availability")
      .eq("id", userId)
      .single();
    if (data?.availability) setDays(buildDefaultDays(data.availability));
  }

  function toggleDay(index: number, value: boolean) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === index
          ? { ...d, active: value, start: value ? "9:00 AM" : "", end: value ? "5:00 PM" : "" }
          : d
      )
    );
  }

  function updateTime(index: number, field: "start" | "end", value: string) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  async function handleSave() {
    const active = days.filter((d) => d.active);
    if (active.length === 0) {
      Alert.alert("No availability set", "Please enable at least one day.");
      return;
    }
    const incomplete = active.find((d) => !d.start.trim() || !d.end.trim());
    if (incomplete) {
      Alert.alert("Missing times", `Please enter start and end times for ${incomplete.fullDay}.`);
      return;
    }

    // Convert to JSONB: { Mon: { start, end }, ... }
    const availability: Record<string, { start: string; end: string }> = {};
    active.forEach((d) => { availability[d.day] = { start: d.start.trim(), end: d.end.trim() }; });

    const { data: { user } } = await supabase.auth.getUser();
    const userId = profile?.id ?? user?.id;
    if (!userId) {
      Alert.alert("Error", "You must be logged in to save changes.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("tutor_profiles")
      .upsert({ id: userId, availability })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    Alert.alert("Saved!", "Your availability has been updated.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Availability</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.hint}>Set the days and hours you're available to tutor.</Text>

        <View style={styles.list}>
          {days.map((day, index) => (
            <View key={day.day}>
              <View style={styles.dayRow}>
                <View style={[styles.dayPill, !day.active && styles.dayPillOff]}>
                  <Text style={[styles.dayPillText, !day.active && styles.dayPillTextOff]}>
                    {day.day}
                  </Text>
                </View>
                <Text style={[styles.dayFullLabel, !day.active && styles.dayFullLabelOff]}>
                  {day.fullDay}
                </Text>
                <Switch
                  value={day.active}
                  onValueChange={(v) => toggleDay(index, v)}
                  trackColor={{ false: "#e2e8f0", true: PRIMARY }}
                  thumbColor="#fff"
                />
              </View>

              {day.active && (
                <View style={styles.timeRow}>
                  <View style={styles.timeField}>
                    <Text style={styles.timeLabel}>Start</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={day.start}
                      onChangeText={(v) => updateTime(index, "start", v)}
                      placeholder="e.g. 3:00 PM"
                      placeholderTextColor="#cbd5e1"
                    />
                  </View>
                  <View style={styles.timeSeparator}>
                    <Text style={styles.timeSeparatorText}>–</Text>
                  </View>
                  <View style={styles.timeField}>
                    <Text style={styles.timeLabel}>End</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={day.end}
                      onChangeText={(v) => updateTime(index, "end", v)}
                      placeholder="e.g. 7:00 PM"
                      placeholderTextColor="#cbd5e1"
                    />
                  </View>
                </View>
              )}

              {index < days.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
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
    marginBottom: 20,
    marginTop: 4,
    lineHeight: 19,
  },

  list: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 28,
  },

  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dayPill: {
    width: 44,
    height: 32,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillOff: { backgroundColor: "#f8fafc" },
  dayPillText: { fontSize: 13, fontWeight: "700", color: PRIMARY },
  dayPillTextOff: { color: "#cbd5e1" },
  dayFullLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1e293b" },
  dayFullLabelOff: { color: "#cbd5e1" },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  timeField: { flex: 1 },
  timeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeInput: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  timeSeparator: {
    paddingTop: 22,
  },
  timeSeparatorText: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "300",
  },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },

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
