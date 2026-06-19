"use client";

import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine } from "@/entities/lyrics";
import { getKaraokeLineDisplayProps } from "./karaokeListView";
import { KaraokeWordItem } from "./KaraokeWordItem";

interface KaraokeLyricLineItemProps {
  line: LyricLine;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  activeWordId: string | null;
  selectedWordId: string | null;
  formatTime: (seconds: number) => string;
  onSeekLine: (line: LyricLine) => void;
  onSeekWord: (word: { start: number }) => void;
  onSelectWord: (lineId: string, wordId: string) => void;
  onEditWord: (lineId: string, wordId: string, text: string) => void;
}

export const KaraokeLyricLineItem = memo(function KaraokeLyricLineItem({
  line,
  index,
  isActive,
  isSelected,
  activeWordId,
  selectedWordId,
  formatTime,
  onSeekLine,
  onSeekWord,
  onSelectWord,
  onEditWord,
}: KaraokeLyricLineItemProps) {
  const display = getKaraokeLineDisplayProps(line, {
    isActive,
    isSelected,
    activeWordId,
    selectedWordId,
    formatTime,
  });

  return (
    <li
      data-id={line.id}
      data-line-id={line.id}
      data-karaoke-line-id={line.id}
      className={cn(
        "group grid grid-cols-1 gap-2 rounded-inner p-3 transition-colors duration-150",
        isActive && "bg-bg-elev",
        isSelected && "bg-amber-soft",
        !isActive && !isSelected && "bg-bg hover:bg-bg/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={`Seek to line ${line.text} at ${display.timeLabel}`}
          onClick={() => onSeekLine(line)}
          className={cn(
            "rounded-[999px] px-2.5 py-1 font-mono text-xs border-0",
            "cursor-pointer transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary-30",
            isSelected
              ? "bg-amber-soft text-primary"
              : "bg-primary-8 text-primary hover:bg-primary-20",
          )}
        >
          {display.timeLabel}
        </button>
        <span className="font-mono text-xs text-ink-light-soft">
          #{index + 1}
        </span>
      </div>

      {display.hasWords ? (
        <div className="flex flex-wrap items-center gap-1">
          {display.words.map(({ word, isActive, isSelected }) => (
            <KaraokeWordItem
              key={word.id}
              lineId={line.id}
              word={word}
              isActive={isActive}
              isSelected={isSelected}
              onSeekWord={onSeekWord}
              onSelectWord={onSelectWord}
              onEditWord={onEditWord}
            />
          ))}
        </div>
      ) : (
        <div
          data-karaoke-line-id={line.id}
          className="rounded-inner bg-black/5 px-2 py-1 text-sm text-ink-light-soft"
        >
          {line.text}
        </div>
      )}
    </li>
  );
});
