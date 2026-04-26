<script lang="ts">
  import type { FetchMediaResponse } from "../lib/api";
  import type { LyricsState } from "../lib/LyricsStore";
  import LyricRegionsTrack from "./LyricRegionsTrack.svelte";

  interface Props {
    activeTab: "source" | "timeline" | "lyrics";
    mediaInfo: FetchMediaResponse | null;
    lyricsState: LyricsState;
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
    onZoomChange: (event: Event) => void;
    onToggleLoop: () => void;
    onSelectLine: (lineId: string) => void;
    onRegionResize: (lineId: string, start: number, end: number) => void;
    onRegionResizeCommit: (lineId: string, start: number, end: number) => void;
    onRegionResizeStart?: () => void;
    waveformHost: HTMLDivElement | null;
    waveformTimelineHost: HTMLDivElement | null;
    onSeekBy: (delta: number) => void;
    onSeekTo: (time: number) => void;
    onTogglePlayback: () => void;
  }

  let {
    activeTab,
    mediaInfo,
    lyricsState,
    currentTime = 0,
    duration = 0,
    peaksState = "idle",
    peaksMessage = "",
    zoomLevel = 52,
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
    waveformHost = $bindable(null),
    waveformTimelineHost = $bindable(null),
    onSeekBy,
    onSeekTo,
    onTogglePlayback,
  }: Props = $props();

  function handleWaveformClick(event: MouseEvent) {
    if (!mediaInfo) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = (waveScrollLeft + x) / (wavePxPerSec || zoomLevel);
    onSeekTo(Math.max(0, Math.min(duration, time)));
  }
</script>

<article class="panel timeline-column" class:hidden-mobile={activeTab !== "timeline"}>
  <div class="transport-bar">
    <div class="transport-left">
      <button type="button" class="btn primary icon-text" disabled={!mediaInfo?.audioReady} onclick={onTogglePlayback}>
        ▶ Play/Pause
      </button>
      <div class="btn-group">
        <button type="button" class="btn secondary" disabled={!mediaInfo?.audioReady} onclick={() => onSeekBy(-5)}>−5s</button>
        <button type="button" class="btn secondary" disabled={!mediaInfo?.audioReady} onclick={() => onSeekBy(5)}>+5s</button>
      </div>
    </div>

    <div class="transport-center">
      <span class="zoom-label">Zoom</span>
      <input
        class="zoom-slider"
        type="range"
        min="20"
        max="240"
        step="2"
        value={zoomLevel}
        oninput={onZoomChange}
      />
    </div>

    <div class="transport-right">
      <button type="button" class="btn secondary compact" onclick={onToggleLoop} class:active={loopEnabled}>Loop</button>
      <div class="time-readout">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      <div class="btn-group">
        <button type="button" class="btn secondary compact" onclick={onUndo} disabled={!canUndo}>Undo</button>
        <button type="button" class="btn secondary compact" onclick={onRedo} disabled={!canRedo}>Redo</button>
        <button type="button" class="btn secondary compact" onclick={onSaveDraft}>Draft</button>
      </div>
    </div>
  </div>

  <div class="waveform-area">
    <div class="waveform-placeholder" class:hidden={!!mediaInfo}>
      <span>Load a video to see the waveform</span>
    </div>

    <div
      class="ruler-track"
      bind:this={waveformTimelineHost}
      class:hidden={!mediaInfo}
      role="presentation"
      onclick={handleWaveformClick}
    ></div>
    <div
      class="wave-track"
      bind:this={waveformHost}
      class:hidden={!mediaInfo}
      role="presentation"
      onclick={handleWaveformClick}
    ></div>

    {#if mediaInfo}
      <LyricRegionsTrack
        lines={lyricsState.doc.syncedLines}
        {duration}
        pxPerSec={wavePxPerSec || zoomLevel}
        scrollLeft={waveScrollLeft}
        activeLineId={lyricsState.activeLineId}
        selectedLineId={lyricsState.selectedLineId}
        {onSelectLine}
        onResize={onRegionResize}
        onResizeCommit={onRegionResizeCommit}
        onResizeStart={onRegionResizeStart}
      />
    {/if}

    {#if mediaInfo && peaksState !== "idle"}
      <p class="peaks-status" data-state={peaksState}>{peaksMessage}</p>
    {/if}
  </div>
</article>

<style>
  .hidden {
    display: none !important;
  }

  .timeline-column {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--radius-lg);
    border: 1px solid var(--line);
    background: rgba(255, 255, 251, 0.86);
    box-shadow: var(--shadow-sm);
  }

  .transport-bar {
    min-height: 54px;
    padding: 0.5rem 0.75rem;
    flex-shrink: 0;
    display: grid;
    grid-template-columns: minmax(260px, auto) 1fr minmax(320px, auto);
    align-items: center;
    gap: 0.75rem;
    background: rgba(255, 255, 251, 0.92);
    border-bottom: 1px solid var(--line);
  }

  .transport-left,
  .transport-right {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .transport-right {
    justify-content: flex-end;
  }

  .transport-center {
    min-width: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.7rem;
  }

  .zoom-label {
    font-size: 0.68rem;
    font-weight: 800;
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .zoom-slider {
    width: min(260px, 100%);
    height: 5px;
    border: 1px solid #cfd8b7;
    border-radius: 999px;
    background: #e7ecd2;
    appearance: none;
    cursor: pointer;
    padding: 0;
  }

  .zoom-slider::-webkit-slider-thumb {
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--primary-deep);
    box-shadow: 0 1px 4px rgba(31, 41, 24, 0.25);
  }

  .btn-group {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #f3f6e7;
  }

  .btn-group .btn {
    border: 0;
    background: transparent;
    box-shadow: none;
    border-radius: 8px;
    padding: 0.42rem 0.68rem;
  }

  .btn-group .btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.72);
  }

  .btn.secondary.active {
    background: var(--indigo);
    color: #fff;
    border-color: var(--indigo);
  }

  .btn.primary {
    border-radius: 10px;
    padding: 0.52rem 0.92rem;
  }


  .time-readout {
    min-width: 142px;
    padding: 0.42rem 0.65rem;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #fefff5;
    color: #34403b;
    text-align: center;
    font-family: "IBM Plex Mono", "Consolas", monospace;
    font-size: 0.86rem;
    font-variant-numeric: tabular-nums;
  }

  .waveform-area {
    min-height: 0;
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
    position: relative;
    background: #f7faec;
  }

  .waveform-placeholder {
    flex: 1;
    display: grid;
    place-items: center;
    border: 1px dashed #bac59b;
    border-radius: 12px;
    background: radial-gradient(circle at 50% 20%, rgba(183, 223, 45, 0.14), transparent 34%),
      rgba(255, 255, 251, 0.62);
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  .ruler-track {
    height: 30px;
    flex-shrink: 0;
    overflow: hidden;
    border: 1px solid #cdd6b4;
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
    background: #eef3df;
  }

  .wave-track {
    min-height: 0;
    flex: 1;
    overflow: hidden;
    border-left: 1px solid #cdd6b4;
    border-right: 1px solid #cdd6b4;
    background: linear-gradient(180deg, #172216, #1f2d18);
    box-shadow: inset 0 2px 16px rgba(0, 0, 0, 0.28);
  }

  .peaks-status {
    position: absolute;
    right: 1.25rem;
    bottom: 1.2rem;
    margin: 0;
    border-radius: 999px;
    background: rgba(255, 255, 251, 0.78);
    color: #7a855a;
    backdrop-filter: blur(8px);
    padding: 0.25rem 0.58rem;
    font-size: 0.72rem;
  }


  .peaks-status[data-state="error"] {
    color: var(--danger);
  }

  @media (max-width: 1180px) {
    .transport-bar {
      grid-template-columns: 1fr;
    }

    .transport-left,
    .transport-center,
    .transport-right {
      justify-content: center;
      flex-wrap: wrap;
    }
  }
</style>
