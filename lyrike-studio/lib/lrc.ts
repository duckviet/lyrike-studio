type LrcMetaKey = "ar" | "ti" | "al" | "by" | "offset" | "length";

export type LrcMeta = Partial<Record<LrcMetaKey, string>>;

export type EnhancedWordToken = {
  time: number;
  text: string;
};

export type ParsedLrcLine = {
  time: number;
  text: string;
  enhanced: EnhancedWordToken[];
};

export type ParsedLrcDoc = {
  meta: LrcMeta;
  lines: ParsedLrcLine[];
};

export type LyricsModelLine = {
  start: number;
  end: number;
  text: string;
};

export type LyricsModelMeta = {
  title: string;
  artist: string;
  album: string;
  by: string;
  offset: number;
};

export type LyricsModel = {
  meta: LyricsModelMeta;
  lines: LyricsModelLine[];
  plainLyrics: string;
};

const META_KEYS: LrcMetaKey[] = ["ar", "ti", "al", "by", "offset", "length"];
const MIN_LINE_LENGTH = 0.24;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe - mins * 60;
  return `${pad2(mins)}:${secs.toFixed(2).padStart(5, "0")}`;
}

function parseTimestamp(raw: string): number | null {
  const match = raw.trim().match(/^(\d{2}):(\d{2}(?:\.\d{1,3})?)$/);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }

  return Number((minutes * 60 + seconds).toFixed(3));
}

function parseEnhancedTokens(text: string): EnhancedWordToken[] {
  const regex = /<(\d{2}:\d{2}(?:\.\d{1,3})?)>([^<]*)/g;
  const tokens: EnhancedWordToken[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const time = parseTimestamp(match[1]);
    if (time === null) {
      continue;
    }

    tokens.push({
      time,
      text: match[2] ?? "",
    });
  }

  return tokens;
}

function removeEnhancedMarkers(text: string): string {
  return text.replace(/<\d{2}:\d{2}(?:\.\d{1,3})?>/g, "").trim();
}

function parseLine(line: string): ParsedLrcLine[] {
  const matches = [...line.matchAll(/\[(\d{2}:\d{2}(?:\.\d{1,3})?)\]/g)];
  if (matches.length === 0) {
    return [];
  }

  const text = removeEnhancedMarkers(
    line.replace(/\[(\d{2}:\d{2}(?:\.\d{1,3})?)\]/g, "").trim(),
  );
  const enhanced = parseEnhancedTokens(line);

  const parsed: ParsedLrcLine[] = [];
  for (const match of matches) {
    const time = parseTimestamp(match[1]);
    if (time === null) {
      continue;
    }

    parsed.push({
      time,
      text,
      enhanced,
    });
  }

  return parsed;
}

export function parseLrc(text: string): ParsedLrcDoc {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const meta: LrcMeta = {};
  const parsedLines: ParsedLrcLine[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const metaMatch = line.match(/^\[([a-zA-Z]+)\s*:\s*(.*?)\]$/);
    if (metaMatch) {
      const key = metaMatch[1].toLowerCase() as LrcMetaKey;
      if (META_KEYS.includes(key)) {
        meta[key] = metaMatch[2].trim();
        continue;
      }
    }

    parsedLines.push(...parseLine(line));
  }

  parsedLines.sort((a, b) => a.time - b.time);

  return {
    meta,
    lines: parsedLines,
  };
}

export function serializeLrc(doc: ParsedLrcDoc): string {
  const metaLines = META_KEYS.filter(
    (key) => typeof doc.meta[key] === "string" && doc.meta[key]?.trim(),
  ).map((key) => `[${key}:${doc.meta[key]?.trim() ?? ""}]`);

  const lyricLines = doc.lines
    .slice()
    .sort((a, b) => a.time - b.time)
    .map((line) => {
      const enhancedText =
        line.enhanced.length > 0
          ? line.enhanced
              .map((token) => `<${formatTimestamp(token.time)}>${token.text}`)
              .join("")
              .trim()
          : "";

      return `[${formatTimestamp(line.time)}]${enhancedText || line.text}`;
    });

  return [...metaLines, ...lyricLines].join("\n").trim();
}

export function lrcToLyricsModel(
  input: ParsedLrcDoc,
  fallbackDuration = 0,
): LyricsModel {
  const lines = input.lines
    .slice()
    .sort((a, b) => a.time - b.time)
    .map((line, index, arr) => {
      const nextStart = arr[index + 1]?.time;
      const fallbackEnd = Math.max(line.time + 4, fallbackDuration);
      const end =
        nextStart !== undefined
          ? Math.max(line.time + MIN_LINE_LENGTH, nextStart - MIN_LINE_LENGTH)
          : fallbackEnd;

      return {
        start: Number(line.time.toFixed(2)),
        end: Number(end.toFixed(2)),
        text: line.text,
      };
    });

  return {
    meta: {
      title: input.meta.ti ?? "",
      artist: input.meta.ar ?? "",
      album: input.meta.al ?? "",
      by: input.meta.by ?? "",
      offset: Number(input.meta.offset ?? 0) || 0,
    },
    lines,
    plainLyrics: lines.map((line) => line.text).join("\n"),
  };
}

export function lyricsModelToLrc(input: LyricsModel): ParsedLrcDoc {
  const maxEnd = input.lines.reduce((acc, line) => Math.max(acc, line.end), 0);

  const meta: LrcMeta = {
    ar: input.meta.artist || undefined,
    ti: input.meta.title || undefined,
    al: input.meta.album || undefined,
    by: input.meta.by || undefined,
    offset: input.meta.offset ? String(input.meta.offset) : undefined,
    length: maxEnd > 0 ? formatTimestamp(maxEnd) : undefined,
  };

  const lines: ParsedLrcLine[] = input.lines
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((line) => ({
      time: Number(line.start.toFixed(3)),
      text: line.text,
      enhanced: [],
    }));

  return {
    meta,
    lines,
  };
}
