import { clampTranslation, computeCropRect } from "../cropMath";

describe("computeCropRect", () => {
  it("crops the full width for a square image at scale 1, no pan", () => {
    // 1000x1000 natural image, displayed at 300x300 (cover fit for a 300 circle).
    const rect = computeCropRect({
      naturalWidth: 1000,
      naturalHeight: 1000,
      baseWidth: 300,
      baseHeight: 300,
      cropSize: 300,
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
    expect(rect.originX).toBeCloseTo(0);
    expect(rect.originY).toBeCloseTo(0);
    expect(rect.width).toBeCloseTo(1000);
    expect(rect.height).toBeCloseTo(1000);
  });

  it("shrinks the crop rect proportionally when zoomed in", () => {
    const rect = computeCropRect({
      naturalWidth: 1000,
      naturalHeight: 1000,
      baseWidth: 300,
      baseHeight: 300,
      cropSize: 300,
      scale: 2, // zoomed in 2x
      translateX: 0,
      translateY: 0,
    });
    // At 2x zoom, only half the natural image (in each dimension) fills the circle.
    expect(rect.width).toBeCloseTo(500);
    expect(rect.height).toBeCloseTo(500);
    // Centered, so origin is a quarter of the way in.
    expect(rect.originX).toBeCloseTo(250);
    expect(rect.originY).toBeCloseTo(250);
  });

  it("shifts the crop origin opposite the pan direction", () => {
    // Panning the image right (+translateX) should shift the visible crop
    // window left (smaller originX) — the same effect as sliding a photo
    // right under a fixed viewfinder.
    const centered = computeCropRect({
      naturalWidth: 1000,
      naturalHeight: 1000,
      baseWidth: 300,
      baseHeight: 300,
      cropSize: 300,
      scale: 2,
      translateX: 0,
      translateY: 0,
    });
    const pannedRight = computeCropRect({
      naturalWidth: 1000,
      naturalHeight: 1000,
      baseWidth: 300,
      baseHeight: 300,
      cropSize: 300,
      scale: 2,
      translateX: 50,
      translateY: 0,
    });
    expect(pannedRight.originX).toBeLessThan(centered.originX);
  });

  it("clamps the crop rect to stay inside the natural image bounds", () => {
    // An extreme pan value that would otherwise push the origin negative.
    const rect = computeCropRect({
      naturalWidth: 1000,
      naturalHeight: 1000,
      baseWidth: 300,
      baseHeight: 300,
      cropSize: 300,
      scale: 2,
      translateX: 10000,
      translateY: -10000,
    });
    expect(rect.originX).toBeGreaterThanOrEqual(0);
    expect(rect.originY).toBeGreaterThanOrEqual(0);
    expect(rect.originX + rect.width).toBeLessThanOrEqual(1000.0001);
    expect(rect.originY + rect.height).toBeLessThanOrEqual(1000.0001);
  });

  it("handles a non-square (portrait) source image", () => {
    // 800x1600 natural image, cover-fit to a 300 circle means baseWidth=300,
    // baseHeight=600 (the narrower dimension, width, maps to the crop size).
    const rect = computeCropRect({
      naturalWidth: 800,
      naturalHeight: 1600,
      baseWidth: 300,
      baseHeight: 600,
      cropSize: 300,
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
    expect(rect.width).toBeCloseTo(800);
    expect(rect.height).toBeCloseTo(800);
    expect(rect.originX).toBeCloseTo(0);
    // Vertically centered within the taller image.
    expect(rect.originY).toBeCloseTo(400);
  });
});

describe("clampTranslation", () => {
  it("allows 0 when the display size fits exactly in the crop circle", () => {
    expect(clampTranslation(300, 300, 0)).toBe(0);
    expect(clampTranslation(300, 300, 50)).toBe(0);
  });

  it("bounds translation to half the overflow on each side", () => {
    // displayed 600, crop 300 -> max overflow per side is (600-300)/2 = 150
    expect(clampTranslation(600, 300, 0)).toBe(0);
    expect(clampTranslation(600, 300, 200)).toBe(150);
    expect(clampTranslation(600, 300, -200)).toBe(-150);
    expect(clampTranslation(600, 300, 100)).toBe(100);
  });
});
