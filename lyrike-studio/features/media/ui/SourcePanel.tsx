"use client";

import { PublishCard } from "@/features/publish";

import { useEditorMediaStore } from "@/features/editor/store/editorMediaStore";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import {
  useLoadMedia,
  useTranscribeMutation,
  usePublishMutation,
} from "@/features/media/queries";
import { useCallback, useMemo, useState } from "react";
import { formatTime } from "@/shared/utils/formatters";
import Image from "next/image";
import { LoaderCircle, Radio, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { EditorButton, EditorStatusCallout } from "@/features/editor";

export function SourcePanel() {
  const t = useTranslations("editor.source");

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

  const [transcribeMode, setTranscribeMode] = useState<"normal" | "karaoke">(
    "normal",
  );

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
    } catch {
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
      await transcribeMutation.transcribeAsync({
        videoId: mediaInfo.videoId,
        mode: transcribeMode,
      });
      setTranscribeState("ready");
    } catch {
      setTranscribeState("error");
    }
  }, [
    mediaInfo,
    transcribeMode,
    transcribeMutation,
    setSourceMessage,
    setTranscribeState,
  ]);

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
    <article className="flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-transparent pl-1">
      <section className="flex flex-col gap-4 p-5 pl-0 pb-2">
        <div className="flex flex-col gap-2">
          <span className="text-[0.7rem] font-bold uppercase text-ink-light-soft">
            {t("url")}
          </span>
          <div className="relative">
            <input
              type="url"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              placeholder={t("placeholder")}
              className={`w-full rounded-control border bg-white px-4 py-3 text-sm text-ink outline-none transition-colors ${fetchState === "error"
                ? "border-danger"
                : "border-line focus:border-primary-deep focus:ring-4 focus:ring-primary-10"
                }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <EditorButton
            className="w-full"
            disabled={fetchState === "loading"}
            icon={
              fetchState === "loading" ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Radio size={16} />
              )
            }
            onClick={onFetch}
            variant="primary"
          >
            {fetchState === "loading" ? t("fetching") : t("fetch")}
          </EditorButton>

          <label className="flex items-center gap-2 text-sm text-ink-light">
            <span className="text-ink-light-soft">{t("transcribeMode")}</span>
            <select
              value={transcribeMode}
              onChange={(e) =>
                setTranscribeMode(e.target.value as "normal" | "karaoke")
              }
              className="rounded-control border border-line bg-white px-2 py-1 text-sm text-ink outline-none focus:border-primary-deep"
            >
              <option value="normal">{t("modeNormal")}</option>
              <option value="karaoke">{t("modeKaraoke")}</option>
            </select>
          </label>

          <EditorButton
            className="w-full"
            disabled={
              !mediaInfo ||
              ["starting", "running", "queued"].includes(transcribeState)
            }
            icon={
              ["starting", "running", "queued"].includes(transcribeState) ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )
            }
            onClick={onTranscribe}
            variant="secondary"
          >
            {["starting", "running", "queued"].includes(transcribeState)
              ? t("working")
              : t("transcribe")}
          </EditorButton>
        </div>

        <EditorStatusCallout
          tone={
            fetchState === "ready"
              ? "success"
              : fetchState === "error"
                ? "error"
                : fetchState === "loading"
                  ? "loading"
                  : "neutral"
          }
        >
          <p className="m-0">{sourceMessage}</p>
        </EditorStatusCallout>
      </section>

      {mediaInfo && (
        <>
          <section className="flex flex-col gap-4 pt-2">
            <div className="flex items-center">
              <span className="inline-flex rounded-md bg-primary-10 text-primary px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider border border-primary-20">
                {t("metadata")}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-4 items-start">
                <Image
                  width={112}
                  height={112}
                  src={`https://i.ytimg.com/vi/${mediaInfo.videoId}/mqdefault.jpg`}
                  className="aspect-square w-28 rounded-inner border border-line-soft bg-bg object-cover"
                  alt="Thumbnail"
                />
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="min-w-0 grid gap-1">
                    <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                      {t("track")}
                    </span>
                    <span className="text-sm font-medium text-ink-light wrap-break-word">
                      {mediaInfo.trackName || "Untitled"}
                    </span>
                  </div>
                  <div className="min-w-0 grid gap-1">
                    <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                      {t("artist")}
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
                    {t("duration")}
                  </span>
                  <span className="text-sm font-medium text-ink-light wrap-break-word font-mono">
                    {formatTime(mediaInfo.duration)}
                  </span>
                </div>
                <div className="min-w-0 grid gap-1">
                  <span className="text-[0.68rem] text-ink-light-soft font-bold uppercase tracking-wider">
                    {t("status")}
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
