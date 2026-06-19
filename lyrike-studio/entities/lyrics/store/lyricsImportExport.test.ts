import assert from "node:assert/strict";
import { test } from "node:test";
import { useLyricsStore } from "./lyricsStore";

function resetStore() {
  useLyricsStore.setState({
    doc: {
      syncedLines: [],
      plainLyrics: "",
      meta: { title: "", artist: "", album: "", by: "", offset: 0 },
    },
    selectedLineId: null,
    activeLineId: null,
    activeWordId: null,
    isAutoSyncEnabled: false,
    canUndo: false,
    canRedo: false,
    focusLineId: null,
    selectedWordId: null,
  });
}

test("import creates line with words and correct text", () => {
  resetStore();
  useLyricsStore.getState().importFromLrc("[00:01.00]<00:01.00>Hello <00:01.50>world");

  const line = useLyricsStore.getState().doc.syncedLines[0];
  assert.ok(line);
  assert.equal(line.text, "Hello world");
  assert.equal(line.words?.length, 2);
  assert.equal(line.words?.[0]?.text.trim(), "Hello");
  assert.equal(line.words?.[0]?.start, 1);
  assert.equal(line.words?.[0]?.end, 1.5);
  assert.equal(line.words?.[1]?.text.trim(), "world");
  assert.equal(line.words?.[1]?.start, 1.5);
  assert.equal(line.words?.[1]?.end, 5);
});

test("export immediately after import returns same Enhanced LRC", () => {
  resetStore();
  const input = "[00:01.00]<00:01.00>Hello <00:01.50>world";
  useLyricsStore.getState().importFromLrc(input);

  const output = useLyricsStore.getState().exportToLrc();
  assert.equal(output, input);
});

test("editText clears stale words and updates plainLyrics", () => {
  resetStore();
  useLyricsStore.getState().importFromLrc("[00:01.00]<00:01.00>Hello <00:01.50>world");

  const lineId = useLyricsStore.getState().doc.syncedLines[0]!.id;
  useLyricsStore.getState().editText(lineId, "Changed");

  const line = useLyricsStore.getState().doc.syncedLines[0];
  assert.equal(line?.text, "Changed");
  assert.equal(line?.words, undefined);
  assert.equal(useLyricsStore.getState().doc.plainLyrics, "Changed");
});

test("setWordText preserves timings and updates line text and export", () => {
  resetStore();
  useLyricsStore.getState().importFromLrc("[00:01.00]<00:01.00>Hello <00:01.50>world");

  const lineId = useLyricsStore.getState().doc.syncedLines[0]!.id;
  const wordId = useLyricsStore.getState().doc.syncedLines[0]!.words![1]!.id;
  useLyricsStore.getState().setWordText(lineId, wordId, "Earth");

  const line = useLyricsStore.getState().doc.syncedLines[0];
  assert.equal(line?.text, "Hello Earth");
  assert.equal(line?.words?.[1]?.text, "Earth");
  assert.equal(line?.words?.[1]?.start, 1.5);
  assert.equal(line?.words?.[1]?.end, 5);

  const output = useLyricsStore.getState().exportToLrc();
  assert.ok(output.includes("<00:01.50>Earth"));
});
