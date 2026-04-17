import { useCallback, useEffect, useState } from "react";

export const VIM_STORAGE_KEY = "hellatuff-editor-vim";

function readStored(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(VIM_STORAGE_KEY) === "1";
}

export function useVimStorage(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState(readStored);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(VIM_STORAGE_KEY, enabled ? "1" : "0");
  }, [enabled]);

  const set = useCallback((next: boolean) => {
    setEnabled(next);
  }, []);

  return [enabled, set];
}
