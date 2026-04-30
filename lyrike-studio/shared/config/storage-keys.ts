const PREFIX = "lyrics-studio";

export const STORAGE_KEYS = {
  DRAFT: (videoId: string) => `${PREFIX}:draft:${videoId}`,
  USER_PREFS: `${PREFIX}:user-prefs`,
  LAST_VIDEO_ID: `${PREFIX}:last-video-id`,
  THEME: `${PREFIX}:theme`,
  ZOOM_LEVEL: `${PREFIX}:zoom-level`,
} as const;

export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};