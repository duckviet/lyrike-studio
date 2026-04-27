"use client";

import { useRef, useState, useCallback, memo } from "react";
import type { LyricLine } from "@/entities/lyrics";
import { MIN_LINE_LENGTH_SEC } from "@/features/lyrics-sync/config/constants";

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
}

type DragState = {
  lineId: string;
  edge: "start" | "end" | "move";
  originX: number;
  originStart: number;
  originEnd: number;
  baseState: unknown;
};

const RegionBox = memo(function RegionBox({
  line,
  isActive,
  isSelected,
  pxPerSec,
  onBeginDrag,
  onSelect,
}: {
  line: LyricLine;
  isActive: boolean;
  isSelected: boolean;
  pxPerSec: number;
  onBeginDrag: (
    event: React.PointerEvent,
    line: LyricLine,
    edge: "start" | "end" | "move",
  ) => void;
  onSelect: (id: string) => void;
}) {
  const left = line.start * pxPerSec;
  const width = Math.max((line.end - line.start) * pxPerSec, 1);

  return (
    <div
      className={`absolute top-1.5 bottom-1.5 flex items-stretch border rounded-md overflow-hidden transition-all duration-150 ${isSelected ? "border-amber shadow-selected" : ""} ${isActive ? "bg-primary-20 border-primary shadow-active" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"}`}
      style={{ left: `${left}px`, width: `${width}px` }}
      data-id={line.id}
    >
      <div
        className="w-1.5 shrink-0 bg-transparent cursor-ew-resize transition-colors duration-150 hover:bg-primary/50"
        onPointerDown={(e) => onBeginDrag(e, line, "start")}
      />
      <button
        type="button"
        className="flex-1 min-w-0 p-2 border-0 bg-transparent text-left cursor-grab text-xs font-medium text-white/80 overflow-hidden active:cursor-grabbing transition-colors hover:text-white"
        onPointerDown={(e) => onBeginDrag(e, line, "move")}
        onClick={() => onSelect(line.id)}
        title={line.text}
      >
        <span className="block whitespace-nowrap overflow-hidden text-ellipsis">
          {line.text}
        </span>
      </button>
      <div
        className="w-1.5 shrink-0 bg-transparent cursor-ew-resize transition-colors duration-150 hover:bg-primary/50"
        onPointerDown={(e) => onBeginDrag(e, line, "end")}
      />
    </div>
  );
});

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
}: LyricRegionsTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [lastResizeState, setLastResizeState] = useState<{
    lineId: string;
    start: number;
    end: number;
  } | null>(null);

  const totalWidth = Math.max(duration * pxPerSec, 0);

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
        nextStart = Math.min(
          drag.originEnd - MIN_LINE_LENGTH_SEC,
          drag.originStart + dt,
        );
        nextStart = Math.max(0, nextStart);
      } else if (drag.edge === "end") {
        nextEnd = Math.max(
          drag.originStart + MIN_LINE_LENGTH_SEC,
          drag.originEnd + dt,
        );
        nextEnd = Math.min(duration, nextEnd);
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

  return (
    <div
      className="relative h-11 shrink-0 overflow-hidden border-0 rounded-b-xl bg-[#050608]"
      ref={trackRef}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="relative h-full will-change-transform"
        style={{
          width: `${totalWidth}px`,
          transform: `translateX(-${scrollLeft}px)`,
        }}
      >
        {lines.map((line) => (
          <RegionBox
            key={line.id}
            line={line}
            isActive={line.id === activeLineId}
            isSelected={line.id === selectedLineId}
            pxPerSec={pxPerSec}
            onBeginDrag={beginDrag}
            onSelect={onSelectLine}
          />
        ))}
      </div>
    </div>
  );
}
