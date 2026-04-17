import { describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useDirty } from "../../src/hooks/use-dirty";

describe("useDirty", () => {
  it("returns false when raw equals baseline", () => {
    const { result } = renderHook(() => useDirty("same", "same"));
    expect(result.current).toBe(false);
  });

  it("returns true when raw differs from baseline", () => {
    const { result } = renderHook(() => useDirty("changed", "original"));
    expect(result.current).toBe(true);
  });

  it("invokes onChange callback when dirty flag transitions", () => {
    const onChange = mock<(dirty: boolean) => void>();
    const { rerender } = renderHook(
      ({ raw, base }: { raw: string; base: string }) =>
        useDirty(raw, base, onChange),
      { initialProps: { raw: "a", base: "a" } }
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]).toEqual([false]);

    rerender({ raw: "b", base: "a" });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1]).toEqual([true]);

    rerender({ raw: "b", base: "a" });
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
