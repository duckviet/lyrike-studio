import type { LyricLine, LyricWord } from "@/entities/lyrics";

export type WordRegionLayout = {
  readonly word: LyricWord;
  readonly left: number;
  readonly width: number;
};

export type SegmentLayout = {
  readonly line: LyricLine;
  readonly left: number;
  readonly width: number;
  readonly words: WordRegionLayout[];
};

export function computeSegmentLayout(
  line: LyricLine,
  pxPerSec: number,
): SegmentLayout {
  const left = line.start * pxPerSec;
  const width = (line.end - line.start) * pxPerSec;

  const words =
    line.words?.map((word) => {
      const wordLeft = (word.start - line.start) * pxPerSec;
      const wordWidth = (word.end - word.start) * pxPerSec;
      return {
        word,
        left: Math.max(0, wordLeft),
        width: Math.max(0, Math.min(wordWidth, width - wordLeft)),
      };
    }) ?? [];

  return { line, left, width, words };
}
