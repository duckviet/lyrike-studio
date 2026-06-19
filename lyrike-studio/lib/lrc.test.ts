import assert from "node:assert/strict";
import { test } from "node:test";

import type { LyricLine } from "../entities/lyrics/model/types";
import {
  lrcToLyricsModel,
  lyricsModelToLrc,
  parseLrc,
  serializeLrc,
} from "./lrc";

const lineWithWords = {
  id: "line-1",
  start: 1,
  end: 2,
  text: "Hello",
  words: [{ id: "word-1", start: 1, end: 2, text: "Hello" }],
} satisfies LyricLine;

test("lrc model preserves enhanced word markers when round-tripping karaoke lines", () => {
  // Given: an Enhanced LRC line with segment and word-level timing.
  const input = "[00:01.00]<00:01.00>Hello <00:01.50>world";

  // When: the line is parsed into the frontend domain model and serialized back.
  const model = lrcToLyricsModel(parseLrc(input));
  const output = serializeLrc(lyricsModelToLrc(model));

  // Then: word timings survive in both the model and export contract.
  assert.deepEqual(model.lines[0]?.words, [
    { id: "word-0-0", start: 1, end: 1.5, text: "Hello " },
    { id: "word-0-1", start: 1.5, end: 5, text: "world" },
  ]);
  assert.equal(output, input);
});

test("lrc model keeps line-only lrc unchanged when no enhanced words exist", () => {
  // Given: a normal line-timed LRC document.
  const input = "[00:01.00]Hello world";

  // When: it travels through the same model conversion path.
  const model = lrcToLyricsModel(parseLrc(input));
  const output = serializeLrc(lyricsModelToLrc(model));

  // Then: no word markers are added and the model stays line-only.
  assert.equal(model.lines[0]?.words, undefined);
  assert.equal(output, "[00:01.00]Hello world");
});

test("lyric line domain type accepts readonly enhanced words", () => {
  assert.equal(lineWithWords.words[0]?.text, "Hello");
});
