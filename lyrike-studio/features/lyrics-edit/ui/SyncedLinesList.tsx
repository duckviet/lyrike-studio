"use client";

import { useState } from "react";
import { LyricLineItem } from "@/features/lyrics-sync/ui/LyricLineItem";
import { SyncedTextEditor } from "@/features/lyrics-edit/ui/SyncedTextEditor";
import { useSyncedTextEdit } from "../model/useSyncedTextEdit";
import type { LyricLine } from "@/entities/lyrics";
import type { ParsedLineEdit } from "../model/useSyncedTextEdit";
import { cn } from "@/shared/lib/utils";
import { useTranslations } from "next-intl";

type SyncedMode = "line" | "text";

interface SyncedLinesListProps {
  lines: LyricLine[];
  activeLineId: string | null;
  selectedLineId: string | null;
  listRef: React.RefObject<HTMLUListElement | null>;
  formatTime: (seconds: number) => string;
  onSeekLine: (line: LyricLine) => void;
  onSelectLine: (lineId: string | null) => void;
  onEditLineText: (lineId: string, text: string) => void;
  onReorder: (lineId: string, direction: "up" | "down") => void;
  onInsertAfter: (lineId: string) => void;
  onSplit: (lineId: string) => void;
  onMerge: (lineId: string) => void;
  onDelete: (lineId: string) => void;
  onNudge: (line: LyricLine, edge: "start" | "end", delta: number) => void;
  onApplyTextEdits: (edits: ParsedLineEdit[]) => void;
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
  onApplyTextEdits,
}: SyncedLinesListProps) {
  const [mode, setMode] = useState<SyncedMode>("line");

  const { textValue, handleTextChange, handleTextBlur } = useSyncedTextEdit(
    lines,
    onApplyTextEdits,
  );

  const t = useTranslations("editor.syncedMode");

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* Mode toggle tabs */}
      <div className="sticky top-0 z-10 flex border-b border-border bg-background">
        <button
          type="button"
          onClick={() => setMode("line")}
          className={cn(
            "flex-1 text-center text-sm px-3 py-2 font-medium transition-colors cursor-pointer",
            mode === "line"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {t("lineEdit")}
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          className={cn(
            "flex-1 text-center text-sm px-3 py-2 font-medium transition-colors cursor-pointer",
            mode === "text"
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {t("textEdit")}
        </button>
      </div>

      {/* Content */}
      {mode === "line" ? (
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
      ) : (
        <SyncedTextEditor
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
        />
      )}
    </div>
  );
}
