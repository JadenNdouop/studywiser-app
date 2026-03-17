import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>J</Text>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.subtitle}>john.doe@example.com</Text>

        <View style={styles.divider} />

        {[
          { icon: "person-outline", label: "Edit Profile" },
          { icon: "notifications-outline", label: "Notifications" },
          { icon: "shield-checkmark-outline", label: "Privacy & Security" },
          { icon: "help-circle-outline", label: "Help & Support" },
          { icon: "log-out-outline", label: "Log Out" },
        ].map((item) => (
          <View key={item.label} style={styles.row}>
            <Ionicons name={item.icon as any} size={20} color={PRIMARY} />
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: PRIMARY, fontSize: 34, fontWeight: "700" },
  name: { color: "#0f172a", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#64748b", fontSize: 14 },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 24,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 14,
  },
  rowLabel: { flex: 1, fontSize: 15, color: "#1e293b", fontWeight: "500" },
});
