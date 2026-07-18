import { useLoopProgress } from "./useLoopProgress";

interface LyricLine {
  timestamp: string;
  text: string;
  visible: boolean;
}

const LOADING_MS = 2200;

export function useTranscriptionLoop() {
  const { elapsedMs } = useLoopProgress(3500);
  const lyrics: LyricLine[] = [
    { timestamp: "[00:05.00]", text: "La la la la", visible: elapsedMs >= 300 },
    {
      timestamp: "[00:08.50]",
      text: "Dancing in the moonlight",
      visible: elapsedMs >= 900,
    },
    {
      timestamp: "[00:12.00]",
      text: "Spinning round and round",
      visible: elapsedMs >= 1500,
    },
  ];
  const isLoading = elapsedMs < LOADING_MS;
  // Progress follows elapsed time so the bar, the lines appearing and
  // the final "ready" state stay in sync within one loop.
  const progress = Math.min(100, Math.round((elapsedMs / LOADING_MS) * 100));

  return {
    lyrics,
    progress,
    isLoading,
  };
}
