import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";

const INITIAL = [
  { key: "general",  label: "General Notification", on: true },
  { key: "sound",    label: "Sound",                 on: true },
  { key: "calls",    label: "Sound Call",            on: true },
  { key: "vibrate",  label: "Vibrate",               on: false },
  { key: "offers",   label: "Special Offers",        on: false },
  { key: "payments", label: "Payments",              on: true },
  { key: "promo",    label: "Promo And Discount",    on: false },
  { key: "cashback", label: "Cashback",              on: true },
];

export default function NotificationSettingScreen() {
  const [settings, setSettings] = useState(INITIAL);

  const toggle = (key: string) =>
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, on: !s.on } : s))
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Setting</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {settings.map((item) => (
          <View key={item.key} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Switch
              value={item.on}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: "#e2e8f0", true: PRIMARY }}
              thumbColor="#fff"
            />
          </View>
        ))}
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
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  scroll: { paddingHorizontal: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowLabel: { fontSize: 15, color: "#1e293b", fontWeight: "500" },
});
