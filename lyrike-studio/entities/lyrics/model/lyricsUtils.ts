import { TIMING } from "@/shared/config/constants";
import { buildSeedLyrics } from "./lyricsTimeline";
import type { LyricLine, LyricsMeta, LyricsDoc } from "../types";

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

export function applyDocLive(doc: LyricsDoc, nextLines: LyricLine[]): LyricsDoc {
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
