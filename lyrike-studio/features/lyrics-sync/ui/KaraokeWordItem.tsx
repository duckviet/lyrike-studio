"use client";

import { memo, useState, useRef, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricWord } from "@/entities/lyrics";

interface KaraokeWordItemProps {
  lineId: string;
  word: LyricWord;
  isActive: boolean;
  isSelected: boolean;
  onSeekWord: (word: LyricWord) => void;
  onSelectWord: (lineId: string, wordId: string) => void;
  onEditWord: (lineId: string, wordId: string, text: string) => void;
}

export const KaraokeWordItem = memo(function KaraokeWordItem({
  lineId,
  word,
  isActive,
  isSelected,
  onSeekWord,
  onSelectWord,
  onEditWord,
}: KaraokeWordItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const displayText = word.text.trim();

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        defaultValue={displayText}
        data-karaoke-line-id={lineId}
        data-karaoke-word-id={word.id}
        aria-label={`Edit word ${displayText}`}
        className={cn(
          "min-w-[2rem] max-w-full rounded-inner border border-primary bg-white px-1.5 py-0.5",
          "text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-primary-30",
        )}
        onBlur={(e) => {
          onEditWord(lineId, word.id, e.target.value);
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEditWord(lineId, word.id, e.currentTarget.value);
            setIsEditing(false);
          }
          if (e.key === "Escape") {
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      data-karaoke-line-id={lineId}
      data-karaoke-word-id={word.id}
      aria-pressed={isSelected}
      aria-label={`Word ${displayText} ${word.start.toFixed(2)}s–${word.end.toFixed(2)}s`}
      title={`${displayText} (${word.start.toFixed(2)}s–${word.end.toFixed(2)}s)`}
      className={cn(
        "min-w-[2rem] max-w-full rounded-inner border px-1.5 py-0.5 text-sm font-medium",
        "truncate transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-primary-30",
        isActive
          ? "border-primary bg-primary text-white"
          : isSelected
            ? "border-amber-400 bg-amber-100 text-ink"
            : "border-transparent bg-black/5 text-ink-light hover:bg-black/10 hover:text-primary",
      )}
      onClick={() => {
        onSelectWord(lineId, word.id);
        onSeekWord(word);
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {displayText}
    </button>
  );
});
