import { useEffect, useRef } from "react";

export function useDirty(
  raw: string,
  baseline: string,
  onChange?: (dirty: boolean) => void
): boolean {
  const dirty = raw !== baseline;
  const lastReported = useRef<boolean | null>(null);

  useEffect(() => {
    if (!onChange) {
      return;
    }
    if (lastReported.current === dirty) {
      return;
    }
    lastReported.current = dirty;
    onChange(dirty);
  }, [dirty, onChange]);

  return dirty;
}
