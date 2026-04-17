import { describe, expect, it } from "bun:test";
import { createFrontmatterParser } from "../../src/draft/frontmatter";

const csvList = (raw: string): string[] =>
  raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

describe("createFrontmatterParser", () => {
  it("reads title, collects listed keys into metadata, returns trimmed body", () => {
    const parser = createFrontmatterParser({
      keys: ["prerequisites"],
      normalize: { prerequisites: csvList },
    });
    const raw = [
      "# Derivatives",
      "",
      "prerequisites: calculus-1/limits, calculus-1/functions",
      "",
      "Main body here.",
    ].join("\n");
    const parsed = parser(raw, "fallback");

    expect(parsed.title).toBe("Derivatives");
    expect(parsed.metadata.prerequisites).toEqual([
      "calculus-1/limits",
      "calculus-1/functions",
    ]);
    expect(parsed.content).toBe("Main body here.");
  });

  it("uses fallback title when H1 missing", () => {
    const parser = createFrontmatterParser({ keys: ["tags"] });
    const parsed = parser("tags: a,b\n\nbody", "Untitled");
    expect(parsed.title).toBe("Untitled");
    expect(parsed.metadata.tags).toBe("a,b");
  });

  it("ignores unknown keys", () => {
    const parser = createFrontmatterParser({ keys: ["prerequisites"] });
    const parsed = parser(
      "# T\n\nprerequisites: x\nauthor: jane\n\nbody",
      "fallback"
    );
    expect(parsed.metadata).toEqual({ prerequisites: "x" });
    expect(parsed.content).toContain("author: jane");
  });

  it("case-insensitively matches keys", () => {
    const parser = createFrontmatterParser({ keys: ["prerequisites"] });
    const parsed = parser(
      "# T\n\nPrerequisites: x\n\nbody",
      "fallback"
    );
    expect(parsed.metadata.prerequisites).toBe("x");
  });

  it("stops scanning metadata at first non-matching non-blank line", () => {
    const parser = createFrontmatterParser({ keys: ["prerequisites"] });
    const parsed = parser(
      "# T\n\nprerequisites: x\n\nBody paragraph.\nprerequisites: y",
      "fallback"
    );
    expect(parsed.metadata.prerequisites).toBe("x");
    expect(parsed.content).toContain("Body paragraph.");
    expect(parsed.content).toContain("prerequisites: y");
  });
});
