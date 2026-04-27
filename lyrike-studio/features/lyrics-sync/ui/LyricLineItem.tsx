"use client";

import { memo } from "react";
import type { LyricLine } from "@/entities/lyrics";
import { NUDGE_DELTA_SEC } from "@/features/lyrics-sync/config/constants";
import { cn } from "@/shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * A segmented button group — bordered pill with dividers between children.
 * All children share the same rounded container.
 */
function ButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex overflow-hidden border border-line rounded-lg bg-bg">
      {children}
    </div>
  );
}

const segmentBase = cn(
  "min-w-[28px] border-0 bg-transparent",
  "px-2 py-1 text-xs font-semibold cursor-pointer",
  "text-ink-light transition-all duration-150",
  "hover:bg-bg-elev hover:text-primary",
);

const segmentWithDivider = cn(segmentBase, "border-l border-line");

const nudgeBase = cn(segmentBase, "font-mono");
const nudgeWithDivider = cn(segmentWithDivider, "font-mono");

// ─── Main component ───────────────────────────────────────────────────────────

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
      data-id={line.id}
      className={cn(
        "group grid grid-cols-1 gap-2 rounded-xl border p-3 transition-all duration-150",
        isActive && "border-primary shadow-active",
        isSelected && "selected-line",
        !isActive && !isSelected && "border-line bg-bg-soft hover:bg-bg-elev",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSeekLine(line)}
          className={cn(
            "border rounded-md font-mono text-xs px-2 py-1",
            "cursor-pointer transition-all duration-150",
            isSelected
              ? "bg-[rgba(196,149,106,0.18)] text-[#8a5e35] border-[rgba(196,149,106,0.25)]"
              : "bg-primary-8 text-primary border-primary-10 hover:bg-primary-20 hover:border-primary",
          )}
        >
          {formatTime(line.start)}–{formatTime(line.end)}
        </button>
        <span className="font-mono text-xs text-ink-light-soft">
          #{index + 1}
        </span>
      </div>

      <input
        value={line.text}
        onFocus={() => onSelectLine(line.id)}
        onChange={(e) => onEditLineText(line.id, e.target.value)}
        className={cn(
          "w-full border border-line rounded-lg",
          "bg-bg text-ink-light px-3 py-2 text-sm",
          "outline-none transition-all duration-150",
          "focus:border-primary focus:ring-2 focus:ring-primary/15",
        )}
      />

      <div
        className={cn(
          "flex flex-wrap items-center gap-1",
          "transition-opacity duration-150",
          isActive || isSelected
            ? "opacity-100"
            : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
        )}
      >
        {/* Reorder */}
        <ButtonGroup>
          <button
            onClick={() => onReorder(line.id, "up")}
            title="Move up"
            className={segmentBase}
          >
            ↑
          </button>
          <button
            onClick={() => onReorder(line.id, "down")}
            title="Move down"
            className={segmentWithDivider}
          >
            ↓
          </button>
        </ButtonGroup>

        {/* Edit actions */}
        <ButtonGroup>
          <button
            onClick={() => onInsertAfter(line.id)}
            title="Insert after"
            className={segmentBase}
          >
            +
          </button>
          <button
            onClick={() => onSplit(line.id)}
            title="Split"
            className={segmentWithDivider}
          >
            ⎘
          </button>
          <button
            onClick={() => onMerge(line.id)}
            title="Merge with previous"
            className={segmentWithDivider}
          >
            ⊕
          </button>
          <button
            onClick={() => onDelete(line.id)}
            title="Delete"
            className={cn(
              segmentWithDivider,
              "hover:bg-danger/10 hover:text-danger",
            )}
          >
            ✕
          </button>
        </ButtonGroup>

        {/* Nudge */}
        <ButtonGroup>
          <button
            onClick={() => onNudge(line, "start", -NUDGE_DELTA_SEC)}
            title={`Start −${NUDGE_DELTA_SEC}s`}
            className={nudgeBase}
          >
            −S
          </button>
          <button
            onClick={() => onNudge(line, "start", NUDGE_DELTA_SEC)}
            title={`Start +${NUDGE_DELTA_SEC}s`}
            className={nudgeWithDivider}
          >
            +S
          </button>
          <button
            onClick={() => onNudge(line, "end", -NUDGE_DELTA_SEC)}
            title={`End −${NUDGE_DELTA_SEC}s`}
            className={nudgeWithDivider}
          >
            −E
          </button>
          <button
            onClick={() => onNudge(line, "end", NUDGE_DELTA_SEC)}
            title={`End +${NUDGE_DELTA_SEC}s`}
            className={nudgeWithDivider}
          >
            +E
          </button>
        </ButtonGroup>
      </div>
    </li>
  );
});
