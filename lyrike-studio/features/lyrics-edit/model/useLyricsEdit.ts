"use client";

import { useCallback } from "react";
import type { LyricsState, LyricsDoc, LyricsMeta } from "@/entities/lyrics";
import { findActiveLyricIndex, type LyricLine } from "@/entities/lyrics";

export interface UseLyricsEditOptions {
  lyricsState: LyricsState;
  onSelectLine: (lineId: string) => void;
  onEditLineText: (lineId: string, text: string) => void;
  onInsertAfter: (lineId: string) => void;
  onDeleteLine: (lineId: string) => void;
  onReorder: (lineId: string, direction: "up" | "down") => void;
  onSplitLine: (lineId: string) => void;
  onMergeWithPrevious: (lineId: string) => void;
  onNudgeLine: (lineId: string, edge: "start" | "end", delta: number) => void;
  onSetPlainLyrics: (text: string) => void;
  onSetMeta: (update: Partial<LyricsMeta>) => void;
  onImportFromLrc: (rawLrc: string) => void;
  onExportToLrc: () => string;
}

export interface UseLyricsEditReturn {
  canUndo: boolean;
  canRedo: boolean;
  activeLineId: string | null;
  selectedLineId: string | null;
  tab: "synced" | "plain" | "meta";
  syncDoc: LyricsDoc;
  findActiveIndex: (currentTime: number) => number;
  seekToLine: (line: LyricLine) => void;
}

export function useLyricsEdit(options: UseLyricsEditOptions): UseLyricsEditReturn {
  const {
    lyricsState,
    onSelectLine,
    onEditLineText,
    onInsertAfter,
    onDeleteLine,
    onReorder,
    onSplitLine,
    onMergeWithPrevious,
    onNudgeLine,
    onSetPlainLyrics,
    onSetMeta,
    onImportFromLrc,
    onExportToLrc,
  } = options;

  const findActiveIndex = useCallback((currentTime: number) => {
    return findActiveLyricIndex(lyricsState.doc.syncedLines, currentTime);
  }, [lyricsState.doc.syncedLines]);

  const seekToLine = useCallback((line: LyricLine) => {
    // This should be connected to playback by caller
  }, []);

  return {
    canUndo: lyricsState.canUndo,
    canRedo: lyricsState.canRedo,
    activeLineId: lyricsState.activeLineId,
    selectedLineId: lyricsState.selectedLineId,
    tab: lyricsState.tab,
    syncDoc: lyricsState.doc,
    findActiveIndex,
    seekToLine,
  };
}