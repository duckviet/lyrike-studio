"use client";

import { useState, useCallback } from "react";
import type { LyricLine } from "@/entities/lyrics";
import { TIMING } from "@/shared/config/constants";

export interface DragState {
  lineId: string;
  edge: "start" | "end" | "move";
  originX: number;
  originStart: number;
  originEnd: number;
}

export interface UseSyncHandlersOptions {
  onSelectLine: (lineId: string) => void;
  onResize: (lineId: string, start: number, end: number) => void;
  onResizeCommit: (lineId: string, start: number, end: number) => void;
  onResizeStart?: () => void;
}

export interface UseSyncHandlersReturn {
  dragBaseState: DragState | null;
  setLineRangeLive: (lineId: string, start: number, end: number) => void;
  setLineRangeCommit: (lineId: string, start: number, end: number) => void;
}

export function useSyncHandlers({
  onSelectLine,
  onResize,
  onResizeCommit,
  onResizeStart,
}: UseSyncHandlersOptions): UseSyncHandlersReturn {
  const [dragBaseState, setDragBaseState] = useState<DragState | null>(null);

  const setLineRangeLive = useCallback((lineId: string, start: number, end: number) => {
    const clampedStart = Math.max(0, start);
    const clampedEnd = Math.max(clampedStart + TIMING.MIN_LINE_LENGTH_SEC, end);
    onResize(lineId, clampedStart, clampedEnd);
  }, [onResize]);

  const setLineRangeCommit = useCallback((lineId: string, start: number, end: number) => {
    const clampedStart = Math.max(0, start);
    const clampedEnd = Math.max(clampedStart + TIMING.MIN_LINE_LENGTH_SEC, end);
    onResizeCommit(lineId, clampedStart, clampedEnd);
  }, [onResizeCommit]);

  return {
    dragBaseState,
    setLineRangeLive,
    setLineRangeCommit,
  };
}