import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";
import { supabase } from "../../lib/supabase";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

/* ─── Subject → tier & price ─── */
const SUBJECT_TIER: Record<string, "Basic" | "Upper" | "SAT"> = {};
const TIER_SUBJECTS = {
  Basic: ["Reading & Writing", "Math", "Science", "Social Studies", "Spelling"],
  Upper: ["Algebra I / II", "Geometry", "Pre-Calculus / Calculus", "Biology", "Chemistry", "Physics", "English / Literature", "US History / World History"],
  SAT:   ["SAT Math", "SAT Reading & Writing", "ACT", "PSAT"],
};
Object.entries(TIER_SUBJECTS).forEach(([tier, subjects]) => {
  subjects.forEach((s) => { SUBJECT_TIER[s] = tier as "Basic" | "Upper" | "SAT"; });
});
const TIER_PRICE: Record<"Basic" | "Upper" | "SAT", number> = {
  Basic: 35, Upper: 40, SAT: 45,
};
function sessionPrice(subject: string, duration: number): number {
  const tier = SUBJECT_TIER[subject] ?? "Basic";
  return parseFloat((TIER_PRICE[tier] * (duration / 60)).toFixed(2));
}

/* ─── Tier styling ─── */
const TIER_STYLE: Record<string, { color: string; bg: string }> = {
  Basic: { color: "#0369a1", bg: "#e0f2fe" },
  Upper: { color: "#7c3aed", bg: "#ede9fe" },
  SAT:   { color: "#b45309", bg: "#fef3c7" },
};

/* ─── Frequency badge ─── */
const FREQ_STYLE: Record<string, { color: string; bg: string }> = {
  "One-time":  { color: "#64748b", bg: "#f1f5f9" },
  "Weekly":    { color: "#065f46", bg: "#d1fae5" },
  "Biweekly":  { color: "#1e40af", bg: "#dbeafe" },
  "Monthly":   { color: "#7c3aed", bg: "#ede9fe" },
};
function freqLabel(frequency: string, count: number): string {
  if (frequency === "One-time" || !count) return frequency ?? "One-time";
  const unit = frequency === "Weekly" ? "wk" : frequency === "Biweekly" ? "2 wks" : "mo";
  return `${count}× / ${unit}`;
}

/* ─── Avatar helpers ─── */
const AVATAR_COLORS = ["#c7d2fe","#fde8d8","#d1fae5","#fef9c3","#fee2e2","#ddd6fe","#fce7f3","#ccfbf1"];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type RequestRow = {
  id: string;
  student_name: string;
  student_profile_id: string | null;
  student_id: string | null;
  parent_id: string | null;
  subject: string;
  grade: string;
  session_type: string;
  format: string;
  frequency: string;
  sessions_per_period: number;
  preferred_date: string;
  preferred_time: string;
  duration: number;
  zip: string | null;
  notes: string | null;
};

export default function TutorFindScreen() {
  const { profile } = useAuth();
  const [format,   setFormat]   = useState<"Virtual" | "In-Person">("Virtual");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!profile?.id) return;
    loadRequests();
  }, [profile?.id]));

  async function loadRequests() {
    if (requests.length === 0) setLoading(true);
    try {
      const { data } = await supabase
        .from("session_requests")
        .select(`
          id, subject, format, frequency, sessions_per_period,
          preferred_date, preferred_time, duration, zip, notes,
          session_type, grade_level,
          parent_id, student_profile_id, student_id,
          student_profile:profiles!session_requests_student_profile_id_fkey(full_name),
          managed_student:students!session_requests_student_id_fkey(full_name, grade_level)
        `)
        .eq("status", "pending")
        .is("tutor_id", null)
        .order("created_at", { ascending: true });

      const mapped: RequestRow[] = (data ?? []).map((r: any) => ({
        id:                  r.id,
        student_name:        r.student_profile?.full_name ?? r.managed_student?.full_name ?? "Student",
        student_profile_id:  r.student_profile_id ?? null,
        student_id:          r.student_id ?? null,
        parent_id:           r.parent_id ?? null,
        subject:             r.subject ?? "General",
        grade:               r.grade_level ?? r.managed_student?.grade_level ?? "",
        session_type:        r.session_type ?? "Individual",
        format:              r.format ?? "Virtual",
        frequency:           r.frequency ?? "One-time",
        sessions_per_period: r.sessions_per_period ?? 1,
        preferred_date:      r.preferred_date ?? "",
        preferred_time:      r.preferred_time ?? "",
        duration:            r.duration ?? 60,
        zip:                 r.zip ?? null,
        notes:               r.notes ?? null,
      }));

      setRequests(mapped);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(req: RequestRow) {
    Alert.alert(
      "Accept Request?",
      `Book a ${req.frequency.toLowerCase()} session with ${req.student_name} for ${req.subject} on ${req.preferred_date} at ${req.preferred_time}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            setAccepting(req.id);

            const price = sessionPrice(req.subject, req.duration);

            // 1. Create session record
            const { error: sessionErr } = await supabase.from("sessions").insert({
              tutor_id:           profile!.id,
              student_profile_id: req.student_profile_id,
              student_id:         req.student_id,
              parent_id:          req.parent_id,
              subject:            req.subject,
              subject_tier:       (SUBJECT_TIER[req.subject] ?? "Basic").toLowerCase(),
              session_type:       "individual",
              session_date:       req.preferred_date,
              session_time:       req.preferred_time,
              duration:           req.duration,
              format:             req.format,
              frequency:          req.frequency,
              status:             "upcoming",
              price,
            });

            if (sessionErr) {
              setAccepting(null);
              Alert.alert("Error", "Could not create session. Please try again.");
              return;
            }

            // 2. Mark request as accepted
            await supabase
              .from("session_requests")
              .update({ status: "accepted", tutor_id: profile!.id })
              .eq("id", req.id);

            // 3. Remove from local list
            setRequests((prev) => prev.filter((r) => r.id !== req.id));
            setAccepting(null);

            Alert.alert("Confirmed!", "The session has been added to your schedule.");
          },
        },
      ]
    );
  }

  const virtualCount   = requests.filter((r) => r.format === "Virtual").length;
  const inPersonCount  = requests.filter((r) => r.format === "In-Person").length;

  const filtered = requests
    .filter((r) => r.format === format)
    .sort((a, b) =>
      format === "In-Person"
        ? (a.zip ?? "").localeCompare(b.zip ?? "")
        : 0
    );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Students</Text>
        <Text style={styles.headerSub}>Browse open session requests</Text>
      </View>

      {/* Virtual / In-Person toggle */}
      <View style={styles.toggleRow}>
        {(["Virtual", "In-Person"] as const).map((f) => {
          const count = f === "Virtual" ? virtualCount : inPersonCount;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.togglePill, format === f && styles.togglePillActive]}
              onPress={() => setFormat(f)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={f === "Virtual" ? "videocam-outline" : "location-outline"}
                size={15}
                color={format === f ? "#fff" : "#64748b"}
              />
              <Text style={[styles.togglePillText, format === f && styles.togglePillTextActive]}>
                {f}
              </Text>
              <View style={[styles.countBubble, format === f ? styles.countBubbleActive : styles.countBubbleInactive]}>
                <Text style={[styles.countBubbleText, format === f && styles.countBubbleTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {format === "In-Person" && (
        <View style={styles.sortHint}>
          <Ionicons name="funnel-outline" size={12} color="#94a3b8" />
          <Text style={styles.sortHintText}>Sorted by zip code</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="search-outline" size={32} color={PRIMARY} />
            </View>
            <Text style={styles.emptyTitle}>No open requests</Text>
            <Text style={styles.emptyBody}>
              {`No ${format.toLowerCase()} session requests right now.\nCheck back soon!`}
            </Text>
          </View>
        ) : (
          filtered.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              accepting={accepting === req.id}
              onAccept={() => handleAccept(req)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({
  req,
  accepting,
  onAccept,
}: {
  req: RequestRow;
  accepting: boolean;
  onAccept: () => void;
}) {
  const tier = TIER_STYLE[SUBJECT_TIER[req.subject] ?? "Basic"] ?? TIER_STYLE.Basic;
  const freq = FREQ_STYLE[req.frequency]                         ?? FREQ_STYLE["One-time"];
  const color = avatarColor(req.id);

  const dateLabel = req.preferred_date
    ? (() => {
        const d = new Date(req.preferred_date + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      })()
    : "";

  return (
    <View style={styles.card}>
      {/* Row 1: avatar + name/grade/subject + zip */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{getInitials(req.student_name)}</Text>
        </View>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{req.student_name}</Text>
            <Text style={styles.cardMeta}>
              {req.grade ? `${req.grade}` : ""}
              {req.session_type === "Group" ? (req.grade ? " · Group" : "Group") : ""}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.subjectPill, { backgroundColor: tier.bg }]}>
              <Text style={[styles.subjectPillText, { color: tier.color }]}>{req.subject}</Text>
            </View>
            {req.zip && (
              <View style={styles.zipBadge}>
                <Ionicons name="location-outline" size={11} color="#64748b" />
                <Text style={styles.zipText}>{req.zip}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Row 2: frequency + time + date */}
      <View style={styles.infoRow}>
        <View style={[styles.freqBadge, { backgroundColor: freq.bg }]}>
          <Ionicons name="repeat-outline" size={12} color={freq.color} />
          <Text style={[styles.freqText, { color: freq.color }]}>
            {freqLabel(req.frequency, req.sessions_per_period)}
          </Text>
        </View>
        {req.preferred_time ? (
          <>
            <Text style={styles.infoDot}>·</Text>
            <Ionicons name="time-outline" size={13} color="#94a3b8" />
            <Text style={styles.infoText}>{req.preferred_time} · {req.duration} min</Text>
          </>
        ) : null}
        {dateLabel ? (
          <>
            <Text style={styles.infoDot}>·</Text>
            <Text style={styles.infoText}>{dateLabel}</Text>
          </>
        ) : null}
      </View>

      {/* Notes */}
      {req.notes ? (
        <Text style={styles.cardNotes} numberOfLines={2}>"{req.notes}"</Text>
      ) : null}

      {/* Accept button */}
      <TouchableOpacity
        style={[styles.acceptBtn, accepting && { opacity: 0.6 }]}
        onPress={onAccept}
        activeOpacity={0.85}
        disabled={accepting}
      >
        <Text style={styles.acceptBtnText}>{accepting ? "Accepting…" : "Accept Request"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 13, color: "#94a3b8", marginTop: 3 },

  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  togglePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 13,
  },
  togglePillActive: { backgroundColor: PRIMARY },
  togglePillText: { color: "#64748b", fontSize: 14, fontWeight: "600" },
  togglePillTextActive: { color: "#fff" },
  countBubble: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countBubbleActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  countBubbleInactive: { backgroundColor: "#fff" },
  countBubbleText: { fontSize: 11, fontWeight: "700", color: PRIMARY },
  countBubbleTextActive: { color: "#fff" },

  sortHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sortHintText: { fontSize: 12, color: "#94a3b8" },

  scroll: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 8 },

  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  avatarText: { color: PRIMARY, fontSize: 16, fontWeight: "700" },
  cardName: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 3 },
  cardMeta: { fontSize: 12, color: "#94a3b8" },
  cardRight: { alignItems: "flex-end", gap: 6 },
  subjectPill: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  subjectPillText: { fontSize: 12, fontWeight: "700" },
  zipBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: CARD_BG, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  zipText: { fontSize: 11, color: "#64748b", fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#f1f5f9" },

  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap",
  },
  freqBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  freqText: { fontSize: 12, fontWeight: "700" },
  infoDot: { color: "#cbd5e1", fontSize: 14 },
  infoText: { fontSize: 12, color: "#64748b" },

  cardNotes: { fontSize: 13, color: "#94a3b8", fontStyle: "italic", lineHeight: 18 },

  acceptBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 2,
  },
  acceptBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: PRIMARY, shadowOpacity: 0.1, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  emptyTitle: { color: "#1e293b", fontSize: 16, fontWeight: "700" },
  emptyBody: { color: "#94a3b8", fontSize: 13, textAlign: "center", maxWidth: 240, lineHeight: 20 },
});
