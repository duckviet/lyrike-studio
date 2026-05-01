"use client";

import { forwardRef, useEffect, useRef, memo, useState } from "react";
import { LyricRegionsTrack } from "@/features/lyrics-sync/ui/LyricRegionsTrack";
import type { FetchMediaResponse, PeaksResponse } from "@/lib/api";
import type { LyricsState } from "@/entities/lyrics";
import type { WaveformController } from "@/entities/media";
import type { MediaController } from "@/entities/media";
import { WAVEFORM, TIMING } from "@/shared/config/constants";
import {
  usePeaksQuery,
  useDemucsPeaksQuery,
} from "@/features/media/queries/mediaQueries";

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
  onSelectLine: (lineId: string | null) => void;
  onRegionResize: (lineId: string, start: number, end: number) => void;
  onRegionResizeCommit: (
    lineId: string,
    start: number,
    end: number,
    baseState: unknown,
  ) => void;
  onRegionResizeStart?: () => void;
  onGetBaseState?: () => unknown;
  onScroll?: (scrollLeft: number) => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (time: number) => void;
  onTogglePlayback: () => void;
  onInsertAtGap: (start: number, end: number) => void;
  onExtendLine: (
    lineId: string,
    edge: "start" | "end",
    newTime: number,
  ) => void;
  onDeleteGap?: (
    gapStart: number,
    gapEnd: number,
    prevLineId: string | null,
    nextLineId: string | null,
  ) => void;
  waveformController: WaveformController;
  mediaController: MediaController;
  peaksInfo: PeaksResponse | null;
  audioUrl: string | null;
}

import { useTranslations } from "next-intl";

export const TimelinePanel = memo(
  forwardRef(function TimelinePanel(
    {
      activeTab,
      mediaInfo,
      lyricsState,
      isPlaying,
      currentTime = 0,
      duration = 0,
      peaksState = "idle",
      peaksMessage = "",
      zoomLevel = WAVEFORM.DEFAULT_ZOOM_PX_PER_SEC,
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
      onInsertAtGap,
      onExtendLine,
      onDeleteGap,
      waveformController,
      mediaController,
      peaksInfo,
      audioUrl,
    }: TimelinePanelProps,
    ref,
  ) {
    const t = useTranslations("dashboard.editor");
    const waveHostRef = useRef<HTMLDivElement>(null);
    const timelineHostRef = useRef<HTMLDivElement>(null);
    const isInitialized = useRef(false);

    const [peakSource, setPeakSource] = useState<"original" | "demucs">(
      "original",
    );

    const videoId = mediaInfo?.videoId ?? null;
    const originalPeaksQuery = usePeaksQuery(videoId, "original");
    const demucsPeaksQuery = useDemucsPeaksQuery(videoId);

    const currentPeaksInfo =
      peakSource === "demucs"
        ? demucsPeaksQuery.data
        : originalPeaksQuery.data || peaksInfo;

    const currentPeaksState =
      peakSource === "demucs"
        ? demucsPeaksQuery.isLoading
          ? "loading"
          : demucsPeaksQuery.isError
            ? "error"
            : "ready"
        : peaksState;

    const currentPeaksMessage =
      peakSource === "demucs"
        ? demucsPeaksQuery.isLoading
          ? "Loading demucs peaks..."
          : demucsPeaksQuery.isError
            ? "Demucs peaks not found. Run transcription first."
            : "Demucs peaks loaded."
        : peaksMessage;

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
    }, [waveformController, mediaController]);

    useEffect(() => {
      if (!audioUrl || !mediaInfo) return;
      waveformController.load(
        audioUrl,
        currentPeaksInfo?.peaks ?? null,
        mediaInfo.duration,
      );
    }, [audioUrl, currentPeaksInfo, mediaInfo, waveformController]);

    useEffect(() => {
      waveformController.syncTime(currentTime);
    }, [currentTime, waveformController]);

    useEffect(() => {
      waveformController.setZoom(zoomLevel);
    }, [zoomLevel, waveformController]);

    return (
      <article
        className={`h-full flex flex-col overflow-hidden border border-line rounded-2xl bg-bg-soft shadow-sm ${activeTab !== "timeline" ? "hidden md:block" : ""}`}
      >
        <div className="h-12 px-4 shrink-0 flex justify-between items-center gap-4 bg-bg-elev border-b border-line">
          <div className="min-w-0 flex items-center gap-2">
            <button
              type="button"
              className="h-8 px-4 bg-white rounded-lg border border-line inline-flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-150 cursor-pointer tracking-tight disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!mediaInfo?.audioReady}
              onClick={onTogglePlayback}
            >
              {isPlaying ? `⏸ ${t("pause")}` : `▶ ${t("play")}`}
            </button>
            <div className="inline-flex items-center gap-0.5 p-1 border border-line rounded-lg bg-bg">
              <button
                type="button"
                className="h-7 px-3 rounded border-0 bg-transparent text-ink-light-soft text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev"
                disabled={!mediaInfo?.audioReady}
                onClick={() => onSeekBy(-TIMING.SEEK_DELTA_SEC)}
              >
                −5s
              </button>
              <button
                type="button"
                className="h-7 px-3 rounded border-0 bg-transparent text-ink-light-soft text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev"
                disabled={!mediaInfo?.audioReady}
                onClick={() => onSeekBy(TIMING.SEEK_DELTA_SEC)}
              >
                +5s
              </button>
            </div>
            <div className="inline-flex items-center gap-0.5 p-1 border border-line rounded-lg bg-bg ml-1">
              <button
                type="button"
                className={`h-6 px-3 rounded border-0 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 ${peakSource === "original" ? "bg-bg-elev text-primary shadow-sm" : "bg-transparent text-ink-light-soft hover:bg-bg-elev"}`}
                onClick={() => setPeakSource("original")}
                title="Use original audio waveform"
              >
                Full
              </button>
              <button
                type="button"
                className={`h-6 px-3 rounded border-0 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 ${peakSource === "demucs" ? "bg-bg-elev text-primary shadow-sm" : "bg-transparent text-ink-light-soft hover:bg-bg-elev"}`}
                onClick={() => setPeakSource("demucs")}
                title="Use vocal-only waveform (requires transcription)"
              >
                Vocals
              </button>
            </div>
          </div>

          <div className="min-w-[180px] flex items-center justify-center gap-3">
            <span className="text-[0.66rem] font-bold text-ink-light-soft uppercase text-nowrap tracking-widest">
              {t("zoom")}
            </span>
            <input
              className="w-full max-w-[260px] h-1.5 border-0 rounded-full bg-bg appearance-none cursor-pointer p-0 accent-primary"
              type="range"
              min="20"
              max="240"
              step="2"
              value={zoomLevel}
              onChange={(e) => onZoomChange(Number(e.target.value))}
            />
          </div>

          <div className="min-w-0 flex items-center justify-end gap-2">
            <button
              type="button"
              className={`h-8 px-3 rounded-lg border border-line bg-transparent text-xs font-semibold cursor-pointer transition-all duration-150 ${loopEnabled ? "bg-primary text-[#002633] border-primary shadow-md" : "text-ink-light-soft hover:bg-bg-elev"}`}
              onClick={onToggleLoop}
            >
              {t("loop")}
            </button>
            <div className="h-8 min-w-[142px] px-3 inline-flex items-center justify-center border border-line rounded-lg bg-bg text-center text-primary font-mono text-sm font-medium tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="inline-flex items-center gap-0.5 p-1 border border-line rounded-lg bg-bg">
              <button
                type="button"
                className="h-6 px-3 rounded border-0 bg-transparent text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev disabled:opacity-40 disabled:cursor-not-allowed text-ink-light-soft"
                disabled={!canUndo}
                onClick={onUndo}
              >
                {t("undo")}
              </button>
              <button
                type="button"
                className="h-6 px-3 rounded border-0 bg-transparent text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev disabled:opacity-40 disabled:cursor-not-allowed text-ink-light-soft"
                disabled={!canRedo}
                onClick={onRedo}
              >
                {t("redo")}
              </button>
              <button
                type="button"
                className="h-6 px-3 rounded border-0 bg-transparent text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev text-ink-light-soft"
                onClick={onSaveDraft}
              >
                {t("draft")}
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-3 flex flex-col relative bg-[#050608]">
          <div
            className="shrink-0 overflow-hidden border-0 rounded-t-xl bg-[#0d1117] ruler-tick"
            ref={timelineHostRef}
          />
          <div
            id="waveform"
            className="min-h-0 flex-1 overflow-hidden border-x border-b border-white/5 bg-[#050608] shadow-inner no-scrollbar waveform-container "
            ref={waveHostRef}
          >
            {!mediaInfo && (
              <div className="flex-1 h-full grid place-items-center border border-dashed border-white/10 rounded-lg text-white/30 text-sm">
                <span>{t("loadWaveform")}</span>
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
              onInsertAtGap={onInsertAtGap}
              onExtendLine={onExtendLine}
              onDeleteGap={
                onDeleteGap
                  ? (gap) =>
                      onDeleteGap(
                        gap.start,
                        gap.end,
                        gap.prevLineId ?? null,
                        gap.nextLineId ?? null,
                      )
                  : undefined
              }
            />
          )}
        </div>
      </article>
    );
  }),
);
