"use client";

import { memo, useRef } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine, LyricWord } from "@/entities/lyrics";
import { useLiveWordRange } from "../../model/liveDragStore";

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
  const ref = useRef<HTMLButtonElement>(null);
  const liveRange = useLiveWordRange(word.id);
  const renderedLeft =
    liveRange === null ? left : (liveRange.start - line.start) * pxPerSec;
  const renderedWidth =
    liveRange === null
      ? width
      : Math.max((liveRange.end - liveRange.start) * pxPerSec, 1);

  return (
    <button
      ref={ref}
      type="button"
      data-karaoke-word-id={word.id}
      aria-pressed={isSelected}
      aria-label={`Word ${word.text.trim()} ${word.start.toFixed(2)}s–${word.end.toFixed(2)}s`}
      title={`${word.text.trim()} (${word.start.toFixed(2)}s–${word.end.toFixed(2)}s)`}
      className={cn(
        "absolute top-0 h-full min-w-[4px] cursor-grab will-change-transform",
        "flex items-center justify-center overflow-hidden text-[0.65rem]",
        "select-none whitespace-nowrap px-1",
        "focus:outline-none focus:ring-2 focus:ring-amber/50",
        isFirst && "rounded-l-inner",
        isLast && "rounded-r-inner",
        !isFirst && "border-l",
        isActive
          ? cn("bg-amber/40 text-white font-semibold shadow-sm", !isFirst && "border-amber/60")
          : isSelected
            ? cn("bg-amber/30 text-white", !isFirst && "border-amber/40")
            : cn("bg-white/10 text-white/80 hover:bg-white/25 hover:text-white", !isFirst && "border-white/20"),
      )}
      style={{
        transform: `translateX(${renderedLeft}px)`,
        width: renderedWidth,
      }}
      onClick={() => onSelect(line, word)}
      onPointerDown={(e) => {
        e.stopPropagation();
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const edgeThreshold = 8;
        const relativeX = e.clientX - rect.left;
        let edge: "start" | "end" | "move" = "move";
        if (relativeX <= edgeThreshold) edge = "start";
        else if (relativeX >= rect.width - edgeThreshold) edge = "end";
        onPointerDown(e, line, word, edge);
      }}
    >
      {word.text.trim()}
    </button>
  );
});
