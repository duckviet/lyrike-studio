import { LOCAL_API_BASE } from "./config";

export type FetchMediaRequest = {
  url?: string;
  videoId?: string;
};

export type FetchMediaResponse = {
  videoId: string;
  trackName: string;
  artistName: string;
  duration: number;
  audioReady: boolean;
  audioUrl: string | null;
  cachedAt?: string;
  sourceUrl?: string;
};

export type TranscribeResponse = {
  videoId: string;
  status: "queued" | "running" | "completed" | "failed";
  message?: string;
  error?: string;
  synced?: string;
  plain?: string;
  updatedAt?: string;
  job?: {
    status: string;
    startedAt?: string;
    updatedAt?: string;
    error?: string;
  };
};

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function optionalString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function parseTranscribeStatus(
  status: unknown,
): TranscribeResponse["status"] {
  if (
    status === "queued" ||
    status === "running" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status;
  }

  throw new Error("Invalid transcription response status");
}

function parseTranscribeJob(value: unknown): TranscribeResponse["job"] {
  if (!isJsonRecord(value)) {
    return undefined;
  }

  const status = optionalString(value, "status");
  if (!status) {
    return undefined;
  }

  return {
    status,
    startedAt: optionalString(value, "startedAt"),
    updatedAt: optionalString(value, "updatedAt"),
    error: optionalString(value, "error"),
  };
}

export function normalizeTranscribeResponse(
  payload: unknown,
): TranscribeResponse {
  if (!isJsonRecord(payload)) {
    throw new Error("Invalid transcription response payload");
  }

  return {
    videoId: optionalString(payload, "videoId") ?? "",
    status: parseTranscribeStatus(payload.status),
    message: optionalString(payload, "message"),
    error: optionalString(payload, "error"),
    synced:
      optionalString(payload, "synced") ??
      optionalString(payload, "syncedLyrics"),
    plain:
      optionalString(payload, "plain") ?? optionalString(payload, "plainLyrics"),
    updatedAt: optionalString(payload, "updatedAt"),
    job: parseTranscribeJob(payload.job),
  };
}

export type PeaksResponse = {
  videoId: string;
  samples: number;
  duration: number;
  peaks: number[];
  sourceFile: string;
  generatedAt: string;
  cacheHit: boolean;
};

export type PublishChallengeResponse = {
  prefix: string;
  target: string;
};

export type PublishLyricsPayload = {
  trackName: string;
  artistName: string;
  albumName?: string;
  duration: number;
  plainLyrics: string;
  syncedLyrics: string;
};

export type PublishResponse = {
  status: number;
  body: string;
};

function buildUrl(path: string): string {
  return `${LOCAL_API_BASE}${path}`;
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail =
      typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof (payload as { detail?: unknown }).detail === "string"
        ? (payload as { detail: string }).detail
        : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload;
}

export async function fetchMedia(
  body: FetchMediaRequest,
): Promise<FetchMediaResponse> {
  const response = await fetch(buildUrl("/local-api/fetch"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return (await parseJsonOrThrow(response)) as FetchMediaResponse;
}

export type TranscribeMode = "normal" | "karaoke";

export async function requestTranscription(
  videoId: string,
  mode: TranscribeMode = "normal",
): Promise<TranscribeResponse> {
  const response = await fetch(buildUrl("/local-api/transcribe"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoId, mode }),
  });

  return normalizeTranscribeResponse(await parseJsonOrThrow(response));
}

export function streamTranscription(
  videoId: string,
  _mode?: TranscribeMode,
): EventSource {
  const encodedVideoId = encodeURIComponent(videoId);
  return new EventSource(buildUrl(`/local-api/transcribe/stream/${encodedVideoId}`));
}

export async function fetchPeaks(
  videoId: string,
  samples = 2000,
  source = "original"
): Promise<PeaksResponse> {
  const encodedVideoId = encodeURIComponent(videoId);
  const response = await fetch(
    buildUrl(`/local-api/peaks/${encodedVideoId}?samples=${samples}&source=${source}`),
    {
      method: "GET",
    },
  );

  return (await parseJsonOrThrow(response)) as PeaksResponse;
}

export async function requestPublishChallenge(): Promise<PublishChallengeResponse> {
  const response = await fetch(buildUrl("/api/request-challenge"), {
    method: "POST",
  });

  return (await parseJsonOrThrow(response)) as PublishChallengeResponse;
}

export async function publishLyrics(params: {
  payload: PublishLyricsPayload;
  publishToken: string;
}): Promise<PublishResponse> {
  const response = await fetch(buildUrl("/api/publish"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Publish-Token": params.publishToken,
    },
    body: JSON.stringify(params.payload),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Publish failed (${response.status}): ${body}`);
  }

  return {
    status: response.status,
    body,
  };
}

export function getAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    return audioUrl;
  }
  return buildUrl(audioUrl);
}
