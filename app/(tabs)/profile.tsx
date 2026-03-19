import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";

const PRIMARY = "#014aad";
const ICON_BG = "#eef2ff";

const MENU: { icon: string; label: string; route?: string; danger?: boolean }[] = [
  { icon: "person-outline",            label: "Profile",         route: "/profile-edit" },
  { icon: "heart-outline",             label: "Favourite",       route: undefined },
  { icon: "wallet-outline",            label: "Payment Method",  route: undefined },
  { icon: "shield-checkmark-outline",  label: "Privacy Policy",  route: "/profile-privacy" },
  { icon: "settings-outline",          label: "Settings",        route: "/profile-settings" },
  { icon: "help-circle-outline",       label: "Help",            route: "/profile-help" },
  { icon: "log-out-outline",           label: "Logout",          danger: true },
];

export default function ProfileScreen() {
  const [showLogout, setShowLogout] = useState(false);
  const { profile, signOut } = useAuth();

  const displayName = profile?.full_name ?? "My Profile";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <TouchableOpacity style={styles.cameraBadge}>
              <Ionicons name="camera-outline" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{displayName}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => {
                if (item.danger) {
                  setShowLogout(true);
                } else if (item.route) {
                  router.push(item.route as any);
                }
              }}
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
      </ScrollView>

      {/* Logout modal */}
      <Modal visible={showLogout} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Logout</Text>
            <Text style={styles.sheetBody}>are you sure you want to log out?</Text>
            <View style={styles.sheetBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogout(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={async () => {
                  setShowLogout(false);
                  await signOut();
                  router.replace("/welcome");
                }}
              >
                <Text style={styles.logoutText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSpacer: { flex: 1 },
  headerTitle: { color: PRIMARY, fontSize: 18, fontWeight: "700" },

  avatarSection: { alignItems: "center", paddingVertical: 28, gap: 12 },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: PRIMARY, fontSize: 36, fontWeight: "700" },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: { color: "#0f172a", fontSize: 20, fontWeight: "700" },

  menu: { paddingHorizontal: 20, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
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

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  sheetTitle: { color: PRIMARY, fontSize: 22, fontWeight: "700" },
  sheetBody: { color: "#64748b", fontSize: 14, marginBottom: 8 },
  sheetBtns: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1,
    backgroundColor: ICON_BG,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelText: { color: PRIMARY, fontSize: 15, fontWeight: "600" },
  logoutBtn: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
