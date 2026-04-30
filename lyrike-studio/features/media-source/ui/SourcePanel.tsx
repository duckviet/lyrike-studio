"use client";

import type { FetchMediaResponse } from "@/lib/api";
import type { PublishFlowState } from "@/features/publish";
import { PublishCard } from "@/features/publish";

type TabId = "source" | "timeline" | "lyrics";

interface SourcePanelProps {
  activeTab: TabId;
  sourceInput: string;
  setSourceInput: (value: string) => void;
  fetchState: "idle" | "loading" | "ready" | "error";
  sourceMessage: string;
  mediaInfo: FetchMediaResponse | null;
  publishState: PublishFlowState | null;
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
      className={`min-h-0 h-full p-3.5 flex flex-col gap-3 overflow-x-hidden overflow-y-auto bg-transparent border-0 shadow-none ${activeTab !== "source" ? "hidden md:flex" : ""}`}
    >
      <section className="border border-line rounded-2xl bg-bg-soft p-4 flex flex-col gap-3.5 shadow-sm">
        <div className="flex flex-col gap-2">
          <span className="text-[0.7rem] font-bold text-ink-light-soft uppercase tracking-widest">
            Source URL
          </span>
          <div className="relative">
            <input
              type="url"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              placeholder="Paste YouTube link here..."
              className={`w-full px-4 py-3 rounded-xl border bg-bg-input text-ink text-sm outline-none transition-colors ${
                fetchState === "error"
                  ? "border-danger"
                  : "border-line focus:border-primary-deep focus:ring-4 focus:ring-primary-10"
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 min-h-[42px] inline-flex items-center justify-center gap-2 tracking-tight bg-accent text-white border-none shadow-sm hover:bg-accent-deep"
            disabled={fetchState === "loading"}
            onClick={onFetch}
          >
            {fetchState === "loading" ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Fetching...
              </>
            ) : (
              "Fetch Media"
            )}
          </button>

          <button
            type="button"
            className="min-h-[42px] rounded-xl border border-accent/25 px-5 py-3 inline-flex items-center justify-center gap-2 text-sm font-semibold text-accent transition-all duration-150 cursor-pointer tracking-tight bg-bg-elev hover:bg-bg-soft hover:border-accent/40"
            disabled={
              !mediaInfo ||
              ["starting", "running", "queued"].includes(transcribeState)
            }
            onClick={onTranscribe}
          >
            {["starting", "running", "queued"].includes(transcribeState) ? (
              <>
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-accent/20 shadow-lg" />{" "}
                Working...
              </>
            ) : (
              "Transcribe"
            )}
          </button>
        </div>

        <div
          className={`border-l-4 border-line rounded-lg p-4 text-sm text-ink-light ${fetchState === "ready" ? "border-l-primary bg-primary-8 text-ink-light" : ""} ${fetchState === "error" ? "border-l-danger bg-danger-8 text-[#fca5a5]" : ""}`}
        >
          <p className="m-0">{sourceMessage}</p>
        </div>
      </section>

      {mediaInfo && (
        <>
          <section className="border border-line rounded-2xl bg-bg-soft p-4 flex flex-col gap-3.5 shadow-sm">
            <div className="flex items-center">
              <span className="inline-flex rounded-md bg-primary-10 text-primary px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider border border-primary-20">
                Metadata
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="min-w-0 grid gap-1">
                <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                  Track
                </span>
                <span className="text-sm font-medium text-ink-light break-words">
                  {mediaInfo.trackName || "Untitled"}
                </span>
              </div>
              <div className="min-w-0 grid gap-1">
                <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                  Artist
                </span>
                <span className="text-sm font-medium text-ink-light break-words">
                  {mediaInfo.artistName || "Unknown Artist"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line">
                <div className="min-w-0 grid gap-1">
                  <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                    Duration
                  </span>
                  <span className="text-sm font-medium text-ink-light break-words font-mono">
                    {formatTime(mediaInfo.duration)}
                  </span>
                </div>
                <div className="min-w-0 grid gap-1">
                  <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                    Status
                  </span>
                  <span className="text-sm font-medium text-primary capitalize">
                    {transcribeState}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {mediaInfo && (
            <PublishCard publishState={publishState} onPublish={onPublish} />
          )}
        </>
      )}
    </article>
  );
}
