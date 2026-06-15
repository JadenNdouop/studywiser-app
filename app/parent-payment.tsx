import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

const TIER_COLOR: Record<string, { color: string; bg: string }> = {
  Basic: { color: "#0369a1", bg: "#e0f2fe" },
  Upper: { color: "#7c3aed", bg: "#ede9fe" },
  SAT:   { color: "#b45309", bg: "#fef3c7" },
};
const TIER_RATE: Record<string, number> = { Basic: 35, Upper: 40, SAT: 45 };

const SUBJECT_TIER: Record<string, string> = {};
const TIER_SUBJECTS: Record<string, string[]> = {
  Basic: ["Reading & Writing","Math","Science","Social Studies","Spelling"],
  Upper: ["Algebra I / II","Geometry","Pre-Calculus / Calculus","Biology","Chemistry","Physics","English / Literature","US History / World History"],
  SAT:   ["SAT Math","SAT Reading & Writing","ACT","PSAT"],
};
Object.entries(TIER_SUBJECTS).forEach(([tier, subjects]) => {
  subjects.forEach((s) => { SUBJECT_TIER[s] = tier; });
});

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function weekRangeLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = ["#c7d2fe","#fde8d8","#d1fae5","#fef9c3","#fee2e2","#ddd6fe"];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type SessionRow = {
  id: string;
  student_name: string;
  subject: string;
  tutor_name: string;
  session_date: string;
  duration: number;
  price: number;
};

type WeekGroup = {
  mondayStr: string;
  label: string;
  sessions: SessionRow[];
  total: number;
};

export default function ParentPaymentScreen() {
  const { profile } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<SessionRow[]>([]);
  const [history,     setHistory]     = useState<WeekGroup[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  async function loadData() {
    const today  = new Date();
    const monday = getMondayOfWeek(today);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    const weekStart = monday.toISOString().split("T")[0];
    const weekEnd   = sunday.toISOString().split("T")[0];

    const { data } = await supabase
      .from("sessions")
      .select(`
        id, subject, session_date, duration, price,
        student_profile:profiles!sessions_student_profile_id_fkey(full_name),
        managed_student:students!sessions_student_id_fkey(full_name),
        tutor:profiles!sessions_tutor_id_fkey(full_name)
      `)
      .eq("parent_id", profile!.id)
      .eq("status", "completed")
      .order("session_date", { ascending: false });

    const mapped: SessionRow[] = (data ?? []).map((s: any) => ({
      id:           s.id,
      student_name: s.student_profile?.full_name ?? s.managed_student?.full_name ?? "Student",
      subject:      s.subject ?? "Session",
      tutor_name:   s.tutor?.full_name ?? "Tutor",
      session_date: s.session_date,
      duration:     s.duration ?? 60,
      price:        s.price ?? 0,
    }));

    // Split into current week vs history
    const current = mapped.filter((s) => s.session_date >= weekStart && s.session_date <= weekEnd);
    const past    = mapped.filter((s) => s.session_date < weekStart);

    setCurrentWeek(current);

    // Group past sessions by week (Mon = key)
    const groups: Record<string, WeekGroup> = {};
    past.forEach((s) => {
      const d = new Date(s.session_date + "T00:00:00");
      const mon = getMondayOfWeek(d);
      const key = mon.toISOString().split("T")[0];
      if (!groups[key]) {
        groups[key] = { mondayStr: key, label: weekRangeLabel(mon), sessions: [], total: 0 };
      }
      groups[key].sessions.push(s);
      groups[key].total += s.price;
    });

    setHistory(Object.values(groups).sort((a, b) => b.mondayStr.localeCompare(a.mondayStr)));
  }

  const weekTotal = currentWeek.reduce((sum, s) => sum + s.price, 0);
  const monday    = getMondayOfWeek(new Date());
  const currentWeekLabel = weekRangeLabel(monday);

  function handlePay() {
    if (weekTotal === 0) { Alert.alert("Nothing due", "No completed sessions to pay for this week."); return; }
    Alert.alert(
      "Confirm Payment",
      `Pay $${weekTotal.toFixed(0)} for ${currentWeek.length} session${currentWeek.length !== 1 ? "s" : ""} this week?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Pay $${weekTotal.toFixed(0)}`,
          onPress: () => Alert.alert("Coming Soon", "Stripe payment integration will be available soon."),
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
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Amount Due Banner */}
        <View style={styles.dueBanner}>
          <View>
            <Text style={styles.dueLabel}>AMOUNT DUE</Text>
            <Text style={styles.dueAmount}>${weekTotal.toFixed(0)}</Text>
            <Text style={styles.dueSub}>Week of {currentWeekLabel}</Text>
          </View>
          <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.85}>
            <Ionicons name="card-outline" size={18} color={PRIMARY} />
            <Text style={styles.payBtnText}>Pay Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stripeNote}>
          <Ionicons name="lock-closed-outline" size={13} color="#64748b" />
          <Text style={styles.stripeNoteText}>Payments are processed securely via Stripe.</Text>
        </View>

        {/* This Week's Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Sessions</Text>

          {currentWeek.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>No completed sessions this week yet</Text>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {currentWeek.map((s, i) => {
                const tier = SUBJECT_TIER[s.subject] ?? "Basic";
                const tc   = TIER_COLOR[tier];
                const d    = new Date(s.session_date + "T00:00:00");
                const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <View key={s.id}>
                    <View style={styles.sessionRow}>
                      <View style={[styles.avatar, { backgroundColor: avatarColor(s.id) }]}>
                        <Text style={styles.avatarText}>{getInitials(s.student_name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionStudent}>{s.student_name}</Text>
                        <Text style={styles.sessionSubject}>{s.subject} · {s.tutor_name}</Text>
                        <View style={styles.sessionMeta}>
                          <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
                          <Text style={styles.sessionMetaText}>{dateLabel} · {s.duration} min</Text>
                        </View>
                      </View>
                      <View style={styles.priceCol}>
                        <Text style={styles.sessionPrice}>${s.price.toFixed(0)}</Text>
                        <View style={[styles.tierBadge, { backgroundColor: tc.bg }]}>
                          <Text style={[styles.tierBadgeText, { color: tc.color }]}>{tier}</Text>
                        </View>
                      </View>
                    </View>
                    {i < currentWeek.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total due</Text>
                <Text style={styles.totalAmount}>${weekTotal.toFixed(0)}</Text>
              </View>
            </View>
          )}

          {/* Pricing legend */}
          <View style={styles.pricingNote}>
            <Text style={styles.pricingNoteTitle}>Session Rates</Text>
            <View style={styles.pricingGrid}>
              {Object.entries(TIER_RATE).map(([tier, rate]) => {
                const tc = TIER_COLOR[tier];
                const label = tier === "Basic" ? "Basic (K–8)" : tier === "Upper" ? "Upper (9–12)" : "SAT / Test Prep";
                return (
                  <View key={tier} style={styles.pricingRow}>
                    <View style={[styles.pricingDot, { backgroundColor: tc.bg, borderColor: tc.color }]} />
                    <Text style={styles.pricingTier}>{label}</Text>
                    <Text style={[styles.pricingRate, { color: tc.color }]}>${rate} / session</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>

          {history.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>No payment history yet</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {history.map((group, i) => (
                <View key={group.mondayStr}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyIconWrap}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyWeek}>Week of {group.label}</Text>
                      <Text style={styles.historySessions}>
                        {group.sessions.length} session{group.sessions.length !== 1 ? "s" : ""}
                        {" · "}
                        {[...new Set(group.sessions.map((s) => s.student_name.split(" ")[0]))].join(", ")}
                      </Text>
                    </View>
                    <Text style={styles.historyAmount}>${group.total.toFixed(0)}</Text>
                  </View>
                  {i < history.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  scroll: { paddingBottom: 48 },

  dueBanner: {
    backgroundColor: PRIMARY, marginHorizontal: 20, marginTop: 8, marginBottom: 12,
    borderRadius: 24, padding: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  dueLabel:  { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  dueAmount: { color: "#fff", fontSize: 40, fontWeight: "800", lineHeight: 44 },
  dueSub:    { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 },
  payBtn:    { backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  payBtnText:{ color: PRIMARY, fontSize: 14, fontWeight: "700" },

  stripeNote: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, marginBottom: 24 },
  stripeNoteText: { fontSize: 12, color: "#94a3b8" },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 14 },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f8fafc", borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 14,
  },
  emptyBoxText: { color: "#94a3b8", fontSize: 13, flex: 1 },

  sessionList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20, overflow: "hidden", marginBottom: 14 },
  sessionRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  avatar:      { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText:  { color: PRIMARY, fontSize: 14, fontWeight: "700" },
  sessionStudent: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  sessionSubject: { fontSize: 12, color: "#64748b", marginBottom: 3 },
  sessionMeta:    { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionMetaText:{ fontSize: 11, color: "#94a3b8" },
  priceCol:    { alignItems: "flex-end", gap: 5 },
  sessionPrice:{ fontSize: 18, fontWeight: "800", color: "#0f172a" },
  tierBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tierBadgeText:{ fontSize: 10, fontWeight: "700" },
  totalRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: CARD_BG,
    borderTopWidth: 1, borderTopColor: "#e2e8f0",
  },
  totalLabel:  { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  totalAmount: { fontSize: 20, fontWeight: "800", color: PRIMARY },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 14 },

  pricingNote:      { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 16, padding: 14 },
  pricingNoteTitle: { fontSize: 12, fontWeight: "700", color: "#94a3b8", marginBottom: 10, letterSpacing: 0.5 },
  pricingGrid: { gap: 8 },
  pricingRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  pricingDot:  { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  pricingTier: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "500" },
  pricingRate: { fontSize: 13, fontWeight: "700" },

  historyList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20, overflow: "hidden" },
  historyRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  historyIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#ecfdf5", alignItems: "center", justifyContent: "center" },
  historyWeek:     { fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 2 },
  historySessions: { fontSize: 11, color: "#94a3b8" },
  historyAmount:   { fontSize: 15, fontWeight: "800", color: "#10b981" },
});
