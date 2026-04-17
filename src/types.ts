import type { ReactNode } from "react";

export interface AssetBase {
  id: string;
  displayName: string;
  url: string;
  darkUrl?: string;
  markdown: string;
}

export type EditorMode = "edit" | "preview" | "split";
export type VimMode = "insert" | "normal";

export interface SaveResult {
  version?: string;
  message?: string;
}

export interface ParsedDraft {
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export type DraftParser = (raw: string, fallbackTitle: string) => ParsedDraft;

export interface ToolbarAction {
  label: string;
  before: string;
  after?: string;
  placeholder?: string;
}

export interface EditorProps<TAsset extends AssetBase = AssetBase> {
  articlePath?: string[];
  articleName?: string;
  initialRaw: string;
  initialVersion?: string;

  onChange?: (raw: string) => void;
  onSave: (raw: string, version?: string) => Promise<SaveResult>;
  onDirtyChange?: (dirty: boolean) => void;

  assets?: TAsset[];
  onAssetDelete?: (asset: TAsset) => Promise<void>;
  onAssetCreated?: (asset: TAsset) => void;

  renderer?: (content: string) => ReactNode;
  imageBaseUrl?: string;

  parseDraft?: DraftParser;

  defaultMode?: EditorMode;
  toolbar?: ToolbarAction[] | false;
  vimEnabled?: boolean;
  className?: string;
  theme?: "light" | "dark";

  header?: ReactNode;
  footer?: ReactNode;
}
