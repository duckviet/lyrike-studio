import {
  isTranscribeActive,
  useEditorMediaStore,
} from "@/features/editor/store/editorMediaStore";

export type EditorBusyReason = "fetching" | "transcribing" | "publishing" | null;

/** Single source of truth for "a long task is running, lock editing". */
export function useEditorBusy(): {
  isBusy: boolean;
  reason: EditorBusyReason;
} {
  const fetchState = useEditorMediaStore((s) => s.fetchState);
  const transcribeState = useEditorMediaStore((s) => s.transcribeState);
  const publishStatus = useEditorMediaStore((s) => s.publishState?.status);

  const reason: EditorBusyReason =
    fetchState === "loading"
      ? "fetching"
      : isTranscribeActive(transcribeState)
        ? "transcribing"
        : publishStatus === "running"
          ? "publishing"
          : null;

  return { isBusy: reason !== null, reason };
}
