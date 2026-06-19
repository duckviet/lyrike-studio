import type { LyricLine, LyricWord } from "@/entities/lyrics";
import { clampWordRange } from "@/entities/lyrics/model/wordTiming";
import { computeResize, type DragEdge } from "./drag-math";

export interface WordDragMathInput {
  line: LyricLine;
  words: readonly LyricWord[];
  wordIndex: number;
  origin: {
    start: number;
    end: number;
    clientX: number;
  };
  edge: DragEdge;
  deltaX: number;
  pxPerSec: number;
  duration: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const round2 = (value: number) => Number(value.toFixed(2));

export function computeWordDragResult(input: WordDragMathInput) {
  const raw = computeResize({
    origin: input.origin,
    edge: input.edge,
    deltaX: input.deltaX,
    pxPerSec: input.pxPerSec,
    duration: input.duration,
  });

  if (input.edge === "move") {
    const length = input.origin.end - input.origin.start;
    const maxStart = input.line.end - length;
    const start = clamp(raw.start, input.line.start, maxStart);
    return { start: round2(start), end: round2(start + length) };
  }

  return clampWordRange(
    input.words,
    input.wordIndex,
    raw.start,
    raw.end,
    input.line.start,
    input.line.end,
  );
}
