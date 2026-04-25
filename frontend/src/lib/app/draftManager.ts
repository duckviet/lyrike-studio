import type { LyricsDoc } from "../LyricsStore";

export type DraftPayload = {
  savedAt: string;
  doc: LyricsDoc;
  selectedLineId: string | null;
};

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
