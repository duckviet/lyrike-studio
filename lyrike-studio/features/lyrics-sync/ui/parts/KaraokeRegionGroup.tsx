"use client";

import { memo, useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine, LyricWord } from "@/entities/lyrics";
import { computeSegmentLayout } from "@/features/lyrics-sync/lib/karaoke-region-layout";
import { useLiveLineRange } from "../../model/liveDragStore";
import { WordRegionBox } from "./WordRegionBox";
import { RegionGrip, gripWidthFor, lineTone } from "./RegionGrip";

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

  const gripWidth = gripWidthFor(layout.width);

  return (
    <div
      data-karaoke-segment-id={line.id}
      className="absolute"
      style={{
        transform: `translateX(${layout.left}px)`,
        width: layout.width,
        top: 4,
        bottom: 4,
        zIndex: isActive ? 40 : isSelected ? 35 : 20,
      }}
    >
      {/* Line bar: drag the body to move the whole line, grips to resize it. */}
      <div
        data-line-id={line.id}
        className={cn(
          "absolute inset-x-0 top-0 flex items-stretch overflow-hidden rounded-control transition-colors duration-150",
          hasWords ? "h-5" : "h-full",
          lineTone(isActive, isSelected),
        )}
      >
        <RegionGrip
          edge="start"
          width={gripWidth}
          onPointerDown={(e) => onPointerDownLine(e, line, "start")}
        />
        <button
          type="button"
          aria-pressed={isSelected}
          aria-label={`Segment ${line.text} ${line.start.toFixed(2)}s–${line.end.toFixed(2)}s`}
          title={`${line.text} (${line.start.toFixed(2)}s–${line.end.toFixed(2)}s)`}
          className="min-w-0 flex-1 cursor-grab overflow-hidden whitespace-nowrap border-0 bg-transparent p-1 text-left text-[0.65rem] font-medium text-white/85 select-none transition-colors hover:text-white active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onClick={() => onSelectLine(line.id)}
          onDragStart={(e) => e.preventDefault()}
          onPointerDown={(e) => onPointerDownLine(e, line, "move")}
        >
          {line.text}
        </button>
        <RegionGrip
          edge="end"
          width={gripWidth}
          onPointerDown={(e) => onPointerDownLine(e, line, "end")}
        />
      </div>

      {hasWords && (
        <div className="absolute inset-x-0 bottom-0 top-6">
          {layout.words.map((wordLayout, index) => (
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
      )}
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
