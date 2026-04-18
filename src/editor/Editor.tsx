"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { titleOnlyParser } from "../draft/title-only";
import { useAutoTheme } from "../hooks/use-auto-theme";
import { useDirty } from "../hooks/use-dirty";
import { useVimStorage } from "../hooks/use-vim-storage";
import type {
  AssetBase,
  EditorMode,
  EditorProps,
  SaveResult,
  ToolbarAction,
  VimMode,
} from "../types";
import { applyNormalKey, type NormalState } from "../vim/state";
import { clamp, normalizeNormalCursor } from "../vim/motions";
import { AssetDeleteDialog } from "./AssetDeleteDialog";
import { AssetSidebar } from "./AssetSidebar";
import { DEFAULT_TOOLBAR } from "./defaults";
import { Toolbar } from "./Toolbar";

export function Editor<TAsset extends AssetBase = AssetBase>(
  props: EditorProps<TAsset>
) {
  const {
    articlePath,
    articleName,
    initialRaw,
    initialVersion,
    onChange,
    onSave,
    onDirtyChange,
    assets: externalAssets,
    onAssetDelete,
    renderer,
    imageBaseUrl: _imageBaseUrl,
    parseDraft = titleOnlyParser,
    defaultMode = "split",
    toolbar,
    vimEnabled: vimEnabledProp,
    className,
    theme: themeOverride,
    header,
    footer,
  } = props;

  const [raw, setRaw] = useState(initialRaw);
  const [savedRaw, setSavedRaw] = useState(initialRaw);
  const [version, setVersion] = useState(initialVersion);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<EditorMode>(defaultMode);
  const [assets, setAssets] = useState<TAsset[]>(externalAssets ?? []);
  const [assetToDelete, setAssetToDelete] = useState<TAsset | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [assetError, setAssetError] = useState("");
  const [storedVim, setStoredVim] = useVimStorage();
  const vimEnabled = vimEnabledProp ?? storedVim;
  const [vimMode, setVimMode] = useState<VimMode>(vimEnabled ? "normal" : "insert");
  const [pendingVimCommand, setPendingVimCommand] = useState<"d" | "g" | null>(null);
  const [preferredColumn, setPreferredColumn] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = useAutoTheme(themeOverride);
  const dirty = useDirty(raw, savedRaw, onDirtyChange);
  const toolbarActions = useMemo<ToolbarAction[] | false>(
    () => (toolbar === undefined ? DEFAULT_TOOLBAR : toolbar),
    [toolbar]
  );
  const parsed = useMemo(
    () => parseDraft(raw, articleName ?? articlePath?.at(-1) ?? "Untitled"),
    [raw, articleName, articlePath, parseDraft]
  );

  useEffect(() => {
    if (externalAssets) {
      setAssets(externalAssets);
    }
  }, [externalAssets]);

  useEffect(() => {
    onChange?.(raw);
  }, [raw, onChange]);

  useEffect(() => {
    if (vimEnabledProp !== undefined) {
      setStoredVim(vimEnabledProp);
    }
  }, [vimEnabledProp, setStoredVim]);

  const setCursor = useCallback((index: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(index, index);
  }, []);

  const applyEditorState = useCallback(
    (nextRaw: string, nextIndex: number, nextMode?: VimMode) => {
      setRaw(nextRaw);
      if (nextMode) setVimMode(nextMode);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(nextIndex, nextIndex);
      });
    },
    []
  );

  const insertSnippet = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = raw.slice(start, end) || action.placeholder || "";
      const next =
        raw.slice(0, start) +
        action.before +
        selected +
        (action.after ?? "") +
        raw.slice(end);
      setRaw(next);
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorStart = start + action.before.length;
        const cursorEnd = cursorStart + selected.length;
        textarea.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [raw]
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        setRaw((current) => `${current}${text}`);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = raw.slice(0, start) + text + raw.slice(end);
      const cursor = start + text.length;
      applyEditorState(next, cursor);
    },
    [raw, applyEditorState]
  );

  const handleAssetInsert = useCallback(
    (asset: TAsset) => {
      insertAtCursor(`\n${asset.markdown}\n`);
    },
    [insertAtCursor]
  );

  const confirmAssetDelete = useCallback(() => {
    if (!assetToDelete || !onAssetDelete) return;
    setAssetError("");
    setDeletingAssetId(assetToDelete.id);
    startTransition(async () => {
      try {
        await onAssetDelete(assetToDelete);
        setAssets((current) => current.filter((a) => a.id !== assetToDelete.id));
        setAssetToDelete(null);
      } catch (err) {
        setAssetError(err instanceof Error ? err.message : "Unable to delete.");
      } finally {
        setDeletingAssetId(null);
      }
    });
  }, [assetToDelete, onAssetDelete]);

  const performSave = useCallback(async () => {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result: SaveResult = await onSave(raw, version);
      setSavedRaw(raw);
      if (result.version !== undefined) setVersion(result.version);
      if (result.message) setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setPending(false);
    }
  }, [onSave, raw, version]);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void performSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [performSave]);

  const toggleVim = useCallback(() => {
    const next = !vimEnabled;
    if (vimEnabledProp === undefined) {
      setStoredVim(next);
    }
    setPendingVimCommand(null);
    setPreferredColumn(null);
    const textarea = textareaRef.current;
    if (!textarea) {
      setVimMode(next ? "normal" : "insert");
      return;
    }
    if (next) {
      setVimMode("normal");
      const index = normalizeNormalCursor(raw, textarea.selectionStart);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(index, index);
      });
    } else {
      setVimMode("insert");
    }
  }, [vimEnabled, vimEnabledProp, raw, setStoredVim]);

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!vimEnabled) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (vimMode === "insert") {
        if (event.key === "Escape") {
          event.preventDefault();
          setPendingVimCommand(null);
          setPreferredColumn(null);
          setVimMode("normal");
          const index = normalizeNormalCursor(
            raw,
            event.currentTarget.selectionStart - 1
          );
          setCursor(index);
        }
        return;
      }

      event.preventDefault();
      const state: NormalState = {
        text: raw,
        cursor: normalizeNormalCursor(raw, event.currentTarget.selectionStart),
        pendingCommand: pendingVimCommand,
        preferredColumn,
      };
      const result = applyNormalKey(state, event.key);
      setPendingVimCommand(result.pendingCommand);
      setPreferredColumn(result.preferredColumn);
      if (result.text !== raw) {
        applyEditorState(
          result.text,
          result.cursor,
          result.nextMode ?? undefined
        );
      } else {
        if (result.nextMode === "insert") setVimMode("insert");
        setCursor(clamp(result.cursor, 0, result.text.length));
      }
    },
    [vimEnabled, vimMode, raw, pendingVimCommand, preferredColumn, applyEditorState, setCursor]
  );

  const articleLabel = articlePath?.join(" / ") ?? "";
  const fallbackTitle = articleName ?? articlePath?.at(-1) ?? "Untitled";

  return (
    <div className={["hlt-editor", className].filter(Boolean).join(" ")}>
      <div className="hlt-editor-header">
        <div className="hlt-editor-header-row">
          <div>
            {header ?? (
              <>
                <p className="hlt-editor-eyebrow">Article Editor</p>
                <h1 className="hlt-editor-title">
                  {parsed.title || fallbackTitle}
                </h1>
                {articleLabel ? (
                  <p className="hlt-editor-crumbs">{articleLabel}</p>
                ) : null}
              </>
            )}
          </div>
          <div className="hlt-toolbar">
            <button
              type="button"
              className={`hlt-toolbar-button${vimEnabled ? " hlt-toolbar-button-active" : ""}`}
              onClick={toggleVim}
            >
              Vim {vimEnabled ? "on" : "off"}
            </button>
            <div className="hlt-mode-group">
              {(["edit", "preview", "split"] as EditorMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className="hlt-mode-button"
                  aria-pressed={mode === option}
                  onClick={() => setMode(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="hlt-button-primary"
              disabled={pending}
              onClick={performSave}
            >
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {toolbarActions !== false ? (
          <div style={{ marginTop: "1rem" }}>
            <Toolbar
              actions={toolbarActions}
              onAction={insertSnippet}
              trailing={
                vimEnabled
                  ? `Vim ${vimMode}${pendingVimCommand ? ` · ${pendingVimCommand}` : ""}`
                  : "Cmd/Ctrl+S to save"
              }
            />
          </div>
        ) : null}

        {error ? (
          <p className="hlt-status hlt-status-error">{error}</p>
        ) : null}
        {message && !error ? <p className="hlt-status">{message}</p> : null}
        {dirty && !pending && !error ? (
          <p className="hlt-status hlt-editor-crumbs">Unsaved changes.</p>
        ) : null}
      </div>

      <div className="hlt-grid">
        {externalAssets !== undefined ? (
          <AssetSidebar
            assets={assets}
            theme={theme}
            onInsert={handleAssetInsert}
            onRequestDelete={(asset) => {
              setAssetError("");
              setAssetToDelete(asset);
            }}
            deletingAssetId={deletingAssetId}
          />
        ) : (
          <div />
        )}
        <div
          className={[
            "hlt-editor-panes",
            mode === "split" ? "hlt-panes-split" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {mode !== "preview" ? (
            <div className="hlt-pane-edit">
              <textarea
                ref={textareaRef}
                className="hlt-textarea"
                value={raw}
                spellCheck={false}
                onChange={(event) => setRaw(event.target.value)}
                onKeyDown={handleTextareaKeyDown}
              />
            </div>
          ) : null}
          {mode !== "edit" ? (
            <div className="hlt-preview">
              <div className="hlt-preview-header">Live preview</div>
              <div className="hlt-preview-body">
                {renderer ? renderer(parsed.content) : (
                  <p className="hlt-editor-crumbs">
                    No renderer provided. Pass a `renderer` prop to see the live preview.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {footer}

      {assetToDelete ? (
        <AssetDeleteDialog
          asset={assetToDelete}
          deleting={deletingAssetId === assetToDelete.id}
          error={assetError}
          onConfirm={confirmAssetDelete}
          onCancel={() => {
            setAssetError("");
            setAssetToDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function useEditorAssetCreated<TAsset extends AssetBase>(
  setAssets: React.Dispatch<React.SetStateAction<TAsset[]>>
) {
  return useCallback(
    (asset: TAsset) => setAssets((current) => [asset, ...current]),
    [setAssets]
  );
}
