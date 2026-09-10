import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { USE_MOCK } from "../constants/mockData";
import { useAuth } from "../context/auth";
import { uploadCredential } from "../lib/storage";
import { supabase } from "../lib/supabase";

const PRIMARY = "#014aad";
const SECONDARY = "#006b5b";

const AGREEMENT_TEXT = `StudyWiser Educator Service Agreement

1. Conduct & Safety. You agree to communicate with students and families only through StudyWiser's messaging and session tools, to conduct sessions professionally, and to immediately report any safety concern to StudyWiser support.

2. Background & Credentials. The credentials and identification you upload will be reviewed before your profile becomes visible to families. Providing false or misleading information is grounds for immediate removal from the platform.

3. Scheduling & Payments. Sessions booked through StudyWiser must be paid for through StudyWiser. Arranging payment or scheduling outside the platform to avoid service fees is not permitted.

4. Student Data. You may only use student information (names, contact details, session notes) for the purpose of tutoring through StudyWiser, and must not share it with third parties.

5. Cancellations. Please provide as much notice as possible when cancelling or rescheduling a session, and honor confirmed session times.

6. Termination. StudyWiser may suspend or remove your account for violations of this agreement, and you may stop offering sessions on the platform at any time.

By signing below, you confirm that you have read and agree to these terms.`;

type UploadedFile = { name: string; path: string };

type StatusPillProps = { done: boolean; pendingLabel: string; pendingIcon: keyof typeof Ionicons.glyphMap };

function StatusPill({ done, pendingLabel, pendingIcon }: StatusPillProps) {
  return (
    <View style={[styles.pill, done && styles.pillDone]}>
      <Ionicons
        name={done ? "checkmark-circle" : pendingIcon}
        size={14}
        color={done ? SECONDARY : "#717783"}
      />
      <Text style={[styles.pillText, done && styles.pillTextDone]}>
        {done ? "COMPLETED" : pendingLabel}
      </Text>
    </View>
  );
}

export default function OnboardingDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [readAgreement, setReadAgreement] = useState(false);
  const [signerName, setSignerName] = useState("");

  const ready = signed && uploaded && confirmed;
  const canSign = readAgreement && signerName.trim().length >= 2;

  function handleAgreementScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (readAgreement) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    if (distanceFromBottom < 24) setReadAgreement(true);
  }

  async function handleSign() {
    if (!canSign) return;
    if (USE_MOCK || !user) {
      setSigned(true);
      return;
    }
    setSigning(true);
    const { error } = await supabase
      .from("tutor_profiles")
      .update({
        agreement_signed_at: new Date().toISOString(),
        agreement_signer_name: signerName.trim(),
      })
      .eq("id", user.id);
    setSigning(false);
    if (error) {
      Alert.alert("Error", "Could not record your signature. Please try again.");
      return;
    }
    setSigned(true);
  }

  async function handlePickCredentials() {
    if (USE_MOCK || !user) {
      setUploaded(true);
      setUploadedFiles([
        { name: "Teaching Cert.pdf", path: "" },
        { name: "ID_Card_Front.jpg", path: "" },
      ]);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      multiple: true,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const newFiles: UploadedFile[] = [];
      for (const asset of result.assets) {
        const path = await uploadCredential(user.id, asset.uri, asset.name);
        newFiles.push({ name: asset.name, path });
      }
      const merged = [...uploadedFiles, ...newFiles];
      const { error } = await supabase
        .from("tutor_profiles")
        .update({ credential_paths: merged.map((f) => f.path).filter(Boolean) })
        .eq("id", user.id);
      if (error) throw error;
      setUploadedFiles(merged);
      setUploaded(true);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload file.");
    } finally {
      setUploading(false);
    }
  }

  function finish() {
    router.replace("/(tutor-tabs)");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      {/* Top bar */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.brand}>StudyWiser</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <Text style={styles.h1}>Before you start</Text>
        <Text style={styles.sub}>
          To ensure a safe and professional environment for everyone, please
          complete the following items to finalize your profile.
        </Text>

        {/* Service Agreement card */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadLeft}>
              <View style={[styles.badge, { backgroundColor: "#e2ecfb" }]}>
                <Ionicons name="document-text-outline" size={24} color={PRIMARY} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>Sign Service Agreement</Text>
                <Text style={styles.cardSub}>Legal terms and conduct policy</Text>
              </View>
            </View>
            <StatusPill done={signed} pendingLabel="PENDING" pendingIcon="ellipsis-horizontal" />
          </View>

          <View style={styles.agreementBox}>
            <ScrollView
              style={styles.agreementScroll}
              onScroll={handleAgreementScroll}
              scrollEventThrottle={64}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              <Text style={styles.agreementText}>{AGREEMENT_TEXT}</Text>
            </ScrollView>
            {!readAgreement && (
              <View style={styles.scrollHint}>
                <Ionicons name="chevron-down" size={14} color="#717783" />
                <Text style={styles.scrollHintText}>Scroll to read the full agreement</Text>
              </View>
            )}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Type your full name to sign</Text>
          <TextInput
            style={styles.signInput}
            placeholder="Full name"
            placeholderTextColor="#9aa0ab"
            value={signerName}
            onChangeText={setSignerName}
            editable={!signed}
            autoCapitalize="words"
          />

          <TouchableOpacity
            style={[styles.signBtn, (signed || !canSign) && styles.btnMuted]}
            activeOpacity={0.85}
            onPress={handleSign}
            disabled={signed || signing || !canSign}
          >
            {signing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="create-outline" size={20} color="#fff" />
            )}
            <Text style={styles.signBtnText}>
              {signed ? "Signed" : canSign ? "Sign Now" : "Read the agreement to sign"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Credentials upload card */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadLeft}>
              <View style={[styles.badge, { backgroundColor: "#d3f5ec" }]}>
                <Ionicons name="cloud-upload-outline" size={24} color={SECONDARY} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>Upload Credentials</Text>
                <Text style={styles.cardSub}>Diplomas or certifications (PDF/JPG)</Text>
              </View>
            </View>
            <StatusPill done={uploaded} pendingLabel="REQUIRED" pendingIcon="hourglass-outline" />
          </View>

          <TouchableOpacity
            style={styles.dropzone}
            activeOpacity={0.7}
            onPress={handlePickCredentials}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#c1c7d3" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={38} color="#c1c7d3" />
            )}
            <Text style={styles.dropText}>
              {uploading ? "Uploading…" : "Tap to browse files"}
            </Text>
          </TouchableOpacity>

          {uploaded && uploadedFiles.length > 0 && (
            <View style={styles.fileRow}>
              {uploadedFiles.map((file, i) => (
                <View style={styles.fileChip} key={`${file.name}-${i}`}>
                  <Ionicons name="document-outline" size={18} color={PRIMARY} />
                  <Text style={styles.fileText} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Confirm + actions */}
        <TouchableOpacity
          style={styles.confirmRow}
          activeOpacity={0.7}
          onPress={() => setConfirmed((v) => !v)}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxOn]}>
            {confirmed && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.confirmText}>
            I certify that all documents provided are authentic and I have read
            the Service Agreement in full.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueBtn, !ready && styles.continueBtnDisabled]}
          activeOpacity={0.9}
          onPress={finish}
          disabled={!ready}
        >
          <Text style={styles.continueText}>Continue to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.laterBtn} onPress={finish}>
          <Text style={styles.laterText}>I'll do this later</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f9fb" },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  brand: { color: PRIMARY, fontSize: 20, fontWeight: "700" },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  h1: { color: PRIMARY, fontSize: 30, fontWeight: "700", marginTop: 8, marginBottom: 8 },
  sub: { color: "#414751", fontSize: 15, lineHeight: 22, marginBottom: 24 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#005da7",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 3,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  cardHeadLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  flex1: { flex: 1 },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#191c1e", fontSize: 18, fontWeight: "700" },
  cardSub: { color: "#414751", fontSize: 13, marginTop: 2 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eceef0",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillDone: { backgroundColor: "#d3f5ec" },
  pillText: { color: "#717783", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  pillTextDone: { color: SECONDARY },
  agreementBox: {
    backgroundColor: "#f2f4f6",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#d7dbe0",
    marginTop: 16,
    overflow: "hidden",
  },
  agreementScroll: { maxHeight: 200, padding: 14 },
  agreementText: { color: "#414751", fontSize: 13.5, lineHeight: 21 },
  scrollHint: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#d7dbe0",
    backgroundColor: "#eceef0",
  },
  scrollHintText: { color: "#717783", fontSize: 12, fontWeight: "600" },
  label: { color: "#414751", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  signInput: {
    backgroundColor: "#f2f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#191c1e",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#e0e3e5",
  },
  signBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: SECONDARY,
    borderRadius: 9999,
    paddingVertical: 15,
  },
  btnMuted: { opacity: 0.6 },
  signBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  dropzone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#c1c7d3",
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dropText: { color: "#717783", fontSize: 14 },
  fileRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  fileChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f2f4f6",
    borderRadius: 10,
    padding: 12,
  },
  fileText: { color: "#191c1e", fontSize: 12, fontWeight: "600", flexShrink: 1 },
  confirmRow: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 20, paddingHorizontal: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#717783",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  confirmText: { flex: 1, color: "#414751", fontSize: 14, lineHeight: 20 },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: PRIMARY,
    borderRadius: 9999,
    paddingVertical: 18,
    marginBottom: 8,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  laterBtn: { alignItems: "center", paddingVertical: 10 },
  laterText: { color: PRIMARY, fontSize: 14, fontWeight: "700" },
});
