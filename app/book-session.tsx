import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { usePricing } from "../hooks/usePricing";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
const INPUT_BG   = "#eef2ff";
const WHITE      = "#ffffff";
const SUCCESS    = "#22c55e";

// ── Week strip data ──────────────────────────────────────────────────────────
const WEEK = [
  { day: "MON", date: 23 },
  { day: "TUE", date: 24 },
  { day: "WED", date: 25 },
  { day: "THU", date: 26 },
  { day: "FRI", date: 27 },
  { day: "SAT", date: 28 },
  { day: "SUN", date: 29 },
];

const TIME_SLOTS = [
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM",
];

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const RECUR_OPTIONS = ["Weekly", "Bi-weekly", "Monthly"];

// ── Pill toggle helper ───────────────────────────────────────────────────────
function PillGroup({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: string[];
  selected: string | string[];
  onSelect: (val: string) => void;
  multi?: boolean;
}) {
  return (
    <View style={pg.row}>
      {options.map((opt) => {
        const active = multi
          ? (selected as string[]).includes(opt)
          : selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[pg.pill, active && pg.pillActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.8}
          >
            <Text style={[pg.label, active && pg.labelActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const pg = StyleSheet.create({
  row:        { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: CHIP_BG },
  pillActive: { backgroundColor: PRIMARY },
  label:      { fontSize: 13, fontWeight: "600", color: TEXT_MID },
  labelActive:{ color: WHITE },
});

export default function BookSessionScreen() {
  const router = useRouter();
  const { subjects, getPrice, loading: pricingLoading } = usePricing();

  const [selectedDay,   setSelectedDay]   = useState(25);
  const [selectedTime,  setSelectedTime]  = useState("4:00 PM");
  const [subject,       setSubject]       = useState("Algebra 1");
  const [sessionFormat, setSessionFormat] = useState<"individual" | "group">("individual");
  const [bookingFor,    setBookingFor]    = useState<"Yourself" | "Another Student">("Yourself");
  const [studentName,   setStudentName]   = useState("");
  const [grade,         setGrade]         = useState("8");
  const [sessionType,   setSessionType]   = useState<"Online" | "In-Person">("Online");
  const [recurring,     setRecurring]     = useState(false);
  const [recurFreq,     setRecurFreq]     = useState("Weekly");
  const [notes,         setNotes]         = useState("");

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={PRIMARY} />
          </TouchableOpacity>
          <View style={s.headerChip}>
            <Text style={s.headerChipText}>Oliver Turner</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <TouchableOpacity style={s.iconBtn}>
              <Ionicons name="videocam-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Date Strip ─────────────────────────────────────────────────── */}
          <View style={s.monthRow}>
            <TouchableOpacity><Ionicons name="chevron-back" size={18} color={PRIMARY} /></TouchableOpacity>
            <TouchableOpacity style={s.monthPill}>
              <Text style={s.monthText}>March</Text>
              <Ionicons name="chevron-down" size={14} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity><Ionicons name="chevron-forward" size={18} color={PRIMARY} /></TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dateStrip}
            style={{ flexGrow: 0, height: 80 }}
          >
            {WEEK.map((item) => {
              const sel = item.date === selectedDay;
              return (
                <TouchableOpacity
                  key={item.date}
                  style={[s.dateCell, sel && s.dateCellSel]}
                  onPress={() => setSelectedDay(item.date)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.dayLabel, sel && s.dayLabelSel]}>{item.day}</Text>
                  <Text style={[s.dateNum, sel && s.dateNumSel]}>{item.date}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Available Times ─────────────────────────────────────────────── */}
          <Text style={s.sectionTitle}>Available Times</Text>
          <View style={s.timeGrid}>
            {TIME_SLOTS.map((t) => {
              const sel = t === selectedTime;
              return (
                <TouchableOpacity
                  key={t}
                  style={[s.timeChip, sel && s.timeChipSel]}
                  onPress={() => setSelectedTime(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.timeText, sel && s.timeTextSel]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Session Details ─────────────────────────────────────────────── */}
          <Text style={[s.sectionTitle, { marginTop: 22 }]}>Session Details</Text>

          {/* Subject */}
          <Text style={s.fieldLabel}>Subject</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            style={{ flexGrow: 0, height: 42, marginBottom: 14 }}
          >
            {subjects.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[s.gradeChip, subject === sub && s.gradeChipSel]}
                onPress={() => setSubject(sub)}
                activeOpacity={0.8}
              >
                <Text style={[s.gradeText, subject === sub && s.gradeTextSel]}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Session Format */}
          <Text style={s.fieldLabel}>Session Format</Text>
          <PillGroup
            options={["individual", "group"]}
            selected={sessionFormat}
            onSelect={(v) => setSessionFormat(v as any)}
          />
          <Text style={s.pricePeek}>
            Rate: ${getPrice(subject, sessionFormat).parentRate}/hr
          </Text>

          {/* Booking for */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Booking For</Text>
          <PillGroup
            options={["Yourself", "Another Student"]}
            selected={bookingFor}
            onSelect={(v) => setBookingFor(v as any)}
          />

          {/* Student name + grade — shown when Another Student */}
          {bookingFor === "Another Student" && (
            <>
              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Student Name</Text>
              <TextInput
                style={s.input}
                placeholder="Full Name"
                placeholderTextColor={TEXT_LIGHT}
                value={studentName}
                onChangeText={setStudentName}
              />
              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Grade</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                style={{ flexGrow: 0, height: 42 }}
              >
                {GRADES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[s.gradeChip, grade === g && s.gradeChipSel]}
                    onPress={() => setGrade(g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.gradeText, grade === g && s.gradeTextSel]}>
                      {g === "K" ? "K" : `G${g}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Session type */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Session Type</Text>
          <PillGroup
            options={["Online", "In-Person"]}
            selected={sessionType}
            onSelect={(v) => setSessionType(v as any)}
          />

          {/* Recurring toggle */}
          <View style={s.recurRow}>
            <View>
              <Text style={s.fieldLabel}>Recurring Session</Text>
              <Text style={s.recurSub}>Repeat this session automatically</Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              trackColor={{ false: CHIP_BG, true: PRIMARY }}
              thumbColor={WHITE}
            />
          </View>

          {recurring && (
            <>
              <Text style={[s.fieldLabel, { marginBottom: 8 }]}>Frequency</Text>
              <PillGroup
                options={RECUR_OPTIONS}
                selected={recurFreq}
                onSelect={setRecurFreq}
              />
            </>
          )}

          {/* Notes */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Notes / Learning Goals</Text>
          <TextInput
            style={[s.input, s.textarea]}
            placeholder="Describe what you'd like to focus on..."
            placeholderTextColor={TEXT_LIGHT}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />

          {/* Book button */}
          <TouchableOpacity
            style={s.bookBtn}
            activeOpacity={0.85}
            onPress={() => router.push({
              pathname: "/booking-confirmation",
              params: {
                subject,
                sessionFormat,
                sessionType,
                grade,
                studentName: bookingFor === "Another Student" ? studentName : "",
                bookingFor,
                day: selectedDay,
                time: selectedTime,
                recurring: recurring ? recurFreq : "No",
                notes,
              },
            })}
          >
            <Text style={s.bookBtnText}>Review Booking</Text>
            <Ionicons name="arrow-forward" size={18} color={WHITE} />
          </TouchableOpacity>

          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: WHITE },
  scroll: { paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  headerChip: {
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
  },
  headerChipText: { color: WHITE, fontWeight: "800", fontSize: 14 },

  // Month row
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 4,
  },
  monthPill: { flexDirection: "row", alignItems: "center", gap: 4 },
  monthText: { fontSize: 16, fontWeight: "800", color: PRIMARY },

  // Date strip
  dateStrip: { gap: 10, paddingHorizontal: 2, alignItems: "center" },
  dateCell: {
    width: 52,
    height: 68,
    borderRadius: 16,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dateCellSel: { backgroundColor: PRIMARY },
  dayLabel:    { fontSize: 11, fontWeight: "700", color: TEXT_LIGHT, letterSpacing: 0.5 },
  dayLabelSel: { color: "rgba(255,255,255,0.75)" },
  dateNum:     { fontSize: 20, fontWeight: "800", color: TEXT_DARK },
  dateNumSel:  { color: WHITE },

  // Time grid
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: CARD_BG,
  },
  timeChipSel: { backgroundColor: PRIMARY },
  timeText:    { fontSize: 13, fontWeight: "600", color: TEXT_MID },
  timeTextSel: { color: WHITE },

  // Section / field
  sectionTitle: { fontSize: 16, fontWeight: "800", color: TEXT_DARK, marginBottom: 14 },
  fieldLabel:   { fontSize: 13, fontWeight: "700", color: TEXT_DARK, marginBottom: 8 },

  // Input
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: TEXT_DARK,
  },
  textarea: { height: 110, paddingTop: 13 },

  // Grade chips
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: CHIP_BG,
  },
  gradeChipSel: { backgroundColor: PRIMARY },
  gradeText:    { fontSize: 13, fontWeight: "600", color: TEXT_MID },
  gradeTextSel: { color: WHITE },

  // Recurring
  recurRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginBottom: 10,
  },
  recurSub: { fontSize: 12, color: TEXT_LIGHT, marginTop: 2 },

  pricePeek: { fontSize: 12, color: TEXT_MID, marginTop: 6, marginBottom: 4 },

  // Book button
  bookBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  bookBtnText: { color: WHITE, fontSize: 16, fontWeight: "800" },
});
