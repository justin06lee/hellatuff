import { describe, expect, it } from "bun:test";
import { titleOnlyParser } from "../../src/draft/title-only";

describe("titleOnlyParser", () => {
  it("uses the first H1 as title and remaining content as body", () => {
    const raw = "# My Article\n\nHello world.\n";
    const parsed = titleOnlyParser(raw, "fallback");
    expect(parsed.title).toBe("My Article");
    expect(parsed.content).toBe("Hello world.");
    expect(parsed.metadata).toEqual({});
  });

  it("falls back when no H1 is present", () => {
    const raw = "Hello world.";
    const parsed = titleOnlyParser(raw, "Untitled");
    expect(parsed.title).toBe("Untitled");
    expect(parsed.content).toBe("Hello world.");
  });

  it("strips leading BOM and blank lines before the title", () => {
    const raw = "\uFEFF\n\n# Title\n\nBody";
    const parsed = titleOnlyParser(raw, "fallback");
    expect(parsed.title).toBe("Title");
    expect(parsed.content).toBe("Body");
  });

  it("trims trailing blank lines from content", () => {
    const raw = "# Title\n\nBody\n\n\n";
    const parsed = titleOnlyParser(raw, "fallback");
    expect(parsed.content).toBe("Body");
  });

  it("returns empty content when only a title is present", () => {
    const raw = "# Only Title";
    const parsed = titleOnlyParser(raw, "fallback");
    expect(parsed.title).toBe("Only Title");
    expect(parsed.content).toBe("");
  });
});
