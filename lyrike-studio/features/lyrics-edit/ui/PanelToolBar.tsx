"use client";
import type { LyricsState } from "@/entities/lyrics";
import { TabBar, TabItem } from "./Tabbar";
import { IconButton } from "./IconButton";
type LyricsTabId = LyricsState["tab"];

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

export default function PanelToolbar({
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
