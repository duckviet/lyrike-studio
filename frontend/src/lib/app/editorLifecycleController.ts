import type { LyricsState, LyricsStore } from "../LyricsStore";
import type { MediaController } from "../MediaController";
import type { WaveformController } from "../WaveformController";
import { findActiveLyricIndex, type LyricLine } from "../lyricsTimeline";

type LifecycleDeps = {
  mediaController: MediaController;
  waveformController: WaveformController;
  lyricsStore: LyricsStore;
  getSyncedLines: () => LyricLine[];
  onLyricsStateChange: (state: LyricsState) => void;
  onCurrentTimeChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onError: (message: string) => void;
};

type MountOptions = {
  waveformHost: HTMLDivElement | null;
  waveformTimelineHost: HTMLDivElement | null;
  zoomLevel: number;
  onGlobalKeydown: (event: KeyboardEvent) => void;
  onWaveScroll: (px: number) => void;
  onWaveZoom: (px: number) => void;
};

export function createEditorLifecycleController(deps: LifecycleDeps) {
  let mediaUnsubscribers: Array<() => void> = [];
  let uiCleanup: (() => void) | null = null;

  function startMediaSubscriptions(): void {
    if (mediaUnsubscribers.length > 0) {
      return;
    }

    mediaUnsubscribers = [
      deps.mediaController.subscribe("timeupdate", (payload) => {
        deps.onCurrentTimeChange(payload.currentTime);

        const lines = deps.getSyncedLines();
        const activeIndex = findActiveLyricIndex(lines, payload.currentTime);
        const nextActiveId =
          activeIndex >= 0 ? (lines[activeIndex]?.id ?? null) : null;
        deps.lyricsStore.setActiveLine(nextActiveId);
        deps.waveformController.syncTime(payload.currentTime);
      }),
      deps.mediaController.subscribe("durationchange", (payload) => {
        deps.onDurationChange(payload.duration);
      }),
      deps.mediaController.subscribe("playstate", (payload) => {
        deps.onPlayStateChange(payload.isPlaying);
      }),
      deps.mediaController.subscribe("error", (payload) => {
        deps.onError(payload.message);
      }),
    ];
  }

  function mount(options: MountOptions): void {
    if (!options.waveformHost || !options.waveformTimelineHost) {
      return;
    }

    deps.waveformController.init({
      container: options.waveformHost,
      timelineContainer: options.waveformTimelineHost,
      media: deps.mediaController.getMediaElement(),
      onSeek: (time) => deps.mediaController.seek(time),
      onScroll: options.onWaveScroll,
      onZoomChange: options.onWaveZoom,
    });


    const unsubscribeStore = deps.lyricsStore.subscribe((next) => {
      deps.onLyricsStateChange(next);
    });

    deps.waveformController.setZoom(options.zoomLevel);

    window.addEventListener("keydown", options.onGlobalKeydown);

    uiCleanup = () => {
      unsubscribeStore();
      window.removeEventListener("keydown", options.onGlobalKeydown);
    };
  }

  function syncRegions(lines: LyricLine[], activeLineId: string | null): void {
    deps.waveformController.renderLyricRegions(lines, activeLineId);
  }

  function isLoopSelectionOutdated(selectedLineId: string | null): boolean {
    return deps.waveformController.getLoopLineId() !== selectedLineId;
  }

  function dispose(): void {
    if (uiCleanup) {
      uiCleanup();
      uiCleanup = null;
    }

    mediaUnsubscribers.forEach((unsubscribe) => unsubscribe());
    mediaUnsubscribers = [];

    deps.waveformController.destroy();
  }

  return {
    startMediaSubscriptions,
    mount,
    syncRegions,
    isLoopSelectionOutdated,
    dispose,
  };
}
