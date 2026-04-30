export const LYRICS_TAB = {
  SYNCED: "synced",
  PLAIN: "plain",
  META: "meta",
} as const;

export type LyricsTabId = (typeof LYRICS_TAB)[keyof typeof LYRICS_TAB];

export const RESIZE_EDGE = {
  START: "start",
  END: "end",
  MOVE: "move",
} as const;

export type ResizeEdge = (typeof RESIZE_EDGE)[keyof typeof RESIZE_EDGE];