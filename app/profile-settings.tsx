import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/auth";

const PRIMARY = "#014aad";
const ICON_BG = "#eef2ff";

const ITEMS = [
  { icon: "notifications-outline", label: "Notification Setting", route: "/profile-notifications" },
  { icon: "lock-closed-outline",   label: "Password Manager",     route: "/profile-password" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/welcome");
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "Type DELETE to confirm. This action is irreversible.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    await signOut();
                    router.replace("/welcome");
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main options */}
        <View style={styles.card}>
          {ITEMS.map((item, i, arr) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon as any} size={20} color={PRIMARY} />
                </View>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <View style={[styles.card, styles.cardSpacing]}>
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleSignOut}>
            <View style={[styles.iconCircle, styles.iconCircleWarn]}>
              <Ionicons name="log-out-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={[styles.rowLabel, styles.rowLabelWarn]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Delete account — subtle, at the bottom */}
        <TouchableOpacity style={styles.deleteRow} activeOpacity={0.6} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
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
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 },

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
  cardSpacing: { marginTop: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 14,
  },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 68 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleWarn: { backgroundColor: "#fffbeb" },
  rowLabel:     { flex: 1, fontSize: 15, fontWeight: "600", color: "#191c1e" },
  rowLabelWarn: { color: "#f59e0b" },

  deleteRow: { alignItems: "center", paddingVertical: 8, marginTop: 24 },
  deleteText: { fontSize: 13, color: "#ef4444", fontWeight: "600" },
});
