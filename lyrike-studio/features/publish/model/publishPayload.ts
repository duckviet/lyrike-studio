import type { LyricsState } from "@/entities/lyrics";
import { FetchMediaResponse, PublishLyricsPayload } from "@/lib/api";
import { lyricsModelToLrc, serializeLrc } from "@/lib/lrc";
import { fillInstrumentalGaps, type FillGapsOptions } from "./fillInstrumentalGaps";

const SYNCED_TIMESTAMP_REGEX = /\[\d{2}:\d{2}(?:\.\d{2,3})?\]/;

function getFallbackDuration(lyricsState: LyricsState): number {
  const maxEnd = lyricsState.doc.syncedLines.reduce(
    (acc, line) => Math.max(acc, line.end),
    0,
  );
  return Math.max(0, Math.round(maxEnd));
}

function buildPlainLyrics(lyricsState: LyricsState): string {
  const fromDoc = lyricsState.doc.plainLyrics.trim();
  if (fromDoc) {
    return fromDoc;
  }

  return lyricsState.doc.syncedLines
    .map((line) => line.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function assertValidPayload(payload: PublishLyricsPayload): void {
  if (!payload.trackName) {
    throw new Error("Missing Track Name.");
  }
  if (!payload.artistName) {
    throw new Error("Missing Artist Name.");
  }

  if (!Number.isFinite(payload.duration) || payload.duration <= 0) {
    throw new Error("Invalid Duration in seconds.");
  }
  if (!payload.plainLyrics && !payload.syncedLyrics) {
    throw new Error("You must provide either Plain Lyrics or Synced Lyrics.");
  }
  if (
    payload.syncedLyrics &&
    !SYNCED_TIMESTAMP_REGEX.test(payload.syncedLyrics)
  ) {
    throw new Error(
      "Synced Lyrics must contain at least one timestamp like [00:12.34].",
    );
  }
}

export interface PublishReadiness {
  readonly track: boolean;
  readonly artist: boolean;
  readonly duration: boolean;
  readonly lyrics: boolean;
  readonly ready: boolean;
}

/** Mirrors the validation in buildPublishPayload without throwing. */
export function getPublishReadiness(
  lyricsState: LyricsState,
  mediaInfo: FetchMediaResponse | null,
): PublishReadiness {
  const { meta, syncedLines, plainLyrics } = lyricsState.doc;
  const track = Boolean((meta.title || mediaInfo?.trackName || "").trim());
  const artist = Boolean((meta.artist || mediaInfo?.artistName || "").trim());
  const duration =
    Math.max(
      Math.round(mediaInfo?.duration ?? 0),
      getFallbackDuration(lyricsState),
    ) > 0;
  const lyrics = syncedLines.length > 0 || plainLyrics.trim().length > 0;
  return {
    track,
    artist,
    duration,
    lyrics,
    ready: track && artist && duration && lyrics,
  };
}

export function buildPublishPayload(params: {
  lyricsState: LyricsState;
  mediaInfo: FetchMediaResponse | null;
  exportLrc: () => string;
  /** When set, long silences between lines get a ♪ marker line. */
  fillGaps?: FillGapsOptions | null;
}): PublishLyricsPayload {
  const trackName = (
    params.lyricsState.doc.meta.title ||
    params.mediaInfo?.trackName ||
    ""
  ).trim();
  const artistName = (
    params.lyricsState.doc.meta.artist ||
    params.mediaInfo?.artistName ||
    ""
  ).trim();
  const albumName = params.lyricsState.doc.meta.album.trim();

  const { doc } = params.lyricsState;
  const syncedLyrics = (
    params.fillGaps
      ? serializeLrc(
          lyricsModelToLrc({
            meta: doc.meta,
            lines: fillInstrumentalGaps(doc.syncedLines, params.fillGaps),
            plainLyrics: doc.plainLyrics,
          }),
        )
      : params.exportLrc()
  ).trim();
  const plainLyrics = buildPlainLyrics(params.lyricsState);

  const duration = Math.max(
    Math.round(params.mediaInfo?.duration ?? 0),
    getFallbackDuration(params.lyricsState),
  );

  const payload: PublishLyricsPayload = {
    trackName,
    artistName,
    albumName,
    duration,
    plainLyrics,
    syncedLyrics,
  };

  assertValidPayload(payload);
  return payload;
}
