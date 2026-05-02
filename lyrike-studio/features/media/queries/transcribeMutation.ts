import { useMutation } from "@tanstack/react-query";
import {
  requestTranscription,
  streamTranscription,
  type TranscribeResponse,
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
    mutationFn: async (videoId: string) => {
      options?.onStatusChange?.("starting");

      // Request transcription
      const response = await requestTranscription(videoId);

      if (response.status === "completed" && response.synced) {
        options?.onStatusChange?.("completed");
        return response.synced;
      }

      if (response.status === "failed") {
        throw new Error(response.message || "Transcription failed");
      }

      // Poll for completion using EventSource
      return new Promise<string>((resolve, reject) => {
        const eventSource = streamTranscription(videoId);
        let resolved = false;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as TranscribeResponse & {
              error?: string;
            };

            options?.onStatusChange?.(data.status);

            if (data.status === "completed" && data.synced) {
              resolved = true;
              eventSource.close();
              resolve(data.synced);
            } else if (data.status === "failed") {
              resolved = true;
              eventSource.close();
              reject(
                new Error(data.message || data.error || "Transcription failed"),
              );
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          if (!resolved) {
            eventSource.close();
            reject(new Error("EventSource connection failed"));
          }
        };

        // Timeout after 2 minutes
        setTimeout(() => {
          if (!resolved) {
            eventSource.close();
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
