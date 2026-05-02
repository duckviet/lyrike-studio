"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import type { LyricLine } from "@/entities/lyrics";
import { computeGaps, type GapRegion } from "../lib/gap-utils";
import { useRegionDrag } from "../model/useRegionDrag";
import { useGapSelection } from "../model/useGapSelection";
import type { RegionResizeCallbacks } from "../model/types";
import { GapRegionBox } from "./parts/GapRegionBox";
import { RegionBox } from "./parts/RegionBox";

interface Props extends RegionResizeCallbacks {
  lines: LyricLine[];
  duration: number;
  pxPerSec: number;
  scrollLeft: number;
  activeLineId: string | null;
  selectedLineId: string | null;
  onSelectLine: (lineId: string | null) => void;
  onInsertAtGap: (start: number, end: number) => void;
  onExtendLine: (
    lineId: string,
    edge: "start" | "end",
    newTime: number,
  ) => void;
  onDeleteGap?: (gap: GapRegion) => void;
}

export const LyricRegionsTrack = memo(function LyricRegionsTrack({
  lines,
  duration,
  pxPerSec,
  scrollLeft,
  activeLineId,
  selectedLineId,
  onSelectLine,
  onInsertAtGap,
  onExtendLine,
  onDeleteGap,
  ...resizeCbs
}: Props) {
  const innerRef = useRef<HTMLDivElement>(null);

  const { selectedGapId, selectGap, clearGap } = useGapSelection();

  const { trackRef, handlers, beginDrag } = useRegionDrag({
    pxPerSec,
    duration,
    ...resizeCbs,
    onDragBegin: (lineId) => {
      clearGap();
      onSelectLine(lineId);
    },
  });

  // Imperative scroll (avoid re-render)
  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.style.transform = `translateX(-${scrollLeft}px)`;
    }
  }, [scrollLeft]);

  const totalWidth = Math.max(duration * pxPerSec, 0);
  const gaps = computeGaps(lines, duration);

  const handleSelectGap = useCallback(
    (id: string) => {
      selectGap(id);
      onSelectLine(null);
    },
    [selectGap, onSelectLine],
  );

  const handleSelectLine = useCallback(
    (id: string | null) => {
      clearGap();
      onSelectLine(id);
    },
    [clearGap, onSelectLine],
  );

  return (
    <div
      ref={trackRef}
      className="relative z-20 h-11 shrink-0 border-0 rounded-b-xl bg-[#050608] select-none"
      style={{ overflowX: "clip", overflowY: "visible", touchAction: "none" }}
      onClick={clearGap}
      {...handlers}
    >
      <div
        ref={innerRef}
        className="relative h-full will-change-transform"
        style={{ width: `${totalWidth}px` }}
      >
        {gaps.map((gap) => (
          <GapRegionBox
            key={gap.id}
            gap={gap}
            pxPerSec={pxPerSec}
            isSelected={gap.id === selectedGapId}
            onSelect={handleSelectGap}
            onDeselect={clearGap}
            onInsert={() => onInsertAtGap(gap.start, gap.end)}
            onExtendPrev={
              gap.prevLineId
                ? () => onExtendLine(gap.prevLineId!, "end", gap.end)
                : null
            }
            onExtendNext={
              gap.nextLineId
                ? () => onExtendLine(gap.nextLineId!, "start", gap.start)
                : null
            }
            onDelete={onDeleteGap ? () => onDeleteGap(gap) : null}
          />
        ))}

        {lines.map((line) => (
          <RegionBox
            key={line.id}
            line={line}
            isActive={line.id === activeLineId}
            isSelected={line.id === selectedLineId}
            pxPerSec={pxPerSec}
            isDragging={activeLineId === line.id}
            onBeginDrag={beginDrag}
            onSelect={handleSelectLine}
          />
        ))}
      </div>
    </div>
  );
});
