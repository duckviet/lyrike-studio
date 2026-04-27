type PlaybackEventName =
  | "timeupdate"
  | "durationchange"
  | "playstate"
  | "sourcechange"
  | "error";

type PlaybackEventMap = {
  timeupdate: { currentTime: number };
  durationchange: { duration: number };
  playstate: { isPlaying: boolean };
  sourcechange: { sourceUrl: string };
  error: { message: string };
};

export class MediaController {
  private readonly audio: HTMLAudioElement;
  private readonly bus: EventTarget;

  constructor() {
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.bus = new EventTarget();

      this.audio.preload = "auto";

      this.audio.addEventListener("timeupdate", () => {
        this.emit("timeupdate", { currentTime: this.audio.currentTime });
      });

      this.audio.addEventListener("loadedmetadata", () => {
        this.emit("durationchange", { duration: this.audio.duration || 0 });
      });

      this.audio.addEventListener("play", () => {
        this.emit("playstate", { isPlaying: true });
      });

      this.audio.addEventListener("pause", () => {
        this.emit("playstate", { isPlaying: false });
      });

      this.audio.addEventListener("error", () => {
        const mediaError = this.audio.error;
        const message = mediaError
          ? `Audio error code ${mediaError.code}`
          : "Unknown audio error";
        this.emit("error", { message });
      });
    } else {
      // Mock for SSR
      this.audio = null as unknown as HTMLAudioElement;
      this.bus = null as unknown as EventTarget;
    }
  }

  subscribe<T extends PlaybackEventName>(
    name: T,
    handler: (payload: PlaybackEventMap[T]) => void,
  ): () => void {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<PlaybackEventMap[T]>).detail;
      handler(detail);
    };

    this.bus.addEventListener(name, listener);
    return () => {
      this.bus.removeEventListener(name, listener);
    };
  }

  setSource(sourceUrl: string): void {
    this.audio.src = sourceUrl;
    this.audio.load();
    this.emit("sourcechange", { sourceUrl });
  }

  async play(): Promise<void> {
    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  async toggle(): Promise<void> {
    if (this.audio.paused) {
      await this.play();
      return;
    }
    this.pause();
  }

  seek(nextTime: number): void {
    const duration = Number.isFinite(this.audio.duration)
      ? this.audio.duration
      : 0;
    const clamped = Math.max(
      0,
      Math.min(nextTime, duration || Number.MAX_SAFE_INTEGER),
    );
    this.audio.currentTime = clamped;
    this.emit("timeupdate", { currentTime: this.audio.currentTime });
  }

  seekBy(deltaSeconds: number): void {
    this.seek(this.audio.currentTime + deltaSeconds);
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getMediaElement(): HTMLAudioElement {
    return this.audio;
  }

  private emit<T extends PlaybackEventName>(
    name: T,
    payload: PlaybackEventMap[T],
  ): void {
    this.bus.dispatchEvent(new CustomEvent(name, { detail: payload }));
  }
}