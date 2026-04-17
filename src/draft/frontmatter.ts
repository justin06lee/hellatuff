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
