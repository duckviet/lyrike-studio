import { useState, useEffect, useRef } from "react";
import { findActiveLyricIndex, type LyricLine } from "@/entities/lyrics";

interface UsePlaybackSyncProps {
  syncedLines: LyricLine[];
  setActiveLine: (lineId: string | null) => void;
}

export function usePlaybackSync({ syncedLines, setActiveLine }: UsePlaybackSyncProps) {
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
        setActiveLine(lines[activeIndex].id);
      } else {
        setActiveLine(null);
      }
    };

    window.addEventListener("video-timeupdate", handleVideoTimeUpdate);
    return () => window.removeEventListener("video-timeupdate", handleVideoTimeUpdate);
  }, [setActiveLine]);

  return { isPlaying, currentTime, setIsPlaying, setCurrentTime };
}
