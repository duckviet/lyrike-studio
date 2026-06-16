"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import type { LyricLine, LyricWord } from "@/entities/lyrics";
import type { LyricsHistoryState } from "@/entities/lyrics/store/lyricsStore";
import { computeGaps, type GapRegion } from "../lib/gap-utils";
import { useRegionDrag } from "../model/useRegionDrag";
import { useWordRegionDrag } from "../model/useWordRegionDrag";
import { useGapSelection } from "../model/useGapSelection";
import type { RegionResizeCallbacks } from "../model/types";
import { GapRegionBox } from "./parts/GapRegionBox";
import { RegionBox } from "./parts/RegionBox";
import { KaraokeRegionGroup } from "./parts/KaraokeRegionGroup";

interface Props extends RegionResizeCallbacks {
  lines: LyricLine[];
  duration: number;
  pxPerSec: number;
  scrollLeft: number;
  activeLineId: string | null;
  selectedLineId: string | null;
  activeWordId?: string | null;
  selectedWordId?: string | null;
  syncedMode?: "line" | "karaoke";
  onSelectLine: (lineId: string | null) => void;
  onSelectWord?: (lineId: string, wordId: string) => void;
  onSeekWord?: (word: { start: number }) => void;
  onWordRangeLive?: (
    lineId: string,
    wordId: string,
    start: number,
    end: number,
  ) => void;
  onWordRangeCommit?: (
    lineId: string,
    wordId: string,
    start: number,
    end: number,
    baseState?: LyricsHistoryState | null,
  ) => void;
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
  activeWordId,
  selectedWordId,
  syncedMode = "line",
  onSelectLine,
  onSelectWord,
  onSeekWord,
  onWordRangeLive,
  onWordRangeCommit,
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

  const { handlers: wordHandlers, beginDrag: beginWordDrag } =
    useWordRegionDrag({
      pxPerSec,
      duration,
      captureRef: trackRef,
      onGetBaseState: resizeCbs.onGetBaseState,
      onWordRangeLive: (lineId, wordId, start, end) => {
        onWordRangeLive?.(lineId, wordId, start, end);
      },
      onWordRangeCommit: (lineId, wordId, start, end, baseState) => {
        onWordRangeCommit?.(lineId, wordId, start, end, baseState);
      },
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

  const handlePointerDownLine = useCallback(
    (e: React.PointerEvent, line: LyricLine, edge: "start" | "end" | "move") => {
      clearGap();
      onSelectLine(line.id);
      beginDrag(e, line, edge);
    },
    [clearGap, onSelectLine, beginDrag],
  );

  const handlePointerDownWord = useCallback(
    (e: React.PointerEvent, line: LyricLine, word: LyricWord, edge: "start" | "end" | "move") => {
      clearGap();
      onSelectLine(line.id);
      beginWordDrag(e, line, word, edge);
    },
    [clearGap, onSelectLine, beginWordDrag],
  );

  const handleSelectWord = useCallback(
    (line: LyricLine, word: LyricWord) => {
      clearGap();
      onSelectLine(line.id);
      onSelectWord?.(line.id, word.id);
      onSeekWord?.(word);
    },
    [clearGap, onSelectLine, onSelectWord, onSeekWord],
  );

  const mergedHandlers = {
    onPointerMove: (e: React.PointerEvent) => {
      handlers.onPointerMove(e);
      wordHandlers.onPointerMove(e);
    },
    onPointerUp: (e: React.PointerEvent) => {
      handlers.onPointerUp(e);
      wordHandlers.onPointerUp(e);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      handlers.onPointerCancel(e);
      wordHandlers.onPointerCancel(e);
    },
  };

  return (
    <div
      ref={trackRef}
      className="relative z-20 h-11 shrink-0 select-none rounded-b-inner border border-white/10 border-t-0 bg-[#092a0e]"
      style={{ overflowX: "clip", overflowY: "visible", touchAction: "none" }}
      onClick={clearGap}
      {...mergedHandlers}
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

        {syncedMode === "karaoke"
          ? lines.map((line) => (
              <KaraokeRegionGroup
                key={line.id}
                line={line}
                isActive={line.id === activeLineId}
                isSelected={line.id === selectedLineId}
                activeWordId={activeWordId ?? null}
                selectedWordId={selectedWordId ?? null}
                pxPerSec={pxPerSec}
                onPointerDownLine={handlePointerDownLine}
                onPointerDownWord={handlePointerDownWord}
                onSelectLine={handleSelectLine}
                onSelectWord={handleSelectWord}
              />
            ))
          : lines.map((line) => (
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
