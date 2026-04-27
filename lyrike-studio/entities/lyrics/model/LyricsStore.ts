import { HistoryManager, type HistoryCommand } from "@/shared/utils/HistoryManager";
import { lrcToLyricsModel, lyricsModelToLrc, parseLrc, serializeLrc } from "@/lib/lrc";
import { buildSeedLyrics, type LyricLine, updateLyricTiming } from "./lyricsTimeline";

export type LyricsTabId = "synced" | "plain" | "meta";

export type LyricsMeta = {
  title: string;
  artist: string;
  album: string;
  by: string;
  offset: number;
};

export type LyricsDoc = {
  syncedLines: LyricLine[];
  plainLyrics: string;
  meta: LyricsMeta;
};

export type LyricsHistoryState = {
  doc: LyricsDoc;
  selectedLineId: string | null;
};

export type LyricsState = LyricsHistoryState & {
  tab: LyricsTabId;
  canUndo: boolean;
  canRedo: boolean;
  activeLineId: string | null;
  isAutoSyncEnabled: boolean;
};

const MIN_LINE_LENGTH = 0.24;

function createMeta(seed?: Partial<LyricsMeta>): LyricsMeta {
  return {
    title: seed?.title ?? "",
    artist: seed?.artist ?? "",
    album: seed?.album ?? "",
    by: seed?.by ?? "",
    offset: seed?.offset ?? 0,
  };
}

function toPlainLyrics(lines: LyricLine[]): string {
  return lines.map((line) => line.text).join("\n");
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sortByStart(lines: LyricLine[]): LyricLine[] {
  return [...lines].sort((a, b) => a.start - b.start);
}

function ensureSelectedLine(
  lines: LyricLine[],
  selectedLineId: string | null,
): string | null {
  if (lines.length === 0) {
    return null;
  }

  const current = lines.find((line) => line.id === selectedLineId);
  if (current) {
    return current.id;
  }

  return lines[0].id;
}

function createLineId(): string {
  return `line-${crypto.randomUUID()}`;
}

function applyDocWithSyncedLines(
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

export class LyricsStore {
  private state: LyricsState;
  private listeners = new Set<(state: LyricsState) => void>();
  private history = new HistoryManager<LyricsHistoryState>();

  constructor() {
    const lines = buildSeedLyrics(120);
    this.state = {
      doc: {
        syncedLines: lines,
        plainLyrics: toPlainLyrics(lines),
        meta: createMeta(),
      },
      selectedLineId: lines[0]?.id ?? null,
      tab: "synced",
      canUndo: false,
      canRedo: false,
      activeLineId: null,
      isAutoSyncEnabled: false,
    };
  }

  subscribe(listener: (state: LyricsState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): LyricsState {
    return this.state;
  }

  hydrateFromMedia(input: {
    duration: number;
    title?: string;
    artist?: string;
  }): void {
    const lines = buildSeedLyrics(input.duration || 120);
    const doc: LyricsDoc = {
      syncedLines: lines,
      plainLyrics: toPlainLyrics(lines),
      meta: createMeta({
        title: input.title ?? "",
        artist: input.artist ?? "",
      }),
    };

    this.history.clear();
    this.state = {
      ...this.state,
      doc,
      selectedLineId: lines[0]?.id ?? null,
      canUndo: false,
      canRedo: false,
      activeLineId: null,
      isAutoSyncEnabled: false,
    };
    this.emit();
  }

  setTab(tab: LyricsTabId): void {
    this.state = {
      ...this.state,
      tab,
    };
    this.emit();
  }

  setActiveLine(lineId: string | null): void {
    if (this.state.activeLineId === lineId) {
      return;
    }

    this.state = {
      ...this.state,
      activeLineId: lineId,
    };

    this.emit();
  }

  selectLine(lineId: string): void {
    if (this.state.selectedLineId === lineId) {
      return;
    }

    const exists = this.state.doc.syncedLines.some(
      (line) => line.id === lineId,
    );
    if (!exists) {
      return;
    }

    this.state = {
      ...this.state,
      selectedLineId: lineId,
    };
    this.emit();
  }

  clearSelection(): void {
    if (this.state.selectedLineId === null) {
      return;
    }

    this.state = {
      ...this.state,
      selectedLineId: null,
    };
    this.emit();
  }

  loadDraft(doc: LyricsDoc, selectedLineId: string | null): void {
    this.history.clear();
    const selected = ensureSelectedLine(doc.syncedLines, selectedLineId);
    this.state = {
      ...this.state,
      doc,
      selectedLineId: selected,
      canUndo: false,
      canRedo: false,
      activeLineId: selected,
    };
    this.emit();
  }

  selectByOffset(offset: number): void {
    const lines = this.state.doc.syncedLines;
    if (lines.length === 0) {
      return;
    }

    const currentIndex = lines.findIndex(
      (line) => line.id === this.state.selectedLineId,
    );
    const safeCurrent = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = clampNumber(safeCurrent + offset, 0, lines.length - 1);

    this.state = {
      ...this.state,
      selectedLineId: lines[nextIndex].id,
    };
    this.emit();
  }

  getHistoryState(): LyricsHistoryState {
    return {
      doc: this.state.doc,
      selectedLineId: this.state.selectedLineId,
    };
  }

  setLineRangeLive(lineId: string, start: number, end: number): void {
    const nextLines = updateLyricTiming(this.state.doc.syncedLines, lineId, {
      start,
      end,
    });
    this.state = {
      ...this.state,
      doc: applyDocWithSyncedLines(this.state.doc, nextLines),
    };
    this.emit();
  }

  setLineRange(
    lineId: string,
    start: number,
    end: number,
    baseState?: LyricsHistoryState,
  ): void {
    this.commit(
      "SetTimestamp",
      (scope) => {
        const nextLines = updateLyricTiming(scope.doc.syncedLines, lineId, {
          start,
          end,
        });
        return {
          ...scope,
          doc: applyDocWithSyncedLines(scope.doc, nextLines),
        };
      },
      baseState,
    );
  }

  tapSync(currentTime: number): void {
    const selectedLineId = this.state.selectedLineId;
    if (!selectedLineId) {
      return;
    }

    const lines = this.state.doc.syncedLines;
    const selectedIndex = lines.findIndex((line) => line.id === selectedLineId);
    if (selectedIndex < 0) {
      return;
    }

    this.commit("SetTimestamp", (scope) => {
      const baseLine = scope.doc.syncedLines[selectedIndex];
      const patchedLines = updateLyricTiming(
        scope.doc.syncedLines,
        selectedLineId,
        {
          start: currentTime,
          end: Math.max(baseLine.end, currentTime + MIN_LINE_LENGTH),
        },
      );
      const nextLines = sortByStart(patchedLines);
      const nextIndex = Math.min(selectedIndex + 1, nextLines.length - 1);
      return {
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
        selectedLineId: nextLines[nextIndex]?.id ?? selectedLineId,
      };
    });
  }

  toggleAutoSyncMode(): void {
    this.state = {
      ...this.state,
      isAutoSyncEnabled: !this.state.isAutoSyncEnabled,
    };
    this.emit();
  }

  editText(lineId: string, text: string): void {
    this.commit("EditText", (scope) => {
      const nextLines = scope.doc.syncedLines.map((line) => {
        if (line.id !== lineId) {
          return line;
        }
        return {
          ...line,
          text,
        };
      });

      return {
        ...scope,
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
      };
    });
  }

  insertAfter(lineId: string): void {
    this.commit("Insert", (scope) => {
      const lines = scope.doc.syncedLines;
      const index = lines.findIndex((line) => line.id === lineId);
      if (index < 0) {
        return scope;
      }

      const current = lines[index];
      const next = lines[index + 1];
      const start = Number((current.end + MIN_LINE_LENGTH).toFixed(2));
      const endBound = next ? next.start - MIN_LINE_LENGTH : current.end + 4;
      const end = Number(
        Math.max(start + MIN_LINE_LENGTH, endBound).toFixed(2),
      );

      const inserted: LyricLine = {
        id: createLineId(),
        start,
        end,
        text: "new line",
      };

      const nextLines = [
        ...lines.slice(0, index + 1),
        inserted,
        ...lines.slice(index + 1),
      ];
      return {
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
        selectedLineId: inserted.id,
      };
    });
  }

  /**
   * Inserts a new lyric line within a specific time range (gap).
   */
  insertAtRange(start: number, end: number): void {
    this.commit("Insert", (scope) => {
      const inserted: LyricLine = {
        id: createLineId(),
        start,
        end,
        text: "new line",
      };

      const nextLines = sortByStart([...scope.doc.syncedLines, inserted]);
      return {
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
        selectedLineId: inserted.id,
      };
    });
  }

  deleteLine(lineId: string): void {
    this.commit("Delete", (scope) => {
      const lines = scope.doc.syncedLines;
      if (lines.length <= 1) {
        return scope;
      }

      const index = lines.findIndex((line) => line.id === lineId);
      if (index < 0) {
        return scope;
      }

      const nextLines = lines.filter((line) => line.id !== lineId);
      return {
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
        selectedLineId:
          nextLines[Math.max(0, index - 1)]?.id ?? nextLines[0]?.id ?? null,
      };
    });
  }

  reorder(lineId: string, direction: "up" | "down"): void {
    this.commit("Reorder", (scope) => {
      const nextLines = [...scope.doc.syncedLines];
      const index = nextLines.findIndex((line) => line.id === lineId);
      if (index < 0) {
        return scope;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= nextLines.length) {
        return scope;
      }

      const [current] = nextLines.splice(index, 1);
      nextLines.splice(targetIndex, 0, current);

      return {
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
        selectedLineId: current.id,
      };
    });
  }

  splitLine(lineId: string): void {
    this.commit("Split", (scope) => {
      const lines = scope.doc.syncedLines;
      const index = lines.findIndex((line) => line.id === lineId);
      if (index < 0) {
        return scope;
      }

      const line = lines[index];
      const midpoint = Number(((line.start + line.end) / 2).toFixed(2));
      const parts = line.text.trim().split(/\s+/);
      const cutAt = Math.max(1, Math.floor(parts.length / 2));
      const leftText = parts.slice(0, cutAt).join(" ") || line.text;
      const rightText = parts.slice(cutAt).join(" ") || "continued";

      const first: LyricLine = {
        ...line,
        end: Math.max(line.start + MIN_LINE_LENGTH, midpoint),
        text: leftText,
      };
      const second: LyricLine = {
        id: createLineId(),
        start: Math.min(
          first.end + MIN_LINE_LENGTH,
          line.end - MIN_LINE_LENGTH,
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
      return {
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
        selectedLineId: second.id,
      };
    });
  }

  mergeWithPrevious(lineId: string): void {
    this.commit("Merge", (scope) => {
      const lines = scope.doc.syncedLines;
      const index = lines.findIndex((line) => line.id === lineId);
      if (index <= 0) {
        return scope;
      }

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

      return {
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
        selectedLineId: merged.id,
      };
    });
  }

  nudgeLine(lineId: string, edge: "start" | "end", delta: number): void {
    this.commit("SetTimestamp", (scope) => {
      const line = scope.doc.syncedLines.find((item) => item.id === lineId);
      if (!line) {
        return scope;
      }

      const patch =
        edge === "start"
          ? { start: line.start + delta }
          : { end: line.end + delta };
      const nextLines = updateLyricTiming(scope.doc.syncedLines, lineId, patch);
      return {
        ...scope,
        doc: applyDocWithSyncedLines(scope.doc, nextLines),
      };
    });
  }

  setPlainLyrics(text: string): void {
    this.commit("EditText", (scope) => ({
      ...scope,
      doc: {
        ...scope.doc,
        plainLyrics: text,
      },
    }));
  }

  setMeta(update: Partial<LyricsMeta>): void {
    this.commit("EditText", (scope) => ({
      ...scope,
      doc: {
        ...scope.doc,
        meta: {
          ...scope.doc.meta,
          ...update,
        },
      },
    }));
  }

  importFromLrc(rawLrc: string): void {
    const parsed = parseLrc(rawLrc);
    const fallbackDuration = this.state.doc.syncedLines.reduce(
      (acc, line) => Math.max(acc, line.end),
      0,
    );
    const model = lrcToLyricsModel(parsed, fallbackDuration);

    this.history.clear();
    this.state = {
      ...this.state,
      doc: {
        syncedLines: model.lines.map((line, index) => ({
          id: `line-${index + 1}`,
          start: line.start,
          end: line.end,
          text: line.text,
        })),
        plainLyrics: model.plainLyrics,
        meta: {
          ...this.state.doc.meta,
          ...model.meta,
        },
      },
      selectedLineId: `line-1`,
      activeLineId: `line-1`,
      canUndo: false,
      canRedo: false,
    };
    this.emit();
  }

  exportToLrc(): string {
    const doc = lyricsModelToLrc({
      meta: {
        title: this.state.doc.meta.title,
        artist: this.state.doc.meta.artist,
        album: this.state.doc.meta.album,
        by: this.state.doc.meta.by,
        offset: this.state.doc.meta.offset,
      },
      lines: this.state.doc.syncedLines.map((line) => ({
        start: line.start,
        end: line.end,
        text: line.text,
      })),
      plainLyrics: this.state.doc.plainLyrics,
    });

    return serializeLrc(doc);
  }

  undo(): void {
    const historyState: LyricsHistoryState = {
      doc: this.state.doc,
      selectedLineId: this.state.selectedLineId,
    };

    const previous = this.history.undo(historyState);
    this.state = {
      ...this.state,
      doc: previous.doc,
      selectedLineId: ensureSelectedLine(
        previous.doc.syncedLines,
        previous.selectedLineId,
      ),
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    };
    this.emit();
  }

  redo(): void {
    const historyState: LyricsHistoryState = {
      doc: this.state.doc,
      selectedLineId: this.state.selectedLineId,
    };

    const next = this.history.redo(historyState);
    this.state = {
      ...this.state,
      doc: next.doc,
      selectedLineId: ensureSelectedLine(
        next.doc.syncedLines,
        next.selectedLineId,
      ),
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    };
    this.emit();
  }

  private commit(
    label: string,
    updater: (scope: LyricsHistoryState) => LyricsHistoryState,
    baseState?: LyricsHistoryState,
  ): void {
    const current: LyricsHistoryState = baseState ?? {
      doc: this.state.doc,
      selectedLineId: this.state.selectedLineId,
    };

    const command: HistoryCommand<LyricsHistoryState> = {
      label,
      apply: updater,
    };

    const next = this.history.execute(command, current);
    this.state = {
      ...this.state,
      doc: next.doc,
      selectedLineId: ensureSelectedLine(
        next.doc.syncedLines,
        next.selectedLineId,
      ),
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    };
    this.emit();
  }

  private emit(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => {
      listener(snapshot);
    });
  }
}
