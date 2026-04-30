"use client";

import { LyricLineItem } from "@/features/lyrics-sync/ui/LyricLineItem";
import type { LyricLine } from "@/entities/lyrics";
import { LyricsPanelProps } from "./LyricsPanel";

interface SyncedLinesListProps {
  lines: LyricLine[];
  activeLineId: string | null;
  selectedLineId: string | null;
  listRef: React.RefObject<HTMLUListElement | null>;
  formatTime: (seconds: number) => string;
  onSeekLine: LyricsPanelProps["onSeekLine"];
  onSelectLine: LyricsPanelProps["onSelectLine"];
  onEditLineText: LyricsPanelProps["onEditLineText"];
  onReorder: LyricsPanelProps["onReorder"];
  onInsertAfter: LyricsPanelProps["onInsertAfter"];
  onSplit: LyricsPanelProps["onSplit"];
  onMerge: LyricsPanelProps["onMerge"];
  onDelete: LyricsPanelProps["onDelete"];
  onNudge: LyricsPanelProps["onNudge"];
}

export default function SyncedLinesList({
  lines,
  activeLineId,
  selectedLineId,
  listRef,
  formatTime,
  onSeekLine,
  onSelectLine,
  onEditLineText,
  onReorder,
  onInsertAfter,
  onSplit,
  onMerge,
  onDelete,
  onNudge,
}: SyncedLinesListProps) {
  return (
    <ul
      ref={listRef}
      className="min-h-0 flex-1 m-0 p-2 list-none flex flex-col gap-2 overflow-y-auto scroll-smooth"
    >
      {lines.map((line, index) => (
        <LyricLineItem
          key={line.id}
          line={line}
          index={index}
          isActive={line.id === activeLineId}
          isSelected={line.id === selectedLineId}
          formatTime={formatTime}
          onSeekLine={onSeekLine}
          onSelectLine={onSelectLine}
          onEditLineText={onEditLineText}
          onReorder={onReorder}
          onInsertAfter={onInsertAfter}
          onSplit={onSplit}
          onMerge={onMerge}
          onDelete={onDelete}
          onNudge={onNudge}
        />
      ))}
    </ul>
  );
}
