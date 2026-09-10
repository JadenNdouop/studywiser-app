import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SWHeader, getInitials } from "../../components/sw";
import { SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { supabase } from "../../lib/supabase";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRIMARY = SW.color.primary;
const INPUT_BG = SW.color.inputBg;

/* ─── Fixed preferred-time slots. Exact timing is arranged with the tutor after matching. ─── */
const TIME_SLOTS: {
  key: string;
  label: string;
  range: string;
  start: string;
  end: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "morning",   label: "Morning",   range: "8:00 AM – 12:00 PM", start: "08:00:00", end: "12:00:00", icon: "sunny-outline" },
  { key: "afternoon", label: "Afternoon", range: "12:00 PM – 4:00 PM", start: "12:00:00", end: "16:00:00", icon: "partly-sunny-outline" },
  { key: "evening",   label: "Evening",   range: "4:00 PM – 8:00 PM",  start: "16:00:00", end: "20:00:00", icon: "moon-outline" },
];

/* ─── Subject data ─── */
const SUBJECTS = {
  "Basic (K–8)": ["Reading & Writing","Math","Science","Social Studies","Spelling"],
  "Upper-Level (9–12)": ["Algebra I / II","Geometry","Pre-Calculus / Calculus","Biology","Chemistry","Physics","English / Literature","US History / World History"],
  "SAT / Test Prep": ["SAT Math","SAT Reading & Writing","ACT","PSAT"],
};

const FREQUENCIES = ["Weekly", "Biweekly", "Monthly"];

/* ─── Next weekday date helper ─── */
const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function nextWeekdayDate(dayLabel: string): string {
  const target = DAY_INDEX[dayLabel] ?? 1;
  const today = new Date();
  const todayIdx = today.getDay();
  let diff = target - todayIdx;
  if (diff <= 0) diff += 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result.toISOString().split("T")[0];
}

/* ─── Format "HH:MM:SS" → "h:MM AM/PM" ─── */
function formatTime(raw: string): string {
  if (!raw) return "";
  const [hStr, mStr] = raw.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const ampm = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m} ${ampm}`;
}

/* ─── Request status styling ─── */
const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7" },
  accepted:  { label: "Matched",   color: "#065f46", bg: "#d1fae5" },
  declined:  { label: "Declined",  color: "#7f1d1d", bg: "#fee2e2" },
  cancelled: { label: "Cancelled", color: "#475569", bg: "#f1f5f9" },
};

type Student = { id: string; full_name: string; grade_level: string; profile_id: string | null };
type RequestRow = {
  id: string;
  student_name: string;
  subject: string;
  format: string;
  frequency: string;
  preferred_date: string;
  preferred_time: string;
  preferred_time_end: string;
  status: string;
  notes: string | null;
};

export default function FindScreen() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"new" | "requests">("new");

  // Form state
  const [selectedStudent,  setSelectedStudent]  = useState<Student | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDays,     setSelectedDays]     = useState<string[]>([]);
  const [selectedSlots,    setSelectedSlots]    = useState<string[]>([]);
  const [format,           setFormat]           = useState<"Virtual" | "In-Person">("Virtual");
  const [zip,              setZip]              = useState("");
  const [duration,         setDuration]         = useState<60 | 90>(60);
  const [recurring,        setRecurring]        = useState(false);
  const [frequency,        setFrequency]        = useState("Weekly");
  const [notes,            setNotes]            = useState("");
  const [subjectsOpen,     setSubjectsOpen]     = useState<Record<string, boolean>>({
    "Basic (K–8)": true, "Upper-Level (9–12)": false, "SAT / Test Prep": false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
      loadRequests();
    }, [])
  );

  async function loadStudents() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("students")
      .select("id, full_name, grade_level, profile_id")
      .eq("parent_id", userId);
    setStudents(data ?? []);
  }

  async function handleDeleteRequest(id: string) {
    Alert.alert("Delete Request", "Are you sure you want to delete this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setRequests((prev) => prev.filter((r) => r.id !== id));
          await supabase.from("session_requests").delete().eq("id", id);
        },
      },
    ]);
  }

  async function loadRequests() {
    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("session_requests")
      .select("id, subject, format, frequency, preferred_date, preferred_time, preferred_time_end, status, notes, student_id, student_profile_id, managed_student:students!session_requests_student_id_fkey(full_name), student_profile:profiles!session_requests_student_profile_id_fkey(full_name)")
      .eq("parent_id", userId)
      .order("created_at", { ascending: false });

    setRequests(
      (data ?? []).map((r: any) => ({
        id:             r.id,
        student_name:   r.managed_student?.full_name ?? r.student_profile?.full_name ?? "Student",
        subject:        r.subject ?? "",
        format:         r.format ?? "Virtual",
        frequency:      r.frequency ?? "One-time",
        preferred_date:     r.preferred_date ?? "",
        preferred_time:     r.preferred_time ?? "",
        preferred_time_end: r.preferred_time_end ?? "",
        status:         r.status ?? "pending",
        notes:          r.notes ?? null,
      }))
    );
  }

  function toggleSubject(subject: string) {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleSlot(key: string) {
    setSelectedSlots((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }

  async function handleSubmit() {
    if (!selectedStudent) { Alert.alert("Missing info", "Please select a student."); return; }
    if (selectedSubjects.length === 0) { Alert.alert("Missing info", "Please select at least one subject."); return; }
    if (selectedDays.length === 0) { Alert.alert("Missing info", "Please select at least one preferred day."); return; }
    if (format === "In-Person" && !zip.trim()) { Alert.alert("Missing info", "Please enter your zip code for in-person sessions."); return; }

    setSubmitting(true);

    // Build one request per subject (or just the first subject as primary)
    const primarySubject = selectedSubjects[0];
    const preferredDay   = selectedDays[0];
    const preferredDate  = nextWeekdayDate(preferredDay);
    // Time slots are ordered; span from the earliest chosen start to the latest chosen end.
    const chosenSlots      = TIME_SLOTS.filter((s) => selectedSlots.includes(s.key));
    const preferredTime    = chosenSlots.length ? chosenSlots[0].start : "";
    const preferredTimeEnd = chosenSlots.length ? chosenSlots[chosenSlots.length - 1].end : "";

    const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) { setSubmitting(false); Alert.alert("Error", "Not logged in."); return; }

    const SUBJECT_TIER: Record<string, string> = {};
    const TIER_SUBJECTS: Record<string, string[]> = {
      Basic: ["Reading & Writing", "Math", "Science", "Social Studies", "Spelling"],
      Upper: ["Algebra I / II", "Geometry", "Pre-Calculus / Calculus", "Biology", "Chemistry", "Physics", "English / Literature", "US History / World History"],
      SAT:   ["SAT Math", "SAT Reading & Writing", "ACT", "PSAT"],
    };
    Object.entries(TIER_SUBJECTS).forEach(([tier, subs]) => subs.forEach((s) => { SUBJECT_TIER[s] = tier; }));

    const { error } = await supabase.from("session_requests").insert({
      parent_id:      userId,
      student_id:     selectedStudent.id,
      student_profile_id: selectedStudent.profile_id,
      subject:        primarySubject,
      subject_tier:   (SUBJECT_TIER[primarySubject] ?? "Basic").toLowerCase(),
      subjects:       selectedSubjects,
      format,
      frequency:      recurring ? frequency.toLowerCase() : null,
      recurring,
      preferred_date:     preferredDate,
      preferred_time:     preferredTime     || null,
      preferred_time_end: preferredTimeEnd  || null,
      preferred_days: selectedDays,
      duration_hours: duration / 60,
      notes:          notes.trim() || null,
      zip:            format === "In-Person" ? zip.trim() : null,
      session_type:   "individual",
      grade_level:    selectedStudent.grade_level,
      status:         "pending",
    });

    setSubmitting(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    // Reset form
    setSelectedStudent(null);
    setSelectedSubjects([]);
    setSelectedDays([]);
    setSelectedSlots([]);
    setNotes("");
    setZip("");
    setRecurring(false);

    await loadRequests();

    Alert.alert(
      "Request Submitted!",
      "We'll match you with a tutor soon. You'll receive a notification once confirmed.",
      [{ text: "OK", onPress: () => setTab("requests") }]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <SWHeader initials={getInitials(profile?.full_name)} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Perfect Tutor</Text>
        <Text style={styles.headerSub}>Let&apos;s find the best match for your learning journey in just a few steps.</Text>
      </View>

      <View style={styles.tabRow}>
        {(["new", "requests"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
            onPress={() => setTab(t)} activeOpacity={0.75}
          >
            <Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>
              {t === "new" ? "New Request" : "My Requests"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "new" ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Student selector */}
          <Text style={styles.label}>Student</Text>
          {students.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="person-add-outline" size={18} color="#cbd5e1" />
              <Text style={styles.emptyBoxText}>No students found — add a student from your profile first</Text>
            </View>
          ) : (
            <View style={styles.studentRow}>
              {students.map((st) => {
                const active = selectedStudent?.id === st.id;
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.studentChip, active && styles.studentChipActive]}
                    onPress={() => setSelectedStudent(active ? null : st)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.studentChipName, active && styles.studentChipNameActive]}>{st.full_name}</Text>
                    <Text style={[styles.studentChipGrade, active && styles.studentChipGradeActive]}>{st.grade_level}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Format toggle */}
          <Text style={[styles.label, { marginTop: 16 }]}>Session Type</Text>
          <View style={styles.toggleRow}>
            {(["Virtual", "In-Person"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.toggleBtn, format === f && styles.toggleBtnActive]}
                onPress={() => setFormat(f)} activeOpacity={0.75}
              >
                <Ionicons name={f === "Virtual" ? "videocam-outline" : "location-outline"} size={15} color={format === f ? SW.color.onMint : SW.color.muted} />
                <Text style={[styles.toggleBtnText, format === f && styles.toggleBtnTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {format === "In-Person" && (
            <>
              <Text style={styles.label}>Zip Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10001"
                placeholderTextColor="#aab4d4"
                value={zip}
                onChangeText={setZip}
                keyboardType="numeric"
                maxLength={5}
              />
            </>
          )}

          {/* Duration */}
          <Text style={styles.label}>Session Length</Text>
          <View style={styles.toggleRow}>
            {([60, 90] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.toggleBtn, duration === d && styles.toggleBtnActive]}
                onPress={() => setDuration(d)} activeOpacity={0.75}
              >
                <Text style={[styles.toggleBtnText, duration === d && styles.toggleBtnTextActive]}>{d} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subject — multi-select */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Subject(s)</Text>
            {selectedSubjects.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{selectedSubjects.length} selected</Text>
              </View>
            )}
          </View>
          {(Object.entries(SUBJECTS) as [string, string[]][]).map(([tier, subjects]) => (
            <View key={tier} style={styles.tierGroup}>
              <TouchableOpacity
                style={styles.tierHeader}
                onPress={() => setSubjectsOpen((p) => ({ ...p, [tier]: !p[tier] }))}
                activeOpacity={0.7}
              >
                <Text style={styles.tierLabel}>{tier}</Text>
                <Ionicons name={subjectsOpen[tier] ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
              </TouchableOpacity>
              {subjectsOpen[tier] && (
                <View style={styles.subjectList}>
                  {subjects.map((s) => {
                    const active = selectedSubjects.includes(s);
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.subjectChip, active && styles.subjectChipActive]}
                        onPress={() => toggleSubject(s)} activeOpacity={0.75}
                      >
                        {active && <Ionicons name="checkmark" size={13} color={SW.color.onMint} style={{ marginRight: 4 }} />}
                        <Text style={[styles.subjectChipText, active && styles.subjectChipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}

          {/* Preferred Days */}
          <Text style={[styles.label, { marginTop: 20 }]}>Preferred Days</Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                  onPress={() => toggleDay(day)} activeOpacity={0.75}
                >
                  <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preferred time slots */}
          <Text style={[styles.label, { marginTop: 8 }]}>Preferred Time</Text>
          <View style={styles.slotList}>
            {TIME_SLOTS.map((slot) => {
              const active = selectedSlots.includes(slot.key);
              return (
                <TouchableOpacity
                  key={slot.key}
                  style={[styles.slotCard, active && styles.slotCardActive]}
                  onPress={() => toggleSlot(slot.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.slotIcon, active && styles.slotIconActive]}>
                    <Ionicons name={slot.icon} size={20} color={active ? SW.color.onMint : PRIMARY} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.slotLabel, active && styles.slotLabelActive]}>{slot.label}</Text>
                    <Text style={[styles.slotRange, active && styles.slotRangeActive]}>{slot.range}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color={SW.color.onMint} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.slotHint}>
            You&apos;ll arrange the exact time with your tutor once you&apos;re matched.
          </Text>

          {/* Recurring */}
          <View style={styles.switchRow}>
            <Text style={styles.label}>Recurring Session</Text>
            <Switch value={recurring} onValueChange={setRecurring} trackColor={{ false: "#e2e8f0", true: PRIMARY }} thumbColor="#fff" />
          </View>

          {recurring && (
            <>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.toggleRow}>
                {FREQUENCIES.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.toggleBtn, frequency === f && styles.toggleBtnActive, { flex: 1 }]}
                    onPress={() => setFrequency(f)} activeOpacity={0.75}
                  >
                    <Text style={[styles.toggleBtnText, frequency === f && styles.toggleBtnTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Notes */}
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any details for the tutor — specific topics, learning goals, etc."
            placeholderTextColor="#aab4d4"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit} activeOpacity={0.85}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? "Submitting…" : "Submit Request"}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {requests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyBody}>Submit a request and we&apos;ll match you with the right tutor.</Text>
            </View>
          ) : (
            requests.map((req) => {
              const s = STATUS_LABEL[req.status] ?? STATUS_LABEL.pending;
              const dateLabel = req.preferred_date
                ? new Date(req.preferred_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "";
              return (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestStudent}>{req.student_name}</Text>
                      <Text style={styles.requestSubject}>{req.subject}</Text>
                    </View>
                    <View style={styles.requestCardTopRight}>
                      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                      </View>
                      {req.status === "pending" && (
                        <TouchableOpacity
                          onPress={() => handleDeleteRequest(req.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.deleteBtn}
                        >
                          <Ionicons name="trash-outline" size={17} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <View style={styles.requestMeta}>
                    <View style={styles.metaPill}>
                      <Ionicons name={req.format === "Virtual" ? "videocam-outline" : "location-outline"} size={12} color="#64748b" />
                      <Text style={styles.metaText}>{req.format}</Text>
                    </View>
                    {req.frequency !== "One-time" && (
                      <View style={styles.metaPill}>
                        <Ionicons name="repeat-outline" size={12} color="#64748b" />
                        <Text style={styles.metaText}>{req.frequency}</Text>
                      </View>
                    )}
                    {dateLabel ? (
                      <View style={styles.metaPill}>
                        <Ionicons name="calendar-outline" size={12} color="#64748b" />
                        <Text style={styles.metaText}>{dateLabel}</Text>
                      </View>
                    ) : null}
                    {req.preferred_time ? (
                      <View style={styles.metaPill}>
                        <Ionicons name="time-outline" size={12} color="#64748b" />
                        <Text style={styles.metaText}>
                          {formatTime(req.preferred_time)}
                          {req.preferred_time_end ? ` – ${formatTime(req.preferred_time_end)}` : ""}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {req.notes ? (
                    <Text style={styles.requestNotes} numberOfLines={2}>{`"${req.notes}"`}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SW.color.surface },
  header: { paddingHorizontal: SW.space.margin, paddingBottom: 16 },
  headerTitle: { ...SW.type.headlineMd, color: SW.color.primary },
  headerSub: { ...SW.type.bodyMd, color: SW.color.onSurfaceVariant, marginTop: 4 },

  tabRow: {
    flexDirection: "row", marginHorizontal: SW.space.margin, marginBottom: 16,
    backgroundColor: SW.color.surfaceContainer, borderRadius: SW.radius.full, padding: 4, gap: 4,
  },
  tabPill: { flex: 1, paddingVertical: 10, borderRadius: SW.radius.full, alignItems: "center" },
  tabPillActive: { backgroundColor: SW.color.mint },
  tabPillText: { ...SW.type.labelMd, color: SW.color.onSurfaceVariant },
  tabPillTextActive: { color: SW.color.onMint },

  scroll: { paddingHorizontal: SW.space.margin, paddingBottom: 130 },

  label: { ...SW.type.labelSm, fontSize: 13, letterSpacing: 0.8, textTransform: "uppercase", color: SW.color.primary, marginBottom: 10, marginTop: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 4 },
  countBadge: { backgroundColor: SW.color.mint, borderRadius: SW.radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { ...SW.type.labelSm, color: SW.color.onMint },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: SW.color.surfaceLow, borderRadius: SW.radius.md,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16,
  },
  emptyBoxText: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, flex: 1 },

  studentRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 4 },
  studentChip: {
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: SW.radius.md, backgroundColor: SW.color.card,
    alignItems: "center",
    ...SW.shadow(SW.color.outline, 0.2),
  },
  studentChipActive:      { backgroundColor: SW.color.mint },
  studentChipName:        { ...SW.type.labelMd, color: SW.color.onSurface },
  studentChipNameActive:  { color: SW.color.onMint },
  studentChipGrade:       { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted, marginTop: 2 },
  studentChipGradeActive: { color: SW.color.onMint },

  input: {
    backgroundColor: SW.color.inputBg, borderRadius: SW.radius.md,
    paddingHorizontal: 16, paddingVertical: 14,
    ...SW.type.bodyMd, fontSize: 14, color: SW.color.onSurface, marginBottom: 16,
  },
  textArea: { height: 100, paddingTop: 14 },

  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: SW.radius.md, backgroundColor: SW.color.surfaceContainer,
  },
  toggleBtnActive:     { backgroundColor: SW.color.mint },
  toggleBtnText:       { ...SW.type.labelMd, color: SW.color.onSurfaceVariant },
  toggleBtnTextActive: { color: SW.color.onMint },

  tierGroup: { marginBottom: 10, backgroundColor: SW.color.card, borderRadius: SW.radius.md, overflow: "hidden", ...SW.shadow(SW.color.outline, 0.18) },
  tierHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  tierLabel: { ...SW.type.labelMd, fontSize: 15, color: SW.color.onSurface },
  subjectList: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  subjectChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: SW.radius.full, backgroundColor: SW.color.surfaceContainer,
  },
  subjectChipActive:     { backgroundColor: SW.color.mint },
  subjectChipText:       { ...SW.type.labelMd, fontFamily: SW.font.medium, fontSize: 13, color: SW.color.onSurfaceVariant },
  subjectChipTextActive: { color: SW.color.onMint, fontFamily: SW.font.semibold },

  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },

  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  dayPill: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    backgroundColor: SW.color.surfaceContainer,
  },
  dayPillActive: { backgroundColor: SW.color.mint },
  dayPillText:   { ...SW.type.labelMd, color: SW.color.onSurfaceVariant },
  dayPillTextActive: { color: SW.color.onMint },

  slotList: { gap: 10, marginBottom: 8 },
  slotCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: SW.color.card, borderRadius: SW.radius.md,
    paddingVertical: 14, paddingHorizontal: 16,
    ...SW.shadow(SW.color.outline, 0.16),
  },
  slotCardActive: { backgroundColor: SW.color.mint },
  slotIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: SW.color.surfaceContainer,
    alignItems: "center", justifyContent: "center",
  },
  slotIconActive: { backgroundColor: "rgba(255,255,255,0.45)" },
  slotLabel:       { ...SW.type.labelMd, fontSize: 15, color: SW.color.onSurface },
  slotLabelActive: { color: SW.color.onMint },
  slotRange:       { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.muted, marginTop: 2 },
  slotRangeActive: { color: SW.color.onMint },
  slotHint: { ...SW.type.bodyMd, fontSize: 12, color: SW.color.muted, fontStyle: "italic", marginBottom: 8, marginTop: 2 },

  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: SW.radius.full, paddingVertical: 17, alignItems: "center", marginTop: 8,
    ...SW.shadow(PRIMARY, 0.3),
  },
  submitBtnText: { fontFamily: SW.font.bold, fontSize: 16, color: "#fff" },

  requestCard: {
    backgroundColor: SW.color.card, borderRadius: SW.radius.lg,
    padding: SW.space.cardPad, marginBottom: 14, gap: 12,
    ...SW.shadow(SW.color.outline, 0.22),
  },
  requestCardTop: { flexDirection: "row", alignItems: "flex-start" },
  requestCardTopRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  deleteBtn: { padding: 2 },
  requestStudent: { ...SW.type.bodyLg, fontFamily: SW.font.bold, color: SW.color.onSurface },
  requestSubject: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, marginTop: 2 },
  requestNotes:   { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, fontStyle: "italic" },
  statusBadge: { borderRadius: SW.radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  statusText:  { ...SW.type.labelSm },
  requestMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: SW.color.surfaceLow, borderRadius: SW.radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  metaText: { ...SW.type.labelSm, fontFamily: SW.font.medium, color: SW.color.onSurfaceVariant },

  emptyCard: { backgroundColor: SW.color.surfaceLow, borderRadius: SW.radius.lg, paddingVertical: 48, paddingHorizontal: 24, alignItems: "center", gap: 10, marginTop: 8 },
  emptyTitle: { ...SW.type.labelMd, fontSize: 15, color: SW.color.onSurface },
  emptyBody:  { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, textAlign: "center", maxWidth: 240 },
});
