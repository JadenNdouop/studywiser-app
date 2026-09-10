/**
 * Shared StudyWiser UI primitives — Stitch "Creative Studio" design system.
 * Floating white labeled tab bar, screen header, stat tiles, chips,
 * status badges, empty states, and buttons.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STATUS_COLORS, SW } from "../../constants/theme";
import { useAuth } from "../../context/auth";

/* ---------------------------------- Tab bar --------------------------------- */

const TAB_META: Record<string, { label: string; icons: [string, string] }> = {
  index: { label: "Home", icons: ["home", "home-outline"] },
  find: { label: "Find", icons: ["compass", "compass-outline"] },
  sessions: { label: "Sessions", icons: ["calendar", "calendar-outline"] },
  schedule: { label: "Schedule", icons: ["calendar", "calendar-outline"] },
  profile: { label: "Profile", icons: ["person", "person-outline"] },
};

/**
 * Floating white pill tab bar with labels; the active tab gets a mint pill
 * (matches the Stitch bottom nav across all three roles).
 */
export function SWTabBar({ state, navigation }: any) {
  return (
    <View style={tabStyles.bar}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const meta = TAB_META[route.name] ?? {
          label: route.name,
          icons: ["ellipse", "ellipse-outline"],
        };
        const iconName = isFocused ? meta.icons[0] : meta.icons[1];

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.item}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[tabStyles.iconWrap, isFocused && tabStyles.iconWrapActive]}>
              <Ionicons
                name={iconName as any}
                size={22}
                color={isFocused ? SW.color.onMint : SW.color.onSurfaceVariant}
              />
            </View>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 14,
    left: 16,
    right: 16,
    height: 76,
    backgroundColor: SW.color.card,
    borderRadius: SW.radius.xl,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    ...SW.shadow(SW.color.primary, 0.16),
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  iconWrap: {
    width: 48,
    height: 32,
    borderRadius: SW.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: SW.color.mint },
  label: { ...SW.type.labelSm, color: SW.color.onSurfaceVariant },
  labelActive: { color: SW.color.onMint },
});

/* ------------------------------ Bottom sheet -------------------------------- */

/**
 * Animated bottom sheet. The dim shade fades in place while only the sheet
 * slides up from the bottom (fixes the shade sliding up with the sheet).
 * Keeps rendering during the exit animation so content doesn't flash away.
 */
export function SWBottomSheet({
  visible,
  onClose,
  children,
  maxHeightPct = "70%",
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeightPct?: number | `${number}%`;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[sheetStyles.root, { opacity: anim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[sheetStyles.sheet, { maxHeight: maxHeightPct as any, transform: [{ translateY }] }]}
        >
          <View style={sheetStyles.handle} />
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: SW.color.card,
    borderTopLeftRadius: SW.radius.xl,
    borderTopRightRadius: SW.radius.xl,
    padding: 24,
    gap: 12,
    overflow: "hidden",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: SW.color.outline, alignSelf: "center", marginBottom: 4,
  },
});

/* -------------------------------- Screen header ------------------------------ */

/** Brand header: initials avatar + StudyWiser wordmark + notification bell. */
export function SWHeader({ initials }: { initials?: string }) {
  // Screens no longer reserve the notch/Dynamic Island area via SafeAreaView's "top" edge — their
  // background is meant to bleed all the way to the true top of the screen, Instagram-style. So
  // this header takes over clearing the notch itself, adding the real inset on top of its own
  // small design gap instead of relying on an ancestor to have already pushed everything down.
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  function goToProfile() {
    if (profile?.role === "tutor") router.push("/(tutor-tabs)/profile");
    else if (profile?.role === "student") router.push("/(student-tabs)/profile");
    else router.push("/(parent-tabs)/profile");
  }

  return (
    <View style={[headerStyles.row, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={headerStyles.left} onPress={goToProfile} activeOpacity={0.7}>
        <View style={headerStyles.avatar}>
          <Text style={headerStyles.avatarText}>{initials ?? "SW"}</Text>
        </View>
        <Text style={headerStyles.wordmark}>StudyWiser</Text>
      </TouchableOpacity>
      <View style={headerStyles.actions}>
        <TouchableOpacity
          style={headerStyles.bell}
          onPress={() => router.push("/messages")}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={21} color={SW.color.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity
          style={headerStyles.bell}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color={SW.color.onSurface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SW.space.margin,
    paddingBottom: 12,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SW.color.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...SW.type.labelMd, color: SW.color.primary },
  wordmark: { fontFamily: SW.font.bold, fontSize: 22, color: SW.color.primary },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: SW.color.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
});

/* --------------------------------- Primitives -------------------------------- */

export function SWCard({
  children,
  style,
  tint,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** accent color used for the ambient shadow */
  tint?: string;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: SW.color.card,
          borderRadius: SW.radius.lg,
          padding: SW.space.cardPad,
          ...SW.shadow(tint ?? SW.color.outline, tint ? 0.22 : 0.28),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Candy stat tile (mint / coral / lavender) with a big number. */
export function SWStatTile({
  value,
  label,
  variant,
  style,
}: {
  value: string | number;
  label: string;
  variant: "mint" | "coral" | "lavender";
  style?: ViewStyle;
}) {
  const bg = { mint: SW.color.mint, coral: SW.color.coral, lavender: SW.color.lavender }[variant];
  const fg = { mint: SW.color.onMint, coral: SW.color.onCoral, lavender: SW.color.primary }[variant];
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: bg,
          borderRadius: SW.radius.lg,
          paddingVertical: 18,
          paddingHorizontal: 12,
          alignItems: "center",
          gap: 2,
          ...SW.shadow(bg, 0.35),
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: SW.font.bold, fontSize: 26, color: fg }}>{value}</Text>
      <Text style={{ ...SW.type.labelSm, color: fg, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

/** Pill chip, e.g. subject tags. */
export function SWChip({
  label,
  icon,
  bg,
  fg,
  style,
  onPress,
}: {
  label: string;
  icon?: string;
  bg: string;
  fg: string;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const content = (
    <>
      {icon ? <Ionicons name={icon as any} size={14} color={fg} /> : null}
      <Text style={{ ...SW.type.labelMd, color: fg }}>{label}</Text>
    </>
  );
  const base: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: bg,
    borderRadius: SW.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  };
  if (onPress) {
    return (
      <TouchableOpacity style={[base, style]} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={[base, style]}>{content}</View>;
}

/** Soft status badge: UPCOMING / PENDING / COMPLETED. */
export function SWStatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status.toLowerCase()] ?? STATUS_COLORS.completed;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: SW.radius.full,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ ...SW.type.labelSm, color: c.fg, letterSpacing: 0.6 }}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

/** Icon + heading + subtext empty state. */
export function SWEmptyState({
  icon,
  title,
  subtitle,
  style,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          alignItems: "center",
          gap: 8,
          backgroundColor: SW.color.surfaceLow,
          borderRadius: SW.radius.lg,
          paddingVertical: 28,
          paddingHorizontal: 20,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: SW.color.card,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon as any} size={24} color={SW.color.muted} />
      </View>
      <Text style={{ ...SW.type.labelMd, fontSize: 15, color: SW.color.onSurface }}>{title}</Text>
      {subtitle ? (
        <Text style={{ ...SW.type.bodyMd, fontSize: 13, color: SW.color.muted, textAlign: "center" }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Big pill primary button. */
export function SWButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled,
  style,
  textStyle,
}: {
  label: string;
  onPress?: () => void;
  icon?: string;
  variant?: "primary" | "mint" | "white" | "outline" | "danger";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}) {
  const palette: Record<string, { bg: string; fg: string; border?: string }> = {
    primary: { bg: SW.color.primary, fg: SW.color.onPrimary },
    mint: { bg: SW.color.mint, fg: SW.color.onMint },
    white: { bg: SW.color.card, fg: SW.color.primary },
    outline: { bg: "transparent", fg: SW.color.primary, border: SW.color.primary },
    danger: { bg: SW.color.errorSoft, fg: SW.color.error },
  };
  const c = palette[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: c.bg,
          borderRadius: SW.radius.full,
          paddingVertical: 15,
          paddingHorizontal: 24,
          opacity: disabled ? 0.5 : 1,
          borderWidth: c.border ? 1.5 : 0,
          borderColor: c.border,
          ...(variant === "primary" ? SW.shadow(SW.color.primary, 0.3) : null),
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon as any} size={18} color={c.fg} /> : null}
      <Text style={[{ fontFamily: SW.font.bold, fontSize: 16, color: c.fg }, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** Section heading row with optional action link. */
export function SWSectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        },
        style,
      ]}
    >
      <Text style={{ ...SW.type.headlineMd, color: SW.color.onSurface }}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ ...SW.type.labelMd, color: SW.color.primary }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* --------------------------------- Utilities --------------------------------- */

export function getInitials(name?: string | null): string {
  if (!name) return "SW";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "S";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_TINTS = [
  { bg: "#96f4dd", fg: "#007260" },
  { bg: "#ccdaff", fg: "#005da7" },
  { bg: "#ffdcc4", fg: "#8b4c11" },
  { bg: "#e3ebff", fg: "#005da7" },
];

export function avatarTint(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

/** Candy accent per subject group: Science/Math mint, Languages/Arts coral, Humanities lavender. */
export function subjectTint(subject: string): { bg: string; fg: string; icon: string } {
  const s = subject.toLowerCase();
  if (/(math|calc|algebra|sat|science|bio|chem|physic)/.test(s))
    return { bg: SW.color.mintSoft, fg: SW.color.onMint, icon: "flask-outline" };
  if (/(writ|english|language|art|reading|music)/.test(s))
    return { bg: SW.color.coralSoft, fg: SW.color.onCoral, icon: "color-palette-outline" };
  return { bg: SW.color.lavenderSoft, fg: SW.color.primary, icon: "book-outline" };
}
