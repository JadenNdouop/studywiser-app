import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

/**
 * Floating dev-only control for instantly signing in as one of a handful of
 * real test accounts (one per role) instead of typing credentials every
 * time. Create the accounts once through the normal signup flow, then save
 * them here. Rendered globally from the root layout and automatically
 * stripped from production builds via the __DEV__ guard.
 */

const STORAGE_KEY = "sw_dev_test_accounts";

type SavedAccount = { id: string; label: string; email: string; password: string };

const ROLE_ROUTE: Record<string, string> = {
  student: "/(student-tabs)",
  tutor: "/(tutor-tabs)",
  parent: "/(parent-tabs)",
};

export default function DevRoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [signingInId, setSigningInId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!__DEV__) return;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setAccounts(JSON.parse(raw));
    });
  }, []);

  if (!__DEV__) return null;

  async function persist(next: SavedAccount[]) {
    setAccounts(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function handleSaveAccount() {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter at least an email and password.");
      return;
    }
    const account: SavedAccount = {
      id: `${Date.now()}`,
      label: label.trim() || email.trim(),
      email: email.trim(),
      password,
    };
    await persist([...accounts, account]);
    setLabel("");
    setEmail("");
    setPassword("");
    setAdding(false);
  }

  async function handleRemove(id: string) {
    await persist(accounts.filter((a) => a.id !== id));
  }

  async function handleSignIn(account: SavedAccount) {
    setSigningInId(account.id);
    try {
      await supabase.auth.signOut();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      if (error || !data.user) throw error ?? new Error("Sign in failed.");

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const route = ROLE_ROUTE[profileRow?.role ?? "parent"] ?? "/(parent-tabs)";
      setOpen(false);
      router.replace(route as any);
    } catch (err: any) {
      Alert.alert("Couldn't sign in", err?.message ?? "Check the saved credentials.");
    } finally {
      setSigningInId(null);
    }
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {open && (
        <View style={styles.menu}>
          {accounts.map((a) => (
            <View key={a.id} style={styles.accountRow}>
              <TouchableOpacity
                style={styles.accountBtn}
                activeOpacity={0.85}
                onPress={() => handleSignIn(a)}
                disabled={signingInId !== null}
              >
                {signingInId === a.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.accountText} numberOfLines={1}>{a.label}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(a.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={13} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {adding ? (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="Label (e.g. Test Parent)"
                placeholderTextColor="#94a3b8"
                value={label}
                onChangeText={setLabel}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAccount} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>Save Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addRowBtn}
              activeOpacity={0.85}
              onPress={() => setAdding(true)}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.accountText}>Add Account</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setOpen((v) => !v)}
      >
        <Ionicons name={open ? "close" : "swap-horizontal"} size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 10,
    bottom: 140,
    alignItems: "flex-end",
    zIndex: 9999,
  },
  menu: { gap: 8, marginBottom: 10, alignItems: "flex-end", maxWidth: 220 },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  accountBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    minWidth: 96,
    maxWidth: 170,
    alignItems: "center",
    backgroundColor: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  removeBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#ef4444",
    alignItems: "center", justifyContent: "center",
  },
  accountText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  addRowBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22,
    backgroundColor: "#374151",
  },
  addForm: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 10,
    gap: 6,
    width: 200,
  },
  input: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#fff",
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: "#006b5b",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: 2,
  },
  saveBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.55,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
