<script lang="ts">
  import { onDestroy } from "svelte";

  export let videoId: string | null = null;
  export let onTimeUpdate: (time: number) => void = () => {};
  export let onPlayStateChange: (playing: boolean) => void = () => {};
  export let onDurationChange: (duration: number) => void = () => {};

  export function play() {
    player?.playVideo();
  }
  export function pause() {
    player?.pauseVideo();
  }
  export function seekTo(time: number) {
    player?.seekTo(time, true);
  }
  export function seekBy(delta: number) {
    const current = player?.getCurrentTime() ?? 0;
    player?.seekTo(current + delta, true);
  }

  let container: HTMLDivElement;
  let player: any = null;
  let playerReady = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  function startPolling() {
    stopPolling();
    pollInterval = setInterval(() => {
      if (!player || !playerReady) return;
      try {
        const time = player.getCurrentTime() ?? 0;
        onTimeUpdate(time);
        const state = player.getPlayerState();
        onPlayStateChange(state === 1); // 1 = playing
      } catch (e) {
        // Ignore
      }
    }, 100);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  function loadYTApi(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).YT?.Player) {
        resolve();
        return;
      }
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = resolve;
    });
  }

  async function initPlayer(id: string) {
    await loadYTApi();
    stopPolling();
    if (player) {
      player.destroy();
      player = null;
    }
    playerReady = false;

    player = new (window as any).YT.Player(container, {
      videoId: id,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          playerReady = true;
          onDurationChange(player.getDuration() ?? 0);
          startPolling();
        },
        onStateChange: (e: any) => {
          onPlayStateChange(e.data === 1);
        },
      },
    });
  }

  let lastVideoId: string | null = null;
  $: if (videoId !== lastVideoId) {
    lastVideoId = videoId;
    if (videoId) {
      initPlayer(videoId);
    } else {
      stopPolling();
      if (player) {
        player.destroy();
        player = null;
      }
      playerReady = false;
    }
  }

  onDestroy(() => {
    stopPolling();
    player?.destroy();
    player = null;
  });
</script>

<div class="video-container">
  {#if videoId}
    <div bind:this={container} class="player-wrapper"></div>
  {:else}
    <div class="video-placeholder">
      <span class="icon">📺</span>
      <p>No source loaded</p>
    </div>
  {/if}
</div>

<style>
  .video-container {
    width: min(100%, 980px);
    aspect-ratio: 16 / 9;
    max-height: calc(100vh - 390px);
    min-height: 280px;
    position: relative;
    overflow: hidden;
    background: #000;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(0, 0, 0, 0.4);
  }

  .player-wrapper {
    width: 100%;
    height: 100%;
  }

  .video-container :global(iframe) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .video-placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 0.7rem;
    color: rgba(255, 255, 255, 0.72);
    background: radial-gradient(circle at 50% 35%, rgba(183, 223, 45, 0.18), transparent 28%),
      linear-gradient(135deg, #151821, #050609);
  }

  .video-placeholder p {
    margin: 0;
    font-size: 0.92rem;
    color: rgba(255, 255, 255, 0.62);
  }

  .icon {
    font-size: 2.25rem;
    opacity: 0.86;
  }

  @media (max-width: 760px) {
    .video-container {
      width: 100%;
      min-height: auto;
      max-height: none;
    }
  }
</style>
