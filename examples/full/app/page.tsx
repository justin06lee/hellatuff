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
