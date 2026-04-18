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
      const title = match[1]!.trim();
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
            <span aria-hidden>&#9654;</span>
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
