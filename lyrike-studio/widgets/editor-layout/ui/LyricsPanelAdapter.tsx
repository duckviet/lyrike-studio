"use client";

import { LyricsPanel } from "@/features/lyrics-edit/ui/LyricsPanel";
import type { LyricsState, LyricsMeta } from "@/entities/lyrics";
import type { LyricLine } from "@/entities/lyrics";

type TabId = "source" | "timeline" | "lyrics";

interface LyricsPanelAdapterProps {
  activeTab: TabId;
  lyricsState: LyricsState;
  formatTime: (seconds: number) => string;
  onSetTab: (tab: LyricsState["tab"]) => void;
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
  onExportLrc: () => string;
}

export function LyricsPanelAdapter(props: LyricsPanelAdapterProps) {
  return <LyricsPanel {...props} />;
}