import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { HistoryManager } from "@/shared/utils/HistoryManager";
import type { LyricsTabId } from "../config/enums";
import type { LyricsMeta, LyricsDoc } from "../model/types";
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
  canUndo: boolean;
  canRedo: boolean;
};

export type LyricsStoreActions = {
  setTab: (tab: LyricsTabId) => void;
  setActiveLine: (lineId: string | null) => void;
  selectLine: (lineId: string) => void;
  clearSelection: () => void;
  loadDraft: (doc: LyricsDoc, selectedLineId: string | null) => void;
  selectByOffset: (offset: number) => void;
  setLineRangeLive: (lineId: string, start: number, end: number) => void;
  setLineRange: (
    lineId: string,
    start: number,
    end: number,
    baseState?: LyricsHistoryState | null,
  ) => void;
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
  splitAtTime: (time: number) => void;
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
  subscribeWithSelector((set, get) => {
    const historyManager = new HistoryManager<LyricsHistoryState>();
    const lastEditTimes = new Map<string, number>();

    const commit = (
      label: string,
      updater: (state: LyricsHistoryState) => LyricsHistoryState,
      debounceKey?: string,
      baseState?: LyricsHistoryState | null,
    ) => {
      const { doc, selectedLineId } = get();
      const current: LyricsHistoryState = baseState || { doc, selectedLineId };

      const now = Date.now();
      const lastEditTime = debounceKey
        ? (lastEditTimes.get(debounceKey) ?? 0)
        : 0;
      const replaceLast = debounceKey ? now - lastEditTime < 1500 : false;
      if (debounceKey) lastEditTimes.set(debounceKey, now);

      const next = historyManager.execute(
        { label, apply: updater },
        current,
        replaceLast,
      );
      set({
        ...next,
        canUndo: historyManager.canUndo(),
        canRedo: historyManager.canRedo(),
      });
    };

    const actionSet = (label: string) => (patch: Partial<LyricsStoreState>) => {
      const trackedPatch: Partial<LyricsHistoryState> = {};
      const otherPatch: Partial<LyricsStoreState> = {};
      let hasTracked = false;

      Object.keys(patch).forEach((key) => {
        const k = key as keyof LyricsStoreState;
        if (k === "doc") {
          trackedPatch.doc = patch.doc;
          hasTracked = true;
        } else if (k === "selectedLineId") {
          trackedPatch.selectedLineId = patch.selectedLineId;
          hasTracked = true;
        } else {
          // @ts-expect-error - dynamic assignment
          otherPatch[k] = patch[k];
        }
      });

      if (hasTracked) {
        commit(label, (state) => ({ ...state, ...trackedPatch }));
        if (Object.keys(otherPatch).length > 0) {
          set(otherPatch);
        }
      } else {
        set(patch);
      }
    };

    return {
      doc: initialDoc,
      selectedLineId: initialDoc.syncedLines[0]?.id ?? null,
      tab: "synced",
      activeLineId: null,
      isAutoSyncEnabled: false,
      canUndo: false,
      canRedo: false,

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
        const nextLines = utils.updateLyricTimingWithPush(
          doc.syncedLines,
          lineId,
          {
            start,
            end,
          },
        );
        set({ doc: utils.applyDocLive(doc, nextLines) });
      },

      setLineRange: (lineId, start, end, baseState) => {
        commit(
          "Resize region",
          (state) => {
            const nextLines = utils.updateLyricTimingWithPush(
              state.doc.syncedLines,
              lineId,
              { start, end },
            );
            const newDoc = utils.applyDocWithSyncedLines(state.doc, nextLines);
            const newSelected = utils.ensureSelectedLine(
              newDoc.syncedLines,
              state.selectedLineId,
            );
            return { doc: newDoc, selectedLineId: newSelected };
          },
          undefined,
          baseState,
        );
      },

      toggleAutoSyncMode: () => {
        const { isAutoSyncEnabled } = get();
        set({ isAutoSyncEnabled: !isAutoSyncEnabled });
      },

      editText: (lineId, text) => {
        commit(
          "Edit text",
          (state) => {
            const nextLines = state.doc.syncedLines.map((line) =>
              line.id === lineId ? { ...line, text } : line,
            );
            return {
              ...state,
              doc: utils.applyDocWithSyncedLines(state.doc, nextLines),
            };
          },
          "edit-text",
        );
      },

      setPlainLyrics: (text) => {
        commit(
          "Edit plain lyrics",
          (state) => ({
            ...state,
            doc: { ...state.doc, plainLyrics: text },
          }),
          "edit-plain",
        );
      },

      setMeta: (update) => {
        commit("Update meta", (state) => ({
          ...state,
          doc: { ...state.doc, meta: { ...state.doc.meta, ...update } },
        }));
      },

      importFromLrc: (rawLrc) => {
        commit("Import LRC", (state) => {
          const parsed = utils.parseLrc(rawLrc);
          const model = utils.lrcToLyricsModel(parsed);

          const syncedLines = model.lines.map((l) => ({
            ...l,
            id: utils.createLineId(),
          }));

          const mergedMeta = { ...state.doc.meta };
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
            state.selectedLineId,
          );

          return {
            doc: nextDoc,
            selectedLineId: newSelected,
          };
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
        commit(
          "Apply text edits",
          (state) => {
            const currentLines = state.doc.syncedLines;

            const nextLines = edits.map((edit) => {
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

            const newDoc = utils.applyDocWithSyncedLines(state.doc, nextLines);
            const newSelected = utils.ensureSelectedLine(
              newDoc.syncedLines,
              state.selectedLineId,
            );
            return { doc: newDoc, selectedLineId: newSelected };
          },
          "apply-text-edits",
        );
      },

      undo: () => {
        const { doc, selectedLineId } = get();
        const current = { doc, selectedLineId };
        const next = historyManager.undo(current);
        set({
          ...next,
          canUndo: historyManager.canUndo(),
          canRedo: historyManager.canRedo(),
        });
      },

      redo: () => {
        const { doc, selectedLineId } = get();
        const current = { doc, selectedLineId };
        const next = historyManager.redo(current);
        set({
          ...next,
          canUndo: historyManager.canUndo(),
          canRedo: historyManager.canRedo(),
        });
      },

      // Complex actions delegated to actions builder
      tapSync: actions.buildTapSyncAction(actionSet("Tap sync"), get),
      insertAfter: actions.buildInsertAfterAction(
        actionSet("Insert line"),
        get,
      ),
      insertAtRange: actions.buildInsertAtRangeAction(
        actionSet("Insert gap"),
        get,
      ),
      deleteGap: actions.buildDeleteGapAction(actionSet("Delete gap"), get),
      deleteLine: actions.buildDeleteLineAction(actionSet("Delete line"), get),
      reorder: actions.buildReorderAction(actionSet("Reorder line"), get),
      splitAtTime: actions.buildSplitAtTimeAction(actionSet("Split line"), get),
      splitLine: actions.buildSplitLineAction(actionSet("Split line"), get),
      mergeWithPrevious: actions.buildMergeAction(
        actionSet("Merge lines"),
        get,
      ),
      nudgeLine: actions.buildNudgeLineAction(actionSet("Nudge line"), get),
      hydrateFromMedia: actions.buildHydrateFromMediaAction(
        actionSet("Hydrate media"),
      ),
    };
  }),
);
