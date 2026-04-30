"use client";

import { memo } from "react";
import { cn } from "@/shared/lib/utils";

import { MetaForm } from "@/features/lyrics-edit/ui/MetaForm";
import type { LyricsState, LyricsMeta } from "@/entities/lyrics";
import type { LyricLine } from "@/entities/lyrics";
import { useLyricsPanelScroll } from "../model/useLyricsPanelScroll";
import { useLrcFileImport } from "../model/useLrcFileImport";
import { PlainLyricsEditor } from "./PlainLyricsEditor";
import PanelToolbar from "./PanelToolBar";
import SyncedLinesList from "./SyncedLinesList";

type LyricsTabId = LyricsState["tab"];

export interface LyricsPanelProps {
  activeTab: "source" | "timeline" | "lyrics";
  lyricsState: LyricsState;
  formatTime: (seconds: number) => string;
  onSetTab: (tab: LyricsTabId) => void;
  onSeekLine: (line: LyricLine) => void;
  onEditLineText: (lineId: string, text: string) => void;
  onSelectLine: (lineId: string | null) => void;
  onReorder: (lineId: string, direction: "up" | "down") => void;
  onInsertAfter: (lineId: string) => void;
  onSplit: (lineId: string) => void;
  onMerge: (lineId: string) => void;
  onDelete: (lineId: string) => void;
  onNudge: (line: LyricLine, edge: "start" | "end", delta: number) => void;
  onSetPlainLyrics: (value: string) => void;
  onUpdateMetaField: (update: Partial<LyricsMeta>) => void;
  onImportLrc: (rawLrc: string) => void;
  onExportLrc: () => void;
}

export const LyricsPanel = memo(function LyricsPanel({
  activeTab,
  lyricsState,
  formatTime,
  onSetTab,
  onSeekLine,
  onEditLineText,
  onSelectLine,
  onReorder,
  onInsertAfter,
  onSplit,
  onMerge,
  onDelete,
  onNudge,
  onSetPlainLyrics,
  onUpdateMetaField,
  onImportLrc,
  onExportLrc,
}: LyricsPanelProps) {
  const { listRef } = useLyricsPanelScroll(lyricsState);
  const { fileInputRef, openFilePicker, handleFileChange } =
    useLrcFileImport(onImportLrc);

  return (
    <article
      className={cn(
        "min-h-0 h-full flex flex-col gap-3",
        "overflow-hidden bg-transparent border-0 shadow-none",
        activeTab !== "lyrics" && "hidden md:flex",
      )}
    >
      <PanelToolbar
        activeTab={lyricsState.tab}
        onTabChange={onSetTab}
        onImportClick={openFilePicker}
        onExportClick={onExportLrc}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
      />

      {lyricsState.tab === "synced" && (
        <SyncedLinesList
          lines={lyricsState.doc.syncedLines}
          activeLineId={lyricsState.activeLineId}
          selectedLineId={lyricsState.selectedLineId}
          listRef={listRef}
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
      )}

      {lyricsState.tab === "plain" && (
        <PlainLyricsEditor
          value={lyricsState.doc.plainLyrics}
          onChange={onSetPlainLyrics}
        />
      )}

      {lyricsState.tab === "meta" && (
        <MetaForm
          meta={lyricsState.doc.meta}
          onUpdateMetaField={onUpdateMetaField}
        />
      )}
    </article>
  );
});
