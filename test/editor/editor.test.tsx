import { describe, expect, it, mock } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Editor } from "../../src/editor/Editor";

function mockSave(result: { version?: string; message?: string } = {}) {
  return mock(async () => result);
}

describe("Editor", () => {
  it("renders initial raw, parsed title, and save button", () => {
    render(
      <Editor
        initialRaw={"# Hello\n\nBody"}
        articlePath={["docs"]}
        onSave={mockSave()}
      />
    );
    expect(screen.getByRole("heading", { name: "Hello" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });

  it("invokes onSave on Cmd+S and updates version", async () => {
    const onSave = mockSave({ version: "v2", message: "saved" });
    render(
      <Editor
        initialRaw="# Hi"
        initialVersion="v1"
        onSave={onSave}
      />
    );
    await act(async () => {
      fireEvent.keyDown(window, { key: "s", metaKey: true });
      await Promise.resolve();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][1]).toBe("v1");
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("saved")).toBeDefined();
  });

  it("displays error on save rejection", async () => {
    const onSave = mock(async () => {
      throw new Error("Version conflict");
    });
    render(<Editor initialRaw="x" onSave={onSave} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("Version conflict")).toBeDefined();
  });

  it("toggles between edit, preview, split modes", () => {
    render(
      <Editor
        initialRaw={"# Hi\n\nBody"}
        onSave={mockSave()}
        renderer={(content) => <div data-testid="preview">{content}</div>}
      />
    );
    expect(screen.getByTestId("preview").textContent).toContain("Body");
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    expect(screen.queryByTestId("preview")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "preview" }));
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("inserts toolbar snippet at cursor with placeholder", async () => {
    render(<Editor initialRaw="" onSave={mockSave()} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(textarea.value).toContain("**bold text**");
  });

  it("fires onDirtyChange when raw diverges from baseline", async () => {
    const onDirtyChange = mock(() => {});
    render(
      <Editor
        initialRaw="a"
        onSave={mockSave()}
        onDirtyChange={onDirtyChange}
      />
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "ab" } });
    await act(async () => {
      await Promise.resolve();
    });
    expect(onDirtyChange.mock.calls.some(([d]) => d === true)).toBe(true);
  });
});
