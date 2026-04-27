"use client";

import { useRef, useState, useCallback } from "react";
import type { LyricLine } from "@/entities/lyrics";
import { MIN_LINE_LENGTH_SEC } from "@/features/lyrics-sync/config/constants";
import { cn } from "@/shared/lib/utils";
import { computeGaps, type GapRegion } from "../lib/gap-utils";
import { GapRegionBox } from "./parts/GapRegionBox";
import { RegionBox } from "./parts/RegionBox";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function LyricRegionsTrack({
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
}: LyricRegionsTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [lastResizeState, setLastResizeState] = useState<{
    lineId: string;
    start: number;
    end: number;
  } | null>(null);
  const [selectedGapId, setSelectedGapId] = useState<string | null>(null);

  const totalWidth = Math.max(duration * pxPerSec, 0);
  const gaps = computeGaps(lines, duration);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const beginDrag = useCallback(
    (
      event: React.PointerEvent,
      line: LyricLine,
      edge: "start" | "end" | "move",
    ) => {
      event.stopPropagation();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setDrag({
        lineId: line.id,
        edge,
        originX: event.clientX,
        originStart: line.start,
        originEnd: line.end,
        baseState: onGetBaseState?.() ?? null,
      });
      setSelectedGapId(null);
      onSelectLine(line.id);
      onResizeStart?.();
    },
    [onSelectLine, onResizeStart, onGetBaseState],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!drag) return;
      const dx = event.clientX - drag.originX;
      const dt = dx / pxPerSec;

      let nextStart = drag.originStart;
      let nextEnd = drag.originEnd;

      if (drag.edge === "start") {
        nextStart = Math.max(
          0,
          Math.min(drag.originEnd - MIN_LINE_LENGTH_SEC, drag.originStart + dt),
        );
      } else if (drag.edge === "end") {
        nextEnd = Math.min(
          duration,
          Math.max(drag.originStart + MIN_LINE_LENGTH_SEC, drag.originEnd + dt),
        );
      } else {
        const len = drag.originEnd - drag.originStart;
        nextStart = Math.max(
          0,
          Math.min(duration - len, drag.originStart + dt),
        );
        nextEnd = nextStart + len;
      }

      const newState = { lineId: drag.lineId, start: nextStart, end: nextEnd };
      setLastResizeState(newState);
      onResize(drag.lineId, nextStart, nextEnd);
    },
    [drag, pxPerSec, duration, onResize],
  );

  const endDrag = useCallback(
    (event: React.PointerEvent) => {
      if (!drag) return;
      (event.currentTarget as HTMLElement).releasePointerCapture(
        event.pointerId,
      );
      if (lastResizeState) {
        onResizeCommit(
          lastResizeState.lineId,
          lastResizeState.start,
          lastResizeState.end,
          drag.baseState,
        );
        setLastResizeState(null);
      }
      setDrag(null);
    },
    [drag, lastResizeState, onResizeCommit],
  );

  // ── Gap selection ──────────────────────────────────────────────────────────

  const selectGap = useCallback(
    (gapId: string) => {
      setSelectedGapId(gapId);
      onSelectLine(null); // deselect any lyric line
    },
    [onSelectLine],
  );

  const deselectGap = useCallback(() => {
    setSelectedGapId(null);
  }, []);

  const handleTrackClick = useCallback(() => {
    // Click on empty track background → deselect everything
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
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={trackRef}
      className="relative z-20 h-11 shrink-0 border-0 rounded-b-xl bg-[#050608]"
      // overflow-x: clip clips horizontally without creating a stacking context
      // that would prevent overflow-y (the popup) from being visible
      style={{ overflowX: "clip", overflowY: "visible" }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleTrackClick}
    >
      <div
        className="relative h-full will-change-transform"
        style={{
          width: `${totalWidth}px`,
          transform: `translateX(-${scrollLeft}px)`,
        }}
      >
        {/* Gap regions — rendered below lyric regions (z-order) */}
        {gaps.map((gap) => {
          const { onInsert, onExtendPrev, onExtendNext } = buildGapActions(gap);
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
              onDeselect={deselectGap}
            />
          );
        })}

        {/* Lyric regions — rendered above gaps */}
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
}
