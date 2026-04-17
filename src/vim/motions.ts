export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeNormalCursor(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }
  return clamp(index, 0, text.length - 1);
}

export function getLineStart(text: string, index: number): number {
  let cursor = clamp(index, 0, text.length);
  while (cursor > 0 && text[cursor - 1] !== "\n") {
    cursor -= 1;
  }
  return cursor;
}

export function getLineEnd(text: string, index: number): number {
  let cursor = clamp(index, 0, text.length);
  while (cursor < text.length && text[cursor] !== "\n") {
    cursor += 1;
  }
  return cursor;
}

export function getLineLastCharacter(text: string, index: number): number {
  const start = getLineStart(text, index);
  const end = getLineEnd(text, index);
  return end > start ? end - 1 : start;
}

export function getCurrentColumn(text: string, index: number): number {
  return clamp(index, 0, text.length) - getLineStart(text, index);
}

export function getFirstNonWhitespace(text: string, index: number): number {
  const start = getLineStart(text, index);
  const end = getLineEnd(text, index);
  let cursor = start;
  while (cursor < end && /\s/.test(text[cursor] ?? "")) {
    cursor += 1;
  }
  return cursor < end ? cursor : start;
}

export function moveVertical(
  text: string,
  index: number,
  direction: -1 | 1,
  preferredColumn: number | null
): { column: number; index: number } {
  if (text.length === 0) {
    return { column: 0, index: 0 };
  }

  const currentStart = getLineStart(text, index);
  const targetColumn = preferredColumn ?? getCurrentColumn(text, index);

  if (direction === -1) {
    if (currentStart === 0) {
      return { column: targetColumn, index };
    }

    const previousLineEnd = currentStart - 1;
    const previousLineStart = getLineStart(text, previousLineEnd);
    const previousLineLength =
      getLineEnd(text, previousLineStart) - previousLineStart;
    const targetIndex =
      previousLineLength > 0
        ? previousLineStart + Math.min(targetColumn, previousLineLength)
        : previousLineStart;

    return { column: targetColumn, index: targetIndex };
  }

  const currentLineEnd = getLineEnd(text, index);
  if (currentLineEnd >= text.length) {
    return { column: targetColumn, index };
  }

  const nextLineStart = currentLineEnd + 1;
  const nextLineLength = getLineEnd(text, nextLineStart) - nextLineStart;
  const targetIndex =
    nextLineLength > 0
      ? nextLineStart + Math.min(targetColumn, nextLineLength - 1)
      : nextLineStart;

  return { column: targetColumn, index: targetIndex };
}

export function getCharClass(
  character: string | undefined
): "space" | "symbol" | "word" {
  if (!character || /\s/.test(character)) {
    return "space";
  }
  if (/\w/.test(character)) {
    return "word";
  }
  return "symbol";
}

export function moveToNextWordStart(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }

  let cursor = normalizeNormalCursor(text, index);
  const kind = getCharClass(text[cursor]);

  if (kind === "space") {
    while (cursor < text.length && getCharClass(text[cursor]) === "space") {
      cursor += 1;
    }
    return normalizeNormalCursor(text, cursor);
  }

  while (cursor < text.length && getCharClass(text[cursor]) === kind) {
    cursor += 1;
  }

  while (cursor < text.length && getCharClass(text[cursor]) === "space") {
    cursor += 1;
  }

  return normalizeNormalCursor(text, cursor);
}

export function moveToPreviousWordStart(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }

  let cursor = normalizeNormalCursor(text, Math.max(index - 1, 0));

  while (cursor > 0 && getCharClass(text[cursor]) === "space") {
    cursor -= 1;
  }

  const kind = getCharClass(text[cursor]);
  while (cursor > 0 && getCharClass(text[cursor - 1]) === kind) {
    cursor -= 1;
  }

  return cursor;
}

export function moveToWordEnd(text: string, index: number): number {
  if (text.length === 0) {
    return 0;
  }

  let cursor = normalizeNormalCursor(text, index);

  while (cursor < text.length - 1 && getCharClass(text[cursor]) === "space") {
    cursor += 1;
  }

  const kind = getCharClass(text[cursor]);
  while (
    cursor < text.length - 1 &&
    getCharClass(text[cursor + 1]) === kind
  ) {
    cursor += 1;
  }

  return cursor;
}
