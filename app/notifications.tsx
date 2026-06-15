import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

const PRIMARY  = "#014aad";
const LAVENDER = "#eef2ff";

type NotifType = "session_confirmed" | "session_reminder" | "payment_due" | "message" | "match_found";

type NotifRow = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

type NotifGroup = { label: string; items: NotifRow[] };

const ICON_MAP: Record<NotifType, { name: string; color: string; bg: string }> = {
  session_confirmed: { name: "checkmark-circle-outline", color: "#10b981", bg: "#d1fae5" },
  session_reminder:  { name: "calendar-outline",         color: PRIMARY,   bg: "#d1d9ff" },
  payment_due:       { name: "card-outline",             color: "#f59e0b", bg: "#fef3c7" },
  message:           { name: "chatbubble-outline",       color: "#8b5cf6", bg: "#ede9fe" },
  match_found:       { name: "people-outline",           color: PRIMARY,   bg: "#d1d9ff" },
};

function timeAgoLabel(created_at: string): string {
  const diff = Date.now() - new Date(created_at).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function dayLabel(created_at: string): string {
  const d     = new Date(created_at);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff  = Math.floor((today.getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function groupNotifications(rows: NotifRow[]): NotifGroup[] {
  const map: Record<string, NotifRow[]> = {};
  const order: string[] = [];
  for (const row of rows) {
    const label = dayLabel(row.created_at);
    if (!map[label]) { map[label] = []; order.push(label); }
    map[label].push(row);
  }
  return order.map((label) => ({ label, items: map[label] }));
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotifRow[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    loadNotifications();
  }, [profile?.id]);

  async function loadNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, created_at, read")
      .eq("user_id", profile!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unread.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).in("id", unread);
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  const newCount = notifications.filter((n) => !n.read).length;
  const groups   = groupNotifications(notifications);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {newCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{newCount} new</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-outline" size={34} color={PRIMARY} />
            </View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyBody}>You don't have any notifications yet.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label}>
              <View style={styles.groupRow}>
                <View style={styles.groupPill}>
                  <Text style={styles.groupPillText}>{group.label}</Text>
                </View>
                {group.label === "Today" && group.items.some((i) => !i.read) && (
                  <TouchableOpacity onPress={markAllRead}>
                    <Text style={styles.markAll}>Mark all read</Text>
                  </TouchableOpacity>
                )}
              </View>

              {group.items.map((item) => {
                const ic = ICON_MAP[item.type] ?? ICON_MAP.session;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.item, !item.read && styles.itemNew]}
                    activeOpacity={0.75}
                    onPress={() => markRead(item.id)}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: ic.bg }]}>
                      <Ionicons name={ic.name as any} size={20} color={ic.color} />
                    </View>
                    <View style={styles.itemBody}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemText} numberOfLines={3}>{item.body}</Text>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.timeAgo}>{timeAgoLabel(item.created_at)}</Text>
                      {!item.read && <View style={styles.dot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: LAVENDER, alignItems: "center", justifyContent: "center",
  },
  title: { flex: 1, fontSize: 20, fontWeight: "800", color: PRIMARY },
  badge: { backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  groupRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginTop: 20, marginBottom: 8,
  },
  groupPill: { backgroundColor: LAVENDER, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  groupPillText: { color: PRIMARY, fontSize: 13, fontWeight: "700" },
  markAll: { color: PRIMARY, fontSize: 13, fontWeight: "600" },

  item: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 14, paddingHorizontal: 20, paddingVertical: 14,
  },
  itemNew: { backgroundColor: "#f8faff" },
  iconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  itemBody:  { flex: 1, gap: 3 },
  itemTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  itemText:  { fontSize: 13, color: "#64748b", lineHeight: 18 },
  itemRight: { alignItems: "flex-end", gap: 6, flexShrink: 0, marginTop: 2 },
  timeAgo:   { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },

  emptyContainer: { alignItems: "center", paddingTop: 100, gap: 14 },
  emptyIconWrap:  {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: LAVENDER, alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  emptyBody:  { fontSize: 14, color: "#94a3b8", textAlign: "center" },
});
