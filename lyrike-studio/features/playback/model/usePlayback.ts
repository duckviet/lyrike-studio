"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MediaController, WaveformController } from "@/entities/media";

export interface UsePlaybackOptions {
  mediaController: MediaController;
  waveformController: WaveformController;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export interface UsePlaybackReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoomLevel: number;
  waveScrollLeft: number;
  wavePxPerSec: number;
  setZoomLevel: (px: number) => void;
  handleSeekBy: (delta: number) => void;
  handleSeekTo: (time: number) => void;
  handlePlayPause: () => void;
  handleZoomChange: (px: number) => void;
  handleScroll: (px: number) => void;
}

export function usePlayback({
  mediaController,
  waveformController,
  onTimeUpdate,
  onPlayStateChange,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(52);
  const [waveScrollLeft, setWaveScrollLeft] = useState(0);
  const [wavePxPerSec, setWavePxPerSec] = useState(52);

  useEffect(() => {
    const unsubTime = mediaController.subscribe("timeupdate", ({ currentTime: t }) => {
      setCurrentTime(t);
      onTimeUpdate(t);
    });
    const unsubDuration = mediaController.subscribe("durationchange", ({ duration: d }) => {
      setDuration(d);
    });
    const unsubPlay = mediaController.subscribe("playstate", ({ isPlaying: p }) => {
      setIsPlaying(p);
      onPlayStateChange(p);
    });

    return () => {
      unsubTime();
      unsubDuration();
      unsubPlay();
    };
  }, [mediaController, onTimeUpdate, onPlayStateChange]);

  const handleSeekBy = useCallback((delta: number) => {
    mediaController.seekBy(delta);
  }, [mediaController]);

  const handleSeekTo = useCallback((time: number) => {
    mediaController.seek(Math.max(0, Math.min(duration, time)));
  }, [mediaController, duration]);

  const handlePlayPause = useCallback(() => {
    mediaController.toggle();
  }, [mediaController]);

  const handleZoomChange = useCallback((px: number) => {
    setZoomLevel(px);
    setWavePxPerSec(px);
    waveformController.setZoom(px);
  }, [waveformController]);

  const handleScroll = useCallback((px: number) => {
    setWaveScrollLeft(px);
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    zoomLevel,
    waveScrollLeft,
    wavePxPerSec,
    setZoomLevel,
    handleSeekBy,
    handleSeekTo,
    handlePlayPause,
    handleZoomChange,
    handleScroll,
  };
}