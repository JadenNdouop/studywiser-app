import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY  = "#014aad";
const LAVENDER = "#eef2ff";
const SENT_BG  = "#e8eeff";
const RECV_BG  = "#fff";

/* ─── Types ─── */
type Msg = {
  id: string;
  text?: string;
  voice?: { duration: string };
  sent: boolean;   // true = right side (me), false = left (them)
  time: string;
};

/* ─── Demo messages ─── */
const INITIAL_MSGS: Msg[] = [
  {
    id: "m1",
    text: "Hi! Just wanted to check in before today's session. Bradley has been struggling with mixed-number fractions.",
    sent: false,
    time: "09:00",
  },
  {
    id: "m2",
    text: "Thanks for the heads up! I'll make sure to spend extra time on mixed numbers and bring some visual aids to help him understand the concept.",
    sent: true,
    time: "09:30",
  },
  {
    id: "m3",
    text: "That would be amazing. He responds really well to visual methods.",
    sent: false,
    time: "09:43",
  },
  {
    id: "m4",
    voice: { duration: "0:42" },
    sent: false,
    time: "09:50",
  },
  {
    id: "m5",
    text: "Got it — I'll also send over a practice worksheet after the session for him to work on!",
    sent: true,
    time: "09:55",
  },
];

const CONTACT = { name: "Bradley's Parent", initials: "BP", avatarColor: "#c7d2fe" };

/* ─── Screen ─── */
export default function MessageDetailScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MSGS);
  const [draft, setDraft] = useState("");

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), text, sent: true, time },
    ]);
    setDraft("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={PRIMARY} />
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: CONTACT.avatarColor }]}>
          <Text style={styles.headerAvatarText}>{CONTACT.initials}</Text>
        </View>

        <Text style={styles.headerName}>{CONTACT.name}</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="call-outline" size={19} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="videocam-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.msgRow, msg.sent ? styles.msgRowSent : styles.msgRowRecv]}
            >
              {/* Avatar for received messages */}
              {!msg.sent && (
                <View style={[styles.msgAvatar, { backgroundColor: CONTACT.avatarColor }]}>
                  <Text style={styles.msgAvatarText}>{CONTACT.initials}</Text>
                </View>
              )}

              <View style={styles.msgContent}>
                {/* Voice message */}
                {msg.voice ? (
                  <View style={[styles.bubble, styles.bubbleRecv, styles.voiceBubble]}>
                    <TouchableOpacity style={styles.playBtn}>
                      <Ionicons name="play" size={16} color={PRIMARY} />
                    </TouchableOpacity>
                    <View style={styles.waveform}>
                      {[...Array(18)].map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.waveBar,
                            { height: 6 + Math.sin(i * 1.1) * 10 + Math.random() * 4 },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.voiceDuration}>{msg.voice.duration}</Text>
                  </View>
                ) : (
                  /* Text message */
                  <View
                    style={[
                      styles.bubble,
                      msg.sent ? styles.bubbleSent : styles.bubbleRecv,
                    ]}
                  >
                    <Text style={[styles.bubbleText, msg.sent && styles.bubbleTextSent]}>
                      {msg.text}
                    </Text>
                  </View>
                )}

                {/* Timestamp */}
                <Text style={[styles.msgTime, msg.sent && styles.msgTimeSent]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing indicator */}
          <View style={styles.typingRow}>
            <View style={[styles.msgAvatar, { backgroundColor: CONTACT.avatarColor }]}>
              <Text style={styles.msgAvatarText}>{CONTACT.initials}</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleRecv, styles.typingBubble]}>
              <View style={styles.typingDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.typingDot} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.inputIcon}>
            <Ionicons name="attach-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Write here..."
            placeholderTextColor="#94a3b8"
            value={draft}
            onChangeText={setDraft}
            multiline
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />

          {draft.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="mic-outline" size={22} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: LAVENDER,
    alignItems: "center", justifyContent: "center",
  },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  headerAvatarText: { color: PRIMARY, fontSize: 13, fontWeight: "700" },
  headerName: { flex: 1, fontSize: 17, fontWeight: "800", color: "#0f172a" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: LAVENDER,
    alignItems: "center", justifyContent: "center",
  },

  // Message list
  messageList: { flex: 1, backgroundColor: "#f8faff" },
  messageListContent: { padding: 16, paddingBottom: 8, gap: 12 },

  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowSent: { justifyContent: "flex-end" },
  msgRowRecv: { justifyContent: "flex-start" },

  msgAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  msgAvatarText: { color: PRIMARY, fontSize: 11, fontWeight: "700" },

  msgContent: { maxWidth: "72%", gap: 4 },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleSent: {
    backgroundColor: LAVENDER,
    borderBottomRightRadius: 4,
  },
  bubbleRecv: {
    backgroundColor: RECV_BG,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleText: { fontSize: 14, color: "#0f172a", lineHeight: 20 },
  bubbleTextSent: { color: "#0f172a" },

  msgTime: { fontSize: 11, color: "#94a3b8", marginLeft: 4 },
  msgTimeSent: { textAlign: "right", marginRight: 4 },

  // Voice bubble
  voiceBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: LAVENDER,
    alignItems: "center", justifyContent: "center",
  },
  waveform: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2 },
  waveBar: {
    width: 3, borderRadius: 2,
    backgroundColor: "#c7d2fe",
  },
  voiceDuration: { fontSize: 12, color: "#64748b", fontWeight: "500" },

  // Typing indicator
  typingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  typingBubble: { paddingVertical: 12, paddingHorizontal: 16 },
  typingDots: { flexDirection: "row", gap: 4, alignItems: "center" },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: "#c7d2fe",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  inputIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: LAVENDER,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: "center", justifyContent: "center",
  },
});
