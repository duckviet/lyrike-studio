"use client";

import { memo } from "react";
import type { LyricLine } from "@/lib/lyricsTimeline";

interface LyricLineItemProps {
  line: LyricLine;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  formatTime: (seconds: number) => string;
  onSeekLine: (line: LyricLine) => void;
  onSelectLine: (id: string) => void;
  onEditLineText: (id: string, text: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onInsertAfter: (id: string) => void;
  onSplit: (id: string) => void;
  onMerge: (id: string) => void;
  onDelete: (id: string) => void;
  onNudge: (line: LyricLine, edge: "start" | "end", delta: number) => void;
}

export const LyricLineItem = memo(function LyricLineItem({
  line,
  index,
  isActive,
  isSelected,
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
}: LyricLineItemProps) {
  return (
    <li
      className={`lyric-line-item ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`}
      data-id={line.id}
    >
      <div className="line-head">
        <button
          type="button"
          className="timestamp-btn"
          onClick={() => onSeekLine(line)}
        >
          {formatTime(line.start)}–{formatTime(line.end)}
        </button>
        <span className="line-index">#{index + 1}</span>
      </div>

      <input
        className="line-input"
        value={line.text}
        onFocus={() => onSelectLine(line.id)}
        onChange={(e) => onEditLineText(line.id, e.target.value)}
      />

      <div className="line-tools">
        <div className="tool-group" role="group" aria-label="Order">
          <button onClick={() => onReorder(line.id, "up")} title="Move up">
            ↑
          </button>
          <button onClick={() => onReorder(line.id, "down")} title="Move down">
            ↓
          </button>
        </div>
        <div className="tool-group" role="group" aria-label="Structure">
          <button onClick={() => onInsertAfter(line.id)} title="Insert after">
            +
          </button>
          <button onClick={() => onSplit(line.id)} title="Split">
            ⎘
          </button>
          <button onClick={() => onMerge(line.id)} title="Merge with previous">
            ⊕
          </button>
          <button
            className="danger"
            onClick={() => onDelete(line.id)}
            title="Delete"
          >
            ✕
          </button>
        </div>
        <div className="tool-group nudge" role="group" aria-label="Nudge">
          <button
            onClick={() => onNudge(line, "start", -0.1)}
            title="Start −0.1s"
          >
            −S
          </button>
          <button
            onClick={() => onNudge(line, "start", 0.1)}
            title="Start +0.1s"
          >
            +S
          </button>
          <button onClick={() => onNudge(line, "end", -0.1)} title="End −0.1s">
            −E
          </button>
          <button onClick={() => onNudge(line, "end", 0.1)} title="End +0.1s">
            +E
          </button>
        </div>
      </div>
    </li>
  );
});
