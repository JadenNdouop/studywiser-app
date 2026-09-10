import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SWHeader, avatarTint, getInitials, subjectTint } from "../../components/sw";
import { MOCK_SESSION_REQUESTS, USE_MOCK } from "../../constants/mockData";
import { SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";
import { supabase } from "../../lib/supabase";

const PRIMARY = SW.color.primary;

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

function freqLabel(frequency: string, count: number): string {
  if (frequency === "One-time" || !count) return frequency ?? "One-time";
  const unit = frequency === "Weekly" ? "wk" : frequency === "Biweekly" ? "2 wks" : "mo";
  return `${count}× / ${unit}`;
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
    if (USE_MOCK) {
      setRequests(MOCK_SESSION_REQUESTS.filter((r) => r.format === format) as any);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("session_requests")
        .select(`
          id, subject, format, frequency, duration_hours,
          preferred_date, preferred_time, zip, notes,
          session_type, grade_level,
          parent_id, student_profile_id, student_id,
          student_profile:profiles!session_requests_student_profile_id_fkey(full_name),
          managed_student:students!session_requests_student_id_fkey(full_name, grade_level)
        `)
        .eq("status", "pending")
        .is("tutor_id", null)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("loadRequests error", error);
        Alert.alert("Couldn't load requests", error.message);
        return;
      }

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
        sessions_per_period: 1,
        preferred_date:      r.preferred_date ?? "",
        preferred_time:      r.preferred_time ?? "",
        duration:            Math.round((r.duration_hours ?? 1) * 60),
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

            if (!USE_MOCK) {
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
            }

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
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <SWHeader initials={getInitials(profile?.full_name)} />

      <View style={styles.headingWrap}>
        <Text style={styles.heading}>Find Students</Text>
        <Text style={styles.subheading}>Browse open session requests</Text>
      </View>

      {/* Virtual / In-Person toggle */}
      <View style={styles.toggleRow}>
        {(["Virtual", "In-Person"] as const).map((f) => {
          const count = f === "Virtual" ? virtualCount : inPersonCount;
          const active = format === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.togglePill, active && styles.togglePillActive]}
              onPress={() => setFormat(f)}
              activeOpacity={0.75}
            >
              <Text style={[styles.togglePillText, active && styles.togglePillTextActive]}>
                {f} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {format === "In-Person" && (
        <View style={styles.sortHint}>
          <Ionicons name="funnel-outline" size={12} color={SW.color.muted} />
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
  const tint = avatarTint(req.id);
  const subj = subjectTint(req.subject);

  const dateLabel = req.preferred_date
    ? (() => {
        const d = new Date(req.preferred_date + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      })()
    : "";

  return (
    <View style={styles.card}>
      {/* Row 1: avatar + name + grade */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
          <Text style={[styles.avatarText, { color: tint.fg }]}>{getInitials(req.student_name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{req.student_name}</Text>
          <View style={styles.gradeRow}>
            {req.grade ? (
              <View style={styles.gradeChip}>
                <Text style={styles.gradeChipText}>{req.grade}</Text>
              </View>
            ) : null}
            {req.session_type === "Group" ? (
              <View style={styles.gradeChip}>
                <Text style={styles.gradeChipText}>Group</Text>
              </View>
            ) : null}
          </View>
        </View>
        {req.zip && (
          <View style={styles.zipBadge}>
            <Ionicons name="location-outline" size={12} color={SW.color.onSurfaceVariant} />
            <Text style={styles.zipText}>{req.zip}</Text>
          </View>
        )}
      </View>

      {/* Row 2: subject + frequency chips */}
      <View style={styles.chipRow}>
        <View style={[styles.chip, { backgroundColor: subj.bg }]}>
          <Ionicons name={subj.icon as any} size={13} color={subj.fg} />
          <Text style={[styles.chipText, { color: subj.fg }]}>{req.subject}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: SW.color.lavenderSoft }]}>
          <Ionicons name="repeat-outline" size={13} color={PRIMARY} />
          <Text style={[styles.chipText, { color: PRIMARY }]}>
            {freqLabel(req.frequency, req.sessions_per_period)}
          </Text>
        </View>
      </View>

      {/* Inner panel: schedule + note */}
      <View style={styles.innerPanel}>
        <View style={styles.scheduleRow}>
          <Ionicons name="calendar-outline" size={15} color={SW.color.onSurfaceVariant} />
          <Text style={styles.scheduleText}>
            {[dateLabel, req.preferred_time, `${req.duration} min`].filter(Boolean).join(" · ")}
          </Text>
        </View>
        {req.notes ? (
          <Text style={styles.cardNotes} numberOfLines={3}>{`"${req.notes}"`}</Text>
        ) : null}
      </View>

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
  safe: { flex: 1, backgroundColor: SW.color.surface },

  headingWrap: { paddingHorizontal: SW.space.margin, marginBottom: 16 },
  heading: { ...SW.type.headlineLg, fontSize: 34, lineHeight: 42, color: SW.color.onSurface },
  subheading: { ...SW.type.bodyMd, color: SW.color.muted, marginTop: 4 },

  toggleRow: {
    flexDirection: "row",
    marginHorizontal: SW.space.margin,
    marginBottom: 8,
    backgroundColor: SW.color.surfaceContainer,
    borderRadius: SW.radius.full,
    padding: 4,
    gap: 4,
  },
  togglePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: SW.radius.full,
  },
  togglePillActive: {
    backgroundColor: SW.color.card,
    ...SW.shadow(SW.color.outline, 0.3),
  },
  togglePillText: { ...SW.type.labelMd, fontSize: 15, color: SW.color.onSurfaceVariant },
  togglePillTextActive: { color: PRIMARY },

  sortHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: SW.space.margin + 4,
    marginBottom: 8,
  },
  sortHintText: { ...SW.type.bodyMd, fontSize: 12, color: SW.color.muted },

  scroll: { paddingHorizontal: SW.space.margin, paddingBottom: 130, paddingTop: 10 },

  card: {
    backgroundColor: SW.color.card,
    borderRadius: SW.radius.lg,
    padding: SW.space.cardPad,
    marginBottom: 16,
    gap: 14,
    ...SW.shadow(SW.color.outline, 0.22),
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: SW.font.bold, fontSize: 18 },
  cardName: { ...SW.type.headlineMd, fontSize: 21, color: SW.color.onSurface },
  gradeRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  gradeChip: {
    backgroundColor: SW.color.surfaceContainer,
    borderRadius: SW.radius.full, paddingHorizontal: 10, paddingVertical: 3,
  },
  gradeChipText: { ...SW.type.labelSm, color: SW.color.onSurfaceVariant },
  zipBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: SW.color.surfaceLow, borderRadius: SW.radius.full,
    paddingHorizontal: 9, paddingVertical: 4, alignSelf: "flex-start",
  },
  zipText: { ...SW.type.labelSm, color: SW.color.onSurfaceVariant },

  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: SW.radius.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { ...SW.type.labelMd, fontSize: 13 },

  innerPanel: {
    backgroundColor: SW.color.surfaceLow,
    borderRadius: SW.radius.md,
    padding: 14,
    gap: 8,
  },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  scheduleText: { ...SW.type.bodyMd, fontSize: 14, color: SW.color.onSurfaceVariant },
  cardNotes: { ...SW.type.bodyMd, fontSize: 14, color: SW.color.onSurfaceVariant, fontStyle: "italic" },

  acceptBtn: {
    backgroundColor: PRIMARY,
    borderRadius: SW.radius.full,
    paddingVertical: 15,
    alignItems: "center",
    ...SW.shadow(PRIMARY, 0.3),
  },
  acceptBtnText: { fontFamily: SW.font.bold, fontSize: 16, color: "#fff" },

  emptyCard: {
    backgroundColor: SW.color.surfaceLow,
    borderRadius: SW.radius.xl,
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: SW.color.card,
    alignItems: "center", justifyContent: "center",
    ...SW.shadow(PRIMARY, 0.12),
  },
  emptyTitle: { ...SW.type.bodyLg, fontFamily: SW.font.bold, color: SW.color.onSurface },
  emptyBody: { ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, textAlign: "center", maxWidth: 240 },
});
