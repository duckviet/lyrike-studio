import { useState, useCallback, useRef, useEffect } from "react";
import { runTranscriptionFlow } from "@/lib/app/mediaWorkflow";
import { requestTranscription, streamTranscription, type FetchMediaResponse } from "@/lib/api";

interface UseTranscriptionProps {
  mediaInfo: FetchMediaResponse | null;
  importFromLrc: (rawLrc: string) => void;
  setSourceMessage: (msg: string) => void;
}

export function useTranscription({ mediaInfo, importFromLrc, setSourceMessage }: UseTranscriptionProps) {
  const [transcribeState, setTranscribeState] = useState("idle");
  const transcribeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      transcribeAbortRef.current?.abort();
    };
  }, []);

  const handleTranscribe = useCallback(async () => {
    if (!mediaInfo) return;
    
    transcribeAbortRef.current?.abort();
    const ac = new AbortController();
    transcribeAbortRef.current = ac;

    try {
      setTranscribeState("starting");
      const result = await runTranscriptionFlow({
        mediaInfo,
        requestFn: requestTranscription,
        streamFn: streamTranscription,
        onImportLrc: importFromLrc,
        onStatus: (status) => setTranscribeState(status),
        signal: ac.signal,
      });
      setTranscribeState(result.transcribeState);
      setSourceMessage(result.sourceMessage);
    } catch (e) {
      if (ac.signal.aborted) return;
      setTranscribeState("error");
      setSourceMessage("Transcription failed.");
    }
  }, [mediaInfo, importFromLrc, setSourceMessage]);

  return { transcribeState, handleTranscribe, setTranscribeState };
}
