"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Clapperboard } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("editor.video");
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
    <div className="relative aspect-video max-h-[calc(100vh-390px)] min-h-[150px] w-full overflow-hidden rounded-inner border border-line bg-primary shadow-inner md:min-h-[250px] mt-2">
      {videoId ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-[#092a0e]">
          <div className="grid place-items-center gap-3 text-white/60">
            <Clapperboard size={38} strokeWidth={1.5} />
            <p className="m-0 text-sm">{t("empty")}</p>
          </div>
        </div>
      )}
    </div>
  );
});
