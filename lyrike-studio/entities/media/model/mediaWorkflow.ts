import type {
  FetchMediaResponse,
  PeaksResponse,
  TranscribeResponse,
} from "../../../lib/api";
import type { MediaController } from "@/entities/media";
import type { WaveformController } from "@/entities/media";

export type PeaksLoadResult = {
  peaksInfo: PeaksResponse | null;
  peaksState: "idle" | "loading" | "ready" | "error";
  peaksMessage: string;
};

export async function loadPeaksForEditor(params: {
  videoId: string;
  fetchPeaksFn: (videoId: string, samples?: number) => Promise<PeaksResponse>;
  samples?: number;
}): Promise<PeaksLoadResult> {
  try {
    const peaksInfo = await params.fetchPeaksFn(
      params.videoId,
      params.samples ?? 2000,
    );
    return {
      peaksInfo,
      peaksState: "ready",
      peaksMessage: peaksInfo.cacheHit
        ? "Loaded peaks from cache."
        : "Generated peaks and cached for next load.",
    };
  } catch (error) {
    return {
      peaksInfo: null,
      peaksState: "error",
      peaksMessage:
        error instanceof Error
          ? error.message
          : "Failed to load waveform peaks.",
    };
  }
}

export async function fetchMediaForEditor(params: {
  sourceUrl: string;
  fetchMediaFn: (body: { url: string }) => Promise<FetchMediaResponse>;
  fetchPeaksFn: (videoId: string, samples?: number) => Promise<PeaksResponse>;
  getAudioUrlFn: (path: string) => string;
  mediaController: MediaController;
  waveformController: WaveformController;
  onHydrateFromMedia: (input: {
    duration: number;
    title?: string;
    artist?: string;
  }) => void;
  restoreDraft: (videoId: string) => void;
}): Promise<{
  mediaInfo: FetchMediaResponse;
  sourceMessage: string;
  peaks: PeaksLoadResult;
}> {
  const mediaInfo = await params.fetchMediaFn({ url: params.sourceUrl });

  const resolvedAudioUrl = mediaInfo.audioUrl
    ? params.getAudioUrlFn(mediaInfo.audioUrl)
    : null;
  if (resolvedAudioUrl) {
    params.mediaController.setSource(resolvedAudioUrl);
  }

  params.onHydrateFromMedia({
    duration: mediaInfo.duration,
    title: mediaInfo.trackName,
    artist: mediaInfo.artistName,
  });
  params.restoreDraft(mediaInfo.videoId);

  let peaks: PeaksLoadResult = {
    peaksInfo: null,
    peaksState: "idle",
    peaksMessage: "No peaks generated yet.",
  };

  if (mediaInfo.audioReady) {
    peaks = await loadPeaksForEditor({
      videoId: mediaInfo.videoId,
      fetchPeaksFn: params.fetchPeaksFn,
      samples: 2000,
    });
  }

  return {
    mediaInfo,
    sourceMessage: `Loaded ${mediaInfo.trackName || "Untitled"}.`,
    peaks,
  };
}

export async function runTranscriptionFlow(params: {
  mediaInfo: FetchMediaResponse | null;
  requestFn: (videoId: string) => Promise<TranscribeResponse>;
  streamFn: (videoId: string) => EventSource;
  onImportLrc: (rawLrc: string) => void;
  onStatus?: (status: string, message: string) => void;
  signal?: AbortSignal;
}): Promise<{
  transcribeState: string;
  sourceMessage: string;
}> {
  if (!params.mediaInfo) {
    return {
      transcribeState: "idle",
      sourceMessage: "Load media before transcription.",
    };
  }

  const videoId = params.mediaInfo.videoId;

  try {
    // 1. Trigger the job
    const initialResponse = await params.requestFn(videoId);
    if (initialResponse.status === "completed") {
      if (initialResponse.synced) {
        params.onImportLrc(initialResponse.synced);
      }
      return {
        transcribeState: "completed",
        sourceMessage: "Transcription complete! (Loaded from cache)",
      };
    }

    // 2. Open SSE stream
    return new Promise((resolve) => {
      const es = params.streamFn(videoId);

      const cleanup = () => {
        es.close();
        params.signal?.removeEventListener("abort", onAbort);
      };

      const onAbort = () => {
        cleanup();
        resolve({
          transcribeState: "idle",
          sourceMessage: "Transcription cancelled.",
        });
      };

      if (params.signal?.aborted) {
        onAbort();
        return;
      }

      params.signal?.addEventListener("abort", onAbort);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TranscribeResponse;

          if (data.status === "completed") {
            if (data.synced) {
              params.onImportLrc(data.synced);
            }
            cleanup();
            resolve({
              transcribeState: "completed",
              sourceMessage:
                "Transcription complete! Lyrics imported to editor.",
            });
          } else if (data.status === "failed") {
            cleanup();
            resolve({
              transcribeState: "failed",
              sourceMessage: `Transcription failed: ${
                data.message || data.job?.error || "Unknown error"
              }`,
            });
          } else {
            const message =
              data.status === "running"
                ? "Transcription is running... (don't close the app)"
                : "Transcription is queued... waiting for worker.";

            if (params.onStatus) {
              params.onStatus(data.status, message);
            }
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };

      es.onerror = () => {
        cleanup();
        resolve({
          transcribeState: "failed",
          sourceMessage: "Connection to transcription stream lost.",
        });
      };
    });
  } catch (error) {
    return {
      transcribeState: "failed",
      sourceMessage:
        error instanceof Error
          ? error.message
          : "Failed to start transcription.",
    };
  }
}
