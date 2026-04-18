import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DrawingManager } from "../../src/drawing/DrawingManager";

afterEach(cleanup);

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
    expect(document.querySelector('[data-drawing-window="true"]')).not.toBeNull();
  });
});
