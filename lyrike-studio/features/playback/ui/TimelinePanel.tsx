"use client";

import { forwardRef, useEffect, useRef, memo } from "react";
import { LyricRegionsTrack } from "@/features/lyrics-sync/ui/LyricRegionsTrack";
import type { FetchMediaResponse, PeaksResponse } from "@/lib/api";
import type { LyricsState } from "@/entities/lyrics";
import type { WaveformController } from "@/entities/media";
import type { MediaController } from "@/entities/media";
import { DEFAULT_ZOOM_PX_PER_SEC, SEEK_DELTA_SEC } from "@/shared/config/constants";

type TabId = "source" | "timeline" | "lyrics";

interface TimelinePanelProps {
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
  onGetBaseState?: () => unknown;
  onScroll?: (scrollLeft: number) => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (time: number) => void;
  onTogglePlayback: () => void;
  waveformController: WaveformController;
  mediaController: MediaController;
  peaksInfo: PeaksResponse | null;
  audioUrl: string | null;
}

export const TimelinePanel = memo(forwardRef(function TimelinePanel(
  {
    activeTab,
    mediaInfo,
    lyricsState,
    isPlaying,
    currentTime = 0,
    duration = 0,
    peaksState = "idle",
    peaksMessage = "",
    zoomLevel = DEFAULT_ZOOM_PX_PER_SEC,
    loopEnabled = false,
    canUndo = false,
    canRedo = false,
    hasSelectedLine = false,
    waveScrollLeft = 0,
    wavePxPerSec = 0,
    formatTime,
    onUndo,
    onRedo,
    onSaveDraft,
    onZoomChange,
    onToggleLoop,
    onSelectLine,
    onRegionResize,
    onRegionResizeCommit,
    onRegionResizeStart,
    onGetBaseState,
    onScroll,
    onSeekBy,
    onSeekTo,
    onTogglePlayback,
    waveformController,
    mediaController,
    peaksInfo,
    audioUrl,
  }: TimelinePanelProps,
  ref,
) {
  const waveHostRef = useRef<HTMLDivElement>(null);
  const timelineHostRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);


  // Initialize WaveformController once on mount
  useEffect(() => {
    if (!waveHostRef.current || !timelineHostRef.current) return;
    isInitialized.current = false;
    waveformController.init({
      container: waveHostRef.current,
      timelineContainer: timelineHostRef.current,
      media: mediaController.getMediaElement(),
      onSeek: (time: number) => onSeekTo(time),
      onScroll: (scrollLeft: number) => onScroll?.(scrollLeft),
      onZoomChange: (pxPerSec: number) => onZoomChange(pxPerSec),
    });
    isInitialized.current = true;

    return () => {
      isInitialized.current = false;
      waveformController.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveformController, mediaController]);

  // Load waveform data when mediaInfo/peaks arrive.
  // WaveformController buffers this internally if init() hasn't run yet.
  useEffect(() => {
    if (!audioUrl || !mediaInfo) return;
    waveformController.load(
      audioUrl,
      peaksInfo?.peaks ?? null,
      mediaInfo.duration,
    );
  }, [audioUrl, peaksInfo, mediaInfo, waveformController]);

  // Keep waveform playhead in sync with currentTime
  useEffect(() => {
    waveformController.syncTime(currentTime);
  }, [currentTime, waveformController]);

  // Keep waveform zoom in sync with zoomLevel
  useEffect(() => {
    waveformController.setZoom(zoomLevel);
  }, [zoomLevel, waveformController]);

  const handleWaveformClick = (event: React.MouseEvent) => {
    if (!mediaInfo) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = (waveScrollLeft + x) / (wavePxPerSec || zoomLevel);
    onSeekTo(Math.max(0, Math.min(duration, time)));
  };

  return (
    <article
      className={`timeline-column ${activeTab !== "timeline" ? "hidden-mobile" : ""}`}
    >
      <div className="transport-bar">
        <div className="transport-left">
          <button
            type="button"
            className="btn primary icon-text"
            disabled={!mediaInfo?.audioReady}
            onClick={onTogglePlayback}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <div className="btn-group">
            <button
              type="button"
              className="btn secondary"
              disabled={!mediaInfo?.audioReady}
              onClick={() => onSeekBy(-SEEK_DELTA_SEC)}
            >
              −5s
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={!mediaInfo?.audioReady}
              onClick={() => onSeekBy(SEEK_DELTA_SEC)}
            >
              +5s
            </button>
          </div>
        </div>

        <div className="transport-center">
          <span className="zoom-label">Zoom</span>
          <input
            className="zoom-slider"
            type="range"
            min="20"
            max="240"
            step="2"
            value={zoomLevel}
            onChange={(e) => onZoomChange(Number(e.target.value))}
          />
        </div>

        <div className="transport-right">
          <button
            type="button"
            className={`btn secondary compact ${loopEnabled ? "active" : ""}`}
            onClick={onToggleLoop}
          >
            Loop
          </button>
          <div className="time-readout">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="btn secondary compact"
              disabled={!canUndo}
              onClick={onUndo}
            >
              Undo
            </button>
            <button
              type="button"
              className="btn secondary compact"
              disabled={!canRedo}
              onClick={onRedo}
            >
              Redo
            </button>
            <button
              type="button"
              className="btn secondary compact"
              onClick={onSaveDraft}
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      <div className="waveform-area">
        {/* Always render host divs so WaveSurfer measures correct container size on init */}
        <div className="ruler-track" ref={timelineHostRef} />
        <div className="wave-track" ref={waveHostRef}>
          {!mediaInfo && (
            <div className="waveform-placeholder">
              <span>Load a video to see the waveform</span>
            </div>
          )}
        </div>

        {mediaInfo && (
          <LyricRegionsTrack
            lines={lyricsState.doc.syncedLines}
            duration={duration}
            pxPerSec={wavePxPerSec || zoomLevel}
            scrollLeft={waveScrollLeft}
            activeLineId={lyricsState.activeLineId}
            selectedLineId={lyricsState.selectedLineId}
            onSelectLine={onSelectLine}
            onResize={onRegionResize}
            onResizeCommit={onRegionResizeCommit}
            onResizeStart={onRegionResizeStart}
            onGetBaseState={onGetBaseState}
          />
        )}

        {mediaInfo && peaksState !== "idle" && (
          <p className="peaks-status" data-state={peaksState}>
            {peaksMessage}
          </p>
        )}
      </div>
    </article>
  );
}));
