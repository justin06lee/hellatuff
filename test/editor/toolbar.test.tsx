import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { DEFAULT_TOOLBAR } from "../../src/editor/defaults";
import { Toolbar } from "../../src/editor/Toolbar";

describe("Toolbar", () => {
  it("renders a button per action and fires onAction on click", () => {
    const onAction = mock(() => {});
    render(<Toolbar actions={DEFAULT_TOOLBAR} onAction={onAction} />);
    const boldButton = screen.getByRole("button", { name: "Bold" });
    boldButton.click();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0][0].label).toBe("Bold");
  });

  it("renders trailing content when provided", () => {
    render(
      <Toolbar actions={[]} onAction={() => {}} trailing={<span>status</span>} />
    );
    expect(screen.getByText("status")).toBeDefined();
  });
});
