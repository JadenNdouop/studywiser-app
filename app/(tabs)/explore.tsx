import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#014aad";
const CARD_BG = "#eef2ff";

/* ─── Types ─── */
type RequestStatus = "open" | "interested" | "matched";

type OpenRequest = {
  id: string;
  initials: string;
  avatarColor: string;
  studentName: string;
  grade: string;
  subject: string;
  subjectTag: string;
  description: string;
  days: string;
  time: string;
  sessionType: "Online" | "In-Person";
  budget: string;
  postedAgo: string;
};

type MyRequest = {
  id: string;
  subject: string;
  grade: string;
  days: string;
  time: string;
  budget: string;
  status: RequestStatus;
  interestedCount: number;
  applicants: string[];
};

/* ─── Demo data ─── */
const INITIAL_OPEN: OpenRequest[] = [
  {
    id: "r1", initials: "AM", avatarColor: "#c7d2fe",
    studentName: "Alex M.", grade: "7th Grade",
    subject: "Mathematics", subjectTag: "Math",
    description: "Needs help with fractions and pre-algebra. Struggling with word problems.",
    days: "Mon / Wed", time: "4:00 – 5:30 PM", sessionType: "Online",
    budget: "$25–35/hr", postedAgo: "2h ago",
  },
  {
    id: "r2", initials: "SR", avatarColor: "#fde8d8",
    studentName: "Sofia R.", grade: "5th Grade",
    subject: "English & Reading", subjectTag: "English",
    description: "Looking for reading comprehension help. Loves science-themed books.",
    days: "Tue / Thu", time: "3:30 – 5:00 PM", sessionType: "Online",
    budget: "$20–30/hr", postedAgo: "5h ago",
  },
  {
    id: "r3", initials: "MT", avatarColor: "#d1fae5",
    studentName: "Marcus T.", grade: "10th Grade",
    subject: "Computer Science", subjectTag: "CS",
    description: "Wants to learn Python basics and intro to programming concepts.",
    days: "Sat", time: "10:00 AM – 12:00 PM", sessionType: "Online",
    budget: "$40–50/hr", postedAgo: "1d ago",
  },
  {
    id: "r4", initials: "LK", avatarColor: "#fef9c3",
    studentName: "Lily K.", grade: "3rd Grade",
    subject: "Writing", subjectTag: "Writing",
    description: "Building foundational writing skills. Focus on sentence structure and creative writing.",
    days: "Mon / Fri", time: "5:00 – 6:00 PM", sessionType: "In-Person",
    budget: "$25–35/hr", postedAgo: "1d ago",
  },
  {
    id: "r5", initials: "JB", avatarColor: "#fee2e2",
    studentName: "Jordan B.", grade: "9th Grade",
    subject: "Science", subjectTag: "Science",
    description: "Needs help with biology and chemistry. Preparing for upcoming state exams.",
    days: "Wed / Fri", time: "4:30 – 6:00 PM", sessionType: "Online",
    budget: "$30–40/hr", postedAgo: "2d ago",
  },
  {
    id: "r6", initials: "NP", avatarColor: "#ddd6fe",
    studentName: "Nina P.", grade: "6th Grade",
    subject: "Mathematics", subjectTag: "Math",
    description: "Needs help with geometry and basic algebra. Prefers visual explanations.",
    days: "Tue / Thu", time: "5:00 – 6:30 PM", sessionType: "Online",
    budget: "$25–30/hr", postedAgo: "3d ago",
  },
];

const INITIAL_MY: MyRequest[] = [
  {
    id: "m1", subject: "Mathematics", grade: "7th Grade",
    days: "Mon / Wed", time: "4:00 – 5:30 PM", budget: "$25–35/hr",
    status: "interested", interestedCount: 3,
    applicants: ["Sarah Johnson, M.Ed.", "Marcus Chen, Ph.D.", "Aisha Williams, B.Ed."],
  },
  {
    id: "m2", subject: "English", grade: "7th Grade",
    days: "Fri", time: "3:00 – 4:00 PM", budget: "$20–30/hr",
    status: "open", interestedCount: 0, applicants: [],
  },
];

const SUBJECT_FILTERS = ["All", "Math", "English", "Science", "Writing", "CS"];
const DAYS_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GRADE_OPTIONS = ["K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

const STATUS_LABEL: Record<RequestStatus, string> = {
  open: "Open",
  interested: "Tutors Interested",
  matched: "Matched",
};
const STATUS_COLOR: Record<RequestStatus, string> = {
  open: "#64748b",
  interested: "#f59e0b",
  matched: "#10b981",
};
const STATUS_BG: Record<RequestStatus, string> = {
  open: "#f1f5f9",
  interested: "#fffbeb",
  matched: "#ecfdf5",
};

let nextId = 100;

/* ─── Main screen ─── */
export default function FindScreen() {
  const [role, setRole] = useState<"tutor" | "parent">("tutor");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [openRequests, setOpenRequests] = useState(INITIAL_OPEN);
  const [myRequests, setMyRequests] = useState(INITIAL_MY);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplicants, setShowApplicants] = useState<MyRequest | null>(null);

  const filtered = openRequests.filter((r) => {
    const matchesFilter = subjectFilter === "All" || r.subjectTag === subjectFilter;
    const matchesSearch =
      search.trim() === "" ||
      r.subject.toLowerCase().includes(search.toLowerCase()) ||
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.grade.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const claimRequest = (req: OpenRequest) => {
    Alert.alert("Claim Request", `Accept ${req.studentName} (${req.subject})?`, [
      { text: "Cancel" },
      {
        text: "Yes, Claim",
        onPress: () => {
          setOpenRequests((prev) => prev.filter((r) => r.id !== req.id));
          Alert.alert("🎉 Claimed!", "The family will be notified. Check your Schedule tab for the session.");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find</Text>
        {role === "parent" && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowPostModal(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role toggle */}
      <View style={styles.roleToggle}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "tutor" && styles.roleBtnActive]}
          onPress={() => setRole("tutor")}
        >
          <Ionicons name="school-outline" size={15} color={role === "tutor" ? "#fff" : "#64748b"} style={{ marginRight: 5 }} />
          <Text style={[styles.roleBtnText, role === "tutor" && styles.roleBtnTextActive]}>Tutor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === "parent" && styles.roleBtnActive]}
          onPress={() => setRole("parent")}
        >
          <Ionicons name="people-outline" size={15} color={role === "parent" ? "#fff" : "#64748b"} style={{ marginRight: 5 }} />
          <Text style={[styles.roleBtnText, role === "parent" && styles.roleBtnTextActive]}>Parent</Text>
        </TouchableOpacity>
      </View>

      {role === "tutor" ? (
        /* ── TUTOR VIEW ── */
        <View style={{ flex: 1 }}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={17} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search subject, grade…"
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={17} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0 }} contentContainerStyle={styles.filterStrip}>
            {SUBJECT_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, subjectFilter === f && styles.filterChipActive]}
                onPress={() => setSubjectFilter(f)}
              >
                <Text style={[styles.filterChipText, subjectFilter === f && styles.filterChipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.countLabel}>
            {filtered.length} open request{filtered.length !== 1 ? "s" : ""}
          </Text>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.feed}>
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No requests found</Text>
                <Text style={styles.emptyBody}>Try changing the subject filter or search term.</Text>
              </View>
            ) : (
              filtered.map((req) => (
                <OpenRequestCard key={req.id} req={req} onClaim={() => claimRequest(req)} />
              ))
            )}
          </ScrollView>
        </View>
      ) : (
        /* ── PARENT VIEW ── */
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.parentFeed}>
          <TouchableOpacity style={styles.postBanner} onPress={() => setShowPostModal(true)} activeOpacity={0.85}>
            <View style={styles.postBannerLeft}>
              <Ionicons name="add-circle-outline" size={28} color="#fff" />
              <View>
                <Text style={styles.postBannerTitle}>Post a New Request</Text>
                <Text style={styles.postBannerSub}>Find the right tutor for your child</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>My Requests</Text>

          {myRequests.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyBody}>Tap above to post your first tutor request.</Text>
            </View>
          ) : (
            myRequests.map((req) => (
              <MyRequestCard key={req.id} req={req} onViewApplicants={() => setShowApplicants(req)} />
            ))
          )}
        </ScrollView>
      )}

      {/* Post Request Modal */}
      <PostRequestModal
        visible={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSubmit={(req) => {
          setMyRequests((prev) => [req, ...prev]);
          setShowPostModal(false);
          Alert.alert("✅ Posted!", "Your request is now live and visible to tutors.");
        }}
      />

      {/* Applicants Modal */}
      <Modal visible={!!showApplicants} transparent animationType="slide">
        <View style={styles.overlayBg}>
          <View style={styles.applicantsSheet}>
            <Text style={styles.sheetTitle}>Interested Tutors</Text>
            <Text style={styles.sheetSub}>{showApplicants?.subject} · {showApplicants?.grade}</Text>
            <View style={styles.divider} />
            {(showApplicants?.applicants ?? []).map((name, i) => (
              <View key={i} style={styles.applicantRow}>
                <View style={styles.applicantAvatar}>
                  <Text style={styles.applicantInitial}>{name[0]}</Text>
                </View>
                <Text style={styles.applicantName}>{name}</Text>
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => {
                    setShowApplicants(null);
                    Alert.alert("🎉 Matched!", `You've selected ${name}. A session will be added to your schedule.`);
                  }}
                >
                  <Text style={styles.selectBtnText}>Select</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setShowApplicants(null)}>
              <Text style={styles.closeSheetText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ─── Open Request Card ─── */
function OpenRequestCard({ req, onClaim }: { req: OpenRequest; onClaim: () => void }) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.top}>
        <View style={[cardStyles.avatar, { backgroundColor: req.avatarColor }]}>
          <Text style={cardStyles.avatarText}>{req.initials}</Text>
        </View>
        <View style={cardStyles.topInfo}>
          <Text style={cardStyles.name}>{req.studentName}</Text>
          <Text style={cardStyles.grade}>{req.grade}</Text>
        </View>
        <View style={cardStyles.topRight}>
          <View style={cardStyles.subjectBadge}>
            <Text style={cardStyles.subjectBadgeText}>{req.subjectTag}</Text>
          </View>
          <Text style={cardStyles.postedAgo}>{req.postedAgo}</Text>
        </View>
      </View>

      <Text style={cardStyles.description}>{req.description}</Text>

      <View style={cardStyles.metaRow}>
        <MetaPill icon="calendar-outline" label={req.days} />
        <MetaPill icon="time-outline" label={req.time} />
        <MetaPill icon={req.sessionType === "Online" ? "laptop-outline" : "location-outline"} label={req.sessionType} />
      </View>

      <View style={cardStyles.footer}>
        <View style={cardStyles.budgetRow}>
          <Ionicons name="cash-outline" size={15} color={PRIMARY} />
          <Text style={cardStyles.budget}>{req.budget}</Text>
        </View>
        <TouchableOpacity style={cardStyles.claimBtn} onPress={onClaim} activeOpacity={0.85}>
          <Text style={cardStyles.claimBtnText}>Claim</Text>
          <Ionicons name="arrow-forward" size={15} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MetaPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={cardStyles.metaPill}>
      <Ionicons name={icon as any} size={12} color={PRIMARY} />
      <Text style={cardStyles.metaText}>{label}</Text>
    </View>
  );
}

/* ─── My Request Card ─── */
function MyRequestCard({ req, onViewApplicants }: { req: MyRequest; onViewApplicants: () => void }) {
  return (
    <View style={myCardStyles.card}>
      <View style={myCardStyles.top}>
        <View style={myCardStyles.iconCircle}>
          <Ionicons name="book-outline" size={20} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={myCardStyles.subject}>{req.subject}</Text>
          <Text style={myCardStyles.grade}>{req.grade}</Text>
        </View>
        <View style={[myCardStyles.statusBadge, { backgroundColor: STATUS_BG[req.status] }]}>
          <Text style={[myCardStyles.statusText, { color: STATUS_COLOR[req.status] }]}>
            {STATUS_LABEL[req.status]}
          </Text>
        </View>
      </View>
      <View style={myCardStyles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color="#64748b" />
        <Text style={myCardStyles.metaText}>{req.days} · {req.time}</Text>
        <Ionicons name="cash-outline" size={13} color="#64748b" style={{ marginLeft: 8 }} />
        <Text style={myCardStyles.metaText}>{req.budget}</Text>
      </View>
      {req.status === "interested" && (
        <TouchableOpacity style={myCardStyles.viewBtn} onPress={onViewApplicants} activeOpacity={0.85}>
          <Ionicons name="people-outline" size={15} color={PRIMARY} />
          <Text style={myCardStyles.viewBtnText}>
            {req.interestedCount} tutor{req.interestedCount !== 1 ? "s" : ""} interested — View
          </Text>
          <Ionicons name="chevron-forward" size={15} color={PRIMARY} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── Post Request Modal ─── */
function PostRequestModal({
  visible, onClose, onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (req: MyRequest) => void;
}) {
  const [childName, setChildName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [sessionType, setSessionType] = useState<"Online" | "In-Person">("Online");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  const toggleDay = (d: string) =>
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const reset = () => {
    setChildName(""); setGrade(""); setSubject(""); setSelectedDays([]);
    setTime(""); setSessionType("Online"); setBudget(""); setNotes("");
  };

  const submit = () => {
    if (!subject.trim() || !grade.trim()) {
      Alert.alert("Missing Info", "Please fill in at least the subject and grade.");
      return;
    }
    const req: MyRequest = {
      id: `m${++nextId}`,
      subject: subject.trim(),
      grade: grade.trim(),
      days: selectedDays.length > 0 ? selectedDays.join(" / ") : "Flexible",
      time: time.trim() || "Flexible",
      budget: budget.trim() ? `$${budget.trim()}/hr` : "Negotiable",
      status: "open",
      interestedCount: 0,
      applicants: [],
    };
    reset();
    onSubmit(req);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView style={{ width: "100%" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>Post a Request</Text>
              <TouchableOpacity onPress={() => { reset(); onClose(); }}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Field label="Child's Name">
                <TextInput style={modalStyles.input} placeholder="e.g. Alex" placeholderTextColor="#aab4d4"
                  value={childName} onChangeText={setChildName} autoCapitalize="words" />
              </Field>

              <Field label="Grade Level">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={modalStyles.chipRow}>
                  {GRADE_OPTIONS.map((g) => (
                    <TouchableOpacity key={g}
                      style={[modalStyles.smallChip, grade === g && modalStyles.smallChipActive]}
                      onPress={() => setGrade(g)}>
                      <Text style={[modalStyles.smallChipText, grade === g && modalStyles.smallChipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Field>

              <Field label="Subject Needed">
                <TextInput style={modalStyles.input} placeholder="e.g. Mathematics, Writing…" placeholderTextColor="#aab4d4"
                  value={subject} onChangeText={setSubject} />
              </Field>

              <Field label="Available Days">
                <View style={modalStyles.chipRow}>
                  {DAYS_OPTIONS.map((d) => (
                    <TouchableOpacity key={d}
                      style={[modalStyles.smallChip, selectedDays.includes(d) && modalStyles.smallChipActive]}
                      onPress={() => toggleDay(d)}>
                      <Text style={[modalStyles.smallChipText, selectedDays.includes(d) && modalStyles.smallChipTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              <Field label="Preferred Time">
                <TextInput style={modalStyles.input} placeholder="e.g. 4:00 – 6:00 PM" placeholderTextColor="#aab4d4"
                  value={time} onChangeText={setTime} />
              </Field>

              <Field label="Session Type">
                <View style={modalStyles.sessionToggle}>
                  {(["Online", "In-Person"] as const).map((t) => (
                    <TouchableOpacity key={t}
                      style={[modalStyles.sessionBtn, sessionType === t && modalStyles.sessionBtnActive]}
                      onPress={() => setSessionType(t)}>
                      <Ionicons name={t === "Online" ? "laptop-outline" : "location-outline"} size={15}
                        color={sessionType === t ? "#fff" : "#64748b"} style={{ marginRight: 5 }} />
                      <Text style={[modalStyles.sessionBtnText, sessionType === t && modalStyles.sessionBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              <Field label="Budget per hour ($)">
                <TextInput style={modalStyles.input} placeholder="e.g. 25-35" placeholderTextColor="#aab4d4"
                  value={budget} onChangeText={setBudget} keyboardType="numbers-and-punctuation" />
              </Field>

              <Field label="Additional Notes (optional)">
                <TextInput style={[modalStyles.input, modalStyles.textArea]}
                  placeholder="Any extra details about your child's needs…"
                  placeholderTextColor="#aab4d4"
                  value={notes} onChangeText={setNotes}
                  multiline numberOfLines={3} />
              </Field>

              <TouchableOpacity style={modalStyles.submitBtn} onPress={submit} activeOpacity={0.85}>
                <Text style={modalStyles.submitBtnText}>Post Request</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={modalStyles.field}>
      <Text style={modalStyles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  headerTitle: { color: "#0f172a", fontSize: 22, fontWeight: "800" },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  roleToggle: {
    flexDirection: "row", marginHorizontal: 20,
    backgroundColor: CARD_BG, borderRadius: 30, padding: 4, marginBottom: 14,
  },
  roleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 26 },
  roleBtnActive: { backgroundColor: PRIMARY },
  roleBtnText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  roleBtnTextActive: { color: "#fff" },
  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG,
    borderRadius: 14, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },
  filterStrip: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: CARD_BG },
  filterChipActive: { backgroundColor: PRIMARY },
  filterChipText: { color: "#475569", fontWeight: "600", fontSize: 13 },
  filterChipTextActive: { color: "#fff" },
  countLabel: { color: "#94a3b8", fontSize: 13, paddingHorizontal: 20, marginBottom: 10 },
  feed: { paddingHorizontal: 16, paddingBottom: 110, gap: 14 },
  parentFeed: { paddingBottom: 110 },
  sectionTitle: { color: "#0f172a", fontSize: 16, fontWeight: "700", marginBottom: 12, paddingHorizontal: 16 },
  postBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: PRIMARY, borderRadius: 18, padding: 18, marginHorizontal: 16, marginBottom: 24, gap: 12,
  },
  postBannerLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  postBannerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  postBannerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { color: "#94a3b8", fontSize: 16, fontWeight: "600" },
  emptyBody: { color: "#cbd5e1", fontSize: 13, textAlign: "center", maxWidth: 240 },
  overlayBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  applicantsSheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 10 },
  sheetTitle: { color: PRIMARY, fontSize: 20, fontWeight: "700" },
  sheetSub: { color: "#64748b", fontSize: 13 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 4 },
  applicantRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  applicantAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center" },
  applicantInitial: { color: PRIMARY, fontSize: 16, fontWeight: "700" },
  applicantName: { flex: 1, color: "#1e293b", fontSize: 14, fontWeight: "500" },
  selectBtn: { backgroundColor: PRIMARY, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  selectBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  closeSheetBtn: { backgroundColor: CARD_BG, borderRadius: 30, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  closeSheetText: { color: PRIMARY, fontWeight: "600", fontSize: 15 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#e2e8f0",
    padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { color: PRIMARY, fontSize: 17, fontWeight: "700" },
  topInfo: { flex: 1 },
  name: { color: "#0f172a", fontSize: 15, fontWeight: "700" },
  grade: { color: "#64748b", fontSize: 12, marginTop: 2 },
  topRight: { alignItems: "flex-end", gap: 4 },
  subjectBadge: { backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  subjectBadgeText: { color: PRIMARY, fontSize: 11, fontWeight: "700" },
  postedAgo: { color: "#94a3b8", fontSize: 11 },
  description: { color: "#475569", fontSize: 13, lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: CARD_BG, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  metaText: { color: "#334155", fontSize: 12, fontWeight: "500" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  budgetRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  budget: { color: PRIMARY, fontSize: 14, fontWeight: "700" },
  claimBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: PRIMARY, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10 },
  claimBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

const myCardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#e2e8f0",
    padding: 16, marginHorizontal: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: CARD_BG, alignItems: "center", justifyContent: "center" },
  subject: { color: PRIMARY, fontSize: 15, fontWeight: "700" },
  grade: { color: "#64748b", fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  metaText: { color: "#475569", fontSize: 12 },
  viewBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: CARD_BG, borderRadius: 12, padding: 10 },
  viewBtnText: { flex: 1, color: PRIMARY, fontSize: 13, fontWeight: "600" },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "92%" },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sheetTitle: { color: PRIMARY, fontSize: 20, fontWeight: "700" },
  field: { marginBottom: 18 },
  fieldLabel: { color: "#1e293b", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: { backgroundColor: CARD_BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: "#1e293b" },
  textArea: { height: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  smallChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: CARD_BG },
  smallChipActive: { backgroundColor: PRIMARY },
  smallChipText: { color: "#475569", fontSize: 13, fontWeight: "500" },
  smallChipTextActive: { color: "#fff" },
  sessionToggle: { flexDirection: "row", backgroundColor: CARD_BG, borderRadius: 14, padding: 4 },
  sessionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10 },
  sessionBtnActive: { backgroundColor: PRIMARY },
  sessionBtnText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  sessionBtnTextActive: { color: "#fff" },
  submitBtn: { backgroundColor: PRIMARY, borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
