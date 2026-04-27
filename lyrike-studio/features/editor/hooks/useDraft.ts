import { useCallback, useRef } from "react";
import { createDraftManager } from "@/shared/utils/draftManager";
import type { LyricsDoc } from "@/entities/lyrics";

export function useDraft(loadDraft: (doc: LyricsDoc, selectedLineId: string | null) => void) {
  const draftManagerRef = useRef(createDraftManager());

  const saveDraft = useCallback((videoId: string, doc: LyricsDoc, selectedLineId: string | null) => {
    draftManagerRef.current.save(videoId, {
      doc,
      selectedLineId,
    });
  }, []);

  const maybeRestoreDraft = useCallback((videoId: string) => {
    const draft = draftManagerRef.current.load(videoId);
    if (!draft) return false;
    const shouldRestore = confirm(
      "Found a local draft for this video. Do you want to restore it?",
    );
    if (!shouldRestore) return false;
    loadDraft(draft.doc, draft.selectedLineId ?? null);
    return true;
  }, [loadDraft]);

  return { saveDraft, maybeRestoreDraft };
}
