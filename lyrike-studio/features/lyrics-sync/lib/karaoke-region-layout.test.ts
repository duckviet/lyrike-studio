import assert from "node:assert/strict";
import { test } from "node:test";
import { computeSegmentLayout } from "./karaoke-region-layout";
import type { LyricLine } from "@/entities/lyrics";

test("computeSegmentLayout positions segment and word children at pxPerSec=100", () => {
  const line: LyricLine = {
    id: "line-1",
    start: 10,
    end: 20,
    text: "Hello world",
    words: [
      { id: "w0", start: 12, end: 14, text: "Hello " },
      { id: "w1", start: 15, end: 17, text: "world" },
    ],
  };

  const layout = computeSegmentLayout(line, 100);

  assert.equal(layout.left, 1000);
  assert.equal(layout.width, 1000);

  assert.equal(layout.words[0].left, 200);
  assert.equal(layout.words[0].width, 200);

  assert.equal(layout.words[1].left, 500);
  assert.equal(layout.words[1].width, 200);
});

test("computeSegmentLayout returns empty words for line without words", () => {
  const line: LyricLine = {
    id: "line-2",
    start: 5,
    end: 8,
    text: "No words",
  };

  const layout = computeSegmentLayout(line, 100);

  assert.equal(layout.words.length, 0);
  assert.equal(layout.left, 500);
  assert.equal(layout.width, 300);
});
