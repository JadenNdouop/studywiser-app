import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const INPUT_BG = "#eef2ff";

/* ─── FAQ data ─── */
const FAQ_FILTERS = ["Popular Topic", "General", "Services"];

const FAQS = [
  {
    q: "How do I book a tutoring session?",
    a: "Go to the Home screen, browse available tutors, tap a tutor card, and select an available time slot. Confirm your booking and you'll receive a session link.",
  },
  { q: "How do I cancel or reschedule a session?", a: "" },
  { q: "What subjects are available for tutoring?", a: "" },
  { q: "How does the payment system work?", a: "" },
  { q: "What if my tutor doesn't show up?", a: "" },
  { q: "Can I switch tutors during my plan?", a: "" },
  { q: "How do I track my learning progress?", a: "" },
];

/* ─── Contact data ─── */
const CONTACTS = [
  { icon: "headset-outline",    label: "Customer Service" },
  { icon: "globe-outline",      label: "Website" },
  { icon: "logo-whatsapp",      label: "Whatsapp" },
  { icon: "logo-facebook",      label: "Facebook" },
  { icon: "logo-instagram",     label: "Instagram" },
];

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"faq" | "contact">("faq");
  const [filter, setFilter] = useState("Popular Topic");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(FAQS[0].q);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sub}>How can we help you?</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FAQ / Contact toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "faq" && styles.tabBtnActive]}
            onPress={() => setTab("faq")}
          >
            <Text style={[styles.tabBtnText, tab === "faq" && styles.tabBtnTextActive]}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "contact" && styles.tabBtnActive]}
            onPress={() => setTab("contact")}
          >
            <Text style={[styles.tabBtnText, tab === "contact" && styles.tabBtnTextActive]}>
              Contact Us
            </Text>
          </TouchableOpacity>
        </View>

        {tab === "faq" ? (
          <>
            {/* Filter chips */}
            <View style={styles.filterRow}>
              {FAQ_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, filter === f && styles.chipActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Accordion */}
            <View style={styles.card}>
              {FAQS.map((item, i) => {
                const isOpen = expanded === item.q;
                return (
                  <View key={item.q}>
                    <TouchableOpacity
                      style={styles.faqRow}
                      onPress={() => setExpanded(isOpen ? null : item.q)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.faqHeader}>
                        <Text style={styles.faqQ}>{item.q}</Text>
                        <Ionicons
                          name={isOpen ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={PRIMARY}
                        />
                      </View>
                      {isOpen && item.a ? (
                        <Text style={styles.faqA}>{item.a}</Text>
                      ) : null}
                    </TouchableOpacity>
                    {i < FAQS.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            {CONTACTS.map((c, i) => (
              <View key={c.label}>
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() =>
                    setExpandedContact(expandedContact === c.label ? null : c.label)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.contactLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={c.icon as any} size={20} color={PRIMARY} />
                    </View>
                    <Text style={styles.contactLabel}>{c.label}</Text>
                  </View>
                  <Ionicons
                    name={expandedContact === c.label ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#cbd5e1"
                  />
                </TouchableOpacity>
                {i < CONTACTS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}
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
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  sub: { color: "#414751", fontSize: 14, marginBottom: 16 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#191c1e" },

  tabRow: {
    flexDirection: "row",
    backgroundColor: INPUT_BG,
    borderRadius: 9999,
    padding: 4,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: PRIMARY },
  tabBtnText: { color: "#414751", fontWeight: "600", fontSize: 14 },
  tabBtnTextActive: { color: "#fff" },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: INPUT_BG,
  },
  chipActive: { backgroundColor: PRIMARY },
  chipText: { color: "#414751", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },

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
  faqRow: { paddingVertical: 12, paddingHorizontal: 12 },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqQ: { flex: 1, fontSize: 14, color: "#191c1e", fontWeight: "600", marginRight: 8 },
  faqA: { color: "#717783", fontSize: 13, lineHeight: 20, marginTop: 10 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 12 },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  contactLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: INPUT_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 15, color: "#191c1e", fontWeight: "600" },
});
