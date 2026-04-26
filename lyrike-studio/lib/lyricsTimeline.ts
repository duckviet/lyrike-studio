export type LyricLine = {
  id: string;
  start: number;
  end: number;
  text: string;
};

const MIN_LINE_GAP = 0.24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundToCentiseconds(value: number): number {
  return Number(value.toFixed(2));
}

export function buildSeedLyrics(totalDuration: number): LyricLine[] {
  const safeDuration =
    Number.isFinite(totalDuration) && totalDuration > 0 ? totalDuration : 120;
  const slots = [0.11, 0.24, 0.36, 0.5, 0.63, 0.77].map(
    (ratio) => ratio * safeDuration,
  );
  const texts = [
    "intro line",
    "first verse line",
    "second verse line",
    "pre-chorus line",
    "chorus line",
    "post-chorus line",
  ];

  return slots.map((start, index) => {
    const nextStart = slots[index + 1] ?? safeDuration;
    return {
      id: `line-${index + 1}`,
      start: Number(start.toFixed(2)),
      end: Number(Math.min(nextStart - MIN_LINE_GAP, start + 8).toFixed(2)),
      text: texts[index] ?? `line ${index + 1}`,
    };
  });
}

export function findActiveLyricIndex(
  lines: LyricLine[],
  currentTime: number,
): number {
  return lines.findIndex(
    (line) => currentTime >= line.start && currentTime <= line.end,
  );
}

export function updateLyricTiming(
  lines: LyricLine[],
  targetId: string,
  patch: Partial<Pick<LyricLine, "start" | "end">>,
): LyricLine[] {
  const index = lines.findIndex((line) => line.id === targetId);
  if (index < 0) {
    return lines;
  }

  const prevLine = lines[index - 1];
  const nextLine = lines[index + 1];
  const target = lines[index];

  const minStart = prevLine ? prevLine.end + MIN_LINE_GAP : 0;
  const maxStart = (patch.end ?? target.end) - MIN_LINE_GAP;
  const boundedMaxStart = Math.max(minStart, maxStart);

  const proposedStart = patch.start ?? target.start;
  const proposedEnd = patch.end ?? target.end;

  const nextStart = clamp(proposedStart, minStart, boundedMaxStart);
  const nextEnd = Math.max(proposedEnd, nextStart + MIN_LINE_GAP);

  const endBoundary = nextLine ? nextLine.start - MIN_LINE_GAP : Number.POSITIVE_INFINITY;
  const overflow = Math.max(0, nextEnd - endBoundary);

  return lines.map((line, lineIndex) => {
    if (lineIndex === index) {
      return {
        ...line,
        start: roundToCentiseconds(nextStart),
        end: roundToCentiseconds(nextEnd),
      };
    }

    if (overflow > 0 && lineIndex > index) {
      return {
        ...line,
        start: roundToCentiseconds(line.start + overflow),
        end: roundToCentiseconds(line.end + overflow),
      };
    }

    return line;
  });
}
