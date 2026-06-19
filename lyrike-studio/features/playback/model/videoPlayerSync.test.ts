import assert from "node:assert/strict";
import { test } from "node:test";
import {
  syncVideoPlayerToMediaController,
  SYNC_DRIFT_THRESHOLD,
} from "./videoPlayerSync";

type MockController = {
  getCurrentTime: () => number;
  setTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  subscribe: (
    name: "timeupdate" | "playstate",
    handler: (payload: any) => void,
  ) => () => void;
  isPlaying: () => boolean;
  calls: Array<{ method: string; args: unknown[] }>;
};

function createMockController(initialTime = 0, initialPlaying = false): MockController {
  const listeners: Record<string, Array<(payload: any) => void>> = {
    timeupdate: [],
    playstate: [],
  };
  let time = initialTime;
  let playing = initialPlaying;
  const calls: Array<{ method: string; args: unknown[] }> = [];

  return {
    getCurrentTime: () => time,
    isPlaying: () => playing,
    setTime: (next) => {
      time = next;
      listeners.timeupdate.forEach((h) => h({ currentTime: time }));
    },
    setPlaying: (next) => {
      playing = next;
      listeners.playstate.forEach((h) => h({ isPlaying: playing }));
    },
    play: () => {
      calls.push({ method: "play", args: [] });
      playing = true;
      listeners.playstate.forEach((h) => h({ isPlaying: playing }));
    },
    pause: () => {
      calls.push({ method: "pause", args: [] });
      playing = false;
      listeners.playstate.forEach((h) => h({ isPlaying: playing }));
    },
    seek: (next) => {
      calls.push({ method: "seek", args: [next] });
      time = next;
      listeners.timeupdate.forEach((h) => h({ currentTime: time }));
    },
    subscribe: (name, handler) => {
      listeners[name].push(handler);
      return () => {
        const idx = listeners[name].indexOf(handler);
        if (idx >= 0) listeners[name].splice(idx, 1);
      };
    },
    calls,
  };
}

type MockPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (time: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  setTime: (time: number) => void;
  addEventListener: (
    event: string,
    listener: (event: { data: number }) => void,
  ) => void;
  removeEventListener: (
    event: string,
    listener: (event: { data: number }) => void,
  ) => void;
  emitStateChange: (data: number) => void;
  calls: Array<{ method: string; args: unknown[] }>;
};

function createMockPlayer(initialTime = 0): MockPlayer {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const stateListeners: Array<(event: { data: number }) => void> = [];
  let time = initialTime;
  let playing = false;

  return {
    playVideo: () => {
      calls.push({ method: "playVideo", args: [] });
      playing = true;
      stateListeners.forEach((l) => l({ data: 1 }));
    },
    pauseVideo: () => {
      calls.push({ method: "pauseVideo", args: [] });
      playing = false;
      stateListeners.forEach((l) => l({ data: 2 }));
    },
    seekTo: (t, allow) => {
      calls.push({ method: "seekTo", args: [t, allow] });
      const wasPlaying = playing;
      time = t;
      stateListeners.forEach((l) => l({ data: 3 }));
      stateListeners.forEach((l) => l({ data: wasPlaying ? 1 : 2 }));
    },
    getCurrentTime: () => time,
    getPlayerState: () => (playing ? 1 : 2),
    setTime: (t) => {
      time = t;
    },
    addEventListener: (event, listener) => {
      if (event === "onStateChange") {
        stateListeners.push(listener);
      }
    },
    removeEventListener: (event, listener) => {
      if (event === "onStateChange") {
        const idx = stateListeners.indexOf(listener);
        if (idx >= 0) stateListeners.splice(idx, 1);
      }
    },
    emitStateChange: (data) => {
      stateListeners.forEach((l) => l({ data }));
    },
    calls,
  };
}

test("initial sync seeks the player to the controller current time", () => {
  const controller = createMockController(12.5, false);
  const player = createMockPlayer(0);

  syncVideoPlayerToMediaController(player, controller);

  assert.deepEqual(player.calls, [{ method: "seekTo", args: [12.5, true] }]);
});

test("timeupdate within drift threshold does not seek", () => {
  const controller = createMockController(10, false);
  const player = createMockPlayer(10);
  player.calls.length = 0;

  syncVideoPlayerToMediaController(player, controller);
  player.calls.length = 0;

  controller.setTime(10 + SYNC_DRIFT_THRESHOLD / 2);

  assert.equal(player.calls.length, 0);
});

test("timeupdate beyond drift threshold seeks the player", () => {
  const controller = createMockController(10, false);
  const player = createMockPlayer(10);

  syncVideoPlayerToMediaController(player, controller);
  player.calls.length = 0;

  controller.setTime(10 + SYNC_DRIFT_THRESHOLD + 0.1);

  assert.deepEqual(player.calls, [
    { method: "seekTo", args: [10 + SYNC_DRIFT_THRESHOLD + 0.1, true] },
  ]);
});

test("playstate true calls playVideo", () => {
  const controller = createMockController(0, false);
  const player = createMockPlayer(0);

  syncVideoPlayerToMediaController(player, controller);
  player.calls.length = 0;

  controller.setPlaying(true);

  assert.deepEqual(player.calls, [{ method: "playVideo", args: [] }]);
});

test("playstate false calls pauseVideo", () => {
  const controller = createMockController(0, true);
  const player = createMockPlayer(0);

  syncVideoPlayerToMediaController(player, controller);
  player.calls.length = 0;

  controller.setPlaying(false);

  assert.deepEqual(player.calls, [{ method: "pauseVideo", args: [] }]);
});

test("unsubscribe removes listeners", () => {
  const controller = createMockController(10, false);
  const player = createMockPlayer(10);

  const unsubscribe = syncVideoPlayerToMediaController(player, controller);
  player.calls.length = 0;
  controller.calls.length = 0;
  unsubscribe();

  controller.setTime(20);
  controller.setPlaying(true);
  player.emitStateChange(1);

  assert.equal(player.calls.length, 0);
  assert.equal(controller.calls.length, 0);
});

// Reverse sync: user interacts with the video player.

test("player PLAYING event calls controller.play when controller is paused", () => {
  const controller = createMockController(10, false);
  const player = createMockPlayer(10);

  syncVideoPlayerToMediaController(player, controller);
  player.calls.length = 0;
  controller.calls.length = 0;

  player.emitStateChange(1);

  assert.deepEqual(controller.calls, [{ method: "play", args: [] }]);
});

test("player PAUSED event calls controller.pause when controller is playing", () => {
  const controller = createMockController(10, false);
  const player = createMockPlayer(10);

  syncVideoPlayerToMediaController(player, controller);
  controller.setPlaying(true);
  player.calls.length = 0;
  controller.calls.length = 0;

  player.emitStateChange(2);

  assert.deepEqual(controller.calls, [{ method: "pause", args: [] }]);
});

test("player state change after seek calls controller.seek with player time", async () => {
  const controller = createMockController(10, false);
  const player = createMockPlayer(10);

  syncVideoPlayerToMediaController(player, controller);
  player.calls.length = 0;
  controller.calls.length = 0;

  player.setTime(25);
  player.emitStateChange(3); // BUFFERING
  player.emitStateChange(2); // PAUSED after seek

  await new Promise((resolve) => setTimeout(resolve, 600));

  assert.deepEqual(controller.calls, [{ method: "seek", args: [25] }]);
});

test("player time jump while playing calls controller.seek", async () => {
  const controller = createMockController(10, true);
  const player = createMockPlayer(10);

  syncVideoPlayerToMediaController(player, controller);
  // Wait out the initial suppression window.
  await new Promise((resolve) => setTimeout(resolve, 350));

  controller.calls.length = 0;
  player.setTime(25);

  await new Promise((resolve) => setTimeout(resolve, 400));

  assert.deepEqual(controller.calls, [{ method: "seek", args: [25] }]);
});

test("controller-driven play does not echo back as controller.play", () => {
  const controller = createMockController(0, false);
  const player = createMockPlayer(0);

  syncVideoPlayerToMediaController(player, controller);
  controller.calls.length = 0;

  controller.setPlaying(true);

  assert.equal(controller.calls.length, 0);
});

test("controller-driven seek does not echo back as controller.seek", () => {
  const controller = createMockController(0, false);
  const player = createMockPlayer(0);

  syncVideoPlayerToMediaController(player, controller);
  controller.calls.length = 0;

  controller.setTime(10);

  assert.equal(controller.calls.length, 0);
});

test("controller-driven pause does not echo back as controller.pause", () => {
  const controller = createMockController(0, true);
  const player = createMockPlayer(0);

  syncVideoPlayerToMediaController(player, controller);
  controller.calls.length = 0;

  controller.setPlaying(false);

  assert.equal(controller.calls.length, 0);
});

test("player time jump while playing is not reverted by immediate controller timeupdate", async () => {
  const controller = createMockController(10, true);
  const player = createMockPlayer(10);

  syncVideoPlayerToMediaController(player, controller);
  // Wait out the initial suppression window.
  await new Promise((resolve) => setTimeout(resolve, 350));

  player.setTime(25);
  player.calls.length = 0;
  // A standard timeupdate from the playing controller arrives (currentTime advances slightly to 10.1)
  controller.setTime(10.1);

  // It should NOT seek the player back to 10.1 (i.e. seekTo should not be called)
  const seeksTo = player.calls.filter((c) => c.method === "seekTo");
  assert.equal(seeksTo.length, 0);

  // It should seek the controller to 25
  assert.deepEqual(controller.calls, [{ method: "seek", args: [25] }]);
});
