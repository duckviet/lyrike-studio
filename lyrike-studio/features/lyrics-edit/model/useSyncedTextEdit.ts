"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { LyricLine } from "@/entities/lyrics";

/**
 * Serialize LyricLine[] → raw LRC text
 * e.g. "[00:12.34] Hello world"
 */
function linesToLrcText(lines: LyricLine[]): string {
  return lines
    .map((line) => {
      const start = formatLrcTime(line.start);
      const end = formatLrcTime(line.end);
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
}

/**
 * Parse raw LRC text → ParsedLineEdit[]
 * Tries to match existing lines by index for stable IDs.
 */
function parseLrcText(
  raw: string,
  existingLines: LyricLine[],
): ParsedLineEdit[] {
  const result: ParsedLineEdit[] = [];
  const rawLines = raw.split("\n");

  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i];
    const match = trimmed.match(/^\[(\d+:\d+(?:\.\d+)?)(?:[:|-]\s*(\d+:\d+(?:\.\d+)?))?\]\s?(.*)/);

    if (match) {
      const start = parseLrcTime(match[1]);
      const end = match[2] ? parseLrcTime(match[2]) : start + 5; // Default end if not provided
      const text = match[3] ?? "";
      const id = i < existingLines.length ? existingLines[i].id : null;
      result.push({ id, start, end, text });
    } else if (trimmed.trim() !== "") {
      // Line without timestamp — treat as 0 time
      const id = i < existingLines.length ? existingLines[i].id : null;
      result.push({ id, start: 0, end: 5, text: trimmed });
    }
  }

  return result;
}

export function useSyncedTextEdit(
  lines: LyricLine[],
  onApplyTextEdits: (edits: ParsedLineEdit[]) => void,
) {
  const [textValue, setTextValue] = useState(() => linesToLrcText(lines));
  const isTextDirty = useRef(false);

  // When lines change externally and text is not being edited, re-sync
  const serialized = useMemo(() => linesToLrcText(lines), [lines]);

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
      const edits = parseLrcText(value, lines);
      onApplyTextEdits(edits);
    },
    [lines, onApplyTextEdits],
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
