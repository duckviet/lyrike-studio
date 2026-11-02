import { useCallback, useEffect, useRef } from "react";
import {
  createDebouncedDraftAutosave,
  createDraftManager,
} from "@/shared/utils/draftManager";
import type { LyricsDoc } from "@/entities/lyrics";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { useEditorMediaStore } from "@/features/editor/store/editorMediaStore";

export const draftManager = createDraftManager();

export function useDraft(loadDraft: (doc: LyricsDoc, selectedLineId: string | null) => void) {
  const draftManagerRef = useRef(draftManager);

  const saveDraft = useCallback((videoId: string, doc: LyricsDoc, selectedLineId: string | null) => {
    draftManagerRef.current.save(videoId, {
      doc,
      selectedLineId,
    });
  }, []);

  const restoreDraft = useCallback((videoId: string) => {
    const draft = draftManagerRef.current.load(videoId);
    if (!draft) return false;
    loadDraft(draft.doc, draft.selectedLineId ?? null);
    return true;
  }, [loadDraft]);

  return { saveDraft, restoreDraft };
}

/** Autosaves the lyrics doc of the loaded video so it shows up as a project. */
export function useDraftAutosave() {
  useEffect(() => {
    const autosave = createDebouncedDraftAutosave({
      save: (videoId, payload) => draftManager.save(videoId, payload),
    });
    const unsubscribe = useLyricsStore.subscribe(
      (s) => s.doc,
      (doc) => {
        const videoId = useEditorMediaStore.getState().mediaInfo?.videoId;
        if (!videoId) return;
        autosave.schedule(videoId, {
          doc,
          selectedLineId: useLyricsStore.getState().selectedLineId,
        });
      },
    );
    return () => {
      unsubscribe();
      autosave.flushNow();
    };
  }, []);
}
