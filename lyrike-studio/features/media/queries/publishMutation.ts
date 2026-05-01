import { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { requestPublishChallenge, publishLyrics } from "@/lib/api";
import { buildPublishPayload } from "@/lib/app/publishPayload";
import { solvePowInWorker } from "@/lib/app/powWorkerClient";
import type { FetchMediaResponse } from "@/lib/api";
import type { LyricsState } from "@/entities/lyrics";
import {
  createPublishFlowMachine,
  type PublishFlowState,
} from "@/features/publish/model/publishFlow";

export interface UsePublishOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePublishMutation(options?: UsePublishOptions) {
  const [publishState, setPublishState] = useState<PublishFlowState | null>(
    null,
  );

  const machineRef = useRef<ReturnType<typeof createPublishFlowMachine>>(null!);
  if (!machineRef.current) {
    machineRef.current = createPublishFlowMachine((next) =>
      setPublishState(next),
    );
  }

  const mutation = useMutation({
    mutationFn: async ({
      lyricsState,
      mediaInfo,
      exportToLrc,
    }: {
      lyricsState: LyricsState;
      mediaInfo: FetchMediaResponse;
      exportToLrc: () => string;
    }) => {
      await machineRef.current.run({
        buildPayload: () =>
          buildPublishPayload({
            lyricsState,
            mediaInfo,
            exportLrc: exportToLrc,
          }),
        requestChallenge: requestPublishChallenge,
        solvePow: ({ prefix, targetHex, onProgress }) =>
          solvePowInWorker({ prefix, targetHex, onProgress }),
        publish: ({ payload, publishToken }) =>
          publishLyrics({ payload, publishToken }),
      });

      const finalState = machineRef.current.getState();
      if (finalState.status === "error") {
        throw new Error(finalState.message);
      }

      return finalState;
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error as Error);
    },
  });

  const handlePublish = useCallback(
    (input: {
      lyricsState: LyricsState;
      mediaInfo: FetchMediaResponse;
      exportToLrc: () => string;
    }) => {
      mutation.mutate(input);
    },
    [mutation],
  );

  const reset = useCallback(() => {
    machineRef.current.reset();
    mutation.reset();
  }, [mutation]);

  return {
    publish: handlePublish,
    publishAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset,
    state: publishState,
  };
}