import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AssetSidebar } from "../../src/editor/AssetSidebar";
import type { AssetBase } from "../../src/types";

afterEach(cleanup);

const asset: AssetBase = {
  id: "a1",
  displayName: "Diagram",
  url: "https://example.com/a1.png",
  darkUrl: "https://example.com/a1-dark.png",
  markdown: "![Diagram](a1.png)",
};

describe("AssetSidebar", () => {
  it("renders assets and fires insert/delete callbacks", () => {
    const onInsert = mock(() => {});
    const onDelete = mock(() => {});
    render(
      <AssetSidebar
        assets={[asset]}
        theme="light"
        onInsert={onInsert}
        onRequestDelete={onDelete}
        deletingAssetId={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onInsert.mock.calls.length).toBe(1);
    expect(onDelete.mock.calls.length).toBe(1);
  });

  it("uses darkUrl when theme is dark", () => {
    render(
      <AssetSidebar
        assets={[asset]}
        theme="dark"
        onInsert={() => {}}
        onRequestDelete={() => {}}
        deletingAssetId={null}
      />
    );
    const image = screen.getByAltText("Diagram") as HTMLImageElement;
    expect(image.src).toBe("https://example.com/a1-dark.png");
  });

  it("shows empty state when no assets", () => {
    render(
      <AssetSidebar
        assets={[]}
        theme="light"
        onInsert={() => {}}
        onRequestDelete={() => {}}
        deletingAssetId={null}
      />
    );
    expect(screen.getByText(/No images yet/i)).toBeDefined();
  });

  it("disables delete while deleting that asset", () => {
    render(
      <AssetSidebar
        assets={[asset]}
        theme="light"
        onInsert={() => {}}
        onRequestDelete={() => {}}
        deletingAssetId="a1"
      />
    );
    const button = screen.getByRole("button", { name: /Deleting/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
