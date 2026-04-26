"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MediaController } from "@/entities/media";

export function useMediaController() {
  const controllerRef = useRef<MediaController | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    controllerRef.current = new MediaController();
    const ctrl = controllerRef.current;

    const unsubTime = ctrl.subscribe("timeupdate", ({ currentTime: t }) =>
      setCurrentTime(t),
    );
    const unsubDuration = ctrl.subscribe("durationchange", ({ duration: d }) =>
      setDuration(d),
    );
    const unsubPlay = ctrl.subscribe("playstate", ({ isPlaying: p }) =>
      setIsPlaying(p),
    );
    const unsubError = ctrl.subscribe("error", ({ message }) =>
      setError(message),
    );

    return () => {
      unsubTime();
      unsubDuration();
      unsubPlay();
      unsubError();
    };
  }, []);

  const setSource = useCallback((sourceUrl: string) => {
    controllerRef.current?.setSource(sourceUrl);
  }, []);

  const play = useCallback(() => controllerRef.current?.play(), []);
  const pause = useCallback(() => controllerRef.current?.pause(), []);
  const toggle = useCallback(() => controllerRef.current?.toggle(), []);
  const seek = useCallback(
    (time: number) => controllerRef.current?.seek(time),
    [],
  );
  const seekBy = useCallback(
    (delta: number) => controllerRef.current?.seekBy(delta),
    [],
  );

  return {
    currentTime,
    duration,
    isPlaying,
    error,
    setSource,
    play,
    pause,
    toggle,
    seek,
    seekBy,
  };
}
