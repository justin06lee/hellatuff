# hellatuff Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@justin06lee/hellatuff` — a headless React article-editor library extracted from `tenet/archive/app/operator/OperatorArticleEditor.tsx`, with subpath exports for a default markdown renderer, drawing window, and starter styles.

**Architecture:** One package, four subpath exports (`.`, `/renderer`, `/drawing`, `/styles.css`). Core is framework-agnostic React with zero runtime deps beyond `react`. Consumer supplies `onSave`, `onAssetDelete`, `renderer`, and optionally a draft parser. Optional peer deps for renderer. Built and published with Bun.

**Tech Stack:** React 18+ peer, TypeScript strict, Bun (bundler + test runner + publish), Biome (lint/format), `@testing-library/react` + `happy-dom` for component tests. Subpath exports via `package.json#exports`.

**Source reference:** `/Users/huiyunlee/Workspace/github.com/justin06lee/tenet/archive` — extract from `app/operator/OperatorArticleEditor.tsx`, `app/operator/OperatorDrawingWindow.tsx`, `app/components/markdown-renderer.tsx`, `app/components/collapsible-markdown.tsx`, `lib/article-draft.ts`, `lib/article-sections.ts`.

**Spec:** `docs/superpowers/specs/2026-04-16-hellatuff-library-design.md`

**Repo:** `/Users/huiyunlee/Workspace/github.com/justin06lee/hellatuff` (currently empty — just README + spec).

---

## Conventions

- **File paths are absolute from repo root** (e.g., `src/types.ts`).
- **Commits use conventional-commits prefixes**: `chore:`, `feat:`, `test:`, `docs:`, `refactor:`.
- **TDD flow for pure logic**: test first, verify fails, implement, verify passes, commit.
- **Pragmatic flow for UI components** (where a failing-test-first iteration is friction-heavy): implement the component, write an interaction test, verify it passes, commit.
- **All test files live under `test/`** mirroring `src/` structure.
- When a step says "port from tenet/archive/...", the executing agent reads the referenced file, applies the listed surgical changes, and commits the result. Do **not** paraphrase — preserve behavior.
- **Never** add Tailwind classes. Use `.hlt-*` CSS class names (styles ship separately in `styles/hellatuff.css`).

---

## Task 1: Scaffold repo

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `biome.json`
- Create: `bunfig.toml`
- Create: `.gitignore`
- Create: `test/setup.ts`
- Create: `src/index.ts` (placeholder)
- Create directories: `src/editor/`, `src/vim/`, `src/draft/`, `src/hooks/`, `src/renderer/`, `src/drawing/`, `styles/`, `test/`, `examples/`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@justin06lee/hellatuff",
  "version": "0.1.0",
  "description": "Headless React article editor with optional renderer, drawing window, and starter styles.",
  "license": "MIT",
  "author": "justin06lee",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./renderer": {
      "types": "./dist/renderer.d.ts",
      "import": "./dist/renderer.js"
    },
    "./drawing": {
      "types": "./dist/drawing.d.ts",
      "import": "./dist/drawing.js"
    },
    "./styles.css": "./dist/hellatuff.css"
  },
  "scripts": {
    "build": "bun run build.ts",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "format": "biome format --write .",
    "prepublishOnly": "bun run lint && bun run typecheck && bun run test && bun run build"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "peerDependenciesMeta": {
    "react-markdown": { "optional": true },
    "remark-gfm": { "optional": true },
    "remark-math": { "optional": true },
    "rehype-katex": { "optional": true },
    "rehype-highlight": { "optional": true },
    "rehype-slug": { "optional": true },
    "katex": { "optional": true }
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@happy-dom/global-registrator": "^15.7.0",
    "@testing-library/react": "^16.0.0",
    "@types/bun": "^1.1.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.5.0"
  },
  "keywords": ["markdown", "editor", "react", "article", "vim", "headless"],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/justin06lee/hellatuff.git"
  },
  "engines": {
    "bun": ">=1.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": false,
    "skipLibCheck": true,
    "types": ["bun-types"],
    "allowImportingTsExtensions": false,
    "noEmit": true
  },
  "include": ["src/**/*", "test/**/*", "build.ts"],
  "exclude": ["node_modules", "dist", "examples"]
}
```

- [ ] **Step 3: Create `tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["test/**/*", "src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

- [ ] **Step 4: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "warn" },
      "style": { "useImportType": "off" },
      "a11y": { "useKeyWithClickEvents": "off" }
    }
  },
  "files": { "ignore": ["dist", "node_modules", "examples"] }
}
```

- [ ] **Step 5: Create `bunfig.toml`**

```toml
[test]
preload = ["./test/setup.ts"]
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
examples/**/node_modules
examples/**/.next
examples/**/dist
```

- [ ] **Step 7: Create `test/setup.ts`**

```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
```

- [ ] **Step 8: Create placeholder `src/index.ts`**

```ts
export {};
```

- [ ] **Step 9: Install dependencies**

Run:
```bash
cd /Users/huiyunlee/Workspace/github.com/justin06lee/hellatuff
bun install
```

Expected: `bun install` completes, `node_modules/` populated, `bun.lock` created.

- [ ] **Step 10: Verify typecheck passes**

Run: `bun run typecheck`
Expected: no errors (empty `src/index.ts` has no type errors).

- [ ] **Step 11: Commit**

```bash
git add package.json tsconfig.json tsconfig.build.json biome.json bunfig.toml .gitignore test/setup.ts src/index.ts bun.lock
git commit -m "chore: scaffold hellatuff repo"
```

---

## Task 2: Core types

**Files:**
- Create: `src/types.ts`
- Test: *(no tests — types only)*

- [ ] **Step 1: Write `src/types.ts`**

```ts
import type { ReactNode } from "react";

export interface AssetBase {
  id: string;
  displayName: string;
  url: string;
  darkUrl?: string;
  markdown: string;
}

export type EditorMode = "edit" | "preview" | "split";
export type VimMode = "insert" | "normal";

export interface SaveResult {
  version?: string;
  message?: string;
}

export interface ParsedDraft {
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export type DraftParser = (raw: string, fallbackTitle: string) => ParsedDraft;

export interface ToolbarAction {
  label: string;
  before: string;
  after?: string;
  placeholder?: string;
}

export interface EditorProps<TAsset extends AssetBase = AssetBase> {
  articlePath?: string[];
  articleName?: string;
  initialRaw: string;
  initialVersion?: string;

  onChange?: (raw: string) => void;
  onSave: (raw: string, version?: string) => Promise<SaveResult>;
  onDirtyChange?: (dirty: boolean) => void;

  assets?: TAsset[];
  onAssetDelete?: (asset: TAsset) => Promise<void>;
  onAssetCreated?: (asset: TAsset) => void;

  renderer?: (content: string) => ReactNode;
  imageBaseUrl?: string;

  parseDraft?: DraftParser;

  defaultMode?: EditorMode;
  toolbar?: ToolbarAction[] | false;
  vimEnabled?: boolean;
  className?: string;
  theme?: "light" | "dark";

  header?: ReactNode;
  footer?: ReactNode;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: core types"
```

---

## Task 3: Title-only draft parser

**Files:**
- Create: `src/draft/title-only.ts`
- Test: `test/draft/title-only.test.ts`

- [ ] **Step 1: Write failing test `test/draft/title-only.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify fail**

Run: `bun test test/draft/title-only.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/draft/title-only.ts`**

```ts
import type { DraftParser } from "../types";

function trimBlankEdges(lines: string[]): string {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start]?.trim() === "") {
    start += 1;
  }

  while (end > start && lines[end - 1]?.trim() === "") {
    end -= 1;
  }

  return lines.slice(start, end).join("\n");
}

export const titleOnlyParser: DraftParser = (raw, fallbackTitle) => {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  let cursor = 0;
  let title = fallbackTitle;

  while (cursor < lines.length && lines[cursor]?.trim() === "") {
    cursor += 1;
  }

  const titleMatch = lines[cursor]?.match(/^#\s+(.+)$/);
  if (titleMatch) {
    title = titleMatch[1].trim();
    cursor += 1;
  }

  return {
    title,
    content: trimBlankEdges(lines.slice(cursor)),
    metadata: {},
  };
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun test test/draft/title-only.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/draft/title-only.ts test/draft/title-only.test.ts
git commit -m "feat: title-only draft parser"
```

---

## Task 4: Frontmatter draft parser

**Files:**
- Create: `src/draft/frontmatter.ts`
- Test: `test/draft/frontmatter.test.ts`

- [ ] **Step 1: Write failing test `test/draft/frontmatter.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify fail**

Run: `bun test test/draft/frontmatter.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/draft/frontmatter.ts`**

```ts
import type { DraftParser } from "../types";

function trimBlankEdges(lines: string[]): string {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start]?.trim() === "") {
    start += 1;
  }

  while (end > start && lines[end - 1]?.trim() === "") {
    end -= 1;
  }

  return lines.slice(start, end).join("\n");
}

export interface FrontmatterParserOptions {
  keys: string[];
  normalize?: Record<string, (raw: string) => unknown>;
}

export function createFrontmatterParser(
  options: FrontmatterParserOptions
): DraftParser {
  const lowerKeys = new Set(options.keys.map((key) => key.toLowerCase()));
  const normalize = options.normalize ?? {};

  return (raw, fallbackTitle) => {
    const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
    const metadata: Record<string, unknown> = {};
    let cursor = 0;
    let title = fallbackTitle;

    while (cursor < lines.length && lines[cursor]?.trim() === "") {
      cursor += 1;
    }

    const titleMatch = lines[cursor]?.match(/^#\s+(.+)$/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      cursor += 1;
    }

    while (cursor < lines.length) {
      const line = lines[cursor]?.trim() ?? "";
      if (line === "") {
        cursor += 1;
        continue;
      }

      const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
      if (!kvMatch) {
        break;
      }

      const key = kvMatch[1].toLowerCase();
      if (!lowerKeys.has(key)) {
        break;
      }

      const rawValue = kvMatch[2];
      const normalizer = normalize[key];
      metadata[key] = normalizer ? normalizer(rawValue) : rawValue;
      cursor += 1;
    }

    return {
      title,
      content: trimBlankEdges(lines.slice(cursor)),
      metadata,
    };
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun test test/draft/frontmatter.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/draft/frontmatter.ts test/draft/frontmatter.test.ts
git commit -m "feat: frontmatter draft parser"
```

---

## Task 5: Vim line / cursor helpers

**Files:**
- Create: `src/vim/motions.ts`
- Test: `test/vim/motions-line.test.ts`

- [ ] **Step 1: Write failing test `test/vim/motions-line.test.ts`**

```ts
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
    const fromLongerCol5 = 11; // "longer" l=6, "longer line"[5]='r'
    const result = moveVertical(text, fromLongerCol5, -1, null);
    expect(result.index).toBe(5); // beyond "short" (len=5), clamped to last char
  });

  it("moves down preserving column", () => {
    const result = moveVertical(text, 3, 1, null);
    expect(result.index).toBe(6 + 3); // "longer line" has column 3
  });

  it("stays at start of line when line is empty", () => {
    const result = moveVertical("a\n\nb", 0, 1, null);
    expect(result.index).toBe(2); // empty line start
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `bun test test/vim/motions-line.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/vim/motions.ts`**

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeNormalCursor(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }
  return clamp(index, 0, text.length - 1);
}

export function getLineStart(text: string, index: number): number {
  let cursor = clamp(index, 0, text.length);
  while (cursor > 0 && text[cursor - 1] !== "\n") {
    cursor -= 1;
  }
  return cursor;
}

export function getLineEnd(text: string, index: number): number {
  let cursor = clamp(index, 0, text.length);
  while (cursor < text.length && text[cursor] !== "\n") {
    cursor += 1;
  }
  return cursor;
}

export function getLineLastCharacter(text: string, index: number): number {
  const start = getLineStart(text, index);
  const end = getLineEnd(text, index);
  return end > start ? end - 1 : start;
}

export function getCurrentColumn(text: string, index: number): number {
  return clamp(index, 0, text.length) - getLineStart(text, index);
}

export function getFirstNonWhitespace(text: string, index: number): number {
  const start = getLineStart(text, index);
  const end = getLineEnd(text, index);
  let cursor = start;
  while (cursor < end && /\s/.test(text[cursor] ?? "")) {
    cursor += 1;
  }
  return cursor < end ? cursor : start;
}

export function moveVertical(
  text: string,
  index: number,
  direction: -1 | 1,
  preferredColumn: number | null
): { column: number; index: number } {
  if (text.length === 0) {
    return { column: 0, index: 0 };
  }

  const currentStart = getLineStart(text, index);
  const targetColumn = preferredColumn ?? getCurrentColumn(text, index);

  if (direction === -1) {
    if (currentStart === 0) {
      return { column: targetColumn, index };
    }

    const previousLineEnd = currentStart - 1;
    const previousLineStart = getLineStart(text, previousLineEnd);
    const previousLineLength =
      getLineEnd(text, previousLineStart) - previousLineStart;
    const targetIndex =
      previousLineLength > 0
        ? previousLineStart + Math.min(targetColumn, previousLineLength - 1)
        : previousLineStart;

    return { column: targetColumn, index: targetIndex };
  }

  const currentLineEnd = getLineEnd(text, index);
  if (currentLineEnd >= text.length) {
    return { column: targetColumn, index };
  }

  const nextLineStart = currentLineEnd + 1;
  const nextLineLength = getLineEnd(text, nextLineStart) - nextLineStart;
  const targetIndex =
    nextLineLength > 0
      ? nextLineStart + Math.min(targetColumn, nextLineLength - 1)
      : nextLineStart;

  return { column: targetColumn, index: targetIndex };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun test test/vim/motions-line.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/vim/motions.ts test/vim/motions-line.test.ts
git commit -m "feat: vim line/cursor helpers"
```

---

## Task 6: Vim word motions

**Files:**
- Modify: `src/vim/motions.ts` (append)
- Test: `test/vim/motions-word.test.ts`

- [ ] **Step 1: Write failing test `test/vim/motions-word.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify fail**

Run: `bun test test/vim/motions-word.test.ts`
Expected: FAIL (exports not found).

- [ ] **Step 3: Append to `src/vim/motions.ts`**

```ts
export function getCharClass(
  character: string | undefined
): "space" | "symbol" | "word" {
  if (!character || /\s/.test(character)) {
    return "space";
  }
  if (/\w/.test(character)) {
    return "word";
  }
  return "symbol";
}

export function moveToNextWordStart(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }

  let cursor = normalizeNormalCursor(text, index);
  const kind = getCharClass(text[cursor]);

  if (kind === "space") {
    while (cursor < text.length && getCharClass(text[cursor]) === "space") {
      cursor += 1;
    }
    return normalizeNormalCursor(text, cursor);
  }

  while (cursor < text.length && getCharClass(text[cursor]) === kind) {
    cursor += 1;
  }

  while (cursor < text.length && getCharClass(text[cursor]) === "space") {
    cursor += 1;
  }

  return normalizeNormalCursor(text, cursor);
}

export function moveToPreviousWordStart(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }

  let cursor = normalizeNormalCursor(text, Math.max(index - 1, 0));

  while (cursor > 0 && getCharClass(text[cursor]) === "space") {
    cursor -= 1;
  }

  const kind = getCharClass(text[cursor]);
  while (cursor > 0 && getCharClass(text[cursor - 1]) === kind) {
    cursor -= 1;
  }

  return cursor;
}

export function moveToWordEnd(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }

  let cursor = normalizeNormalCursor(text, index);

  while (cursor < text.length - 1 && getCharClass(text[cursor]) === "space") {
    cursor += 1;
  }

  const kind = getCharClass(text[cursor]);
  while (
    cursor < text.length - 1 &&
    getCharClass(text[cursor + 1]) === kind
  ) {
    cursor += 1;
  }

  return cursor;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun test test/vim/motions-word.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/vim/motions.ts test/vim/motions-word.test.ts
git commit -m "feat: vim word motions"
```

---

## Task 7: Vim normal-mode state machine

**Files:**
- Create: `src/vim/state.ts`
- Test: `test/vim/state.test.ts`

- [ ] **Step 1: Write failing test `test/vim/state.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify fail**

Run: `bun test test/vim/state.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/vim/state.ts`**

```ts
import {
  clamp,
  getCurrentColumn,
  getFirstNonWhitespace,
  getLineEnd,
  getLineLastCharacter,
  getLineStart,
  moveToNextWordStart,
  moveToPreviousWordStart,
  moveToWordEnd,
  moveVertical,
  normalizeNormalCursor,
} from "./motions";

export type PendingCommand = "d" | "g" | null;
export type VimModeIntent = "insert" | null;

export interface NormalState {
  text: string;
  cursor: number;
  pendingCommand: PendingCommand;
  preferredColumn: number | null;
}

export interface NormalResult extends NormalState {
  nextMode: VimModeIntent;
}

function withReset(state: NormalState, patch: Partial<NormalResult>): NormalResult {
  return {
    text: patch.text ?? state.text,
    cursor: patch.cursor ?? state.cursor,
    pendingCommand: patch.pendingCommand ?? null,
    preferredColumn:
      patch.preferredColumn === undefined ? null : patch.preferredColumn,
    nextMode: patch.nextMode ?? null,
  };
}

export function applyNormalKey(state: NormalState, key: string): NormalResult {
  const { text } = state;
  const cursor = normalizeNormalCursor(text, state.cursor);
  const preservesColumn = key === "j" || key === "k";
  const carryColumn = preservesColumn ? state.preferredColumn : null;

  if (state.pendingCommand === "g") {
    if (key === "g") {
      return withReset(state, { cursor: 0 });
    }
    return withReset(state, {});
  }

  if (state.pendingCommand === "d") {
    if (key === "d") {
      const start = getLineStart(text, cursor);
      const end = getLineEnd(text, cursor);
      const deleteEnd = end < text.length ? end + 1 : end;
      const nextText = text.slice(0, start) + text.slice(deleteEnd);
      const nextCursor =
        nextText.length === 0 ? 0 : normalizeNormalCursor(nextText, start);
      return withReset(state, { text: nextText, cursor: nextCursor });
    }
    return withReset(state, {});
  }

  switch (key) {
    case "Escape":
      return withReset(state, {});
    case "h":
      return withReset(state, { cursor: Math.max(cursor - 1, 0) });
    case "l":
      return withReset(state, {
        cursor: text.length === 0 ? 0 : Math.min(cursor + 1, text.length - 1),
      });
    case "j": {
      const next = moveVertical(text, cursor, 1, carryColumn);
      return withReset(state, {
        cursor: next.index,
        preferredColumn: next.column,
      });
    }
    case "k": {
      const next = moveVertical(text, cursor, -1, carryColumn);
      return withReset(state, {
        cursor: next.index,
        preferredColumn: next.column,
      });
    }
    case "w":
      return withReset(state, { cursor: moveToNextWordStart(text, cursor + 1) });
    case "b":
      return withReset(state, { cursor: moveToPreviousWordStart(text, cursor) });
    case "e":
      return withReset(state, { cursor: moveToWordEnd(text, cursor) });
    case "0":
      return withReset(state, { cursor: getLineStart(text, cursor) });
    case "$":
      return withReset(state, { cursor: getLineLastCharacter(text, cursor) });
    case "g":
      return { ...withReset(state, {}), pendingCommand: "g" };
    case "G":
      return withReset(state, {
        cursor: normalizeNormalCursor(text, text.length - 1),
      });
    case "i":
      return withReset(state, { cursor, nextMode: "insert" });
    case "a":
      return withReset(state, {
        cursor: text.length === 0 ? 0 : Math.min(cursor + 1, text.length),
        nextMode: "insert",
      });
    case "I":
      return withReset(state, {
        cursor: getFirstNonWhitespace(text, cursor),
        nextMode: "insert",
      });
    case "A":
      return withReset(state, {
        cursor: getLineEnd(text, cursor),
        nextMode: "insert",
      });
    case "o": {
      const lineEnd = getLineEnd(text, cursor);
      const insertAt = lineEnd < text.length ? lineEnd + 1 : lineEnd;
      const nextText = `${text.slice(0, insertAt)}\n${text.slice(insertAt)}`;
      return withReset(state, {
        text: nextText,
        cursor: insertAt + 1,
        nextMode: "insert",
      });
    }
    case "O": {
      const lineStart = getLineStart(text, cursor);
      const nextText = `${text.slice(0, lineStart)}\n${text.slice(lineStart)}`;
      return withReset(state, {
        text: nextText,
        cursor: lineStart,
        nextMode: "insert",
      });
    }
    case "x": {
      if (text.length === 0) {
        return withReset(state, {});
      }
      const nextText = text.slice(0, cursor) + text.slice(cursor + 1);
      const nextCursor =
        nextText.length === 0 ? 0 : normalizeNormalCursor(nextText, cursor);
      return withReset(state, { text: nextText, cursor: nextCursor });
    }
    case "d":
      return { ...withReset(state, {}), pendingCommand: "d" };
    default:
      // Unknown key: clear any pending and leave state untouched.
      return withReset(state, {});
  }
  // The clamp import is unused in this file; suppress unused import at file level.
  void clamp;
}
```

Note: remove the `void clamp` line and the `clamp` import if the linter complains about unused imports. The safe alternative (explicit `import type`) is to change the top line to `import { ... } from "./motions";` without `clamp`.

- [ ] **Step 4: Run test to verify pass**

Run: `bun test test/vim/state.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/vim/state.ts test/vim/state.test.ts
git commit -m "feat: vim normal-mode state machine"
```

---

## Task 8: useDirty hook

**Files:**
- Create: `src/hooks/use-dirty.ts`
- Test: `test/hooks/use-dirty.test.tsx`

- [ ] **Step 1: Write failing test `test/hooks/use-dirty.test.tsx`**

```tsx
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
    // Same dirty value — should not fire again.
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `bun test test/hooks/use-dirty.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/hooks/use-dirty.ts`**

```ts
import { useEffect, useRef } from "react";

export function useDirty(
  raw: string,
  baseline: string,
  onChange?: (dirty: boolean) => void
): boolean {
  const dirty = raw !== baseline;
  const lastReported = useRef<boolean | null>(null);

  useEffect(() => {
    if (!onChange) {
      return;
    }
    if (lastReported.current === dirty) {
      return;
    }
    lastReported.current = dirty;
    onChange(dirty);
  }, [dirty, onChange]);

  return dirty;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun test test/hooks/use-dirty.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-dirty.ts test/hooks/use-dirty.test.tsx
git commit -m "feat: useDirty hook"
```

---

## Task 9: useVimStorage hook

**Files:**
- Create: `src/hooks/use-vim-storage.ts`
- Test: `test/hooks/use-vim-storage.test.tsx`

- [ ] **Step 1: Write failing test `test/hooks/use-vim-storage.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run test to verify fail**

Run: `bun test test/hooks/use-vim-storage.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/hooks/use-vim-storage.ts`**

```ts
import { useCallback, useEffect, useState } from "react";

export const VIM_STORAGE_KEY = "hellatuff-editor-vim";

function readStored(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(VIM_STORAGE_KEY) === "1";
}

export function useVimStorage(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState(readStored);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(VIM_STORAGE_KEY, enabled ? "1" : "0");
  }, [enabled]);

  const set = useCallback((next: boolean) => {
    setEnabled(next);
  }, []);

  return [enabled, set];
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun test test/hooks/use-vim-storage.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-vim-storage.ts test/hooks/use-vim-storage.test.tsx
git commit -m "feat: useVimStorage hook"
```

---

## Task 10: useAutoTheme hook

**Files:**
- Create: `src/hooks/use-auto-theme.ts`
- Test: `test/hooks/use-auto-theme.test.tsx`

- [ ] **Step 1: Write failing test `test/hooks/use-auto-theme.test.tsx`**

```tsx
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useAutoTheme } from "../../src/hooks/use-auto-theme";

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
    // MutationObserver fires synchronously in happy-dom for attribute changes.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current).toBe("dark");
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `bun test test/hooks/use-auto-theme.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/hooks/use-auto-theme.ts`**

```ts
import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function readAttribute(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useAutoTheme(override: Theme | undefined): Theme {
  const [theme, setTheme] = useState<Theme>(() => override ?? readAttribute());

  useEffect(() => {
    if (override) {
      setTheme(override);
      return;
    }

    setTheme(readAttribute());

    if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
      return;
    }

    const observer = new MutationObserver(() => {
      setTheme(readAttribute());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [override]);

  return theme;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `bun test test/hooks/use-auto-theme.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-auto-theme.ts test/hooks/use-auto-theme.test.tsx
git commit -m "feat: useAutoTheme hook"
```

---

## Task 11: Default toolbar actions + Toolbar component

**Files:**
- Create: `src/editor/defaults.ts`
- Create: `src/editor/Toolbar.tsx`
- Test: `test/editor/toolbar.test.tsx`

- [ ] **Step 1: Implement `src/editor/defaults.ts`**

```ts
import type { ToolbarAction } from "../types";

export const DEFAULT_TOOLBAR: ToolbarAction[] = [
  { label: "H2", before: "\n## ", placeholder: "Section Title" },
  { label: "Bold", before: "**", after: "**", placeholder: "bold text" },
  { label: "List", before: "\n- ", placeholder: "List item" },
  { label: "Code", before: "\n```txt\n", after: "\n```\n", placeholder: "code" },
  { label: "Link", before: "[", after: "](https://example.com)", placeholder: "label" },
  { label: "Math", before: "\n$$\n", after: "\n$$\n", placeholder: "x^2 + y^2 = z^2" },
];
```

- [ ] **Step 2: Implement `src/editor/Toolbar.tsx`**

```tsx
import type { ToolbarAction } from "../types";

interface ToolbarProps {
  actions: ToolbarAction[];
  onAction: (action: ToolbarAction) => void;
  trailing?: React.ReactNode;
}

export function Toolbar({ actions, onAction, trailing }: ToolbarProps) {
  return (
    <div className="hlt-toolbar">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="hlt-toolbar-button"
          onClick={() => onAction(action)}
        >
          {action.label}
        </button>
      ))}
      {trailing ? <span className="hlt-toolbar-trailing">{trailing}</span> : null}
    </div>
  );
}
```

- [ ] **Step 3: Write test `test/editor/toolbar.test.tsx`**

```tsx
import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { DEFAULT_TOOLBAR } from "../../src/editor/defaults";
import { Toolbar } from "../../src/editor/Toolbar";

describe("Toolbar", () => {
  it("renders a button per action and fires onAction on click", () => {
    const onAction = mock(() => {});
    render(<Toolbar actions={DEFAULT_TOOLBAR} onAction={onAction} />);
    const boldButton = screen.getByRole("button", { name: "Bold" });
    boldButton.click();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0][0].label).toBe("Bold");
  });

  it("renders trailing content when provided", () => {
    render(
      <Toolbar actions={[]} onAction={() => {}} trailing={<span>status</span>} />
    );
    expect(screen.getByText("status")).toBeDefined();
  });
});
```

- [ ] **Step 4: Run test**

Run: `bun test test/editor/toolbar.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/editor/defaults.ts src/editor/Toolbar.tsx test/editor/toolbar.test.tsx
git commit -m "feat: default toolbar actions and component"
```

---

## Task 12: Starter styles CSS

**Files:**
- Create: `styles/hellatuff.css`

This task ships the token + class system used by all other UI components. No test — CSS is verified visually via examples.

- [ ] **Step 1: Implement `styles/hellatuff.css`**

```css
/* @justin06lee/hellatuff starter styles
 * Design tokens + component classes. Override tokens in your own stylesheet
 * to retheme. All component classes are prefixed `hlt-`.
 */

:root {
  --hlt-background: #faf8f2;
  --hlt-surface: #ffffff;
  --hlt-surface-alt: #efede7;
  --hlt-foreground: #1a1a1a;
  --hlt-muted: #6b6b6b;
  --hlt-border: #d9d6cd;
  --hlt-accent: #1a1a1a;
  --hlt-accent-inverse: #faf8f2;
  --hlt-danger: #b91c1c;
  --hlt-scrim: rgba(0, 0, 0, 0.25);
  --hlt-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  --hlt-font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --hlt-font-mono: ui-monospace, "SF Mono", Menlo, monospace;
}

[data-theme="dark"] {
  --hlt-background: #12120f;
  --hlt-surface: #1a1a16;
  --hlt-surface-alt: #22221d;
  --hlt-foreground: #f0ede4;
  --hlt-muted: #9d9a90;
  --hlt-border: #2f2e28;
  --hlt-accent: #f0ede4;
  --hlt-accent-inverse: #12120f;
  --hlt-danger: #f87171;
  --hlt-scrim: rgba(0, 0, 0, 0.55);
  --hlt-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
}

.hlt-editor {
  border: 1px solid var(--hlt-border);
  background: var(--hlt-surface);
  font-family: var(--hlt-font-sans);
  color: var(--hlt-foreground);
}

.hlt-editor-header {
  border-bottom: 1px solid var(--hlt-border);
  padding: 1rem;
}

.hlt-editor-header-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1280px) {
  .hlt-editor-header-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.hlt-editor-eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--hlt-muted);
}

.hlt-editor-title {
  margin-top: 0.25rem;
  font-size: 1.875rem;
  letter-spacing: -0.02em;
  color: var(--hlt-foreground);
}

.hlt-editor-crumbs {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--hlt-muted);
}

.hlt-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.hlt-toolbar-button,
.hlt-button {
  border: 1px solid var(--hlt-border);
  background: var(--hlt-surface);
  color: var(--hlt-foreground);
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.hlt-toolbar-button:hover,
.hlt-button:hover {
  background: var(--hlt-surface-alt);
}

.hlt-toolbar-trailing {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--hlt-muted);
}

.hlt-button-primary {
  background: var(--hlt-accent);
  color: var(--hlt-accent-inverse);
  border-color: var(--hlt-accent);
  text-transform: none;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

.hlt-button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hlt-mode-group {
  display: flex;
  border: 1px solid var(--hlt-border);
}

.hlt-mode-button {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background: var(--hlt-surface);
  color: var(--hlt-foreground);
  border: none;
  cursor: pointer;
}

.hlt-mode-button[aria-pressed="true"] {
  background: var(--hlt-accent);
  color: var(--hlt-accent-inverse);
}

.hlt-grid {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 70vh;
}

@media (min-width: 1280px) {
  .hlt-grid {
    grid-template-columns: 18rem 1fr;
  }
}

.hlt-sidebar {
  border-bottom: 1px solid var(--hlt-border);
  background: var(--hlt-surface-alt);
}

@media (min-width: 1280px) {
  .hlt-sidebar {
    border-bottom: none;
    border-right: 1px solid var(--hlt-border);
  }
}

.hlt-sidebar-header {
  border-bottom: 1px solid var(--hlt-border);
  padding: 0.75rem 1rem;
}

.hlt-sidebar-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hlt-asset-card {
  border: 1px solid var(--hlt-border);
  background: var(--hlt-surface);
  padding: 0.75rem;
}

.hlt-asset-thumb {
  position: relative;
  margin-bottom: 0.75rem;
  aspect-ratio: 16 / 9;
  width: 100%;
  border: 1px solid var(--hlt-border);
  background: var(--hlt-surface-alt);
  overflow: hidden;
}

.hlt-asset-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.hlt-asset-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--hlt-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hlt-asset-path {
  margin-top: 0.25rem;
  font-family: var(--hlt-font-mono);
  font-size: 0.75rem;
  color: var(--hlt-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hlt-asset-actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.hlt-editor-panes {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 70vh;
}

@media (min-width: 1280px) {
  .hlt-editor-panes.hlt-panes-split {
    grid-template-columns: 1fr 1fr;
  }
}

.hlt-textarea {
  width: 100%;
  min-height: 70vh;
  resize: none;
  background: var(--hlt-background);
  color: var(--hlt-foreground);
  font-family: var(--hlt-font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  border: none;
  outline: none;
  padding: 1rem;
}

.hlt-pane-edit {
  border-right: none;
}

@media (min-width: 1280px) {
  .hlt-panes-split .hlt-pane-edit {
    border-right: 1px solid var(--hlt-border);
  }
}

.hlt-preview {
  background: var(--hlt-background);
}

.hlt-preview-header {
  border-bottom: 1px solid var(--hlt-border);
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--hlt-muted);
}

.hlt-preview-body {
  padding: 1.5rem;
}

.hlt-status {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.hlt-status-error {
  color: var(--hlt-danger);
}

.hlt-modal-scrim {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--hlt-scrim);
}

.hlt-modal {
  width: 100%;
  max-width: 28rem;
  border: 1px solid var(--hlt-border);
  background: var(--hlt-surface);
  padding: 1.5rem;
  box-shadow: var(--hlt-shadow);
}

.hlt-modal-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
}

.hlt-drawing-window {
  position: fixed;
  border: 1px solid var(--hlt-border);
  background: var(--hlt-surface);
  box-shadow: var(--hlt-shadow);
}
```

- [ ] **Step 2: Commit**

```bash
git add styles/hellatuff.css
git commit -m "feat: starter styles CSS"
```

---

## Task 13: AssetSidebar + AssetDeleteDialog components

**Files:**
- Create: `src/editor/AssetSidebar.tsx`
- Create: `src/editor/AssetDeleteDialog.tsx`
- Test: `test/editor/asset-sidebar.test.tsx`

- [ ] **Step 1: Implement `src/editor/AssetSidebar.tsx`**

```tsx
import type { AssetBase } from "../types";

interface AssetSidebarProps<TAsset extends AssetBase> {
  assets: TAsset[];
  theme: "light" | "dark";
  onInsert: (asset: TAsset) => void;
  onRequestDelete: (asset: TAsset) => void;
  deletingAssetId: string | null;
}

export function AssetSidebar<TAsset extends AssetBase>({
  assets,
  theme,
  onInsert,
  onRequestDelete,
  deletingAssetId,
}: AssetSidebarProps<TAsset>) {
  return (
    <aside className="hlt-sidebar">
      <div className="hlt-sidebar-header">
        <p className="hlt-editor-eyebrow">Images</p>
        <p className="hlt-editor-crumbs">
          Drag into the editor or click insert. Save the article to persist image references.
        </p>
      </div>
      <div className="hlt-sidebar-body">
        {assets.length === 0 ? (
          <p className="hlt-editor-crumbs">
            No images yet. Create assets externally and pass them in.
          </p>
        ) : (
          assets.map((asset) => {
            const src = theme === "dark" && asset.darkUrl ? asset.darkUrl : asset.url;
            return (
              <div
                key={asset.id}
                className="hlt-asset-card"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", asset.markdown);
                  event.dataTransfer.effectAllowed = "copy";
                }}
              >
                <div className="hlt-asset-thumb">
                  <img src={src} alt={asset.displayName} loading="lazy" />
                </div>
                <p className="hlt-asset-name">{asset.displayName}</p>
                <p className="hlt-asset-path">{asset.markdown}</p>
                <div className="hlt-asset-actions">
                  <button
                    type="button"
                    className="hlt-toolbar-button"
                    style={{ flex: 1 }}
                    onClick={() => onInsert(asset)}
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    className="hlt-toolbar-button"
                    disabled={deletingAssetId === asset.id}
                    onClick={() => onRequestDelete(asset)}
                  >
                    {deletingAssetId === asset.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Implement `src/editor/AssetDeleteDialog.tsx`**

```tsx
import type { AssetBase } from "../types";

interface AssetDeleteDialogProps<TAsset extends AssetBase> {
  asset: TAsset;
  deleting: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AssetDeleteDialog<TAsset extends AssetBase>({
  asset,
  deleting,
  error,
  onConfirm,
  onCancel,
}: AssetDeleteDialogProps<TAsset>) {
  return (
    <div className="hlt-modal-scrim">
      <div className="hlt-modal">
        <p className="hlt-editor-eyebrow">Delete image</p>
        <h2 className="hlt-editor-title">{asset.displayName}</h2>
        <p className="hlt-editor-crumbs" style={{ marginTop: "1rem" }}>
          This removes the image from storage. Any existing markdown references will stop working.
        </p>
        {error ? <p className="hlt-status hlt-status-error">{error}</p> : null}
        <div className="hlt-modal-actions">
          <button type="button" className="hlt-toolbar-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="hlt-button-primary"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Deleting..." : "Delete image"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write test `test/editor/asset-sidebar.test.tsx`**

```tsx
import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { AssetSidebar } from "../../src/editor/AssetSidebar";
import type { AssetBase } from "../../src/types";

const asset: AssetBase = {
  id: "a1",
  displayName: "Diagram",
  url: "https://example.com/a1.png",
  darkUrl: "https://example.com/a1-dark.png",
  markdown: "![Diagram](a1.png)",
};

describe("AssetSidebar", () => {
  it("renders assets and fires insert/delete callbacks", () => {
    const onInsert = mock(() => {});
    const onDelete = mock(() => {});
    render(
      <AssetSidebar
        assets={[asset]}
        theme="light"
        onInsert={onInsert}
        onRequestDelete={onDelete}
        deletingAssetId={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onInsert.mock.calls.length).toBe(1);
    expect(onDelete.mock.calls.length).toBe(1);
  });

  it("uses darkUrl when theme is dark", () => {
    render(
      <AssetSidebar
        assets={[asset]}
        theme="dark"
        onInsert={() => {}}
        onRequestDelete={() => {}}
        deletingAssetId={null}
      />
    );
    const image = screen.getByAltText("Diagram") as HTMLImageElement;
    expect(image.src).toBe("https://example.com/a1-dark.png");
  });

  it("shows empty state when no assets", () => {
    render(
      <AssetSidebar
        assets={[]}
        theme="light"
        onInsert={() => {}}
        onRequestDelete={() => {}}
        deletingAssetId={null}
      />
    );
    expect(screen.getByText(/No images yet/i)).toBeDefined();
  });

  it("disables delete while deleting that asset", () => {
    render(
      <AssetSidebar
        assets={[asset]}
        theme="light"
        onInsert={() => {}}
        onRequestDelete={() => {}}
        deletingAssetId="a1"
      />
    );
    const button = screen.getByRole("button", { name: /Deleting/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `bun test test/editor/asset-sidebar.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/editor/AssetSidebar.tsx src/editor/AssetDeleteDialog.tsx test/editor/asset-sidebar.test.tsx
git commit -m "feat: asset sidebar and delete dialog"
```

---

## Task 14: Editor component

This is the composition task — pulls together types, toolbar, sidebar, vim state, hooks, and modes.

**Files:**
- Create: `src/editor/Editor.tsx`
- Test: `test/editor/editor.test.tsx`

- [ ] **Step 1: Implement `src/editor/Editor.tsx`**

```tsx
"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { titleOnlyParser } from "../draft/title-only";
import { useAutoTheme } from "../hooks/use-auto-theme";
import { useDirty } from "../hooks/use-dirty";
import { useVimStorage } from "../hooks/use-vim-storage";
import type {
  AssetBase,
  EditorMode,
  EditorProps,
  SaveResult,
  ToolbarAction,
  VimMode,
} from "../types";
import { applyNormalKey, type NormalState } from "../vim/state";
import { clamp, normalizeNormalCursor } from "../vim/motions";
import { AssetDeleteDialog } from "./AssetDeleteDialog";
import { AssetSidebar } from "./AssetSidebar";
import { DEFAULT_TOOLBAR } from "./defaults";
import { Toolbar } from "./Toolbar";

export function Editor<TAsset extends AssetBase = AssetBase>(
  props: EditorProps<TAsset>
) {
  const {
    articlePath,
    articleName,
    initialRaw,
    initialVersion,
    onChange,
    onSave,
    onDirtyChange,
    assets: externalAssets,
    onAssetDelete,
    renderer,
    imageBaseUrl: _imageBaseUrl,
    parseDraft = titleOnlyParser,
    defaultMode = "split",
    toolbar,
    vimEnabled: vimEnabledProp,
    className,
    theme: themeOverride,
    header,
    footer,
  } = props;

  const [raw, setRaw] = useState(initialRaw);
  const [savedRaw, setSavedRaw] = useState(initialRaw);
  const [version, setVersion] = useState(initialVersion);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<EditorMode>(defaultMode);
  const [assets, setAssets] = useState<TAsset[]>(externalAssets ?? []);
  const [assetToDelete, setAssetToDelete] = useState<TAsset | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [assetError, setAssetError] = useState("");
  const [storedVim, setStoredVim] = useVimStorage();
  const vimEnabled = vimEnabledProp ?? storedVim;
  const [vimMode, setVimMode] = useState<VimMode>(vimEnabled ? "normal" : "insert");
  const [pendingVimCommand, setPendingVimCommand] = useState<"d" | "g" | null>(
    null
  );
  const [preferredColumn, setPreferredColumn] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = useAutoTheme(themeOverride);
  const dirty = useDirty(raw, savedRaw, onDirtyChange);
  const toolbarActions = useMemo<ToolbarAction[] | false>(
    () => (toolbar === undefined ? DEFAULT_TOOLBAR : toolbar),
    [toolbar]
  );
  const parsed = useMemo(
    () => parseDraft(raw, articleName ?? articlePath?.at(-1) ?? "Untitled"),
    [raw, articleName, articlePath, parseDraft]
  );

  useEffect(() => {
    if (externalAssets) {
      setAssets(externalAssets);
    }
  }, [externalAssets]);

  useEffect(() => {
    onChange?.(raw);
  }, [raw, onChange]);

  useEffect(() => {
    if (vimEnabledProp !== undefined) {
      setStoredVim(vimEnabledProp);
    }
  }, [vimEnabledProp, setStoredVim]);

  const setCursor = useCallback((index: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(index, index);
  }, []);

  const applyEditorState = useCallback(
    (nextRaw: string, nextIndex: number, nextMode?: VimMode) => {
      setRaw(nextRaw);
      if (nextMode) setVimMode(nextMode);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(nextIndex, nextIndex);
      });
    },
    []
  );

  const insertSnippet = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = raw.slice(start, end) || action.placeholder || "";
      const next =
        raw.slice(0, start) +
        action.before +
        selected +
        (action.after ?? "") +
        raw.slice(end);
      setRaw(next);
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorStart = start + action.before.length;
        const cursorEnd = cursorStart + selected.length;
        textarea.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [raw]
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        setRaw((current) => `${current}${text}`);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = raw.slice(0, start) + text + raw.slice(end);
      const cursor = start + text.length;
      applyEditorState(next, cursor);
    },
    [raw, applyEditorState]
  );

  const handleAssetInsert = useCallback(
    (asset: TAsset) => {
      insertAtCursor(`\n${asset.markdown}\n`);
    },
    [insertAtCursor]
  );

  const confirmAssetDelete = useCallback(() => {
    if (!assetToDelete || !onAssetDelete) return;
    setAssetError("");
    setDeletingAssetId(assetToDelete.id);
    startTransition(async () => {
      try {
        await onAssetDelete(assetToDelete);
        setAssets((current) => current.filter((a) => a.id !== assetToDelete.id));
        setAssetToDelete(null);
      } catch (err) {
        setAssetError(err instanceof Error ? err.message : "Unable to delete.");
      } finally {
        setDeletingAssetId(null);
      }
    });
  }, [assetToDelete, onAssetDelete]);

  const performSave = useCallback(async () => {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result: SaveResult = await onSave(raw, version);
      setSavedRaw(raw);
      if (result.version !== undefined) setVersion(result.version);
      if (result.message) setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setPending(false);
    }
  }, [onSave, raw, version]);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void performSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [performSave]);

  const toggleVim = useCallback(() => {
    const next = !vimEnabled;
    if (vimEnabledProp === undefined) {
      setStoredVim(next);
    }
    setPendingVimCommand(null);
    setPreferredColumn(null);
    const textarea = textareaRef.current;
    if (!textarea) {
      setVimMode(next ? "normal" : "insert");
      return;
    }
    if (next) {
      setVimMode("normal");
      const index = normalizeNormalCursor(raw, textarea.selectionStart);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(index, index);
      });
    } else {
      setVimMode("insert");
    }
  }, [vimEnabled, vimEnabledProp, raw, setStoredVim]);

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!vimEnabled) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (vimMode === "insert") {
        if (event.key === "Escape") {
          event.preventDefault();
          setPendingVimCommand(null);
          setPreferredColumn(null);
          setVimMode("normal");
          const index = normalizeNormalCursor(
            raw,
            event.currentTarget.selectionStart - 1
          );
          setCursor(index);
        }
        return;
      }

      event.preventDefault();
      const state: NormalState = {
        text: raw,
        cursor: normalizeNormalCursor(raw, event.currentTarget.selectionStart),
        pendingCommand: pendingVimCommand,
        preferredColumn,
      };
      const result = applyNormalKey(state, event.key);
      setPendingVimCommand(result.pendingCommand);
      setPreferredColumn(result.preferredColumn);
      if (result.text !== raw) {
        applyEditorState(
          result.text,
          result.cursor,
          result.nextMode ?? undefined
        );
      } else {
        if (result.nextMode === "insert") setVimMode("insert");
        setCursor(clamp(result.cursor, 0, result.text.length));
      }
    },
    [vimEnabled, vimMode, raw, pendingVimCommand, preferredColumn, applyEditorState, setCursor]
  );

  const articleLabel = articlePath?.join(" / ") ?? "";
  const fallbackTitle =
    articleName ?? articlePath?.at(-1) ?? "Untitled";

  return (
    <div className={["hlt-editor", className].filter(Boolean).join(" ")}>
      <div className="hlt-editor-header">
        <div className="hlt-editor-header-row">
          <div>
            {header ?? (
              <>
                <p className="hlt-editor-eyebrow">Article Editor</p>
                <h1 className="hlt-editor-title">
                  {parsed.title || fallbackTitle}
                </h1>
                {articleLabel ? (
                  <p className="hlt-editor-crumbs">{articleLabel}</p>
                ) : null}
              </>
            )}
          </div>
          <div className="hlt-toolbar">
            <button
              type="button"
              className={`hlt-toolbar-button${vimEnabled ? " hlt-toolbar-button-active" : ""}`}
              onClick={toggleVim}
            >
              Vim {vimEnabled ? "on" : "off"}
            </button>
            <div className="hlt-mode-group">
              {(["edit", "preview", "split"] as EditorMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className="hlt-mode-button"
                  aria-pressed={mode === option}
                  onClick={() => setMode(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="hlt-button-primary"
              disabled={pending}
              onClick={performSave}
            >
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {toolbarActions !== false ? (
          <div style={{ marginTop: "1rem" }}>
            <Toolbar
              actions={toolbarActions}
              onAction={insertSnippet}
              trailing={
                vimEnabled
                  ? `Vim ${vimMode}${pendingVimCommand ? ` · ${pendingVimCommand}` : ""}`
                  : "Cmd/Ctrl+S to save"
              }
            />
          </div>
        ) : null}

        {error ? (
          <p className="hlt-status hlt-status-error">{error}</p>
        ) : null}
        {message && !error ? <p className="hlt-status">{message}</p> : null}
        {dirty && !pending && !error ? (
          <p className="hlt-status hlt-editor-crumbs">Unsaved changes.</p>
        ) : null}
      </div>

      <div className="hlt-grid">
        {externalAssets !== undefined ? (
          <AssetSidebar
            assets={assets}
            theme={theme}
            onInsert={handleAssetInsert}
            onRequestDelete={(asset) => {
              setAssetError("");
              setAssetToDelete(asset);
            }}
            deletingAssetId={deletingAssetId}
          />
        ) : (
          <div />
        )}
        <div
          className={[
            "hlt-editor-panes",
            mode === "split" ? "hlt-panes-split" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {mode !== "preview" ? (
            <div className="hlt-pane-edit">
              <textarea
                ref={textareaRef}
                className="hlt-textarea"
                value={raw}
                spellCheck={false}
                onChange={(event) => setRaw(event.target.value)}
                onKeyDown={handleTextareaKeyDown}
              />
            </div>
          ) : null}
          {mode !== "edit" ? (
            <div className="hlt-preview">
              <div className="hlt-preview-header">Live preview</div>
              <div className="hlt-preview-body">
                {renderer ? renderer(parsed.content) : (
                  <p className="hlt-editor-crumbs">
                    No renderer provided. Pass a `renderer` prop to see the live preview.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {footer}

      {assetToDelete ? (
        <AssetDeleteDialog
          asset={assetToDelete}
          deleting={deletingAssetId === assetToDelete.id}
          error={assetError}
          onConfirm={confirmAssetDelete}
          onCancel={() => {
            setAssetError("");
            setAssetToDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function useEditorAssetCreated<TAsset extends AssetBase>(
  setAssets: React.Dispatch<React.SetStateAction<TAsset[]>>
) {
  return useCallback(
    (asset: TAsset) => setAssets((current) => [asset, ...current]),
    [setAssets]
  );
}
```

- [ ] **Step 2: Write test `test/editor/editor.test.tsx`**

```tsx
import { describe, expect, it, mock } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Editor } from "../../src/editor/Editor";

function mockSave(result: { version?: string; message?: string } = {}) {
  return mock(async () => result);
}

describe("Editor", () => {
  it("renders initial raw, parsed title, and save button", () => {
    render(
      <Editor
        initialRaw="# Hello\n\nBody"
        articlePath={["docs"]}
        onSave={mockSave()}
      />
    );
    expect(screen.getByRole("heading", { name: "Hello" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });

  it("invokes onSave on Cmd+S and updates version", async () => {
    const onSave = mockSave({ version: "v2", message: "saved" });
    render(
      <Editor
        initialRaw="# Hi"
        initialVersion="v1"
        onSave={onSave}
      />
    );
    await act(async () => {
      fireEvent.keyDown(window, { key: "s", metaKey: true });
      await Promise.resolve();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][1]).toBe("v1");
    // Wait for async state flush
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("saved")).toBeDefined();
  });

  it("displays error on save rejection", async () => {
    const onSave = mock(async () => {
      throw new Error("Version conflict");
    });
    render(<Editor initialRaw="x" onSave={onSave} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Version conflict")).toBeDefined();
  });

  it("toggles between edit, preview, split modes", () => {
    render(
      <Editor
        initialRaw="# Hi\n\nBody"
        onSave={mockSave()}
        renderer={(content) => <div data-testid="preview">{content}</div>}
      />
    );
    // Default split: both textarea and preview
    expect(screen.getByTestId("preview").textContent).toContain("Body");
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    expect(screen.queryByTestId("preview")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "preview" }));
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("inserts toolbar snippet at cursor with placeholder", async () => {
    render(<Editor initialRaw="" onSave={mockSave()} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(textarea.value).toContain("**bold text**");
  });

  it("fires onDirtyChange when raw diverges from baseline", async () => {
    const onDirtyChange = mock(() => {});
    render(
      <Editor
        initialRaw="a"
        onSave={mockSave()}
        onDirtyChange={onDirtyChange}
      />
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "ab" } });
    await act(async () => {
      await Promise.resolve();
    });
    expect(onDirtyChange.mock.calls.some(([d]) => d === true)).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `bun test test/editor/editor.test.tsx`
Expected: all tests PASS. If any flaky async tests fail, add another `await Promise.resolve()` tick inside `act`.

- [ ] **Step 4: Commit**

```bash
git add src/editor/Editor.tsx test/editor/editor.test.tsx
git commit -m "feat: Editor component"
```

---

## Task 15: Core public index + build script

**Files:**
- Modify: `src/index.ts` (replace placeholder with real exports)
- Create: `build.ts`

- [ ] **Step 1: Replace `src/index.ts`**

```ts
export type {
  AssetBase,
  DraftParser,
  EditorMode,
  EditorProps,
  ParsedDraft,
  SaveResult,
  ToolbarAction,
  VimMode,
} from "./types";

export { Editor, useEditorAssetCreated } from "./editor/Editor";
export { Toolbar } from "./editor/Toolbar";
export { AssetSidebar } from "./editor/AssetSidebar";
export { AssetDeleteDialog } from "./editor/AssetDeleteDialog";
export { DEFAULT_TOOLBAR } from "./editor/defaults";

export { titleOnlyParser } from "./draft/title-only";
export {
  createFrontmatterParser,
  type FrontmatterParserOptions,
} from "./draft/frontmatter";

export { useDirty } from "./hooks/use-dirty";
export { useVimStorage, VIM_STORAGE_KEY } from "./hooks/use-vim-storage";
export { useAutoTheme, type Theme } from "./hooks/use-auto-theme";

export {
  applyNormalKey,
  type NormalState,
  type NormalResult,
  type PendingCommand,
} from "./vim/state";
```

- [ ] **Step 2: Create `build.ts`**

```ts
import { $ } from "bun";
import { mkdir, cp } from "node:fs/promises";

const entries = [
  { name: "index", path: "./src/index.ts" },
  { name: "renderer", path: "./src/renderer/index.ts" },
  { name: "drawing", path: "./src/drawing/index.ts" },
];

const externals = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react-markdown",
  "remark-gfm",
  "remark-math",
  "rehype-katex",
  "rehype-highlight",
  "rehype-slug",
  "katex",
];

await mkdir("./dist", { recursive: true });

for (const entry of entries) {
  const result = await Bun.build({
    entrypoints: [entry.path],
    outdir: "./dist",
    naming: `${entry.name}.js`,
    target: "browser",
    format: "esm",
    external: externals,
    minify: false,
    splitting: false,
    sourcemap: "linked",
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
}

// Emit .d.ts files
await $`tsc -p tsconfig.build.json`;

// Copy CSS
await cp("./styles/hellatuff.css", "./dist/hellatuff.css");

console.log("✓ build complete");
```

- [ ] **Step 3: Run the build**

Run: `bun run build`
Expected: `dist/index.js`, `dist/renderer.js` (may be empty or minimal until Task 17), `dist/drawing.js` (may be empty until Task 20), `dist/hellatuff.css`, and `.d.ts` siblings created. Build may fail on missing renderer/drawing entrypoints — if so, create stub files first:

If build fails because `./src/renderer/index.ts` or `./src/drawing/index.ts` do not exist:

Create `src/renderer/index.ts`:
```ts
export {};
```

Create `src/drawing/index.ts`:
```ts
export {};
```

Then re-run `bun run build`. These stubs will be replaced in Tasks 17 and 20.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts src/renderer/index.ts src/drawing/index.ts build.ts
git commit -m "feat: core index + build script"
```

---

## Task 16: Collapsible heading plugin

**Files:**
- Create: `src/renderer/collapsible.tsx`
- Test: `test/renderer/collapsible.test.tsx`

This mirrors `tenet/archive/lib/article-sections.ts` + the collapsible `<details>` UI from `tenet/archive/app/components/collapsible-markdown.tsx`, but takes a renderer prop instead of importing a fixed one.

- [ ] **Step 1: Implement `src/renderer/collapsible.tsx`**

```tsx
import type { ReactNode } from "react";

export interface ArticleSection {
  id: string;
  title: string;
  body: string;
}

function trimBlankEdges(lines: string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]?.trim() === "") start += 1;
  while (end > start && lines[end - 1]?.trim() === "") end -= 1;
  return lines.slice(start, end).join("\n");
}

function slugBase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function uniqueSlug(text: string, counts: Map<string, number>): string {
  const base = slugBase(text) || "section";
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

export function parseArticleSections(content: string): {
  intro: string;
  sections: ArticleSection[];
} {
  const introLines: string[] = [];
  const sectionLines = new Map<string, string[]>();
  const sections: ArticleSection[] = [];
  const slugCounts = new Map<string, number>();

  let current: ArticleSection | null = null;

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      const title = match[1].trim();
      current = { id: uniqueSlug(title, slugCounts), title, body: "" };
      sections.push(current);
      sectionLines.set(current.id, []);
      continue;
    }
    if (!current) {
      introLines.push(line);
      continue;
    }
    sectionLines.get(current.id)?.push(line);
  }

  for (const section of sections) {
    section.body = trimBlankEdges(sectionLines.get(section.id) ?? []);
  }

  return {
    intro: trimBlankEdges(introLines),
    sections,
  };
}

interface CollapsibleProps {
  content: string;
  renderPart: (content: string) => ReactNode;
}

export function CollapsibleSections({ content, renderPart }: CollapsibleProps) {
  const { intro, sections } = parseArticleSections(content);

  if (sections.length === 0) {
    return <>{renderPart(content)}</>;
  }

  return (
    <div className="hlt-collapsible">
      {intro ? renderPart(intro) : null}
      {sections.map((section) => (
        <details key={section.id} open className="hlt-collapsible-section">
          <summary>
            <span aria-hidden>▶</span>
            <h2 id={section.id}>{section.title}</h2>
          </summary>
          <div className="hlt-collapsible-body">
            {section.body ? renderPart(section.body) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write test `test/renderer/collapsible.test.tsx`**

```tsx
import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  CollapsibleSections,
  parseArticleSections,
} from "../../src/renderer/collapsible";

describe("parseArticleSections", () => {
  it("splits H2 blocks with unique slugs", () => {
    const content = "intro text\n\n## First\nA\n## First\nB";
    const result = parseArticleSections(content);
    expect(result.intro).toBe("intro text");
    expect(result.sections.map((s) => s.id)).toEqual(["first", "first-2"]);
    expect(result.sections[0].body).toBe("A");
    expect(result.sections[1].body).toBe("B");
  });
});

describe("CollapsibleSections", () => {
  it("renders each section with provided renderer", () => {
    const renderPart = (content: string) => <p>{content}</p>;
    render(
      <CollapsibleSections
        content={"intro\n\n## Alpha\nbody"}
        renderPart={renderPart}
      />
    );
    expect(screen.getByText("intro")).toBeDefined();
    expect(screen.getByText("Alpha")).toBeDefined();
    expect(screen.getByText("body")).toBeDefined();
  });

  it("falls back to whole-content render when no H2s", () => {
    render(
      <CollapsibleSections
        content={"just text"}
        renderPart={(c) => <span data-testid="single">{c}</span>}
      />
    );
    expect(screen.getByTestId("single").textContent).toBe("just text");
  });
});
```

- [ ] **Step 3: Run tests**

Run: `bun test test/renderer/collapsible.test.tsx`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/collapsible.tsx test/renderer/collapsible.test.tsx
git commit -m "feat: collapsible heading renderer helper"
```

---

## Task 17: createMarkdownRenderer

**Files:**
- Modify: `src/renderer/index.ts` (replace stub)
- Add runtime deps: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight`, `rehype-slug`, `katex` (as dev deps only — they're peer-optional)

- [ ] **Step 1: Install renderer-side deps as devDependencies**

Run:
```bash
bun add -d react-markdown remark-gfm remark-math rehype-katex rehype-highlight rehype-slug katex
```

Expected: these land in `devDependencies` (they stay optional peers for consumers; we need them installed for our own build/test).

- [ ] **Step 2: Replace `src/renderer/index.ts`**

```tsx
import { createElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { CollapsibleSections } from "./collapsible";

export interface RendererOptions {
  imageBaseUrl?: string;
  collapsibleHeadings?: boolean;
  skipHtml?: boolean;
}

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

function isResolvedImageSrc(src: string): boolean {
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("/")
  );
}

function buildComponents(imageBaseUrl: string | undefined): Components {
  return {
    a: ({ children, href }) => {
      const value = typeof href === "string" ? href : "";
      if (!value) return <a>{children}</a>;
      const external = isExternalHref(value);
      return (
        <a
          href={value}
          className="hlt-md-link"
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt }) => {
      const srcStr = typeof src === "string" ? src : "";
      const resolved =
        srcStr && imageBaseUrl && !isResolvedImageSrc(srcStr)
          ? `${imageBaseUrl.replace(/\/$/, "")}/${srcStr.replace(/^\.\//, "")}`
          : srcStr;
      return (
        <img
          src={resolved}
          alt={alt ?? ""}
          loading="lazy"
          className="hlt-md-image"
        />
      );
    },
    code: ({ children, className, node, ...props }) => {
      const text = String(children).replace(/\n$/, "");
      const isMultiline =
        node?.position?.start.line !== undefined &&
        node.position.end.line !== undefined &&
        node.position.start.line !== node.position.end.line;
      const isBlock = className?.includes("language-") || isMultiline;
      if (isBlock) {
        return createElement(
          "code",
          { ...props, className: `hlt-md-code-block ${className ?? ""}` },
          text
        );
      }
      return createElement(
        "code",
        { ...props, className: "hlt-md-code-inline" },
        children
      );
    },
  };
}

export function createMarkdownRenderer(
  options: RendererOptions = {}
): (content: string) => ReactNode {
  const {
    imageBaseUrl,
    collapsibleHeadings = false,
    skipHtml = true,
  } = options;
  const components = buildComponents(imageBaseUrl);

  const renderPart = (content: string) => (
    <div className="hlt-md">
      <ReactMarkdown
        skipHtml={skipHtml}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  if (!collapsibleHeadings) {
    return renderPart;
  }

  return (content: string) => (
    <CollapsibleSections content={content} renderPart={renderPart} />
  );
}

export const markdownRenderer = createMarkdownRenderer();

export { CollapsibleSections, parseArticleSections } from "./collapsible";
export type { ArticleSection } from "./collapsible";
```

- [ ] **Step 3: Verify typecheck and build**

Run: `bun run typecheck && bun run build`
Expected: no errors, `dist/renderer.js` rebuilt.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/index.ts package.json bun.lock
git commit -m "feat: default markdown renderer"
```

---

## Task 18: Drawing canvas utilities

**Files:**
- Create: `src/drawing/canvas.ts`
- Test: `test/drawing/canvas.test.ts`

This ports the color-palette swap logic from `tenet/archive/app/operator/OperatorDrawingWindow.tsx` (lines defining `rgbToHsl`, `hslToRgb`, brush/eraser logic, etc.) into pure functions we can test.

- [ ] **Step 1: Implement `src/drawing/canvas.ts`**

```ts
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function rgbToHsl(red: number, green: number, blue: number): Hsl {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, l, s: 0 };
  }

  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h = 0;
  if (max === r) {
    h = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }
  h *= 60;

  return { h, l, s };
}

function hueToRgb(p: number, q: number, t: number): number {
  let v = t;
  if (v < 0) v += 1;
  if (v > 1) v -= 1;
  if (v < 1 / 6) return p + (q - p) * 6 * v;
  if (v < 1 / 2) return q;
  if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = (h % 360) / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
}

/**
 * Inverts lightness while preserving hue/saturation. Used to generate the
 * dark-theme variant of a drawing exported in light theme.
 */
export function invertLightness(rgb: Rgb): Rgb {
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hslToRgb(h, s, 1 - l);
}
```

- [ ] **Step 2: Write test `test/drawing/canvas.test.ts`**

```ts
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
```

- [ ] **Step 3: Run tests**

Run: `bun test test/drawing/canvas.test.ts`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/drawing/canvas.ts test/drawing/canvas.test.ts
git commit -m "feat: drawing canvas color utilities"
```

---

## Task 19: DrawingWindow component

**Files:**
- Create: `src/drawing/DrawingWindow.tsx`

This task ports the bulk of `tenet/archive/app/operator/OperatorDrawingWindow.tsx` (1324 LOC) with surgical API changes. The executing agent MUST read the source file and replicate behavior — this task describes the deltas, not the whole file.

**Surgical changes to apply during the port:**

1. **Remove imports from tenet-only paths:**
   - Remove `import type { OperatorImageAsset } from "@/lib/operator-content";`
   - Remove `import { useTheme } from "../components/theme-provider";`
   - Remove `import { saveDrawingAction } from "./content-actions";`

2. **Replace `useTheme()` call** with `useAutoTheme(undefined)` from `../hooks/use-auto-theme`. Import: `import { useAutoTheme } from "../hooks/use-auto-theme";`

3. **Replace the save flow.** In the original, the component calls `saveDrawingAction(...)` which takes an `articlePath`. In the new version:
   - Remove the `articlePath` prop.
   - Remove `saveDrawingAction` imports.
   - Replace the save-handler that currently calls `saveDrawingAction` with a call to a new prop: `onSave(payload: DrawingPayload) => Promise<void>`. The payload is `{ lightDataUrl, darkDataUrl, name }`.
   - Remove any `OperatorImageAsset` references from the internal types; the component no longer returns or deals with the saved asset.

4. **Add new prop type** at top of file (replacing the old one):

```tsx
export interface DrawingPayload {
  lightDataUrl: string;
  darkDataUrl: string;
  name: string;
}

export interface DrawingWindowProps {
  active?: boolean;
  disableSave?: boolean;
  initialPosition?: { x: number; y: number };
  onClose: () => void;
  onFocus?: () => void;
  onSave: (payload: DrawingPayload) => Promise<void>;
  onSaveStart?: () => void;
  onSaveEnd?: () => void;
  windowId?: number;
  zIndex?: number;
}

export function DrawingWindow(props: DrawingWindowProps) {
  // … port remainder from tenet source …
}
```

5. **Tailwind → hlt- classes.** Every Tailwind class in the source (e.g., `border-border`, `bg-surface`, `text-foreground`) must be rewritten using the `hlt-*` class system from `styles/hellatuff.css`, or replaced with inline styles using the `--hlt-*` tokens. For classes that don't have a direct `hlt-*` equivalent (buttons, spacing), use inline `style={{ ... }}` with CSS tokens. The window root element uses `className="hlt-drawing-window"`.

6. **The `"use client"` directive stays.**

7. **The `handleSave` function** currently constructs a payload and calls the server action. Rewrite to:

```tsx
async function handleSave() {
  if (isSaving || disableSave) return;
  setIsSaving(true);
  onSaveStart?.();
  try {
    const { lightDataUrl, darkDataUrl, name } = await exportBothVariants();
    await onSave({ lightDataUrl, darkDataUrl, name });
  } catch (error) {
    console.error("drawing save failed", error);
    setError(error instanceof Error ? error.message : "Unable to save drawing.");
  } finally {
    setIsSaving(false);
    onSaveEnd?.();
  }
}
```

(The `exportBothVariants` helper is the existing routine that renders the canvas once with the light palette and once with the dark palette — keep its implementation as-is from the source.)

- [ ] **Step 1: Read the source**

Read `/Users/huiyunlee/Workspace/github.com/justin06lee/tenet/archive/app/operator/OperatorDrawingWindow.tsx` in full (1324 lines).

- [ ] **Step 2: Create `src/drawing/DrawingWindow.tsx`**

Port the file, applying each surgical change above. Preserve all drawing/canvas logic, history, zoom, tool selection, and export-variant generation. Preserve the light/dark canvas palette swap logic — **but replace the duplicated `rgbToHsl`/`hslToRgb` utilities** at the top of the file with imports from `./canvas`:

```tsx
import { clamp, hslToRgb, invertLightness, rgbToHsl } from "./canvas";
```

- [ ] **Step 3: Verify typecheck + build**

Run: `bun run typecheck && bun run build`
Expected: no errors, `dist/drawing.js` builds.

- [ ] **Step 4: Smoke-test rendering**

No automated test for this task — the component is heavily visual/interactive. Smoke-test by building:

Run: `bun run build`
Expected: builds without errors.

- [ ] **Step 5: Commit**

```bash
git add src/drawing/DrawingWindow.tsx
git commit -m "feat: DrawingWindow ported from tenet with inverted save API"
```

---

## Task 20: DrawingManager + drawing index

**Files:**
- Create: `src/drawing/DrawingManager.tsx`
- Modify: `src/drawing/index.ts`
- Test: `test/drawing/manager.test.tsx`

- [ ] **Step 1: Implement `src/drawing/DrawingManager.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssetBase } from "../types";
import {
  DrawingWindow,
  type DrawingPayload,
} from "./DrawingWindow";

interface DrawingWindowState {
  id: number;
  position: { x: number; y: number };
}

function getNextDrawingWindowId(windows: DrawingWindowState[]): number {
  const ids = new Set(windows.map((w) => w.id));
  let next = 1;
  while (ids.has(next)) next += 1;
  return next;
}

export interface DrawingManagerProps<TAsset extends AssetBase> {
  onSave: (payload: DrawingPayload) => Promise<TAsset>;
  onAssetCreated: (asset: TAsset) => void;
  triggerLabel?: string;
}

export function DrawingManager<TAsset extends AssetBase>({
  onSave,
  onAssetCreated,
  triggerLabel = "New drawing window",
}: DrawingManagerProps<TAsset>) {
  const [windows, setWindows] = useState<DrawingWindowState[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-drawing-window="true"]')
      ) {
        return;
      }
      setActiveId(null);
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, []);

  const openWindow = useCallback(() => {
    setWindows((current) => {
      const id = getNextDrawingWindowId(current);
      const offset = current.length * 28;
      setActiveId(id);
      return [
        ...current,
        { id, position: { x: 72 + offset, y: 120 + offset } },
      ];
    });
  }, []);

  const focusWindow = useCallback((id: number) => {
    setActiveId(id);
    setWindows((current) => {
      const found = current.find((w) => w.id === id);
      if (!found) return current;
      return [...current.filter((w) => w.id !== id), found];
    });
  }, []);

  const closeWindow = useCallback((id: number) => {
    setWindows((current) => current.filter((w) => w.id !== id));
    setActiveId((current) => (current === id ? null : current));
    setSavingId((current) => (current === id ? null : current));
  }, []);

  const handleWindowSave = useCallback(
    async (id: number, payload: DrawingPayload) => {
      const asset = await onSave(payload);
      onAssetCreated(asset);
    },
    [onSave, onAssetCreated]
  );

  return (
    <>
      <button
        type="button"
        className="hlt-toolbar-button"
        onClick={openWindow}
      >
        {triggerLabel}
      </button>
      {windows.map((state, index) => (
        <DrawingWindow
          key={state.id}
          windowId={state.id}
          active={state.id === activeId}
          zIndex={80 + index}
          initialPosition={state.position}
          disableSave={savingId !== null && savingId !== state.id}
          onFocus={() => focusWindow(state.id)}
          onClose={() => closeWindow(state.id)}
          onSaveStart={() => setSavingId(state.id)}
          onSaveEnd={() => setSavingId(null)}
          onSave={(payload) => handleWindowSave(state.id, payload)}
        />
      ))}
    </>
  );
}
```

- [ ] **Step 2: Replace `src/drawing/index.ts`**

```ts
export {
  DrawingWindow,
  type DrawingPayload,
  type DrawingWindowProps,
} from "./DrawingWindow";
export {
  DrawingManager,
  type DrawingManagerProps,
} from "./DrawingManager";
export { invertLightness, rgbToHsl, hslToRgb } from "./canvas";
```

- [ ] **Step 3: Write `test/drawing/manager.test.tsx`**

```tsx
import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { DrawingManager } from "../../src/drawing/DrawingManager";

describe("DrawingManager", () => {
  it("opens a new window on trigger click", () => {
    const onSave = mock(async () => ({
      id: "a",
      displayName: "d",
      url: "/x",
      markdown: "![d](/x)",
    }));
    const onAssetCreated = mock(() => {});
    render(
      <DrawingManager onSave={onSave} onAssetCreated={onAssetCreated} />
    );
    fireEvent.click(screen.getByRole("button", { name: "New drawing window" }));
    // DrawingWindow root marks itself with data-drawing-window; we just check it's present.
    expect(document.querySelector('[data-drawing-window="true"]')).not.toBeNull();
  });
});
```

Note: the smoke test depends on `DrawingWindow` rendering `data-drawing-window="true"` on its root — that attribute is present in the tenet source and must be preserved during the port.

- [ ] **Step 4: Run test + build**

Run: `bun test test/drawing/manager.test.tsx && bun run build`
Expected: PASS + dist rebuilt.

- [ ] **Step 5: Commit**

```bash
git add src/drawing/DrawingManager.tsx src/drawing/index.ts test/drawing/manager.test.tsx
git commit -m "feat: DrawingManager + drawing subpath exports"
```

---

## Task 21: Minimal example app

**Files:**
- Create: `examples/minimal/package.json`
- Create: `examples/minimal/tsconfig.json`
- Create: `examples/minimal/next.config.mjs`
- Create: `examples/minimal/app/layout.tsx`
- Create: `examples/minimal/app/page.tsx`
- Create: `examples/minimal/app/globals.css`

The minimal example uses only core + starter styles, no renderer, no drawing. Saves to in-memory state.

- [ ] **Step 1: Create `examples/minimal/package.json`**

```json
{
  "name": "hellatuff-example-minimal",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@justin06lee/hellatuff": "file:../..",
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `examples/minimal/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `examples/minimal/next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["@justin06lee/hellatuff"],
};
export default config;
```

- [ ] **Step 4: Create `examples/minimal/app/globals.css`**

```css
@import "@justin06lee/hellatuff/styles.css";

body {
  margin: 0;
  font-family: var(--hlt-font-sans);
  background: var(--hlt-background);
  color: var(--hlt-foreground);
}

main {
  max-width: 72rem;
  margin: 2rem auto;
  padding: 0 1rem;
}
```

- [ ] **Step 5: Create `examples/minimal/app/layout.tsx`**

```tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Create `examples/minimal/app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Editor } from "@justin06lee/hellatuff";

export default function Page() {
  const [saved, setSaved] = useState<string>("");

  return (
    <main>
      <Editor
        articlePath={["docs", "hello"]}
        initialRaw={"# Hello\n\nWrite something."}
        onSave={async (raw) => {
          setSaved(raw);
          return { version: String(Date.now()), message: "Saved (in memory)" };
        }}
      />
      <pre style={{ marginTop: "2rem", whiteSpace: "pre-wrap" }}>{saved}</pre>
    </main>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add examples/minimal
git commit -m "docs: minimal example app"
```

---

## Task 22: Full example app

**Files:**
- Create: `examples/full/package.json`
- Create: `examples/full/tsconfig.json`
- Create: `examples/full/next.config.mjs`
- Create: `examples/full/app/layout.tsx`
- Create: `examples/full/app/globals.css`
- Create: `examples/full/app/page.tsx`

Full example uses renderer, drawing, and assets. Persists to in-memory state (no real backend).

- [ ] **Step 1: Create `examples/full/package.json`**

```json
{
  "name": "hellatuff-example-full",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@justin06lee/hellatuff": "file:../..",
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "remark-math": "^6.0.0",
    "rehype-katex": "^7.0.0",
    "rehype-highlight": "^7.0.0",
    "rehype-slug": "^6.0.0",
    "katex": "^0.16.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `examples/full/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `examples/full/next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["@justin06lee/hellatuff"],
};
export default config;
```

- [ ] **Step 4: Create `examples/full/app/globals.css`**

```css
@import "@justin06lee/hellatuff/styles.css";
@import "katex/dist/katex.min.css";

body {
  margin: 0;
  font-family: var(--hlt-font-sans);
  background: var(--hlt-background);
  color: var(--hlt-foreground);
}

main {
  max-width: 88rem;
  margin: 1rem auto;
  padding: 0 1rem;
}
```

- [ ] **Step 5: Create `examples/full/app/layout.tsx`**

```tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Create `examples/full/app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Editor, type AssetBase, createFrontmatterParser } from "@justin06lee/hellatuff";
import { markdownRenderer } from "@justin06lee/hellatuff/renderer";
import { DrawingManager } from "@justin06lee/hellatuff/drawing";

const csv = (raw: string): string[] =>
  raw.split(",").map((item) => item.trim()).filter(Boolean);

const parser = createFrontmatterParser({
  keys: ["prerequisites"],
  normalize: { prerequisites: csv },
});

const INITIAL_RAW = `# Welcome

prerequisites: math/derivatives, math/integrals

## Intro

Some body copy.

## Math example

$$
e^{i\\pi} + 1 = 0
$$

\`\`\`ts
const x = 1;
\`\`\`
`;

export default function Page() {
  const [raw, setRaw] = useState(INITIAL_RAW);
  const [assets, setAssets] = useState<AssetBase[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <main data-theme={theme}>
      <div style={{ margin: "1rem 0" }}>
        <button
          type="button"
          onClick={() => {
            const next = theme === "light" ? "dark" : "light";
            setTheme(next);
            document.documentElement.dataset.theme = next;
          }}
          className="hlt-toolbar-button"
        >
          Toggle theme ({theme})
        </button>
      </div>
      <Editor
        articlePath={["example", "full"]}
        initialRaw={raw}
        initialVersion="v0"
        assets={assets}
        renderer={markdownRenderer}
        parseDraft={parser}
        onChange={setRaw}
        onSave={async (next) => ({
          version: String(Date.now()),
          message: "Saved (in memory)",
        })}
        onAssetDelete={async (asset) => {
          setAssets((cur) => cur.filter((a) => a.id !== asset.id));
        }}
        footer={
          <DrawingManager
            onSave={async (payload) => {
              const asset: AssetBase = {
                id: `drawing-${Date.now()}`,
                displayName: payload.name || "Drawing",
                url: payload.lightDataUrl,
                darkUrl: payload.darkDataUrl,
                markdown: `![${payload.name || "Drawing"}](${payload.lightDataUrl})`,
              };
              return asset;
            }}
            onAssetCreated={(asset) => setAssets((cur) => [asset, ...cur])}
          />
        }
      />
    </main>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add examples/full
git commit -m "docs: full example app with renderer, drawing, assets"
```

---

## Task 23: README

**Files:**
- Modify: `README.md` (replace current content)

- [ ] **Step 1: Replace `README.md`**

````markdown
# @justin06lee/hellatuff

Headless React article editor with live markdown preview, vim mode, draggable image sidebar, optional drawing window, and starter styles. Extracted from [tenet/archive](https://github.com/justin06lee/tenet).

- **Headless core** — zero runtime deps beyond `react`. BYO backend, renderer, and styles.
- **Subpath exports** for optional pieces: default markdown renderer, drawing window, starter CSS.
- **Works with anything** — GitHub, Supabase, Postgres, filesystem — opaque version token for optimistic concurrency.
- **Tailwind-free** — ships stable `hlt-*` class names and CSS custom properties.

## Install

```bash
bun add @justin06lee/hellatuff
# Or: npm install / pnpm add
```

For the default renderer:

```bash
bun add react-markdown remark-gfm remark-math rehype-katex rehype-highlight rehype-slug katex
```

## Quick start

```tsx
"use client";
import { Editor } from "@justin06lee/hellatuff";
import { markdownRenderer } from "@justin06lee/hellatuff/renderer";
import { DrawingManager } from "@justin06lee/hellatuff/drawing";
import "@justin06lee/hellatuff/styles.css";
import "katex/dist/katex.min.css";

export default function ArticlePage({ raw, sha, assets }) {
  return (
    <Editor
      articlePath={["docs", "getting-started"]}
      initialRaw={raw}
      initialVersion={sha}
      assets={assets}
      renderer={markdownRenderer}
      onSave={async (raw, version) => {
        const { sha } = await saveToBackend(raw, version);
        return { version: sha, message: "Saved" };
      }}
      onAssetDelete={async (asset) => {
        await deleteFromBackend(asset.id);
      }}
      footer={
        <DrawingManager
          onSave={async (payload) => uploadDrawing(payload)}
          onAssetCreated={(asset) => console.log("new asset", asset)}
        />
      }
    />
  );
}
```

## Exports

| Export | Purpose |
|---|---|
| `@justin06lee/hellatuff` | Core `<Editor/>`, types, hooks, parsers |
| `@justin06lee/hellatuff/renderer` | `createMarkdownRenderer`, `markdownRenderer` (requires react-markdown family as peers) |
| `@justin06lee/hellatuff/drawing` | `<DrawingWindow/>`, `<DrawingManager/>` |
| `@justin06lee/hellatuff/styles.css` | Design tokens + `hlt-*` component classes |

## Configuration

See full API reference in [`docs/superpowers/specs/2026-04-16-hellatuff-library-design.md`](./docs/superpowers/specs/2026-04-16-hellatuff-library-design.md).

Key props on `<Editor>`:

- `onSave(raw, version?) => Promise<{ version?, message? }>` — required. Library owns Cmd/Ctrl+S.
- `onAssetDelete(asset) => Promise<void>` — optional. Library manages the confirm dialog.
- `onDirtyChange(dirty)` — optional. Fires on raw-vs-saved transitions.
- `renderer(content) => ReactNode` — optional. Required for preview mode.
- `parseDraft` — optional. Defaults to title-only; use `createFrontmatterParser` for metadata.
- `theme` — `"light" | "dark"`. Optional; falls back to `[data-theme]` on `<html>`.

## Theming

Import `@justin06lee/hellatuff/styles.css` and override tokens in your own CSS:

```css
:root {
  --hlt-background: var(--my-app-bg);
  --hlt-foreground: var(--my-app-fg);
}
```

Or skip the import entirely and write CSS targeting `.hlt-*` classes.

## Vim mode

Toggle with the "Vim on/off" button. Persisted to `localStorage`. Supports: `hjkl`, `w/b/e`, `0/$`, `gg/G`, `i/a/I/A`, `o/O`, `x`, `dd`.

## Examples

See `examples/minimal` and `examples/full`:

```bash
cd examples/full
bun install
bun run dev
```

## Development

```bash
bun install
bun run test         # unit + component tests
bun run typecheck
bun run lint
bun run build        # produces dist/
```

## License

MIT
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with quick start and API overview"
```

---

## Final verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: all tests PASS across draft parsers, vim motions, vim state, hooks, toolbar, sidebar, Editor, collapsible renderer, drawing canvas, drawing manager.

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Lint**

Run: `bun run lint`
Expected: 0 errors (warnings are acceptable).

- [ ] **Step 4: Build**

Run: `bun run build`
Expected: `dist/index.js`, `dist/renderer.js`, `dist/drawing.js`, their `.d.ts` counterparts, and `dist/hellatuff.css` all present.

- [ ] **Step 5: Smoke-test the full example**

```bash
cd examples/full
bun install
bun run dev
```

Open `http://localhost:3000`, verify: article renders with title "Welcome", preview pane renders markdown with math + code, Bold button wraps selected text, `Cmd+S` triggers save message, theme toggle flips preview colors, "New drawing window" opens the drawing canvas.

- [ ] **Step 6: Commit any fixups**

If any test / typecheck / build / smoke failure required changes, commit them with a descriptive message.

---

## Open items deferred to post-v1

These are explicitly NOT in v1 (from the spec's Non-Goals) — do not implement:

- Autosave / debounced save
- Collaborative editing
- WYSIWYG mode
- Mobile touch UX polish
- File upload UI beyond drawing
- Cross-save undo/redo
- Markdown lint / schema validation
- i18n
- Bundled theme toggle

---

## Plan self-review notes

*(to be filled during self-review — see below)*
