import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

const PRIMARY = "#014aad";
const ICON_BG = "#eef2ff";

const ITEMS = [
  { icon: "notifications-outline", label: "Notification Setting", route: "/profile-notifications" },
  { icon: "lock-closed-outline",   label: "Password Manager",     route: "/profile-password" },
];

export default function SettingsScreen() {
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main options */}
        <View style={styles.menu}>
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
        <View style={styles.menu}>
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
  scroll: { paddingBottom: 60, gap: 20, paddingTop: 4 },

  menu: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    backgroundColor: "#fff",
  },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 72 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleWarn: { backgroundColor: "#fffbeb" },
  rowLabel:     { flex: 1, fontSize: 15, fontWeight: "500", color: "#1e293b" },
  rowLabelWarn: { color: "#f59e0b" },

  deleteRow: { alignItems: "center", paddingVertical: 8, marginTop: 20 },
  deleteText: { fontSize: 13, color: "#ef4444", fontWeight: "500" },
});
