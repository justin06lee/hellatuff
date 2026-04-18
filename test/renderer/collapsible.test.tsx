import { describe, expect, it } from "bun:test";
import { cleanup } from "@testing-library/react";
import { afterEach } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  CollapsibleSections,
  parseArticleSections,
} from "../../src/renderer/collapsible";

afterEach(cleanup);

describe("parseArticleSections", () => {
  it("splits H2 blocks with unique slugs", () => {
    const content = "intro text\n\n## First\nA\n## First\nB";
    const result = parseArticleSections(content);
    expect(result.intro).toBe("intro text");
    expect(result.sections.map((s) => s.id)).toEqual(["first", "first-2"]);
    expect(result.sections[0]!.body).toBe("A");
    expect(result.sections[1]!.body).toBe("B");
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
