"use client";

import { memo, useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine, LyricWord } from "@/entities/lyrics";
import { computeSegmentLayout } from "@/features/lyrics-sync/lib/karaoke-region-layout";
import { useLiveLineRange } from "../../model/liveDragStore";
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
  const liveRange = useLiveLineRange(line.id);
  const renderedLine = useMemo(
    () => mergeLiveLineRange(line, liveRange),
    [line, liveRange],
  );
  const layout = useMemo(
    () => computeSegmentLayout(renderedLine, pxPerSec),
    [renderedLine, pxPerSec],
  );
  const hasWords = (renderedLine.words?.length ?? 0) > 0;

  return (
    <div
      data-karaoke-segment-id={line.id}
      className="absolute h-8"
      style={{
        transform: `translateX(${layout.left}px) translateY(-50%)`,
        width: layout.width,
        top: "50%",
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
            ? "border-amber/60 text-white"
            : isSelected
              ? "border-amber/40 text-white/90"
              : "border-white/10 text-white/70 hover:text-white",
          !hasWords && (
            isActive
              ? "bg-amber/40"
              : isSelected
                ? "bg-amber/30"
                : "bg-white/10 hover:bg-white/20"
          ),
        )}
        style={{
          left: 0,
          width: "100%",
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
            line={renderedLine}
            word={wordLayout.word}
            isActive={wordLayout.word.id === activeWordId}
            isSelected={wordLayout.word.id === selectedWordId}
            left={wordLayout.left}
            width={wordLayout.width}
            pxPerSec={pxPerSec}
            onPointerDown={onPointerDownWord}
            onSelect={onSelectWord}
            isFirst={index === 0}
            isLast={index === layout.words.length - 1}
          />
        ))}
    </div>
  );
});

function mergeLiveLineRange(
  line: LyricLine,
  liveRange: { readonly start: number; readonly end: number } | null,
): LyricLine {
  if (liveRange === null) return line;
  const duration = line.end - line.start;
  const nextDuration = liveRange.end - liveRange.start;
  const words = line.words?.map((word) => {
    if (duration <= 0) {
      const delta = liveRange.start - line.start;
      return { ...word, start: word.start + delta, end: word.end + delta };
    }
    const startRatio = (word.start - line.start) / duration;
    const endRatio = (word.end - line.start) / duration;
    return {
      ...word,
      start: liveRange.start + startRatio * nextDuration,
      end: liveRange.start + endRatio * nextDuration,
    };
  });

  return { ...line, start: liveRange.start, end: liveRange.end, words };
}
