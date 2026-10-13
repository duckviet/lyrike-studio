"use client";

import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine, LyricWord } from "@/entities/lyrics";
import { useLiveWordRange } from "../../model/liveDragStore";
import { RegionGrip, gripWidthFor } from "./RegionGrip";

interface WordRegionBoxProps {
  line: LyricLine;
  word: LyricWord;
  isActive: boolean;
  isSelected: boolean;
  left: number;
  width: number;
  pxPerSec: number;
  isFirst?: boolean;
  isLast?: boolean;
  onPointerDown: (
    e: React.PointerEvent,
    line: LyricLine,
    word: LyricWord,
    edge: "start" | "end" | "move",
  ) => void;
  onSelect: (line: LyricLine, word: LyricWord) => void;
}

export const WordRegionBox = memo(function WordRegionBox({
  line,
  word,
  isActive,
  isSelected,
  left,
  width,
  pxPerSec,
  isFirst,
  isLast,
  onPointerDown,
  onSelect,
}: WordRegionBoxProps) {
  const liveRange = useLiveWordRange(word.id);
  const renderedLeft =
    liveRange === null ? left : (liveRange.start - line.start) * pxPerSec;
  const renderedWidth =
    liveRange === null
      ? width
      : Math.max((liveRange.end - liveRange.start) * pxPerSec, 1);
  const gripWidth = gripWidthFor(renderedWidth, 8);
  const label = word.text.trim();
  const range = `${word.start.toFixed(2)}s–${word.end.toFixed(2)}s`;

  const begin =
    (edge: "start" | "end" | "move") => (e: React.PointerEvent) => {
      e.stopPropagation();
      onPointerDown(e, line, word, edge);
    };

  return (
    <div
      data-karaoke-word-id={word.id}
      title={`${label} (${range})`}
      className={cn(
        "absolute top-0 flex h-full min-w-[6px] items-stretch overflow-hidden will-change-transform",
        "text-[0.65rem] select-none whitespace-nowrap",
        isFirst && "rounded-l-control",
        isLast && "rounded-r-control",
        !isFirst && "border-l",
        isActive
          ? cn(
              "bg-amber/40 text-white font-semibold shadow-sm",
              !isFirst && "border-amber/60",
            )
          : isSelected
            ? cn("bg-amber/30 text-white", !isFirst && "border-amber/40")
            : cn(
                "bg-white/10 text-white/80 hover:bg-white/25 hover:text-white",
                !isFirst && "border-white/20",
              ),
      )}
      style={{
        transform: `translateX(${renderedLeft}px)`,
        width: renderedWidth,
      }}
    >
      <RegionGrip edge="start" width={gripWidth} onPointerDown={begin("start")} />
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={`Word ${label} ${range}`}
        className="flex min-w-0 flex-1 cursor-grab items-center justify-center overflow-hidden border-0 bg-transparent p-0 text-inherit select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onClick={() => onSelect(line, word)}
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={begin("move")}
      >
        <span className="overflow-hidden text-ellipsis">{label}</span>
      </button>
      <RegionGrip edge="end" width={gripWidth} onPointerDown={begin("end")} />
    </div>
  );
});
