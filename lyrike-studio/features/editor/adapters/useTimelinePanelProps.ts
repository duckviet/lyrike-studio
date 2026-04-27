import { useMemo } from "react";
import type { EditorState, EditorActions } from "../types";
import { getAudioUrl } from "@/lib/api";

export function useTimelinePanelProps(
  state: EditorState,
  actions: EditorActions,
  onSeekBothTo: (time: number) => void,
  onSeekBothBy: (delta: number) => void,
  onToggleBothPlayback: () => void
) {
  return useMemo(() => ({
    activeTab: "timeline" as const,
    mediaInfo: state.mediaInfo,
    lyricsState: state.lyricsState,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    peaksState: state.peaksState,
    peaksMessage: state.peaksMessage,
    zoomLevel: state.zoomLevel,
    loopEnabled: state.loopEnabled,
    canUndo: state.lyricsState.canUndo,
    canRedo: state.lyricsState.canRedo,
    hasSelectedLine: Boolean(state.lyricsState.selectedLineId),
    waveScrollLeft: state.waveScrollLeft,
    wavePxPerSec: state.wavePxPerSec,
    formatTime: actions.formatTime,
    onUndo: actions.undo,
    onRedo: actions.redo,
    onSaveDraft: actions.saveDraft,
    onZoomChange: actions.handleZoomChange,
    onToggleLoop: () => actions.setLoopEnabled((v: boolean) => !v),
    onSelectLine: actions.selectLine,
    onRegionResize: actions.setLineRangeLive,
    onRegionResizeCommit: actions.setLineRangeCommit,
    onGetBaseState: actions.getHistoryState,
    onScroll: actions.handleScroll,
    onSeekBy: onSeekBothBy,
    onSeekTo: onSeekBothTo,
    onTogglePlayback: onToggleBothPlayback,
    waveformController: actions.waveformController,
    mediaController: actions.mediaController,
    peaksInfo: state.peaksInfo,
    audioUrl: state.mediaInfo?.audioUrl ? getAudioUrl(state.mediaInfo.audioUrl) : null,
  }), [state, actions, onSeekBothTo, onSeekBothBy, onToggleBothPlayback]);
}
