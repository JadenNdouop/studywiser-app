/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * StudyWiser design tokens — from the Stitch "Creative Studio" design system
 * (design/stitch_studywiser_parent_portal/creative_studio/DESIGN.md).
 * Quicksand type, candy accents, heavy rounding, colored ambient shadows.
 */
export const SW = {
  color: {
    // Surfaces
    surface: "#f7f9fb",
    surfaceLow: "#f2f4f6",
    surfaceContainer: "#eceef0",
    surfaceHigh: "#e6e8ea",
    card: "#ffffff",
    inputBg: "#f1f5f9",
    onSurface: "#191c1e",
    onSurfaceVariant: "#414751",
    muted: "#717783",
    outline: "#c1c7d3",
    // Brand
    primary: "#005da7",
    primaryContainer: "#2976c7",
    onPrimary: "#ffffff",
    primarySoft: "#d4e3ff",
    // Candy accents
    mint: "#96f4dd",
    mintSoft: "#dcf9f0",
    onMint: "#007260",
    coral: "#ffdcc4",
    coralSoft: "#fde8d8",
    onCoral: "#8b4c11",
    lavender: "#ccdaff",
    lavenderSoft: "#e3ebff",
    onLavender: "#005da7",
    yellow: "#fff4c2",
    onYellow: "#8a6d00",
    // Functional
    success: "#006b5b",
    onSuccessSoft: "#007260",
    error: "#ba1a1a",
    errorSoft: "#ffdad6",
  },
  radius: { sm: 8, md: 16, lg: 24, xl: 32, full: 999 },
  space: { base: 8, gutter: 16, margin: 24, cardPad: 20, stack: 12 },
  font: {
    regular: "Quicksand_400Regular",
    medium: "Quicksand_500Medium",
    semibold: "Quicksand_600SemiBold",
    bold: "Quicksand_700Bold",
  },
  type: {
    displayLg: { fontFamily: "Quicksand_700Bold", fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
    headlineLg: { fontFamily: "Quicksand_700Bold", fontSize: 28, lineHeight: 36 },
    headlineMd: { fontFamily: "Quicksand_600SemiBold", fontSize: 22, lineHeight: 30 },
    bodyLg: { fontFamily: "Quicksand_500Medium", fontSize: 17, lineHeight: 26 },
    bodyMd: { fontFamily: "Quicksand_500Medium", fontSize: 15, lineHeight: 22 },
    labelMd: { fontFamily: "Quicksand_600SemiBold", fontSize: 14, lineHeight: 20 },
    labelSm: { fontFamily: "Quicksand_700Bold", fontSize: 12, lineHeight: 16 },
  },
  /** Colored ambient shadow (no harsh black shadows) */
  shadow(color: string, opacity = 0.18) {
    return {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    };
  },
} as const;

/** Per-status soft badge colors */
export const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  upcoming: { bg: "#dcf9f0", fg: "#007260" },
  pending: { bg: "#fde8d8", fg: "#8b4c11" },
  completed: { bg: "#e6e8ea", fg: "#414751" },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
