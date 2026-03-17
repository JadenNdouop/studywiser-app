import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const ICON_BG = "#eef2ff";

const ITEMS = [
  { icon: "notifications-outline", label: "Notification Setting", route: "/profile-notifications" },
  { icon: "lock-closed-outline",   label: "Password Manager",     route: "/profile-password" },
  { icon: "trash-outline",         label: "Delete Account",       route: undefined, danger: true },
];

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.menu}>
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => item.route && router.push(item.route as any)}
          >
            <View style={[styles.iconCircle, item.danger && styles.iconCircleDanger]}>
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.danger ? "#ef4444" : PRIMARY}
              />
            </View>
            <Text style={[styles.rowLabel, item.danger && styles.rowLabelDanger]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </View>
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
  menu: { paddingHorizontal: 20, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleDanger: { backgroundColor: "#fff1f1" },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: "#1e293b" },
  rowLabelDanger: { color: "#ef4444" },
});
