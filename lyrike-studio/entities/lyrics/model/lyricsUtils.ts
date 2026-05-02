import { buildSeedLyrics } from "./lyricsTimeline";
import type { LyricLine, LyricsMeta, LyricsDoc } from "./types";

export function createMeta(seed?: Partial<LyricsMeta>): LyricsMeta {
  return {
    title: seed?.title ?? "",
    artist: seed?.artist ?? "",
    album: seed?.album ?? "",
    by: seed?.by ?? "",
    offset: seed?.offset ?? 0,
  };
}

export function toPlainLyrics(lines: LyricLine[]): string {
  return lines.map((line) => line.text).join("\n");
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sortByStart(lines: LyricLine[]): LyricLine[] {
  return [...lines].sort((a, b) => a.start - b.start);
}

export function ensureSelectedLine(
  lines: LyricLine[],
  selectedLineId: string | null,
): string | null {
  if (lines.length === 0) return null;
  const current = lines.find((line) => line.id === selectedLineId);
  if (current) return current.id;
  return lines[0].id;
}

export function createLineId(): string {
  return `line-${crypto.randomUUID()}`;
}

export function applyDocWithSyncedLines(
  doc: LyricsDoc,
  nextLines: LyricLine[],
): LyricsDoc {
  const sorted = sortByStart(nextLines);
  return {
    ...doc,
    syncedLines: sorted,
    plainLyrics: toPlainLyrics(sorted),
  };
}

export function applyDocRaw(doc: LyricsDoc, nextLines: LyricLine[]): LyricsDoc {
  return {
    ...doc,
    syncedLines: nextLines,
    plainLyrics: toPlainLyrics(nextLines),
  };
}

export function applyDocLive(
  doc: LyricsDoc,
  nextLines: LyricLine[],
): LyricsDoc {
  return {
    ...doc,
    syncedLines: nextLines,
  };
}

export function updateLyricTiming(
  lines: LyricLine[],
  lineId: string,
  patch: Partial<LyricLine>,
): LyricLine[] {
  return lines.map((line) =>
    line.id === lineId ? { ...line, ...patch } : line,
  );
}

/**
 * Cập nhật timing của một line, và cascade-push tất cả các line phía sau
 * nếu chúng bị overlap bởi line vừa được resize.
 */
export function updateLyricTimingWithPush(
  lines: LyricLine[],
  lineId: string,
  patch: Partial<Pick<LyricLine, "start" | "end">>,
): LyricLine[] {
  const sorted = sortByStart(lines);
  const idx = sorted.findIndex((l) => l.id === lineId);
  if (idx < 0) return lines;

  const result = [...sorted];
  result[idx] = { ...result[idx], ...patch };

  // Cascade push: nếu end của line hiện tại đè lên line tiếp theo,
  // đẩy tất cả line phía sau một khoảng bằng phần overlap.
  let pushFront = result[idx].end;

  for (let i = idx + 1; i < result.length; i++) {
    const line = result[i];
    if (line.start >= pushFront) break; // không overlap → dừng

    const delta = pushFront - line.start;
    result[i] = {
      ...line,
      start: Number((line.start + delta).toFixed(2)),
      end: Number((line.end + delta).toFixed(2)),
    };
    pushFront = result[i].end; // cập nhật để check line kế tiếp
  }

  return result;
}

export function buildInitialDoc(): LyricsDoc {
  const syncedLines = buildSeedLyrics(120);
  return {
    syncedLines,
    plainLyrics: toPlainLyrics(syncedLines),
    meta: createMeta(),
  };
}

export {
  parseLrc,
  serializeLrc,
  lrcToLyricsModel,
  lyricsModelToLrc,
} from "@/lib/lrc";
