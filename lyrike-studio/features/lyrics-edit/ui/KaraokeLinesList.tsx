"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { LyricLine } from "@/entities/lyrics";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { KaraokeLyricLineItem } from "@/features/lyrics-sync/ui/KaraokeLyricLineItem";
import { EditorSegmentedControl } from "@/features/editor";
import { SyncedTextEditor } from "./SyncedTextEditor";
import { useSyncedTextEdit } from "../model/useSyncedTextEdit";

type KaraokeMode = "text" | "karaoke";

interface KaraokeLinesListProps {
  lines: LyricLine[];
  activeLineId: string | null;
  selectedLineId: string | null;
  activeWordId: string | null;
  selectedWordId: string | null;
  listRef: React.RefObject<HTMLUListElement | null>;
  formatTime: (seconds: number) => string;
  onSeekLine: (line: LyricLine) => void;
  onSeekWord: (word: { start: number }) => void;
  onApplyTextEdits: (edits: import("../model/useSyncedTextEdit").ParsedLineEdit[]) => void;
}

export default function KaraokeLinesList({
  lines,
  activeLineId,
  selectedLineId,
  activeWordId,
  selectedWordId,
  listRef,
  formatTime,
  onSeekLine,
  onSeekWord,
  onApplyTextEdits,
}: KaraokeLinesListProps) {
  const [mode, setMode] = useState<KaraokeMode>("karaoke");
  const { textValue, handleTextChange, handleTextBlur } = useSyncedTextEdit(
    lines,
    onApplyTextEdits,
    true, // isKaraoke
  );

  const selectLine = useLyricsStore((s) => s.selectLine);
  const selectWord = useLyricsStore((s) => s.selectWord);
  const setWordText = useLyricsStore((s) => s.setWordText);

  const t = useTranslations("editor.syncedMode");

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 flex bg-[#f4f5f4] px-3 py-2">
        <EditorSegmentedControl
          className="w-full"
          items={[
            { id: "text", label: t("textEdit") },
            { id: "karaoke", label: t("karaoke") },
          ]}
          onChange={(value) => setMode(value as KaraokeMode)}
          value={mode}
        />
      </div>

      {mode === "text" && (
        <SyncedTextEditor
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
        />
      )}

      {mode === "karaoke" && (
        <ul
          ref={listRef}
          className="m-0 flex min-h-0 flex-1 list-none flex-col gap-3 overflow-y-auto p-3 scroll-smooth"
        >
          {lines.map((line, index) => (
            <KaraokeLyricLineItem
              key={line.id}
              line={line}
              index={index}
              isActive={line.id === activeLineId}
              isSelected={line.id === selectedLineId}
              activeWordId={activeWordId}
              selectedWordId={selectedWordId}
              formatTime={formatTime}
              onSeekLine={onSeekLine}
              onSeekWord={onSeekWord}
              onSelectWord={(lineId, wordId) => {
                selectLine(lineId);
                selectWord(lineId, wordId);
              }}
              onEditWord={setWordText}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
