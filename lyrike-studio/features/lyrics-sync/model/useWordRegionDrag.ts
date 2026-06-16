"use client";

import { useCallback, useRef, useEffect } from "react";
import type { LyricLine, LyricWord } from "@/entities/lyrics";
import type { LyricsHistoryState } from "@/entities/lyrics/store/lyricsStore";
import { computeWordDragResult } from "../lib/word-drag-math";
import type { DragEdge } from "../lib/drag-math";

type WordDragCallbacks = {
  onWordRangeLive: (
    lineId: string,
    wordId: string,
    start: number,
    end: number,
  ) => void;
  onWordRangeCommit: (
    lineId: string,
    wordId: string,
    start: number,
    end: number,
    baseState: LyricsHistoryState | null,
  ) => void;
  onGetBaseState?: () => LyricsHistoryState | null;
  onDragBegin?: (lineId: string, wordId: string) => void;
};

interface Options extends WordDragCallbacks {
  pxPerSec: number;
  duration: number;
  captureRef?: React.RefObject<HTMLElement | null>;
}

interface WordDragState {
  line: LyricLine;
  word: LyricWord;
  wordIndex: number;
  edge: DragEdge;
  originX: number;
  baseState: LyricsHistoryState | null;
}

export function useWordRegionDrag(opts: Options) {
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const dragRef = useRef<WordDragState | null>(null);
  const lastResultRef = useRef<{
    lineId: string;
    wordId: string;
    start: number;
    end: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  const getCaptureTarget = useCallback(() => {
    return optsRef.current.captureRef?.current ?? null;
  }, []);

  const beginDrag = useCallback(
    (
      event: React.PointerEvent,
      line: LyricLine,
      word: LyricWord,
      edge: DragEdge,
    ) => {
      event.stopPropagation();
      const captureTarget = getCaptureTarget() ?? (event.currentTarget as HTMLElement);
      captureTarget.setPointerCapture?.(event.pointerId);

      const wordIndex = line.words?.findIndex((w) => w.id === word.id) ?? -1;
      if (wordIndex < 0) return;

      dragRef.current = {
        line,
        word,
        wordIndex,
        edge,
        originX: event.clientX,
        baseState: optsRef.current.onGetBaseState?.() ?? null,
      };
      lastResultRef.current = null;

      optsRef.current.onDragBegin?.(line.id, word.id);
    },
    [getCaptureTarget],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const words = drag.line.words;
    if (!words) return;

    const { start, end } = computeWordDragResult({
      line: drag.line,
      words,
      wordIndex: drag.wordIndex,
      origin: {
        start: drag.word.start,
        end: drag.word.end,
        clientX: drag.originX,
      },
      edge: drag.edge,
      deltaX: event.clientX - drag.originX,
      pxPerSec: optsRef.current.pxPerSec,
      duration: optsRef.current.duration,
    });

    lastResultRef.current = {
      lineId: drag.line.id,
      wordId: drag.word.id,
      start,
      end,
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      optsRef.current.onWordRangeLive(drag.line.id, drag.word.id, start, end);
    });
  }, []);

  const endDrag = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const captureTarget = getCaptureTarget();
    if (captureTarget) {
      captureTarget.releasePointerCapture?.(event.pointerId);
    } else {
      (event.currentTarget as HTMLElement).releasePointerCapture?.(
        event.pointerId,
      );
    }

    const last = lastResultRef.current;
    if (last) {
      optsRef.current.onWordRangeCommit(
        last.lineId,
        last.wordId,
        last.start,
        last.end,
        drag.baseState,
      );
    }

    dragRef.current = null;
    lastResultRef.current = null;
  }, [getCaptureTarget]);

  return {
    handlers: {
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    beginDrag,
    isDragging: () => dragRef.current !== null,
  };
}
