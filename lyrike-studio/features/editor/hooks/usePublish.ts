import { useState, useCallback, useRef } from "react";
import { createPublishFlowMachine, type PublishFlowState } from "@/features/publish";
import { buildPublishPayload } from "@/lib/app/publishPayload";
import { solvePowInWorker } from "@/lib/app/powWorkerClient";
import { requestPublishChallenge, publishLyrics, type FetchMediaResponse } from "@/lib/api";
import type { LyricsState } from "@/entities/lyrics";

interface UsePublishProps {
  lyricsState: LyricsState;
  exportToLrc: () => string;
  setSourceMessage: (msg: string) => void;
}

export function usePublish({ lyricsState, exportToLrc, setSourceMessage }: UsePublishProps) {
  const [publishState, setPublishState] = useState<PublishFlowState | null>(null);
  
  const publishFlowRef = useRef<ReturnType<typeof createPublishFlowMachine>>(null!);
  if (!publishFlowRef.current) {
    publishFlowRef.current = createPublishFlowMachine((next) => setPublishState(next));
  }

  const handlePublish = useCallback(async (mediaInfo: FetchMediaResponse | null) => {
    if (!mediaInfo) {
      setSourceMessage("Load media before publishing.");
      return;
    }
    await publishFlowRef.current.run({
      buildPayload: () =>
        buildPublishPayload({
          lyricsState,
          mediaInfo,
          exportLrc: () => exportToLrc(),
        }),
      requestChallenge: requestPublishChallenge,
      solvePow: ({ prefix, targetHex, onProgress }) =>
        solvePowInWorker({ prefix, targetHex, onProgress }),
      publish: ({ payload, publishToken }) =>
        publishLyrics({ payload, publishToken }),
    });
  }, [lyricsState, exportToLrc, setSourceMessage]);

  const reset = useCallback(() => {
    publishFlowRef.current.reset();
  }, []);

  return { publishState, handlePublish, reset };
}
