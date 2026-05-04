"use client";

import { useRef, useState, useCallback } from "react";
import { VideoPlayer } from "@/features/playback";
import { SourcePanel } from "@/features/media";
import { LyricsPanel } from "@/features/lyrics-edit/ui/LyricsPanel";
import { TimelinePanel } from "@/features/playback/ui/TimelinePanel";
import { useDraft } from "@/features/playback/model/useDraft";
import { UI } from "@/shared/config/constants";
import type { LyricLine } from "@/entities/lyrics";
import { useEditorUIStore } from "@/features/editor/store/editorUIStore";
import { useEditorMediaStore } from "@/features/editor/store/editorMediaStore";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { editorMediaController } from "@/features/editor/store/editorControllers";
import { usePlaybackSync } from "@/features/lyrics-sync/model/usePlaybackSync";
import { KeyboardShortcutsHelp } from "@/features/editor/ui/KeyboardShortcutsHelp";
import { useEditorKeyboardShortcuts } from "@/features/editor/model/useEditorKeyboardShortcuts";

function downloadLrc(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function StudioPage() {
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const isSidebarCollapsed = useEditorUIStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = () => useEditorUIStore.getState().toggleSidebar();
  const mediaInfo = useEditorMediaStore((s) => s.mediaInfo);
  const syncedLines = useLyricsStore((s) => s.doc.syncedLines);
  const setActiveLine = useLyricsStore((s) => s.setActiveLine);
  const loadDraft = useLyricsStore((s) => s.loadDraft);
  const { saveDraft } = useDraft(loadDraft);

  const { isPlaying, currentTime } = usePlaybackSync({
    syncedLines,
    setActiveLine,
  });

  const videoRef = useRef<{
    play: () => void;
    pause: () => void;
    seekTo: (time: number) => void;
    seekBy: (delta: number) => void;
  } | null>(null);

  // Sync handlers for both VideoPlayer and MediaController
  const handleTogglePlayback = useCallback(() => {
    const isPlaying = !editorMediaController.getMediaElement().paused;
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
    void editorMediaController.toggle();
  }, []);

  const handleSeekTo = useCallback((time: number) => {
    videoRef.current?.seekTo(time);
    editorMediaController.seek(time);
  }, []);

  const handleSeekBy = useCallback((delta: number) => {
    videoRef.current?.seekBy(delta);
    editorMediaController.seekBy(delta);
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (!mediaInfo) return;
    saveDraft(
      mediaInfo.videoId,
      useLyricsStore.getState().doc,
      useLyricsStore.getState().selectedLineId,
    );
  }, [mediaInfo, saveDraft]);

  const handleOpenShortcutsHelp = useCallback(() => {
    setIsShortcutsHelpOpen(true);
  }, []);

  const onSeekLine = (line: LyricLine) => {
    handleSeekTo(line.start);
  };

  const onNudge = (line: LyricLine, edge: "start" | "end", delta: number) => {
    useLyricsStore.getState().nudgeLine(line.id, edge, delta);
  };

  const onExportLrc = () => {
    const lrcContent = useLyricsStore.getState().exportToLrc();
    const doc = useLyricsStore.getState().doc;
    const title = doc.meta.title || "lyrics";
    const artist = doc.meta.artist || "unknown";
    downloadLrc(lrcContent, `${artist} - ${title}.lrc`);
  };

  useEditorKeyboardShortcuts({
    enabled: !isShortcutsHelpOpen,
    currentTime,
    onTogglePlayback: handleTogglePlayback,
    onSeekBy: handleSeekBy,
    onSeekTo: handleSeekTo,
    onSaveDraft: handleSaveDraft,
    onOpenShortcutsHelp: handleOpenShortcutsHelp,
  });

  return (
    <>
      <main className="flex flex-col overflow-hidden h-[calc(100vh-60px)] w-full bg-transparent">
        <div className="flex-1 flex flex-col min-h-0 p-2 gap-2">
          <div
            className="min-h-0 flex-1 grid gap-2"
            style={{
              gridTemplateColumns: `${
                isSidebarCollapsed
                  ? `${UI.SIDEBAR_COLLAPSED_PX}px`
                  : `${UI.SIDEBAR_WIDTH_PX}px`
              } minmax(460px, auto) minmax(0, 1fr)`,
            }}
          >
            <div className="min-w-0 h-full flex flex-row-reverse overflow-hidden border border-line rounded-2xl bg-bg-soft shadow-sm transition-all duration-200">
              <aside
                className={`min-w-0 flex-1 overflow-y-auto opacity-100 transition-opacity duration-150 ${isSidebarCollapsed ? "opacity-0 pointer-events-none" : ""}`}
              >
                <SourcePanel />
              </aside>
              <button
                className="w-9 shrink-0 border-0 border-r border-line bg-bg-elev text-ink-light-soft text-sm cursor-pointer transition-all duration-150 hover:bg-[#2c313c] hover:text-white"
                onClick={toggleSidebar}
              >
                {isSidebarCollapsed ? "→" : "←"}
              </button>
            </div>
            <section className="min-w-[360px] md:min-w-[720px] min-h-0 flex items-center justify-center p-4 border border-line rounded-2xl overflow-hidden bg-linear-to-b from-[#050608] to-black shadow-glass">
              <VideoPlayer
                ref={videoRef}
                videoId={mediaInfo?.videoId ?? null}
              />
            </section>
            <aside className="min-w-0 min-h-0 h-full overflow-hidden border border-line rounded-2xl bg-bg-soft shadow-sm">
              <LyricsPanel
                onSeekLine={onSeekLine}
                onNudge={onNudge}
                onExportLrc={onExportLrc}
              />
            </aside>
          </div>
          <div className="h-[302px] shrink-0 p-0 pb-2.5">
            <TimelinePanel
              isPlaying={isPlaying}
              currentTime={currentTime}
              onSaveDraft={handleSaveDraft}
              onTogglePlayback={handleTogglePlayback}
              onSeekTo={handleSeekTo}
              onSeekBy={handleSeekBy}
              onOpenShortcutsHelp={handleOpenShortcutsHelp}
            />
          </div>
        </div>
      </main>
      <KeyboardShortcutsHelp
        open={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </>
  );
}
