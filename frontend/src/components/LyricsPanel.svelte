<script lang="ts">
  import LyricLineItem from "./LyricLineItem.svelte";
  import type { LyricsMeta, LyricsState } from "../lib/LyricsStore";
  import type { LyricLine } from "../lib/lyricsTimeline";

  export let activeTab: "source" | "timeline" | "lyrics";
  export let lyricsState: LyricsState;
  export let formatTime: (seconds: number) => string;
  export let onSetTab: (tab: LyricsState["tab"]) => void;
  export let onSeekLine: (line: LyricLine) => void;
  export let onEditLineText: (lineId: string, text: string) => void;
  export let onSelectLine: (lineId: string) => void;
  export let onReorder: (lineId: string, direction: "up" | "down") => void;
  export let onInsertAfter: (lineId: string) => void;
  export let onSplit: (lineId: string) => void;
  export let onMerge: (lineId: string) => void;
  export let onDelete: (lineId: string) => void;
  export let onNudge: (line: LyricLine, edge: "start" | "end", delta: number) => void;
  export let onSetPlainLyrics: (value: string) => void;
  export let onUpdateMetaField: (key: keyof LyricsMeta, value: string) => void;
  export let onImportLrc: (rawLrc: string) => void;
  export let onExportLrc: () => void;

  let fileInput: HTMLInputElement;
  let listRef: HTMLUListElement | null = null;

  // Track last scrolled id to avoid redundant scrolling
  let lastScrolledActiveId: string | null = null;
  let lastScrolledSelectedId: string | null = null;

  function handleImportClick() {
    fileInput?.click();
  }

  function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      onImportLrc(text);
    };
    reader.readAsText(file);

    input.value = "";
  }

  function scrollLineIntoView(lineId: string) {
    if (!listRef) return;
    const el = listRef.querySelector<HTMLElement>(`[data-id="${lineId}"]`);
    if (!el) return;

    // Scroll inside the list, not the whole page
    const listRect = listRef.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset =
      elRect.top - listRect.top - listRect.height / 2 + elRect.height / 2;

    listRef.scrollBy({ top: offset, behavior: "smooth" });
  }

  // Priority auto-scroll by activeLineId (playing)
  $: if (
    lyricsState.tab === "synced" &&
    listRef &&
    lyricsState.activeLineId &&
    lyricsState.activeLineId !== lastScrolledActiveId
  ) {
    lastScrolledActiveId = lyricsState.activeLineId;
    scrollLineIntoView(lyricsState.activeLineId);
  }

  // When user manually selects another line (not pushed by timeline) -> scroll to it
  $: if (
    lyricsState.tab === "synced" &&
    listRef &&
    lyricsState.selectedLineId &&
    lyricsState.selectedLineId !== lastScrolledSelectedId &&
    lyricsState.selectedLineId !== lyricsState.activeLineId
  ) {
    lastScrolledSelectedId = lyricsState.selectedLineId;
    scrollLineIntoView(lyricsState.selectedLineId);
  }
</script>

<article
  class="panel lyrics-column"
  class:hidden-mobile={activeTab !== "lyrics"}
>
  <div class="rightbar-head">
    <div class="lyrics-tabs" role="tablist" aria-label="Lyrics editor tabs">
      <button
        type="button"
        class:active={lyricsState.tab === "synced"}
        on:click={() => onSetTab("synced")}
      >
        Synced
      </button>
      <button
        type="button"
        class:active={lyricsState.tab === "plain"}
        on:click={() => onSetTab("plain")}
      >
        Plain
      </button>
      <button
        type="button"
        class:active={lyricsState.tab === "meta"}
        on:click={() => onSetTab("meta")}
      >
        Meta
      </button>
    </div>
    <div class="io-actions">
      <button class="icon-btn" title="Import LRC" on:click={handleImportClick}>⬆</button>
      <input type="file" accept=".lrc,.txt" bind:this={fileInput} on:change={handleFileChange} hidden />
      <button class="icon-btn" title="Export LRC" on:click={onExportLrc}>⬇</button>
    </div>
  </div>

  {#if lyricsState.tab === "synced"}
    <ul class="lyrics-list" bind:this={listRef}>
      {#each lyricsState.doc.syncedLines as line, index (line.id)}
        <LyricLineItem
          {line}
          {index}
          isActive={line.id === lyricsState.activeLineId}
          isSelected={line.id === lyricsState.selectedLineId}
          {formatTime}
          {onSeekLine}
          {onSelectLine}
          {onEditLineText}
          {onReorder}
          {onInsertAfter}
          {onSplit}
          {onMerge}
          {onDelete}
          {onNudge}
        />
      {/each}
    </ul>
  {:else if lyricsState.tab === "plain"}
    <label class="stack-field">
      Plain Lyrics
      <textarea
        class="plain-editor"
        value={lyricsState.doc.plainLyrics}
        on:input={(event) => onSetPlainLyrics((event.currentTarget as HTMLTextAreaElement).value)}
      ></textarea>
    </label>
  {:else}
    <div class="meta-grid">
      <label class="stack-field">
        Track
        <input
          type="text"
          value={lyricsState.doc.meta.title}
          on:input={(event) => onUpdateMetaField("title", (event.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <label class="stack-field">
        Artist
        <input
          type="text"
          value={lyricsState.doc.meta.artist}
          on:input={(event) => onUpdateMetaField("artist", (event.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <label class="stack-field">
        Album
        <input
          type="text"
          value={lyricsState.doc.meta.album}
          on:input={(event) => onUpdateMetaField("album", (event.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <label class="stack-field">
        By
        <input
          type="text"
          value={lyricsState.doc.meta.by}
          on:input={(event) => onUpdateMetaField("by", (event.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <label class="stack-field">
        Offset
        <input
          type="number"
          step="1"
          value={lyricsState.doc.meta.offset}
          on:input={(event) => onUpdateMetaField("offset", (event.currentTarget as HTMLInputElement).value)}
        />
      </label>
    </div>
  {/if}
</article>

<style>
  .lyrics-column {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    overflow: hidden;
    background: transparent;
    border: 0;
    box-shadow: none;
  }

  .rightbar-head {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .lyrics-tabs {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .lyrics-tabs button {
    border: 1px solid #ced6b7;
    border-radius: 999px;
    background: #f4f7e9;
    color: #3d491f;
    padding: 0.42rem 0.65rem;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .lyrics-tabs button.active {
    background: var(--indigo);
    border-color: var(--indigo);
    color: #fff;
  }

  .io-actions {
    display: flex;
    gap: 5px;
  }

  .icon-btn {
    width: 34px;
    height: 34px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #fefff5;
    color: var(--ink);
    display: inline-grid;
    place-items: center;
    font-weight: 800;
  }

  .icon-btn:hover {
    background: #f0f4dd;
  }

  .lyrics-list {
    min-height: 0;
    flex: 1;
    margin: 0;
    padding: 0 4px 0 0;
    list-style: none;
    display: grid;
    align-content: start;
    gap: 8px;
    overflow-y: auto;
    scroll-behavior: smooth;
  }

  .lyrics-list::-webkit-scrollbar {
    width: 8px;
  }

  .lyrics-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .lyrics-list::-webkit-scrollbar-thumb {
    background: #c9d3ad;
    border-radius: 999px;
  }

  .stack-field {
    display: grid;
    gap: 0.4rem;
    color: var(--ink-soft);
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .plain-editor,
  .meta-grid input {
    width: 100%;
    border: 1px solid #cfd8b7;
    border-radius: 10px;
    background: #fefff5;
    color: var(--ink);
    outline: none;
  }

  .plain-editor {
    min-height: 260px;
    resize: vertical;
    padding: 0.75rem 0.85rem;
    font-size: 0.88rem;
    line-height: 1.55;
    text-transform: none;
    letter-spacing: normal;
  }

  .meta-grid {
    display: grid;
    gap: 12px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .meta-grid input {
    padding: 0.65rem 0.75rem;
    font-size: 0.88rem;
  }

  .plain-editor:focus,
  .meta-grid input:focus {
    border-color: var(--primary-deep);
    box-shadow: 0 0 0 4px rgba(183, 223, 45, 0.18);
  }
</style>
