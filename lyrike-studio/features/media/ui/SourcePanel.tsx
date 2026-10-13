"use client";

import { PublishTab, getPublishReadiness } from "@/features/publish";

import {
  isTranscribeActive,
  useEditorMediaStore,
} from "@/features/editor/store/editorMediaStore";
import { notify } from "@/shared/lib/notify";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import {
  useLoadMedia,
  useTranscribeMutation,
  usePublishMutation,
} from "@/features/media/queries";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileUp, LoaderCircle, Radio, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  EditorButton,
  EditorSegmentedControl,
  EditorStatusCallout,
} from "@/features/editor";

export function SourcePanel() {
  const t = useTranslations("editor.source");
  const tt = useTranslations("editor.toast");

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
  const setPublishState = useEditorMediaStore((s) => s.setPublishState);

  const [transcribeMode, setTranscribeMode] = useState<"normal" | "karaoke">(
    "normal",
  );

  const [fillGaps, setFillGaps] = useState({ enabled: false, minGap: 2 });
  const [leftTab, setLeftTab] = useState<"source" | "publish">("source");
  const [providedLyrics, setProvidedLyrics] = useState("");
  const lyricsFileInputRef = useRef<HTMLInputElement | null>(null);

  const hydrateFromMedia = useLyricsStore((s) => s.hydrateFromMedia);
  const importFromLrc = useLyricsStore((s) => s.importFromLrc);
  const exportToLrc = useLyricsStore((s) => s.exportToLrc);
  const setMeta = useLyricsStore((s) => s.setMeta);
  const doc = useLyricsStore((s) => s.doc);
  const selectedLineId = useLyricsStore((s) => s.selectedLineId);
  const activeLineId = useLyricsStore((s) => s.activeLineId);
  const tab = useLyricsStore((s) => s.tab);
  const isAutoSyncEnabled = useLyricsStore((s) => s.isAutoSyncEnabled);

  const canUndo = useLyricsStore((s) => s.canUndo);
  const canRedo = useLyricsStore((s) => s.canRedo);

  const lyricsState = useMemo(
    () => ({
      doc,
      selectedLineId,
      activeLineId,
      tab,
      isAutoSyncEnabled,
      canUndo,
      canRedo,
    }),
    [doc, selectedLineId, activeLineId, tab, isAutoSyncEnabled, canUndo, canRedo],
  );

  const loadMediaMutation = useLoadMedia();

  const transcribeMutation = useTranscribeMutation({
    onSuccess: (lrc) => {
      importFromLrc(lrc);
      setSourceMessage("Transcription completed.");
      notify.success("transcribe", tt("transcribeDone"));
    },
    onError: (error) => {
      if (error.message === "Aborted") {
        notify.dismiss("transcribe");
        return;
      }
      setSourceMessage(`Transcription failed: ${error.message}`);
      notify.error("transcribe", tt("transcribeFailed", { message: error.message }));
    },
    onStatusChange: (status) => {
      if (status === "starting" || status === "running" || status === "queued") {
        setSourceMessage(`Transcribing... ${status}`);
        notify.loading("transcribe", tt("transcribing", { status }));
      }
    },
  });

  const publishMutation = usePublishMutation({
    onSuccess: () => {
      setSourceMessage("Lyrics published successfully!");
      notify.success("publish", tt("publishDone"));
    },
    onError: (error) => {
      setSourceMessage(`Publish failed: ${error.message}`);
      notify.error("publish", tt("publishFailed", { message: error.message }));
    },
  });

  const transcribeAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      transcribeAbortControllerRef.current?.abort();
    };
  }, []);

  const onFetch = useCallback(async () => {
    if (!sourceInput.trim()) {
      setSourceMessage("Please enter a valid source URL.");
      setFetchState("error");
      notify.warning("fetch", tt("enterUrl"));
      return;
    }

    // Abort any running transcription job since the media is being changed
    transcribeAbortControllerRef.current?.abort();
    transcribeAbortControllerRef.current = null;

    // Clear old state & media to avoid stale UI
    setMediaInfo(null);
    setTranscribeState("idle");
    setPeaksState("idle");
    setPeaksMessage("No peaks generated yet.");

    setSourceMessage("Fetching metadata and caching audio...");
    setFetchState("loading");
    notify.loading("fetch", tt("fetching"));
    try {
      const data = await loadMediaMutation.mutateAsync(sourceInput);
      setMediaInfo(data.mediaInfo);
      setPeaksInfo(data.peaksInfo);
      setPeaksState(data.peaksState);
      setPeaksMessage(data.peaksMessage);
      hydrateFromMedia({
        duration: data.mediaInfo.duration,
        title: data.mediaInfo.trackName,
        artist: data.mediaInfo.artistName,
      });
      setSourceMessage("Media loaded successfully.");
      setFetchState("ready");
      notify.success("fetch", tt("fetchDone", { title: data.mediaInfo.trackName || "" }));
    } catch (error) {
      setFetchState("error");
      const message =
        error instanceof Error ? error.message : "Failed to fetch media.";
      setSourceMessage(message);
      notify.error("fetch", tt("fetchFailed", { message }));
    }
  }, [
    sourceInput,
    loadMediaMutation,
    tt,
    setSourceMessage,
    setFetchState,
    setMediaInfo,
    setPeaksInfo,
    setPeaksState,
    setPeaksMessage,
    setTranscribeState,
    hydrateFromMedia,
  ]);

  const onLyricsFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (file.size > 200_000) {
        setSourceMessage(t("lyricsFileTooLarge"));
        notify.error("lyrics-file", t("lyricsFileTooLarge"));
        return;
      }
      setProvidedLyrics(await file.text());
    },
    [setSourceMessage, t],
  );

  const onTranscribe = useCallback(async () => {
    if (!mediaInfo) {
      setSourceMessage("Load media before transcribing.");
      return;
    }
    // Abort any existing transcription first
    transcribeAbortControllerRef.current?.abort();
    const controller = new AbortController();
    transcribeAbortControllerRef.current = controller;

    setTranscribeState("loading");
    notify.loading("transcribe", tt("transcribing", { status: "starting" }));
    try {
      await transcribeMutation.transcribeAsync({
        videoId: mediaInfo.videoId,
        mode: transcribeMode,
        lyrics: providedLyrics,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setTranscribeState("ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "Aborted" || controller.signal.aborted) {
        notify.dismiss("transcribe");
        return;
      }
      setTranscribeState("error");
    }
  }, [
    mediaInfo,
    transcribeMode,
    providedLyrics,
    transcribeMutation,
    tt,
    setSourceMessage,
    setTranscribeState,
  ]);

  const onPublish = useCallback(async () => {
    if (!mediaInfo) {
      setSourceMessage("Load media before publishing.");
      return;
    }
    notify.loading("publish", tt("publishing"));
    try {
      await publishMutation.publishAsync({
        lyricsState,
        mediaInfo,
        exportToLrc,
        fillGaps: fillGaps.enabled ? { minGap: fillGaps.minGap } : null,
      });
    } catch (error) {
      console.warn("Publish failed:", error);
    }
  }, [lyricsState, mediaInfo, publishMutation, exportToLrc, fillGaps, tt, setSourceMessage]);

  const isPublishing = publishMutation.state?.status === "running";
  const isTranscribing = isTranscribeActive(String(transcribeState));
  const isBusy = fetchState === "loading" || isTranscribing || isPublishing;

  useEffect(() => {
    setPublishState(publishMutation.state);
  }, [publishMutation.state, setPublishState]);

  const activeLeftTab = mediaInfo ? leftTab : "source";
  const readiness = useMemo(
    () => getPublishReadiness(lyricsState, mediaInfo),
    [lyricsState, mediaInfo],
  );

  return (
    <article className="flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-transparent pl-1">
      <div className="pr-4 pt-3">
        <EditorSegmentedControl
          className="w-full"
          items={[
            { id: "source", label: t("tabSource") },
            {
              id: "publish",
              label: t("tabPublish"),
              title: mediaInfo ? undefined : t("noSource"),
            },
          ]}
          value={activeLeftTab}
          onChange={(id) => {
            if (id === "publish" && !mediaInfo) return;
            setLeftTab(id);
          }}
        />
      </div>

      {activeLeftTab === "source" && (
      <fieldset
        disabled={isBusy}
        className="m-0 flex min-w-0 flex-col gap-4 border-0 p-5 pl-0 pb-2 transition-opacity disabled:opacity-70"
      >
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
            disabled={isBusy}
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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-light-soft">{t("providedLyrics")}</span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-primary-deep hover:underline"
                  onClick={() => lyricsFileInputRef.current?.click()}
                >
                  <FileUp size={12} />
                  {t("uploadLyrics")}
                </button>
                {providedLyrics && (
                  <button
                    type="button"
                    className="text-xs text-ink-light-soft hover:underline"
                    onClick={() => setProvidedLyrics("")}
                  >
                    {t("clearLyrics")}
                  </button>
                )}
              </span>
            </div>
            <input
              ref={lyricsFileInputRef}
              type="file"
              accept=".txt,.lrc,text/plain"
              className="hidden"
              onChange={onLyricsFile}
            />
            <textarea
              value={providedLyrics}
              onChange={(e) => setProvidedLyrics(e.target.value)}
              maxLength={20000}
              rows={4}
              placeholder={t("providedLyricsPlaceholder")}
              className="w-full resize-y rounded-control border border-line bg-white px-2 py-1 text-sm text-ink outline-none focus:border-primary-deep"
            />
            {providedLyrics.trim() && (
              <p className="m-0 text-xs text-ink-light-soft">
                {t("providedLyricsHint")}
              </p>
            )}
          </div>

          <EditorButton
            className="w-full"
            disabled={
              !mediaInfo ||
              isBusy
            }
            icon={
              isTranscribing ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )
            }
            onClick={onTranscribe}
            variant="secondary"
          >
            {isTranscribing
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
      </fieldset>
      )}

      {activeLeftTab === "publish" && mediaInfo && (
        <fieldset
          disabled={isBusy}
          className="m-0 min-w-0 border-0 p-0 transition-opacity disabled:opacity-70"
        >
        <PublishTab
          mediaInfo={mediaInfo}
          meta={doc.meta}
          readiness={readiness}
          publishState={publishMutation.state}
          syncedLines={doc.syncedLines}
          fillGaps={fillGaps}
          onFillGapsChange={setFillGaps}
          onUpdateMetaField={setMeta}
          onPublish={onPublish}
        />
        </fieldset>
      )}
    </article>
  );
}
