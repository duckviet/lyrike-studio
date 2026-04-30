"use client";

import { useState, useCallback, useMemo } from "react";
import { useLoadMedia, useTranscribeMutation, usePublishMutation } from "@/features/media/queries";
import type { FetchMediaResponse, PeaksResponse } from "@/lib/api";
import type { PublishFlowState } from "@/features/publish";
import type { LyricsState } from "@/entities/lyrics";

export type LoadState = "idle" | "loading" | "ready" | "error";

export interface EditorMediaState {
  sourceInput: string;
  sourceMessage: string;
  mediaInfo: FetchMediaResponse | null;
  peaksInfo: PeaksResponse | null;
  fetchState: LoadState;
  transcribeState: LoadState;
  peaksState: LoadState;
  peaksMessage: string;
  publishState: PublishFlowState | null;
}

export interface EditorMediaActions {
  setSourceInput: (value: string) => void;
  handleFetch: () => Promise<void>;
  handleTranscribe: () => Promise<void>;
  handlePublish: () => Promise<void>;
}

interface UseEditorMediaMutationsOptions {
  lyricsState: LyricsState;
  exportToLrc: () => string;
  hydrateFromMedia: (input: { duration: number; title?: string; artist?: string }) => void;
  importFromLrc: (rawLrc: string) => void;
}

export function useEditorMediaMutations({
  lyricsState,
  exportToLrc,
  hydrateFromMedia,
  importFromLrc,
}: UseEditorMediaMutationsOptions): [EditorMediaState, EditorMediaActions] {
  const [sourceInput, setSourceInput] = useState("");
  const [sourceMessage, setSourceMessage] = useState("No source loaded yet.");

  const loadMediaMutation = useLoadMedia({
    onSuccess: (mediaInfo) => {
      hydrateFromMedia({
        duration: mediaInfo.duration,
        title: mediaInfo.trackName,
        artist: mediaInfo.artistName,
      });
    },
    onError: (error) => {
      setSourceMessage(error.message);
    },
  });

  const transcribeMutation = useTranscribeMutation({
    onSuccess: (lrc) => {
      importFromLrc(lrc);
      setSourceMessage("Transcription completed.");
    },
    onError: (error) => {
      setSourceMessage(`Transcription failed: ${error.message}`);
    },
    onStatusChange: (status) => {
      if (status === "starting" || status === "running") {
        setSourceMessage(`Transcribing... ${status}`);
      }
    },
  });

  const publishMutation = usePublishMutation({
    onSuccess: () => {
      setSourceMessage("Lyrics published successfully!");
    },
    onError: (error) => {
      setSourceMessage(`Publish failed: ${error.message}`);
    },
  });

  const handleFetch = useCallback(async () => {
    if (!sourceInput.trim()) {
      setSourceMessage("Please enter a valid source URL.");
      return;
    }
    setSourceMessage("Fetching metadata and caching audio...");
    await loadMediaMutation.mutateAsync(sourceInput);
  }, [sourceInput, loadMediaMutation]);

  const handleTranscribe = useCallback(async () => {
    if (!loadMediaMutation.data?.mediaInfo) {
      setSourceMessage("Load media before transcribing.");
      return;
    }
    await transcribeMutation.transcribeAsync(loadMediaMutation.data.mediaInfo.videoId);
  }, [loadMediaMutation.data, transcribeMutation]);

  const handlePublish = useCallback(async () => {
    if (!loadMediaMutation.data?.mediaInfo) {
      setSourceMessage("Load media before publishing.");
      return;
    }
    await publishMutation.publishAsync({
      lyricsState,
      mediaInfo: loadMediaMutation.data.mediaInfo,
      exportToLrc,
    });
  }, [lyricsState, loadMediaMutation.data, publishMutation, exportToLrc]);

  const fetchState = loadMediaMutation.isPending ? "loading" 
    : loadMediaMutation.isSuccess ? "ready" 
    : loadMediaMutation.isError ? "error" 
    : "idle";

  const transcribeState = transcribeMutation.isLoading ? "loading"
    : transcribeMutation.isError ? "error"
    : transcribeMutation.isSuccess ? "ready"
    : "idle";

  const peaksState = loadMediaMutation.data?.peaksState ?? "idle";
  const peaksMessage = loadMediaMutation.data?.peaksMessage ?? "No peaks generated yet.";

  const publishState = publishMutation.state;

  const state: EditorMediaState = {
    sourceInput,
    sourceMessage,
    mediaInfo: loadMediaMutation.data?.mediaInfo ?? null,
    peaksInfo: loadMediaMutation.data?.peaksInfo ?? null,
    fetchState,
    transcribeState,
    peaksState,
    peaksMessage,
    publishState,
  };

  const actions: EditorMediaActions = {
    setSourceInput,
    handleFetch,
    handleTranscribe,
    handlePublish,
  };

  return [state, actions];
}