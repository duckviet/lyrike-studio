import assert from "node:assert/strict";
import { test } from "node:test";
import { assignWordIdsForLine, createLineId } from "./lyricsUtils";
import type { LyricLine } from "./types";

test("assignWordIdsForLine remaps imported words to word-\${lineId}-\${index}", () => {
  const line: LyricLine = {
    id: "line-123",
    start: 1,
    end: 2,
    text: "Hello world",
    words: [
      { id: "old-1", start: 1, end: 1.5, text: "Hello " },
      { id: "old-2", start: 1.5, end: 2, text: "world" },
    ],
  };

  const result = assignWordIdsForLine(line);

  assert.equal(result.words?.[0]?.id, "word-line-123-0");
  assert.equal(result.words?.[1]?.id, "word-line-123-1");
  assert.equal(result.words?.[0]?.text, "Hello ");
});

test("assignWordIdsForLine leaves line-only rows unchanged", () => {
  const line: LyricLine = {
    id: "line-456",
    start: 3,
    end: 4,
    text: "No words here",
  };

  const result = assignWordIdsForLine(line);

  assert.equal(result.words, undefined);
  assert.equal(result.id, "line-456");
});

test("createLineId produces stable uuid prefixed ids", () => {
  const id = createLineId();
  assert.ok(id.startsWith("line-"));
  assert.ok(id.length > "line-".length);
});
