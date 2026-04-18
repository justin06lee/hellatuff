import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useAutoTheme } from "../../src/hooks/use-auto-theme";

afterEach(cleanup);

describe("useAutoTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("returns override when explicit theme passed", () => {
    const { result } = renderHook(() => useAutoTheme("dark"));
    expect(result.current).toBe("dark");
  });

  it("reads [data-theme] from documentElement when override absent", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    const { result } = renderHook(() => useAutoTheme(undefined));
    expect(result.current).toBe("dark");
  });

  it("defaults to light when attribute absent", () => {
    const { result } = renderHook(() => useAutoTheme(undefined));
    expect(result.current).toBe("light");
  });

  it("updates when the attribute changes", async () => {
    const { result } = renderHook(() => useAutoTheme(undefined));
    expect(result.current).toBe("light");
    act(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current).toBe("dark");
  });
});
