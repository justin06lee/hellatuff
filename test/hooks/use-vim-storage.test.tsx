import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useVimStorage, VIM_STORAGE_KEY } from "../../src/hooks/use-vim-storage";

describe("useVimStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults to false when storage is empty", () => {
    const { result } = renderHook(() => useVimStorage());
    expect(result.current[0]).toBe(false);
  });

  it("initializes from storage when key is present", () => {
    window.localStorage.setItem(VIM_STORAGE_KEY, "1");
    const { result } = renderHook(() => useVimStorage());
    expect(result.current[0]).toBe(true);
  });

  it("persists updates to storage", () => {
    const { result } = renderHook(() => useVimStorage());
    act(() => result.current[1](true));
    expect(window.localStorage.getItem(VIM_STORAGE_KEY)).toBe("1");
    expect(result.current[0]).toBe(true);

    act(() => result.current[1](false));
    expect(window.localStorage.getItem(VIM_STORAGE_KEY)).toBe("0");
  });
});
