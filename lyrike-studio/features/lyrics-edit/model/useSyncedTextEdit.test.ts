import assert from "node:assert/strict";
import { test } from "node:test";
import type { LyricLine } from "@/entities/lyrics/model/types";
import { linesToLrcText, parseLrcText } from "./useSyncedTextEdit";

test("linesToLrcText formats standard sync lines and enhanced karaoke lines correctly", () => {
  const lines: LyricLine[] = [
    {
      id: "line-1",
      start: 1.5,
      end: 4.2,
      text: "Hello world",
      words: [
        { id: "word-1-0", start: 1.5, end: 2.0, text: "Hello " },
        { id: "word-1-1", start: 2.0, end: 4.2, text: "world" },
      ],
    },
  ];

  // Standard serialization
  const standardText = linesToLrcText(lines, false);
  assert.equal(standardText, "[00:01.50:00:04.20] Hello world");

  // Karaoke/Enhanced LRC serialization
  const karaokeText = linesToLrcText(lines, true);
  assert.equal(karaokeText, "[00:01.50:00:04.20] <00:01.50>Hello <00:02.00>world");
});

test("parseLrcText parses standard and karaoke word timing lines correctly", () => {
  const existingLines: LyricLine[] = [
    { id: "line-1", start: 0, end: 0, text: "" },
  ];

  // Standard line parsing
  const standardInput = "[00:01.50:00:04.20] Hello world";
  const standardEdits = parseLrcText(standardInput, existingLines, false);
  assert.equal(standardEdits.length, 1);
  assert.equal(standardEdits[0].id, "line-1");
  assert.equal(standardEdits[0].start, 1.5);
  assert.equal(standardEdits[0].end, 4.2);
  assert.equal(standardEdits[0].text, "Hello world");
  assert.equal(standardEdits[0].words, undefined);

  // Karaoke line parsing
  const karaokeInput = "[00:01.50:00:04.20] <00:01.50>Hello <00:02.00>world";
  const karaokeEdits = parseLrcText(karaokeInput, existingLines, true);
  assert.equal(karaokeEdits.length, 1);
  assert.equal(karaokeEdits[0].id, "line-1");
  assert.equal(karaokeEdits[0].start, 1.5);
  assert.equal(karaokeEdits[0].end, 4.2);
  assert.equal(karaokeEdits[0].text, "Hello world");
  
  const words = karaokeEdits[0].words;
  assert.ok(words);
  assert.equal(words.length, 2);
  assert.equal(words[0].start, 1.5);
  assert.equal(words[0].end, 2.0);
  assert.equal(words[0].text, "Hello ");
  assert.equal(words[1].start, 2.0);
  assert.equal(words[1].end, 4.2);
  assert.equal(words[1].text, "world");
});
