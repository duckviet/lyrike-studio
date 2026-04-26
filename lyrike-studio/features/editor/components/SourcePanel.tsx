"use client";

import { FetchMediaResponse } from "@/lib/api";
import type { PublishFlowState } from "@/lib/app/publishFlow";

type TabId = "source" | "timeline" | "lyrics";

interface SourcePanelProps {
  activeTab: TabId;
  sourceInput: string;
  setSourceInput: (value: string) => void;
  fetchState: "idle" | "loading" | "ready" | "error";
  sourceMessage: string;
  mediaInfo: FetchMediaResponse | null;
  publishState: PublishFlowState;
  transcribeState: string;
  formatTime: (seconds: number) => string;
  onFetch: () => void;
  onPublish: () => void;
  onTranscribe: () => void;
}

export function SourcePanel({
  activeTab,
  sourceInput,
  setSourceInput,
  fetchState,
  sourceMessage,
  mediaInfo,
  publishState,
  transcribeState,
  formatTime,
  onFetch,
  onPublish,
  onTranscribe,
}: SourcePanelProps) {
  return (
    <article
      className={`source-panel ${activeTab !== "source" ? "hidden-mobile" : ""}`}
    >
      <section className="input-section">
        <div className="input-group">
          <span className="label">Source URL</span>
          <div className="input-wrapper">
            <input
              type="url"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              placeholder="Paste YouTube link here..."
              className={`w-full px-4 py-3 rounded-xl border bg-[#fefff5] text-[--ink] text-sm outline-none transition-colors ${
                fetchState === "error"
                  ? "border-[--danger]"
                  : "border-[--line] focus:border-[--primary-deep] focus:ring-4 focus:ring-[--primary]/18"
              }`}
            />
          </div>
        </div>

        <div className="action-row grid grid-cols-1 gap-2">
          <button
            type="button"
            className="btn-action primary"
            disabled={fetchState === "loading"}
            onClick={onFetch}
          >
            {fetchState === "loading" ? (
              <>
                <span className="spinner" /> Fetching...
              </>
            ) : (
              "Fetch Media"
            )}
          </button>

          <button
            type="button"
            className="btn-action secondary"
            disabled={
              !mediaInfo ||
              ["starting", "running", "queued"].includes(transcribeState)
            }
            onClick={onTranscribe}
          >
            {["starting", "running", "queued"].includes(transcribeState) ? (
              <>
                <span className="pulse" /> Working...
              </>
            ) : (
              "Transcribe"
            )}
          </button>
        </div>

        <div className={`status-box ${fetchState}`}>
          <p>{sourceMessage}</p>
        </div>
      </section>

      {mediaInfo && (
        <>
          <section className="info-card">
            <div className="card-header">
              <span className="tag">Metadata</span>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Track</span>
                <span className="info-value">
                  {mediaInfo.trackName || "Untitled"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Artist</span>
                <span className="info-value">
                  {mediaInfo.artistName || "Unknown Artist"}
                </span>
              </div>
              <div className="info-row grid grid-cols-2 gap-3 pt-3 border-t border-[--line]">
                <div className="info-item">
                  <span className="info-label">Duration</span>
                  <span className="info-value mono">
                    {formatTime(mediaInfo.duration)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value status-tag">
                    {transcribeState}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="publish-card">
            <div className="card-header">
              <span className="tag">Publish</span>
            </div>

            <button
              type="button"
              className="btn-action primary"
              disabled={publishState.status === "running"}
              onClick={onPublish}
            >
              {publishState.status === "running" ? (
                <>
                  <span className="spinner" /> Publishing...
                </>
              ) : (
                "Publish to LRCLIB"
              )}
            </button>

            <ol className="publish-steps" aria-label="Publish progress">
              {publishState.steps.map((step) => (
                <li key={step.id} data-status={step.status}>
                  <span className="step-dot" aria-hidden="true" />
                  <span>{step.label}</span>
                </li>
              ))}
            </ol>

            <p className={`publish-message ${publishState.status}`}>
              {publishState.message}
              {publishState.status === "running" &&
                publishState.currentStep === "pow" &&
                publishState.nonceAttempts > 0 && (
                  <>
                    {" "}
                    (attempts: {publishState.nonceAttempts.toLocaleString()})
                  </>
                )}
            </p>
          </section>
        </>
      )}
    </article>
  );
}
