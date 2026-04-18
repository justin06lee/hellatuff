"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssetBase } from "../types";
import {
  DrawingWindow,
  type DrawingPayload,
} from "./DrawingWindow";

interface DrawingWindowState {
  id: number;
  position: { x: number; y: number };
}

function getNextDrawingWindowId(windows: DrawingWindowState[]): number {
  const ids = new Set(windows.map((w) => w.id));
  let next = 1;
  while (ids.has(next)) next += 1;
  return next;
}

export interface DrawingManagerProps<TAsset extends AssetBase> {
  onSave: (payload: DrawingPayload) => Promise<TAsset>;
  onAssetCreated: (asset: TAsset) => void;
  triggerLabel?: string;
}

export function DrawingManager<TAsset extends AssetBase>({
  onSave,
  onAssetCreated,
  triggerLabel = "New drawing window",
}: DrawingManagerProps<TAsset>) {
  const [windows, setWindows] = useState<DrawingWindowState[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-drawing-window="true"]')
      ) {
        return;
      }
      setActiveId(null);
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, []);

  const openWindow = useCallback(() => {
    setWindows((current) => {
      const id = getNextDrawingWindowId(current);
      const offset = current.length * 28;
      setActiveId(id);
      return [
        ...current,
        { id, position: { x: 72 + offset, y: 120 + offset } },
      ];
    });
  }, []);

  const focusWindow = useCallback((id: number) => {
    setActiveId(id);
    setWindows((current) => {
      const found = current.find((w) => w.id === id);
      if (!found) return current;
      return [...current.filter((w) => w.id !== id), found];
    });
  }, []);

  const closeWindow = useCallback((id: number) => {
    setWindows((current) => current.filter((w) => w.id !== id));
    setActiveId((current) => (current === id ? null : current));
    setSavingId((current) => (current === id ? null : current));
  }, []);

  const handleWindowSave = useCallback(
    async (id: number, payload: DrawingPayload) => {
      const asset = await onSave(payload);
      onAssetCreated(asset);
    },
    [onSave, onAssetCreated]
  );

  return (
    <>
      <button
        type="button"
        className="hlt-toolbar-button"
        onClick={openWindow}
      >
        {triggerLabel}
      </button>
      {windows.map((state, index) => (
        <DrawingWindow
          key={state.id}
          windowId={state.id}
          active={state.id === activeId}
          zIndex={80 + index}
          initialPosition={state.position}
          disableSave={savingId !== null && savingId !== state.id}
          onFocus={() => focusWindow(state.id)}
          onClose={() => closeWindow(state.id)}
          onSaveStart={() => setSavingId(state.id)}
          onSaveEnd={() => setSavingId(null)}
          onSave={(payload) => handleWindowSave(state.id, payload)}
        />
      ))}
    </>
  );
}
