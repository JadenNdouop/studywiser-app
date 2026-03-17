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
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";

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
  const [tab, setTab] = useState<"faq" | "contact">("faq");
  const [filter, setFilter] = useState("Popular Topic");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(FAQS[0].q);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Blue header section */}
      <View style={styles.blueHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={styles.backBtn} />
        </View>
        <Text style={styles.headerSub}>How Can We Help You?</Text>

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
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
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
          {FAQS.map((item) => {
            const isOpen = expanded === item.q;
            return (
              <TouchableOpacity
                key={item.q}
                style={styles.faqItem}
                onPress={() => setExpanded(isOpen ? null : item.q)}
                activeOpacity={0.8}
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
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {CONTACTS.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={styles.contactRow}
              onPress={() =>
                setExpandedContact(expandedContact === c.label ? null : c.label)
              }
              activeOpacity={0.8}
            >
              <View style={styles.contactLeft}>
                <View style={styles.contactIcon}>
                  <Ionicons name={c.icon as any} size={22} color={PRIMARY} />
                </View>
                <Text style={styles.contactLabel}>{c.label}</Text>
              </View>
              <Ionicons
                name={expandedContact === c.label ? "chevron-up" : "chevron-down"}
                size={18}
                color="#94a3b8"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  blueHeader: {
    backgroundColor: PRIMARY,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", marginBottom: 14 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: "#eef2ff",
    borderRadius: 30,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 26,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: PRIMARY },
  tabBtnText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  tabBtnTextActive: { color: "#fff" },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
  },
  chipActive: { backgroundColor: PRIMARY },
  chipText: { color: "#475569", fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: "#fff" },

  faqItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqQ: { flex: 1, fontSize: 14, color: "#1e293b", fontWeight: "500", marginRight: 8 },
  faqA: { color: "#64748b", fontSize: 13, lineHeight: 20, marginTop: 10 },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  contactLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 15, color: "#1e293b", fontWeight: "500" },
});
