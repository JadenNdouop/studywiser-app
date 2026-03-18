import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY    = "#014aad";
const CARD_BG    = "#eef2ff";
const CHIP_BG    = "#d1d9ff";
const TEXT_DARK  = "#0a0f2c";
const TEXT_MID   = "#5a6282";
const TEXT_LIGHT = "#9aa3c2";
const WHITE      = "#ffffff";
const SUCCESS    = "#22c55e";
const DANGER     = "#ef4444";

// Shared detail row
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  function handleConfirm() {
    setShowSuccess(true);
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your Appointment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Tutor Card ──────────────────────────────────────────────────── */}
        <View style={s.tutorCard}>
          <View style={s.tutorAvatar}>
            <Text style={s.tutorInitial}>OT</Text>
          </View>
          <View style={s.tutorInfo}>
            <Text style={s.tutorName}>Oliver Turner</Text>
            <Text style={s.tutorSubject}>Mathematics · Grades 6–12</Text>
            <View style={s.tutorStats}>
              <Ionicons name="star" size={13} color="#f5a623" />
              <Text style={s.tutorStat}>4.9</Text>
              <View style={s.statDot} />
              <Ionicons name="chatbubble-outline" size={13} color={TEXT_LIGHT} />
              <Text style={s.tutorStat}>42</Text>
            </View>
          </View>
          <TouchableOpacity style={s.heartBtn}>
            <Ionicons name="heart-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* ── Date / Time chip ────────────────────────────────────────────── */}
        <View style={s.dateCard}>
          <View style={s.dateInfo}>
            <View style={s.datePill}>
              <Text style={s.datePillText}>Wed, March 25</Text>
            </View>
            <Text style={s.dateTime}>WED, 4:00 PM · Online · 60 min</Text>
          </View>
          <View style={s.dateActions}>
            <TouchableOpacity style={[s.dateIconBtn, { backgroundColor: SUCCESS + "20" }]}>
              <Ionicons name="checkmark" size={18} color={SUCCESS} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.dateIconBtn, { backgroundColor: DANGER + "15" }]}>
              <Ionicons name="close" size={18} color={DANGER} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Booking Details ─────────────────────────────────────────────── */}
        <View style={s.detailCard}>
          <DetailRow label="Booking For"    value="Another Student" />
          <View style={s.divider} />
          <DetailRow label="Student Name"   value="Jane Doe" />
          <View style={s.divider} />
          <DetailRow label="Grade"          value="Grade 8" />
          <View style={s.divider} />
          <DetailRow label="Session Type"   value="Online" />
          <View style={s.divider} />
          <DetailRow label="Recurring"      value="Weekly" />
          <View style={s.divider} />
          <DetailRow label="Tutor Rate"     value="$45 / hr" />
        </View>

        {/* ── Notes ───────────────────────────────────────────────────────── */}
        <View style={s.notesCard}>
          <Text style={s.notesLabel}>Notes / Learning Goals</Text>
          <Text style={s.notesText}>
            Focus on building confidence with Algebra 2 — specifically solving
            systems of equations and graphing. Preparing for upcoming midterms.
          </Text>
        </View>

        {/* ── Pricing summary ─────────────────────────────────────────────── */}
        <View style={s.priceCard}>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Session (60 min)</Text>
            <Text style={s.priceVal}>$45.00</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Platform fee</Text>
            <Text style={s.priceVal}>$2.50</Text>
          </View>
          <View style={[s.divider, { marginVertical: 10 }]} />
          <View style={s.priceRow}>
            <Text style={[s.priceLabel, { fontWeight: "800", color: TEXT_DARK }]}>Total</Text>
            <Text style={[s.priceVal, { fontWeight: "800", color: PRIMARY, fontSize: 16 }]}>$47.50</Text>
          </View>
        </View>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <TouchableOpacity style={s.confirmBtn} activeOpacity={0.85} onPress={handleConfirm}>
          <Ionicons name="checkmark-circle-outline" size={20} color={WHITE} />
          <Text style={s.confirmBtnText}>Confirm Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.backBtn} activeOpacity={0.8} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Go Back & Edit</Text>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Success Modal ────────────────────────────────────────────────── */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.iconWrap}>
              <Ionicons name="checkmark-circle" size={64} color={SUCCESS} />
            </View>
            <Text style={m.title}>Session Booked!</Text>
            <Text style={m.sub}>
              Your session with Oliver Turner has been confirmed for{"\n"}
              Wednesday, March 25 at 4:00 PM.{"\n"}
              You'll receive a reminder before it starts.
            </Text>
            <View style={m.detailBox}>
              <Text style={m.detailItem}>📅  Wed, March 25 · 4:00 PM</Text>
              <Text style={m.detailItem}>🔁  Recurring Weekly</Text>
              <Text style={m.detailItem}>💻  Online</Text>
            </View>
            <TouchableOpacity
              style={m.doneBtn}
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccess(false);
                router.push("/(tabs)/sessions");
              }}
            >
              <Text style={m.doneBtnText}>View My Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={m.homeBtn}
              activeOpacity={0.8}
              onPress={() => {
                setShowSuccess(false);
                router.push("/(tabs)");
              }}
            >
              <Text style={m.homeBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Modal styles
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    width: "100%",
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: SUCCESS + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: "800", color: TEXT_DARK, marginBottom: 10 },
  sub: {
    fontSize: 14,
    color: TEXT_MID,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 18,
  },
  detailBox: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    gap: 8,
    marginBottom: 22,
  },
  detailItem: { fontSize: 14, color: TEXT_DARK, fontWeight: "600" },
  doneBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  doneBtnText: { color: WHITE, fontWeight: "800", fontSize: 15 },
  homeBtn: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  homeBtnText: { color: PRIMARY, fontWeight: "700", fontSize: 15 },
});

// Main styles
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: WHITE },
  scroll: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: PRIMARY },

  // Tutor card
  tutorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    gap: 14,
  },
  tutorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CHIP_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  tutorInitial: { fontSize: 18, fontWeight: "800", color: PRIMARY },
  tutorInfo:    { flex: 1 },
  tutorName:    { fontSize: 16, fontWeight: "800", color: TEXT_DARK },
  tutorSubject: { fontSize: 12, color: TEXT_MID, marginBottom: 4 },
  tutorStats:   { flexDirection: "row", alignItems: "center", gap: 5 },
  tutorStat:    { fontSize: 12, fontWeight: "600", color: TEXT_DARK },
  statDot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: TEXT_LIGHT },
  heartBtn:     { padding: 4 },

  // Date card
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    justifyContent: "space-between",
  },
  dateInfo: { gap: 6 },
  datePill: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  datePillText: { color: WHITE, fontWeight: "700", fontSize: 13 },
  dateTime:     { fontSize: 13, color: TEXT_MID, fontWeight: "600" },
  dateActions:  { flexDirection: "row", gap: 8 },
  dateIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Detail card
  detailCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 14, color: TEXT_MID },
  detailValue: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
  divider:     { height: 1, backgroundColor: CHIP_BG },

  // Notes card
  notesCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  notesLabel: { fontSize: 13, fontWeight: "700", color: TEXT_DARK, marginBottom: 8 },
  notesText:  { fontSize: 14, color: TEXT_MID, lineHeight: 22 },

  // Price card
  priceCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
  },
  priceRow:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  priceLabel: { fontSize: 14, color: TEXT_MID },
  priceVal:   { fontSize: 14, fontWeight: "600", color: TEXT_DARK },

  // Buttons
  confirmBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  confirmBtnText: { color: WHITE, fontSize: 16, fontWeight: "800" },
  backBtn: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  backBtnText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
});
