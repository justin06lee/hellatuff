import type { AssetBase } from "../types";

interface AssetDeleteDialogProps<TAsset extends AssetBase> {
  asset: TAsset;
  deleting: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AssetDeleteDialog<TAsset extends AssetBase>({
  asset,
  deleting,
  error,
  onConfirm,
  onCancel,
}: AssetDeleteDialogProps<TAsset>) {
  return (
    <div className="hlt-modal-scrim">
      <div className="hlt-modal">
        <p className="hlt-editor-eyebrow">Delete image</p>
        <h2 className="hlt-editor-title">{asset.displayName}</h2>
        <p className="hlt-editor-crumbs" style={{ marginTop: "1rem" }}>
          This removes the image from storage. Any existing markdown references will stop working.
        </p>
        {error ? <p className="hlt-status hlt-status-error">{error}</p> : null}
        <div className="hlt-modal-actions">
          <button type="button" className="hlt-toolbar-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="hlt-button-primary"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Deleting..." : "Delete image"}
          </button>
        </div>
      </div>
    </div>
  );
}
