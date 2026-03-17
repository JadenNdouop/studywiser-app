import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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
const CAL_BG = "#d1d9ff";
const CARD_BG = "#eef2ff";

/* ─── Demo data ─── */

// Week: Mon Mar 16 – Sun Mar 22 2026 (today = Tue Mar 17)
const WEEK = [
  { label: "MON", date: 16 },
  { label: "TUE", date: 17 },
  { label: "WED", date: 18 },
  { label: "THU", date: 19 },
  { label: "FRI", date: 20 },
  { label: "SAT", date: 21 },
  { label: "SUN", date: 22 },
];
const TODAY = 17;

type DaySession = {
  id: string;
  startHour: number;
  student: string;
  subject: string;
  tutor: string;
};

const SCHEDULE: Record<number, DaySession[]> = {
  17: [{ id: "d1", startHour: 10, student: "Bradley Davis", subject: "Math — Fractions", tutor: "Mihith" }],
  18: [{ id: "d2", startHour: 9, student: "Evelyn Park", subject: "Reading — Main Ideas", tutor: "TBD" }],
  19: [{ id: "d3", startHour: 11, student: "Amina Khan", subject: "Pre-Algebra — Ratios", tutor: "M. Mandala" }],
  20: [
    { id: "d4", startHour: 9, student: "Leo Carter", subject: "Writing — Structure", tutor: "K. Lin" },
    { id: "d5", startHour: 11, student: "Sophia Lee", subject: "Science — Ecosystems", tutor: "J. Patel" },
  ],
  21: [{ id: "d6", startHour: 10, student: "Olivia Brown", subject: "Writing — Essays", tutor: "J. Patel" }],
};

const HOURS = [9, 10, 11, 12];

type Tutor = {
  id: string;
  name: string;
  subject: string;
  rating: number;
  reviews: number;
  sessions: number;
  favorited: boolean;
  initials: string;
  avatarColor: string;
};

const TUTORS: Tutor[] = [
  { id: "t1", name: "Sarah Johnson, M.Ed.", subject: "Mathematics", rating: 5, reviews: 60, sessions: 120, favorited: true, initials: "SJ", avatarColor: "#c7d2fe" },
  { id: "t2", name: "Marcus Chen, Ph.D.", subject: "Science & Physics", rating: 4.5, reviews: 40, sessions: 85, favorited: false, initials: "MC", avatarColor: "#ddd6fe" },
  { id: "t3", name: "Aisha Williams, B.Ed.", subject: "English & Writing", rating: 5, reviews: 150, sessions: 200, favorited: false, initials: "AW", avatarColor: "#fde8d8" },
  { id: "t4", name: "Robert Kim, M.S.", subject: "Computer Science", rating: 4.8, reviews: 90, sessions: 140, favorited: true, initials: "RK", avatarColor: "#d1fae5" },
];

/* ─── Main screen ─── */

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [search, setSearch] = useState("");

  const todaySessions = SCHEDULE[selectedDate] ?? [];
  const dayName = WEEK.find((d) => d.date === selectedDate)?.label ?? "";
  const dayLabel = `${selectedDate} ${dayName.charAt(0) + dayName.slice(1).toLowerCase()}${selectedDate === TODAY ? " - Today" : ""}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>J</Text>
            </View>
            <View>
              <Text style={styles.hiText}>Hi, Welcome Back</Text>
              <Text style={styles.nameText}>John Doe</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchBar}>
          <Ionicons name="options-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tutors, subjects…"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
        </View>

        {/* ── Lavender calendar + schedule section ── */}
        <View style={styles.calSection}>
          {/* Week strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStrip}
          >
            {WEEK.map((day) => {
              const isSelected = day.date === selectedDate;
              const isToday = day.date === TODAY;
              return (
                <TouchableOpacity
                  key={day.date}
                  style={[styles.dayPill, isSelected && styles.dayPillActive]}
                  onPress={() => setSelectedDate(day.date)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                    {day.date}
                  </Text>
                  <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                    {day.label}
                  </Text>
                  {isToday && !isSelected && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Day schedule */}
          <View style={styles.scheduleCard}>
            <Text style={styles.scheduleDate}>{dayLabel}</Text>

            {HOURS.map((hour) => {
              const session = todaySessions.find((s) => s.startHour === hour);
              const isLastHour = hour === HOURS[HOURS.length - 1];
              return (
                <View key={hour}>
                  <View style={styles.hourRow}>
                    <Text style={styles.hourLabel}>{hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}</Text>
                    <View style={styles.hourLine} />
                  </View>

                  {session && (
                    <View style={styles.sessionBlock}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionName}>{session.student}</Text>
                        <Text style={styles.sessionSubject}>{session.subject}</Text>
                      </View>
                      <View style={styles.sessionActions}>
                        <TouchableOpacity style={styles.actionBtn}>
                          <Ionicons name="checkmark" size={14} color={PRIMARY} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                          <Ionicons name="close" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Last hour gets a trailing dashed line */}
                  {isLastHour && (
                    <View style={styles.hourRow}>
                      <View style={styles.hourLineSpacer} />
                    </View>
                  )}
                </View>
              );
            })}

            {todaySessions.length === 0 && (
              <Text style={styles.noSessions}>No sessions scheduled</Text>
            )}
          </View>
        </View>

        {/* ── Tutor cards ── */}
        <View style={styles.section}>
          {TUTORS.map((t) => (
            <TutorCard key={t.id} tutor={t} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Tutor card component ─── */

function TutorCard({ tutor }: { tutor: Tutor }) {
  const [fav, setFav] = useState(tutor.favorited);
  const fullStars = Math.floor(tutor.rating);
  const halfStar = tutor.rating % 1 >= 0.5;

  return (
    <View style={styles.tutorCard}>
      {/* Avatar */}
      <View style={[styles.tutorAvatar, { backgroundColor: tutor.avatarColor }]}>
        <Text style={styles.tutorInitials}>{tutor.initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.tutorInfo}>
        <Text style={styles.tutorName}>{tutor.name}</Text>
        <Text style={styles.tutorSubject}>{tutor.subject}</Text>

        {/* Rating + sessions row */}
        <View style={styles.tutorMeta}>
          <View style={styles.metaItem}>
            {[...Array(fullStars)].map((_, i) => (
              <Ionicons key={i} name="star" size={12} color={PRIMARY} />
            ))}
            {halfStar && <Ionicons name="star-half" size={12} color={PRIMARY} />}
            <Text style={styles.metaText}> {tutor.rating}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble-outline" size={12} color={PRIMARY} />
            <Text style={styles.metaText}> {tutor.reviews}</Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.tutorActions}>
        <TouchableOpacity style={styles.roundBtn}>
          <Ionicons name="information-circle-outline" size={18} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roundBtn, fav && styles.roundBtnActive]} onPress={() => setFav(!fav)}>
          <Ionicons name={fav ? "heart" : "heart-outline"} size={18} color={fav ? PRIMARY : "#94a3b8"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 100 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  hiText: { color: PRIMARY, fontSize: 12, fontWeight: "500" },
  nameText: { color: "#0f172a", fontSize: 16, fontWeight: "700" },
  headerIcons: { flexDirection: "row", gap: 10 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },

  // Calendar section
  calSection: {
    backgroundColor: CAL_BG,
    borderRadius: 24,
    marginHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 20,
  },
  weekStrip: {
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 12,
  },
  dayPill: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 52,
    gap: 4,
  },
  dayPillActive: { backgroundColor: PRIMARY },
  dayLabel: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  dayLabelActive: { color: "#fff" },
  dayName: { fontSize: 11, fontWeight: "500", color: "#475569" },
  dayNameActive: { color: "rgba(255,255,255,0.8)" },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: PRIMARY,
    marginTop: 2,
  },

  // Schedule card
  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 12,
    padding: 14,
  },
  scheduleDate: {
    textAlign: "right",
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  hourLabel: { width: 44, fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  hourLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  hourLineSpacer: { flex: 1 },
  sessionBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 10,
    marginLeft: 52,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
  },
  sessionName: { color: PRIMARY, fontSize: 13, fontWeight: "700" },
  sessionSubject: { color: "#64748b", fontSize: 11, marginTop: 2 },
  sessionActions: { flexDirection: "row", gap: 6, marginLeft: 8 },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  noSessions: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    paddingVertical: 12,
  },

  // Tutors section
  section: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tutorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tutorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tutorInitials: { fontSize: 20, fontWeight: "700", color: PRIMARY },
  tutorInfo: { flex: 1 },
  tutorName: { color: PRIMARY, fontSize: 14, fontWeight: "700", marginBottom: 2 },
  tutorSubject: { color: "#475569", fontSize: 12, marginBottom: 6 },
  tutorMeta: { flexDirection: "row", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { color: "#475569", fontSize: 12 },
  tutorActions: { gap: 8, marginLeft: 8 },
  roundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  roundBtnActive: {
    backgroundColor: CARD_BG,
    borderColor: PRIMARY,
  },
});
