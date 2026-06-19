import { useState, useEffect, useRef } from "react";
import { findActiveLyricIndex, findActiveWord, type LyricLine } from "@/entities/lyrics";
import { editorMediaController } from "@/features/editor/store/editorControllers";

interface UsePlaybackSyncProps {
  syncedLines: LyricLine[];
  setActiveLine: (lineId: string | null) => void;
  setActiveWord?: (wordId: string | null) => void;
}

export function usePlaybackSync({ syncedLines, setActiveLine, setActiveWord }: UsePlaybackSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const activeLineIdRef = useRef<string | null>(null);
  const activeWordIdRef = useRef<string | null>(null);

  const syncedLinesRef = useRef(syncedLines);
  useEffect(() => {
    syncedLinesRef.current = syncedLines;
  }, [syncedLines]);

  useEffect(() => {
    const updateActiveTargets = (t: number) => {
      const lines = syncedLinesRef.current;
      const activeIndex = findActiveLyricIndex(lines, t);
      let nextLineId: string | null = null;
      let nextWordId: string | null = null;

      if (activeIndex >= 0) {
        const activeLine = lines[activeIndex];
        nextLineId = activeLine.id;
        nextWordId = findActiveWord(activeLine, t)?.id ?? null;
      }

      if (activeLineIdRef.current !== nextLineId) {
        activeLineIdRef.current = nextLineId;
        setActiveLine(nextLineId);
      }
      if (activeWordIdRef.current !== nextWordId) {
        activeWordIdRef.current = nextWordId;
        setActiveWord?.(nextWordId);
      }
    };

    const unsubscribeTime = editorMediaController.subscribe("timeupdate", ({ currentTime }) => {
      updateActiveTargets(currentTime);
    });
    const unsubscribePlaystate = editorMediaController.subscribe("playstate", ({ isPlaying: nextIsPlaying }) => {
      setIsPlaying(nextIsPlaying);
    });

    return () => {
      unsubscribeTime();
      unsubscribePlaystate();
    };
  }, [setActiveLine, setActiveWord]);

  return { isPlaying, setIsPlaying };
}
