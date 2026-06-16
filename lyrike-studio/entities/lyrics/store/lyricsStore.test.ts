import assert from "node:assert/strict";
import { test } from "node:test";
import { useLyricsStore } from "./lyricsStore";
import type { LyricLine } from "../model/types";

function seedLine(): LyricLine {
  return {
    id: "line-1",
    start: 1,
    end: 3,
    text: "Hello world",
    words: [
      { id: "word-line-1-0", start: 1, end: 1.8, text: "Hello " },
      { id: "word-line-1-1", start: 1.8, end: 2.5, text: "world" },
    ],
  };
}

function seedStore() {
  const store = useLyricsStore;
  store.setState({
    doc: {
      syncedLines: [seedLine()],
      plainLyrics: "Hello world",
      meta: {
        title: "",
        artist: "",
        album: "",
        by: "",
        offset: 0,
      },
    },
    selectedLineId: "line-1",
    selectedWordId: null,
    activeWordId: null,
    canUndo: false,
    canRedo: false,
  });
  return store;
}

test("selectWord sets selected line and word ids", () => {
  const store = seedStore();
  store.getState().selectWord("line-1", "word-line-1-0");

  assert.equal(store.getState().selectedLineId, "line-1");
  assert.equal(store.getState().selectedWordId, "word-line-1-0");
});

test("clearWordSelection clears only the word selection", () => {
  const store = seedStore();
  store.getState().selectWord("line-1", "word-line-1-0");
  store.getState().clearWordSelection();

  assert.equal(store.getState().selectedLineId, "line-1");
  assert.equal(store.getState().selectedWordId, null);
});

test("setActiveWord updates active word id", () => {
  const store = seedStore();
  store.getState().setActiveWord("word-line-1-1");

  assert.equal(store.getState().activeWordId, "word-line-1-1");
});

test("setLineRange shifts word timings when segment is moved", () => {
  const store = seedStore();
  const baseState = {
    doc: store.getState().doc,
    selectedLineId: store.getState().selectedLineId,
  };
  store.getState().setLineRange("line-1", 2, 4, baseState);

  const line = store.getState().doc.syncedLines[0];
  assert.equal(line?.start, 2);
  assert.equal(line?.end, 4);
  assert.equal(line?.words?.[0]?.start, 2);
  assert.equal(line?.words?.[0]?.end, 2.8);
  assert.equal(line?.words?.[1]?.start, 2.8);
  assert.equal(line?.words?.[1]?.end, 3.5);
});

test("setWordRange clamps word inside segment and enables undo", () => {
  const store = seedStore();
  const baseState = {
    doc: store.getState().doc,
    selectedLineId: store.getState().selectedLineId,
  };
  store.getState().setWordRange("line-1", "word-line-1-0", 1, 1.5, baseState);

  const word = store.getState().doc.syncedLines[0]?.words?.[0];
  assert.equal(word?.start, 1);
  assert.equal(word?.end, 1.5);
  assert.equal(store.getState().canUndo, true);

  store.getState().undo();
  const undone = store.getState().doc.syncedLines[0]?.words?.[0];
  assert.equal(undone?.start, 1);
  assert.equal(undone?.end, 1.8);
});

test("splitLine splits a line and distributes its words correctly", () => {
  const store = seedStore();
  store.getState().splitLine("line-1");

  const lines = store.getState().doc.syncedLines;
  assert.equal(lines.length, 2);

  // Left line: text "Hello", words = [Hello]
  assert.equal(lines[0].text, "Hello");
  assert.ok(lines[0].words);
  assert.equal(lines[0].words.length, 1);
  assert.equal(lines[0].words[0].text, "Hello ");
  assert.equal(lines[0].words[0].start, 1);
  assert.equal(lines[0].words[0].end, 1.8);

  // Right line: text "world", words = [world]
  assert.equal(lines[1].text, "world");
  assert.ok(lines[1].words);
  assert.equal(lines[1].words.length, 1);
  assert.equal(lines[1].words[0].text, "world");
  assert.equal(lines[1].words[0].start, 1.8);
  assert.equal(lines[1].words[0].end, 2.5);
});

test("splitAtTime splits a line at a specific timestamp and partitions its words", () => {
  const store = seedStore();
  // Split at 1.8 seconds (between "Hello" and "world")
  store.getState().splitAtTime(1.8);

  const lines = store.getState().doc.syncedLines;
  assert.equal(lines.length, 2);

  // Left line
  assert.equal(lines[0].text, "Hello");
  assert.ok(lines[0].words);
  assert.equal(lines[0].words.length, 1);
  assert.equal(lines[0].words[0].text, "Hello ");

  // Right line
  assert.equal(lines[1].text, "world");
  assert.ok(lines[1].words);
  assert.equal(lines[1].words.length, 1);
  assert.equal(lines[1].words[0].text, "world");
});
