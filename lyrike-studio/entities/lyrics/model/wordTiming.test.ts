import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MIN_WORD_LENGTH_SEC,
  clampWordRange,
  deriveLineTextFromWords,
  moveWordRange,
  resizeWordRange,
  scaleWordsForSegmentResize,
  shiftWordsForSegmentMove,
  updateWordRange,
} from "./wordTiming";
import type { LyricWord } from "./types";

test("shiftWordsForSegmentMove shifts word timings with the segment", () => {
  const words: readonly LyricWord[] = [
    { id: "w1", start: 10.5, end: 11, text: "Hello" },
  ];

  const result = shiftWordsForSegmentMove(words, 10, 12);

  assert.deepEqual(result, [{ id: "w1", start: 12.5, end: 13, text: "Hello" }]);
});

test("scaleWordsForSegmentResize scales word offsets proportionally", () => {
  const words: readonly LyricWord[] = [
    { id: "w1", start: 11, end: 12, text: "Hello" },
  ];

  const result = scaleWordsForSegmentResize(words, 10, 14, 10, 18);

  assert.deepEqual(result, [{ id: "w1", start: 12, end: 14, text: "Hello" }]);
});

test("clampWordRange keeps words inside neighbors and parent boundaries", () => {
  const words: readonly LyricWord[] = [
    { id: "w1", start: 10, end: 11, text: "A" },
    { id: "w2", start: 11.2, end: 11.6, text: "B" },
    { id: "w3", start: 12, end: 13, text: "C" },
  ];

  const movedLeft = clampWordRange(words, 1, 9, 10, 10, 13);
  assert.deepEqual(movedLeft, { start: 11, end: 11.04 });

  const movedRight = clampWordRange(words, 1, 12.6, 13.4, 10, 13);
  assert.deepEqual(movedRight, { start: 11.96, end: 12 });
});

test("moveWordRange clamps moved words to the valid slot", () => {
  const words: readonly LyricWord[] = [
    { id: "w1", start: 10, end: 11, text: "A" },
    { id: "w2", start: 11.2, end: 11.6, text: "B" },
    { id: "w3", start: 12, end: 13, text: "C" },
  ];

  const result = moveWordRange(words, 1, -1, 10, 13);

  assert.deepEqual(result[1], { id: "w2", start: 11, end: 11.04, text: "B" });
});

test("resizeWordRange clamps resized words to minimum length", () => {
  const words: readonly LyricWord[] = [
    { id: "w1", start: 10, end: 10.2, text: "A" },
  ];

  const result = resizeWordRange(words, 0, "end", -0.5, 10, 11);

  assert.equal(
    Number((result[0]!.end - result[0]!.start).toFixed(2)),
    MIN_WORD_LENGTH_SEC,
  );
});

test("deriveLineTextFromWords joins texts with a single space", () => {
  assert.equal(
    deriveLineTextFromWords([
      { id: "w1", start: 0, end: 1, text: "Hello" },
      { id: "w2", start: 1, end: 2, text: "world" },
    ]),
    "Hello world",
  );
});

test("updateWordRange resizes end of word and updates next word's start", () => {
  const words: readonly LyricWord[] = [
    { id: "w1", start: 1.0, end: 2.0, text: "Hello" },
    { id: "w2", start: 2.0, end: 3.0, text: "world" },
  ];

  // Drag end of w1 to 2.2s -> w1.end becomes 2.2s, w2.start becomes 2.2s
  const result = updateWordRange(words, 0, 1.0, 2.2, 0, 5);
  assert.equal(result[0].end, 2.2);
  assert.equal(result[1].start, 2.2);
  assert.equal(result[1].end, 3.0); // w2.end stays constant
});

test("updateWordRange resizes start of word and updates previous word's end", () => {
  const words: readonly LyricWord[] = [
    { id: "w1", start: 1.0, end: 2.0, text: "Hello" },
    { id: "w2", start: 2.0, end: 3.0, text: "world" },
  ];

  // Drag start of w2 to 1.8s -> w2.start becomes 1.8s, w1.end becomes 1.8s
  const result = updateWordRange(words, 1, 1.8, 3.0, 0, 5);
  assert.equal(result[1].start, 1.8);
  assert.equal(result[0].end, 1.8);
  assert.equal(result[0].start, 1.0); // w1.start stays constant
});

test("updateWordRange moves a word and resizes both neighboring words", () => {
  const words: readonly LyricWord[] = [
    { id: "w1", start: 1.0, end: 2.0, text: "Hello" },
    { id: "w2", start: 2.0, end: 3.0, text: "beautiful" },
    { id: "w3", start: 3.0, end: 4.0, text: "world" },
  ];

  // Move w2 to start at 2.2s (end 3.2s) -> w1.end becomes 2.2s, w3.start becomes 3.2s
  const result = updateWordRange(words, 1, 2.2, 3.2, 0, 5);
  assert.equal(result[1].start, 2.2);
  assert.equal(result[1].end, 3.2);
  assert.equal(result[0].end, 2.2);
  assert.equal(result[2].start, 3.2);
  assert.equal(result[0].start, 1.0); // unchanged
  assert.equal(result[2].end, 4.0); // unchanged
});
