import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";
import { formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
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

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function currentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end:   sunday.toISOString().split("T")[0],
  };
}

type UpcomingSession = {
  id: string;
  student_name: string;
  subject: string;
  tutor_name: string;
  session_date: string;
  session_time: string;
  duration: number;
  format: string;
};

type BillRow = {
  id: string;
  student_name: string;
  subject: string;
  session_date: string;
  price: number;
};

type Student = {
  id: string;
  full_name: string;
  grade_level: string;
};

export default function ParentHomeScreen() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [billRows,         setBillRows]         = useState<BillRow[]>([]);
  const [students,         setStudents]         = useState<Student[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const today  = new Date().toISOString().split("T")[0];
    const { start: weekStart, end: weekEnd } = currentWeekRange();

    const [upcomingRes, billRes, studentsRes] = await Promise.all([
      // Upcoming sessions
      supabase
        .from("sessions")
        .select(`
          id, subject, session_date, session_time, duration, format,
          student_profile:profiles!sessions_student_profile_id_fkey(full_name),
          managed_student:students!sessions_student_id_fkey(full_name),
          tutor:profiles!sessions_tutor_id_fkey(full_name)
        `)
        .eq("parent_id", userId)
        .eq("status", "upcoming")
        .gte("session_date", today)
        .order("session_date", { ascending: true })
        .order("session_time", { ascending: true })
        .limit(4),

      // This week's completed sessions for bill
      supabase
        .from("sessions")
        .select(`
          id, subject, session_date, price,
          student_profile:profiles!sessions_student_profile_id_fkey(full_name),
          managed_student:students!sessions_student_id_fkey(full_name)
        `)
        .eq("parent_id", userId)
        .eq("status", "completed")
        .gte("session_date", weekStart)
        .lte("session_date", weekEnd)
        .order("session_date", { ascending: true }),

      // Managed students
      supabase
        .from("students")
        .select("id, full_name, grade_level")
        .eq("parent_id", userId),
    ]);

    setUpcomingSessions(
      (upcomingRes.data ?? []).map((s: any) => ({
        id:           s.id,
        student_name: s.student_profile?.full_name ?? s.managed_student?.full_name ?? "Student",
        subject:      s.subject,
        tutor_name:   s.tutor?.full_name ?? "Tutor",
        session_date: s.session_date,
        session_time: s.session_time,
        duration:     s.duration,
        format:       s.format ?? "Virtual",
      }))
    );

    setBillRows(
      (billRes.data ?? []).map((s: any) => ({
        id:           s.id,
        student_name: s.student_profile?.full_name ?? s.managed_student?.full_name ?? "Student",
        subject:      s.subject,
        session_date: s.session_date,
        price:        s.price ?? 0,
      }))
    );

    setStudents(studentsRes.data ?? []);
  }

  const weekTotal = billRows.reduce((sum, s) => sum + s.price, 0);
  const { start: weekStart, end: weekEnd } = currentWeekRange();
  const weekLabel = `${new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(weekEnd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {firstName} 👋</Text>
            <Text style={styles.dateText}>{getTodayDate()}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Request CTA */}
        <TouchableOpacity
          style={styles.requestBtn}
          onPress={() => router.push("/(parent-tabs)/find")}
          activeOpacity={0.85}
        >
          <View style={styles.requestBtnInner}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.requestBtnText}>Request a Tutor</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity onPress={() => router.push("/(parent-tabs)/sessions")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {upcomingSessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>No upcoming sessions — <Text style={{ color: PRIMARY, fontWeight: "600" }}>Request a tutor</Text> to get started</Text>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {upcomingSessions.map((s, i) => (
                <View key={s.id}>
                  <View style={styles.sessionRow}>
                    <View style={[styles.sessionAvatar, { backgroundColor: avatarColor(s.id) }]}>
                      <Text style={styles.sessionAvatarText}>{getInitials(s.student_name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionName}>{s.student_name}</Text>
                      <Text style={styles.sessionSubject}>{s.subject} · {s.tutor_name}</Text>
                      <View style={styles.sessionMeta}>
                        <Ionicons name="time-outline" size={12} color="#94a3b8" />
                        <Text style={styles.sessionMetaText}>
                          {formatSessionDate(s.session_date)} · {formatTime(s.session_time)} · {s.duration} min
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.formatBadge, { backgroundColor: s.format === "Virtual" ? "#dbeafe" : "#dcfce7" }]}>
                      <Text style={[styles.formatText, { color: s.format === "Virtual" ? "#1d4ed8" : "#166534" }]}>
                        {s.format}
                      </Text>
                    </View>
                  </View>
                  {i < upcomingSessions.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* This Week's Bill */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>This Week's Bill</Text>
            <TouchableOpacity onPress={() => router.push("/parent-payment" as any)}>
              <Text style={styles.seeAll}>View portal</Text>
            </TouchableOpacity>
          </View>

          {billRows.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>No completed sessions this week yet</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.billCard}
              onPress={() => router.push("/parent-payment" as any)}
              activeOpacity={0.85}
            >
              <View style={styles.billTop}>
                <View>
                  <Text style={styles.billLabel}>AMOUNT DUE</Text>
                  <Text style={styles.billAmount}>${weekTotal.toFixed(0)}</Text>
                  <Text style={styles.billSub}>{billRows.length} session{billRows.length !== 1 ? "s" : ""} · {weekLabel}</Text>
                </View>
                <View style={styles.billPayBtn}>
                  <Ionicons name="card-outline" size={16} color={PRIMARY} />
                  <Text style={styles.billPayBtnText}>Pay</Text>
                </View>
              </View>
              <View style={styles.billDivider} />
              {billRows.map((s) => {
                const d = new Date(s.session_date + "T00:00:00");
                const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
                return (
                  <View key={s.id} style={styles.billRow}>
                    <Text style={styles.billRowDate}>{dayLabel}</Text>
                    <Text style={styles.billRowStudent}>{s.student_name.split(" ")[0]}</Text>
                    <Text style={styles.billRowSubject} numberOfLines={1}>{s.subject}</Text>
                    <Text style={styles.billRowPrice}>${s.price.toFixed(0)}</Text>
                  </View>
                );
              })}
            </TouchableOpacity>
          )}
        </View>

        {/* My Students */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Students</Text>
            <TouchableOpacity onPress={() => router.push("/(parent-tabs)/profile")}>
              <Text style={styles.seeAll}>Manage</Text>
            </TouchableOpacity>
          </View>

          {students.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={20} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>No students added yet — add one from your profile</Text>
            </View>
          ) : (
            <View style={styles.studentRow}>
              {students.map((st) => (
                <View key={st.id} style={styles.studentCard}>
                  <View style={[styles.studentAvatar, { backgroundColor: avatarColor(st.id) }]}>
                    <Text style={styles.studentAvatarText}>{getInitials(st.full_name)}</Text>
                  </View>
                  <Text style={styles.studentName}>{st.full_name.split(" ")[0]}</Text>
                  <Text style={styles.studentGrade}>{st.grade_level ?? "—"}</Text>
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
  scroll: { paddingBottom: 110 },

  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  dateText:  { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center", marginTop: 4,
  },

  requestBtn: {
    backgroundColor: PRIMARY, borderRadius: 20,
    marginHorizontal: 20, paddingHorizontal: 20, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 28,
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  requestBtnInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  requestBtnText:  { color: "#fff", fontSize: 17, fontWeight: "700" },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  seeAll: { fontSize: 13, color: PRIMARY, fontWeight: "600" },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f8fafc", borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  emptyBoxText: { color: "#94a3b8", fontSize: 13, flex: 1, lineHeight: 18 },

  sessionList: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20, overflow: "hidden" },
  sessionRow:  { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  sessionAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sessionAvatarText: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  sessionName:    { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  sessionSubject: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  sessionMeta:    { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionMetaText:{ fontSize: 11, color: "#94a3b8" },
  formatBadge:    { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  formatText:     { fontSize: 11, fontWeight: "700" },
  divider:        { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },

  studentRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  studentCard: {
    width: 100, backgroundColor: CARD_BG, borderRadius: 20,
    padding: 16, alignItems: "center", gap: 6,
  },
  studentAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  studentAvatarText: { color: PRIMARY, fontSize: 18, fontWeight: "700" },
  studentName:  { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  studentGrade: { fontSize: 11, color: "#64748b" },

  billCard: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20, overflow: "hidden" },
  billTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, backgroundColor: CARD_BG,
  },
  billLabel:  { fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.8, marginBottom: 3 },
  billAmount: { fontSize: 32, fontWeight: "800", color: PRIMARY, lineHeight: 36 },
  billSub:    { fontSize: 11, color: "#94a3b8", marginTop: 3 },
  billPayBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: PRIMARY,
  },
  billPayBtnText: { color: PRIMARY, fontSize: 13, fontWeight: "700" },
  billDivider:    { height: 1, backgroundColor: "#e2e8f0" },
  billRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 11, gap: 10,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  billRowDate:    { width: 30, fontSize: 11, fontWeight: "700", color: "#94a3b8" },
  billRowStudent: { width: 50, fontSize: 13, fontWeight: "600", color: "#0f172a" },
  billRowSubject: { flex: 1, fontSize: 12, color: "#64748b" },
  billRowPrice:   { fontSize: 14, fontWeight: "800", color: "#0f172a" },
});
