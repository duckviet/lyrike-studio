<script lang="ts">
  import type { LyricLine } from "../lib/lyricsTimeline";

  interface Props {
    lines: LyricLine[];
    duration: number;
    pxPerSec: number;
    scrollLeft: number;
    activeLineId: string | null;
    selectedLineId: string | null;
    onSelectLine: (lineId: string) => void;
    onResize: (lineId: string, start: number, end: number) => void;
  }

  let {
    lines,
    duration,
    pxPerSec,
    scrollLeft,
    activeLineId,
    selectedLineId,
    onSelectLine,
    onResize,
  }: Props = $props();

  let trackEl: HTMLDivElement | null = $state(null);

  const totalWidth = $derived(Math.max(duration * pxPerSec, 0));

  type DragState = {
    lineId: string;
    edge: "start" | "end" | "move";
    originX: number;
    originStart: number;
    originEnd: number;
  };

  let drag: DragState | null = $state(null);

  function beginDrag(
    event: PointerEvent,
    line: LyricLine,
    edge: "start" | "end" | "move",
  ) {
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag = {
      lineId: line.id,
      edge,
      originX: event.clientX,
      originStart: line.start,
      originEnd: line.end,
    };
    onSelectLine(line.id);
  }

  function onPointerMove(event: PointerEvent) {
    if (!drag) return;
    const dx = event.clientX - drag.originX;
    const dt = dx / pxPerSec;

    let nextStart = drag.originStart;
    let nextEnd = drag.originEnd;

    if (drag.edge === "start") {
      nextStart = Math.min(drag.originEnd - 0.24, drag.originStart + dt);
      nextStart = Math.max(0, nextStart);
    } else if (drag.edge === "end") {
      nextEnd = Math.max(drag.originStart + 0.24, drag.originEnd + dt);
      nextEnd = Math.min(duration, nextEnd);
    } else {
      const len = drag.originEnd - drag.originStart;
      nextStart = Math.max(0, Math.min(duration - len, drag.originStart + dt));
      nextEnd = nextStart + len;
    }

    onResize(drag.lineId, nextStart, nextEnd);
  }

  function endDrag(event: PointerEvent) {
    if (!drag) return;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    drag = null;
  }
</script>

<div class="regions-track" bind:this={trackEl}>
  <div
    class="regions-canvas"
    style="width: {totalWidth}px; transform: translateX(-{scrollLeft}px);"
  >
    {#each lines as line (line.id)}
      {@const left = line.start * pxPerSec}
      {@const width = Math.max((line.end - line.start) * pxPerSec, 4)}
      <div
        class="region-box"
        role="presentation"
        class:active={line.id === activeLineId}
        class:selected={line.id === selectedLineId}
        style="left: {left}px; width: {width}px;"
        onpointermove={onPointerMove}
        onpointerup={endDrag}
        onpointercancel={endDrag}
      >
        <div
          class="handle handle-start"
          role="separator"
          aria-label="Resize start"
          onpointerdown={(e) => beginDrag(e, line, "start")}
        ></div>
        <button
          type="button"
          class="region-body"
          onpointerdown={(e) => beginDrag(e, line, "move")}
          onclick={() => onSelectLine(line.id)}
          title={line.text}
        >
          <span class="region-text">{line.text}</span>
        </button>
        <div
          class="handle handle-end"
          role="separator"
          aria-label="Resize end"
          onpointerdown={(e) => beginDrag(e, line, "end")}
        ></div>
      </div>
    {/each}
  </div>
</div>

<style>
  .regions-track {
    position: relative;
    height: 44px;
    flex-shrink: 0;
    overflow: hidden;
    border: 1px solid #cdd6b4;
    border-top: 0;
    border-radius: 0 0 12px 12px;
    background: #f7faec;
  }

  .regions-canvas {
    position: relative;
    height: 100%;
    will-change: transform;
  }

  .region-box {
    position: absolute;
    top: 6px;
    bottom: 6px;
    display: flex;
    align-items: stretch;
    border: 1.5px solid #1f2d18;
    border-radius: 6px;
    background: #fff;
    box-sizing: border-box;
    overflow: hidden;
    transition: background 120ms ease, border-color 120ms ease;
  }

  .region-box.selected {
    border-color: var(--indigo, #2f3ea8);
    box-shadow: 0 0 0 2px rgba(47, 62, 168, 0.18);
  }

  .region-box.active {
    background: #e8efff;
    border-color: var(--indigo, #2f3ea8);
  }

  .handle {
    width: 6px;
    flex-shrink: 0;
    background: transparent;
    cursor: ew-resize;
  }

  .handle:hover {
    background: rgba(47, 62, 168, 0.25);
  }

  .region-body {
    flex: 1;
    min-width: 0;
    padding: 0 6px;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: grab;
    font-size: 0.75rem;
    color: #1f2d18;
    overflow: hidden;
  }

  .region-body:active {
    cursor: grabbing;
  }

  .region-text {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
