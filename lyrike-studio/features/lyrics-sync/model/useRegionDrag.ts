import { useCallback, useRef, useEffect } from "react";
import type { LyricLine } from "@/entities/lyrics";
import { computeResize } from "../lib/drag-math";
import type { DragEdge, DragState, RegionResizeCallbacks } from "./types";

interface Options extends RegionResizeCallbacks {
  pxPerSec: number;
  duration: number;
  onDragBegin?: (lineId: string) => void;
}

export function useRegionDrag(opts: Options) {
  // Mirror every volatile value into a ref so callbacks stay stable.
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastResultRef = useRef<{
    lineId: string;
    start: number;
    end: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  const beginDrag = useCallback(
    (event: React.PointerEvent, line: LyricLine, edge: DragEdge) => {
      event.stopPropagation();
      trackRef.current?.setPointerCapture(event.pointerId);

      dragRef.current = {
        lineId: line.id,
        edge,
        originX: event.clientX,
        originStart: line.start,
        originEnd: line.end,
        baseState: optsRef.current.onGetBaseState?.() ?? null,
      };
      lastResultRef.current = null;

      optsRef.current.onDragBegin?.(line.id);
      optsRef.current.onResizeStart?.();
    },
    [],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const { start, end } = computeResize({
      origin: {
        start: drag.originStart,
        end: drag.originEnd,
        clientX: drag.originX,
      },
      edge: drag.edge,
      deltaX: event.clientX - drag.originX,
      pxPerSec: optsRef.current.pxPerSec,
      duration: optsRef.current.duration,
    });

    lastResultRef.current = { lineId: drag.lineId, start, end };

    // RAF-throttle store updates
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      optsRef.current.onResize(drag.lineId, start, end);
    });
  }, []);

  const endDrag = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    trackRef.current?.releasePointerCapture(event.pointerId);

    const last = lastResultRef.current;
    if (last) {
      optsRef.current.onResizeCommit(
        last.lineId,
        last.start,
        last.end,
        drag.baseState,
      );
    }

    dragRef.current = null;
    lastResultRef.current = null;
  }, []);

  return {
    trackRef,
    handlers: {
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    beginDrag,
    isDragging: () => dragRef.current !== null,
  };
}
