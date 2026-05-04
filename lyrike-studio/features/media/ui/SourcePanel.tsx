"use client";

import { PublishCard } from "@/features/publish";

import { useEditorUIStore } from "@/features/editor/store/editorUIStore";
import { useEditorMediaStore } from "@/features/editor/store/editorMediaStore";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import {
  useLoadMedia,
  useTranscribeMutation,
  usePublishMutation,
} from "@/features/media/queries";
import { useCallback, useMemo } from "react";
import { formatTime } from "@/shared/utils/formatters";
import Image from "next/image";

export function SourcePanel() {
  const activeTab = useEditorUIStore((s) => s.activeTab);

  const sourceInput = useEditorMediaStore((s) => s.sourceInput);
  const setSourceInput = useEditorMediaStore((s) => s.setSourceInput);
  const sourceMessage = useEditorMediaStore((s) => s.sourceMessage);
  const setSourceMessage = useEditorMediaStore((s) => s.setSourceMessage);
  const mediaInfo = useEditorMediaStore((s) => s.mediaInfo);
  const setMediaInfo = useEditorMediaStore((s) => s.setMediaInfo);
  const setPeaksInfo = useEditorMediaStore((s) => s.setPeaksInfo);
  const fetchState = useEditorMediaStore((s) => s.fetchState);
  const setFetchState = useEditorMediaStore((s) => s.setFetchState);
  const transcribeState = useEditorMediaStore((s) => s.transcribeState);
  const setTranscribeState = useEditorMediaStore((s) => s.setTranscribeState);
  const setPeaksState = useEditorMediaStore((s) => s.setPeaksState);
  const setPeaksMessage = useEditorMediaStore((s) => s.setPeaksMessage);

  const hydrateFromMedia = useLyricsStore((s) => s.hydrateFromMedia);
  const importFromLrc = useLyricsStore((s) => s.importFromLrc);
  const exportToLrc = useLyricsStore((s) => s.exportToLrc);
  const doc = useLyricsStore((s) => s.doc);
  const selectedLineId = useLyricsStore((s) => s.selectedLineId);
  const activeLineId = useLyricsStore((s) => s.activeLineId);
  const tab = useLyricsStore((s) => s.tab);
  const isAutoSyncEnabled = useLyricsStore((s) => s.isAutoSyncEnabled);

  const lyricsState = useMemo(
    () => ({
      doc,
      selectedLineId,
      activeLineId,
      tab,
      isAutoSyncEnabled,
      canUndo: false,
      canRedo: false,
    }),
    [doc, selectedLineId, activeLineId, tab, isAutoSyncEnabled],
  );

  const loadMediaMutation = useLoadMedia({
    onSuccess: (info) => {
      hydrateFromMedia({
        duration: info.duration,
        title: info.trackName,
        artist: info.artistName,
      });
    },
    onError: (error) => {
      setSourceMessage(error.message);
    },
  });

  const transcribeMutation = useTranscribeMutation({
    onSuccess: (lrc) => {
      importFromLrc(lrc);
      setSourceMessage("Transcription completed.");
    },
    onError: (error) => {
      setSourceMessage(`Transcription failed: ${error.message}`);
    },
    onStatusChange: (status) => {
      if (status === "starting" || status === "running") {
        setSourceMessage(`Transcribing... ${status}`);
      }
    },
  });

  const publishMutation = usePublishMutation({
    onSuccess: () => {
      setSourceMessage("Lyrics published successfully!");
    },
    onError: (error) => {
      setSourceMessage(`Publish failed: ${error.message}`);
    },
  });

  const onFetch = useCallback(async () => {
    if (!sourceInput.trim()) {
      setSourceMessage("Please enter a valid source URL.");
      setFetchState("error");
      return;
    }
    setSourceMessage("Fetching metadata and caching audio...");
    setFetchState("loading");
    try {
      const data = await loadMediaMutation.mutateAsync(sourceInput);
      setMediaInfo(data.mediaInfo);
      setPeaksInfo(data.peaksInfo);
      setPeaksState(data.peaksState);
      setPeaksMessage(data.peaksMessage);
      setFetchState("ready");
    } catch (e) {
      setFetchState("error");
    }
  }, [
    sourceInput,
    loadMediaMutation,
    setSourceMessage,
    setFetchState,
    setMediaInfo,
    setPeaksInfo,
    setPeaksState,
    setPeaksMessage,
  ]);

  const onTranscribe = useCallback(async () => {
    if (!mediaInfo) {
      setSourceMessage("Load media before transcribing.");
      return;
    }
    setTranscribeState("loading");
    try {
      await transcribeMutation.transcribeAsync(mediaInfo.videoId);
      setTranscribeState("ready");
    } catch (e) {
      setTranscribeState("error");
    }
  }, [mediaInfo, transcribeMutation, setSourceMessage, setTranscribeState]);

  const onPublish = useCallback(async () => {
    if (!mediaInfo) {
      setSourceMessage("Load media before publishing.");
      return;
    }
    await publishMutation.publishAsync({
      lyricsState,
      mediaInfo,
      exportToLrc,
    });
  }, [lyricsState, mediaInfo, publishMutation, exportToLrc, setSourceMessage]);

  return (
    <article
      className={`min-h-0 h-full flex flex-col overflow-x-hidden overflow-y-auto bg-transparent ${activeTab !== "source" ? "hidden md:flex" : ""}`}
    >
      <section className="p-4 flex flex-col gap-3.5 border-b border-line-soft">
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
          <section className="p-4 flex flex-col gap-3.5 border-b border-line-soft">
            <div className="flex items-center">
              <span className="inline-flex rounded-md bg-primary-10 text-primary px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider border border-primary-20">
                Metadata
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-4 items-start">
                <Image
                  width={112}
                  height={112}
                  src={`https://i.ytimg.com/vi/${mediaInfo.videoId}/mqdefault.jpg`}
                  className="w-28 aspect-square rounded-xl object-cover shadow-sm bg-bg-elev border border-line-soft"
                  alt="Thumbnail"
                />
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="min-w-0 grid gap-1">
                    <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                      Track
                    </span>
                    <span className="text-sm font-medium text-ink-light wrap-break-word">
                      {mediaInfo.trackName || "Untitled"}
                    </span>
                  </div>
                  <div className="min-w-0 grid gap-1">
                    <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                      Artist
                    </span>
                    <span className="text-sm font-medium text-ink-light wrap-break-word">
                      {mediaInfo.artistName || "Unknown Artist"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line">
                <div className="min-w-0 grid gap-1">
                  <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                    Duration
                  </span>
                  <span className="text-sm font-medium text-ink-light wrap-break-word font-mono">
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
            <PublishCard
              publishState={publishMutation.state}
              onPublish={onPublish}
            />
          )}
        </>
      )}
    </article>
  );
}
