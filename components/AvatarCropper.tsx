import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { computeCropRect } from "../lib/cropMath";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CROP_SIZE = Math.min(SCREEN_W * 0.8, 320);
const OUTPUT_SIZE = 500;
const MAX_SCALE = 4;

type Props = {
  visible: boolean;
  uri: string | null;
  onCancel: () => void;
  /** Resolves with a local file:// URI for the square-cropped, resized image. */
  onConfirm: (croppedUri: string) => void;
};

export function AvatarCropper({ visible, uri, onCancel, onConfirm }: Props) {
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!uri) return;
    setNatural(null);
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    Image.getSize(
      uri,
      (width, height) => setNatural({ width, height }),
      () => setNatural({ width: 1, height: 1 })
    );
  }, [uri]);

  // Display size of the image at scale=1: the smaller natural dimension maps to
  // CROP_SIZE ("cover" fit), so the circle is always fully covered.
  const base =
    natural && natural.width > 0 && natural.height > 0
      ? natural.width <= natural.height
        ? { width: CROP_SIZE, height: (CROP_SIZE * natural.height) / natural.width }
        : { width: (CROP_SIZE * natural.width) / natural.height, height: CROP_SIZE }
      : { width: CROP_SIZE, height: CROP_SIZE };

  function clampToBounds(nextScale: number, x: number, y: number) {
    "worklet";
    const dispW = base.width * nextScale;
    const dispH = base.height * nextScale;
    const maxX = Math.max(0, (dispW - CROP_SIZE) / 2);
    const maxY = Math.max(0, (dispH - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const next = clampToBounds(
        scale.value,
        savedTranslateX.value + e.translationX,
        savedTranslateY.value + e.translationY
      );
      translateX.value = next.x;
      translateY.value = next.y;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.min(MAX_SCALE, Math.max(1, savedScale.value * e.scale));
      scale.value = next;
      const bounded = clampToBounds(next, translateX.value, translateY.value);
      translateX.value = bounded.x;
      translateY.value = bounded.y;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const imageStyle = useAnimatedStyle(() => ({
    width: base.width,
    height: base.height,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  async function handleConfirm() {
    if (!uri || !natural) return;
    setSaving(true);
    try {
      const rect = computeCropRect({
        naturalWidth: natural.width,
        naturalHeight: natural.height,
        baseWidth: base.width,
        baseHeight: base.height,
        cropSize: CROP_SIZE,
        scale: scale.value,
        translateX: translateX.value,
        translateY: translateY.value,
      });

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          { crop: rect },
          { resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      onConfirm(result.uri);
    } finally {
      setSaving(false);
    }
  }

  const r = CROP_SIZE / 2;
  const cx = SCREEN_W / 2;
  const cy = SCREEN_H / 2 - 40;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.root}>
        {uri && natural ? (
          <GestureDetector gesture={gesture}>
            <View style={StyleSheet.absoluteFill}>
              <Animated.View
                style={[
                  { position: "absolute", left: cx - base.width / 2, top: cy - base.height / 2 },
                  imageStyle,
                ]}
              >
                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
              </Animated.View>
            </View>
          </GestureDetector>
        ) : (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {/* Darkened mask with a circular window, drawn on top of the image. */}
        <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path
            fillRule="evenodd"
            d={`M0,0 H${SCREEN_W} V${SCREEN_H} H0 Z M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} Z`}
            fill="rgba(0,0,0,0.72)"
          />
          <Circle cx={cx} cy={cy} r={r} stroke="#ffffff" strokeWidth={2} fill="none" />
        </Svg>

        <View style={[styles.topBar, { paddingTop: 60 }]}>
          <Text style={styles.title}>Move and Scale</Text>
          <Text style={styles.subtitle}>Drag to reposition, pinch to zoom</Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.textBtn} onPress={onCancel} disabled={saving}>
            <Text style={styles.textBtnLabel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.textBtn, styles.confirmBtn]}
            onPress={handleConfirm}
            disabled={saving || !natural}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.textBtnLabel, styles.confirmLabel]}>Choose</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", gap: 4 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 16,
  },
  textBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  textBtnLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  confirmBtn: {
    backgroundColor: "#014aad",
    borderRadius: 9999,
    paddingHorizontal: 24,
    minWidth: 96,
    alignItems: "center",
  },
  confirmLabel: { fontWeight: "700" },
});
