import type { LyricsMeta, LyricsState, LyricsStore } from "../LyricsStore";
import type { MediaController } from "../MediaController";
import type { LyricLine } from "../lyricsTimeline";

export function createLyricsActions(params: {
  lyricsStore: LyricsStore;
  mediaController: MediaController;
  getCurrentTime: () => number;
}) {
  return {
    seekLine(line: LyricLine): void {
      params.lyricsStore.selectLine(line.id);
      params.mediaController.seek(line.start);
    },

    nudgeLine(line: LyricLine, edge: "start" | "end", delta: number): void {
      params.lyricsStore.nudgeLine(line.id, edge, delta);
    },

    setTab(tab: LyricsState["tab"]): void {
      params.lyricsStore.setTab(tab);
    },

    updateMetaField(key: keyof LyricsMeta, value: string): void {
      if (key === "offset") {
        params.lyricsStore.setMeta({
          offset: Number(value) || 0,
        });
        return;
      }

      params.lyricsStore.setMeta({
        [key]: value,
      });
    },

    tapSync(): void {
      params.lyricsStore.tapSync(params.getCurrentTime());
    },

    toggleAutoSyncMode(): void {
      params.lyricsStore.toggleAutoSyncMode();
    },

    undo(): void {
      params.lyricsStore.undo();
    },

    redo(): void {
      params.lyricsStore.redo();
    },

    editLineText(lineId: string, text: string): void {
      params.lyricsStore.editText(lineId, text);
    },

    selectLine(lineId: string): void {
      params.lyricsStore.selectLine(lineId);
    },

    reorder(lineId: string, direction: "up" | "down"): void {
      params.lyricsStore.reorder(lineId, direction);
    },

    insertAfter(lineId: string): void {
      params.lyricsStore.insertAfter(lineId);
    },

    split(lineId: string): void {
      params.lyricsStore.splitLine(lineId);
    },

    merge(lineId: string): void {
      params.lyricsStore.mergeWithPrevious(lineId);
    },

    delete(lineId: string): void {
      params.lyricsStore.deleteLine(lineId);
    },

    setPlainLyrics(value: string): void {
      params.lyricsStore.setPlainLyrics(value);
    },

    importLrc(rawLrc: string): void {
      params.lyricsStore.importFromLrc(rawLrc);
    },

    exportLrc(): string {
      return params.lyricsStore.exportToLrc();
    },
  };
}
