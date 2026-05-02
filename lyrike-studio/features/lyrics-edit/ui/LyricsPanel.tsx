"use client";

import { cn } from "@/shared/lib/utils";

import { MetaForm } from "@/features/lyrics-edit/ui/MetaForm";
import type { LyricsState } from "@/entities/lyrics";
import type { LyricLine } from "@/entities/lyrics";
import { useLyricsPanelScroll } from "../model/useLyricsPanelScroll";
import { useLrcFileImport } from "../model/useLrcFileImport";
import { PlainLyricsEditor } from "./PlainLyricsEditor";
import PanelToolbar from "./PanelToolBar";
import SyncedLinesList from "./SyncedLinesList";
import { useEditorUIStore } from "@/features/editor/store/editorUIStore";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { formatTime } from "@/shared/utils/formatters";

export function LyricsPanel({
  onSeekLine,
  onNudge,
  onExportLrc,
}: {
  onSeekLine: (line: LyricLine) => void;
  onNudge: (line: LyricLine, edge: "start" | "end", delta: number) => void;
  onExportLrc: () => void;
}) {
  const activeTab = useEditorUIStore((s) => s.activeTab);
  const doc = useLyricsStore((s) => s.doc);
  const selectedLineId = useLyricsStore((s) => s.selectedLineId);
  const tab = useLyricsStore((s) => s.tab);
  const activeLineId = useLyricsStore((s) => s.activeLineId);
  const isAutoSyncEnabled = useLyricsStore((s) => s.isAutoSyncEnabled);

  const setTab = useLyricsStore((s) => s.setTab);
  const selectLine = useLyricsStore((s) => s.selectLine);
  const clearSelection = useLyricsStore((s) => s.clearSelection);
  const editText = useLyricsStore((s) => s.editText);
  const reorder = useLyricsStore((s) => s.reorder);
  const insertAfter = useLyricsStore((s) => s.insertAfter);
  const splitLine = useLyricsStore((s) => s.splitLine);
  const mergeWithPrevious = useLyricsStore((s) => s.mergeWithPrevious);
  const deleteLine = useLyricsStore((s) => s.deleteLine);
  const setPlainLyrics = useLyricsStore((s) => s.setPlainLyrics);
  const setMeta = useLyricsStore((s) => s.setMeta);
  const importFromLrc = useLyricsStore((s) => s.importFromLrc);
  const applyTextEdits = useLyricsStore((s) => s.applyTextEdits);

  const lyricsState: LyricsState = {
    doc,
    selectedLineId,
    tab,
    activeLineId,
    isAutoSyncEnabled,
    canUndo: false,
    canRedo: false,
  };

  const { listRef } = useLyricsPanelScroll(lyricsState);
  const { fileInputRef, openFilePicker, handleFileChange } =
    useLrcFileImport(importFromLrc);

  const formatTimeStr = (seconds: number) => {
    return formatTime(seconds);
  };

  const handleSelectLine = (lineId: string | null) => {
    if (lineId === null) {
      clearSelection();
    } else {
      selectLine(lineId);
    }
  };

  return (
    <article
      className={cn(
        "min-h-0 h-full flex flex-col",
        "overflow-hidden bg-transparent border-0 shadow-none",
        activeTab !== "lyrics" && "hidden md:flex",
      )}
    >
      <PanelToolbar
        activeTab={lyricsState.tab}
        onTabChange={setTab}
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
          formatTime={formatTimeStr}
          onSeekLine={onSeekLine}
          onSelectLine={handleSelectLine}
          onEditLineText={editText}
          onReorder={reorder}
          onInsertAfter={insertAfter}
          onSplit={splitLine}
          onMerge={mergeWithPrevious}
          onDelete={deleteLine}
          onNudge={onNudge}
          onApplyTextEdits={applyTextEdits}
        />
      )}

      {lyricsState.tab === "plain" && (
        <PlainLyricsEditor
          value={lyricsState.doc.plainLyrics}
          onChange={setPlainLyrics}
        />
      )}

      {lyricsState.tab === "meta" && (
        <MetaForm meta={lyricsState.doc.meta} onUpdateMetaField={setMeta} />
      )}
    </article>
  );
}
