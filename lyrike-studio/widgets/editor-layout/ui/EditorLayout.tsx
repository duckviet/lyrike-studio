"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { EditorButton, EditorPanel } from "@/features/editor";
import { UI } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";

type EditorTabId = "source" | "timeline" | "lyrics";

export interface EditorLayoutProps {
  source: ReactNode;
  preview: ReactNode;
  lyrics: ReactNode;
  timeline: ReactNode;
  activeTab: EditorTabId;
  onTabChange: (tab: EditorTabId) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function EditorLayout({
  source,
  preview,
  lyrics,
  timeline,
  activeTab,
  onTabChange,
  isSidebarCollapsed,
  onToggleSidebar,
}: EditorLayoutProps) {
  const t = useTranslations("editor.layout");
  const tabs: { id: EditorTabId; label: string }[] = [
    { id: "source", label: t("source") },
    { id: "timeline", label: t("timeline") },
    { id: "lyrics", label: t("lyrics") },
  ];

  return (
    <main className="flex h-[calc(100vh-65px)] w-full flex-col overflow-hidden bg-bg px-3 py-3 md:px-6 md:py-5">
      <nav
        aria-label="Editor sections"
        className="mb-3 grid grid-cols-3 gap-1 rounded-outer border border-line bg-bg p-1 md:hidden"
      >
        {tabs.map((tab) => (
          <button
            className={cn(
              "min-h-9 rounded-control text-sm font-semibold transition-colors",
              activeTab === tab.id
                ? "bg-bg-elev text-primary shadow-sm"
                : "text-ink-light-soft",
            )}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div
          className="min-h-0 flex-1 gap-3 md:grid"
          style={{
            gridTemplateColumns: `${
              isSidebarCollapsed
                ? `${UI.SIDEBAR_COLLAPSED_PX}px`
                : `${UI.SIDEBAR_WIDTH_PX}px`
            } minmax(420px, auto) minmax(0, 1fr)`,
          }}
        >
          <EditorPanel
            bodyClassName="flex h-full min-h-0 flex-row-reverse overflow-hidden"
            className={cn("hidden md:block", activeTab === "source" && "block")}
          >
            <aside
              className={cn(
                "min-w-0 flex-1 overflow-hidden transition-opacity duration-150",
                isSidebarCollapsed && "pointer-events-none opacity-0",
              )}
            >
              {source}
            </aside>
            <EditorButton
              aria-label={
                isSidebarCollapsed ? t("expandSource") : t("collapseSource")
              }
              className="h-full w-9 rounded-none border-y-0 border-l-0 border-r border-line hover:bg-bg-elev/30 focus:bg-bg-elev/30"
              icon={
                isSidebarCollapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )
              }
              onClick={onToggleSidebar}
              size="icon"
              variant="ghost"
            />
          </EditorPanel>

          <div
            className={cn(
              "min-w-0 min-h-0",
              activeTab !== "timeline" && "hidden md:block",
            )}
          >
            {preview}
          </div>

          <div
            className={cn(
              "min-w-0 min-h-0",
              activeTab !== "lyrics" && "hidden md:block",
            )}
          >
            {lyrics}
          </div>
        </div>

        <div
          className={cn(
            "h-[302px] shrink-0",
            activeTab !== "timeline" && "hidden md:block",
          )}
        >
          {timeline}
        </div>
      </div>
    </main>
  );
}
