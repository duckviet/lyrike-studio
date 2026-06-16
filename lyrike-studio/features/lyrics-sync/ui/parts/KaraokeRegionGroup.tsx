"use client";

import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine, LyricWord } from "@/entities/lyrics";
import { computeSegmentLayout } from "@/features/lyrics-sync/lib/karaoke-region-layout";
import { WordRegionBox } from "./WordRegionBox";

interface KaraokeRegionGroupProps {
  line: LyricLine;
  isActive: boolean;
  isSelected: boolean;
  activeWordId: string | null;
  selectedWordId: string | null;
  pxPerSec: number;
  onPointerDownLine: (
    e: React.PointerEvent,
    line: LyricLine,
    edge: "start" | "end" | "move",
  ) => void;
  onPointerDownWord: (
    e: React.PointerEvent,
    line: LyricLine,
    word: LyricWord,
    edge: "start" | "end" | "move",
  ) => void;
  onSelectLine: (lineId: string) => void;
  onSelectWord: (line: LyricLine, word: LyricWord) => void;
}

export const KaraokeRegionGroup = memo(function KaraokeRegionGroup({
  line,
  isActive,
  isSelected,
  activeWordId,
  selectedWordId,
  pxPerSec,
  onPointerDownLine,
  onPointerDownWord,
  onSelectLine,
  onSelectWord,
}: KaraokeRegionGroupProps) {
  const layout = computeSegmentLayout(line, pxPerSec);
  const hasWords = (line.words?.length ?? 0) > 0;

  return (
    <div
      data-karaoke-segment-id={line.id}
      className="absolute h-8"
      style={{
        left: layout.left,
        width: layout.width,
      }}
    >
      <button
        type="button"
        data-line-id={line.id}
        aria-pressed={isSelected}
        aria-label={`Segment ${line.text} ${line.start.toFixed(2)}s–${line.end.toFixed(2)}s`}
        title={`${line.text} (${line.start.toFixed(2)}s–${line.end.toFixed(2)}s)`}
        className={cn(
          "absolute inset-0 h-full w-full rounded-inner border transition-colors duration-150",
          "text-[0.65rem] font-medium select-none overflow-hidden whitespace-nowrap px-2",
          isActive
            ? "border-amber-400 text-white"
            : isSelected
              ? "border-amber-400/60 text-white/90"
              : "border-white/10 text-white/70 hover:text-white",
        )}
        style={{
          left: 0,
          width: layout.width,
        }}
        onClick={() => onSelectLine(line.id)}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const edgeThreshold = 8;
          const relativeX = e.clientX - rect.left;
          let edge: "start" | "end" | "move" = "move";
          if (relativeX <= edgeThreshold) edge = "start";
          else if (relativeX >= rect.width - edgeThreshold) edge = "end";
          onPointerDownLine(e, line, edge);
        }}
      >
        {!hasWords && line.text}
      </button>

      {hasWords &&
        layout.words.map((wordLayout, index) => (
          <WordRegionBox
            key={wordLayout.word.id}
            line={line}
            word={wordLayout.word}
            isActive={wordLayout.word.id === activeWordId}
            isSelected={wordLayout.word.id === selectedWordId}
            left={wordLayout.left}
            width={wordLayout.width}
            onPointerDown={onPointerDownWord}
            onSelect={onSelectWord}
            isFirst={index === 0}
            isLast={index === layout.words.length - 1}
          />
        ))}
    </div>
  );
});
