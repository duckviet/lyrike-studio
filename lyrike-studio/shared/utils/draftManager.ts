import type { LyricsDoc } from "@/entities/lyrics/model/LyricsStore";

export type DraftPayload = {
  savedAt: string;
  doc: LyricsDoc;
  selectedLineId: string | null;
};

export type DraftAutosavePayload = Omit<DraftPayload, "savedAt">;

function buildStorageKey(prefix: string, videoId: string): string {
  return `${prefix}:${videoId}`;
}

export function createDraftManager(prefix = "lyrics-studio:draft") {
  return {
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

    load(videoId: string): DraftPayload | null {
      const raw = localStorage.getItem(buildStorageKey(prefix, videoId));
      if (!raw) {
        return null;
      }

      try {
        const parsed = JSON.parse(raw) as Partial<DraftPayload>;
        if (!parsed.doc) {
          return null;
        }

        return {
          savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
          doc: parsed.doc,
          selectedLineId:
            typeof parsed.selectedLineId === "string"
              ? parsed.selectedLineId
              : null,
        };
      } catch {
        return null;
      }
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