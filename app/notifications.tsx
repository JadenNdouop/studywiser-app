import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY   = "#014aad";
const LAVENDER  = "#eef2ff";
const ICON_BG   = "#d1d9ff";

/* ─── Types ─── */
type NotifItem = {
  id: string;
  type: "session" | "change" | "notes" | "message" | "confirmed";
  title: string;
  body: string;
  timeAgo: string;
  isNew: boolean;
};
type NotifGroup = { label: string; items: NotifItem[] };

/* ─── Data ─── */
const GROUPS: NotifGroup[] = [
  {
    label: "Today",
    items: [
      {
        id: "n1",
        type: "session",
        title: "Session Reminder",
        body: "Your session with Bradley Davis starts in 30 minutes. Make sure you're ready to join.",
        timeAgo: "2 M",
        isNew: true,
      },
      {
        id: "n2",
        type: "change",
        title: "Session Rescheduled",
        body: "Evelyn Park has requested to move Wednesday's session to 5:00 PM. Tap to review.",
        timeAgo: "2 H",
        isNew: true,
      },
      {
        id: "n3",
        type: "notes",
        title: "Session Notes Shared",
        body: "Amina Khan's parent has uploaded practice worksheets for Thursday's Pre-Algebra session.",
        timeAgo: "3 H",
        isNew: false,
      },
    ],
  },
  {
    label: "Yesterday",
    items: [
      {
        id: "n4",
        type: "confirmed",
        title: "Session Confirmed",
        body: "Your session with Liam Johnson on Friday at 4:00 PM has been confirmed and added to your schedule.",
        timeAgo: "1 D",
        isNew: false,
      },
    ],
  },
  {
    label: "March 14",
    items: [
      {
        id: "n5",
        type: "message",
        title: "New Message",
        body: "Isabella Cruz's parent sent you a message about preferred learning materials for the upcoming session.",
        timeAgo: "5 D",
        isNew: false,
      },
    ],
  },
];

/* ─── Icon config per type ─── */
const ICON_MAP: Record<NotifItem["type"], { name: string; color: string; bg: string }> = {
  session:   { name: "calendar-outline",       color: PRIMARY,   bg: ICON_BG },
  change:    { name: "calendar-clear-outline",  color: "#f59e0b", bg: "#fef3c7" },
  notes:     { name: "document-text-outline",   color: PRIMARY,   bg: ICON_BG },
  message:   { name: "chatbubble-outline",       color: "#8b5cf6", bg: "#ede9fe" },
  confirmed: { name: "checkmark-circle-outline", color: "#10b981", bg: "#d1fae5" },
};

/* ─── Screen ─── */
export default function NotificationsScreen() {
  const router = useRouter();
  const newCount = GROUPS.flatMap((g) => g.items).filter((i) => i.isNew).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={PRIMARY} />
        </TouchableOpacity>

        <Text style={styles.title}>Notification</Text>

        {newCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>News  •</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {GROUPS.map((group) => (
          <View key={group.label}>
            {/* Date label + Mark all */}
            <View style={styles.groupRow}>
              <View style={styles.groupPill}>
                <Text style={styles.groupPillText}>{group.label}</Text>
              </View>
              {group.label === "Today" && (
                <TouchableOpacity>
                  <Text style={styles.markAll}>Mark all</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Items */}
            {group.items.map((item) => {
              const ic = ICON_MAP[item.type];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.item, item.isNew && styles.itemNew]}
                  activeOpacity={0.75}
                >
                  {/* Icon avatar */}
                  <View style={[styles.iconWrap, { backgroundColor: ic.bg }]}>
                    <Ionicons name={ic.name as any} size={20} color={ic.color} />
                  </View>

                  {/* Text */}
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemText} numberOfLines={3}>
                      {item.body}
                    </Text>
                  </View>

                  {/* Time + unread dot */}
                  <View style={styles.itemRight}>
                    <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                    {item.isNew && <View style={styles.dot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: LAVENDER,
    alignItems: "center", justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
  },
  badge: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // Group
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  groupPill: {
    backgroundColor: LAVENDER,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  groupPillText: { color: PRIMARY, fontSize: 13, fontWeight: "700" },
  markAll: { color: PRIMARY, fontSize: 13, fontWeight: "600" },

  // Item
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  itemNew: {
    backgroundColor: "#f8faff",
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  itemText:  { fontSize: 13, color: "#64748b", lineHeight: 18 },

  itemRight: { alignItems: "flex-end", gap: 6, flexShrink: 0, marginTop: 2 },
  timeAgo:   { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: PRIMARY,
  },
});
