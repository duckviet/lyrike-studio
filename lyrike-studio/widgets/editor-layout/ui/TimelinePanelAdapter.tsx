"use client";

import { TimelinePanel } from "@/features/playback/ui/TimelinePanel";
import type { LyricsState } from "@/entities/lyrics";
import type { FetchMediaResponse, PeaksResponse } from "@/lib/api";
import type { WaveformController, MediaController } from "@/entities/media";

type TabId = "source" | "timeline" | "lyrics";

interface TimelinePanelAdapterProps {
  activeTab: TabId;
  mediaInfo: FetchMediaResponse | null;
  lyricsState: LyricsState;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  peaksState: "idle" | "loading" | "ready" | "error";
  peaksMessage: string;
  zoomLevel: number;
  loopEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelectedLine: boolean;
  waveScrollLeft: number;
  wavePxPerSec: number;
  formatTime: (seconds: number) => string;
  onUndo: () => void;
  onRedo: () => void;
  onSaveDraft: () => void;
  onZoomChange: (pxPerSec: number) => void;
  onToggleLoop: () => void;
  onSelectLine: (lineId: string) => void;
  onRegionResize: (lineId: string, start: number, end: number) => void;
  onRegionResizeCommit: (lineId: string, start: number, end: number, baseState: unknown) => void;
  onRegionResizeStart?: () => void;
  onScroll?: (scrollLeft: number) => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (time: number) => void;
  onTogglePlayback: () => void;
  waveformController: WaveformController;
  mediaController: MediaController;
  peaksInfo: PeaksResponse | null;
  audioUrl: string | null;
  onGetBaseState?: () => unknown;
}

export function TimelinePanelAdapter(props: TimelinePanelAdapterProps) {
  return <TimelinePanel {...props} />;
}