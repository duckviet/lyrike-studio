"use client";

import { useRef, useState, useCallback, useEffect, memo } from "react";
import type { LyricLine } from "@/entities/lyrics";
import { TIMING } from "@/shared/config/constants";
import { computeGaps, type GapRegion } from "../lib/gap-utils";
import { GapRegionBox } from "./parts/GapRegionBox";
import { RegionBox } from "./parts/RegionBox";

interface LyricRegionsTrackProps {
  lines: LyricLine[];
  duration: number;
  pxPerSec: number;
  scrollLeft: number;
  activeLineId: string | null;
  selectedLineId: string | null;
  onSelectLine: (lineId: string | null) => void;
  onResize: (lineId: string, start: number, end: number) => void;
  onResizeCommit: (
    lineId: string,
    start: number,
    end: number,
    baseState: unknown,
  ) => void;
  onResizeStart?: () => void;
  onGetBaseState?: () => unknown;
  onDeleteGap?: (gap: GapRegion) => void;
  // Gap actions
  onInsertAtGap: (start: number, end: number) => void;
  onExtendLine: (
    lineId: string,
    edge: "start" | "end",
    newTime: number,
  ) => void;
}

type DragState = {
  lineId: string;
  edge: "start" | "end" | "move";
  originX: number;
  originStart: number;
  originEnd: number;
  baseState: unknown;
};

export const LyricRegionsTrack = memo(function LyricRegionsTrack({
  lines,
  duration,
  pxPerSec,
  scrollLeft,
  activeLineId,
  selectedLineId,
  onSelectLine,
  onResize,
  onResizeCommit,
  onResizeStart,
  onGetBaseState,
  onInsertAtGap,
  onExtendLine,
  onDeleteGap,
}: LyricRegionsTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<DragState | null>(null);
  const lastResizeStateRef = useRef<{
    lineId: string;
    start: number;
    end: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Keep latest callback refs so RAF closure doesn't go stale
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const pxPerSecRef = useRef(pxPerSec);
  pxPerSecRef.current = pxPerSec;
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const [selectedGapId, setSelectedGapId] = useState<string | null>(null);

  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.style.transform = `translateX(-${scrollLeft}px)`;
    }
  }, [scrollLeft]);

  const totalWidth = Math.max(duration * pxPerSec, 0);
  const gaps = computeGaps(lines, duration);

  const beginDrag = useCallback(
    (
      event: React.PointerEvent,
      line: LyricLine,
      edge: "start" | "end" | "move",
    ) => {
      event.stopPropagation();
      trackRef.current?.setPointerCapture(event.pointerId);
      dragRef.current = {
        lineId: line.id,
        edge,
        originX: event.clientX,
        originStart: line.start,
        originEnd: line.end,
        baseState: onGetBaseState?.() ?? null,
      };
      lastResizeStateRef.current = null;
      setSelectedGapId(null);
      onSelectLine(line.id);
      onResizeStart?.();
    },
    [onSelectLine, onResizeStart, onGetBaseState],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = event.clientX - drag.originX;
    const dt = dx / pxPerSecRef.current;
    const dur = durationRef.current;

    let nextStart = drag.originStart;
    let nextEnd = drag.originEnd;

    if (drag.edge === "start") {
      nextStart = Math.max(
        0,
        Math.min(
          drag.originEnd - TIMING.MIN_LINE_LENGTH_SEC,
          drag.originStart + dt,
        ),
      );
    } else if (drag.edge === "end") {
      const minEnd = drag.originStart + TIMING.MIN_LINE_LENGTH_SEC;
      nextEnd = Math.max(minEnd, drag.originEnd + dt);
      if (dur > 0) nextEnd = Math.min(dur, nextEnd);
    } else {
      const len = drag.originEnd - drag.originStart;
      const maxStart = dur > 0 ? Math.max(0, dur - len) : Infinity;
      nextStart = Math.max(0, Math.min(maxStart, drag.originStart + dt));
      nextEnd = nextStart + len;
    }

    lastResizeStateRef.current = {
      lineId: drag.lineId,
      start: nextStart,
      end: nextEnd,
    };

    // ── Throttle Zustand updates via RAF ──────────────────────────────────────
    // This prevents Zustand from firing a store update (and downstream
    // re-renders of every region box) more often than the browser paints.
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const capturedLineId = drag.lineId;
    const capturedStart = nextStart;
    const capturedEnd = nextEnd;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      onResizeRef.current(capturedLineId, capturedStart, capturedEnd);
    });
  }, []); // no deps — reads everything from refs

  const endDrag = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      // Cancel any pending RAF before committing
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      trackRef.current?.releasePointerCapture(event.pointerId);

      const last = lastResizeStateRef.current;
      if (last) {
        onResizeCommit(last.lineId, last.start, last.end, drag.baseState);
        lastResizeStateRef.current = null;
      }
      dragRef.current = null;
    },
    [onResizeCommit],
  );

  // ── Gap selection ──────────────────────────────────────────────────────────

  const selectGap = useCallback(
    (gapId: string) => {
      setSelectedGapId(gapId);
      onSelectLine(null);
    },
    [onSelectLine],
  );

  const deselectGap = useCallback(() => {
    setSelectedGapId(null);
  }, []);

  const handleTrackClick = useCallback(() => {
    setSelectedGapId(null);
  }, []);

  // ── Gap action builders ────────────────────────────────────────────────────

  const buildGapActions = (gap: GapRegion) => ({
    onInsert: () => onInsertAtGap(gap.start, gap.end),
    onExtendPrev: gap.prevLineId
      ? () => onExtendLine(gap.prevLineId!, "end", gap.end)
      : null,
    onExtendNext: gap.nextLineId
      ? () => onExtendLine(gap.nextLineId!, "start", gap.start)
      : null,
    onDelete: onDeleteGap ? () => onDeleteGap(gap) : null,
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={trackRef}
      className="relative z-20 h-11 shrink-0 border-0 rounded-b-xl bg-[#050608]"
      style={{
        overflowX: "clip",
        overflowY: "visible",
        touchAction: "none",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleTrackClick}
    >
      {/* scrollLeft applied imperatively via useEffect — not via React re-render */}
      <div
        ref={innerRef}
        className="relative h-full will-change-transform"
        style={{
          width: `${totalWidth}px`,
        }}
      >
        {/* Gap regions */}
        {gaps.map((gap) => {
          const { onInsert, onExtendPrev, onExtendNext, onDelete } =
            buildGapActions(gap);
          return (
            <GapRegionBox
              key={gap.id}
              gap={gap}
              pxPerSec={pxPerSec}
              isSelected={gap.id === selectedGapId}
              onSelect={selectGap}
              onInsert={onInsert}
              onExtendPrev={onExtendPrev}
              onExtendNext={onExtendNext}
              onDelete={onDelete}
              onDeselect={deselectGap}
            />
          );
        })}

        {/* Lyric regions */}
        {lines.map((line) => (
          <RegionBox
            key={line.id}
            line={line}
            isActive={line.id === activeLineId}
            isSelected={line.id === selectedLineId}
            pxPerSec={pxPerSec}
            onBeginDrag={beginDrag}
            onSelect={(id) => {
              setSelectedGapId(null);
              onSelectLine(id);
            }}
          />
        ))}
      </div>
    </div>
  );
});
