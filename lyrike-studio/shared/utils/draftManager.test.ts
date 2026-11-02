import assert from "node:assert/strict";
import { test } from "node:test";

import { createDraftManager } from "./draftManager";

const memory = new Map<string, string>();
globalThis.localStorage = {
  get length() { return memory.size; },
  key: (i: number) => [...memory.keys()][i] ?? null,
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
} as Storage;

const doc = (title: string) => ({
  syncedLines: [{ id: "l1", start: 0, end: 1, text: "hi" }],
  plainLyrics: "hi",
  meta: { title, artist: "A", album: "", by: "", offset: 0 },
});

test("draft manager lists saved projects newest first and removes them", async () => {
  const manager = createDraftManager("test:draft");
  memory.set("unrelated", "x");
  memory.set("test:draft:broken", "{not json");
  manager.save("old", { doc: doc("Old"), selectedLineId: null });
  await new Promise((r) => setTimeout(r, 5));
  manager.save("new", { doc: doc("New"), selectedLineId: null });

  const list = manager.list();
  assert.deepEqual(list.map((p) => p.videoId), ["new", "old"]);
  assert.equal(list[0]?.title, "New");
  assert.equal(list[0]?.lineCount, 1);

  manager.remove("new");
  assert.deepEqual(manager.list().map((p) => p.videoId), ["old"]);
});
