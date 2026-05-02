import { useTranslations } from "next-intl";
import { useEditorUIStore } from "@/features/editor/store/editorUIStore";
import { useEditorMediaStore } from "@/features/editor/store/editorMediaStore";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { TIMING } from "@/shared/config/constants";
import { formatTime } from "@/shared/utils/formatters";
import { editorWaveformController } from "@/features/editor/store/editorControllers";
import { SplitSquareHorizontalIcon } from "lucide-react";

interface TimelineActionsBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  peakSource: "original" | "demucs";
  setPeakSource: (val: "original" | "demucs") => void;
  onTogglePlayback: () => void;
  onSeekBy: (delta: number) => void;
  onSaveDraft: () => void;
}

export function TimelineActionsBar({
  isPlaying,
  currentTime,
  duration,
  peakSource,
  setPeakSource,
  onTogglePlayback,
  onSeekBy,
  onSaveDraft,
}: TimelineActionsBarProps) {
  const t = useTranslations("dashboard.editor");

  const mediaInfo = useEditorMediaStore((s) => s.mediaInfo);

  const zoomLevel = useEditorUIStore((s) => s.zoomLevel);
  const onZoomChange = useEditorUIStore((s) => s.handleZoomChange);
  const loopEnabled = useEditorUIStore((s) => s.loopEnabled);
  const onToggleLoop = () =>
    useEditorUIStore.getState().setLoopEnabled((v) => !v);

  const onUndo = useLyricsStore((s) => s.undo);
  const onRedo = useLyricsStore((s) => s.redo);
  const canUndo = useLyricsStore((s) => s.canUndo);
  const canRedo = useLyricsStore((s) => s.canRedo);

  return (
    <div className="h-12 px-4 shrink-0 flex justify-between items-center gap-4 bg-bg-elev border-b border-line">
      <div className="min-w-0 flex items-center gap-2">
        <button
          type="button"
          className="w-24 h-8 px-4 bg-white rounded-lg border border-line inline-flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-150 cursor-pointer tracking-tight disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!mediaInfo?.audioReady}
          onClick={onTogglePlayback}
        >
          {isPlaying ? `⏸ ${t("pause")}` : `▶ ${t("play")}`}
        </button>
        <div className="inline-flex items-center gap-0.5 p-1 border border-line rounded-lg bg-bg">
          <button
            type="button"
            className="h-7 px-3 rounded border-0 bg-transparent text-ink-light-soft text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev"
            disabled={!mediaInfo?.audioReady}
            onClick={() => onSeekBy(-TIMING.SEEK_DELTA_SEC)}
          >
            −5s
          </button>
          <button
            type="button"
            className="h-7 px-3 rounded border-0 bg-transparent text-ink-light-soft text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev"
            disabled={!mediaInfo?.audioReady}
            onClick={() => onSeekBy(TIMING.SEEK_DELTA_SEC)}
          >
            +5s
          </button>
        </div>
        <div className="inline-flex items-center gap-0.5 p-1 border border-line rounded-lg bg-bg ml-1">
          <button
            type="button"
            className={`h-6 px-3 rounded border-0 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 ${peakSource === "original" ? "bg-bg-elev text-primary shadow-sm" : "bg-transparent text-ink-light-soft hover:bg-bg-elev"}`}
            onClick={() => setPeakSource("original")}
            title="Use original audio waveform"
          >
            Full
          </button>
          <button
            type="button"
            className={`h-6 px-3 rounded border-0 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 ${peakSource === "demucs" ? "bg-bg-elev text-primary shadow-sm" : "bg-transparent text-ink-light-soft hover:bg-bg-elev"}`}
            onClick={() => setPeakSource("demucs")}
            title="Use vocal-only waveform (requires transcription)"
          >
            Vocals
          </button>
        </div>
      </div>

      <div className="min-w-[180px] flex items-center justify-center gap-3">
        <span className="text-[0.66rem] font-bold text-ink-light-soft uppercase text-nowrap tracking-widest">
          {t("zoom")}
        </span>
        <input
          className="w-full max-w-[260px] h-1.5 border-0 rounded-full bg-bg appearance-none cursor-pointer p-0 accent-primary"
          type="range"
          min="20"
          max="240"
          step="2"
          value={zoomLevel}
          onChange={(e) => onZoomChange(Number(e.target.value))}
        />
      </div>

      <div className="min-w-0 flex items-center justify-end gap-2">
        <button
          type="button"
          className="flex items-center gap-2 h-8 px-3 rounded-lg border border-line bg-transparent text-ink-light-soft text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev"
          onClick={() => {
            const time = editorWaveformController.getHoverTime();
            useLyricsStore.getState().splitAtTime(time);
          }}
          title="Split line at hover position"
        >
          <SplitSquareHorizontalIcon size={13} /> {t("split") || "Split"}
        </button>
        <button
          type="button"
          className={`h-8 px-3 rounded-lg border border-line bg-transparent text-xs font-semibold cursor-pointer transition-all duration-150 ${loopEnabled ? "bg-primary text-[#002633] border-primary shadow-md" : "text-ink-light-soft hover:bg-bg-elev"}`}
          onClick={onToggleLoop}
        >
          {t("loop")}
        </button>
        <div className="h-8 min-w-[142px] px-3 inline-flex items-center justify-center border border-line rounded-lg bg-bg text-center text-primary font-mono text-sm font-medium tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <div className="inline-flex items-center gap-0.5 p-1 border border-line rounded-lg bg-bg">
          <button
            type="button"
            className="h-6 px-3 rounded border-0 bg-transparent text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev disabled:opacity-40 disabled:cursor-not-allowed text-ink-light-soft"
            disabled={!canUndo}
            onClick={onUndo}
          >
            {t("undo")}
          </button>
          <button
            type="button"
            className="h-6 px-3 rounded border-0 bg-transparent text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev disabled:opacity-40 disabled:cursor-not-allowed text-ink-light-soft"
            disabled={!canRedo}
            onClick={onRedo}
          >
            {t("redo")}
          </button>
          <button
            type="button"
            className="h-6 px-3 rounded border-0 bg-transparent text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-bg-elev text-ink-light-soft"
            onClick={onSaveDraft}
          >
            {t("draft")}
          </button>
        </div>
      </div>
    </div>
  );
}
