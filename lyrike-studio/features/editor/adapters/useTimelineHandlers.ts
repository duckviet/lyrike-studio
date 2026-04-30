import { useMemo, useRef, useCallback } from "react";
import type { EditorState, EditorActions } from "../types";
import { getAudioUrl } from "@/lib/api";
import { calcExtendLinePatch } from "@/features/playback/model/extendLine";

export function useTimelineHandlers(
  state: EditorState,
  actions: EditorActions,
  onSeekBothTo: (time: number) => void,
  onSeekBothBy: (delta: number) => void,
  onToggleBothPlayback: () => void,
) {
  // ── Keep mutable refs for values used inside stable callbacks ──────────────
  // This lets us create stable function identities without stale closures.
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const syncedLinesRef = useRef(state.lyricsState.doc.syncedLines);
  syncedLinesRef.current = state.lyricsState.doc.syncedLines;

  // ── Stable callbacks

  const onToggleLoop = useCallback(
    () => actionsRef.current.setLoopEnabled((v: boolean) => !v),
    [],
  );

  const onDeleteGap = useCallback(
    (
      gapStart: number,
      gapEnd: number,
      prevLineId: string | null,
      nextLineId: string | null,
    ) => actionsRef.current.deleteGap(gapStart, gapEnd, prevLineId, nextLineId),
    [],
  );

  const onExtendLine = useCallback(
    (lineId: string, edge: "start" | "end", newTime: number) => {
      const patch = calcExtendLinePatch(
        syncedLinesRef.current,
        lineId,
        edge,
        newTime,
      );
      if (patch) {
        actionsRef.current.setLineRangeCommit(lineId, patch.start, patch.end);
      }
    },
    [],
  );

  // ── Derived scalars — keep deps granular so useMemo fires as rarely as possible
  const { canUndo, canRedo, selectedLineId } = state.lyricsState;

  return useMemo(
    () => ({
      activeTab: "timeline" as const,
      mediaInfo: state.mediaInfo,
      lyricsState: state.lyricsState,
      duration: state.duration,
      peaksState: state.peaksState,
      peaksMessage: state.peaksMessage,
      zoomLevel: state.zoomLevel,
      loopEnabled: state.loopEnabled,
      canUndo,
      canRedo,
      hasSelectedLine: Boolean(selectedLineId),
      waveScrollLeft: state.waveScrollLeft,
      wavePxPerSec: state.wavePxPerSec,
      formatTime: actions.formatTime,
      onUndo: actions.undo,
      onRedo: actions.redo,
      onSaveDraft: actions.saveDraft,
      onZoomChange: actions.handleZoomChange,
      onToggleLoop,
      onSelectLine: actions.selectLine,
      onRegionResize: actions.setLineRangeLive,
      onRegionResizeCommit: actions.setLineRangeCommit,
      onGetBaseState: actions.getHistoryState,
      onScroll: actions.handleScroll,
      onSeekBy: onSeekBothBy,
      onSeekTo: onSeekBothTo,
      onTogglePlayback: onToggleBothPlayback,
      onInsertAtGap: actions.insertAtRange,
      onDeleteGap,
      onExtendLine,
      waveformController: actions.waveformController,
      mediaController: actions.mediaController,
      peaksInfo: state.peaksInfo,
      audioUrl: state.mediaInfo?.audioUrl
        ? getAudioUrl(state.mediaInfo.audioUrl)
        : null,
    }),
    [
      // Granular deps — notably state.lyricsState.doc.syncedLines is NOT here;
      // onExtendLine reads it from a ref, so we don't need to rebuild on every
      // lyrics edit.
      state.mediaInfo,
      state.lyricsState, // needed for lyricsState prop + canUndo/canRedo/selectedLineId
      state.duration,
      state.peaksState,
      state.peaksMessage,
      state.zoomLevel,
      state.loopEnabled,
      state.waveScrollLeft,
      state.wavePxPerSec,
      state.peaksInfo,
      canUndo,
      canRedo,
      selectedLineId,
      actions, // memoized in useEditor; only changes when store slices change
      onSeekBothTo,
      onSeekBothBy,
      onToggleBothPlayback,
      onToggleLoop, // stable
      onDeleteGap, // stable
      onExtendLine, // stable
    ],
  );
}
