"use client";

import { MetaForm } from "@/features/lyrics-edit/ui/MetaForm";
import type { LyricsState } from "@/entities/lyrics";
import type { LyricLine } from "@/entities/lyrics";
import { useLyricsPanelScroll } from "../model/useLyricsPanelScroll";
import { useLrcFileImport } from "../model/useLrcFileImport";
import { PlainLyricsEditor } from "./PlainLyricsEditor";
import PanelToolbar from "./PanelToolBar";
import SyncedLinesList from "./SyncedLinesList";
import KaraokeLinesList from "./KaraokeLinesList";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { formatTime } from "@/shared/utils/formatters";

export function LyricsPanel({
  onSeekLine,
  onSeekWord,
  onExportLrc,
}: {
  onSeekLine: (line: LyricLine) => void;
  onSeekWord: (word: { start: number }) => void;
  onExportLrc: () => void;
}) {
  const doc = useLyricsStore((s) => s.doc);
  const selectedLineId = useLyricsStore((s) => s.selectedLineId);
  const tab = useLyricsStore((s) => s.tab);
  const activeLineId = useLyricsStore((s) => s.activeLineId);
  const isAutoSyncEnabled = useLyricsStore((s) => s.isAutoSyncEnabled);

  const setTab = useLyricsStore((s) => s.setTab);
  const setPlainLyrics = useLyricsStore((s) => s.setPlainLyrics);
  const setMeta = useLyricsStore((s) => s.setMeta);
  const importFromLrc = useLyricsStore((s) => s.importFromLrc);
  const applyTextEdits = useLyricsStore((s) => s.applyTextEdits);
  const selectedWordId = useLyricsStore((s) => s.selectedWordId);
  const activeWordId = useLyricsStore((s) => s.activeWordId);

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

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-outer bg-[#f4f5f4]">
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
          onApplyTextEdits={applyTextEdits}
        />
      )}

      {lyricsState.tab === "karaoke" && (
        <KaraokeLinesList
          lines={lyricsState.doc.syncedLines}
          activeLineId={lyricsState.activeLineId}
          selectedLineId={lyricsState.selectedLineId}
          activeWordId={activeWordId}
          selectedWordId={selectedWordId}
          listRef={listRef}
          formatTime={formatTimeStr}
          onSeekLine={onSeekLine}
          onSeekWord={onSeekWord}
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
