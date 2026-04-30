import type { LyricsState } from "@/entities/lyrics/types";
import type { FetchMediaResponse, PeaksResponse } from "@/lib/api";
import type { PublishFlowState } from "@/features/publish";
import type { MediaController, WaveformController } from "@/entities/media";
import type { LyricLine, LyricsMeta } from "@/entities/lyrics";

export type LoadState = "idle" | "loading" | "ready" | "error";

export interface EditorState {
  activeTab: "source" | "timeline" | "lyrics";
  lyricsState: LyricsState;
  mediaInfo: FetchMediaResponse | null;
  peaksInfo: PeaksResponse | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoomLevel: number;
  waveScrollLeft: number;
  wavePxPerSec: number;
  loopEnabled: boolean;
  fetchState: LoadState;
  sourceMessage: string;
  transcribeState: string;
  peaksState: LoadState;
  peaksMessage: string;
  publishState: PublishFlowState | null;
  isSidebarCollapsed: boolean;
}

export interface EditorActions {
  setActiveTab: (tab: "source" | "timeline" | "lyrics") => void;
  sourceInput: string;
  setSourceInput: (value: string) => void;
  handleFetch: () => Promise<void>;
  handleTranscribe: () => Promise<void>;
  handlePublish: () => Promise<void>;
  handleZoomChange: (px: number) => void;
  handleScroll: (px: number) => void;
  handleSeekTo: (time: number) => void;
  handleSeekBy: (delta: number) => void;
  handlePlayPause: () => void;
  undo: () => void;
  redo: () => void;
  toggleSidebar: () => void;
  saveDraft: () => void;
  formatTime: (seconds: number) => string;
  mediaController: MediaController;
  waveformController: WaveformController;
  // Lyrics editing
  editText: (lineId: string, text: string) => void;
  selectLine: (lineId: string | null) => void;
  reorder: (lineId: string, direction: "up" | "down") => void;
  insertAfter: (lineId: string) => void;
  insertAtRange: (start: number, end: number) => void;
  splitLine: (lineId: string) => void;
  mergeWithPrevious: (lineId: string) => void;
  deleteLine: (lineId: string) => void;
  deleteGap: (gapStart: number, gapEnd: number, prevLineId: string | null, nextLineId: string | null) => void;
  nudgeLine: (lineId: string, edge: "start" | "end", delta: number) => void;
  setPlainLyrics: (value: string) => void;
  setMeta: (update: Partial<LyricsMeta>) => void;
  importFromLrc: (rawLrc: string) => void;
  exportToLrc: () => string;
  setLoopEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  setLineRangeLive: (lineId: string, start: number, end: number) => void;
  setLineRangeCommit: (lineId: string, start: number, end: number, baseState?: unknown) => void;
  getHistoryState: () => unknown;
  setLyricsTab: (tab: any) => void;
}
