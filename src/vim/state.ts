import {
  getCurrentColumn,
  getFirstNonWhitespace,
  getLineEnd,
  getLineLastCharacter,
  getLineStart,
  moveToNextWordStart,
  moveToPreviousWordStart,
  moveToWordEnd,
  moveVertical,
  normalizeNormalCursor,
} from "./motions";

export type PendingCommand = "d" | "g" | null;
export type VimModeIntent = "insert" | null;

export interface NormalState {
  text: string;
  cursor: number;
  pendingCommand: PendingCommand;
  preferredColumn: number | null;
}

export interface NormalResult extends NormalState {
  nextMode: VimModeIntent;
}

function withReset(
  state: NormalState,
  patch: Partial<NormalResult>
): NormalResult {
  return {
    text: patch.text ?? state.text,
    cursor: patch.cursor ?? state.cursor,
    pendingCommand: patch.pendingCommand ?? null,
    preferredColumn:
      patch.preferredColumn === undefined ? null : patch.preferredColumn,
    nextMode: patch.nextMode ?? null,
  };
}

export function applyNormalKey(state: NormalState, key: string): NormalResult {
  const { text } = state;
  const cursor = normalizeNormalCursor(text, state.cursor);
  const preservesColumn = key === "j" || key === "k";
  const carryColumn = preservesColumn ? state.preferredColumn : null;

  if (state.pendingCommand === "g") {
    if (key === "g") {
      return withReset(state, { cursor: 0 });
    }
    return withReset(state, {});
  }

  if (state.pendingCommand === "d") {
    if (key === "d") {
      const start = getLineStart(text, cursor);
      const end = getLineEnd(text, cursor);
      const deleteEnd = end < text.length ? end + 1 : end;
      const nextText = text.slice(0, start) + text.slice(deleteEnd);
      const nextCursor =
        nextText.length === 0 ? 0 : normalizeNormalCursor(nextText, start);
      return withReset(state, { text: nextText, cursor: nextCursor });
    }
    return withReset(state, {});
  }

  switch (key) {
    case "Escape":
      return withReset(state, {});
    case "h":
      return withReset(state, { cursor: Math.max(cursor - 1, 0) });
    case "l":
      return withReset(state, {
        cursor: text.length === 0 ? 0 : Math.min(cursor + 1, text.length - 1),
      });
    case "j": {
      const next = moveVertical(text, cursor, 1, carryColumn);
      return withReset(state, {
        cursor: next.index,
        preferredColumn: next.column,
      });
    }
    case "k": {
      const next = moveVertical(text, cursor, -1, carryColumn);
      return withReset(state, {
        cursor: next.index,
        preferredColumn: next.column,
      });
    }
    case "w":
      return withReset(state, {
        cursor: moveToNextWordStart(text, cursor + 1),
      });
    case "b":
      return withReset(state, {
        cursor: moveToPreviousWordStart(text, cursor),
      });
    case "e":
      return withReset(state, { cursor: moveToWordEnd(text, cursor) });
    case "0":
      return withReset(state, { cursor: getLineStart(text, cursor) });
    case "$":
      return withReset(state, { cursor: getLineLastCharacter(text, cursor) });
    case "g":
      return { ...withReset(state, {}), pendingCommand: "g" };
    case "G":
      return withReset(state, {
        cursor: normalizeNormalCursor(text, text.length - 1),
      });
    case "i":
      return withReset(state, { cursor, nextMode: "insert" });
    case "a":
      return withReset(state, {
        cursor: text.length === 0 ? 0 : Math.min(cursor + 1, text.length),
        nextMode: "insert",
      });
    case "I":
      return withReset(state, {
        cursor: getFirstNonWhitespace(text, cursor),
        nextMode: "insert",
      });
    case "A":
      return withReset(state, {
        cursor: getLineEnd(text, cursor),
        nextMode: "insert",
      });
    case "o": {
      const lineEnd = getLineEnd(text, cursor);
      const nextText = `${text.slice(0, lineEnd)}\n${text.slice(lineEnd)}`;
      return withReset(state, {
        text: nextText,
        cursor: lineEnd + 1,
        nextMode: "insert",
      });
    }
    case "O": {
      const lineStart = getLineStart(text, cursor);
      const nextText = `${text.slice(0, lineStart)}\n${text.slice(lineStart)}`;
      return withReset(state, {
        text: nextText,
        cursor: lineStart,
        nextMode: "insert",
      });
    }
    case "x": {
      if (text.length === 0) {
        return withReset(state, {});
      }
      const nextText = text.slice(0, cursor) + text.slice(cursor + 1);
      const nextCursor =
        nextText.length === 0 ? 0 : normalizeNormalCursor(nextText, cursor);
      return withReset(state, { text: nextText, cursor: nextCursor });
    }
    case "d":
      return { ...withReset(state, {}), pendingCommand: "d" };
    default:
      return withReset(state, {});
  }
}
