import { useState, useCallback } from "react";
import { MediaController, WaveformController } from "@/entities/media";
import { fetchMediaForEditor } from "@/lib/app/mediaWorkflow";
import { fetchMedia, fetchPeaks, getAudioUrl, type FetchMediaResponse, type PeaksResponse } from "@/lib/api";
import type { LoadState } from "../types";

interface UseMediaLoaderProps {
  mediaController: MediaController;
  waveformController: WaveformController;
  onHydrateFromMedia: (input: { duration: number; title?: string; artist?: string }) => void;
  maybeRestoreDraft: (videoId: string) => boolean;
  onResetPublish: () => void;
  setSourceMessage: (msg: string) => void;
}

export function useMediaLoader({
  mediaController,
  waveformController,
  onHydrateFromMedia,
  maybeRestoreDraft,
  onResetPublish,
  setSourceMessage,
}: UseMediaLoaderProps) {
  const [mediaInfo, setMediaInfo] = useState<FetchMediaResponse | null>(null);
  const [peaksInfo, setPeaksInfo] = useState<PeaksResponse | null>(null);
  const [fetchState, setFetchState] = useState<LoadState>("idle");
  const [peaksState, setPeaksState] = useState<LoadState>("idle");
  const [peaksMessage, setPeaksMessage] = useState("No peaks generated yet.");

  const load = useCallback(async (sourceUrl: string) => {
    if (!sourceUrl.trim()) {
      setSourceMessage("Please enter a valid source URL.");
      setFetchState("error");
      return;
    }
    try {
      setFetchState("loading");
      setSourceMessage("Fetching metadata and caching audio...");
      setPeaksInfo(null);
      setPeaksState("loading");
      setPeaksMessage("Generating waveform peaks...");

      const result = await fetchMediaForEditor({
        sourceUrl: sourceUrl.trim(),
        fetchMediaFn: fetchMedia,
        fetchPeaksFn: fetchPeaks,
        getAudioUrlFn: getAudioUrl,
        restoreDraft: maybeRestoreDraft,
        mediaController,
        waveformController,
        onHydrateFromMedia,
      });

      setMediaInfo(result.mediaInfo);
      setPeaksInfo(result.peaks.peaksInfo);
      setPeaksState(result.peaks.peaksState);
      setPeaksMessage(result.peaks.peaksMessage);
      setSourceMessage(result.sourceMessage);
      setFetchState("ready");
      onResetPublish();
    } catch (error) {
      setPeaksState("error");
      setPeaksMessage("Failed to load waveform peaks.");
      setFetchState("error");
      setSourceMessage(
        error instanceof Error ? error.message : "Failed to fetch source.",
      );
    }
  }, [maybeRestoreDraft, mediaController, waveformController, onHydrateFromMedia, onResetPublish]);

  return {
    mediaInfo,
    peaksInfo,
    fetchState,
    peaksState,
    peaksMessage,
    load,
    setFetchState,
  };
}
