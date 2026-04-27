import { useMemo } from "react";
import type { EditorState, EditorActions } from "../types";

export function useSourcePanelProps(state: EditorState, actions: EditorActions) {
  return useMemo(() => ({
    activeTab: state.activeTab,
    sourceInput: actions.sourceInput,
    setSourceInput: actions.setSourceInput,
    fetchState: state.fetchState,
    sourceMessage: state.sourceMessage,
    mediaInfo: state.mediaInfo,
    publishState: state.publishState!,
    transcribeState: state.transcribeState,
    formatTime: actions.formatTime,
    onFetch: actions.handleFetch,
    onPublish: actions.handlePublish,
    onTranscribe: actions.handleTranscribe,
  }), [state, actions]);
}
