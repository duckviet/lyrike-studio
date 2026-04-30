"use client";

import { useRef, useCallback } from "react";
import { useEditor } from "@/features/editor/hooks/useEditor";
import { VideoPlayer } from "@/features/playback/ui/VideoPlayer";
import { SourcePanel } from "@/features/media-source/ui/SourcePanel";
import { LyricsPanel } from "@/features/lyrics-edit/ui/LyricsPanel";
import { TimelinePanel } from "@/features/playback/ui/TimelinePanel";
import { UI } from "@/shared/config/constants";
import type { LyricLine } from "@/entities/lyrics";
import { useTimelineHandlers } from "@/features/editor";

export default function StudioPage() {
  const [state, actions] = useEditor();
  const videoRef = useRef<{
    play: () => void;
    pause: () => void;
    seekTo: (time: number) => void;
    seekBy: (delta: number) => void;
  } | null>(null);

  const seekBothTo = useCallback(
    (time: number) => {
      videoRef.current?.seekTo(time);
      actions.handleSeekTo(time);
    },
    [actions],
  );

  const seekBothBy = useCallback(
    (delta: number) => {
      videoRef.current?.seekBy(delta);
      actions.handleSeekBy(delta);
    },
    [actions],
  );

  const toggleBothPlayback = useCallback(() => {
    if (state.isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
    actions.handlePlayPause();
  }, [state.isPlaying, actions]);

  const handleSeekLine = useCallback(
    (line: LyricLine) => seekBothTo(line.start),
    [seekBothTo],
  );

  const handleNudge = useCallback(
    (line: LyricLine, edge: "start" | "end", delta: number) =>
      actions.nudgeLine(line.id, edge, delta),
    [actions],
  );

  const timelineHandlers = useTimelineHandlers(
    state,
    actions,
    seekBothTo,
    seekBothBy,
    toggleBothPlayback,
  );

  return (
    <main className="flex flex-col overflow-hidden h-[calc(100vh-60px)] w-full bg-transparent">
      <div className="flex-1 flex flex-col min-h-0 p-2 gap-2">
        <div
          className="min-h-0 flex-1 grid gap-2 "
          style={{
            gridTemplateColumns: `auto minmax(460px, 1fr) ${UI.SIDEBAR_WIDTH_PX}px`,
          }}
        >
          <div
            className="w-80 min-w-10 h-full flex flex-row-reverse overflow-hidden border border-line rounded-2xl bg-bg-soft shadow-sm transition-all duration-200"
            style={{
              width: state.isSidebarCollapsed
                ? `${UI.SIDEBAR_COLLAPSED_PX}px`
                : `${UI.SIDEBAR_WIDTH_PX}px`,
            }}
          >
            <aside
              className={`min-w-0 flex-1 overflow-y-auto opacity-100 transition-opacity duration-150 ${state.isSidebarCollapsed ? "opacity-0 pointer-events-none" : ""}`}
            >
              <SourcePanel
                activeTab={state.activeTab}
                sourceInput={actions.sourceInput}
                setSourceInput={actions.setSourceInput}
                fetchState={state.fetchState}
                sourceMessage={state.sourceMessage}
                mediaInfo={state.mediaInfo}
                publishState={state.publishState}
                transcribeState={state.transcribeState}
                formatTime={actions.formatTime}
                onFetch={actions.handleFetch}
                onPublish={actions.handlePublish}
                onTranscribe={actions.handleTranscribe}
              />
            </aside>
            <button
              className="w-9 shrink-0 border-0 border-r border-line bg-bg-elev text-ink-light-soft text-sm cursor-pointer transition-all duration-150 hover:bg-[#2c313c] hover:text-primary"
              onClick={actions.toggleSidebar}
            >
              {state.isSidebarCollapsed ? "→" : "←"}
            </button>
          </div>
          <section className="min-w-0 min-h-0 flex items-center justify-center p-4 border border-line rounded-2xl overflow-hidden bg-linear-to-b from-[#050608] to-black shadow-glass">
            <VideoPlayer
              ref={videoRef}
              videoId={state.mediaInfo?.videoId ?? null}
            />
          </section>
          <aside className="min-w-0 min-h-0 h-full overflow-hidden border border-line rounded-2xl bg-bg-soft shadow-sm">
            <LyricsPanel
              activeTab={state.activeTab}
              lyricsState={state.lyricsState}
              formatTime={actions.formatTime}
              onSetTab={actions.setLyricsTab}
              onSeekLine={handleSeekLine}
              onEditLineText={actions.editText}
              onSelectLine={actions.selectLine}
              onReorder={actions.reorder}
              onInsertAfter={actions.insertAfter}
              onSplit={actions.splitLine}
              onMerge={actions.mergeWithPrevious}
              onDelete={actions.deleteLine}
              onNudge={handleNudge}
              onSetPlainLyrics={actions.setPlainLyrics}
              onUpdateMetaField={actions.setMeta}
              onImportLrc={actions.importFromLrc}
              onExportLrc={actions.exportToLrc}
            />
          </aside>
        </div>
        <div className="h-[302px] shrink-0 p-0 pb-2.5">
          <TimelinePanel
            {...timelineHandlers}
            currentTime={state.currentTime}
            isPlaying={state.isPlaying}
          />
        </div>
      </div>
    </main>
  );
}
