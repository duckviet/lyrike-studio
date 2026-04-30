import type { LyricLine } from "@/entities/lyrics";

export function calcExtendLinePatch(
  lines: LyricLine[],
  lineId: string,
  edge: "start" | "end",
  newTime: number,
): { start: number; end: number } | null {
  const line = lines.find((l) => l.id === lineId);
  if (!line) return null;
  return {
    start: edge === "start" ? newTime : line.start,
    end: edge === "end" ? newTime : line.end,
  };
}
