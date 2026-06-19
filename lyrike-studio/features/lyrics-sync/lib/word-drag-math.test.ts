import assert from "node:assert/strict";
import { test } from "node:test";
import { computeWordDragResult } from "./word-drag-math";
import type { LyricLine } from "@/entities/lyrics";

const pxPerSec = 100;
const duration = 30;

const line: LyricLine = {
  id: "line-1",
  start: 10,
  end: 20,
  text: "Hello brave world",
  words: [
    { id: "w0", start: 11, end: 12, text: "Hello" },
    { id: "w1", start: 12.5, end: 13.5, text: "brave" },
    { id: "w2", start: 14, end: 15, text: "world" },
  ],
};

test("move word right inside segment", () => {
  const result = computeWordDragResult({
    line,
    words: line.words!,
    wordIndex: 1,
    origin: { start: 12.5, end: 13.5, clientX: 0 },
    edge: "move",
    deltaX: pxPerSec,
    pxPerSec,
    duration,
  });

  assert.equal(result.start, 13.5);
  assert.equal(result.end, 14.5);
});

test("resize word start left clamps to previous word end", () => {
  const result = computeWordDragResult({
    line,
    words: line.words!,
    wordIndex: 1,
    origin: { start: 12.5, end: 13.5, clientX: 0 },
    edge: "start",
    deltaX: -2 * pxPerSec,
    pxPerSec,
    duration,
  });

  assert.equal(result.start, 12);
  assert.equal(result.end, 13.5);
});

test("resize word end right clamps to next word start", () => {
  const result = computeWordDragResult({
    line,
    words: line.words!,
    wordIndex: 1,
    origin: { start: 12.5, end: 13.5, clientX: 0 },
    edge: "end",
    deltaX: 2 * pxPerSec,
    pxPerSec,
    duration,
  });

  assert.equal(result.start, 12.5);
  assert.equal(result.end, 14);
});

test("move word outside left clamps to parent start", () => {
  const result = computeWordDragResult({
    line,
    words: line.words!,
    wordIndex: 0,
    origin: { start: 11, end: 12, clientX: 0 },
    edge: "move",
    deltaX: -5 * pxPerSec,
    pxPerSec,
    duration,
  });

  assert.equal(result.start, 10);
  assert.equal(result.end, 11);
});
