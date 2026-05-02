import { TIMING } from "@/shared/config/constants";
import { LYRICS_DEFAULTS } from "../config/constants";
import type { LyricLine, LyricsDoc } from "./types";
import * as utils from "./lyricsUtils";
import { buildSeedLyrics } from "./lyricsTimeline";

/**
 * We use any for get/set to avoid circular dependency with the main store file.
 * The main store will provide the typed get/set.
 */
type MinimalState = {
  doc: LyricsDoc;
  selectedLineId: string | null;
  activeLineId: string | null;
  isAutoSyncEnabled: boolean;
};

type StoreApi = {
  set: (patch: Partial<MinimalState>) => void;
  get: () => MinimalState;
};

export const buildTapSyncAction =
  (set: StoreApi["set"], get: StoreApi["get"]) => (currentTime: number) => {
    const { selectedLineId, doc } = get();
    if (!selectedLineId) return;
    const lines = doc.syncedLines;
    const selectedIndex = lines.findIndex(
      (line: LyricLine) => line.id === selectedLineId,
    );
    if (selectedIndex < 0) return;

    const baseLine = lines[selectedIndex];
    const patchedLines = utils.updateLyricTiming(lines, selectedLineId, {
      start: currentTime,
      end: Math.max(baseLine.end, currentTime + TIMING.MIN_LINE_LENGTH_SEC),
    });
    const nextLines = utils.sortByStart(patchedLines);
    const nextIndex = Math.min(selectedIndex + 1, nextLines.length - 1);

    set({
      doc: utils.applyDocWithSyncedLines(doc, nextLines),
      selectedLineId: nextLines[nextIndex]?.id ?? selectedLineId,
    });
  };

export const buildInsertAfterAction =
  (set: StoreApi["set"], get: StoreApi["get"]) => (lineId: string) => {
    const { doc } = get();
    const lines = doc.syncedLines;
    const index = lines.findIndex((line: LyricLine) => line.id === lineId);
    if (index < 0) return;
    const current = lines[index];
    const next = lines[index + 1];
    const start = Number((current.end + TIMING.MIN_LINE_LENGTH_SEC).toFixed(2));
    const endBound = next
      ? next.start - TIMING.MIN_LINE_LENGTH_SEC
      : current.end + 4;
    const end = Number(
      Math.max(start + TIMING.MIN_LINE_LENGTH_SEC, endBound).toFixed(2),
    );

    const inserted: LyricLine = {
      id: utils.createLineId(),
      start,
      end,
      text: LYRICS_DEFAULTS.NEW_LINE_TEXT,
    };
    const nextLines = [
      ...lines.slice(0, index + 1),
      inserted,
      ...lines.slice(index + 1),
    ];

    set({
      doc: utils.applyDocWithSyncedLines(doc, nextLines),
      selectedLineId: inserted.id,
    });
  };

export const buildInsertAtRangeAction =
  (set: StoreApi["set"], get: StoreApi["get"]) =>
  (start: number, end: number) => {
    const { doc } = get();
    const inserted: LyricLine = {
      id: utils.createLineId(),
      start,
      end,
      text: LYRICS_DEFAULTS.NEW_LINE_TEXT,
    };
    const nextLines = utils.sortByStart([...doc.syncedLines, inserted]);
    set({
      doc: utils.applyDocWithSyncedLines(doc, nextLines),
      selectedLineId: inserted.id,
    });
  };

export const buildDeleteGapAction =
  (set: StoreApi["set"], get: StoreApi["get"]) =>
  (
    gapStart: number,
    gapEnd: number,
    prevLineId: string | null,
    nextLineId: string | null,
  ) => {
    if (gapEnd <= gapStart) return;
    if (!nextLineId) return;

    const { doc } = get();
    const lines = doc.syncedLines;
    const nextIndex = lines.findIndex((l: LyricLine) => l.id === nextLineId);
    if (nextIndex < 0) return;

    const prevIndex = prevLineId
      ? lines.findIndex((l: LyricLine) => l.id === prevLineId)
      : -1;
    const prev = prevIndex >= 0 ? lines[prevIndex] : null;
    const desiredNextStart = prev ? prev.end + TIMING.MIN_LINE_LENGTH_SEC : 0;
    const shift = gapEnd - desiredNextStart;
    if (shift <= 0) return;

    const nextLines = lines.map((line: LyricLine, idx: number) => {
      if (idx < nextIndex) return line;
      return {
        ...line,
        start: Number(Math.max(0, line.start - shift).toFixed(2)),
        end: Number(Math.max(0, line.end - shift).toFixed(2)),
      };
    });
    set({ doc: utils.applyDocWithSyncedLines(doc, nextLines) });
  };

export const buildDeleteLineAction =
  (set: StoreApi["set"], get: StoreApi["get"]) => (lineId: string) => {
    const { doc } = get();
    const lines = doc.syncedLines;
    if (lines.length <= 1) return;
    const index = lines.findIndex((line: LyricLine) => line.id === lineId);
    if (index < 0) return;
    const nextLines = lines.filter((line: LyricLine) => line.id !== lineId);
    const newSelected =
      nextLines[Math.max(0, index - 1)]?.id ?? nextLines[0]?.id ?? null;
    set({
      doc: utils.applyDocWithSyncedLines(doc, nextLines),
      selectedLineId: newSelected,
    });
  };

export const buildReorderAction =
  (set: StoreApi["set"], get: StoreApi["get"]) =>
  (lineId: string, direction: "up" | "down") => {
    const { doc } = get();
    const nextLines = [...doc.syncedLines];
    const index = nextLines.findIndex((line: LyricLine) => line.id === lineId);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextLines.length) return;
    const [current] = nextLines.splice(index, 1);
    nextLines.splice(targetIndex, 0, current);
    set({
      doc: utils.applyDocRaw(doc, nextLines),
      selectedLineId: current.id,
    });
  };

export const buildSplitLineAction =
  (set: StoreApi["set"], get: StoreApi["get"]) => (lineId: string) => {
    const { doc } = get();
    const lines = doc.syncedLines;
    const index = lines.findIndex((line: LyricLine) => line.id === lineId);
    if (index < 0) return;
    const line = lines[index];
    const midpoint = Number(((line.start + line.end) / 2).toFixed(2));
    const parts = line.text.trim().split(/\s+/);
    const cutAt = Math.max(1, Math.floor(parts.length / 2));
    const leftText = parts.slice(0, cutAt).join(" ") || line.text;
    const rightText =
      parts.slice(cutAt).join(" ") || LYRICS_DEFAULTS.SPLIT_FALLBACK_TEXT;

    const first: LyricLine = {
      ...line,
      end: Math.max(line.start + TIMING.MIN_LINE_LENGTH_SEC, midpoint),
      text: leftText,
    };
    const second: LyricLine = {
      id: utils.createLineId(),
      start: Math.min(
        first.end + TIMING.MIN_LINE_LENGTH_SEC,
        line.end - TIMING.MIN_LINE_LENGTH_SEC,
      ),
      end: line.end,
      text: rightText,
    };

    const nextLines = [
      ...lines.slice(0, index),
      first,
      second,
      ...lines.slice(index + 1),
    ];
    set({
      doc: utils.applyDocWithSyncedLines(doc, nextLines),
      selectedLineId: second.id,
    });
  };

export const buildSplitAtTimeAction =
  (set: StoreApi["set"], get: StoreApi["get"]) => (time: number) => {
    const { doc } = get();
    const lines = doc.syncedLines;
    const index = lines.findIndex(
      (line: LyricLine) => time > line.start && time < line.end,
    );
    if (index < 0) return;

    const line = lines[index];
    if (
      time < line.start + TIMING.MIN_LINE_LENGTH_SEC ||
      time > line.end - TIMING.MIN_LINE_LENGTH_SEC
    ) {
      return;
    }

    const parts = line.text.trim().split(/\s+/);
    const cutAt = Math.max(1, Math.floor(parts.length / 2));
    const leftText = parts.slice(0, cutAt).join(" ") || line.text;
    const rightText =
      parts.slice(cutAt).join(" ") || LYRICS_DEFAULTS.SPLIT_FALLBACK_TEXT;

    const first: LyricLine = {
      ...line,
      end: time,
      text: leftText,
    };
    const second: LyricLine = {
      id: utils.createLineId(),
      start: time,
      end: line.end,
      text: rightText,
    };

    const nextLines = [
      ...lines.slice(0, index),
      first,
      second,
      ...lines.slice(index + 1),
    ];
    set({
      doc: utils.applyDocWithSyncedLines(doc, nextLines),
      selectedLineId: second.id,
    });
  };

export const buildMergeAction =
  (set: StoreApi["set"], get: StoreApi["get"]) => (lineId: string) => {
    const { doc } = get();
    const lines = doc.syncedLines;
    const index = lines.findIndex((line: LyricLine) => line.id === lineId);
    if (index <= 0) return;
    const previous = lines[index - 1];
    const current = lines[index];
    const merged: LyricLine = {
      ...previous,
      end: Math.max(previous.end, current.end),
      text: `${previous.text} ${current.text}`.trim(),
    };
    const nextLines = [
      ...lines.slice(0, index - 1),
      merged,
      ...lines.slice(index + 1),
    ];
    set({
      doc: utils.applyDocWithSyncedLines(doc, nextLines),
      selectedLineId: merged.id,
    });
  };

export const buildNudgeLineAction =
  (set: StoreApi["set"], get: StoreApi["get"]) =>
  (lineId: string, edge: "start" | "end", delta: number) => {
    const { doc } = get();
    const line = doc.syncedLines.find((item: LyricLine) => item.id === lineId);
    if (!line) return;
    const patch =
      edge === "start"
        ? { start: line.start + delta }
        : { end: line.end + delta };
    const nextLines = utils.updateLyricTiming(doc.syncedLines, lineId, patch);
    set({ doc: utils.applyDocWithSyncedLines(doc, nextLines) });
  };

export const buildHydrateFromMediaAction =
  (set: StoreApi["set"]) =>
  (input: { duration: number; title?: string; artist?: string }) => {
    const lines = buildSeedLyrics(input.duration || 120);
    const doc: LyricsDoc = {
      syncedLines: lines,
      plainLyrics: utils.toPlainLyrics(lines),
      meta: utils.createMeta({
        title: input.title ?? "",
        artist: input.artist ?? "",
      }),
    };
    set({
      doc,
      selectedLineId: lines[0]?.id ?? null,
      activeLineId: null,
      isAutoSyncEnabled: false,
    });
  };
