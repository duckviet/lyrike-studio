import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { temporal } from "zundo";
import type { LyricsTabId } from "../config/enums";
import type { LyricsMeta, LyricsDoc } from "../types";
import * as utils from "../model/lyricsUtils";
import * as actions from "../model/lyricsActions";
import type { ParsedLineEdit } from "@/features/lyrics-edit/model/useSyncedTextEdit";

export type LyricsHistoryState = {
  doc: LyricsDoc;
  selectedLineId: string | null;
};

export type LyricsStoreState = LyricsHistoryState & {
  tab: LyricsTabId;
  activeLineId: string | null;
  isAutoSyncEnabled: boolean;
};

export type LyricsStoreActions = {
  setTab: (tab: LyricsTabId) => void;
  setActiveLine: (lineId: string | null) => void;
  selectLine: (lineId: string) => void;
  clearSelection: () => void;
  loadDraft: (doc: LyricsDoc, selectedLineId: string | null) => void;
  selectByOffset: (offset: number) => void;
  setLineRangeLive: (lineId: string, start: number, end: number) => void;
  setLineRange: (lineId: string, start: number, end: number) => void;
  tapSync: (currentTime: number) => void;
  toggleAutoSyncMode: () => void;
  editText: (lineId: string, text: string) => void;
  insertAfter: (lineId: string) => void;
  insertAtRange: (start: number, end: number) => void;
  deleteGap: (
    gapStart: number,
    gapEnd: number,
    prevLineId: string | null,
    nextLineId: string | null,
  ) => void;
  deleteLine: (lineId: string) => void;
  reorder: (lineId: string, direction: "up" | "down") => void;
  splitLine: (lineId: string) => void;
  mergeWithPrevious: (lineId: string) => void;
  nudgeLine: (lineId: string, edge: "start" | "end", delta: number) => void;
  undo: () => void;
  redo: () => void;
  setPlainLyrics: (text: string) => void;
  setMeta: (update: Partial<LyricsMeta>) => void;
  importFromLrc: (rawLrc: string) => void;
  exportToLrc: () => string;
  applyTextEdits: (edits: ParsedLineEdit[]) => void;
  hydrateFromMedia: (input: {
    duration: number;
    title?: string;
    artist?: string;
  }) => void;
};

export type LyricsStore = LyricsStoreState & LyricsStoreActions;

const initialDoc = utils.buildInitialDoc();

export const useLyricsStore = create<LyricsStore>()(
  subscribeWithSelector(
    temporal(
      (set, get) => ({
        doc: initialDoc,
        selectedLineId: initialDoc.syncedLines[0]?.id ?? null,
        tab: "synced",
        activeLineId: null,
        isAutoSyncEnabled: false,

        setTab: (tab) => set({ tab }),

        setActiveLine: (lineId) => {
          const { activeLineId } = get();
          if (activeLineId === lineId) return;
          set({ activeLineId: lineId });
        },

        selectLine: (lineId) => {
          const { doc } = get();
          const exists = doc.syncedLines.some((line) => line.id === lineId);
          if (!exists) return;
          set({ selectedLineId: lineId });
        },

        clearSelection: () => set({ selectedLineId: null }),

        loadDraft: (doc, selectedLineId) => {
          const selected = utils.ensureSelectedLine(
            doc.syncedLines,
            selectedLineId,
          );
          set({
            doc,
            selectedLineId: selected,
            activeLineId: selected,
          });
        },

        selectByOffset: (offset) => {
          const { doc, selectedLineId } = get();
          const lines = doc.syncedLines;
          if (lines.length === 0) return;
          const currentIndex = lines.findIndex(
            (line) => line.id === selectedLineId,
          );
          const safeCurrent = currentIndex >= 0 ? currentIndex : 0;
          const nextIndex = utils.clampNumber(
            safeCurrent + offset,
            0,
            lines.length - 1,
          );
          set({ selectedLineId: lines[nextIndex].id });
        },

        setLineRangeLive: (lineId, start, end) => {
          const { doc } = get();
          const nextLines = utils.updateLyricTiming(doc.syncedLines, lineId, {
            start,
            end,
          });
          set({ doc: utils.applyDocLive(doc, nextLines) });
        },

        setLineRange: (lineId, start, end) => {
          const { doc, selectedLineId } = get();
          const nextLines = utils.updateLyricTiming(doc.syncedLines, lineId, {
            start,
            end,
          });
          const newDoc = utils.applyDocWithSyncedLines(doc, nextLines);
          const newSelected = utils.ensureSelectedLine(
            newDoc.syncedLines,
            selectedLineId,
          );
          set({ doc: newDoc, selectedLineId: newSelected });
        },

        toggleAutoSyncMode: () => {
          const { isAutoSyncEnabled } = get();
          set({ isAutoSyncEnabled: !isAutoSyncEnabled });
        },

        editText: (lineId, text) => {
          const { doc } = get();
          const nextLines = doc.syncedLines.map((line) =>
            line.id === lineId ? { ...line, text } : line,
          );
          set({ doc: utils.applyDocWithSyncedLines(doc, nextLines) });
        },

        setPlainLyrics: (text) => {
          const { doc } = get();
          set({ doc: { ...doc, plainLyrics: text } });
        },

        setMeta: (update) => {
          const { doc } = get();
          set({ doc: { ...doc, meta: { ...doc.meta, ...update } } });
        },

        importFromLrc: (rawLrc) => {
          const { doc, selectedLineId } = get();
          const parsed = utils.parseLrc(rawLrc);
          const model = utils.lrcToLyricsModel(parsed);

          const syncedLines = model.lines.map((l: any) => ({
            ...l,
            id: utils.createLineId(),
          }));

          const mergedMeta = { ...doc.meta };
          if (model.meta.title) mergedMeta.title = model.meta.title;
          if (model.meta.artist) mergedMeta.artist = model.meta.artist;
          if (model.meta.album) mergedMeta.album = model.meta.album;
          if (model.meta.by) mergedMeta.by = model.meta.by;
          if (model.meta.offset !== 0) mergedMeta.offset = model.meta.offset;

          const nextDoc: LyricsDoc = {
            meta: mergedMeta,
            syncedLines,
            plainLyrics: model.plainLyrics,
          };

          const newSelected = utils.ensureSelectedLine(
            nextDoc.syncedLines,
            selectedLineId,
          );

          set({
            doc: nextDoc,
            selectedLineId: newSelected,
            activeLineId: newSelected,
          });
        },

        exportToLrc: () => {
          const { doc } = get();
          const parsed = utils.lyricsModelToLrc({
            meta: doc.meta,
            lines: doc.syncedLines,
            plainLyrics: doc.plainLyrics,
          });
          return utils.serializeLrc(parsed);
        },

        applyTextEdits: (edits) => {
          const { doc, selectedLineId } = get();
          const currentLines = doc.syncedLines;

          const nextLines = edits.map((edit, index) => {
            if (edit.id) {
              const existing = currentLines.find((l) => l.id === edit.id);
              if (existing) {
                return {
                  ...existing,
                  start: edit.start,
                  end: edit.end,
                  text: edit.text,
                };
              }
            }

            return {
              id: utils.createLineId(),
              start: edit.start,
              end: edit.end,
              text: edit.text,
            };
          });

          const newDoc = utils.applyDocWithSyncedLines(doc, nextLines);
          const newSelected = utils.ensureSelectedLine(
            newDoc.syncedLines,
            selectedLineId,
          );
          set({ doc: newDoc, selectedLineId: newSelected });
        },

        undo: () => {
          /* TODO: temporal store integration */
        },

        redo: () => {
          /* TODO: temporal store integration */
        },

        // Complex actions delegated to actions builder
        tapSync: actions.buildTapSyncAction(set, get),
        insertAfter: actions.buildInsertAfterAction(set, get),
        insertAtRange: actions.buildInsertAtRangeAction(set, get),
        deleteGap: actions.buildDeleteGapAction(set, get),
        deleteLine: actions.buildDeleteLineAction(set, get),
        reorder: actions.buildReorderAction(set, get),
        splitLine: actions.buildSplitLineAction(set, get),
        mergeWithPrevious: actions.buildMergeAction(set, get),
        nudgeLine: actions.buildNudgeLineAction(set, get),
        hydrateFromMedia: actions.buildHydrateFromMediaAction(set),
      }),
      {
        limit: 50,
        partialize: (state) => ({
          doc: state.doc,
          selectedLineId: state.selectedLineId,
        }),
      },
    ),
  ),
);
