"use client";

import { useRef, useState, useCallback } from "react";
import { VideoPlayer } from "@/features/playback";
import { SourcePanel } from "@/features/media";
import { LyricsPanel } from "@/features/lyrics-edit/ui/LyricsPanel";
import { TimelinePanel } from "@/features/playback/ui/TimelinePanel";
import { useDraft } from "@/features/playback/model/useDraft";
import type { LyricLine } from "@/entities/lyrics";
import { useEditorUIStore } from "@/features/editor/store/editorUIStore";
import { useEditorMediaStore } from "@/features/editor/store/editorMediaStore";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { editorMediaController } from "@/features/editor/store/editorControllers";
import { usePlaybackSync } from "@/features/lyrics-sync/model/usePlaybackSync";
import { KeyboardShortcutsHelp } from "@/features/editor/ui/KeyboardShortcutsHelp";
import { useEditorKeyboardShortcuts } from "@/features/editor/model/useEditorKeyboardShortcuts";
import { EditorPanel } from "@/features/editor";
import { EditorLayout } from "@/widgets/editor-layout";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("editor.video");
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const activeTab = useEditorUIStore((s) => s.activeTab);
  const setActiveTab = useEditorUIStore((s) => s.setActiveTab);
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
      <EditorLayout
        activeTab={activeTab}
        isSidebarCollapsed={isSidebarCollapsed}
        lyrics={
          <LyricsPanel
            onSeekLine={onSeekLine}
            onNudge={onNudge}
            onExportLrc={onExportLrc}
          />
        }
        onTabChange={setActiveTab}
        onToggleSidebar={toggleSidebar}
        preview={
          <EditorPanel
            bodyClassName="flex min-h-0 flex-1 items-center justify-center bg-transparent p-5"
            className="flex h-full min-w-[360px] flex-col md:min-w-[720px]"
            title={t("title")}
          >
            <VideoPlayer ref={videoRef} videoId={mediaInfo?.videoId ?? null} />
          </EditorPanel>
        }
        source={<SourcePanel />}
        timeline={
          <TimelinePanel
            isPlaying={isPlaying}
            currentTime={currentTime}
            onSaveDraft={handleSaveDraft}
            onTogglePlayback={handleTogglePlayback}
            onSeekTo={handleSeekTo}
            onSeekBy={handleSeekBy}
            onOpenShortcutsHelp={handleOpenShortcutsHelp}
          />
        }
      />
      <KeyboardShortcutsHelp
        open={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </>
  );
}
