"use client";
import type { LyricsState } from "@/entities/lyrics";
import { TabBar, TabItem } from "./Tabbar";
import { IconButton } from "./IconButton";
import { FileUpIcon, FileDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type LyricsTabId = LyricsState["tab"];

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
  const t = useTranslations("editor");
  const tabs = useTranslations("editor.tabs");

  const LYRICS_TABS: TabItem<LyricsTabId>[] = [
    { id: "synced", label: tabs("synced") },
    { id: "plain", label: tabs("plain") },
    { id: "meta", label: tabs("meta") },
  ];

  return (
    <div className="h-12 px-4 shrink-0 flex items-center justify-between gap-2 border-b border-line bg-bg-elev">
      <TabBar
        tabs={LYRICS_TABS}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div className="flex gap-1.5">
        <IconButton label={t("importLrc")} onClick={onImportClick}>
          <FileUpIcon size={16} />
        </IconButton>
        <IconButton label={t("exportLrc")} onClick={onExportClick}>
          <FileDownIcon size={16} />
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
