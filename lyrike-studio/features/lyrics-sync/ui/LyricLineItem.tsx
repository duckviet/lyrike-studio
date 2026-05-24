"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { LyricLine } from "@/entities/lyrics";
import { TIMING } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";
import {
  ArrowDown,
  ArrowUpIcon,
  DeleteIcon,
  MergeIcon,
  Plus,
  SplitSquareHorizontal,
} from "lucide-react";

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

function ButtonGroup({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex items-center gap-1">{children}</div>;
}

const segmentBase = cn(
  "inline-flex items-center justify-center min-w-[28px] h-7 rounded-control bg-black/5",
  "px-2 py-1 text-xs font-semibold cursor-pointer border-0",
  "text-ink-light transition-all duration-150",
  "hover:bg-black/10 hover:text-primary",
);

const segmentWithDivider = segmentBase;

const nudgeBase = cn(segmentBase, "font-mono");
const nudgeWithDivider = cn(segmentBase, "font-mono");

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
  const t = useTranslations("dashboard.actions");

  return (
    <li
      data-id={line.id}
      className={cn(
        "group grid grid-cols-1 gap-2 rounded-inner bg-bg p-3 transition-colors duration-150",
        isActive && "bg-bg-elev",
        isSelected && "bg-amber-soft",
        !isActive && !isSelected && "hover:bg-bg/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSeekLine(line)}
          className={cn(
            "rounded-[999px] px-2.5 py-1 font-mono text-xs border-0",
            "cursor-pointer transition-colors duration-150",
            isSelected
              ? "bg-amber-soft text-primary"
              : "bg-primary-8 text-primary hover:bg-primary-20",
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
          "w-full rounded-inner",
          "bg-transparent text-ink-light py-1 text-base",
          "border border-transparent px-2 -ml-2",
          "outline-none transition-all duration-150",
          "focus:border-line focus:bg-white",
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
            type="button"
            onClick={() => onReorder(line.id, "up")}
            title={t("moveUp")}
            className={segmentBase}
          >
            <ArrowUpIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => onReorder(line.id, "down")}
            title={t("moveDown")}
            className={segmentWithDivider}
          >
            <ArrowDown size={13} />
          </button>
        </ButtonGroup>

        {/* Edit actions */}
        <ButtonGroup>
          <button
            type="button"
            onClick={() => onInsertAfter(line.id)}
            title={t("insertAfter")}
            className={segmentBase}
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            onClick={() => onSplit(line.id)}
            title={t("split")}
            className={segmentWithDivider}
          >
            <SplitSquareHorizontal size={13} />
          </button>
          <button
            type="button"
            onClick={() => onMerge(line.id)}
            title={t("merge")}
            className={segmentWithDivider}
          >
            <MergeIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(line.id)}
            title={t("delete")}
            className={cn(
              segmentWithDivider,
              "hover:bg-danger/10 hover:text-danger",
            )}
          >
            <DeleteIcon size={13} />
          </button>
        </ButtonGroup>

        {/* Nudge */}
        <ButtonGroup>
          <button
            type="button"
            onClick={() => onNudge(line, "start", -TIMING.NUDGE_DELTA_SEC)}
            title={t("nudgeStart", { delta: -TIMING.NUDGE_DELTA_SEC })}
            className={nudgeBase}
          >
            −S
          </button>
          <button
            type="button"
            onClick={() => onNudge(line, "start", TIMING.NUDGE_DELTA_SEC)}
            title={t("nudgeStart", { delta: TIMING.NUDGE_DELTA_SEC })}
            className={nudgeWithDivider}
          >
            +S
          </button>
          <button
            type="button"
            onClick={() => onNudge(line, "end", -TIMING.NUDGE_DELTA_SEC)}
            title={t("nudgeEnd", { delta: -TIMING.NUDGE_DELTA_SEC })}
            className={nudgeWithDivider}
          >
            −E
          </button>
          <button
            type="button"
            onClick={() => onNudge(line, "end", TIMING.NUDGE_DELTA_SEC)}
            title={t("nudgeEnd", { delta: TIMING.NUDGE_DELTA_SEC })}
            className={nudgeWithDivider}
          >
            +E
          </button>
        </ButtonGroup>
      </div>
    </li>
  );
});
