import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";

import type { LyricLine } from "@/entities/lyrics";

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
  private media: HTMLMediaElement | null = null;
  private seekHandler: ((time: number) => void) | null = null;
  private scrollHandler: ((scrollLeft: number) => void) | null = null;
  private zoomHandler: ((px: number) => void) | null = null;

  private loopLineId: string | null = null;
  private loopRange: { start: number; end: number } | null = null;

  private pendingZoom: number | null = null;
  private pendingWheelZoom: { readonly pxPerSec: number; readonly scrollLeft: number } | null = null;
  private zoomFrame: number | null = null;
  private isReady = false;
  private currentPxPerSec = 0;
  private hoverTime = 0;

  private pendingLoad: {
    sourceUrl: string;
    peaks: number[] | null;
    duration: number;
  } | null = null;

  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private pointerMoveHandler: ((e: PointerEvent) => void) | null = null;
  private initializedContainers: HTMLElement[] = [];
  private unsubscribes: (() => void)[] = [];

  init(options: InitOptions): void {
    try {
      this.destroy();
      options.container.style.scrollbarWidth = "none";
      (
        options.container.style as CSSStyleDeclaration & {
          msOverflowStyle?: string;
        }
      ).msOverflowStyle = "none";

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
        media: options.media,
        waveColor: "#4f46e5",
        progressColor: "#8b5cf6",
        cursorColor: "#ffffff",
        cursorWidth: 2,
        height: 140,
        barWidth: 4,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        interact: true,
        hideScrollbar: true,
        plugins: [timelinePlugin, hoverPlugin],
      });

      this.media = options.media;
      this.seekHandler = options.onSeek;
      this.scrollHandler = options.onScroll ?? null;
      this.zoomHandler = options.onZoomChange ?? null;

      this.unsubscribes.push(
        this.waveSurfer.on("ready", () => {
          this.isReady = true;
          if (this.pendingZoom !== null) {
            this.waveSurfer?.zoom(this.pendingZoom);
            this.pendingZoom = null;
          }
          this.emitZoom();
        })
      );

      this.unsubscribes.push(
        this.waveSurfer.on("interaction", () => {
          if (!this.waveSurfer || !this.seekHandler) return;
          this.seekHandler(this.waveSurfer.getCurrentTime());
        })
      );

      this.unsubscribes.push(
        this.waveSurfer.on("scroll", () => {
          if (!this.scrollHandler || !this.waveSurfer) return;
          this.scrollHandler(this.waveSurfer.getScroll());
        })
      );

      this.unsubscribes.push(
        this.waveSurfer.on("zoom", (px) => {
          if (this.currentPxPerSec === px) return;
          this.currentPxPerSec = px;
          this.zoomHandler?.(px);
        })
      );

      this.unsubscribes.push(
        this.waveSurfer.on("timeupdate", (time) => {
          if (!this.loopRange || !this.waveSurfer || !this.seekHandler) return;
          if (time >= this.loopRange.end) {
            this.waveSurfer.setTime(this.loopRange.start);
            this.seekHandler(this.loopRange.start);
          }
        })
      );

      this.pointerMoveHandler = (e: PointerEvent) => {
        if (!this.waveSurfer || !this.currentPxPerSec) return;
        const scrollLeft = this.waveSurfer.getScroll();
        const rect = options.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        this.hoverTime = (scrollLeft + x) / this.currentPxPerSec;
      };

      this.wheelHandler = (e: WheelEvent) => {
        if (!this.waveSurfer || this.currentPxPerSec <= 0) return;

        if (e.ctrlKey || e.metaKey) {
          // Zoom with touchpad pinch or Ctrl + Wheel
          e.preventDefault();

          const rect = options.container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const oldPxPerSec = this.currentPxPerSec;
          const scrollLeft = this.waveSurfer.getScroll();
          const timeAtCursor = (scrollLeft + mouseX) / oldPxPerSec;

          // deltaY > 0 is zoom out, deltaY < 0 is zoom in
          const factor = Math.pow(1.1, -e.deltaY / 50);
          let newPxPerSec = oldPxPerSec * factor;

          // Clamp to the same range as the UI slider (20-240)
          newPxPerSec = Math.max(20, Math.min(240, newPxPerSec));

          if (newPxPerSec === oldPxPerSec) return;

          this.pendingWheelZoom = {
            pxPerSec: newPxPerSec,
            scrollLeft: timeAtCursor * newPxPerSec - mouseX,
          };
          if (this.zoomFrame !== null) return;

          this.zoomFrame = requestAnimationFrame(() => {
            this.zoomFrame = null;
            const next = this.pendingWheelZoom;
            this.pendingWheelZoom = null;
            if (!next || !this.waveSurfer) return;
            this.setZoom(next.pxPerSec);
            this.waveSurfer.setScroll(next.scrollLeft);
          });
        } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          // Horizontal scroll with touchpad swipe (two fingers)
          e.preventDefault();
          const scrollLeft = this.waveSurfer.getScroll();
          this.waveSurfer.setScroll(scrollLeft + e.deltaX);
        }
      };

      this.initializedContainers = [options.container, options.timelineContainer];
      this.initializedContainers.forEach((container) => {
        container.addEventListener("pointermove", this.pointerMoveHandler!);
        container.addEventListener("wheel", this.wheelHandler!, {
          passive: false,
        });
      });

      if (this.pendingLoad) {
        const { sourceUrl, peaks, duration } = this.pendingLoad;
        this.pendingLoad = null;
        this._doLoad(sourceUrl, peaks, duration);
      }
    } catch (err) {
      console.error("WaveformController init failed:", err);
    }
  }

  private emitZoom() {
    if (!this.waveSurfer) return;
    const px = this.waveSurfer.options?.minPxPerSec ?? this.currentPxPerSec;
    if (this.currentPxPerSec !== px) {
      this.currentPxPerSec = px;
      this.zoomHandler?.(px);
    }
  }

  private _doLoad(
    sourceUrl: string,
    peaks: number[] | null,
    duration: number,
  ): void {
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
    if (this.currentPxPerSec === pxPerSec) return;
    try {
      this.waveSurfer.zoom(pxPerSec);
    } catch (err) {
      console.warn("WaveSurfer zoom failed:", err);
    }
  }

  syncTime(currentTime: number): void {
    if (!this.waveSurfer) return;
    const drift = Math.abs(this.waveSurfer.getCurrentTime() - currentTime);
    if (drift > 0.15) {
      this.waveSurfer.setTime(currentTime);
    }
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

  getHoverTime(): number {
    return this.hoverTime;
  }

  destroy(): void {
    this.media = null;
    this.loopLineId = null;
    this.loopRange = null;
    this.isReady = false;
    this.pendingZoom = null;
    this.pendingWheelZoom = null;
    this.pendingLoad = null;
    this.currentPxPerSec = 0;
    if (this.zoomFrame !== null) {
      cancelAnimationFrame(this.zoomFrame);
      this.zoomFrame = null;
    }

    if (this.wheelHandler || this.pointerMoveHandler) {
      this.initializedContainers.forEach((container) => {
        if (this.wheelHandler) container.removeEventListener("wheel", this.wheelHandler);
        if (this.pointerMoveHandler) container.removeEventListener("pointermove", this.pointerMoveHandler);
      });
    }
    this.wheelHandler = null;
    this.pointerMoveHandler = null;
    this.initializedContainers = [];

    this.unsubscribes.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // Safe check
      }
    });
    this.unsubscribes = [];

    if (this.waveSurfer) {
      this.waveSurfer.destroy();
      this.waveSurfer = null;
    }
  }
}
