import { useState, useEffect, useRef } from "react";
import { findActiveLyricIndex, findActiveWord, type LyricLine } from "@/entities/lyrics";

interface UsePlaybackSyncProps {
  syncedLines: LyricLine[];
  setActiveLine: (lineId: string | null) => void;
  setActiveWord?: (wordId: string | null) => void;
}

export function usePlaybackSync({ syncedLines, setActiveLine, setActiveWord }: UsePlaybackSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const syncedLinesRef = useRef(syncedLines);
  useEffect(() => {
    syncedLinesRef.current = syncedLines;
  }, [syncedLines]);

  useEffect(() => {
    const handleVideoTimeUpdate = (e: Event) => {
      const { currentTime: t, isPlaying: p } = (e as CustomEvent<{ currentTime: number; isPlaying: boolean }>).detail;
      setCurrentTime(t);
      setIsPlaying(p);

      const lines = syncedLinesRef.current;
      const activeIndex = findActiveLyricIndex(lines, t);
      if (activeIndex >= 0) {
        const activeLine = lines[activeIndex];
        setActiveLine(activeLine.id);

        const activeWord = activeLine ? findActiveWord(activeLine, t) : null;
        setActiveWord?.(activeWord?.id ?? null);
      } else {
        setActiveLine(null);
        setActiveWord?.(null);
      }
    };

    window.addEventListener("video-timeupdate", handleVideoTimeUpdate);
    return () => window.removeEventListener("video-timeupdate", handleVideoTimeUpdate);
  }, [setActiveLine, setActiveWord]);

  return { isPlaying, currentTime, setIsPlaying, setCurrentTime };
}
