export {
  useLyricsStore,
  type LyricsStore,
  type LyricsHistoryState,
} from "./store/lyricsStore";
export {
  type LyricsState,
  type LyricsDoc,
  type LyricsMeta,
} from "./model/types";
export { type LyricsTabId } from "./config/enums";
export { type LyricLine, type LyricWord } from "./model/types";
export { findActiveLyricIndex, findActiveWord } from "./model/lyricsTimeline";
