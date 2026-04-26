import WaveSurfer from "wavesurfer.js";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

import type { LyricLine } from "./lyricsTimeline";

type InitOptions = {
  container: HTMLElement;
  timelineContainer: HTMLElement;
  media: HTMLMediaElement;
  onSeek: (time: number) => void;
  onScroll?: (scrollLeft: number) => void;
  onZoomChange?: (pxPerSec: number) => void;
};

export class WaveformController {
  private waveSurfer: WaveSurfer | null = null;
  private seekHandler: ((time: number) => void) | null = null;
  private scrollHandler: ((scrollLeft: number) => void) | null = null;
  private zoomHandler: ((px: number) => void) | null = null;

  private loopLineId: string | null = null;
  private loopRange: { start: number; end: number } | null = null;

  private pendingZoom: number | null = null;
  private isReady = false;
  private currentPxPerSec = 0;

  private pendingLoad: {
    sourceUrl: string;
    peaks: number[] | null;
    duration: number;
  } | null = null;

  init(options: InitOptions): void {
    this.destroy();

    const timelinePlugin = TimelinePlugin.create({
      container: options.timelineContainer,
      height: 18,
      primaryLabelInterval: 10,
      secondaryLabelInterval: 2,
      timeInterval: 1,
    });

    const hoverPlugin = Hover.create({
      lineColor: "#2f3ea8",
      lineWidth: 1,
      labelColor: "#ffffff",
      labelBackground: "#2f3ea8",
      labelSize: "10px",
    });

    this.waveSurfer = WaveSurfer.create({
      container: options.container,
      waveColor: "#4f46e5",
      progressColor: "#8b5cf6",
      cursorColor: "#ffffff",
      cursorWidth: 2,
      height: 170,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      interact: true,
      plugins: [timelinePlugin, hoverPlugin],
    });

    this.seekHandler = options.onSeek;
    this.scrollHandler = options.onScroll ?? null;
    this.zoomHandler = options.onZoomChange ?? null;

    this.waveSurfer.on("ready", () => {
      this.isReady = true;
      if (this.pendingZoom !== null) {
        this.waveSurfer?.zoom(this.pendingZoom);
        this.pendingZoom = null;
      }
      this.emitZoom();
    });

    this.waveSurfer.on("interaction", () => {
      if (!this.waveSurfer || !this.seekHandler) return;
      this.seekHandler(this.waveSurfer.getCurrentTime());
    });

    this.waveSurfer.on("scroll", (startX) => {
      if (!this.scrollHandler || !this.waveSurfer) return;
      // startX is in seconds; convert to pixels
      const px = startX * this.currentPxPerSec;
      this.scrollHandler(px);
    });

    this.waveSurfer.on("zoom", (px) => {
      this.currentPxPerSec = px;
      this.zoomHandler?.(px);
    });

    this.waveSurfer.on("timeupdate", (time) => {
      if (!this.loopRange || !this.waveSurfer || !this.seekHandler) return;
      if (time >= this.loopRange.end) {
        this.waveSurfer.setTime(this.loopRange.start);
        this.seekHandler(this.loopRange.start);
      }
    });

    // Replay any load() call that arrived before init()
    if (this.pendingLoad) {
      const { sourceUrl, peaks, duration } = this.pendingLoad;
      this.pendingLoad = null;
      this._doLoad(sourceUrl, peaks, duration);
    }
  }

  private emitZoom() {
    if (!this.waveSurfer) return;
    // Try to read minPxPerSec via internal options
    const px =
      this.waveSurfer.options?.minPxPerSec ?? this.currentPxPerSec;
    this.currentPxPerSec = px;
    this.zoomHandler?.(px);
  }

  private _doLoad(sourceUrl: string, peaks: number[] | null, duration: number): void {
    if (!this.waveSurfer) return;
    this.isReady = false;

    if (peaks && peaks.length > 0 && duration > 0) {
      this.waveSurfer.load(sourceUrl, [peaks], duration);
      return;
    }
    this.waveSurfer.load(sourceUrl);
  }

  load(sourceUrl: string, peaks: number[] | null, duration: number): void {
    if (!this.waveSurfer) {
      // init() hasn't been called yet — buffer for replay
      this.pendingLoad = { sourceUrl, peaks, duration };
      return;
    }
    this._doLoad(sourceUrl, peaks, duration);
  }

  setZoom(pxPerSec: number): void {
    if (!this.waveSurfer) return;
    if (!this.isReady) {
      this.pendingZoom = pxPerSec;
      return;
    }
    try {
      this.waveSurfer.zoom(pxPerSec);
      this.currentPxPerSec = pxPerSec;
      this.zoomHandler?.(pxPerSec);
    } catch (err) {
      console.warn("WaveSurfer zoom failed:", err);
    }
  }

  syncTime(currentTime: number): void {
    if (!this.waveSurfer) return;
    const drift = Math.abs(this.waveSurfer.getCurrentTime() - currentTime);
    if (drift > 0.2) {
      this.waveSurfer.setTime(currentTime);
    }
  }

  // Kept for API compatibility; now no-op since regions are external
  renderLyricRegions(_lines: LyricLine[], _activeLineId: string | null): void {
    // intentionally empty: rendering moved to LyricRegionsTrack
  }

  toggleLoop(lineId: string, lines: LyricLine[]): boolean {
    if (this.loopLineId === lineId) {
      this.loopLineId = null;
      this.loopRange = null;
      return false;
    }
    const line = lines.find((item) => item.id === lineId);
    if (!line) return false;
    this.loopLineId = line.id;
    this.loopRange = { start: line.start, end: line.end };
    this.syncTime(line.start);
    return true;
  }

  getLoopLineId(): string | null {
    return this.loopLineId;
  }

  getPxPerSec(): number {
    return this.currentPxPerSec;
  }

  destroy(): void {
    this.loopLineId = null;
    this.loopRange = null;
    this.isReady = false;
    this.pendingZoom = null;
    this.pendingLoad = null;
    this.currentPxPerSec = 0;
    if (this.waveSurfer) {
      this.waveSurfer.destroy();
      this.waveSurfer = null;
    }
  }
}

