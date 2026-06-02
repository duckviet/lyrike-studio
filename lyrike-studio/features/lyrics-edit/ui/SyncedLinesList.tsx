"use client";

import { useState } from "react";
import { LyricLineItem } from "@/features/lyrics-sync/ui/LyricLineItem";
import { SyncedTextEditor } from "@/features/lyrics-edit/ui/SyncedTextEditor";
import { useSyncedTextEdit } from "../model/useSyncedTextEdit";
import type { LyricLine } from "@/entities/lyrics";
import type { ParsedLineEdit } from "../model/useSyncedTextEdit";
import { useTranslations } from "next-intl";
import { EditorSegmentedControl } from "@/features/editor";

type SyncedMode = "line" | "text";

interface SyncedLinesListProps {
  lines: LyricLine[];
  activeLineId: string | null;
  selectedLineId: string | null;
  listRef: React.RefObject<HTMLUListElement | null>;
  formatTime: (seconds: number) => string;
  onSeekLine: (line: LyricLine) => void;
  onApplyTextEdits: (edits: ParsedLineEdit[]) => void;
}

export default function SyncedLinesList({
  lines,
  activeLineId,
  selectedLineId,
  listRef,
  formatTime,
  onSeekLine,
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
      <div className="sticky top-0 z-10 flex bg-[#f4f5f4] px-3 py-2">
        <EditorSegmentedControl
          className="w-full"
          items={[
            { id: "line", label: t("lineEdit") },
            { id: "text", label: t("textEdit") },
          ]}
          onChange={setMode}
          value={mode}
        />
      </div>

      {/* Content */}
      {mode === "line" ? (
        <ul
          ref={listRef}
          className="m-0 flex min-h-0 flex-1 list-none flex-col gap-3 overflow-y-auto p-3 scroll-smooth"
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
