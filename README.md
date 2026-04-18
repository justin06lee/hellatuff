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
