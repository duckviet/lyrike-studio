import { useMemo } from "react";
import type { EditorState, EditorActions } from "../types";
import type { LyricLine } from "@/entities/lyrics";

export function useLyricsPanelProps(state: EditorState, actions: EditorActions, onSeekBothTo: (time: number) => void) {
  return useMemo(() => ({
    activeTab: state.activeTab,
    lyricsState: state.lyricsState,
    formatTime: actions.formatTime,
    onSetTab: actions.setLyricsTab,
    onSeekLine: (line: LyricLine) => onSeekBothTo(line.start),
    onEditLineText: actions.editText,
    onSelectLine: actions.selectLine,
    onReorder: actions.reorder,
    onInsertAfter: actions.insertAfter,
    onSplit: actions.splitLine,
    onMerge: actions.mergeWithPrevious,
    onDelete: actions.deleteLine,
    onNudge: (line: LyricLine, edge: "start" | "end", delta: number) => actions.nudgeLine(line.id, edge, delta),
    onSetPlainLyrics: actions.setPlainLyrics,
    onUpdateMetaField: actions.setMeta,
    onImportLrc: actions.importFromLrc,
    onExportLrc: actions.exportToLrc,
  }), [state, actions, onSeekBothTo]);
}
