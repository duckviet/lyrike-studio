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

  const minStart = prevLine ? prevLine.start + MIN_LINE_GAP : 0;
  const maxEnd = nextLine
    ? nextLine.end - MIN_LINE_GAP
    : Number.MAX_SAFE_INTEGER;

  const proposedStart = patch.start ?? target.start;
  const proposedEnd = patch.end ?? target.end;

  const nextStart = clamp(proposedStart, minStart, proposedEnd - MIN_LINE_GAP);
  const nextEnd = clamp(proposedEnd, nextStart + MIN_LINE_GAP, maxEnd);

  return lines.map((line, lineIndex) => {
    if (lineIndex !== index) {
      return line;
    }

    return {
      ...line,
      start: Number(nextStart.toFixed(2)),
      end: Number(nextEnd.toFixed(2)),
    };
  });
}
