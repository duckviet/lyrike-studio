<script lang="ts">
  import type { LyricLine } from "../lib/lyricsTimeline";

  export let line: LyricLine;
  export let index: number;
  export let isActive: boolean;
  export let isPlaying: boolean;
  export let formatTime: (seconds: number) => string;

  export let onSeekLine: (line: LyricLine) => void;
  export let onSelectLine: (id: string) => void;
  export let onEditLineText: (id: string, text: string) => void;
  export let onReorder: (id: string, direction: "up" | "down") => void;
  export let onInsertAfter: (id: string) => void;
  export let onSplit: (id: string) => void;
  export let onMerge: (id: string) => void;
  export let onDelete: (id: string) => void;
  export let onNudge: (line: LyricLine, edge: "start" | "end", delta: number) => void;
</script>

<li class:active={isActive} class:playing={isPlaying} data-id={line.id}>
  <div class="line-head">
    <button
      type="button"
      class="timestamp"
      on:click={() => onSeekLine(line)}
    >
      {formatTime(line.start)}–{formatTime(line.end)}
    </button>
    <span class="line-index">#{index + 1}</span>
  </div>

  <input
    class="line-input"
    value={line.text}
    on:focus={() => onSelectLine(line.id)}
    on:input={(e) =>
      onEditLineText(line.id, (e.currentTarget as HTMLInputElement).value)}
  />

  <div class="line-tools">
    <div class="tool-group" role="group" aria-label="Order">
      <button on:click={() => onReorder(line.id, "up")} title="Move up">↑</button>
      <button on:click={() => onReorder(line.id, "down")} title="Move down">↓</button>
    </div>
    <div class="tool-group" role="group" aria-label="Structure">
      <button on:click={() => onInsertAfter(line.id)} title="Insert after">+</button>
      <button on:click={() => onSplit(line.id)} title="Split">⎘</button>
      <button on:click={() => onMerge(line.id)} title="Merge with previous">⊕</button>
      <button
        class="danger"
        on:click={() => onDelete(line.id)}
        title="Delete"
      >
        ✕
      </button>
    </div>
    <div class="tool-group nudge" role="group" aria-label="Nudge">
      <button on:click={() => onNudge(line, "start", -0.1)} title="Start −0.1s">−S</button>
      <button on:click={() => onNudge(line, "start", 0.1)} title="Start +0.1s">+S</button>
      <button on:click={() => onNudge(line, "end", -0.1)} title="End −0.1s">−E</button>
      <button on:click={() => onNudge(line, "end", 0.1)} title="End +0.1s">+E</button>
    </div>
  </div>
</li>

<style>
  li {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-areas: "head" "input" "tools";
    gap: 0.42rem;
    border-radius: 14px;
    border: 1px solid #d1dac0;
    background: rgba(255, 255, 251, 0.72);
    padding: 0.58rem 0.62rem;
    transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease,
      transform 140ms ease;
  }

  li:hover {
    background: #fefff5;
    border-color: #bcc99c;
  }

  li.active {
    border-color: var(--indigo);
    background: var(--indigo-soft);
    box-shadow: 0 0 0 2px rgba(74, 87, 178, 0.08);
  }

  li.playing {
    box-shadow: inset 0 0 0 2px var(--primary-deep), 0 6px 16px rgba(143, 181, 32, 0.12);
  }

  .line-head {
    grid-area: head;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .timestamp {
    border: 1px solid #c7cff4;
    border-radius: 999px;
    background: #f0f3ff;
    color: #354399;
    font-family: "IBM Plex Mono", "Consolas", monospace;
    font-size: 0.76rem;
    padding: 0.28rem 0.52rem;
    line-height: 1;
  }

  .timestamp:hover {
    background: #e6ebff;
  }

  .line-index {
    font-family: "IBM Plex Mono", "Consolas", monospace;
    color: #69728b;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .line-input {
    grid-area: input;
    width: 100%;
    border: 1px solid #ced8b8;
    border-radius: 10px;
    background: #fefff5;
    color: #243025;
    padding: 0.48rem 0.55rem;
    font-size: 0.9rem;
    outline: none;
  }

  .line-input:focus-visible {
    border-color: var(--indigo);
    box-shadow: 0 0 0 3px rgba(74, 87, 178, 0.14);
  }

  .line-tools {
    grid-area: tools;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.32rem;
    opacity: 1;
    transition: opacity 160ms ease;
  }

  li:not(:hover):not(.active) .line-tools {
    opacity: 0;
    pointer-events: none;
  }

  .tool-group {
    display: inline-flex;
    overflow: hidden;
    border: 1px solid #c7d2a4;
    border-radius: 9px;
    background: #eef5d5;
  }

  .tool-group button {
    min-width: 28px;
    border: 0;
    background: transparent;
    color: #2e460b;
    padding: 0.26rem 0.46rem;
    font-size: 0.76rem;
    font-weight: 850;
  }

  .tool-group button + button {
    border-left: 1px solid #c7d2a4;
  }

  .tool-group button:hover {
    background: #e3efbf;
  }

  .tool-group button.danger {
    color: var(--danger);
  }

  .tool-group button.danger:hover {
    background: #f7dddd;
  }

  .tool-group.nudge button {
    font-family: "IBM Plex Mono", "Consolas", monospace;
    font-size: 0.7rem;
  }
</style>
