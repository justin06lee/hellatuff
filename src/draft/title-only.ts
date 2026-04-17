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
