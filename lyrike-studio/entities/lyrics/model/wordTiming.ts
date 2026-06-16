import type { LyricLine, LyricWord } from "./types";

export const MIN_WORD_LENGTH_SEC = 0.04;

const round2 = (value: number): number => Number(value.toFixed(2));

const shiftWord = (word: LyricWord, delta: number): LyricWord => ({
  ...word,
  start: round2(word.start + delta),
  end: round2(word.end + delta),
});

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function shiftWordsForSegmentMove(
  words: readonly LyricWord[],
  oldStart: number,
  newStart: number,
): LyricWord[] {
  return words.map((word) => shiftWord(word, newStart - oldStart));
}

export function scaleWordsForSegmentResize(
  words: readonly LyricWord[],
  oldStart: number,
  oldEnd: number,
  newStart: number,
  newEnd: number,
): LyricWord[] {
  if (oldEnd === oldStart) {
    return shiftWordsForSegmentMove(words, oldStart, newStart);
  }

  const oldRange = oldEnd - oldStart;
  const newRange = newEnd - newStart;

  return words.map((word) => {
    const start = newStart + ((word.start - oldStart) * newRange) / oldRange;
    const end = newStart + ((word.end - oldStart) * newRange) / oldRange;
    console.log("word", word.text, "start", start, "end", end);
    return {
      ...word,
      start: round2(start),
      end: round2(end),
    };
  });
}

export function clampWordRange(
  words: readonly LyricWord[],
  wordIndex: number,
  newStart: number,
  newEnd: number,
  parentStart: number,
  parentEnd: number,
): { start: number; end: number } {
  const prevEnd = wordIndex > 0 ? words[wordIndex - 1]?.end ?? parentStart : parentStart;
  const nextStart = words[wordIndex + 1]?.start ?? parentEnd;

  const minStart = Math.max(parentStart, prevEnd);
  const maxEnd = Math.min(parentEnd, nextStart);
  const proposedStart = Math.min(newStart, newEnd);
  const proposedEnd = Math.max(newStart, newEnd);

  const span = maxEnd - minStart;
  if (span <= MIN_WORD_LENGTH_SEC) {
    return { start: round2(minStart), end: round2(minStart + MIN_WORD_LENGTH_SEC) };
  }

  const maxStart = maxEnd - MIN_WORD_LENGTH_SEC;
  const start = clamp(proposedStart, minStart, maxStart);
  const end = clamp(proposedEnd, start + MIN_WORD_LENGTH_SEC, maxEnd);

  if (end - start >= MIN_WORD_LENGTH_SEC) {
    return { start: round2(start), end: round2(end) };
  }

  const adjustedEnd = Math.min(maxEnd, round2(start + MIN_WORD_LENGTH_SEC));
  const adjustedStart = Math.max(minStart, round2(adjustedEnd - MIN_WORD_LENGTH_SEC));

  return { start: round2(adjustedStart), end: round2(adjustedEnd) };
}

export function moveWordRange(
  words: readonly LyricWord[],
  wordIndex: number,
  delta: number,
  parentStart: number,
  parentEnd: number,
): LyricWord[] {
  const target = words[wordIndex];
  if (!target) return [...words];

  const nextRange = clampWordRange(
    words,
    wordIndex,
    target.start + delta,
    target.end + delta,
    parentStart,
    parentEnd,
  );

  return words.map((word, index) =>
    index === wordIndex
      ? {
        ...word,
        start: nextRange.start,
        end: nextRange.end,
      }
      : word,
  );
}

export function resizeWordRange(
  words: readonly LyricWord[],
  wordIndex: number,
  edge: "start" | "end",
  delta: number,
  parentStart: number,
  parentEnd: number,
): LyricWord[] {
  const target = words[wordIndex];
  if (!target) return [...words];

  const nextRange =
    edge === "start"
      ? clampWordRange(
        words,
        wordIndex,
        target.start + delta,
        target.end,
        parentStart,
        parentEnd,
      )
      : clampWordRange(
        words,
        wordIndex,
        target.start,
        target.end + delta,
        parentStart,
        parentEnd,
      );

  return words.map((word, index) =>
    index === wordIndex
      ? {
        ...word,
        start: nextRange.start,
        end: nextRange.end,
      }
      : word,
  );
}

export function deriveLineTextFromWords(words: readonly LyricWord[]): string {
  return words.map((word) => word.text.trim()).join(" ");
}

export function updateLineWordsForRangeChange(
  line: LyricLine,
  newStart: number,
  newEnd: number,
): LyricLine {
  if (!line.words || line.words.length === 0) {
    return line;
  }

  const oldStart = line.start;
  const oldEnd = line.end;

  if (newEnd - newStart === oldEnd - oldStart) {
    return {
      ...line,
      start: newStart,
      end: newEnd,
      words: shiftWordsForSegmentMove(line.words, oldStart, newStart),
    };
  }

  return {
    ...line,
    start: newStart,
    end: newEnd,
    words: scaleWordsForSegmentResize(
      line.words,
      oldStart,
      oldEnd,
      newStart,
      newEnd,
    ),
  };
}

export function normalizeWordsWithinLine(line: LyricLine): LyricLine {
  if (!line.words || line.words.length === 0) {
    return line;
  }

  let previousEnd = line.start;

  const words = line.words.map((word) => {
    const start = round2(Math.max(line.start, previousEnd, word.start));
    const endLimit = line.end;
    const minEnd = Math.min(endLimit, round2(start + MIN_WORD_LENGTH_SEC));
    const preferredEnd = round2(Math.max(start, Math.min(endLimit, word.end)));
    let end = Math.max(preferredEnd, minEnd);

    if (end > endLimit) {
      end = endLimit;
    }

    if (end - start < MIN_WORD_LENGTH_SEC) {
      const shiftedStart = Math.max(line.start, round2(end - MIN_WORD_LENGTH_SEC));
      const finalStart = Math.min(shiftedStart, start);
      const finalEnd = Math.min(endLimit, round2(finalStart + MIN_WORD_LENGTH_SEC));
      previousEnd = finalEnd;
      return {
        ...word,
        start: round2(finalStart),
        end: finalEnd,
      };
    }

    previousEnd = end;
    return {
      ...word,
      start,
      end: round2(end),
    };
  });

  return {
    ...line,
    words,
    text: deriveLineTextFromWords(words),
  };
}

export function updateWordRange(
  words: readonly LyricWord[],
  wordIndex: number,
  newStart: number,
  newEnd: number,
  parentStart: number,
  parentEnd: number,
): LyricWord[] {
  const target = words[wordIndex];
  if (!target) return [...words];

  // Detect which edge was dragged based on what changed
  const startChanged = newStart !== target.start;
  const endChanged = newEnd !== target.end;

  const MIN_LEN = MIN_WORD_LENGTH_SEC;

  if (startChanged && endChanged) {
    // This is a MOVE operation.
    // Shifting the word will resize the neighboring words to keep them contiguous.
    const prevWord = wordIndex > 0 ? words[wordIndex - 1] : null;
    const nextWord = wordIndex < words.length - 1 ? words[wordIndex + 1] : null;

    const width = target.end - target.start;
    const minStart = prevWord ? prevWord.start + MIN_LEN : parentStart;
    const maxStart = nextWord ? nextWord.end - MIN_LEN - width : parentEnd - width;

    const clampedStart = round2(clamp(newStart, minStart, maxStart));
    const clampedEnd = round2(clampedStart + width);

    return words.map((word, index) => {
      if (index === wordIndex) {
        return { ...word, start: clampedStart, end: clampedEnd };
      }
      if (prevWord && index === wordIndex - 1) {
        return { ...word, end: clampedStart };
      }
      if (nextWord && index === wordIndex + 1) {
        return { ...word, start: clampedEnd };
      }
      return word;
    });
  }

  if (endChanged) {
    // This is a RESIZE END operation.
    // Dragging the boundary between target and target + 1.
    const nextWord = words[wordIndex + 1];
    const limitStart = target.start + MIN_LEN;
    const limitEnd = nextWord ? nextWord.end - MIN_LEN : parentEnd;
    const clampedEnd = round2(clamp(newEnd, limitStart, limitEnd));

    return words.map((word, index) => {
      if (index === wordIndex) {
        return { ...word, end: clampedEnd };
      }
      if (index === wordIndex + 1) {
        return { ...word, start: clampedEnd };
      }
      return word;
    });
  }

  if (startChanged) {
    // This is a RESIZE START operation.
    // Dragging the boundary between target - 1 and target.
    const prevWord = words[wordIndex - 1];
    const limitStart = prevWord ? prevWord.start + MIN_LEN : parentStart;
    const limitEnd = target.end - MIN_LEN;
    const clampedStart = round2(clamp(newStart, limitStart, limitEnd));

    return words.map((word, index) => {
      if (index === wordIndex) {
        return { ...word, start: clampedStart };
      }
      if (index === wordIndex - 1) {
        return { ...word, end: clampedStart };
      }
      return word;
    });
  }

  return [...words];
}
