import { describe, expect, it } from "bun:test";
import { applyNormalKey, type NormalState } from "../../src/vim/state";

function initial(text: string, cursor: number): NormalState {
  return { text, cursor, pendingCommand: null, preferredColumn: null };
}

describe("applyNormalKey", () => {
  it("hjkl moves cursor", () => {
    const after = applyNormalKey(initial("abc", 1), "l");
    expect(after.cursor).toBe(2);
    const back = applyNormalKey(after, "h");
    expect(back.cursor).toBe(1);
  });

  it("0 goes to line start, $ to last char", () => {
    const state = initial("hello world", 5);
    expect(applyNormalKey(state, "0").cursor).toBe(0);
    expect(applyNormalKey(state, "$").cursor).toBe(10);
  });

  it("G goes to end, gg goes to 0 (two-key)", () => {
    const start = initial("a\nb\nc", 0);
    const g1 = applyNormalKey(start, "g");
    expect(g1.pendingCommand).toBe("g");
    const g2 = applyNormalKey(g1, "g");
    expect(g2.cursor).toBe(0);
    expect(g2.pendingCommand).toBe(null);

    const toEnd = applyNormalKey(initial("a\nb\nc", 0), "G");
    expect(toEnd.cursor).toBe(4);
  });

  it("dd deletes current line (including following newline)", () => {
    const state = initial("one\ntwo\nthree", 4);
    const d1 = applyNormalKey(state, "d");
    expect(d1.pendingCommand).toBe("d");
    const d2 = applyNormalKey(d1, "d");
    expect(d2.text).toBe("one\nthree");
    expect(d2.pendingCommand).toBe(null);
  });

  it("x deletes char under cursor", () => {
    const state = initial("hello", 1);
    const after = applyNormalKey(state, "x");
    expect(after.text).toBe("hllo");
    expect(after.cursor).toBe(1);
  });

  it("o inserts a new line below and switches to insert intent", () => {
    const state = initial("hello\nworld", 2);
    const after = applyNormalKey(state, "o");
    expect(after.text).toBe("hello\n\nworld");
    expect(after.cursor).toBe(6);
    expect(after.nextMode).toBe("insert");
  });

  it("O inserts a new line above", () => {
    const state = initial("hello\nworld", 7);
    const after = applyNormalKey(state, "O");
    expect(after.text).toBe("hello\n\nworld");
    expect(after.cursor).toBe(6);
    expect(after.nextMode).toBe("insert");
  });

  it("i / a / I / A signal insert-mode entry with proper cursor", () => {
    const t = "  hello";
    expect(applyNormalKey(initial(t, 2), "i").nextMode).toBe("insert");
    expect(applyNormalKey(initial(t, 2), "I").cursor).toBe(2);
    expect(applyNormalKey(initial(t, 2), "a").cursor).toBe(3);
    expect(applyNormalKey(initial(t, 2), "A").cursor).toBe(t.length);
  });

  it("Escape clears pendingCommand only", () => {
    const withPending: NormalState = {
      text: "abc",
      cursor: 0,
      pendingCommand: "d",
      preferredColumn: null,
    };
    const after = applyNormalKey(withPending, "Escape");
    expect(after.pendingCommand).toBe(null);
    expect(after.text).toBe("abc");
  });

  it("clears preferredColumn on non-vertical motion", () => {
    const withColumn: NormalState = {
      text: "a\nbc",
      cursor: 0,
      pendingCommand: null,
      preferredColumn: 3,
    };
    const after = applyNormalKey(withColumn, "l");
    expect(after.preferredColumn).toBe(null);
  });

  it("updates preferredColumn on j/k", () => {
    const state = initial("longer line\nx", 5);
    const afterDown = applyNormalKey(state, "j");
    expect(afterDown.preferredColumn).toBe(5);
  });
});
