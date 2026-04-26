'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

interface VideoPlayerProps {
  videoId: string | null
  onTimeUpdate?: (time: number) => void
  onPlayStateChange?: (playing: boolean) => void
  onDurationChange?: (duration: number) => void
}

export const VideoPlayer = forwardRef<{ play: () => void; pause: () => void; seekTo: (time: number) => void; seekBy: (delta: number) => void }, VideoPlayerProps>(
  function VideoPlayer({ videoId, onTimeUpdate, onPlayStateChange, onDurationChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<any>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Keep callback refs up to date so the polling interval always uses the latest version
    const onTimeUpdateRef = useRef(onTimeUpdate)
    const onPlayStateChangeRef = useRef(onPlayStateChange)
    const onDurationChangeRef = useRef(onDurationChange)

    useEffect(() => { onTimeUpdateRef.current = onTimeUpdate }, [onTimeUpdate])
    useEffect(() => { onPlayStateChangeRef.current = onPlayStateChange }, [onPlayStateChange])
    useEffect(() => { onDurationChangeRef.current = onDurationChange }, [onDurationChange])

    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      seekTo: (time: number) => playerRef.current?.seekTo(time, true),
      seekBy: (delta: number) => {
        const current = playerRef.current?.getCurrentTime() ?? 0
        playerRef.current?.seekTo(current + delta, true)
      },
    }))

    const loadYTApi = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).YT?.Player) {
          resolve()
          return
        }
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag);
        (window as any).onYouTubeIframeAPIReady = resolve
      })
    }

    const startPolling = () => {
      stopPolling()
      pollRef.current = setInterval(() => {
        if (!playerRef.current) return
        try {
          const time = playerRef.current.getCurrentTime() ?? 0
          onTimeUpdateRef.current?.(time)
          const state = playerRef.current.getPlayerState()
          onPlayStateChangeRef.current?.(state === 1)
        } catch (e) {}
      }, 100)
    }

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }

    useEffect(() => {
      if (!videoId) {
        stopPolling()
        playerRef.current?.destroy()
        playerRef.current = null
        return
      }

      const initPlayer = async () => {
        await loadYTApi()
        stopPolling()
        if (playerRef.current) {
          playerRef.current.destroy()
          playerRef.current = null
        }

        playerRef.current = new (window as any).YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: () => {
              onDurationChangeRef.current?.(playerRef.current.getDuration() ?? 0)
              startPolling()
            },
            onStateChange: (e: any) => {
              onPlayStateChangeRef.current?.(e.data === 1)
            },
          },
        })
      }

      initPlayer()

      return () => {
        stopPolling()
        playerRef.current?.destroy()
        playerRef.current = null
      }
    }, [videoId])

    return (
      <div className="w-full aspect-video max-h-[calc(100vh-390px)] min-h-[280px] relative overflow-hidden bg-black rounded-xl border border-white/10 shadow-[0_22px_60px_rgba(0,0,0,0.42),0_0_0_1px_rgba(0,0,0,0.4)]">
        {videoId ? (
          <div ref={containerRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full grid place-items-center gap-3 bg-gradient-to-br from-[#151821] to-[#050609]">
            <span className="text-4xl opacity-90">📺</span>
            <p className="text-white/60 text-sm">No source loaded</p>
          </div>
        )}
      </div>
    )
  }
)