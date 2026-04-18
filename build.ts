import { $ } from "bun";
import { mkdir, cp } from "node:fs/promises";

const entries = [
  { name: "index", path: "./src/index.ts" },
  { name: "renderer", path: "./src/renderer/index.tsx" },
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
