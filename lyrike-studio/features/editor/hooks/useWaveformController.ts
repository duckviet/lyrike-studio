"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

interface UseWaveformOptions {
  container: HTMLElement | null;
  timelineContainer: HTMLElement | null;
  media: HTMLMediaElement | null;
  initialZoom?: number;
  onSeek?: (time: number) => void;
  onScroll?: (scrollLeft: number) => void;
  onZoomChange?: (pxPerSec: number) => void;
}

export function useWaveformController() {
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [pxPerSec, setPxPerSec] = useState(52);

  const init = useCallback(
    (
      container: HTMLElement,
      timelineContainer: HTMLElement,
      options: {
        onSeek: (time: number) => void;
        onScroll?: (scrollLeft: number) => void;
        onZoomChange?: (px: number) => void;
      },
    ) => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
      }

      const timelinePlugin = TimelinePlugin.create({
        container: timelineContainer,
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

      const ws = WaveSurfer.create({
        container,
        waveColor: "#4f46e5",
        progressColor: "#8b5cf6",
        cursorColor: "#ffffff",
        cursorWidth: 2,
        height: 140,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        interact: true,
        plugins: [timelinePlugin, hoverPlugin],
      });

      ws.on("ready", () => setIsReady(true));

      ws.on("interaction", () => {
        options.onSeek?.(ws.getCurrentTime());
      });

      ws.on("zoom", (px) => {
        setPxPerSec(px);
        options.onZoomChange?.(px);
      });

      ws.on("timeupdate", (time) => {
        setCurrentTime(time);
      });

      ws.on("scroll", (startX) => {
        const px = startX * pxPerSec;
        options.onScroll?.(px);
      });

      waveSurferRef.current = ws;
    },
    [pxPerSec],
  );

  const load = useCallback(
    (sourceUrl: string, peaks: number[] | null, duration: number) => {
      const ws = waveSurferRef.current;
      if (!ws) return;

      if (peaks && peaks.length > 0 && duration > 0) {
        const dummyBlob = new Blob([""], { type: "audio/wav" });
        const dummyUrl = URL.createObjectURL(dummyBlob);
        ws.load(dummyUrl, [peaks], duration);
        return;
      }
      ws.load(sourceUrl);
    },
    [],
  );

  const setZoom = useCallback((pxPerSec: number) => {
    waveSurferRef.current?.zoom(pxPerSec);
    setPxPerSec(pxPerSec);
  }, []);

  const syncTime = useCallback((time: number) => {
    const ws = waveSurferRef.current;
    if (!ws) return;
    const drift = Math.abs(ws.getCurrentTime() - time);
    if (drift > 0.2) {
      ws.setTime(time);
    }
  }, []);

  const destroy = useCallback(() => {
    waveSurferRef.current?.destroy();
    waveSurferRef.current = null;
    setIsReady(false);
  }, []);

  useEffect(() => {
    return () => {
      waveSurferRef.current?.destroy();
    };
  }, []);

  return {
    isReady,
    currentTime,
    pxPerSec,
    init,
    load,
    setZoom,
    syncTime,
    destroy,
  };
}
