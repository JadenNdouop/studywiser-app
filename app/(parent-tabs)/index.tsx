import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SWButton,
  SWCard,
  SWEmptyState,
  SWHeader,
  SWSectionHeader,
  avatarTint,
  getInitials,
  subjectTint,
} from "../../components/sw";
import { MOCK_PARENT_SESSIONS, MOCK_STUDENTS, USE_MOCK } from "../../constants/mockData";
import { SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { formatTime } from "../../lib/format";
import { supabase } from "../../lib/supabase";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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
    if (USE_MOCK) {
      const today = new Date().toISOString().split("T")[0];
      const { start: weekStart, end: weekEnd } = currentWeekRange();
      setUpcomingSessions(
        MOCK_PARENT_SESSIONS
          .filter((s) => s.status === "upcoming" && s.session_date >= today)
          .map((s) => ({ id: s.id, student_name: s.student_name, subject: s.subject, tutor_name: s.tutor_name, session_date: s.session_date, session_time: s.session_time, duration: s.duration, format: s.format }))
          .slice(0, 4)
      );
      setBillRows(
        MOCK_PARENT_SESSIONS
          .filter((s) => s.status === "completed" && s.session_date >= weekStart && s.session_date <= weekEnd)
          .map((s) => ({ id: s.id, student_name: s.student_name, subject: s.subject, session_date: s.session_date, price: s.price }))
      );
      setStudents(MOCK_STUDENTS);
      return;
    }
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
  const [dollars, cents] = weekTotal.toFixed(2).split(".");
  const { start: weekStart, end: weekEnd } = currentWeekRange();
  const weekLabel = `${new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(weekEnd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <SWHeader initials={getInitials(profile?.full_name)} />

        {/* Page heading */}
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>Parent Dashboard</Text>
          <Text style={styles.subheading}>{getGreeting()}, {firstName} — checking in on your little achievers today?</Text>
        </View>

        {/* Hero: request a tutor */}
        <View style={styles.hero}>
          <View style={styles.heroCircle} />
          <Text style={styles.heroTitle}>Need a helping hand with Homework?</Text>
          <Text style={styles.heroBody}>
            Match with the perfect tutor in minutes. Let&apos;s make learning feel like play!
          </Text>
          <SWButton
            label="Request a Tutor"
            variant="mint"
            onPress={() => router.push("/(parent-tabs)/find")}
            style={{ alignSelf: "flex-start", paddingVertical: 12 }}
            textStyle={{ fontSize: 15 }}
          />
        </View>

        {/* My Students */}
        <View style={styles.section}>
          <SWSectionHeader
            title="My Students"
            actionLabel="View All"
            onAction={() => router.push("/(parent-tabs)/profile")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.studentScroll}
            contentContainerStyle={styles.studentRow}
          >
            {students.map((st) => {
              const tint = avatarTint(st.id);
              return (
                <View key={st.id} style={styles.studentItem}>
                  <View style={[styles.studentAvatar, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.studentAvatarText, { color: tint.fg }]}>{getInitials(st.full_name)}</Text>
                  </View>
                  <Text style={styles.studentName}>{st.full_name.split(" ")[0]}</Text>
                  <View style={[styles.gradeChip, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.gradeChipText, { color: tint.fg }]}>{st.grade_level ?? "—"}</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.studentItem}
              onPress={() => router.push("/(parent-tabs)/profile")}
            >
              <View style={styles.addAvatar}>
                <Ionicons name="add" size={26} color={SW.color.muted} />
              </View>
              <Text style={[styles.studentName, { color: SW.color.muted }]}>Add Student</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <SWSectionHeader
            title="Upcoming Sessions"
            actionLabel="See all"
            onAction={() => router.push("/(parent-tabs)/sessions")}
          />
          {upcomingSessions.length === 0 ? (
            <SWEmptyState
              icon="calendar-outline"
              title="No upcoming sessions"
              subtitle="Request a tutor to get started"
            />
          ) : (
            <View style={{ gap: SW.space.stack }}>
              {upcomingSessions.map((s) => {
                const tint = subjectTint(s.subject);
                return (
                  <SWCard key={s.id} tint={tint.fg} style={styles.sessionCard}>
                    <View style={[styles.subjectIcon, { backgroundColor: tint.bg }]}>
                      <Ionicons name={tint.icon as any} size={22} color={tint.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionTitle}>{s.subject}</Text>
                      <Text style={styles.sessionMeta}>
                        {s.student_name.split(" ")[0]} • {formatSessionDate(s.session_date)} at {formatTime(s.session_time)}
                      </Text>
                      <Text style={styles.sessionSub}>{s.tutor_name} · {s.format} · {s.duration} min</Text>
                    </View>
                  </SWCard>
                );
              })}
            </View>
          )}
        </View>

        {/* This Week's Bill */}
        <View style={styles.section}>
          {billRows.length === 0 ? (
            <>
              <SWSectionHeader title="This Week's Bill" />
              <SWEmptyState
                icon="receipt-outline"
                title="Nothing due yet"
                subtitle="Completed sessions this week will show up here"
              />
            </>
          ) : (
            <View style={styles.billCard}>
              <Text style={styles.billLabel}>This Week&apos;s Bill</Text>
              <View style={styles.billAmountRow}>
                <Text style={styles.billAmount}>${dollars}</Text>
                <Text style={styles.billCents}>.{cents}</Text>
              </View>
              <Text style={styles.billSub}>
                {billRows.length} session{billRows.length !== 1 ? "s" : ""} · {weekLabel}
              </Text>
              <SWButton
                label="Pay Now"
                onPress={() => router.push("/parent-payment" as any)}
                style={{ marginTop: 16 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SW.color.surface },
  scroll: { paddingBottom: 130 },

  headingWrap: { paddingHorizontal: SW.space.margin, marginBottom: 20 },
  heading: { ...SW.type.headlineLg, color: SW.color.onSurface },
  subheading: { ...SW.type.bodyMd, color: SW.color.muted, marginTop: 4 },

  hero: {
    marginHorizontal: SW.space.margin,
    marginBottom: 28,
    backgroundColor: SW.color.primaryContainer,
    borderRadius: SW.radius.xl,
    padding: SW.space.cardPad + 4,
    overflow: "hidden",
    ...SW.shadow("#2976c7", 0.35),
  },
  heroCircle: {
    position: "absolute",
    right: -70,
    bottom: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroTitle: { fontFamily: SW.font.bold, fontSize: 20, lineHeight: 27, color: "#fff", marginBottom: 8 },
  heroBody: { ...SW.type.bodyMd, color: "rgba(255,255,255,0.9)", marginBottom: 18 },

  section: { paddingHorizontal: SW.space.margin, marginBottom: 28 },

  studentScroll: { marginHorizontal: -SW.space.margin },
  studentRow: { gap: 18, paddingHorizontal: SW.space.margin },
  studentItem: { alignItems: "center", gap: 6, width: 84 },
  studentAvatar: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: "center", justifyContent: "center",
  },
  studentAvatarText: { fontFamily: "Quicksand_700Bold", fontSize: 22 },
  studentName: { ...SW.type.labelMd, color: SW.color.onSurface },
  gradeChip: { borderRadius: SW.radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  gradeChipText: { ...SW.type.labelSm },
  addAvatar: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2, borderStyle: "dashed", borderColor: SW.color.outline,
    alignItems: "center", justifyContent: "center",
  },

  sessionCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  subjectIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
  },
  sessionTitle: { ...SW.type.bodyLg, fontFamily: SW.font.bold, color: SW.color.onSurface },
  sessionMeta: { ...SW.type.bodyMd, fontSize: 14, color: SW.color.onSurfaceVariant, marginTop: 1 },
  sessionSub: { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted, marginTop: 2 },

  billCard: {
    backgroundColor: SW.color.surfaceHigh,
    borderRadius: SW.radius.xl,
    padding: SW.space.cardPad + 4,
  },
  billLabel: { ...SW.type.bodyMd, color: SW.color.onSurfaceVariant },
  billAmountRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 6 },
  billAmount: { fontFamily: SW.font.bold, fontSize: 44, lineHeight: 50, color: SW.color.primary },
  billCents: { fontFamily: SW.font.bold, fontSize: 18, color: SW.color.primary, marginTop: 6 },
  billSub: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, marginTop: 2 },
});
