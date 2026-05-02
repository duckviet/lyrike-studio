import { LyricsHistoryState } from "@/entities/lyrics";
import type { DragEdge } from "../lib/drag-math";

export type { DragEdge };

export interface DragState {
  lineId: string;
  edge: DragEdge;
  originX: number;
  originStart: number;
  originEnd: number;
  baseState: LyricsHistoryState | null;
}

export interface RegionResizeCallbacks {
  onResize: (lineId: string, start: number, end: number) => void;
  onResizeCommit: (
    lineId: string,
    start: number,
    end: number,
    baseState: LyricsHistoryState | null,
  ) => void;
  onResizeStart?: () => void;
  onGetBaseState?: () => LyricsHistoryState | null;
}
