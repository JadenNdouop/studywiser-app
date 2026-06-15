import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../context/auth";
import { supabase } from "../../lib/supabase";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRIMARY = "#014aad";
const INPUT_BG = "#eef2ff";
const ITEM_HEIGHT = 34;

/* ─── Time options 6:00 AM – 9:00 PM ─── */
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 21; h++) {
  for (const m of ["00", "30"]) {
    if (h === 21 && m === "30") break;
    const hour12 = h === 12 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    TIME_OPTIONS.push(`${hour12}:${m} ${ampm}`);
  }
}

/* ─── Subject data ─── */
const SUBJECTS = {
  "Basic (K–8)": ["Reading & Writing","Math","Science","Social Studies","Spelling"],
  "Upper-Level (9–12)": ["Algebra I / II","Geometry","Pre-Calculus / Calculus","Biology","Chemistry","Physics","English / Literature","US History / World History"],
  "SAT / Test Prep": ["SAT Math","SAT Reading & Writing","ACT","PSAT"],
};

const FREQUENCIES = ["Weekly", "Biweekly", "Monthly"];
type DayTime = { start: string; end: string };

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

/* ─── Inline scroll-wheel time picker ─── */
function InlineTimePicker({ value, onSelect }: { value: string; onSelect: (t: string) => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const initialIndex = value ? Math.max(0, TIME_OPTIONS.indexOf(value)) : 0;
  const [displayIndex, setDisplayIndex] = useState(initialIndex);

  useEffect(() => {
    const i = TIME_OPTIONS.indexOf(value);
    const target = i >= 0 ? i : 0;
    if (target === displayIndex && i >= 0) return;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: target * ITEM_HEIGHT, animated: i >= 0 });
      setDisplayIndex(target);
    }, 60);
  }, [value]);

  function handleScrollEnd(e: any) {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(Math.round(y / ITEM_HEIGHT), TIME_OPTIONS.length - 1));
    setDisplayIndex(index);
    onSelect(TIME_OPTIONS[index]);
  }

  return (
    <View style={styles.inlinePicker}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      >
        {TIME_OPTIONS.map((t, i) => {
          const dist = Math.abs(i - displayIndex);
          return (
            <TouchableOpacity
              key={t}
              style={styles.inlinePickerItem}
              onPress={() => {
                scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
                setDisplayIndex(i);
                onSelect(t);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.inlinePickerText,
                dist === 0 && styles.inlinePickerTextSelected,
                dist === 1 && styles.inlinePickerTextNear,
                dist >= 2 && styles.inlinePickerTextFar,
              ]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.inlineHighlight} pointerEvents="none" />
    </View>
  );
}

/* ─── Request status styling ─── */
const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7" },
  accepted:  { label: "Matched",   color: "#065f46", bg: "#d1fae5" },
  declined:  { label: "Declined",  color: "#7f1d1d", bg: "#fee2e2" },
  cancelled: { label: "Cancelled", color: "#475569", bg: "#f1f5f9" },
};

type Student = { id: string; full_name: string; grade_level: string };
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
  const [dayTimes,         setDayTimes]         = useState<Record<string, DayTime>>({});
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
      .select("id, full_name, grade_level")
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
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        setDayTimes((dt) => { const u = { ...dt }; delete u[day]; return u; });
        return prev.filter((d) => d !== day);
      } else {
        setDayTimes((dt) => ({ ...dt, [day]: { start: "", end: "" } }));
        return [...prev, day];
      }
    });
  }

  function updateDayTime(day: string, field: "start" | "end", value: string) {
    setDayTimes((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function applyToAllDays() {
    const firstDay = selectedDays.find((d) => dayTimes[d]?.start || dayTimes[d]?.end);
    if (!firstDay) { Alert.alert("No time set", "Select a time for at least one day first."); return; }
    const { start, end } = dayTimes[firstDay];
    const updated: Record<string, DayTime> = {};
    selectedDays.forEach((d) => { updated[d] = { start, end }; });
    setDayTimes(updated);
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
    const preferredTime    = dayTimes[preferredDay]?.start || "";
    const preferredTimeEnd = dayTimes[preferredDay]?.end   || "";

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
    setDayTimes({});
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Tutor</Text>
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
                <Ionicons name={f === "Virtual" ? "videocam-outline" : "location-outline"} size={15} color={format === f ? "#fff" : "#64748b"} />
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
                        {active && <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} />}
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

          {/* Per-day inline time pickers */}
          {selectedDays.length > 0 && (
            <>
              <View style={styles.timesHeader}>
                <Text style={styles.label}>Preferred Times</Text>
                {selectedDays.length > 1 && (
                  <TouchableOpacity style={styles.applyAllBtn} onPress={applyToAllDays} activeOpacity={0.75}>
                    <Ionicons name="copy-outline" size={13} color={PRIMARY} />
                    <Text style={styles.applyAllText}>Apply first to all</Text>
                  </TouchableOpacity>
                )}
              </View>
              {selectedDays.map((day) => (
                <View key={day} style={styles.dayTimeRow}>
                  <Text style={styles.dayTimeLabel}>{day}</Text>
                  <View style={styles.dayTimeInputs}>
                    <View style={styles.dayTimeField}>
                      <Text style={styles.timeFieldLabel}>From</Text>
                      <InlineTimePicker value={dayTimes[day]?.start ?? ""} onSelect={(t) => updateDayTime(day, "start", t)} />
                    </View>
                    <Text style={styles.timeSep}>–</Text>
                    <View style={styles.dayTimeField}>
                      <Text style={styles.timeFieldLabel}>To</Text>
                      <InlineTimePicker value={dayTimes[day]?.end ?? ""} onSelect={(t) => updateDayTime(day, "end", t)} />
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

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
              <Text style={styles.emptyBody}>Submit a request and we'll match you with the right tutor.</Text>
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
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
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
                    <Text style={styles.requestNotes} numberOfLines={2}>"{req.notes}"</Text>
                  ) : null}
                  {req.status === "pending" && (
                    <TouchableOpacity
                      onPress={() => handleDeleteRequest(req.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ position: "absolute", bottom: 16, right: 16 }}
                    >
                      <Ionicons name="trash-outline" size={17} color="#ef4444" />
                    </TouchableOpacity>
                  )}
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
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },

  tabRow: {
    flexDirection: "row", marginHorizontal: 20, marginBottom: 16,
    backgroundColor: INPUT_BG, borderRadius: 14, padding: 4, gap: 4,
  },
  tabPill: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  tabPillActive: { backgroundColor: PRIMARY },
  tabPillText: { color: "#64748b", fontSize: 14, fontWeight: "600" },
  tabPillTextActive: { color: "#fff" },

  scroll: { paddingHorizontal: 20, paddingBottom: 110 },

  label:    { color: "#1e293b", fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 4 },
  countBadge: { backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  emptyBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f8fafc", borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 16,
  },
  emptyBoxText: { color: "#94a3b8", fontSize: 13, flex: 1, lineHeight: 18 },

  studentRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 4 },
  studentChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 16, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fff",
    alignItems: "center",
  },
  studentChipActive:      { backgroundColor: PRIMARY, borderColor: PRIMARY },
  studentChipName:        { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  studentChipNameActive:  { color: "#fff" },
  studentChipGrade:       { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  studentChipGradeActive: { color: "rgba(255,255,255,0.75)" },

  input: {
    backgroundColor: INPUT_BG, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: "#1e293b", marginBottom: 16,
  },
  textArea: { height: 100, paddingTop: 14 },

  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fff",
  },
  toggleBtnActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  toggleBtnText:       { color: "#64748b", fontSize: 14, fontWeight: "600" },
  toggleBtnTextActive: { color: "#fff" },

  tierGroup: { marginBottom: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 14, overflow: "hidden" },
  tierHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: INPUT_BG,
  },
  tierLabel: { fontSize: 13, fontWeight: "700", color: "#334155" },
  subjectList: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 },
  subjectChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fff",
  },
  subjectChipActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  subjectChipText:       { color: "#475569", fontSize: 13, fontWeight: "500" },
  subjectChipTextActive: { color: "#fff" },

  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },

  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  dayPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  dayPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  dayPillText:   { fontSize: 13, fontWeight: "600", color: "#64748b" },
  dayPillTextActive: { color: "#fff" },

  timesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 4 },
  applyAllBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: INPUT_BG, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  applyAllText: { fontSize: 12, fontWeight: "600", color: PRIMARY },

  dayTimeRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginBottom: 10, backgroundColor: INPUT_BG, borderRadius: 16,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  dayTimeLabel:  { fontSize: 13, fontWeight: "700", color: "#334155", width: 34 },
  dayTimeInputs: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  dayTimeField:  { flex: 1 },
  timeFieldLabel: { fontSize: 10, fontWeight: "600", color: "#94a3b8", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
  timeSep: { fontSize: 15, color: "#94a3b8", fontWeight: "300", marginTop: 16 },

  inlinePicker: { height: ITEM_HEIGHT * 3, backgroundColor: "#fff", borderRadius: 10, overflow: "hidden" },
  inlinePickerItem: { height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" },
  inlinePickerText:         { fontSize: 13, fontWeight: "400" },
  inlinePickerTextSelected: { fontSize: 14, fontWeight: "700", color: PRIMARY },
  inlinePickerTextNear:     { color: "#94a3b8" },
  inlinePickerTextFar:      { color: "#d1d5db" },
  inlineHighlight: {
    position: "absolute", top: ITEM_HEIGHT, left: 8, right: 8, height: ITEM_HEIGHT,
    borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: "#c7d2fe",
  },

  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 8,
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  requestCard: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 18, padding: 16, marginBottom: 12, gap: 12 },
  requestCardTop: { flexDirection: "row", alignItems: "flex-start" },
  requestStudent: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  requestSubject: { fontSize: 13, color: "#64748b", marginTop: 2 },
  requestNotes:   { fontSize: 12, color: "#94a3b8", fontStyle: "italic", lineHeight: 17 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText:  { fontSize: 12, fontWeight: "700" },
  requestMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: INPUT_BG, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  metaText: { fontSize: 12, color: "#64748b", fontWeight: "500" },

  emptyCard: { backgroundColor: INPUT_BG, borderRadius: 20, paddingVertical: 48, paddingHorizontal: 24, alignItems: "center", gap: 10, marginTop: 8 },
  emptyTitle: { color: "#64748b", fontSize: 15, fontWeight: "600" },
  emptyBody:  { color: "#94a3b8", fontSize: 13, textAlign: "center", maxWidth: 240, lineHeight: 19 },
});
