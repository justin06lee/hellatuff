import { describe, expect, it } from "bun:test";
import {
  clamp,
  getCurrentColumn,
  getFirstNonWhitespace,
  getLineEnd,
  getLineLastCharacter,
  getLineStart,
  moveVertical,
  normalizeNormalCursor,
} from "../../src/vim/motions";

describe("clamp", () => {
  it("bounds value within min/max", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe("normalizeNormalCursor", () => {
  it("clamps to last character (not past end)", () => {
    expect(normalizeNormalCursor("abc", 99)).toBe(2);
    expect(normalizeNormalCursor("", 0)).toBe(0);
    expect(normalizeNormalCursor("x", 1)).toBe(0);
  });
});

describe("getLineStart / getLineEnd", () => {
  const text = "foo\nbar\nbaz";

  it("returns start of current line", () => {
    expect(getLineStart(text, 0)).toBe(0);
    expect(getLineStart(text, 2)).toBe(0);
    expect(getLineStart(text, 4)).toBe(4);
    expect(getLineStart(text, 6)).toBe(4);
    expect(getLineStart(text, 10)).toBe(8);
  });

  it("returns end of current line (exclusive of newline)", () => {
    expect(getLineEnd(text, 0)).toBe(3);
    expect(getLineEnd(text, 4)).toBe(7);
    expect(getLineEnd(text, 9)).toBe(11);
  });
});

describe("getLineLastCharacter", () => {
  it("returns last character index on the line, or start if empty", () => {
    expect(getLineLastCharacter("abc\ndef", 1)).toBe(2);
    expect(getLineLastCharacter("\n\n", 1)).toBe(1);
  });
});

describe("getCurrentColumn", () => {
  it("counts chars from line start", () => {
    expect(getCurrentColumn("abc\ndef", 5)).toBe(1);
    expect(getCurrentColumn("abc\ndef", 0)).toBe(0);
  });
});

describe("getFirstNonWhitespace", () => {
  it("returns first non-ws char on line", () => {
    expect(getFirstNonWhitespace("   hello", 0)).toBe(3);
    expect(getFirstNonWhitespace("hello", 2)).toBe(0);
    expect(getFirstNonWhitespace("   ", 0)).toBe(0);
  });
});

describe("moveVertical", () => {
  const text = "short\nlonger line\nx";

  it("moves up preserving column when possible", () => {
    const fromLongerCol5 = 11;
    const result = moveVertical(text, fromLongerCol5, -1, null);
    expect(result.index).toBe(5);
  });

  it("moves down preserving column", () => {
    const result = moveVertical(text, 3, 1, null);
    expect(result.index).toBe(6 + 3);
  });

  it("stays at start of line when line is empty", () => {
    const result = moveVertical("a\n\nb", 0, 1, null);
    expect(result.index).toBe(2);
  });
});
