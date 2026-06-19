import assert from "node:assert/strict";
import { after, test } from "node:test";

import { requestTranscription } from "./api";

const originalFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = originalFetch;
});

test("requestTranscription maps completed syncedLyrics payloads to synced", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        videoId: "dJg4_rL9h7Q",
        status: "completed",
        syncedLyrics: "[00:08.49] You've been on my mind I",
        plainLyrics: "You've been on my mind I",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  const response = await requestTranscription("dJg4_rL9h7Q");

  assert.equal(response.status, "completed");
  assert.equal(response.synced, "[00:08.49] You've been on my mind I");
  assert.equal(response.plain, "You've been on my mind I");
});
