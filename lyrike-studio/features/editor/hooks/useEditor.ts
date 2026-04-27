"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLyrics } from "@/entities/lyrics/ui/LyricsProvider";
import { MediaController, WaveformController } from "@/entities/media";
import { formatTime } from "@/shared/utils/formatters";
import { DEFAULT_ZOOM_PX_PER_SEC } from "@/shared/config/constants";
import type { EditorState, EditorActions } from "../types";

import { useMediaLoader } from "./useMediaLoader";
import { useTranscription } from "./useTranscription";
import { usePublish } from "./usePublish";
import { usePlaybackSync } from "./usePlaybackSync";
import { useDraft } from "./useDraft";

export function useEditor(): [EditorState, EditorActions] {
  const {
    state: lyricsState,
    setTab,
    setActiveLine,
    selectLine,
    editText,
    hydrateFromMedia,
    loadDraft,
    setLineRangeLive,
    setLineRangeCommit,
    insertAfter,
    insertAtRange,
    deleteLine,
    reorder,
    splitLine,
    mergeWithPrevious,
    nudgeLine,
    setPlainLyrics,
    setMeta,
    importFromLrc,
    exportToLrc,
    undo,
    redo,
    getHistoryState,
  } = useLyrics();

  const mediaController = useMemo(() => new MediaController(), []);
  const waveformController = useMemo(() => new WaveformController(), []);

  const [activeTab, setActiveTab] = useState<"source" | "timeline" | "lyrics">("timeline");
  const [sourceInput, setSourceInput] = useState("");
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_PX_PER_SEC);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [waveScrollLeft, setWaveScrollLeft] = useState(0);
  const [wavePxPerSec, setWavePxPerSec] = useState(DEFAULT_ZOOM_PX_PER_SEC);
  const [duration, setDuration] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { saveDraft, maybeRestoreDraft } = useDraft(loadDraft);

  const [sourceMessage, setSourceMessage] = useState("No source loaded yet.");

  const {
    publishState,
    handlePublish: runPublish,
    reset: resetPublish,
  } = usePublish({
    lyricsState,
    exportToLrc,
    setSourceMessage,
  });

  const {
    mediaInfo,
    peaksInfo,
    fetchState,
    peaksState,
    peaksMessage,
    load: loadMedia,
    setFetchState,
  } = useMediaLoader({
    mediaController,
    waveformController,
    onHydrateFromMedia: hydrateFromMedia,
    maybeRestoreDraft,
    onResetPublish: resetPublish,
    setSourceMessage,
  });

  const {
    transcribeState,
    handleTranscribe,
  } = useTranscription({
    mediaInfo,
    importFromLrc,
    setSourceMessage,
  });

  const {
    isPlaying,
    currentTime,
  } = usePlaybackSync({
    syncedLines: lyricsState.doc.syncedLines,
    setActiveLine,
  });

  // Keep HTMLAudioElement events (duration, errors) still wired up.
  useEffect(() => {
    const unsubDuration = mediaController.subscribe("durationchange", ({ duration: d }) => setDuration(d));
    return () => {
      unsubDuration();
    };
  }, [mediaController]);

  const handleFetch = useCallback(() => loadMedia(sourceInput), [loadMedia, sourceInput]);
  const handlePublish = useCallback(() => runPublish(mediaInfo), [runPublish, mediaInfo]);

  const editorState: EditorState = {
    activeTab,
    lyricsState,
    mediaInfo,
    peaksInfo,
    isPlaying,
    currentTime,
    duration,
    zoomLevel,
    waveScrollLeft,
    wavePxPerSec,
    loopEnabled,
    fetchState,
    sourceMessage,
    transcribeState,
    peaksState,
    peaksMessage,
    publishState,
    isSidebarCollapsed,
  };

  const editorActions: EditorActions = {
    setActiveTab,
    sourceInput,
    setSourceInput,
    handleFetch,
    handleTranscribe,
    handlePublish,
    handleZoomChange: (px: number) => {
      setZoomLevel(px);
      setWavePxPerSec(px);
    },
    handleScroll: setWaveScrollLeft,
    handleSeekTo: (time: number) => mediaController.seek(time),
    handleSeekBy: (delta: number) => mediaController.seekBy(delta),
    handlePlayPause: () => mediaController.toggle(),
    undo,
    redo,
    toggleSidebar: () => setIsSidebarCollapsed(!isSidebarCollapsed),
    saveDraft: () => {
      if (!mediaInfo) {
        setSourceMessage("Load media before saving a draft.");
        return;
      }
      saveDraft(mediaInfo.videoId, lyricsState.doc, lyricsState.selectedLineId);
      setSourceMessage("Draft saved locally.");
    },
    formatTime: (seconds: number) => formatTime(seconds),
    mediaController,
    waveformController,
    editText,
    selectLine,
    reorder,
    insertAfter,
    insertAtRange,
    splitLine,
    mergeWithPrevious,
    deleteLine,
    nudgeLine,
    setPlainLyrics,
    setMeta,
    importFromLrc,
    exportToLrc,
    setLoopEnabled,
    setLineRangeLive,
    setLineRangeCommit: (lineId: string, start: number, end: number, baseState?: unknown) =>
      setLineRangeCommit(lineId, start, end, baseState as any),
    getHistoryState,
    setLyricsTab: setTab,
  };

  return [editorState, editorActions];
}