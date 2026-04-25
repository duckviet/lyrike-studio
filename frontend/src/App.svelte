<script lang="ts">
  // Syncing props with Svelte 5 TimelinePanel
  import { onDestroy, onMount } from "svelte";

  import {
    fetchMedia,
    fetchPeaks,
    getAudioUrl,
    requestTranscription,
    streamTranscription,
    type FetchMediaResponse,
    type PeaksResponse,
  } from "./lib/api";
  import { createDraftManager } from "./lib/app/draftManager";
  import { createEditorLifecycleController } from "./lib/app/editorLifecycleController";
  import { formatTime } from "./lib/app/formatters";
  import { createGlobalKeydownHandler } from "./lib/app/keyboardShortcuts";
  import { createLyricsActions } from "./lib/app/lyricsActions";
  import {
    fetchMediaForEditor,
    runTranscriptionFlow,
  } from "./lib/app/mediaWorkflow";
  import { findActiveLyricIndex, type LyricLine } from "./lib/lyricsTimeline";
  import LyricsPanel from "./components/LyricsPanel.svelte";
  import MobileTabs from "./components/MobileTabs.svelte";
  import SourcePanel from "./components/SourcePanel.svelte";
  import TimelinePanel from "./components/TimelinePanel.svelte";
  import VideoPlayer from "./components/VideoPlayer.svelte";
  import {
    LyricsStore,
    type LyricsState,
  } from "./lib/LyricsStore";
  import { MediaController } from "./lib/MediaController";
  import { WaveformController } from "./lib/WaveformController";

  type TabId = "source" | "timeline" | "lyrics";

  const tabs: { id: TabId; label: string }[] = [
    { id: "source", label: "Source" },
    { id: "timeline", label: "Timeline" },
    { id: "lyrics", label: "Lyrics" },
  ];

  const mediaController = new MediaController();
  const waveformController = new WaveformController();
  const lyricsStore = new LyricsStore();
  const draftManager = createDraftManager();

  let activeTab: TabId = "timeline";
  let sourceInput = "";
  let fetchState: "idle" | "loading" | "ready" | "error" = "idle";
  let sourceMessage = "No source loaded yet.";
  let transcribeState = "idle";
  let mediaInfo: FetchMediaResponse | null = null;
  let peaksInfo: PeaksResponse | null = null;
  let peaksState: "idle" | "loading" | "ready" | "error" = "idle";
  let peaksMessage = "No peaks generated yet.";
  let peakPreview: number[] = [];
  let lyricsState: LyricsState = lyricsStore.getState();
  let waveformHost: HTMLDivElement | null = null;
  let waveformTimelineHost: HTMLDivElement | null = null;
  let zoomLevel = 52;
  let loopEnabled = false;

  let waveScrollLeft = 0;
  let wavePxPerSec = zoomLevel;

  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let transcribeAbortController: AbortController | null = null;

  const lyricsActions = createLyricsActions({
    lyricsStore,
    mediaController,
    getCurrentTime: () => currentTime,
  });

  const lifecycleController = createEditorLifecycleController({
    mediaController,
    waveformController,
    lyricsStore,
    getSyncedLines: () => lyricsState.doc.syncedLines,
    onLyricsStateChange: (next) => {
      lyricsState = next;
    },
    onCurrentTimeChange: (value) => {
      currentTime = value;
    },
    onDurationChange: (value) => {
      duration = value;
    },
    onPlayStateChange: (value) => {
      isPlaying = value;
    },
    onError: (message) => {
      sourceMessage = message;
      fetchState = "error";
    },
  });

  function saveDraft() {
    if (!mediaInfo) {
      sourceMessage = "Load media before saving a draft.";
      return;
    }

    draftManager.save(mediaInfo.videoId, {
      doc: lyricsState.doc,
      selectedLineId: lyricsState.selectedLineId,
    });
    sourceMessage = "Draft saved locally.";
  }

  function maybeRestoreDraft(videoId: string) {
    const draft = draftManager.load(videoId);
    if (!draft) {
      return;
    }

    const shouldRestore = confirm(
      "Found a local draft for this video. Do you want to restore it?",
    );

    if (!shouldRestore) {
      return;
    }

    lyricsStore.loadDraft(draft.doc, draft.selectedLineId ?? null);
    sourceMessage = "Draft restored from local storage.";
  }

  let videoPlayerRef: VideoPlayer;
  let isSidebarCollapsed = false;

  function handleTimeUpdate(time: number) {
    currentTime = time;
    waveformController.syncTime(time);

    // Auto-follow lyrics during playback
    const lines = lyricsState.doc.syncedLines;
    const activeIndex = findActiveLyricIndex(lines, time);
    if (activeIndex >= 0) {
      const activeLineId = lines[activeIndex].id;
      lyricsStore.setActiveLine(activeLineId);
    } else {
      lyricsStore.setActiveLine(null);
    }
  }

  function handlePlayStateChange(playing: boolean) {
    isPlaying = playing;
  }

  function handleDurationChange(dur: number) {
    duration = dur;
  }

  const onGlobalKeydown = createGlobalKeydownHandler({
    onSaveDraft: saveDraft,
    onUndo: lyricsActions.undo,
    onRedo: lyricsActions.redo,
    onTapSync: lyricsActions.tapSync,
    onTogglePlayback: () =>
      isPlaying ? videoPlayerRef?.pause() : videoPlayerRef?.play(),
    onSelectOffset: (offset) => lyricsStore.selectByOffset(offset),
    onFineSeek: (delta) => videoPlayerRef?.seekBy(delta),
  });

  onMount(() => {
    lifecycleController.mount({
      waveformHost,
      waveformTimelineHost,
      zoomLevel,
      onGlobalKeydown,
      onWaveScroll: (px) => { waveScrollLeft = px; },
      onWaveZoom: (px) => { wavePxPerSec = px; },
    });
  });

  onDestroy(() => {
    lifecycleController.dispose();
    transcribeAbortController?.abort();
  });

  $: if (lifecycleController.isLoopSelectionOutdated(lyricsState.selectedLineId)) {
    loopEnabled = false;
  }
  $: lifecycleController.syncRegions(
    lyricsState.doc.syncedLines,
    lyricsState.activeLineId ?? lyricsState.selectedLineId,
  );

  async function handleFetch() {
    if (!sourceInput.trim()) {
      sourceMessage = "Please enter a valid source URL.";
      fetchState = "error";
      return;
    }

    try {
      fetchState = "loading";
      sourceMessage = "Fetching metadata and caching audio...";
      transcribeState = "idle";
      peaksInfo = null;
      peaksState = "loading";
      peaksMessage = "Generating waveform peaks...";

      const result = await fetchMediaForEditor({
        sourceUrl: sourceInput.trim(),
        fetchMediaFn: fetchMedia,
        fetchPeaksFn: fetchPeaks,
        getAudioUrlFn: getAudioUrl,
        mediaController,
        waveformController,
        lyricsStore,
        restoreDraft: maybeRestoreDraft,
      });

      mediaInfo = result.mediaInfo;
      peaksInfo = result.peaks.peaksInfo;
      peaksState = result.peaks.peaksState;
      peaksMessage = result.peaks.peaksMessage;
      sourceMessage = result.sourceMessage;
      fetchState = "ready";
      loopEnabled = false;
    } catch (error) {
      peaksState = "error";
      peaksMessage = "Failed to load waveform peaks.";
      fetchState = "error";
      sourceMessage = error instanceof Error ? error.message : "Failed to fetch source.";
    }
  }

  function handleZoomChange(event: Event) {
    const nextZoom = Number((event.currentTarget as HTMLInputElement).value);
    zoomLevel = nextZoom;
    wavePxPerSec = nextZoom;
    waveformController.setZoom(nextZoom);
  }

  function toggleLoopForActiveLine() {
    if (!lyricsState.selectedLineId) {
      return;
    }

    loopEnabled = waveformController.toggleLoop(lyricsState.selectedLineId, lyricsState.doc.syncedLines);
  }

  async function handleTranscribe() {
    if (!mediaInfo) return;
    
    transcribeAbortController = new AbortController();
    try {
      transcribeState = "starting";
      const result = await runTranscriptionFlow({
        mediaInfo,
        requestFn: requestTranscription,
        streamFn: streamTranscription,
        lyricsStore,
        onStatus: (status) => {
          transcribeState = status;
        },
        signal: transcribeAbortController.signal
      });
      transcribeState = result.transcribeState;
      sourceMessage = result.sourceMessage;
    } catch (e) {
      transcribeState = "error";
      sourceMessage = "Transcription failed.";
    }
  }
</script>

<main class="app-shell">
  <header class="top-header">
    <div class="logo">
      <div class="logo-icon"></div>
      <h1>Lyrics Studio</h1>
    </div>
    <div class="header-actions">
      <button class="btn ghost compact" on:click={lyricsActions.undo} disabled={!lyricsState.canUndo}>Undo</button>
      <button class="btn ghost compact" on:click={lyricsActions.redo} disabled={!lyricsState.canRedo}>Redo</button>
      <button class="btn primary compact" on:click={saveDraft}>Save Draft</button>
    </div>
  </header>

  <div class="app-body">
    <div class="workspace-top">
      <div class="sidebar-wrapper" style="width: {isSidebarCollapsed ? '40px' : '320px'}">
        <aside class="sidebar-content" class:collapsed={isSidebarCollapsed}>
          <SourcePanel
            {activeTab}
            bind:sourceInput
            {fetchState}
            {sourceMessage}
            {mediaInfo}
            {transcribeState}
            {formatTime}
            onFetch={handleFetch}
            onTranscribe={handleTranscribe}
          />
        </aside>
        <button class="sidebar-toggle" on:click={() => isSidebarCollapsed = !isSidebarCollapsed}>
          {isSidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      <section class="main-stage">
        <VideoPlayer
          videoId={mediaInfo?.videoId ?? null}
          onTimeUpdate={handleTimeUpdate}
          onPlayStateChange={handlePlayStateChange}
          onDurationChange={handleDurationChange}
          bind:this={videoPlayerRef}
        />
      </section>

      <aside class="right-panel">
        <LyricsPanel
          {activeTab}
          {lyricsState}
          {formatTime}
          onSetTab={lyricsActions.setTab}
          onSeekLine={lyricsActions.seekLine}
          onEditLineText={lyricsActions.editLineText}
          onSelectLine={lyricsActions.selectLine}
          onReorder={lyricsActions.reorder}
          onInsertAfter={lyricsActions.insertAfter}
          onSplit={lyricsActions.split}
          onMerge={lyricsActions.merge}
          onDelete={lyricsActions.delete}
          onNudge={lyricsActions.nudgeLine}
          onSetPlainLyrics={lyricsActions.setPlainLyrics}
          onUpdateMetaField={lyricsActions.updateMetaField}
          onImportLrc={lyricsActions.importLrc}
          onExportLrc={lyricsActions.exportLrc}
        />
      </aside>
    </div>

    <div class="workspace-bottom">
      <TimelinePanel
        activeTab="timeline"
        {mediaInfo}
        {currentTime}
        {duration}
        {peaksState}
        {peaksMessage}
        {zoomLevel}
        {loopEnabled}
        {lyricsState}
        {waveScrollLeft}
        {wavePxPerSec}
        canUndo={lyricsState.canUndo}
        canRedo={lyricsState.canRedo}
        hasSelectedLine={Boolean(lyricsState.selectedLineId)}
        {formatTime}
        onUndo={lyricsActions.undo}
        onRedo={lyricsActions.redo}
        onSaveDraft={saveDraft}
        onZoomChange={handleZoomChange}
        onToggleLoop={toggleLoopForActiveLine}
        onSelectLine={lyricsActions.selectLine}
        onRegionResize={(id, s, e) => lyricsStore.setLineRange(id, s, e)}
        onSeekBy={(delta) => videoPlayerRef?.seekBy(delta)}
        onTogglePlayback={() => isPlaying ? videoPlayerRef?.pause() : videoPlayerRef?.play()}
        bind:waveformHost
        bind:waveformTimelineHost
      />
    </div>
  </div>
</main>


<style>
  :global(body, html) {
    margin: 0;
    padding: 0;
    height: 100%;
  }

  .app-shell {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
  }

  .top-header {
    height: 56px;
    padding: 0 1.25rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 251, 0.86);
    border-bottom: 1px solid var(--line);
    backdrop-filter: blur(14px);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-icon {
    width: 18px;
    height: 18px;
    border-radius: 6px;
    background: linear-gradient(135deg, var(--primary), #e4f766);
    box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.08);
  }

  .logo h1 {
    margin: 0;
    font-size: 1.04rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--ink);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .app-body {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .workspace-top {
    min-height: 0;
    flex: 1;
    display: grid;
    grid-template-columns: auto minmax(460px, 1fr) 400px;
    gap: 8px;
    padding: 8px;
  }

  .workspace-bottom {
    height: 302px;
    flex-shrink: 0;
    padding: 0 8px 8px;
  }

  .sidebar-wrapper {
    width: 320px;
    min-width: 40px;
    height: 100%;
    display: flex;
    flex-direction: row-reverse;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 251, 0.7);
    box-shadow: var(--shadow-sm);
    transition: width 220ms ease;
  }

  .sidebar-content {
    min-width: 0;
    flex: 1;
    overflow-y: auto;
    opacity: 1;
    transition: opacity 160ms ease;
  }

  .sidebar-content.collapsed {
    opacity: 0;
    pointer-events: none;
  }

  .sidebar-toggle {
    width: 34px;
    flex-shrink: 0;
    border: 0;
    border-right: 1px solid var(--line);
    background: #f3f6e5;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  .sidebar-toggle:hover {
    background: #ebf1d2;
    color: var(--ink);
  }

  .main-stage {
    min-width: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: linear-gradient(180deg, rgba(14, 15, 20, 0.96), rgba(0, 0, 0, 0.98)), #000;
    box-shadow: var(--shadow);
    overflow: hidden;
  }

  .right-panel {
    min-width: 0;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 251, 0.82);
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: 1180px) {
    .workspace-top {
      grid-template-columns: auto minmax(360px, 1fr);
    }

    .right-panel {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .app-shell {
      height: auto;
      min-height: 100vh;
      overflow: visible;
    }

    .top-header {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .workspace-top {
      grid-template-columns: 1fr;
      grid-auto-rows: auto;
    }

    .sidebar-wrapper {
      display: none;
    }

    .main-stage {
      min-height: auto;
    }

    .workspace-bottom {
      height: 360px;
    }
  }
</style>
