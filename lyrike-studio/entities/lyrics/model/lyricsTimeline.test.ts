import assert from "node:assert/strict";
import { test } from "node:test";
import { findActiveLyricIndex, findActiveWord } from "./lyricsTimeline";
import type { LyricLine } from "./types";

const line: LyricLine = {
  id: "line-1",
  start: 1,
  end: 4,
  text: "Hello world",
  words: [
    { id: "w0", start: 1, end: 1.8, text: "Hello " },
    { id: "w1", start: 1.81, end: 2.5, text: "world" },
  ],
};

test("findActiveLyricIndex returns index when current time is inside a line", () => {
  assert.equal(findActiveLyricIndex([line], 1.5), 0);
});

test("findActiveLyricIndex returns -1 when current time is outside lines", () => {
  assert.equal(findActiveLyricIndex([line], 0.5), -1);
});

test("findActiveWord returns the word containing the current time", () => {
  assert.equal(findActiveWord(line, 1.2)?.id, "w0");
  assert.equal(findActiveWord(line, 2)?.id, "w1");
});

test("findActiveWord returns null when current time is between words", () => {
  assert.equal(findActiveWord(line, 1.805), null);
});

test("findActiveWord returns null when line has no words", () => {
  const lineOnly: LyricLine = {
    id: "line-2",
    start: 5,
    end: 6,
    text: "No words",
  };
  assert.equal(findActiveWord(lineOnly, 5.5), null);
});
