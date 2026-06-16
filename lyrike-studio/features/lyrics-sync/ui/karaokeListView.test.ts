import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getKaraokeLineDisplayProps,
  getWordDisplayLabel,
} from "./karaokeListView";
import type { LyricLine } from "@/entities/lyrics";

const line: LyricLine = {
  id: "line-1",
  start: 1,
  end: 3,
  text: "Hello world",
  words: [
    { id: "w0", start: 1, end: 1.8, text: "Hello " },
    { id: "w1", start: 1.8, end: 2.5, text: "world" },
  ],
};

const formatTime = (seconds: number) =>
  seconds.toFixed(2).padStart(5, "0");

test("getWordDisplayLabel trims word text", () => {
  assert.equal(getWordDisplayLabel(line.words![0]), "Hello");
  assert.equal(getWordDisplayLabel(line.words![1]), "world");
});

test("getKaraokeLineDisplayProps marks active and selected words", () => {
  const display = getKaraokeLineDisplayProps(line, {
    isActive: false,
    isSelected: false,
    activeWordId: "w1",
    selectedWordId: "w0",
    formatTime,
  });

  assert.equal(display.hasWords, true);
  assert.equal(display.words[0].isSelected, true);
  assert.equal(display.words[0].isActive, false);
  assert.equal(display.words[1].isActive, true);
  assert.equal(display.words[1].isSelected, false);
  assert.ok(display.timeLabel.includes("01.00"));
  assert.ok(display.timeLabel.includes("03.00"));
});

test("getKaraokeLineDisplayProps handles line without words", () => {
  const lineOnly: LyricLine = {
    id: "line-2",
    start: 5,
    end: 6,
    text: "No words",
  };

  const display = getKaraokeLineDisplayProps(lineOnly, {
    isActive: false,
    isSelected: false,
    activeWordId: null,
    selectedWordId: null,
    formatTime,
  });

  assert.equal(display.hasWords, false);
  assert.equal(display.words.length, 0);
});
