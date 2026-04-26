"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  LyricsStore,
  type LyricsState,
  type LyricsDoc,
  type LyricsMeta,
  type LyricsTabId,
  type LyricsHistoryState,
} from "@/lib/LyricsStore";

interface LyricsContextType {
  store: LyricsStore;
  state: LyricsState;
  sync: () => void;
}

const LyricsContext = createContext<LyricsContextType | null>(null);

export function LyricsProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new LyricsStore());
  const [state, setState] = useState(() => store.getState());

  const sync = useCallback(() => {
    setState(store.getState());
  }, [store]);

  const value = useMemo(() => ({ store, state, sync }), [store, state, sync]);

  return (
    <LyricsContext.Provider value={value}>{children}</LyricsContext.Provider>
  );
}

export function useLyricsStore() {
  const ctx = useContext(LyricsContext);
  if (!ctx) {
    throw new Error("useLyricsStore must be used within a LyricsProvider");
  }
  return ctx;
}

export function useLyrics() {
  const { state, store, sync } = useLyricsStore();

  const actions = useMemo(
    () => ({
      setTab: (tab: LyricsTabId) => {
        store.setTab(tab);
        sync();
      },
      setActiveLine: (lineId: string | null) => {
        store.setActiveLine(lineId);
        sync();
      },
      selectLine: (lineId: string) => {
        store.selectLine(lineId);
        sync();
      },
      selectByOffset: (offset: number) => {
        store.selectByOffset(offset);
        sync();
      },
      hydrateFromMedia: (input: {
        duration: number;
        title?: string;
        artist?: string;
      }) => {
        store.hydrateFromMedia(input);
        sync();
      },
      loadDraft: (doc: LyricsDoc, selectedLineId: string | null) => {
        store.loadDraft(doc, selectedLineId);
        sync();
      },
      setLineRangeLive: (lineId: string, start: number, end: number) => {
        store.setLineRangeLive(lineId, start, end);
        sync();
      },
      setLineRangeCommit: (
        lineId: string,
        start: number,
        end: number,
        baseState?: LyricsHistoryState,
      ) => {
        store.setLineRange(lineId, start, end, baseState);
        sync();
      },
      tapSync: (currentTime: number) => {
        store.tapSync(currentTime);
        sync();
      },
      toggleAutoSyncMode: () => {
        store.toggleAutoSyncMode();
        sync();
      },
      editText: (lineId: string, text: string) => {
        store.editText(lineId, text);
        sync();
      },
      insertAfter: (lineId: string) => {
        store.insertAfter(lineId);
        sync();
      },
      deleteLine: (lineId: string) => {
        store.deleteLine(lineId);
        sync();
      },
      reorder: (lineId: string, direction: "up" | "down") => {
        store.reorder(lineId, direction);
        sync();
      },
      splitLine: (lineId: string) => {
        store.splitLine(lineId);
        sync();
      },
      mergeWithPrevious: (lineId: string) => {
        store.mergeWithPrevious(lineId);
        sync();
      },
      nudgeLine: (lineId: string, edge: "start" | "end", delta: number) => {
        store.nudgeLine(lineId, edge, delta);
        sync();
      },
      setPlainLyrics: (text: string) => {
        store.setPlainLyrics(text);
        sync();
      },
      setMeta: (update: Partial<LyricsMeta>) => {
        store.setMeta(update);
        sync();
      },
      importFromLrc: (rawLrc: string) => {
        store.importFromLrc(rawLrc);
        sync();
      },
      exportToLrc: () => store.exportToLrc(),
      undo: () => {
        store.undo();
        sync();
      },
      redo: () => {
        store.redo();
        sync();
      },
      getHistoryState: () => store.getHistoryState(),
    }),
    [store, sync],
  );

  return { state, store, ...actions };
}

export type {
  LyricsState,
  LyricsDoc,
  LyricsMeta,
  LyricsTabId,
  LyricsHistoryState,
};
