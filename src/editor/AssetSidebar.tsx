import type { AssetBase } from "../types";

interface AssetSidebarProps<TAsset extends AssetBase> {
  assets: TAsset[];
  theme: "light" | "dark";
  onInsert: (asset: TAsset) => void;
  onRequestDelete: (asset: TAsset) => void;
  deletingAssetId: string | null;
}

export function AssetSidebar<TAsset extends AssetBase>({
  assets,
  theme,
  onInsert,
  onRequestDelete,
  deletingAssetId,
}: AssetSidebarProps<TAsset>) {
  return (
    <aside className="hlt-sidebar">
      <div className="hlt-sidebar-header">
        <p className="hlt-editor-eyebrow">Images</p>
        <p className="hlt-editor-crumbs">
          Drag into the editor or click insert. Save the article to persist image references.
        </p>
      </div>
      <div className="hlt-sidebar-body">
        {assets.length === 0 ? (
          <p className="hlt-editor-crumbs">
            No images yet. Create assets externally and pass them in.
          </p>
        ) : (
          assets.map((asset) => {
            const src = theme === "dark" && asset.darkUrl ? asset.darkUrl : asset.url;
            return (
              <div
                key={asset.id}
                className="hlt-asset-card"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", asset.markdown);
                  event.dataTransfer.effectAllowed = "copy";
                }}
              >
                <div className="hlt-asset-thumb">
                  <img src={src} alt={asset.displayName} loading="lazy" />
                </div>
                <p className="hlt-asset-name">{asset.displayName}</p>
                <p className="hlt-asset-path">{asset.markdown}</p>
                <div className="hlt-asset-actions">
                  <button
                    type="button"
                    className="hlt-toolbar-button"
                    style={{ flex: 1 }}
                    onClick={() => onInsert(asset)}
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    className="hlt-toolbar-button"
                    disabled={deletingAssetId === asset.id}
                    onClick={() => onRequestDelete(asset)}
                  >
                    {deletingAssetId === asset.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
