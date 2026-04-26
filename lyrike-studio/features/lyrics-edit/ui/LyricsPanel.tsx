"use client";

import { useRef, useEffect, useState, memo } from "react";
import { LyricLineItem } from "@/features/lyrics-sync/ui/LyricLineItem";
import type { LyricsState, LyricsMeta } from "@/entities/lyrics";
import type { LyricLine } from "@/entities/lyrics";
import { MetaForm } from "@/features/lyrics-edit/ui/MetaForm";

type TabId = "source" | "timeline" | "lyrics";

interface LyricsPanelProps {
  activeTab: TabId;
  lyricsState: LyricsState;
  formatTime: (seconds: number) => string;
  onSetTab: (tab: LyricsState["tab"]) => void;
  onSeekLine: (line: LyricLine) => void;
  onEditLineText: (lineId: string, text: string) => void;
  onSelectLine: (lineId: string) => void;
  onReorder: (lineId: string, direction: "up" | "down") => void;
  onInsertAfter: (lineId: string) => void;
  onSplit: (lineId: string) => void;
  onMerge: (lineId: string) => void;
  onDelete: (lineId: string) => void;
  onNudge: (line: LyricLine, edge: "start" | "end", delta: number) => void;
  onSetPlainLyrics: (value: string) => void;
  onUpdateMetaField: (key: keyof LyricsMeta, value: string) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [lastScrolledActiveId, setLastScrolledActiveId] = useState<
    string | null
  >(null);
  const [lastScrolledSelectedId, setLastScrolledSelectedId] = useState<
    string | null
  >(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      onImportLrc(text);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const scrollLineIntoView = (lineId: string) => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-id="${lineId}"]`,
    );
    if (!el) return;

    const listRect = listRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset =
      elRect.top - listRect.top - listRect.height / 2 + elRect.height / 2;

    listRef.current.scrollBy({ top: offset, behavior: "smooth" });
  };

  useEffect(() => {
    if (
      lyricsState.tab === "synced" &&
      listRef.current &&
      lyricsState.activeLineId &&
      lyricsState.activeLineId !== lastScrolledActiveId
    ) {
      setLastScrolledActiveId(lyricsState.activeLineId);
      scrollLineIntoView(lyricsState.activeLineId);
    }
  }, [lyricsState.activeLineId, lyricsState.tab]);

  useEffect(() => {
    if (
      lyricsState.tab === "synced" &&
      listRef.current &&
      lyricsState.selectedLineId &&
      lyricsState.selectedLineId !== lastScrolledSelectedId &&
      lyricsState.selectedLineId !== lyricsState.activeLineId
    ) {
      setLastScrolledSelectedId(lyricsState.selectedLineId);
      scrollLineIntoView(lyricsState.selectedLineId);
    }
  }, [lyricsState.selectedLineId, lyricsState.tab]);

  return (
    <article
      className={`lyrics-column ${activeTab !== "lyrics" ? "hidden-mobile" : ""}`}
    >
      <div className="rightbar-head">
        <div
          className="lyrics-tabs"
          role="tablist"
          aria-label="Lyrics editor tabs"
        >
          <button
            type="button"
            className={lyricsState.tab === "synced" ? "active" : ""}
            onClick={() => onSetTab("synced")}
          >
            Synced
          </button>
          <button
            type="button"
            className={lyricsState.tab === "plain" ? "active" : ""}
            onClick={() => onSetTab("plain")}
          >
            Plain
          </button>
          <button
            type="button"
            className={lyricsState.tab === "meta" ? "active" : ""}
            onClick={() => onSetTab("meta")}
          >
            Meta
          </button>
        </div>
        <div className="io-actions">
          <button
            className="icon-btn"
            title="Import LRC"
            onClick={handleImportClick}
          >
            ⬆
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".lrc,.txt"
            onChange={handleFileChange}
            hidden
          />
          <button className="icon-btn" title="Export LRC" onClick={onExportLrc}>
            ⬇
          </button>
        </div>
      </div>

      {lyricsState.tab === "synced" ? (
        <ul className="lyrics-list" ref={listRef}>
          {lyricsState.doc.syncedLines.map((line, index) => (
            <LyricLineItem
              key={line.id}
              line={line}
              index={index}
              isActive={line.id === lyricsState.activeLineId}
              isSelected={line.id === lyricsState.selectedLineId}
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
      ) : lyricsState.tab === "plain" ? (
        <label className="stack-field">
          Plain Lyrics
          <textarea
            className="plain-editor"
            value={lyricsState.doc.plainLyrics}
            onChange={(e) => onSetPlainLyrics(e.target.value)}
          />
        </label>
      ) : (
        <MetaForm meta={lyricsState.doc.meta} onUpdateMetaField={onUpdateMetaField} />
      )}
    </article>
  );
});
