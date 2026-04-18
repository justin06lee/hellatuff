import { describe, expect, it } from "bun:test";
import { clamp, hslToRgb, invertLightness, rgbToHsl } from "../../src/drawing/canvas";

describe("clamp", () => {
  it("bounds values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe("rgbToHsl / hslToRgb round-trip", () => {
  it("pure red round-trips", () => {
    const { h, s, l } = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(1);
    expect(l).toBeCloseTo(0.5, 2);
    const rgb = hslToRgb(h, s, l);
    expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("grey stays grey", () => {
    const hsl = rgbToHsl(128, 128, 128);
    expect(hsl.s).toBe(0);
    const back = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(back.r).toBe(128);
    expect(back.g).toBe(128);
    expect(back.b).toBe(128);
  });
});

describe("invertLightness", () => {
  it("turns black into white and white into black", () => {
    expect(invertLightness({ r: 0, g: 0, b: 0 })).toEqual({ r: 255, g: 255, b: 255 });
    expect(invertLightness({ r: 255, g: 255, b: 255 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("preserves hue (approximately) for pure colors", () => {
    const original = rgbToHsl(255, 0, 0);
    const inverted = invertLightness({ r: 255, g: 0, b: 0 });
    const invHsl = rgbToHsl(inverted.r, inverted.g, inverted.b);
    expect(Math.abs(invHsl.h - original.h)).toBeLessThan(1);
  });
});
