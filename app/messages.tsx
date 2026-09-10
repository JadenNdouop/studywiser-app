import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getInitials } from "../components/sw";
import { USE_MOCK } from "../constants/mockData";
import { SW } from "../constants/theme";
import { useAuth } from "../context/auth";

const PRIMARY = SW.color.primary;

type Conversation = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
};

// Mock conversations — replaced by real threads once the backend is live.
const TUTOR_VIEW: Conversation[] = [
  { id: "c1", name: "Liam Williams's Parent", preview: "That would be amazing. He responds really well to visual methods.", time: "9:43", unread: 2 },
  { id: "c2", name: "Emma Chen's Parent",    preview: "Thanks! See you at the next session.",                         time: "Tue", unread: 0 },
  { id: "c3", name: "Aisha Patel's Parent",  preview: "Could we move Thursday to 4pm instead?",                      time: "Mon", unread: 0 },
];

const PARENT_VIEW: Conversation[] = [
  { id: "c1", name: "Jordan Lee", preview: "Got it — I'll send over a practice worksheet after the session!", time: "9:55", unread: 1 },
  { id: "c2", name: "Jordan Lee", preview: "Great focus today. Liam is really improving on fractions.",      time: "Sun", unread: 0 },
];

const AVATAR_COLORS = ["#c7d2fe", "#fde8d8", "#d1fae5", "#fef9c3", "#fee2e2", "#ddd6fe"];
function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  // Messaging has no backend yet — demo threads only appear in mock mode.
  const conversations = !USE_MOCK
    ? []
    : profile?.role === "tutor" ? TUTOR_VIEW : PARENT_VIEW;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))}
        >
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.backBtn} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={34} color={PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyBody}>
            Conversations with your {profile?.role === "tutor" ? "families" : "tutors"} will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {conversations.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: "/message-detail", params: { name: c.name } })}
            >
              <View style={[styles.avatar, { backgroundColor: colorFor(c.name) }]}>
                <Text style={styles.avatarText}>{getInitials(c.name)}</Text>
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.rowTime}>{c.time}</Text>
                </View>
                <View style={styles.rowBottom}>
                  <Text style={[styles.rowPreview, c.unread > 0 && styles.rowPreviewUnread]} numberOfLines={1}>
                    {c.preview}
                  </Text>
                  {c.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{c.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SW.color.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { color: PRIMARY, fontSize: 20, fontWeight: "700" },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    padding: 14, marginBottom: 12,
    ...SW.shadow(SW.color.outline, 0.16),
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: SW.font.bold, fontSize: 16, color: "#1f2937" },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowName: { ...SW.type.labelMd, fontSize: 15, color: SW.color.onSurface, flex: 1 },
  rowTime: { ...SW.type.labelSm, color: SW.color.muted },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowPreview: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, flex: 1 },
  rowPreviewUnread: { color: SW.color.onSurface, fontFamily: SW.font.semibold },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40, paddingBottom: 80 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: SW.color.lavenderSoft,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { ...SW.type.labelMd, fontSize: 17, color: SW.color.onSurface },
  emptyBody: { ...SW.type.bodyMd, fontSize: 14, color: SW.color.muted, textAlign: "center" },
});
