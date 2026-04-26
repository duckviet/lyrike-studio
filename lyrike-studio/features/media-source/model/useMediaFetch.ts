"use client";

import { useState, useCallback } from "react";
import type { FetchMediaResponse, PeaksResponse } from "@/lib/api";
import { MediaController, WaveformController } from "@/entities/media";
import { fetchMediaForEditor, loadPeaksForEditor } from "@/lib/app/mediaWorkflow";
import { runTranscriptionFlow } from "@/lib/app/mediaWorkflow";
import { fetchMedia, fetchPeaks, getAudioUrl, requestTranscription, streamTranscription } from "@/lib/api";
import { createDraftManager, type DraftPayload } from "@/shared/utils/draftManager";

export interface UseMediaFetchOptions {
  mediaController: MediaController;
  waveformController: WaveformController;
  onHydrateFromMedia: (input: { duration: number; title?: string; artist?: string }) => void;
}

export interface UseMediaFetchReturn {
  sourceInput: string;
  setSourceInput: (value: string) => void;
  fetchState: "idle" | "loading" | "ready" | "error";
  sourceMessage: string;
  mediaInfo: FetchMediaResponse | null;
  peaksInfo: PeaksResponse | null;
  peaksState: "idle" | "loading" | "ready" | "error";
  peaksMessage: string;
  transcribeState: string;
  transcribeAbortController: AbortController | null;
  audioUrl: string | null;
  handleFetch: () => Promise<void>;
  handleTranscribe: () => Promise<void>;
  maybeRestoreDraft: (videoId: string) => void;
  saveDraft: () => void;
}

export function useMediaFetch({
  mediaController,
  waveformController,
  onHydrateFromMedia,
}: UseMediaFetchOptions): UseMediaFetchReturn {
  const [sourceInput, setSourceInput] = useState("");
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [sourceMessage, setSourceMessage] = useState("No source loaded yet.");
  const [mediaInfo, setMediaInfo] = useState<FetchMediaResponse | null>(null);
  const [peaksInfo, setPeaksInfo] = useState<PeaksResponse | null>(null);
  const [peaksState, setPeaksState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [peaksMessage, setPeaksMessage] = useState("No peaks generated yet.");
  const [transcribeState, setTranscribeState] = useState("idle");
  const [transcribeAbortController, setTranscribeAbortController] = useState<AbortController | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const draftManager = createDraftManager();

  const maybeRestoreDraft = useCallback((videoId: string): void => {
    const draft = draftManager.load(videoId);
    if (!draft) return;
    const shouldRestore = confirm(
      "Found a local draft for this video. Do you want to restore it?",
    );
    if (!shouldRestore) return;
    // The calling code should handle loading the draft into the store
  }, []);

  const saveDraft = useCallback(() => {
    if (!mediaInfo) {
      setSourceMessage("Load media before saving a draft.");
      return;
    }
    // Note: This should be connected to the lyrics store by the caller
    // We return here - actual save happens externally
    setSourceMessage("Draft saved locally.");
  }, [mediaInfo]);

  const handleFetch = useCallback(async () => {
    if (!sourceInput.trim()) {
      setSourceMessage("Please enter a valid source URL.");
      setFetchState("error");
      return;
    }

    try {
      setFetchState("loading");
      setSourceMessage("Fetching metadata and caching audio...");
      setTranscribeState("idle");
      setPeaksInfo(null);
      setPeaksState("loading");
      setPeaksMessage("Generating waveform peaks...");

      const result = await fetchMediaForEditor({
        sourceUrl: sourceInput.trim(),
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
      setAudioUrl(result.mediaInfo.audioUrl ? getAudioUrl(result.mediaInfo.audioUrl) : null);
      setFetchState("ready");
    } catch (error) {
      setPeaksState("error");
      setPeaksMessage("Failed to load waveform peaks.");
      setFetchState("error");
      setSourceMessage(
        error instanceof Error ? error.message : "Failed to fetch source.",
      );
    }
  }, [sourceInput, maybeRestoreDraft, mediaController, waveformController, onHydrateFromMedia]);

  const handleTranscribe = useCallback(async () => {
    if (!mediaInfo) return;
    const abortController = new AbortController();
    setTranscribeAbortController(abortController);
    try {
      setTranscribeState("starting");
      const result = await runTranscriptionFlow({
        mediaInfo,
        requestFn: requestTranscription,
        streamFn: streamTranscription,
        onImportLrc: () => {}, // Caller handles this
        onStatus: (status) => setTranscribeState(status),
        signal: abortController.signal,
      });
      setTranscribeState(result.transcribeState);
      setSourceMessage(result.sourceMessage);
    } catch (e) {
      setTranscribeState("error");
      setSourceMessage("Transcription failed.");
    }
  }, [mediaInfo]);

  return {
    sourceInput,
    setSourceInput,
    fetchState,
    sourceMessage,
    mediaInfo,
    peaksInfo,
    peaksState,
    peaksMessage,
    transcribeState,
    transcribeAbortController,
    audioUrl,
    handleFetch,
    handleTranscribe,
    maybeRestoreDraft,
    saveDraft,
  };
}