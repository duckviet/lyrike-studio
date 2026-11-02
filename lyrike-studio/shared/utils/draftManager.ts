import type { LyricsDoc } from "@/entities/lyrics";
import { normalizeWordsWithinLine } from "@/entities/lyrics/model/wordTiming";

export type DraftPayload = {
  savedAt: string;
  doc: LyricsDoc;
  selectedLineId: string | null;
};

export type DraftSummary = {
  videoId: string;
  title: string;
  artist: string;
  lineCount: number;
  savedAt: string;
};

export type DraftAutosavePayload = Omit<DraftPayload, "savedAt">;

function buildStorageKey(prefix: string, videoId: string): string {
  return `${prefix}:${videoId}`;
}

export function createDraftManager(prefix = "lyrics-studio:draft") {
  const load = (videoId: string): DraftPayload | null => {
    const raw = localStorage.getItem(buildStorageKey(prefix, videoId));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<DraftPayload>;
      if (!parsed.doc || !Array.isArray(parsed.doc.syncedLines)) {
        return null;
      }

      const normalizedDoc: LyricsDoc = {
        ...parsed.doc,
        syncedLines: parsed.doc.syncedLines.map((line) =>
          normalizeWordsWithinLine(line),
        ),
      };

      return {
        savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
        doc: normalizedDoc,
        selectedLineId:
          typeof parsed.selectedLineId === "string"
            ? parsed.selectedLineId
            : null,
      };
    } catch {
      return null;
    }
  };

  return {
    load,

    list(): DraftSummary[] {
      const keyPrefix = `${prefix}:`;
      const summaries: DraftSummary[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(keyPrefix)) continue;
        const videoId = key.slice(keyPrefix.length);
        const draft = load(videoId);
        if (!draft) continue;
        summaries.push({
          videoId,
          title: draft.doc.meta?.title ?? "",
          artist: draft.doc.meta?.artist ?? "",
          lineCount: draft.doc.syncedLines.length,
          savedAt: draft.savedAt,
        });
      }
      return summaries.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    },

    remove(videoId: string): void {
      localStorage.removeItem(buildStorageKey(prefix, videoId));
    },

    save(videoId: string, payload: Omit<DraftPayload, "savedAt">): void {
      const nextPayload: DraftPayload = {
        ...payload,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        buildStorageKey(prefix, videoId),
        JSON.stringify(nextPayload),
      );
    },
  };
}

export function createDebouncedDraftAutosave(params: {
  save: (videoId: string, payload: DraftAutosavePayload) => void;
  delayMs?: number;
}) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingVideoId: string | null = null;
  let pendingPayload: DraftAutosavePayload | null = null;

  const delayMs = params.delayMs ?? 900;

  function clearTimer(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function flush(): void {
    if (!pendingVideoId || !pendingPayload) {
      return;
    }

    params.save(pendingVideoId, pendingPayload);
    pendingVideoId = null;
    pendingPayload = null;
  }

  return {
    schedule(videoId: string, payload: DraftAutosavePayload): void {
      pendingVideoId = videoId;
      pendingPayload = payload;
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        flush();
      }, delayMs);
    },

    flushNow(): void {
      clearTimer();
      flush();
    },

    cancel(): void {
      clearTimer();
      pendingVideoId = null;
      pendingPayload = null;
    },
  };
}