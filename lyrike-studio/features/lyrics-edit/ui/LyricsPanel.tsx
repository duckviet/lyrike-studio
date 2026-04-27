"use client";

import { memo } from "react";
import { cn } from "@/shared/lib/utils";

import { LyricLineItem } from "@/features/lyrics-sync/ui/LyricLineItem";
import { MetaForm } from "@/features/lyrics-edit/ui/MetaForm";
import type { LyricsState, LyricsMeta } from "@/entities/lyrics";
import type { LyricLine } from "@/entities/lyrics";
import { TabBar, TabItem } from "./Tabbar";
import { IconButton } from "./IconButton";
import { useLyricsPanelScroll } from "../model/useLyricsPanelScroll";
import { useLrcFileImport } from "../model/useLrcFileImport";
import { PlainLyricsEditor } from "./PlainLyricsEditor";

type LyricsTabId = LyricsState["tab"];

interface LyricsPanelProps {
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

const LYRICS_TABS: TabItem<LyricsTabId>[] = [
  { id: "synced", label: "Synced" },
  { id: "plain", label: "Plain" },
  { id: "meta", label: "Meta" },
];

interface PanelToolbarProps {
  activeTab: LyricsTabId;
  onTabChange: (tab: LyricsTabId) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function PanelToolbar({
  activeTab,
  onTabChange,
  onImportClick,
  onExportClick,
  fileInputRef,
  onFileChange,
}: PanelToolbarProps) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-2 border-b border-line p-2">
      <TabBar
        tabs={LYRICS_TABS}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div className="flex gap-1.5">
        <IconButton label="Import LRC" onClick={onImportClick}>
          ⬆
        </IconButton>
        <IconButton label="Export LRC" onClick={onExportClick}>
          ⬇
        </IconButton>
        {/* Hidden file input — triggered by Import button above */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".lrc,.txt"
          onChange={onFileChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

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

function SyncedLinesList({
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
