import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countInstrumentalGaps,
  fillInstrumentalGaps,
} from "./fillInstrumentalGaps";

const lines = [
  { start: 0, end: 4, text: "one" },
  { start: 4.3, end: 8, text: "two" }, // 0.3s gap: below threshold
  { start: 15, end: 18, text: "three" }, // 7s gap: instrumental
];

test("inserts a marker only for gaps at or above the threshold", () => {
  const out = fillInstrumentalGaps(lines, { minGap: 2 });
  assert.deepEqual(
    out.map((l) => l.text),
    ["one", "two", "♪", "three"],
  );
  assert.equal(out[2].start, 8);
  assert.equal(out[2].end, 15);
});

test("lower threshold fills more gaps", () => {
  assert.equal(countInstrumentalGaps(lines, { minGap: 0.25 }), 2);
});

test("does not double an existing marker line", () => {
  const withMarker = [
    { start: 0, end: 4, text: "one" },
    { start: 4, end: 6, text: "♪" },
    { start: 12, end: 14, text: "two" },
  ];
  assert.equal(countInstrumentalGaps(withMarker, { minGap: 2 }), 0);
});

test("never adds a trailing marker after the last line", () => {
  const out = fillInstrumentalGaps([{ start: 0, end: 2, text: "only" }], {
    minGap: 0.5,
  });
  assert.equal(out.length, 1);
});
