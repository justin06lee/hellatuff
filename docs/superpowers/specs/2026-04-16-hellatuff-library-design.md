# hellatuff — Library Design

**Package**: `@justin06lee/hellatuff`
**Location**: `/Users/huiyunlee/Workspace/github.com/justin06lee/hellatuff`
**Date**: 2026-04-16

## Summary

Extract the article editor at `tenet/archive/app/operator/OperatorArticleEditor.tsx` into a reusable React library. The library is headless-by-default: core editor is framework-agnostic with zero runtime deps beyond React; optional starter styles, default markdown renderer, and drawing window ship as separate subpath exports.

Target consumers: sibling projects under `~/Workspace/github.com/justin06lee/` that are all on Next 15/16 + Tailwind v4 + CSS-custom-property theming (e.g., `leetmasters.dev`, `prerequisites.top`, `thejamoproject.com`, `traceofhumanity.net`, `PathFinder`).

## Goals

- Headless core — consumers plug in their own backend, renderer, and styles.
- Single package, subpath exports — one `bun add`, tree-shakable.
- Generic asset metadata — GitHub SHA, Supabase row ID, filesystem path all fit.
- Opaque version tokens for optimistic concurrency.
- Drop-in starter styles (opt-in) for consumers who don't want to theme from scratch.

## Non-Goals (v1)

- No autosave / debounced save — manual only.
- No collaborative editing (no Y.js, OT, presence).
- No WYSIWYG — raw markdown textarea is the contract.
- No mobile-optimized touch UX — desktop/keyboard-first.
- No file upload UI — sidebar lists existing assets; drawing window creates new ones; arbitrary upload is consumer-owned.
- No cross-save undo/redo — native textarea undo only.
- No markdown-lint / schema validation.
- No i18n.
- No SSR of the editor (it's `"use client"`). Preview content is SSR-safe if consumer's renderer is.
- No bundled theme toggle — library reads `[data-theme="dark"]`; consumer owns toggling.

## Architecture

```
@justin06lee/hellatuff                  → core: <Editor/> + types + hooks
@justin06lee/hellatuff/renderer         → default react-markdown renderer
@justin06lee/hellatuff/drawing          → <DrawingWindow/> + <DrawingManager/>
@justin06lee/hellatuff/styles.css       → starter CSS (tokens + hlt-* classes)
```

**Core** owns: textarea, toolbar, vim-mode state machine, save UX (Cmd/Ctrl+S, pending state, error display), image-sidebar UI, split/preview/edit modes. Zero required deps beyond `react` (peer). Works on React 18+ — the source's React-19-only features (`useActionState`, `useEffectEvent`) are replaced by the inverted prop API.

**Renderer subpath** ships `createMarkdownRenderer` wired to react-markdown + remark-gfm + KaTeX + rehype-highlight. All listed as optional peer deps on core, only installed if consumer imports `/renderer`.

**Drawing subpath** is a self-contained floating canvas. Emits `{ lightDataUrl, darkDataUrl, name }` payloads. `<DrawingManager/>` is a convenience wrapper that manages multiple windows and wires to `onAssetCreated`.

**Styles export** is a single CSS file with design-token custom properties (`--hlt-*`) in `:root` + `[data-theme="dark"]`, plus stable `.hlt-*` component classes.

## Public API

### Core (`@justin06lee/hellatuff`)

```ts
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

export const DEFAULT_TOOLBAR: ToolbarAction[];

export interface EditorProps<TAsset extends AssetBase = AssetBase> {
  // Content
  articlePath?: string[];
  articleName?: string;
  initialRaw: string;
  initialVersion?: string;

  // Persistence
  onChange?: (raw: string) => void;
  onSave: (raw: string, version?: string) => Promise<SaveResult>;
  onDirtyChange?: (dirty: boolean) => void;

  // Assets (omit to hide sidebar)
  assets?: TAsset[];
  onAssetDelete?: (asset: TAsset) => Promise<void>;
  onAssetCreated?: (asset: TAsset) => void;

  // Preview
  renderer?: (content: string) => ReactNode;
  imageBaseUrl?: string;

  // Pluggable parsing
  parseDraft?: DraftParser;

  // UI
  defaultMode?: EditorMode;
  toolbar?: ToolbarAction[] | false;
  vimEnabled?: boolean;
  className?: string;

  // Escape hatches
  header?: ReactNode;
  footer?: ReactNode;
}

export function Editor<T extends AssetBase>(props: EditorProps<T>): JSX.Element;

// Draft parsers
export const titleOnlyParser: DraftParser;
export function createFrontmatterParser(opts: {
  keys: string[];
  normalize?: Record<string, (raw: string) => unknown>;
}): DraftParser;
```

### Renderer (`@justin06lee/hellatuff/renderer`)

```ts
export interface RendererOptions {
  imageBaseUrl?: string;
  collapsibleHeadings?: boolean;
}

export function createMarkdownRenderer(
  opts?: RendererOptions
): (content: string) => ReactNode;

export const markdownRenderer: (content: string) => ReactNode;
```

Bundled plugins: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight`, `katex`. All listed on **core** as `peerDependenciesMeta.optional` — installed only when this subpath is imported. Collapsible headings default off.

### Drawing (`@justin06lee/hellatuff/drawing`)

Two layers: `DrawingWindow` is the low-level primitive (one floating canvas; consumer owns window lifecycle and save handling). `DrawingManager` is the convenience wrapper (manages multiple windows, stacking/focus, the "New drawing" trigger button, wires saves back to the editor via `onAssetCreated`). Most consumers use `DrawingManager`; `DrawingWindow` is exposed for anyone who wants full control.

```ts
export interface DrawingPayload {
  lightDataUrl: string;
  darkDataUrl: string;
  name: string;
}

export interface DrawingWindowProps {
  position?: { x: number; y: number };
  zIndex?: number;
  active?: boolean;
  onFocus?: () => void;
  onClose: () => void;
  onSave: (payload: DrawingPayload) => Promise<void>;
  disableSave?: boolean;
}

export function DrawingWindow(props: DrawingWindowProps): JSX.Element;

export interface DrawingManagerProps<TAsset extends AssetBase> {
  onSave: (payload: DrawingPayload) => Promise<TAsset>;
  onAssetCreated: (asset: TAsset) => void;
  triggerLabel?: string;
}

export function DrawingManager<T extends AssetBase>(
  props: DrawingManagerProps<T>
): JSX.Element;
```

### Styles (`@justin06lee/hellatuff/styles.css`)

Token scheme (subset):

```css
:root {
  --hlt-background: #faf8f2;
  --hlt-surface: #ffffff;
  --hlt-surface-alt: #efede7;
  --hlt-foreground: #1a1a1a;
  --hlt-muted: #6b6b6b;
  --hlt-border: #d9d6cd;
  --hlt-accent: #1a1a1a;
  --hlt-danger: #b91c1c;
}

[data-theme="dark"] {
  --hlt-background: #12120f;
  --hlt-surface: #1a1a16;
  /* ... */
}
```

Component classes (stable contract): `.hlt-editor`, `.hlt-toolbar`, `.hlt-toolbar-button`, `.hlt-textarea`, `.hlt-preview`, `.hlt-sidebar`, `.hlt-asset-card`, `.hlt-drawing-window`, `.hlt-modal`, `.hlt-button`, `.hlt-button-primary`.

Consumer choices: drop-in import, retheme via token override, or skip and write own CSS targeting `.hlt-*`.

## Persistence Contract

### Save

```ts
onSave(raw: string, version?: string): Promise<SaveResult>
```

- Called on "Save" button click or `Cmd/Ctrl+S`.
- `version` is the current token (from `initialVersion`, updated on each successful save).
- During await: button shows "Saving...", disabled.
- Success: if result has `version`, library stores it for next save; `message` is surfaced in the header.
- Rejection: thrown error's `.message` displayed inline (red). Editor stays dirty; no internal state change.

### Delete

```ts
onAssetDelete(asset: TAsset): Promise<void>
```

- Called from delete-confirm modal.
- Library removes asset from state **only on resolve**. Rejection keeps asset + shows error.

### Asset creation

```ts
onAssetCreated(asset: TAsset): void
```

- Fire-and-forget. Library prepends to `assets` state.

### Dirty tracking

```ts
onDirtyChange?(dirty: boolean): void
```

- `dirty = (raw !== lastSavedRaw)`. Consumer can use this for "unsaved" indicators or `beforeunload` prompts.

### Version token semantics

- Opaque string. Library never parses.
- GitHub SHA, Supabase `updated_at`, Postgres `xmin`, ETag — all fit.
- Consumer decides conflict policy (reject, auto-merge, etc.).

## Repo Layout

```
hellatuff/
  src/
    index.ts                    # core public exports
    editor/
      Editor.tsx                # main <Editor/>
      Toolbar.tsx
      AssetSidebar.tsx
      AssetDeleteDialog.tsx
    vim/
      state.ts                  # normal/insert state machine
      motions.ts                # hjkl, w/b/e, 0/$, gg/G helpers
      keymap.ts                 # handleNormalModeKey
    draft/
      title-only.ts
      frontmatter.ts
    types.ts
    hooks/
      use-dirty.ts
      use-vim-storage.ts
    renderer/
      index.ts
      collapsible.tsx
    drawing/
      index.ts
      DrawingWindow.tsx
      DrawingManager.tsx
      canvas.ts
  styles/
    hellatuff.css
  test/
    editor.test.tsx
    vim-motions.test.ts
    draft-parsers.test.ts
  examples/
    minimal/                    # bare-bones Next.js consumer
    full/                       # all features wired
  package.json
  tsconfig.json
  tsconfig.build.json
  biome.json
  bunfig.toml
  build.ts
  .gitignore
  README.md
  CHANGELOG.md
  LICENSE
```

## Build & Publish

### package.json (key fields)

```json
{
  "name": "@justin06lee/hellatuff",
  "version": "0.1.0",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".":            { "types": "./dist/index.d.ts",    "import": "./dist/index.js" },
    "./renderer":   { "types": "./dist/renderer.d.ts", "import": "./dist/renderer.js" },
    "./drawing":    { "types": "./dist/drawing.d.ts",  "import": "./dist/drawing.js" },
    "./styles.css": "./dist/hellatuff.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "peerDependenciesMeta": {
    "react-markdown":   { "optional": true },
    "remark-gfm":       { "optional": true },
    "remark-math":      { "optional": true },
    "rehype-katex":     { "optional": true },
    "rehype-highlight": { "optional": true },
    "katex":            { "optional": true }
  },
  "scripts": {
    "build": "bun run build.ts",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "prepublishOnly": "bun run build && bun run test && bun run typecheck"
  }
}
```

### Build process

- Three entries bundled by Bun: `src/index.ts`, `src/renderer/index.ts`, `src/drawing/index.ts`.
- ESM-only (all consumers are Next 15/16, ESM everywhere).
- `external`: React + peer deps (never bundle).
- `target: "browser"`, `minify: false` (consumer bundles minify).
- Types: `tsc -p tsconfig.build.json --emitDeclarationOnly` after bundling, one `.d.ts` per entry.
- CSS: copy `styles/hellatuff.css` to `dist/hellatuff.css`.

### Publish

- `bun publish --access public` (scoped packages default to private).
- Git tag `v0.1.0` + GitHub release.
- No CI for v1.

## Tooling

- **Linter/formatter**: Biome.
- **Unit tests**: `bun test` for logic (vim motions, draft parsers).
- **Component tests**: `bun test` + `@testing-library/react` + `happy-dom`.
- **TypeScript**: strict mode, `moduleResolution: "bundler"`.

## Renaming from tenet/archive

| tenet/archive | hellatuff |
|---|---|
| `OperatorArticleEditor` | `Editor` |
| `OperatorImageAsset` | `AssetBase` + generic `TMeta` |
| `parseArticleDraft` | `titleOnlyParser` / `createFrontmatterParser` |
| `CollapsibleMarkdown` | `createMarkdownRenderer({ collapsibleHeadings: true })` |
| `OperatorDrawingWindow` | `DrawingWindow` |
| Server action `saveArticleAction` | `onSave` prop |
| Server action `deleteImageAction` | `onAssetDelete` prop |
| Tailwind classes (`border-border`, etc.) | CSS classes (`hlt-*`) via plain className |
| `useTheme` from theme-provider | read `[data-theme="dark"]` ancestor attribute |

## Example Consumer Flow

```tsx
import { Editor } from "@justin06lee/hellatuff";
import { markdownRenderer } from "@justin06lee/hellatuff/renderer";
import { DrawingManager } from "@justin06lee/hellatuff/drawing";
import "@justin06lee/hellatuff/styles.css";

export default function ArticlePage({ raw, sha, assets }) {
  return (
    <Editor
      articlePath={["docs", "getting-started"]}
      initialRaw={raw}
      initialVersion={sha}
      assets={assets}
      renderer={markdownRenderer}
      onSave={async (raw, version) => {
        const { sha } = await saveToGithub(raw, version);
        return { version: sha, message: "Saved" };
      }}
      onAssetDelete={async (asset) => {
        await deleteFromGithub(asset.id);
      }}
      footer={
        <DrawingManager
          onSave={async (payload) => uploadDrawing(payload)}
          onAssetCreated={(asset) => { /* optional local handling */ }}
        />
      }
    />
  );
}
```

## Open Questions (to revisit post-v1)

- Autosave with configurable debounce.
- Mobile touch gestures for drawing / vim.
- i18n hook for UI strings.
- Alternate code highlighter (Shiki) as opt-in if `rehype-highlight` bundle size bites.
