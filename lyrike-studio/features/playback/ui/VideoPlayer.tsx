"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Clapperboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { editorMediaController } from "@/features/editor/store/editorControllers";
import { syncVideoPlayerToMediaController } from "@/features/playback/model/videoPlayerSync";

interface VideoPlayerProps {
  videoId: string | null;
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(time: number, allowSeekAhead: boolean): void;
  mute(): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  addEventListener(
    event: string,
    listener: (event: { data: number }) => void,
  ): void;
  removeEventListener(
    event: string,
    listener: (event: { data: number }) => void,
  ): void;
  destroy(): void;
}

interface YouTubeAPI {
  Player: new (element: HTMLElement, config: object) => YTPlayer;
}

interface WindowWithYT {
  YT?: YouTubeAPI;
  onYouTubeIframeAPIReady?: () => void;
}

const hasPlayerMethod = <T extends keyof YTPlayer>(
  player: YTPlayer | null,
  method: T,
): player is YTPlayer & Record<T, YTPlayer[T]> => {
  return typeof player?.[method] === "function";
};

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
  const syncCleanupRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (hasPlayerMethod(playerRef.current, "playVideo")) {
        playerRef.current.playVideo();
      }
    },
    pause: () => {
      if (hasPlayerMethod(playerRef.current, "pauseVideo")) {
        playerRef.current.pauseVideo();
      }
    },
    seekTo: (time: number) => {
      if (hasPlayerMethod(playerRef.current, "seekTo")) {
        playerRef.current.seekTo(time, true);
      }
    },
    seekBy: (delta: number) => {
      if (
        hasPlayerMethod(playerRef.current, "getCurrentTime") &&
        hasPlayerMethod(playerRef.current, "seekTo")
      ) {
        const current = playerRef.current.getCurrentTime() ?? 0;
        playerRef.current.seekTo(current + delta, true);
      }
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

  useEffect(() => {
    if (!videoId) {
      syncCleanupRef.current?.();
      syncCleanupRef.current = null;
      playerRef.current?.destroy();
      playerRef.current = null;
      return;
    }

    const initPlayer = async () => {
      await loadYTApi();
      syncCleanupRef.current?.();
      syncCleanupRef.current = null;
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
            playsinline: 1,
          },
          events: {
            onReady: () => {
              if (!playerRef.current) return;
              if (hasPlayerMethod(playerRef.current, "mute")) {
                playerRef.current.mute();
              }
              syncCleanupRef.current = syncVideoPlayerToMediaController(
                playerRef.current,
                editorMediaController,
              );
              if (process.env.NODE_ENV === "development") {
                (window as unknown as Record<string, unknown>).__ytPlayer =
                  playerRef.current;
              }
            },
          },
        },
      );
    };

    initPlayer();

    return () => {
      syncCleanupRef.current?.();
      syncCleanupRef.current = null;
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
