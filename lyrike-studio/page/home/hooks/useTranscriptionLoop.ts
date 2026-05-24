import { useLoopProgress } from "./useLoopProgress";

interface LyricLine {
  timestamp: string;
  text: string;
  visible: boolean;
}

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
  const visibleCount = lyrics.filter((line) => line.visible).length;
  const isLoading = elapsedMs < 2200;

  return {
    lyrics,
    progress: isLoading ? Math.round((visibleCount / lyrics.length) * 90) : 100,
    isLoading,
  };
}
