"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { TIMING } from "@/shared/config/constants";

interface VideoPlayerProps {
  videoId: string | null;
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(time: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YouTubeAPI {
  Player: new (element: HTMLElement, config: object) => YTPlayer;
}

interface WindowWithYT {
  YT?: YouTubeAPI;
  onYouTubeIframeAPIReady?: () => void;
}

export const VideoPlayer = forwardRef<
  {
    play: () => void;
    pause: () => void;
    seekTo: (time: number) => void;
    seekBy: (delta: number) => void;
  },
  VideoPlayerProps
>(function VideoPlayer({ videoId }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    seekTo: (time: number) => playerRef.current?.seekTo(time, true),
    seekBy: (delta: number) => {
      const current = playerRef.current?.getCurrentTime() ?? 0;
      playerRef.current?.seekTo(current + delta, true);
    },
  }));

  const loadYTApi = () => {
    return new Promise<void>((resolve) => {
      const win = window as WindowWithYT;
      if (win.YT?.Player) {
        resolve();
        return;
      }
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      win.onYouTubeIframeAPIReady = resolve;
    });
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const time = playerRef.current.getCurrentTime() ?? 0;
        const state = playerRef.current.getPlayerState();
        const isPlaying = state === 1;

        window.dispatchEvent(
          new CustomEvent("video-timeupdate", {
            detail: { currentTime: time, isPlaying },
          }),
        );
      } catch {
        // YT API throws when iframe not ready - safe to ignore
      }
    }, TIMING.POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (!videoId) {
      stopPolling();
      playerRef.current?.destroy();
      playerRef.current = null;
      return;
    }

    const initPlayer = async () => {
      await loadYTApi();
      stopPolling();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      if (!containerRef.current) return;
      playerRef.current = new (window as WindowWithYT).YT!.Player(
        containerRef.current,
        {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: () => startPolling(),
          },
        },
      );
    };

    initPlayer();

    return () => {
      stopPolling();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  return (
    <div className="w-full aspect-video max-h-[calc(100vh-390px)] min-h-[250px] relative overflow-hidden bg-black rounded-xl border border-white/10 shadow-black shadow-2xl">
      {videoId ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full grid place-items-center gap-3 bg-linear-to-br from-[#151821] to-[#050609]">
          <span className="text-4xl opacity-90">📺</span>
          <p className="text-white/60 text-sm">No source loaded</p>
        </div>
      )}
    </div>
  );
});
