"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useLyrics,
  type LyricsState,
} from "@/entities/lyrics/ui/LyricsProvider";
import { MediaController, WaveformController } from "@/entities/media";
import { createDraftManager } from "@/shared/utils/draftManager";
import { formatTime } from "@/shared/utils/formatters";
import { buildPublishPayload } from "@/lib/app/publishPayload";
import {
  createPublishFlowMachine,
  type PublishFlowState,
} from "@/features/publish";
import { solvePowInWorker } from "@/lib/app/powWorkerClient";
import {
  fetchMediaForEditor,
  runTranscriptionFlow,
} from "@/lib/app/mediaWorkflow";
import { findActiveLyricIndex } from "@/entities/lyrics";
import { DEFAULT_ZOOM_PX_PER_SEC } from "@/shared/config/constants";
import {
  fetchMedia,
  fetchPeaks,
  getAudioUrl,
  requestTranscription,
  streamTranscription,
  requestPublishChallenge,
  publishLyrics,
  type FetchMediaResponse,
  type PeaksResponse,
} from "@/lib/api";

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
  fetchState: "idle" | "loading" | "ready" | "error";
  sourceMessage: string;
  transcribeState: string;
  peaksState: "idle" | "loading" | "ready" | "error";
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
  splitLine: (lineId: string) => void;
  mergeWithPrevious: (lineId: string) => void;
  deleteLine: (lineId: string) => void;
  nudgeLine: (lineId: string, edge: "start" | "end", delta: number) => void;
  setPlainLyrics: (value: string) => void;
  setMeta: (key: string, value: string) => void;
  importFromLrc: (rawLrc: string) => void;
  exportToLrc: () => string;
  setLoopEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  setLineRangeLive: (lineId: string, start: number, end: number) => void;
  setLineRangeCommit: (lineId: string, start: number, end: number, baseState?: unknown) => void;
  getHistoryState: () => unknown;
  setLyricsTab: (tab: any) => void;
}

export function useEditor(): [EditorState, EditorActions] {
  const {
    state,
    setTab,
    setActiveLine,
    selectLine,
    editText,
    hydrateFromMedia,
    loadDraft,
    setLineRangeLive,
    setLineRangeCommit,
    tapSync,
    insertAfter,
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
  const draftManager = createDraftManager();
  const publishFlow = createPublishFlowMachine((next) => setPublishState(next));

  const [activeTab, setActiveTab] = useState<"source" | "timeline" | "lyrics">("timeline");
  const [sourceInput, setSourceInput] = useState("");
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [sourceMessage, setSourceMessage] = useState("No source loaded yet.");
  const [transcribeState, setTranscribeState] = useState("idle");
  const [mediaInfo, setMediaInfo] = useState<FetchMediaResponse | null>(null);
  const [peaksInfo, setPeaksInfo] = useState<PeaksResponse | null>(null);
  const [peaksState, setPeaksState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [peaksMessage, setPeaksMessage] = useState("No peaks generated yet.");
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_PX_PER_SEC);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [waveScrollLeft, setWaveScrollLeft] = useState(0);
  const [wavePxPerSec, setWavePxPerSec] = useState(DEFAULT_ZOOM_PX_PER_SEC);
  const [dragBaseState, setDragBaseState] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcribeAbortController, setTranscribeAbortController] = useState<AbortController | null>(null);
  const [publishState, setPublishState] = useState<PublishFlowState | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sync currentTime / isPlaying from the YouTube player (master clock).
  // VideoPlayer polls the YT IFrame API every 100 ms and dispatches
  // 'video-timeupdate' on window so any subscriber can react.
  useEffect(() => {
    const handleVideoTimeUpdate = (e: Event) => {
      const { currentTime: t, isPlaying: p } = (e as CustomEvent<{ currentTime: number; isPlaying: boolean }>).detail;
      setCurrentTime(t);
      setIsPlaying(p);
      const lines = state.doc.syncedLines;
      const activeIndex = findActiveLyricIndex(lines, t);
      if (activeIndex >= 0) {
        setActiveLine(lines[activeIndex].id);
      } else {
        setActiveLine(null);
      }
    };

    window.addEventListener("video-timeupdate", handleVideoTimeUpdate);
    return () => window.removeEventListener("video-timeupdate", handleVideoTimeUpdate);
  }, [state.doc.syncedLines, setActiveLine]);

  // Keep HTMLAudioElement events (duration, errors) still wired up.
  // timeupdate / playstate are now owned by the YouTube poll above.
  useEffect(() => {
    const unsubDuration = mediaController.subscribe("durationchange", ({ duration: d }) => setDuration(d));
    return () => {
      unsubDuration();
    };
  }, [mediaController]);

  const maybeRestoreDraft = useCallback((videoId: string) => {
    const draft = draftManager.load(videoId);
    if (!draft) return;
    const shouldRestore = confirm(
      "Found a local draft for this video. Do you want to restore it?",
    );
    if (!shouldRestore) return;
    loadDraft(draft.doc, draft.selectedLineId ?? null);
    setSourceMessage("Draft restored from local storage.");
  }, [loadDraft]);

  const handleFetch = useCallback(async () => {
    if (!sourceInput.trim()) {
      setSourceMessage("Please enter a valid source URL.");
      setFetchState("error");
      return;
    }
    try {
      setFetchState("loading");
      setSourceMessage("Fetching metadata and caching audio...");
      setTranscribeState("idle");
      setPeaksInfo(null);
      setPeaksState("loading");
      setPeaksMessage("Generating waveform peaks...");

      const result = await fetchMediaForEditor({
        sourceUrl: sourceInput.trim(),
        fetchMediaFn: fetchMedia,
        fetchPeaksFn: fetchPeaks,
        getAudioUrlFn: getAudioUrl,
        restoreDraft: maybeRestoreDraft,
        mediaController,
        waveformController,
        onHydrateFromMedia: hydrateFromMedia,
      });

      setMediaInfo(result.mediaInfo);
      setPeaksInfo(result.peaks.peaksInfo);
      setPeaksState(result.peaks.peaksState);
      setPeaksMessage(result.peaks.peaksMessage);
      setSourceMessage(result.sourceMessage);
      setFetchState("ready");
      setLoopEnabled(false);
      publishFlow.reset();
    } catch (error) {
      setPeaksState("error");
      setPeaksMessage("Failed to load waveform peaks.");
      setFetchState("error");
      setSourceMessage(
        error instanceof Error ? error.message : "Failed to fetch source.",
      );
    }
  }, [sourceInput, maybeRestoreDraft, mediaController, waveformController, hydrateFromMedia]);

  const handleTranscribe = useCallback(async () => {
    if (!mediaInfo) return;
    const abortController = new AbortController();
    setTranscribeAbortController(abortController);
    try {
      setTranscribeState("starting");
      const result = await runTranscriptionFlow({
        mediaInfo,
        requestFn: requestTranscription,
        streamFn: streamTranscription,
        onImportLrc: importFromLrc,
        onStatus: (status) => setTranscribeState(status),
        signal: abortController.signal,
      });
      setTranscribeState(result.transcribeState);
      setSourceMessage(result.sourceMessage);
    } catch (e) {
      setTranscribeState("error");
      setSourceMessage("Transcription failed.");
    }
  }, [mediaInfo, importFromLrc]);

  const handlePublish = useCallback(async () => {
    if (!mediaInfo) {
      setSourceMessage("Load media before publishing.");
      return;
    }
    await publishFlow.run({
      buildPayload: () =>
        buildPublishPayload({
          lyricsState: state,
          mediaInfo,
          exportLrc: () => exportToLrc(),
        }),
      requestChallenge: requestPublishChallenge,
      solvePow: ({ prefix, targetHex, onProgress }) =>
        solvePowInWorker({ prefix, targetHex, onProgress }),
      publish: ({ payload, publishToken }) =>
        publishLyrics({ payload, publishToken }),
    });
  }, [mediaInfo, state, exportToLrc]);

  const saveDraft = useCallback(() => {
    if (!mediaInfo) {
      setSourceMessage("Load media before saving a draft.");
      return;
    }
    draftManager.save(mediaInfo.videoId, {
      doc: state.doc,
      selectedLineId: state.selectedLineId,
    });
    setSourceMessage("Draft saved locally.");
  }, [mediaInfo, state]);

  const formatTimeFn = useCallback((seconds: number) => formatTime(seconds), []);

  const editorState: EditorState = {
    activeTab,
    lyricsState: state,
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
    saveDraft,
    formatTime: formatTimeFn,
    mediaController,
    waveformController,
    // Lyrics editing
    editText,
    selectLine: (lineId: string | null) => { if (lineId !== null) selectLine(lineId); },
    reorder,
    insertAfter,
    splitLine,
    mergeWithPrevious,
    deleteLine,
    nudgeLine,
    setPlainLyrics,
    setMeta: (key: string, value: string) => setMeta({ [key]: value } as any),
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