export const INSTRUMENTAL_SYMBOL = "♪";

export interface FillGapsOptions {
  /** Minimum silence (seconds) between two lines that gets a marker line. */
  readonly minGap: number;
  readonly symbol?: string;
}

interface TimedLine {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/**
 * Inserts a marker line (default "♪") at the end of a line whenever the silence
 * before the next line lasts at least `minGap` seconds. LRC players otherwise
 * keep the previous lyric highlighted through the whole instrumental break.
 *
 * Only gaps *between* lines are filled; lines already containing the symbol
 * (or empty text) count as filled and are never doubled.
 */
export function fillInstrumentalGaps<T extends TimedLine>(
  lines: readonly T[],
  options: FillGapsOptions,
): Array<T | TimedLine> {
  const symbol = options.symbol ?? INSTRUMENTAL_SYMBOL;
  const sorted = [...lines].sort((a, b) => a.start - b.start);
  const out: Array<T | TimedLine> = [];

  sorted.forEach((line, index) => {
    out.push(line);
    const next = sorted[index + 1];
    if (!next) return;
    const isMarker = line.text.trim() === "" || line.text.trim() === symbol;
    const gap = next.start - line.end;
    if (!isMarker && gap >= options.minGap) {
      out.push({ start: line.end, end: next.start, text: symbol });
    }
  });

  return out;
}

export function countInstrumentalGaps(
  lines: readonly TimedLine[],
  options: FillGapsOptions,
): number {
  return fillInstrumentalGaps(lines, options).length - lines.length;
}
