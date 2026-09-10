import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const ICON_BG = "#eef2ff";

const INITIAL = [
  { key: "reminders", icon: "time-outline",          label: "Session Reminders",  sub: "Get pinged before your sessions start",  on: true },
  { key: "matches",   icon: "sparkles-outline",       label: "New Match Found",    sub: "When a tutor or student matches you",    on: true },
  { key: "payments",  icon: "card-outline",           label: "Payment Alerts",     sub: "Charges, receipts, and payment issues",  on: true },
  { key: "messages",  icon: "chatbubble-ellipses-outline", label: "Messages",      sub: "New messages from tutors and students",  on: true },
  { key: "email",     icon: "mail-outline",           label: "Email Notifications", sub: "Also send these updates to your email", on: false },
];

export default function NotificationSettingScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(INITIAL);

  const toggle = (key: string) =>
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, on: !s.on } : s))
    );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Choose what StudyWiser lets you know about.
        </Text>

        <View style={styles.card}>
          {settings.map((item, i) => (
            <View key={item.key}>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon as any} size={20} color={PRIMARY} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={item.on}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: "#e2e8f0", true: PRIMARY }}
                  thumbColor="#fff"
                />
              </View>
              {i < settings.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
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
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  intro: { color: "#414751", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 8,
    shadowColor: "#005da7",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, color: "#191c1e", fontWeight: "600" },
  rowSub: { fontSize: 12, color: "#717783", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 68 },
});
