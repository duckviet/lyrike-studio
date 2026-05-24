"use client";
import type { LyricsState } from "@/entities/lyrics";
import { FileUpIcon, FileDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { EditorButton, EditorSegmentedControl } from "@/features/editor";

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

  const LYRICS_TABS = [
    { id: "synced", label: tabs("synced") },
    { id: "plain", label: tabs("plain") },
    { id: "meta", label: tabs("meta") },
  ] satisfies { id: LyricsTabId; label: string }[];

  return (
    <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 px-4 py-2">
      <EditorSegmentedControl
        items={LYRICS_TABS}
        onChange={onTabChange}
        value={activeTab}
      />

      <div className="flex gap-1.5">
        <EditorButton
          aria-label={t("toolbar.importLrc")}
          icon={<FileUpIcon size={16} />}
          onClick={onImportClick}
          size="icon"
          title={t("toolbar.importLrc")}
          variant="ghost"
        />
        <EditorButton
          aria-label={t("toolbar.exportLrc")}
          icon={<FileDownIcon size={16} />}
          onClick={onExportClick}
          size="icon"
          title={t("toolbar.exportLrc")}
          variant="ghost"
        />
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
