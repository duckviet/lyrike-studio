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
  albumName: string;
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

export async function requestTranscription(
  videoId: string,
): Promise<TranscribeResponse> {
  const response = await fetch(buildUrl("/local-api/transcribe"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoId }),
  });

  return (await parseJsonOrThrow(response)) as TranscribeResponse;
}

export function streamTranscription(videoId: string): EventSource {
  const encodedVideoId = encodeURIComponent(videoId);
  return new EventSource(buildUrl(`/local-api/transcribe/stream/${encodedVideoId}`));
}

export async function fetchPeaks(
  videoId: string,
  samples = 800,
): Promise<PeaksResponse> {
  const encodedVideoId = encodeURIComponent(videoId);
  const response = await fetch(
    buildUrl(`/local-api/peaks/${encodedVideoId}?samples=${samples}`),
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
