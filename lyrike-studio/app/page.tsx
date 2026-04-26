"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { LyricsProvider } from "@/entities/lyrics/ui/LyricsProvider";
import { useEditor } from "@/features/editor/hooks/useEditor";
import { VideoPlayer } from "@/features/playback/ui/VideoPlayer";
import { getAudioUrl } from "@/lib/api";
import type { LyricLine } from "@/entities/lyrics";
import {
  SourcePanelAdapter,
  LyricsPanelAdapter,
  TimelinePanelAdapter,
} from "@/widgets/editor-layout";

function EditorImpl() {
  const [state, actions] = useEditor();
  const videoRef = useRef<any>(null);

  const {
    activeTab,
    lyricsState,
    mediaInfo,
    peaksInfo,
    isPlaying,
    currentTime,
    duration,
    zoomLevel,
    waveScrollLeft,
    wavePxPerSec,
    loopEnabled,
    fetchState,
    sourceMessage,
    transcribeState,
    peaksState,
    peaksMessage,
    publishState,
    isSidebarCollapsed,
  } = state;

  const {
    sourceInput,
    setSourceInput,
    handleFetch,
    handleTranscribe,
    handlePublish,
    setActiveTab,
    undo,
    redo,
    toggleSidebar,
    saveDraft,
    formatTime,
    mediaController,
    waveformController,
    handleZoomChange,
    handleScroll,
    handleSeekTo,
    handleSeekBy,
    handlePlayPause,
    // Lyrics editing
    editText,
    selectLine,
    reorder,
    insertAfter,
    splitLine,
    mergeWithPrevious,
    deleteLine,
    nudgeLine,
    setPlainLyrics,
    setMeta,
    importFromLrc,
    exportToLrc,
    setLoopEnabled,
    setLineRangeLive,
    setLineRangeCommit,
    getHistoryState,
    setLyricsTab,
  } = actions;

  // Seek / playback helpers that keep YouTube player + audio element in lock-step.
  const seekBothTo = (time: number) => {
    videoRef.current?.seekTo(time);
    handleSeekTo(time); // also seeks the HTMLAudioElement / waveform
  };
  const seekBothBy = (delta: number) => {
    videoRef.current?.seekBy(delta);
    handleSeekBy(delta);
  };
  const toggleBothPlayback = () => {
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
    handlePlayPause(); // mirrors play/pause on the audio element
  };
  const seekToLine = (line: LyricLine) => seekBothTo(line.start);

  return (
    <main className="app-shell">
      <div className="app-body">
        <div className="workspace-top">
          <div
            className="sidebar-wrapper"
            style={{ width: isSidebarCollapsed ? "40px" : "320px" }}
          >
            <aside
              className={`sidebar-content ${isSidebarCollapsed ? "collapsed" : ""}`}
            >
              <SourcePanelAdapter
                activeTab={activeTab as any}
                sourceInput={sourceInput}
                setSourceInput={setSourceInput}
                fetchState={fetchState}
                sourceMessage={sourceMessage}
                mediaInfo={mediaInfo}
                publishState={publishState!}
                transcribeState={transcribeState}
                formatTime={formatTime}
                onFetch={handleFetch}
                onPublish={handlePublish}
                onTranscribe={handleTranscribe}
              />
            </aside>
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              {isSidebarCollapsed ? "→" : "←"}
            </button>
          </div>
          <section className="main-stage">
            <VideoPlayer ref={videoRef} videoId={mediaInfo?.videoId ?? null} />
          </section>
          <aside className="right-panel">
            <LyricsPanelAdapter
              activeTab={activeTab as any}
              lyricsState={lyricsState}
              formatTime={formatTime}
              onSetTab={setLyricsTab}
              onSeekLine={seekToLine}
              onEditLineText={editText}
              onSelectLine={(id) => selectLine(id)}
              onReorder={reorder}
              onInsertAfter={insertAfter}
              onSplit={splitLine}
              onMerge={mergeWithPrevious}
              onDelete={deleteLine}
              onNudge={(line, edge, delta) => nudgeLine(line.id, edge, delta)}
              onSetPlainLyrics={setPlainLyrics}
              onUpdateMetaField={setMeta}
              onImportLrc={importFromLrc}
              onExportLrc={exportToLrc}
            />
          </aside>
        </div>
        <div className="workspace-bottom">
          <TimelinePanelAdapter
            activeTab="timeline"
            mediaInfo={mediaInfo}
            lyricsState={lyricsState}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            peaksState={peaksState}
            peaksMessage={peaksMessage}
            zoomLevel={zoomLevel}
            loopEnabled={loopEnabled}
            canUndo={lyricsState.canUndo}
            canRedo={lyricsState.canRedo}
            hasSelectedLine={Boolean(lyricsState.selectedLineId)}
            waveScrollLeft={waveScrollLeft}
            wavePxPerSec={wavePxPerSec}
            formatTime={formatTime}
            onUndo={undo}
            onRedo={redo}
            onSaveDraft={saveDraft}
            onZoomChange={handleZoomChange}
            onToggleLoop={() => setLoopEnabled((v: boolean) => !v)}
            onSelectLine={(id) => selectLine(id)}
            onRegionResize={(lineId, start, end) => setLineRangeLive(lineId, start, end)}
            onRegionResizeCommit={(lineId, start, end, baseState) => setLineRangeCommit(lineId, start, end, baseState)}
            onGetBaseState={getHistoryState}
            onScroll={handleScroll}
            onSeekBy={seekBothBy}
            onSeekTo={seekBothTo}
            onTogglePlayback={toggleBothPlayback}
            waveformController={waveformController}
            mediaController={mediaController}
            peaksInfo={peaksInfo}
            audioUrl={
              mediaInfo?.audioUrl ? getAudioUrl(mediaInfo.audioUrl) : null
            }
          />
        </div>
      </div>
    </main>
  );
}

const Editor = dynamic(() => Promise.resolve(EditorImpl), { ssr: false });

export default function Home() {
  return (
    <LyricsProvider>
      <Editor />
    </LyricsProvider>
  );
}
