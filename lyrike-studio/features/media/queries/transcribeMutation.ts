import { useMutation } from "@tanstack/react-query";
import {
  normalizeTranscribeResponse,
  requestTranscription,
  streamTranscription,
} from "@/lib/api";

export const TRANSCRIBE_QUERY_KEYS = {
  transcribe: (videoId: string) => ["transcribe", videoId] as const,
};

export interface UseTranscribeOptions {
  onSuccess?: (lrc: string) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
}

export function useTranscribeMutation(options?: UseTranscribeOptions) {
  const mutation = useMutation({
    mutationFn: async ({
      videoId,
      mode,
      signal,
    }: {
      videoId: string;
      mode?: "normal" | "karaoke";
      signal?: AbortSignal;
    }) => {
      options?.onStatusChange?.("starting");

      if (signal?.aborted) {
        throw new Error("Aborted");
      }

      // Request transcription
      const response = await requestTranscription(videoId, mode);

      if (signal?.aborted) {
        throw new Error("Aborted");
      }

      if (response.status === "completed" && response.synced) {
        options?.onStatusChange?.("completed");
        return response.synced;
      }

      if (response.status === "failed") {
        throw new Error(response.message || "Transcription failed");
      }

      // Poll for completion using EventSource
      return new Promise<string>((resolve, reject) => {
        const eventSource = streamTranscription(videoId, mode);
        let resolved = false;

        const onAbort = () => {
          if (!resolved) {
            resolved = true;
            eventSource.close();
            reject(new Error("Aborted"));
          }
        };

        if (signal) {
          signal.addEventListener("abort", onAbort);
        }

        const cleanup = () => {
          resolved = true;
          eventSource.close();
          if (signal) {
            signal.removeEventListener("abort", onAbort);
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const data = normalizeTranscribeResponse(JSON.parse(event.data));

            options?.onStatusChange?.(data.status);

            if (data.status === "completed" && data.synced) {
              cleanup();
              resolve(data.synced);
            } else if (data.status === "failed") {
              cleanup();
              reject(
                new Error(data.message || data.error || "Transcription failed"),
              );
            }
          } catch {
            cleanup();
            reject(new Error("Invalid transcription stream payload"));
          }
        };

        eventSource.onerror = () => {
          if (!resolved) {
            cleanup();
            reject(new Error("EventSource connection failed"));
          }
        };

        // Timeout after 2 minutes
        const timer = setTimeout(() => {
          if (!resolved) {
            cleanup();
            reject(new Error("Transcription timeout"));
          }
        }, 120000);
      });
    },
    onSuccess: (lrc) => options?.onSuccess?.(lrc),
    onError: (error) => options?.onError?.(error as Error),
  });

  return {
    transcribe: mutation.mutate,
    transcribeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}
