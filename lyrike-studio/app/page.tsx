"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  LyricsProvider,
  useLyrics,
} from "@/features/editor/context/LyricsContext";
import { SourcePanel } from "@/features/editor/components/SourcePanel";
import { TimelinePanel } from "@/features/editor/components/TimelinePanel";
import { LyricsPanel } from "@/features/editor/components/LyricsPanel";
import { VideoPlayer } from "@/features/editor/components/VideoPlayer";
import { MobileTabs } from "@/shared/ui/MobileTabs";
import {
  fetchMedia,
  fetchPeaks,
  getAudioUrl,
  publishLyrics,
  requestPublishChallenge,
  requestTranscription,
  streamTranscription,
  type FetchMediaResponse,
  type PeaksResponse,
} from "@/lib/api";
import { createDraftManager } from "@/lib/app/draftManager";
import { formatTime } from "@/lib/app/formatters";
import { buildPublishPayload } from "@/lib/app/publishPayload";
import {
  createPublishFlowMachine,
  type PublishFlowState,
} from "@/lib/app/publishFlow";
import { solvePowInWorker } from "@/lib/app/powWorkerClient";
import {
  fetchMediaForEditor,
  runTranscriptionFlow,
} from "@/lib/app/mediaWorkflow";
import { findActiveLyricIndex } from "@/lib/lyricsTimeline";
import type { LyricLine } from "@/lib/lyricsTimeline";
import { MediaController } from "@/lib/MediaController";
import { WaveformController } from "@/lib/WaveformController";
import { useMemo } from "react";

type TabId = "source" | "timeline" | "lyrics";

const TABS: { id: TabId; label: string }[] = [
  { id: "source", label: "Source" },
  { id: "timeline", label: "Timeline" },
  { id: "lyrics", label: "Lyrics" },
];

const draftManager = createDraftManager();

function EditorImpl() {
  const {
    state,
    store,
    setTab,
    setActiveLine,
    selectLine,
    editText,
    selectByOffset,
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
  const videoPlayerRef = useRef<any>(null);

  const [activeTab, setActiveTab] = useState<TabId>("timeline");
  const [sourceInput, setSourceInput] = useState("");
  const [fetchState, setFetchState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [sourceMessage, setSourceMessage] = useState("No source loaded yet.");
  const [transcribeState, setTranscribeState] = useState("idle");
  const [mediaInfo, setMediaInfo] = useState<FetchMediaResponse | null>(null);
  const [peaksInfo, setPeaksInfo] = useState<PeaksResponse | null>(null);
  const [peaksState, setPeaksState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [peaksMessage, setPeaksMessage] = useState("No peaks generated yet.");

  const [zoomLevel, setZoomLevel] = useState(52);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [waveScrollLeft, setWaveScrollLeft] = useState(0);
  const [wavePxPerSec, setWavePxPerSec] = useState(52);

  const [dragBaseState, setDragBaseState] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcribeAbortController, setTranscribeAbortController] =
    useState<AbortController | null>(null);
  const [publishState, setPublishState] = useState<PublishFlowState | null>(
    null,
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const publishFlow = createPublishFlowMachine((next) => setPublishState(next));
  useEffect(() => setPublishState(publishFlow?.getState() ?? null), []);

  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
      const lines = state.doc.syncedLines;
      const activeIndex = findActiveLyricIndex(lines, time);
      if (activeIndex >= 0) {
        setActiveLine(lines[activeIndex].id);
      } else {
        setActiveLine(null);
      }
    },
    [state.doc.syncedLines, setActiveLine],
  );

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleDurationChange = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextZoom = Number(e.target.value);
      setZoomLevel(nextZoom);
      setWavePxPerSec(nextZoom);
    },
    [],
  );

  const handleToggleLoop = useCallback(() => {
    if (!state.selectedLineId) return;
    setLoopEnabled(!loopEnabled);
  }, [state.selectedLineId, loopEnabled]);

  const maybeRestoreDraft = useCallback(
    (videoId: string) => {
      const draft = draftManager.load(videoId);
      if (!draft) return;
      const shouldRestore = confirm(
        "Found a local draft for this video. Do you want to restore it?",
      );
      if (!shouldRestore) return;
      loadDraft(draft.doc, draft.selectedLineId ?? null);
      setSourceMessage("Draft restored from local storage.");
    },
    [loadDraft],
  );

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
  }, [mediaInfo, state]);

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
  }, [mediaInfo, store]);

  const handleZoomChangePx = useCallback((px: number) => {
    setZoomLevel(px);
    setWavePxPerSec(px);
  }, []);

  const handleScroll = useCallback((px: number) => {
    setWaveScrollLeft(px);
  }, []);

  const handleSeekTo = useCallback((time: number) => {
    videoPlayerRef.current?.seekTo(time);
  }, []);

  const formatTimeFn = useCallback(
    (seconds: number) => formatTime(seconds),
    [],
  );

  return (
    <main className="app-shell">
      <header className="top-header">
        <div className="logo">
          <div className="logo-icon" />
          <h1>Lyrics Studio</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn ghost compact"
            onClick={undo}
            disabled={!state.canUndo}
          >
            Undo
          </button>
          <button
            className="btn ghost compact"
            onClick={redo}
            disabled={!state.canRedo}
          >
            Redo
          </button>
          <button className="btn primary compact" onClick={saveDraft}>
            Save Draft
          </button>
        </div>
      </header>

      <div className="app-body">
        <div className="workspace-top">
          <div
            className="sidebar-wrapper"
            style={{ width: isSidebarCollapsed ? "40px" : "320px" }}
          >
            <aside
              className={`sidebar-content ${isSidebarCollapsed ? "collapsed" : ""}`}
            >
              <SourcePanel
                activeTab={activeTab}
                sourceInput={sourceInput}
                setSourceInput={setSourceInput}
                fetchState={fetchState}
                sourceMessage={sourceMessage}
                mediaInfo={mediaInfo}
                publishState={publishState!}
                transcribeState={transcribeState}
                formatTime={formatTimeFn}
                onFetch={handleFetch}
                onPublish={handlePublish}
                onTranscribe={handleTranscribe}
              />
            </aside>
            <button
              className="sidebar-toggle"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? "→" : "←"}
            </button>
          </div>

          <section className="main-stage">
            <VideoPlayer
              ref={videoPlayerRef}
              videoId={mediaInfo?.videoId ?? null}
              onTimeUpdate={handleTimeUpdate}
              onPlayStateChange={handlePlayStateChange}
              onDurationChange={handleDurationChange}
            />
          </section>

          <aside className="right-panel">
            <LyricsPanel
              activeTab={activeTab}
              lyricsState={state}
              formatTime={formatTimeFn}
              onSetTab={setTab}
              onSeekLine={(line) => videoPlayerRef.current?.seekTo(line.start)}
              onEditLineText={editText}
              onSelectLine={selectLine}
              onReorder={reorder}
              onInsertAfter={insertAfter}
              onSplit={splitLine}
              onMerge={mergeWithPrevious}
              onDelete={deleteLine}
              onNudge={(line, edge, delta) => nudgeLine(line.id, edge, delta)}
              onSetPlainLyrics={setPlainLyrics}
              onUpdateMetaField={(key, value) =>
                setMeta({ [key]: key === 'offset' ? Number(value) : value } as any)
              }
              onImportLrc={importFromLrc}
              onExportLrc={exportToLrc}
            />
          </aside>
        </div>

        <div className="workspace-bottom">
          <TimelinePanel
            activeTab="timeline"
            mediaInfo={mediaInfo}
            lyricsState={state}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            peaksState={peaksState}
            peaksMessage={peaksMessage}
            zoomLevel={zoomLevel}
            loopEnabled={loopEnabled}
            canUndo={state.canUndo}
            canRedo={state.canRedo}
            hasSelectedLine={Boolean(state.selectedLineId)}
            waveScrollLeft={waveScrollLeft}
            wavePxPerSec={wavePxPerSec}
            formatTime={formatTimeFn}
            onUndo={undo}
            onRedo={redo}
            onSaveDraft={saveDraft}
            onZoomChange={handleZoomChangePx}
            onToggleLoop={handleToggleLoop}
            onSelectLine={selectLine}
            onRegionResize={setLineRangeLive}
            onRegionResizeCommit={(id, s, e) => {
              setLineRangeCommit(id, s, e, dragBaseState);
              setDragBaseState(null);
            }}
            onRegionResizeStart={() => setDragBaseState(getHistoryState())}
            onScroll={handleScroll}
            onSeekBy={(delta) => videoPlayerRef.current?.seekBy(delta)}
            onSeekTo={handleSeekTo}
            onTogglePlayback={() =>
              isPlaying
                ? videoPlayerRef.current?.pause()
                : videoPlayerRef.current?.play()
            }
            waveformController={waveformController}
            mediaController={mediaController}
            peaksInfo={peaksInfo}
            audioUrl={mediaInfo?.audioUrl ? getAudioUrl(mediaInfo.audioUrl) : null}
          />
        </div>
      </div>
    </main>
  );
}

const Editor = dynamic(() => Promise.resolve(EditorImpl), { ssr: false });

export default function Home() {
  return (
    <LyricsProvider>
      <Editor />
    </LyricsProvider>
  );
}
