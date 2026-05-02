import { TIMING } from "@/shared/config/constants";

export type DragEdge = "start" | "end" | "move";

export interface DragOrigin {
  start: number;
  end: number;
  clientX: number;
}

export interface ResizeInput {
  origin: DragOrigin;
  edge: DragEdge;
  deltaX: number;
  pxPerSec: number;
  duration: number;
}

export interface ResizeResult {
  start: number;
  end: number;
}

export function computeResize({
  origin,
  edge,
  deltaX,
  pxPerSec,
  duration,
}: ResizeInput): ResizeResult {
  const dt = deltaX / pxPerSec;
  const minLen = TIMING.MIN_LINE_LENGTH_SEC;

  if (edge === "start") {
    const start = Math.max(
      0,
      Math.min(origin.end - minLen, origin.start + dt),
    );
    return { start, end: origin.end };
  }

  if (edge === "end") {
    const minEnd = origin.start + minLen;
    let end = Math.max(minEnd, origin.end + dt);
    if (duration > 0) end = Math.min(duration, end);
    return { start: origin.start, end };
  }

  // move
  const len = origin.end - origin.start;
  const maxStart = duration > 0 ? Math.max(0, duration - len) : Infinity;
  const start = Math.max(0, Math.min(maxStart, origin.start + dt));
  return { start, end: start + len };
}
