import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SWButton, SWEmptyState, avatarTint, getInitials } from "../components/sw";
import { SW } from "../constants/theme";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

const PRIMARY = SW.color.primary;

const TIER_STYLE: Record<string, { bg: string; fg: string; icon: string }> = {
  Basic: { bg: SW.color.mint,     fg: SW.color.onMint,  icon: "sparkles-outline" },
  Upper: { bg: SW.color.coral,    fg: SW.color.onCoral, icon: "rocket-outline" },
  SAT:   { bg: SW.color.lavender, fg: SW.color.primary, icon: "school-outline" },
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
  const insets = useSafeAreaInsets();
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
  const [dollars, cents] = weekTotal.toFixed(2).split(".");
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
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Total balance hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>TOTAL BALANCE</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>${dollars}</Text>
            <Text style={styles.heroCents}>.{cents}</Text>
          </View>
          <Text style={styles.heroSub}>
            {weekTotal === 0
              ? "Everything is up to date for your upcoming sessions."
              : `Week of ${currentWeekLabel}`}
          </Text>
          <SWButton
            label="Pay Now"
            variant="mint"
            icon="arrow-forward"
            onPress={handlePay}
            style={{ marginTop: 18 }}
          />
        </View>

        <View style={styles.stripeNote}>
          <Ionicons name="lock-closed-outline" size={13} color={SW.color.muted} />
          <Text style={styles.stripeNoteText}>Payments are processed securely via Stripe.</Text>
        </View>

        {/* This Week's Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week&apos;s Sessions</Text>

          {currentWeek.length === 0 ? (
            <SWEmptyState
              icon="calendar-outline"
              title="No completed sessions this week yet"
            />
          ) : (
            <View style={{ gap: SW.space.stack }}>
              {currentWeek.map((s) => {
                const tier = SUBJECT_TIER[s.subject] ?? "Basic";
                const tc   = TIER_STYLE[tier];
                const tint = avatarTint(s.id);
                const d    = new Date(s.session_date + "T00:00:00");
                const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <View key={s.id} style={styles.sessionCard}>
                    <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
                      <Text style={[styles.avatarText, { color: tint.fg }]}>{getInitials(s.student_name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionStudent}>{s.student_name}</Text>
                      <Text style={styles.sessionSubject}>{s.subject} · {s.tutor_name}</Text>
                      <Text style={styles.sessionMetaText}>{dateLabel} · {s.duration} min</Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={styles.sessionPrice}>${s.price.toFixed(0)}</Text>
                      <View style={[styles.tierBadge, { backgroundColor: tc.bg }]}>
                        <Text style={[styles.tierBadgeText, { color: tc.fg }]}>{tier}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total due</Text>
                <Text style={styles.totalAmount}>${weekTotal.toFixed(0)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Session Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Rates</Text>
          <View style={{ gap: 14 }}>
            {Object.entries(TIER_RATE).map(([tier, rate]) => {
              const tc = TIER_STYLE[tier];
              const label = tier === "Basic" ? "Basic" : tier === "Upper" ? "Upper-Level" : "SAT / Test Prep";
              const sub = tier === "Basic" ? "Foundation Sessions (K–8)" : tier === "Upper" ? "Mastery Sessions (9–12)" : "Exam Prep Workshops";
              return (
                <View key={tier} style={[styles.rateCard, { backgroundColor: tc.bg, ...SW.shadow(tc.bg, 0.4) }]}>
                  <View style={[styles.rateIcon, { backgroundColor: tc.fg }]}>
                    <Ionicons name={tc.icon as any} size={20} color={tc.bg} />
                  </View>
                  <Text style={[styles.rateTier, { color: tc.fg }]}>{label}</Text>
                  <Text style={[styles.rateSub, { color: tc.fg }]}>{sub}</Text>
                  <View style={styles.rateAmountRow}>
                    <Text style={[styles.rateAmount, { color: tc.fg }]}>${rate}</Text>
                    <Text style={[styles.ratePer, { color: tc.fg }]}>/session</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>

          {history.length === 0 ? (
            <SWEmptyState icon="receipt-outline" title="No payment history yet" />
          ) : (
            <View style={{ gap: SW.space.stack }}>
              {history.map((group) => (
                <View key={group.mondayStr} style={styles.historyRow}>
                  <View style={styles.historyIconWrap}>
                    <Ionicons name="checkmark-circle-outline" size={22} color={SW.color.onMint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyWeek}>Week of {group.label}</Text>
                    <Text style={styles.historySessions}>
                      {group.sessions.length} session{group.sessions.length !== 1 ? "s" : ""}
                      {" · "}
                      {[...new Set(group.sessions.map((s) => s.student_name.split(" ")[0]))].join(", ")}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.historyAmount}>${group.total.toFixed(2)}</Text>
                    <Text style={styles.historyStatus}>PAID</Text>
                  </View>
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
  safe: { flex: 1, backgroundColor: SW.color.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: SW.font.bold, fontSize: 18, color: PRIMARY },
  scroll: { paddingBottom: 48 },

  hero: {
    backgroundColor: SW.color.primaryContainer,
    marginHorizontal: SW.space.margin, marginTop: 8, marginBottom: 12,
    borderRadius: SW.radius.xl, padding: SW.space.cardPad + 4,
    ...SW.shadow(SW.color.primaryContainer, 0.35),
  },
  heroLabel:  { ...SW.type.labelSm, color: "rgba(255,255,255,0.75)", letterSpacing: 1.6 },
  heroAmountRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 6 },
  heroAmount: { fontFamily: SW.font.bold, fontSize: 48, lineHeight: 54, color: "#fff" },
  heroCents:  { fontFamily: SW.font.bold, fontSize: 18, color: "rgba(255,255,255,0.8)", marginTop: 8 },
  heroSub:    { ...SW.type.bodyMd, color: "rgba(255,255,255,0.85)", marginTop: 4 },

  stripeNote: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: SW.space.margin + 4, marginBottom: 24 },
  stripeNoteText: { ...SW.type.bodyMd, fontSize: 12, color: SW.color.muted },

  section: { paddingHorizontal: SW.space.margin, marginBottom: 28 },
  sectionTitle: { ...SW.type.headlineMd, color: SW.color.onSurface, marginBottom: 14 },

  sessionCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    paddingHorizontal: 16, paddingVertical: 14,
    ...SW.shadow(SW.color.outline, 0.2),
  },
  avatar:      { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontFamily: SW.font.bold, fontSize: 15 },
  sessionStudent: { ...SW.type.bodyLg, fontFamily: SW.font.bold, fontSize: 15, color: SW.color.onSurface },
  sessionSubject: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.onSurfaceVariant, marginTop: 1 },
  sessionMetaText:{ ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted, marginTop: 2 },
  priceCol:    { alignItems: "flex-end", gap: 5 },
  sessionPrice:{ fontFamily: SW.font.bold, fontSize: 18, color: SW.color.onSurface },
  tierBadge:   { borderRadius: SW.radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  tierBadgeText:{ ...SW.type.labelSm, fontSize: 10 },
  totalRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: SW.color.lavenderSoft, borderRadius: SW.radius.lg,
  },
  totalLabel:  { ...SW.type.labelMd, fontSize: 15, color: SW.color.onSurface },
  totalAmount: { fontFamily: SW.font.bold, fontSize: 20, color: PRIMARY },

  rateCard: { borderRadius: SW.radius.xl, padding: SW.space.cardPad + 2 },
  rateIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  rateTier: { ...SW.type.labelMd, fontSize: 15 },
  rateSub:  { ...SW.type.bodyMd, fontSize: 14, opacity: 0.85, marginBottom: 10 },
  rateAmountRow: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  rateAmount: { fontFamily: SW.font.bold, fontSize: 30, lineHeight: 34 },
  ratePer:    { ...SW.type.labelSm, marginBottom: 5 },

  historyRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    paddingHorizontal: 16, paddingVertical: 14,
    ...SW.shadow(SW.color.outline, 0.2),
  },
  historyIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: SW.color.mintSoft, alignItems: "center", justifyContent: "center",
  },
  historyWeek:     { ...SW.type.bodyMd, fontFamily: SW.font.bold, fontSize: 14, color: SW.color.onSurface },
  historySessions: { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted, marginTop: 2 },
  historyAmount:   { fontFamily: SW.font.bold, fontSize: 15, color: SW.color.onSurface },
  historyStatus:   { ...SW.type.labelSm, fontSize: 10, letterSpacing: 0.8, color: SW.color.onMint, marginTop: 2 },
});
