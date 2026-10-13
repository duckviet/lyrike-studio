export const SYNC_DRIFT_THRESHOLD = 0.3;
const USER_SEEK_DRIFT_THRESHOLD = 0.05;
const SEEK_JUMP_THRESHOLD = 0.3;
const SEEK_PROPAGATION_DELAY_MS = 100;
const SUPPRESS_AFTER_CONTROLLER_COMMAND_MS = 300;
const SEEK_POLL_INTERVAL_MS = 250;
// How long a controller-commanded seek may stay unconfirmed by the player.
// YouTube can take well over a second to land on an unbuffered position.
const PENDING_SEEK_TIMEOUT_MS = 5000;
const STALE_READING_TOLERANCE = 0.5;

const YT_UNSTARTED = -1;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;

interface VideoPlayerLike {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(time: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState?(): number;
  addEventListener?(
    event: string,
    listener: (event: { data: number }) => void,
  ): void;
  removeEventListener?(
    event: string,
    listener: (event: { data: number }) => void,
  ): void;
}

interface MediaControllerLike {
  getCurrentTime(): number;
  play(): void | Promise<void>;
  pause(): void;
  seek(time: number): void;
  subscribe(
    name: "timeupdate",
    handler: (payload: { currentTime: number }) => void,
  ): () => void;
  subscribe(
    name: "playstate",
    handler: (payload: { isPlaying: boolean }) => void,
  ): () => void;
  isPlaying?(): boolean;
}

/**
 * Keeps a YouTube (or similar) video preview in sync with the authoritative
 * MediaController without forcing the video to re-render React state.
 *
 * - Seeks the video when its reported time drifts beyond the threshold.
 * - Mirrors play/pause commands from the controller.
 * - Listens to user interactions inside the video iframe (play/pause/seek)
 *   and forwards them to the controller so the timeline/waveform follow.
 *
 * Echo/feedback loops are prevented by:
 * - Only forwarding play/pause when the observed video state differs from the
 *   controller state.
 * - Ignoring controller-driven updates for a short window so the video has
 *   time to settle.
 * - Only forwarding a seek when the player time jumps while paused, or when
 *   the player leaves the BUFFERING state after a user seek.
 * - After the controller commands the player to seek, readings that still sit
 *   at the player's old position are treated as "not caught up yet" rather
 *   than as a user seek, so a slow video never drags the transport back.
 */
export function syncVideoPlayerToMediaController(
  player: VideoPlayerLike,
  mediaController: MediaControllerLike,
): () => void {
  let controllerIsPlaying = mediaController.isPlaying?.() ?? false;
  let lastPlayerState = YT_UNSTARTED;
  let lastPlayerTime = mediaController.getCurrentTime();
  let lastControllerTime = mediaController.getCurrentTime();
  let suppressPlayerToControllerUntil = 0;
  let suppressControllerToPlayerUntil = 0;
  let pendingSeekTimeout: ReturnType<typeof setTimeout> | null = null;
  let controllerSeekUntil = 0;
  let pendingSeek: { from: number; until: number } | null = null;

  const getNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  const isPlayerToControllerSuppressed = () =>
    getNow() < suppressPlayerToControllerUntil;

  const isControllerToPlayerSuppressed = () =>
    getNow() < suppressControllerToPlayerUntil;

  const suppressPlayerToController = (ms = SUPPRESS_AFTER_CONTROLLER_COMMAND_MS) => {
    suppressPlayerToControllerUntil = getNow() + ms;
  };

  const suppressControllerToPlayer = (ms = SUPPRESS_AFTER_CONTROLLER_COMMAND_MS) => {
    suppressControllerToPlayerUntil = getNow() + ms;
  };

  /**
   * True while the player has not yet reached a position the controller
   * commanded it to seek to, and still reports its pre-seek time.
   */
  const isStaleReading = (playerTime: number) => {
    if (!pendingSeek) return false;
    if (getNow() > pendingSeek.until) {
      pendingSeek = null;
      return false;
    }
    const caughtUp =
      Math.abs(playerTime - mediaController.getCurrentTime()) <=
      SYNC_DRIFT_THRESHOLD;
    if (caughtUp) {
      pendingSeek = null;
      return false;
    }
    if (Math.abs(playerTime - pendingSeek.from) <= STALE_READING_TOLERANCE) {
      return true;
    }
    // Player is somewhere else entirely: the user seeked inside the iframe.
    pendingSeek = null;
    return false;
  };

  const propagateSeek = () => {
    if (isPlayerToControllerSuppressed()) return;
    const playerTime = player.getCurrentTime();
    if (isStaleReading(playerTime)) return;
    const drift = Math.abs(playerTime - mediaController.getCurrentTime());
    if (drift > USER_SEEK_DRIFT_THRESHOLD) {
      suppressPlayerToController();
      suppressControllerToPlayer();
      lastPlayerTime = playerTime;
      mediaController.seek(playerTime);
    }
  };

  const scheduleSeekPropagation = () => {
    if (pendingSeekTimeout) {
      clearTimeout(pendingSeekTimeout);
    }
    const now = getNow();
    const suppressRemaining = Math.max(0, suppressPlayerToControllerUntil - now);

    // Suppress controller -> player updates immediately so any concurrent timeupdate
    // does not revert the player while we wait to propagate the seek.
    suppressControllerToPlayer();

    const delay = Math.max(SEEK_PROPAGATION_DELAY_MS, suppressRemaining + 1);
    pendingSeekTimeout = setTimeout(() => {
      pendingSeekTimeout = null;
      propagateSeek();
    }, delay);
    if (typeof (pendingSeekTimeout as unknown as NodeJS.Timeout).unref === "function") {
      (pendingSeekTimeout as unknown as NodeJS.Timeout).unref();
    }
  };

  // Bring the video to the current transport position as soon as it is ready.
  player.seekTo(mediaController.getCurrentTime(), true);
  suppressPlayerToController();
  lastPlayerTime = mediaController.getCurrentTime();

  const unsubscribeTime = mediaController.subscribe(
    "timeupdate",
    ({ currentTime }) => {
      const controllerJump = Math.abs(currentTime - lastControllerTime);
      lastControllerTime = currentTime;

      if (isControllerToPlayerSuppressed()) {
        lastPlayerTime = player.getCurrentTime();
        return;
      }

      const playerTime = player.getCurrentTime();
      const drift = Math.abs(playerTime - currentTime);
      if (drift > SYNC_DRIFT_THRESHOLD) {
        const playerJump = Math.abs(playerTime - lastPlayerTime);
        if (
          playerJump > SEEK_JUMP_THRESHOLD &&
          controllerJump <= SEEK_JUMP_THRESHOLD &&
          !isStaleReading(playerTime)
        ) {
          // User seeked inside player
          controllerSeekUntil = 0;
          suppressControllerToPlayer();
          suppressPlayerToController();
          lastPlayerTime = playerTime;
          mediaController.seek(playerTime);
        } else {
          // Controller jumped or normal drift -> Sync player to controller
          if (controllerJump > SEEK_JUMP_THRESHOLD) {
            controllerSeekUntil = getNow() + 500;
            pendingSeek = {
              from: playerTime,
              until: getNow() + PENDING_SEEK_TIMEOUT_MS,
            };
          }
          player.seekTo(currentTime, true);
          suppressPlayerToController();
          lastPlayerTime = currentTime;
        }
      } else {
        lastPlayerTime = playerTime;
      }
    },
  );

  const unsubscribePlaystate = mediaController.subscribe(
    "playstate",
    ({ isPlaying }) => {
      controllerIsPlaying = isPlaying;
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
      suppressPlayerToController();
      lastPlayerTime = player.getCurrentTime();
      lastControllerTime = mediaController.getCurrentTime();
    },
  );

  const handleStateChange = (event: { data: number }) => {
    const state = event.data;

    // Forward user play/pause clicks from the iframe.
    if (state === YT_PLAYING && !controllerIsPlaying) {
      mediaController.play();
    } else if (state === YT_PAUSED && controllerIsPlaying) {
      mediaController.pause();
    } else if (
      (state === YT_PLAYING || state === YT_PAUSED) &&
      lastPlayerState === YT_BUFFERING
    ) {
      // The player just finished buffering after a user seek.
      const isControllerSeek = getNow() < controllerSeekUntil;
      if (isControllerSeek) {
        controllerSeekUntil = 0;
      } else {
        // Give it a moment to settle on the new time, then sync the controller.
        scheduleSeekPropagation();
      }
    }

    lastPlayerState = state;
  };

  if (typeof player.addEventListener === "function") {
    player.addEventListener("onStateChange", handleStateChange);
  }

  // Poll for time jumps caused by the user seeking inside the iframe.
  // YouTube does not always fire BUFFERING when seeking (especially while
  // paused, or when the click is fast while playing), so we detect a seek by
  // watching for an abrupt change in the player time.
  const pollSeek = setInterval(() => {
    if (isPlayerToControllerSuppressed()) return;
    const state = player.getPlayerState?.() ?? YT_UNSTARTED;
    if (state !== YT_PLAYING && state !== YT_PAUSED) return;

    const playerTime = player.getCurrentTime();
    if (isStaleReading(playerTime)) return;
    const jump = Math.abs(playerTime - lastPlayerTime);
    if (jump > SEEK_JUMP_THRESHOLD) {
      scheduleSeekPropagation();
      lastPlayerTime = playerTime;
    } else {
      const drift = Math.abs(playerTime - mediaController.getCurrentTime());
      if (drift <= SYNC_DRIFT_THRESHOLD) {
        lastPlayerTime = playerTime;
      }
    }
  }, SEEK_POLL_INTERVAL_MS);
  if (typeof (pollSeek as unknown as NodeJS.Timeout).unref === "function") {
    (pollSeek as unknown as NodeJS.Timeout).unref();
  }

  return () => {
    unsubscribeTime();
    unsubscribePlaystate();
    clearInterval(pollSeek);
    if (pendingSeekTimeout) {
      clearTimeout(pendingSeekTimeout);
    }
    if (typeof player.removeEventListener === "function") {
      player.removeEventListener("onStateChange", handleStateChange);
    }
  };
}
