"use client";

import { useMemo, useEffect, useState } from "react";
import { MediaController, WaveformController } from "@/entities/media";
import { formatTime } from "@/shared/utils/formatters";
import type { EditorState, EditorActions } from "../types";

// New smaller hooks
import { useEditorLyricsState } from "./useEditorLyricsState";
import { useEditorUIState } from "./useEditorUIState";
import { useEditorMediaMutations } from "./useEditorMediaMutations";

// Legacy hooks - to be migrated later
import { usePlaybackSync } from "./usePlaybackSync";
import { useDraft } from "./useDraft";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";

export function useEditor(): [EditorState, EditorActions] {
  // 1. Lyrics state from Zustand store
  const [lyricsState, lyricsActions] = useEditorLyricsState();

  // 2. UI state (zoom, scroll, sidebar, loop)
  const [uiState, uiActions] = useEditorUIState();

  // 3. Media mutations (fetch, transcribe, publish)
  const [mediaState, mediaActions] = useEditorMediaMutations({
    lyricsState,
    exportToLrc: lyricsActions.exportToLrc,
    hydrateFromMedia: useLyricsStore((s) => s.hydrateFromMedia),
    importFromLrc: lyricsActions.importFromLrc,
  });

  const loadDraft = useLyricsStore((s) => s.loadDraft);
  const { saveDraft, maybeRestoreDraft } = useDraft(loadDraft);

  // Controller instances
  const mediaController = useMemo(() => new MediaController(), []);
  const waveformController = useMemo(() => new WaveformController(), []);

  // Playback sync
  const { isPlaying, currentTime } = usePlaybackSync({
    syncedLines: lyricsState.doc.syncedLines,
    setActiveLine: lyricsActions.setActiveLine,
  });

  // Duration tracking
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const unsubDuration = mediaController.subscribe("durationchange", ({ duration: d }) => setDuration(d));
    return () => {
      unsubDuration();
    };
  }, [mediaController]);

  // Build EditorState
  const editorState: EditorState = {
    activeTab: uiState.activeTab,
    lyricsState,
    mediaInfo: mediaState.mediaInfo,
    peaksInfo: mediaState.peaksInfo,
    isPlaying,
    currentTime,
    duration: duration || mediaState.mediaInfo?.duration || 0,
    zoomLevel: uiState.zoomLevel,
    waveScrollLeft: uiState.waveScrollLeft,
    wavePxPerSec: uiState.wavePxPerSec,
    loopEnabled: uiState.loopEnabled,
    fetchState: mediaState.fetchState,
    sourceMessage: mediaState.sourceMessage,
    transcribeState: mediaState.transcribeState,
    peaksState: mediaState.peaksState,
    peaksMessage: mediaState.peaksMessage,
    publishState: mediaState.publishState,
    isSidebarCollapsed: uiState.isSidebarCollapsed,
  };

  // Build EditorActions
  const editorActions: EditorActions = useMemo(
    () => ({
      setActiveTab: uiActions.setActiveTab,
      sourceInput: mediaState.sourceInput,
      setSourceInput: mediaActions.setSourceInput,
      handleFetch: mediaActions.handleFetch,
      handleTranscribe: mediaActions.handleTranscribe,
      handlePublish: mediaActions.handlePublish,
      handleZoomChange: uiActions.handleZoomChange,
      handleScroll: uiActions.handleScroll,
      handleSeekTo: (time: number) => mediaController.seek(time),
      handleSeekBy: (delta: number) => mediaController.seekBy(delta),
      handlePlayPause: () => mediaController.toggle(),
      undo: lyricsActions.undo,
      redo: lyricsActions.redo,
      toggleSidebar: uiActions.toggleSidebar,
      saveDraft: () => {
        if (!mediaState.mediaInfo) {
          mediaActions.setSourceInput(""); // Trigger message update
          return;
        }
        saveDraft(
          mediaState.mediaInfo.videoId,
          lyricsState.doc,
          lyricsState.selectedLineId,
        );
      },
      formatTime: (seconds: number) => formatTime(seconds),
      mediaController,
      waveformController,
      editText: lyricsActions.editText,
      selectLine: lyricsActions.selectLine,
      reorder: lyricsActions.reorder,
      insertAfter: lyricsActions.insertAfter,
      insertAtRange: lyricsActions.insertAtRange,
      splitLine: lyricsActions.splitLine,
      mergeWithPrevious: lyricsActions.mergeWithPrevious,
      deleteLine: lyricsActions.deleteLine,
      nudgeLine: lyricsActions.nudgeLine,
      setPlainLyrics: lyricsActions.setPlainLyrics,
      setMeta: lyricsActions.setMeta,
      importFromLrc: lyricsActions.importFromLrc,
      exportToLrc: lyricsActions.exportToLrc,
      setLoopEnabled: uiActions.setLoopEnabled,
      setLineRangeLive: lyricsActions.setLineRangeLive,
      setLineRangeCommit: (lineId: string, start: number, end: number) =>
        lyricsActions.setLineRange(lineId, start, end),
      getHistoryState: () => ({
        doc: lyricsState.doc,
        selectedLineId: lyricsState.selectedLineId,
      }),
      setLyricsTab: lyricsActions.setTab,
      deleteGap: lyricsActions.deleteGap,
    }),
    [
      uiActions,
      mediaState.sourceInput,
      mediaState.mediaInfo,
      mediaActions,
      mediaController,
      lyricsActions,
      lyricsState.doc,
      lyricsState.selectedLineId,
      saveDraft,
      waveformController,
    ],
  );

  return [editorState, editorActions];
}