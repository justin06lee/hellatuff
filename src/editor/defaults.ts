import type { ToolbarAction } from "../types";

export const DEFAULT_TOOLBAR: ToolbarAction[] = [
  { label: "H2", before: "\n## ", placeholder: "Section Title" },
  { label: "Bold", before: "**", after: "**", placeholder: "bold text" },
  { label: "List", before: "\n- ", placeholder: "List item" },
  { label: "Code", before: "\n```txt\n", after: "\n```\n", placeholder: "code" },
  { label: "Link", before: "[", after: "](https://example.com)", placeholder: "label" },
  { label: "Math", before: "\n$$\n", after: "\n$$\n", placeholder: "x^2 + y^2 = z^2" },
];
