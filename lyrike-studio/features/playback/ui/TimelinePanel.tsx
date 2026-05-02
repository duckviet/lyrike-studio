"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LyricRegionsTrack } from "@/features/lyrics-sync/ui/LyricRegionsTrack";
import {
  usePeaksQuery,
  useDemucsPeaksQuery,
} from "@/features/media/queries/mediaQueries";

import { useEditorUIStore } from "@/features/editor/store/editorUIStore";
import { useEditorMediaStore } from "@/features/editor/store/editorMediaStore";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import {
  editorWaveformController,
  editorMediaController,
} from "@/features/editor/store/editorControllers";
import { usePlaybackSync } from "@/features/lyrics-sync/model/usePlaybackSync";
import { calcExtendLinePatch } from "@/features/playback/model/extendLine";
import { getAudioUrl } from "@/lib/api";
import { useTranslations } from "next-intl";
import { useDraft } from "@/features/playback/model/useDraft";
import { TimelineActionsBar } from "./TimelineActionsBar";

export const TimelinePanel = ({
  onTogglePlayback,
  onSeekTo,
  onSeekBy,
}: {
  onTogglePlayback?: () => void;
  onSeekTo?: (time: number) => void;
  onSeekBy?: (delta: number) => void;
} = {}) => {
  const t = useTranslations("dashboard.editor");
  const waveHostRef = useRef<HTMLDivElement>(null);
  const timelineHostRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Context / Stores
  const activeTab = useEditorUIStore((s) => s.activeTab);
  const zoomLevel = useEditorUIStore((s) => s.zoomLevel);
  const waveScrollLeft = useEditorUIStore((s) => s.waveScrollLeft);
  const wavePxPerSec = useEditorUIStore((s) => s.wavePxPerSec);
  const onZoomChange = useEditorUIStore((s) => s.handleZoomChange);
  const onScroll = useEditorUIStore((s) => s.handleScroll);

  const mediaInfo = useEditorMediaStore((s) => s.mediaInfo);
  const peaksInfo = useEditorMediaStore((s) => s.peaksInfo);

  const audioUrl = mediaInfo?.audioUrl ? getAudioUrl(mediaInfo.audioUrl) : null;
  const duration = mediaInfo?.duration || 0;

  const doc = useLyricsStore((s) => s.doc);
  const selectedLineId = useLyricsStore((s) => s.selectedLineId);
  const activeLineId = useLyricsStore((s) => s.activeLineId);
  const setActiveLine = useLyricsStore((s) => s.setActiveLine);
  const selectLine = useLyricsStore((s) => s.selectLine);
  const clearSelection = useLyricsStore((s) => s.clearSelection);
  const onSelectLine = (lineId: string | null) => {
    if (lineId === null) clearSelection();
    else selectLine(lineId);
  };
  const onGetBaseState = () => ({
    doc: useLyricsStore.getState().doc,
    selectedLineId: useLyricsStore.getState().selectedLineId,
  });
  const onInsertAtGap = useLyricsStore((s) => s.insertAtRange);
  const onDeleteGap = useLyricsStore((s) => s.deleteGap);

  const hasSelectedLine = Boolean(selectedLineId);
  const syncedLines = doc.syncedLines;

  const onExtendLine = useCallback(
    (lineId: string, edge: "start" | "end", newTime: number) => {
      const doc = useLyricsStore.getState().doc;
      const line = doc.syncedLines.find((l) => l.id === lineId);
      if (line) {
        useLyricsStore
          .getState()
          .setLineRange(
            lineId,
            edge === "start" ? newTime : line.start,
            edge === "end" ? newTime : line.end,
          );
      }
    },
    [],
  );

  const { isPlaying, currentTime } = usePlaybackSync({
    syncedLines,
    setActiveLine,
  });

  const handleTogglePlayback = useCallback(() => {
    editorMediaController.toggle();
    onTogglePlayback?.();
  }, [onTogglePlayback]);

  const handleSeekTo = useCallback(
    (time: number) => {
      editorMediaController.seek(time);
      onSeekTo?.(time);
    },
    [onSeekTo],
  );

  const handleSeekBy = useCallback(
    (delta: number) => {
      editorMediaController.seekBy(delta);
      onSeekBy?.(delta);
    },
    [onSeekBy],
  );

  const loadDraft = useLyricsStore((s) => s.loadDraft);
  const { saveDraft } = useDraft(loadDraft);

  const onSaveDraft = () => {
    if (!mediaInfo) return;
    saveDraft(
      mediaInfo.videoId,
      useLyricsStore.getState().doc,
      useLyricsStore.getState().selectedLineId,
    );
  };

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

  useEffect(() => {
    if (!waveHostRef.current || !timelineHostRef.current) return;
    isInitialized.current = false;
    editorWaveformController.init({
      container: waveHostRef.current,
      timelineContainer: timelineHostRef.current,
      media: editorMediaController.getMediaElement(),
      onSeek: (time: number) => handleSeekTo(time),
      onScroll: (scrollLeft: number) => onScroll?.(scrollLeft),
      onZoomChange: (pxPerSec: number) => onZoomChange(pxPerSec),
    });
    isInitialized.current = true;

    return () => {
      isInitialized.current = false;
      editorWaveformController.destroy();
    };
  }, [handleSeekTo, onScroll, onZoomChange]);

  useEffect(() => {
    if (!audioUrl || !mediaInfo) return;
    editorWaveformController.load(
      audioUrl,
      currentPeaksInfo?.peaks ?? null,
      mediaInfo.duration,
    );
  }, [audioUrl, currentPeaksInfo, mediaInfo]);

  useEffect(() => {
    editorWaveformController.syncTime(currentTime);
  }, [currentTime]);

  useEffect(() => {
    editorWaveformController.setZoom(zoomLevel);
  }, [zoomLevel]);

  return (
    <article
      className={`h-full flex flex-col overflow-hidden border border-line rounded-2xl bg-bg-soft shadow-sm ${activeTab !== "timeline" ? "hidden md:block" : ""}`}
    >
      <TimelineActionsBar
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        peakSource={peakSource}
        setPeakSource={setPeakSource}
        onTogglePlayback={handleTogglePlayback}
        onSeekBy={handleSeekBy}
        onSaveDraft={onSaveDraft}
      />

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
            lines={doc.syncedLines}
            duration={duration}
            pxPerSec={wavePxPerSec || zoomLevel}
            scrollLeft={waveScrollLeft}
            activeLineId={activeLineId}
            selectedLineId={selectedLineId}
            onSelectLine={onSelectLine}
            onResize={useLyricsStore.getState().setLineRangeLive}
            onResizeCommit={useLyricsStore.getState().setLineRange}
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
};

export default TimelinePanel;
