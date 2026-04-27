"use client";

import { useRef, useCallback } from "react";
import { useEditor } from "@/features/editor/hooks/useEditor";
import { VideoPlayer } from "@/features/playback/ui/VideoPlayer";
import {
  SourcePanelAdapter,
  LyricsPanelAdapter,
  TimelinePanelAdapter,
} from "@/widgets/editor-layout";
import { useSourcePanelProps } from "@/features/editor/adapters/useSourcePanelProps";
import { useLyricsPanelProps } from "@/features/editor/adapters/useLyricsPanelProps";
import { useTimelinePanelProps } from "@/features/editor/adapters/useTimelinePanelProps";

export default function StudioPage() {
  const [state, actions] = useEditor();
  const videoRef = useRef<any>(null);

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

  const sourcePanelProps = useSourcePanelProps(state, actions);
  const lyricsPanelProps = useLyricsPanelProps(state, actions, seekBothTo);
  const timelinePanelProps = useTimelinePanelProps(
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
          style={{ gridTemplateColumns: "auto minmax(460px, 1fr) 400px" }}
        >
          <div
            className="w-80 min-w-10 h-full flex flex-row-reverse overflow-hidden border border-line rounded-2xl bg-bg-soft shadow-sm transition-all duration-200"
            style={{ width: state.isSidebarCollapsed ? "40px" : "320px" }}
          >
            <aside
              className={`min-w-0 flex-1 overflow-y-auto opacity-100 transition-opacity duration-150 ${state.isSidebarCollapsed ? "opacity-0 pointer-events-none" : ""}`}
            >
              <SourcePanelAdapter {...sourcePanelProps} />
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
            <LyricsPanelAdapter {...lyricsPanelProps} />
          </aside>
        </div>
        <div className="h-[302px] shrink-0 p-0 pb-2.5">
          <TimelinePanelAdapter {...timelinePanelProps} />
        </div>
      </div>
    </main>
  );
}
