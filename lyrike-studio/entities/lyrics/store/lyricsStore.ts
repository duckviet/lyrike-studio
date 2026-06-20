import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { HistoryManager } from "@/shared/utils/HistoryManager";
import type { LyricsTabId } from "../config/enums";
import type { LyricsMeta, LyricsDoc } from "../model/types";
import * as utils from "../model/lyricsUtils";
import * as actions from "../model/lyricsActions";
import * as wordTiming from "../model/wordTiming";
import type { ParsedLineEdit } from "@/features/lyrics-edit/model/useSyncedTextEdit";

export type LyricsHistoryState = {
  doc: LyricsDoc;
  selectedLineId: string | null;
};

export type LyricsStoreState = LyricsHistoryState & {
  tab: LyricsTabId;
  activeLineId: string | null;
  activeWordId: string | null;
  isAutoSyncEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  focusLineId: string | null;
  selectedWordId: string | null;
};

export type LyricsStoreActions = {
  setTab: (tab: LyricsTabId) => void;
  setActiveLine: (lineId: string | null) => void;
  selectLine: (lineId: string) => void;
  clearSelection: () => void;
  setFocusLine: (lineId: string | null) => void;
  loadDraft: (doc: LyricsDoc, selectedLineId: string | null) => void;
  selectByOffset: (offset: number) => void;
  setLineRangeLive: (lineId: string, start: number, end: number) => void;
  setLineRange: (
    lineId: string,
    start: number,
    end: number,
    baseState?: LyricsHistoryState | null,
  ) => void;
  setWordRangeLive: (
    lineId: string,
    wordId: string,
    start: number,
    end: number,
  ) => void;
  setWordRange: (
    lineId: string,
    wordId: string,
    start: number,
    end: number,
    baseState?: LyricsHistoryState | null,
  ) => void;
  selectWord: (lineId: string, wordId: string) => void;
  clearWordSelection: () => void;
  setActiveWord: (wordId: string | null) => void;
  tapSync: (currentTime: number) => void;
  toggleAutoSyncMode: () => void;
  editText: (lineId: string, text: string) => void;
  setWordText: (lineId: string, wordId: string, text: string) => void;
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
      activeWordId: null,
      isAutoSyncEnabled: false,
      canUndo: false,
      canRedo: false,
      focusLineId: null,
      selectedWordId: null,

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

      selectWord: (lineId, wordId) => {
        const { doc } = get();
        const line = doc.syncedLines.find((l) => l.id === lineId);
        const word = line?.words?.find((w) => w.id === wordId);
        if (!line || !word) return;
        set({ selectedLineId: lineId, selectedWordId: wordId });
      },

      clearWordSelection: () => set({ selectedWordId: null }),

      setActiveWord: (wordId) => {
        const { activeWordId } = get();
        if (activeWordId === wordId) return;
        set({ activeWordId: wordId });
      },

      setFocusLine: (lineId) => set({ focusLineId: lineId }),

      loadDraft: (doc, selectedLineId) => {
        const normalizedDoc: LyricsDoc = {
          ...doc,
          syncedLines: doc.syncedLines.map((line) => {
            const withIds = utils.assignWordIdsForLine(line);
            return wordTiming.normalizeWordsWithinLine(withIds);
          }),
        };
        const selected = utils.ensureSelectedLine(
          normalizedDoc.syncedLines,
          selectedLineId,
        );
        set({
          doc: normalizedDoc,
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
        const originalLine = doc.syncedLines.find((l) => l.id === lineId);
        if (!originalLine) return;
        const nextLines = utils.updateLyricTimingWithPush(
          doc.syncedLines,
          lineId,
          {
            start,
            end,
          },
        );
        const updatedLine = nextLines.find((l) => l.id === lineId);
        if (!updatedLine) return;
        const lineWithWords = wordTiming.updateLineWordsForRangeChange(
          originalLine,
          updatedLine.start,
          updatedLine.end,
        );
        const withWords = nextLines.map((line) =>
          line.id === lineId ? lineWithWords : line,
        );
        set({ doc: utils.applyDocLive(doc, withWords) });
      },

      setLineRange: (lineId, start, end, baseState) => {
        commit(
          "Resize region",
          (state) => {
            const originalLine = state.doc.syncedLines.find(
              (l) => l.id === lineId,
            );
            if (!originalLine) return state;
            const nextLines = utils.updateLyricTimingWithPush(
              state.doc.syncedLines,
              lineId,
              { start, end },
            );
            const updatedLine = nextLines.find((l) => l.id === lineId);
            if (!updatedLine) return state;
            const lineWithWords = wordTiming.updateLineWordsForRangeChange(
              originalLine,
              updatedLine.start,
              updatedLine.end,
            );
            const withWords = nextLines.map((line) =>
              line.id === lineId ? lineWithWords : line,
            );
            const newDoc = utils.applyDocWithSyncedLines(state.doc, withWords);
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

      setWordRangeLive: (lineId, wordId, start, end) => {
        const { doc } = get();
        const line = doc.syncedLines.find((l) => l.id === lineId);
        if (!line || !line.words) return;
        const wordIndex = line.words.findIndex((w) => w.id === wordId);
        if (wordIndex < 0) return;

        const nextWords = wordTiming.updateWordRange(
          line.words,
          wordIndex,
          start,
          end,
          line.start,
          line.end,
        );
        const nextLines = doc.syncedLines.map((l) =>
          l.id === lineId ? { ...l, words: nextWords } : l,
        );
        set({ doc: utils.applyDocLive(doc, nextLines) });
      },

      setWordRange: (lineId, wordId, start, end, baseState) => {
        commit(
          "Resize word",
          (state) => {
            const line = state.doc.syncedLines.find((l) => l.id === lineId);
            if (!line || !line.words) return state;
            const wordIndex = line.words.findIndex((w) => w.id === wordId);
            if (wordIndex < 0) return state;

            const nextWords = wordTiming.updateWordRange(
              line.words,
              wordIndex,
              start,
              end,
              line.start,
              line.end,
            );
            const nextLines = state.doc.syncedLines.map((l) =>
              l.id === lineId ? { ...l, words: nextWords } : l,
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
              line.id === lineId ? { ...line, text, words: undefined } : line,
            );
            return {
              ...state,
              doc: utils.applyDocWithSyncedLines(state.doc, nextLines),
            };
          },
          "edit-text",
        );
      },

      setWordText: (lineId, wordId, text) => {
        commit(
          "Edit word text",
          (state) => {
            const line = state.doc.syncedLines.find((l) => l.id === lineId);
            if (!line || !line.words) return state;
            const word = line.words.find((w) => w.id === wordId);
            if (!word) return state;

            const nextWords = line.words.map((w) =>
              w.id === wordId ? { ...w, text } : w,
            );
            const nextLine = {
              ...line,
              words: nextWords,
              text: wordTiming.deriveLineTextFromWords(nextWords),
            };
            const nextLines = state.doc.syncedLines.map((l) =>
              l.id === lineId ? nextLine : l,
            );
            return {
              ...state,
              doc: utils.applyDocWithSyncedLines(state.doc, nextLines),
            };
          },
          "edit-word-text",
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

          const syncedLines = model.lines.map((l) => {
            const withId = { ...l, id: utils.createLineId() };
            const withWordIds = utils.assignWordIdsForLine(withId);
            return wordTiming.normalizeWordsWithinLine(withWordIds);
          });

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
                  if (edit.words) {
                    return {
                      ...existing,
                      start: edit.start,
                      end: edit.end,
                      text: edit.text,
                      words: edit.words,
                    };
                  }
                  const textChanged = existing.text !== edit.text;
                  return {
                    ...existing,
                    start: edit.start,
                    end: edit.end,
                    text: edit.text,
                    words: textChanged ? undefined : existing.words,
                  };
                }
              }

              return {
                id: utils.createLineId(),
                start: edit.start,
                end: edit.end,
                text: edit.text,
                words: edit.words,
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
