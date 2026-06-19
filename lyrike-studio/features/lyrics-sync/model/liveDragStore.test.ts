import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearLiveDragRange,
  getLiveLineRangeSnapshot,
  getLiveWordRangeSnapshot,
  setLiveLineRange,
  setLiveWordRange,
  subscribeLiveDragRange,
} from "./liveDragStore";

test("notifies line subscribers only when a live range changes", () => {
  let calls = 0;
  const unsubscribe = subscribeLiveDragRange("line-1", () => {
    calls += 1;
  });

  setLiveLineRange("line-1", 1, 3);
  setLiveLineRange("line-1", 1, 3);
  setLiveLineRange("line-1", 2, 4);

  assert.equal(calls, 2);
  assert.deepEqual(getLiveLineRangeSnapshot("line-1"), { start: 2, end: 4 });
  unsubscribe();
});

test("clears only the requested live line range", () => {
  let lineOneCalls = 0;
  let lineTwoCalls = 0;
  const unsubscribeOne = subscribeLiveDragRange("line-1", () => {
    lineOneCalls += 1;
  });
  const unsubscribeTwo = subscribeLiveDragRange("line-2", () => {
    lineTwoCalls += 1;
  });

  setLiveLineRange("line-1", 1, 2);
  setLiveLineRange("line-2", 3, 4);
  clearLiveDragRange("line-1");

  assert.equal(lineOneCalls, 2);
  assert.equal(lineTwoCalls, 1);
  assert.equal(getLiveLineRangeSnapshot("line-1"), null);
  assert.deepEqual(getLiveLineRangeSnapshot("line-2"), { start: 3, end: 4 });
  unsubscribeOne();
  unsubscribeTwo();
  clearLiveDragRange("line-2");
});

test("stores word live ranges independently from line ranges", () => {
  setLiveLineRange("line-1", 1, 5);
  setLiveWordRange("word-1", 2, 3);

  assert.deepEqual(getLiveLineRangeSnapshot("line-1"), { start: 1, end: 5 });
  assert.deepEqual(getLiveWordRangeSnapshot("word-1"), { start: 2, end: 3 });

  clearLiveDragRange("word-1");

  assert.deepEqual(getLiveLineRangeSnapshot("line-1"), { start: 1, end: 5 });
  assert.equal(getLiveWordRangeSnapshot("word-1"), null);
  clearLiveDragRange("line-1");
});
