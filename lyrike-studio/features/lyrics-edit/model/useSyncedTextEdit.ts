import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { LyricLine, LyricWord } from "@/entities/lyrics";

/**
 * Serialize LyricLine[] → raw LRC text
 * e.g. "[00:12.34] Hello world"
 */
export function linesToLrcText(lines: LyricLine[], isKaraoke?: boolean): string {
  return lines
    .map((line) => {
      const start = formatLrcTime(line.start);
      const end = formatLrcTime(line.end);
      if (isKaraoke && line.words && line.words.length > 0) {
        const wordsText = line.words
          .map((w) => `<${formatLrcTime(w.start)}>${w.text}`)
          .join("");
        return `[${start}:${end}] ${wordsText}`;
      }
      return `[${start}:${end}] ${line.text}`;
    })
    .join("\n");
}

/**
 * Format seconds → "mm:ss.xx"
 */
function formatLrcTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = secs.toFixed(2).padStart(5, "0");
  return `${mm}:${ss}`;
}

/**
 * Parse "mm:ss.xx" → seconds
 */
function parseLrcTime(raw: string): number {
  const match = raw.match(/^(\d+):(\d+(?:\.\d+)?)$/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseFloat(match[2]);
}

export interface ParsedLineEdit {
  id: string | null;
  start: number;
  end: number;
  text: string;
  words?: LyricWord[];
}

function parseKaraokeWords(
  text: string,
  lineStart: number,
  lineEnd: number,
  lineId: string | null,
): LyricWord[] | undefined {
  const regex = /<(\d+:\d+(?:\.\d+)?)>([^<]*)/g;
  const tokens: { start: number; text: string }[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const time = parseLrcTime(match[1]);
    tokens.push({
      start: time,
      text: match[2] ?? "",
    });
  }

  if (tokens.length === 0) {
    return undefined;
  }

  return tokens.map((token, index) => {
    const nextStart = tokens[index + 1]?.start;
    const end = nextStart ?? lineEnd;
    return {
      id: `word-${lineId ?? "new"}-${index}`,
      start: Number(token.start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text: token.text,
    };
  });
}

/**
 * Parse raw LRC text → ParsedLineEdit[]
 * Tries to match existing lines by index for stable IDs.
 */
export function parseLrcText(
  raw: string,
  existingLines: LyricLine[],
  isKaraoke?: boolean,
): ParsedLineEdit[] {
  const result: ParsedLineEdit[] = [];
  const rawLines = raw.split("\n");

  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i];
    const match = trimmed.match(/^\[(\d+:\d+(?:\.\d+)?)(?:[:|-]\s*(\d+:\d+(?:\.\d+)?))?\]\s?(.*)/);

    if (match) {
      const start = parseLrcTime(match[1]);
      const end = match[2] ? parseLrcTime(match[2]) : start + 5; // Default end if not provided
      const rawText = match[3] ?? "";
      const id = i < existingLines.length ? existingLines[i].id : null;
      
      let text = rawText;
      let words: LyricWord[] | undefined = undefined;

      if (isKaraoke) {
        text = rawText.replace(/<\d+:\d+(?:\.\d+)?>/g, "").trim();
        const parsedWords = parseKaraokeWords(rawText, start, end, id);
        if (parsedWords) {
          words = parsedWords;
        }
      }
      
      result.push({ id, start, end, text, words });
    } else if (trimmed.trim() !== "") {
      // Line without timestamp — treat as 0 time
      const id = i < existingLines.length ? existingLines[i].id : null;
      let text = trimmed;
      let words: LyricWord[] | undefined = undefined;

      if (isKaraoke) {
        text = trimmed.replace(/<\d+:\d+(?:\.\d+)?>/g, "").trim();
        const parsedWords = parseKaraokeWords(trimmed, 0, 5, id);
        if (parsedWords) {
          words = parsedWords;
        }
      }
      result.push({ id, start: 0, end: 5, text, words });
    }
  }

  return result;
}

export function useSyncedTextEdit(
  lines: LyricLine[],
  onApplyTextEdits: (edits: ParsedLineEdit[]) => void,
  isKaraoke?: boolean,
) {
  const [textValue, setTextValue] = useState(() => linesToLrcText(lines, isKaraoke));
  const isTextDirty = useRef(false);

  // When lines change externally and text is not being edited, re-sync
  const serialized = useMemo(() => linesToLrcText(lines, isKaraoke), [lines, isKaraoke]);

  useEffect(() => {
    if (!isTextDirty.current) {
      setTextValue(serialized);
    }
  }, [serialized]);

  const handleTextChange = useCallback(
    (value: string) => {
      isTextDirty.current = true;
      setTextValue(value);

      // Parse and apply immediately for live sync
      const edits = parseLrcText(value, lines, isKaraoke);
      onApplyTextEdits(edits);
    },
    [lines, onApplyTextEdits, isKaraoke],
  );

  const handleTextBlur = useCallback(() => {
    isTextDirty.current = false;
    // Re-serialize to normalize formatting
    setTextValue(serialized);
  }, [serialized]);

  return {
    textValue,
    handleTextChange,
    handleTextBlur,
  };
}
