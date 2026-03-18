import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const AVAILABLE_DATES = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29];

function CalendarMonth() {
  const [selectedDate, setSelectedDate] = useState(24);

  // March 2026 starts on Sunday (index 0)
  const firstDayOffset = 6; // Monday-indexed: Sunday=6
  const daysInMonth = 31;
  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View>
      {/* Day headers */}
      <View style={cal.headerRow}>
        {DAYS.map((d) => (
          <Text key={d} style={cal.dayHeader}>{d}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={cal.row}>
          {row.map((day, di) => {
            if (!day) return <View key={di} style={cal.cell} />;
            const isAvail = AVAILABLE_DATES.includes(day);
            const isSel   = day === selectedDate;
            return (
              <TouchableOpacity
                key={di}
                style={cal.cell}
                onPress={() => isAvail && setSelectedDate(day)}
                activeOpacity={isAvail ? 0.7 : 1}
              >
                <View
                  style={[
                    cal.dateCircle,
                    isSel && { backgroundColor: PRIMARY },
                    isAvail && !isSel && { backgroundColor: CHIP_BG },
                  ]}
                >
                  <Text
                    style={[
                      cal.dateText,
                      isSel && { color: WHITE, fontWeight: "700" },
                      isAvail && !isSel && { color: PRIMARY, fontWeight: "600" },
                      !isAvail && { color: TEXT_LIGHT },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function TutorProfileScreen() {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <View style={s.headerChip}>
          <Ionicons name="calendar-outline" size={14} color={WHITE} />
          <Text style={s.headerChipText}>Schedule</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.iconBtn}>
            <Ionicons name="videocam-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}>
            <Ionicons name="chatbubble-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => setFavorited(!favorited)}>
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={20}
              color={favorited ? "#e74c3c" : PRIMARY}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Tutor Card */}
        <View style={s.tutorCard}>
          {/* Avatar placeholder */}
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarInitial}>OT</Text>
            </View>
            <View style={s.expBadge}>
              <Ionicons name="shield-checkmark" size={12} color={WHITE} />
              <Text style={s.expText}>8 yrs{"\n"}experience</Text>
            </View>
          </View>

          {/* Bio bubble */}
          <View style={s.bioBubble}>
            <Text style={s.bioLabel}>Focus: </Text>
            <Text style={s.bioText}>
              Algebra, Pre-Calculus, and SAT Math prep. Specializing in building
              strong foundations and test-taking confidence.
            </Text>
          </View>

          <Text style={s.tutorName}>Oliver Turner</Text>
          <Text style={s.tutorSubject}>Mathematics · Grades 6–12</Text>

          {/* Stat row */}
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Ionicons name="star" size={14} color="#f5a623" />
              <Text style={s.statText}>4.9</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Ionicons name="chatbubble-outline" size={14} color={PRIMARY} />
              <Text style={s.statText}>42 reviews</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Ionicons name="time-outline" size={14} color={PRIMARY} />
              <Text style={s.statText}>Mon–Fri · 3–8 PM</Text>
            </View>
          </View>
        </View>

        {/* Profile bio */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <Text style={s.bioBody}>
            Oliver has 8 years of tutoring experience working with middle and high school
            students. He focuses on breaking down complex topics into digestible steps,
            building real understanding rather than rote memorization. Students consistently
            improve their grades within the first month.
          </Text>
        </View>

        {/* Calendar */}
        <View style={s.section}>
          <View style={s.calHeader}>
            <TouchableOpacity>
              <Ionicons name="chevron-back" size={18} color={PRIMARY} />
            </TouchableOpacity>
            <Text style={s.calTitle}>MARCH 2026</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={PRIMARY} />
            </TouchableOpacity>
          </View>
          <CalendarMonth />
          <View style={s.availLegend}>
            <View style={[s.legendDot, { backgroundColor: CHIP_BG }]} />
            <Text style={s.legendText}>Available</Text>
            <View style={[s.legendDot, { backgroundColor: PRIMARY, marginLeft: 12 }]} />
            <Text style={s.legendText}>Selected</Text>
          </View>
        </View>

        {/* Book button */}
        <TouchableOpacity
          style={s.bookBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/book-session")}
        >
          <Text style={s.bookBtnText}>Book a Session</Text>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Calendar sub-styles ────────────────────────────────────────────────────
const cal = StyleSheet.create({
  headerRow: { flexDirection: "row", marginBottom: 6 },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
    letterSpacing: 0.5,
  },
  row:  { flexDirection: "row", marginBottom: 4 },
  cell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: { fontSize: 13, color: TEXT_LIGHT },
});

// ─── Main styles ─────────────────────────────────────────────────────────────
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    flex: 1,
    marginHorizontal: 10,
  },
  headerChipText: { color: WHITE, fontWeight: "700", fontSize: 13 },
  headerActions:  { flexDirection: "row", gap: 4 },

  // Tutor card
  tutorCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    alignItems: "center",
  },
  avatarWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    width: "100%",
    justifyContent: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: CHIP_BG,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: WHITE,
  },
  avatarInitial: { fontSize: 28, fontWeight: "700", color: PRIMARY },
  expBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    marginTop: 8,
    alignItems: "center",
    gap: 3,
  },
  expText: { color: WHITE, fontSize: 11, fontWeight: "700", textAlign: "center" },

  bioBubble: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  bioLabel: { color: WHITE, fontWeight: "700", fontSize: 13 },
  bioText:  { color: "rgba(255,255,255,0.88)", fontSize: 13, lineHeight: 19, marginTop: 2 },

  tutorName:    { fontSize: 18, fontWeight: "800", color: TEXT_DARK, marginBottom: 2 },
  tutorSubject: { fontSize: 13, color: TEXT_MID, marginBottom: 14 },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: "100%",
  },
  statItem:    { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "center" },
  statText:    { fontSize: 12, color: TEXT_DARK, fontWeight: "600" },
  statDivider: { width: 1, height: 20, backgroundColor: CHIP_BG },

  // Sections
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: TEXT_DARK, marginBottom: 8 },
  bioBody:      { fontSize: 14, color: TEXT_MID, lineHeight: 22 },

  // Calendar
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calTitle: { fontSize: 14, fontWeight: "800", color: PRIMARY, letterSpacing: 1 },
  availLegend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  legendDot:  { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: TEXT_MID },

  // Book button
  bookBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  bookBtnText: { color: WHITE, fontSize: 16, fontWeight: "800" },
});
