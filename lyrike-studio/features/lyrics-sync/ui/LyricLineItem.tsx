"use client";

import { memo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { LyricLine } from "@/entities/lyrics";
import { TIMING } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
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

function ReorderButtonGroup({ lineId }: { lineId: string }) {
  const t = useTranslations("dashboard.actions");
  const reorder = useLyricsStore((s) => s.reorder);

  return (
    <ButtonGroup>
      <button
        type="button"
        onClick={() => reorder(lineId, "up")}
        title={t("moveUp")}
        className={segmentBase}
      >
        <ArrowUpIcon size={13} />
      </button>
      <button
        type="button"
        onClick={() => reorder(lineId, "down")}
        title={t("moveDown")}
        className={segmentWithDivider}
      >
        <ArrowDown size={13} />
      </button>
    </ButtonGroup>
  );
}

function EditButtonGroup({ lineId }: { lineId: string }) {
  const t = useTranslations("dashboard.actions");
  const insertAfter = useLyricsStore((s) => s.insertAfter);
  const splitLine = useLyricsStore((s) => s.splitLine);
  const mergeWithPrevious = useLyricsStore((s) => s.mergeWithPrevious);
  const deleteLine = useLyricsStore((s) => s.deleteLine);

  return (
    <ButtonGroup>
      <button
        type="button"
        onClick={() => insertAfter(lineId)}
        title={t("insertAfter")}
        className={segmentBase}
      >
        <Plus size={13} />
      </button>
      <button
        type="button"
        onClick={() => splitLine(lineId)}
        title={t("split")}
        className={segmentWithDivider}
      >
        <SplitSquareHorizontal size={13} />
      </button>
      <button
        type="button"
        onClick={() => mergeWithPrevious(lineId)}
        title={t("merge")}
        className={segmentWithDivider}
      >
        <MergeIcon size={13} />
      </button>
      <button
        type="button"
        onClick={() => deleteLine(lineId)}
        title={t("delete")}
        className={cn(
          segmentWithDivider,
          "hover:bg-danger/10 hover:text-danger",
        )}
      >
        <DeleteIcon size={13} />
      </button>
    </ButtonGroup>
  );
}

function NudgeButtonGroup({ line }: { line: LyricLine }) {
  const t = useTranslations("dashboard.actions");
  const nudgeLine = useLyricsStore((s) => s.nudgeLine);

  return (
    <ButtonGroup>
      <button
        type="button"
        onClick={() => nudgeLine(line.id, "start", -TIMING.NUDGE_DELTA_SEC)}
        title={t("nudgeStart", { delta: -TIMING.NUDGE_DELTA_SEC })}
        className={nudgeBase}
      >
        −S
      </button>
      <button
        type="button"
        onClick={() => nudgeLine(line.id, "start", TIMING.NUDGE_DELTA_SEC)}
        title={t("nudgeStart", { delta: TIMING.NUDGE_DELTA_SEC })}
        className={nudgeWithDivider}
      >
        +S
      </button>
      <button
        type="button"
        onClick={() => nudgeLine(line.id, "end", -TIMING.NUDGE_DELTA_SEC)}
        title={t("nudgeEnd", { delta: -TIMING.NUDGE_DELTA_SEC })}
        className={nudgeWithDivider}
      >
        −E
      </button>
      <button
        type="button"
        onClick={() => nudgeLine(line.id, "end", TIMING.NUDGE_DELTA_SEC)}
        title={t("nudgeEnd", { delta: TIMING.NUDGE_DELTA_SEC })}
        className={nudgeWithDivider}
      >
        +E
      </button>
    </ButtonGroup>
  );
}

export const LyricLineItem = memo(function LyricLineItem({
  line,
  index,
  isActive,
  isSelected,
  formatTime,
  onSeekLine,
}: LyricLineItemProps) {
  const selectLine = useLyricsStore((s) => s.selectLine);
  const editText = useLyricsStore((s) => s.editText);
  const focusLineId = useLyricsStore((s) => s.focusLineId);
  const setFocusLine = useLyricsStore((s) => s.setFocusLine);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusLineId === line.id && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      setFocusLine(null);
    }
  }, [focusLineId, line.id, setFocusLine]);

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
        ref={inputRef}
        value={line.text}
        onFocus={() => selectLine(line.id)}
        onChange={(e) => editText(line.id, e.target.value)}
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
        <ReorderButtonGroup lineId={line.id} />
        <EditButtonGroup lineId={line.id} />
        <NudgeButtonGroup line={line} />
      </div>
    </li>
  );
});
