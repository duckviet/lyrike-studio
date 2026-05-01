"use client";

import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import type { LyricsState, LyricsDoc, LyricsTabId, LyricLine } from "@/entities/lyrics";
import type { ParsedLineEdit } from "@/features/lyrics-edit/model/useSyncedTextEdit";

export interface EditorLyricsState {
  doc: LyricsDoc;
  selectedLineId: string | null;
  tab: LyricsTabId;
  activeLineId: string | null;
  isAutoSyncEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export interface EditorLyricsActions {
  setTab: (tab: LyricsTabId) => void;
  setActiveLine: (lineId: string | null) => void;
  selectLine: (lineId: string | null) => void;
  editText: (lineId: string, text: string) => void;
  setLineRangeLive: (lineId: string, start: number, end: number) => void;
  setLineRange: (lineId: string, start: number, end: number) => void;
  insertAfter: (lineId: string) => void;
  insertAtRange: (start: number, end: number) => void;
  deleteLine: (lineId: string) => void;
  deleteGap: (gapStart: number, gapEnd: number, prevLineId: string | null, nextLineId: string | null) => void;
  reorder: (lineId: string, direction: "up" | "down") => void;
  splitLine: (lineId: string) => void;
  mergeWithPrevious: (lineId: string) => void;
  nudgeLine: (lineId: string, edge: "start" | "end", delta: number) => void;
  setPlainLyrics: (text: string) => void;
  setMeta: (update: Partial<{ title: string; artist: string; album: string; by: string; offset: number }>) => void;
  importFromLrc: (rawLrc: string) => void;
  exportToLrc: () => string;
  applyTextEdits: (edits: ParsedLineEdit[]) => void;
  undo: () => void;
  redo: () => void;
}

export function useEditorLyricsState(): [EditorLyricsState, EditorLyricsActions] {
  const doc = useLyricsStore((s) => s.doc);
  const selectedLineId = useLyricsStore((s) => s.selectedLineId);
  const tab = useLyricsStore((s) => s.tab);
  const activeLineId = useLyricsStore((s) => s.activeLineId);
  const isAutoSyncEnabled = useLyricsStore((s) => s.isAutoSyncEnabled);
  
  const setTab = useLyricsStore((s) => s.setTab);
  const setActiveLine = useLyricsStore((s) => s.setActiveLine);
  const selectLine = useLyricsStore((s) => s.selectLine);
  const editText = useLyricsStore((s) => s.editText);
  const setLineRangeLive = useLyricsStore((s) => s.setLineRangeLive);
  const setLineRange = useLyricsStore((s) => s.setLineRange);
  const insertAfter = useLyricsStore((s) => s.insertAfter);
  const insertAtRange = useLyricsStore((s) => s.insertAtRange);
  const deleteLine = useLyricsStore((s) => s.deleteLine);
  const deleteGap = useLyricsStore((s) => s.deleteGap);
  const reorder = useLyricsStore((s) => s.reorder);
  const splitLine = useLyricsStore((s) => s.splitLine);
  const mergeWithPrevious = useLyricsStore((s) => s.mergeWithPrevious);
  const nudgeLine = useLyricsStore((s) => s.nudgeLine);
  const setPlainLyrics = useLyricsStore((s) => s.setPlainLyrics);
  const setMeta = useLyricsStore((s) => s.setMeta);
  const importFromLrc = useLyricsStore((s) => s.importFromLrc);
  const exportToLrc = useLyricsStore((s) => s.exportToLrc);
  const applyTextEdits = useLyricsStore((s) => s.applyTextEdits);
  const undo = useLyricsStore((s) => s.undo);
  const redo = useLyricsStore((s) => s.redo);

  const clearSelection = useLyricsStore((s) => s.clearSelection);

  const state: EditorLyricsState = {
    doc,
    selectedLineId,
    tab,
    activeLineId,
    isAutoSyncEnabled,
    canUndo: false,
    canRedo: false,
  };

  const actions: EditorLyricsActions = {
    setTab,
    setActiveLine,
    selectLine: (lineId: string | null) => {
      if (lineId === null) {
        clearSelection();
      } else {
        selectLine(lineId);
      }
    },
    editText,
    setLineRangeLive,
    setLineRange,
    insertAfter,
    insertAtRange,
    deleteLine,
    deleteGap,
    reorder,
    splitLine,
    mergeWithPrevious,
    nudgeLine,
    setPlainLyrics,
    setMeta,
    importFromLrc,
    exportToLrc,
    applyTextEdits,
    undo,
    redo,
  };

  return [state, actions];
}