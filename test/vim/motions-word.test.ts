import { describe, expect, it } from "bun:test";
import {
  getCharClass,
  moveToNextWordStart,
  moveToPreviousWordStart,
  moveToWordEnd,
} from "../../src/vim/motions";

describe("getCharClass", () => {
  it("categorizes space, word, symbol", () => {
    expect(getCharClass(" ")).toBe("space");
    expect(getCharClass("\n")).toBe("space");
    expect(getCharClass("a")).toBe("word");
    expect(getCharClass("1")).toBe("word");
    expect(getCharClass("_")).toBe("word");
    expect(getCharClass("!")).toBe("symbol");
    expect(getCharClass(undefined)).toBe("space");
  });
});

describe("moveToNextWordStart", () => {
  it("skips to next word start across whitespace", () => {
    expect(moveToNextWordStart("foo bar", 0)).toBe(4);
    expect(moveToNextWordStart("foo   bar", 0)).toBe(6);
  });

  it("treats symbols as their own class", () => {
    expect(moveToNextWordStart("foo!!bar", 0)).toBe(3);
    expect(moveToNextWordStart("foo!!bar", 3)).toBe(5);
  });
});

describe("moveToPreviousWordStart", () => {
  it("walks back to prior word start", () => {
    expect(moveToPreviousWordStart("foo bar baz", 10)).toBe(8);
    expect(moveToPreviousWordStart("foo   bar", 8)).toBe(6);
  });
});

describe("moveToWordEnd", () => {
  it("advances to last char of current word", () => {
    expect(moveToWordEnd("foo bar", 0)).toBe(2);
    expect(moveToWordEnd("foo bar", 1)).toBe(2);
  });

  it("skips leading whitespace before advancing", () => {
    expect(moveToWordEnd("   hello", 0)).toBe(7);
  });
});
