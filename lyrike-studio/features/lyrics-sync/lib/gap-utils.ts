import type { LyricLine } from "@/entities/lyrics";

export type GapRegion = {
  id: string;
  start: number;
  end: number;
  prevLineId: string | null;
  nextLineId: string | null;
};

/**
 * Computes gap regions between lyric lines, before the first line, and after the last line.
 */
export function computeGaps(lines: LyricLine[], duration: number): GapRegion[] {
  if (duration <= 0) return [];

  const sorted = [...lines].sort((a, b) => a.start - b.start);
  const gaps: GapRegion[] = [];

  // Gap before first line
  if (sorted.length === 0) {
    gaps.push({
      id: "gap-start-end",
      start: 0,
      end: duration,
      prevLineId: null,
      nextLineId: null,
    });
    return gaps;
  }

  if (sorted[0].start > 0) {
    gaps.push({
      id: `gap-start-${sorted[0].id}`,
      start: 0,
      end: sorted[0].start,
      prevLineId: null,
      nextLineId: sorted[0].id,
    });
  }

  // Gaps between lines
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i].end;
    const gapEnd = sorted[i + 1].start;
    if (gapEnd > gapStart) {
      gaps.push({
        id: `gap-${sorted[i].id}-${sorted[i + 1].id}`,
        start: gapStart,
        end: gapEnd,
        prevLineId: sorted[i].id,
        nextLineId: sorted[i + 1].id,
      });
    }
  }

  // Gap after last line
  const last = sorted[sorted.length - 1];
  if (last.end < duration) {
    gaps.push({
      id: `gap-${last.id}-end`,
      start: last.end,
      end: duration,
      prevLineId: last.id,
      nextLineId: null,
    });
  }

  return gaps;
}
