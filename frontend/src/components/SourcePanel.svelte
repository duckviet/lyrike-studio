<script lang="ts">
  import type { FetchMediaResponse } from "../lib/api";

  export let activeTab: "source" | "timeline" | "lyrics";
  export let sourceInput = "";
  export let fetchState: "idle" | "loading" | "ready" | "error";
  export let sourceMessage: string;
  export let mediaInfo: FetchMediaResponse | null;
  export let transcribeState: string;
  export let formatTime: (seconds: number) => string;
  export let onFetch: () => void;
  export let onTranscribe: () => void;
</script>

<article class="source-panel" class:hidden-mobile={activeTab !== "source"}>
  <section class="input-section">
    <div class="input-group">
      <span class="label">Source URL</span>
      <div class="input-wrapper">
        <input
          type="url"
          bind:value={sourceInput}
          placeholder="Paste YouTube link here..."
          class:error={fetchState === "error"}
        />
        <div class="input-glow"></div>
      </div>
    </div>

    <div class="action-row">
      <button 
        type="button" 
        class="btn-action primary" 
        disabled={fetchState === "loading"} 
        on:click={onFetch}
      >
        {#if fetchState === "loading"}
          <span class="spinner"></span> Fetching...
        {:else}
          Fetch Media
        {/if}
      </button>
      
      <button
        type="button"
        class="btn-action secondary"
        disabled={!mediaInfo || ["starting", "running", "queued"].includes(transcribeState)}
        on:click={onTranscribe}
      >
        {#if ["starting", "running", "queued"].includes(transcribeState)}
          <span class="pulse"></span> Working...
        {:else}
          Transcribe
        {/if}
      </button>
    </div>

    <div class="status-box" data-state={fetchState}>
      <p>{sourceMessage}</p>
    </div>
  </section>

  {#if mediaInfo}
    <section class="info-card">
      <div class="card-header">
        <span class="tag">Metadata</span>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Track</span>
          <span class="info-value">{mediaInfo.trackName || "Untitled"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Artist</span>
          <span class="info-value">{mediaInfo.artistName || "Unknown Artist"}</span>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">Duration</span>
            <span class="info-value mono">{formatTime(mediaInfo.duration)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status</span>
            <span class="info-value status-tag" data-state={transcribeState}>
              {transcribeState}
            </span>
          </div>
        </div>
      </div>
    </section>
  {/if}
</article>

<style>
  .source-panel {
    height: 100%;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-x: hidden;
    overflow-y: auto;
    background: transparent;
  }

  .input-section,
  .info-card {
    border: 1px solid var(--line);
    border-radius: 14px;
    background: rgba(255, 255, 251, 0.88);
    box-shadow: var(--shadow-sm);
  }

  .input-section {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 0.72rem;
    font-weight: 800;
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .input-wrapper {
    position: relative;
  }

  input {
    width: 100%;
    border: 1px solid #cfd8b7;
    border-radius: 10px;
    background: #fefff5;
    color: var(--ink);
    padding: 0.72rem 0.82rem;
    font-size: 0.88rem;
    outline: none;
    transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
  }

  input:focus {
    background: #fff;
    border-color: var(--primary-deep);
    box-shadow: 0 0 0 4px rgba(183, 223, 45, 0.18);
  }

  input.error {
    border-color: var(--danger);
  }

  .input-glow {
    display: none;
  }

  .action-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .btn-action {
    min-height: 42px;
    border-radius: 10px;
    border: 1px solid transparent;
    padding: 0.68rem 0.9rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    font-size: 0.84rem;
    font-weight: 800;
    color: var(--ink);
    transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
  }

  .btn-action:not(:disabled):hover {
    transform: translateY(-1px);
  }

  .btn-action.primary {
    background: linear-gradient(180deg, #d5f45f, var(--primary));
    color: #1e2c06;
    border-color: #a8c92a;
  }

  .btn-action.primary:hover:not(:disabled) {
    background: linear-gradient(180deg, #e0fa73, #c2e849);
  }

  .btn-action.secondary {
    background: #f3f6e7;
    color: #2d371d;
    border-color: var(--line);
  }

  .btn-action.secondary:hover:not(:disabled) {
    background: #edf3d4;
  }

  .btn-action:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  .status-box {
    border-left: 3px solid var(--line);
    border-radius: 10px;
    background: #f7f9ed;
    padding: 0.75rem 0.85rem;
    color: var(--ink-soft);
    font-size: 0.8rem;
    line-height: 1.45;
    word-break: break-word;
  }

  .status-box p {
    margin: 0;
  }

  .status-box[data-state="ready"] {
    border-left-color: #3b7b0d;
    background: #f3fbe9;
    color: #294b13;
  }

  .status-box[data-state="error"] {
    border-left-color: var(--danger);
    background: #fff4f2;
    color: #7a2a2a;
  }

  .info-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .card-header {
    display: flex;
    align-items: center;
  }

  .tag {
    display: inline-flex;
    border-radius: 6px;
    background: #eef3df;
    color: #62703e;
    padding: 0.25rem 0.48rem;
    font-size: 0.66rem;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .info-item {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .info-label {
    font-size: 0.68rem;
    color: var(--ink-soft);
    font-weight: 750;
  }

  .info-value {
    color: var(--ink);
    font-size: 0.86rem;
    font-weight: 650;
    line-height: 1.4;
    word-break: break-word;
  }

  .info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #edf0dd;
  }

  .mono {
    font-family: "IBM Plex Mono", "Consolas", monospace;
    font-size: 0.82rem;
  }

  .status-tag {
    text-transform: capitalize;
    color: var(--primary-deep);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(31, 44, 6, 0.22);
    border-top-color: #1f2c06;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .pulse {
    width: 8px;
    height: 8px;
    background: var(--primary-deep);
    border-radius: 50%;
    animation: pulse 1s infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    50% {
      opacity: 0.42;
    }
  }
</style>
