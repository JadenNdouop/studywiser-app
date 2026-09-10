// Pure math for AvatarCropper: maps the on-screen pan/zoom transform of a
// "cover"-fit image back to a crop rectangle in the source image's own pixel
// space, for expo-image-manipulator.

export type CropInput = {
  naturalWidth: number;
  naturalHeight: number;
  /** Display size of the image at scale=1 ("cover" fit over the crop circle). */
  baseWidth: number;
  baseHeight: number;
  /** Diameter of the crop circle, in the same display units as baseWidth/Height. */
  cropSize: number;
  scale: number;
  translateX: number;
  translateY: number;
};

export type CropRect = { originX: number; originY: number; width: number; height: number };

export function computeCropRect(input: CropInput): CropRect {
  const { naturalWidth, naturalHeight, baseWidth, cropSize, scale, translateX, translateY } = input;

  const baseScale = baseWidth / naturalWidth;
  const totalScale = baseScale * scale;
  const dispW = input.baseWidth * scale;
  const dispH = input.baseHeight * scale;

  const cropLeftInDisplay = (dispW - cropSize) / 2 - translateX;
  const cropTopInDisplay = (dispH - cropSize) / 2 - translateY;

  const sizeNatural = cropSize / totalScale;
  let originX = cropLeftInDisplay / totalScale;
  let originY = cropTopInDisplay / totalScale;

  originX = Math.max(0, Math.min(naturalWidth - sizeNatural, originX));
  originY = Math.max(0, Math.min(naturalHeight - sizeNatural, originY));

  return { originX, originY, width: sizeNatural, height: sizeNatural };
}

/** Clamps a pan translation so the image can never reveal empty space around the crop circle. */
export function clampTranslation(
  dispSize: number,
  cropSize: number,
  value: number
): number {
  const max = Math.max(0, (dispSize - cropSize) / 2);
  return Math.min(max, Math.max(-max, value));
}
