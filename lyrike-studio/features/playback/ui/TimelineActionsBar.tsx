import { useTranslations } from "next-intl";
import { memo } from "react";
import { useEditorUIStore } from "@/features/editor/store/editorUIStore";
import { useEditorMediaStore } from "@/features/editor/store/editorMediaStore";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { usePlaybackTimeSnapshot } from "@/features/playback/model/playbackClock";
import { TIMING, WAVEFORM } from "@/shared/config/constants";
import { formatTime } from "@/shared/utils/formatters";
import { editorWaveformController } from "@/features/editor/store/editorControllers";
import {
  CircleQuestionMark,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Save,
  SplitSquareHorizontalIcon,
  Undo2,
} from "lucide-react";
import { EditorButton, EditorSegmentedControl } from "@/features/editor";

interface TimelineActionsBarProps {
  isPlaying: boolean;
  duration: number;
  peakSource: "original" | "demucs";
  setPeakSource: (val: "original" | "demucs") => void;
  onTogglePlayback: () => void;
  onSeekBy: (delta: number) => void;
  onSaveDraft: () => void;
  onOpenShortcutsHelp: () => void;
}

export const TimelineActionsBar = memo(function TimelineActionsBar({
  isPlaying,
  duration,
  peakSource,
  setPeakSource,
  onTogglePlayback,
  onSeekBy,
  onSaveDraft,
  onOpenShortcutsHelp,
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
    <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 overflow-x-auto px-3 py-2">
      <div className="flex min-w-max items-center gap-2">
        <EditorButton
          disabled={!mediaInfo?.audioReady}
          icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
          onClick={onTogglePlayback}
          size="sm"
          variant="primary"
        >
          {isPlaying ? t("pause") : t("play")}
        </EditorButton>
        <div className="inline-flex h-9 items-center rounded-control border border-line bg-bg p-0.5">
          <EditorButton
            className="h-full min-h-0 px-2"
            disabled={!mediaInfo?.audioReady}
            icon={<RotateCcw size={14} />}
            onClick={() => onSeekBy(-TIMING.SEEK_DELTA_SEC)}
            variant="ghost"
          >
            −5s
          </EditorButton>
          <EditorButton
            className="h-full min-h-0 px-2"
            disabled={!mediaInfo?.audioReady}
            onClick={() => onSeekBy(TIMING.SEEK_DELTA_SEC)}
            variant="ghost"
          >
            +5s
          </EditorButton>
        </div>
        <EditorSegmentedControl
          className="h-9 p-1"
          items={[
            {
              id: "original",
              label: "Full",
              title: "Use original audio waveform",
            },
            {
              id: "demucs",
              label: "Vocals",
              title: "Use vocal-only waveform (requires transcription)",
            },
          ]}
          onChange={setPeakSource}
          size="sm"
          value={peakSource}
        />
      </div>

      <div className="flex min-w-[180px] flex-1 items-center justify-center gap-3">
        <span className="text-nowrap text-[0.66rem] font-bold uppercase text-ink-light-soft">
          {t("zoom")}
        </span>
        <input
          className="w-full max-w-[260px] h-1.5 border-0 rounded-full bg-bg appearance-none cursor-pointer p-0 accent-primary"
          type="range"
          min={WAVEFORM.MIN_ZOOM}
          max={WAVEFORM.MAX_ZOOM}
          step={WAVEFORM.ZOOM_STEP}
          value={zoomLevel}
          onChange={(e) => onZoomChange(Number(e.target.value))}
        />
      </div>

      <div className="flex min-w-max items-center justify-end gap-2">
        <EditorButton
          icon={<SplitSquareHorizontalIcon size={14} />}
          onClick={() => {
            const time = editorWaveformController.getHoverTime();
            useLyricsStore.getState().splitAtTime(time);
          }}
          size="sm"
          title="Split line at hover position"
          variant="secondary"
        >
          {t("split") || "Split"}
        </EditorButton>
        <EditorButton
          onClick={onToggleLoop}
          size="sm"
          variant={loopEnabled ? "primary" : "secondary"}
        >
          {t("loop")}
        </EditorButton>
        <TimeDisplay duration={duration} />
        <div className="inline-flex h-9 items-center gap-0.5 rounded-control border border-line bg-bg p-0.5">
          <EditorButton
            className="h-full min-h-0 w-8 p-0"
            icon={<Undo2 size={14} />}
            disabled={!canUndo}
            onClick={onUndo}
            title={t("undo")}
            variant="ghost"
          >
            <span className="sr-only">{t("undo")}</span>
          </EditorButton>
          <EditorButton
            className="h-full min-h-0 w-8 p-0"
            icon={<Redo2 size={14} />}
            disabled={!canRedo}
            onClick={onRedo}
            title={t("redo")}
            variant="ghost"
          >
            <span className="sr-only">{t("redo")}</span>
          </EditorButton>
          <span className="mx-0.5 h-4 w-px bg-line" />
          <EditorButton
            className="h-full min-h-0 w-8 p-0"
            icon={<Save size={14} />}
            onClick={onSaveDraft}
            title={t("draft")}
            variant="ghost"
          >
            <span className="sr-only">{t("draft")}</span>
          </EditorButton>
        </div>
        <EditorButton
          aria-label="Keyboard shortcuts"
          className="h-9 w-9 min-h-0 min-w-0 p-0"
          icon={<CircleQuestionMark size={16} />}
          onClick={onOpenShortcutsHelp}
          variant="ghost"
        />
      </div>
    </div>
  );
});

function TimeDisplay({ duration }: { readonly duration: number }) {
  const currentTime = usePlaybackTimeSnapshot(true);

  return (
    <div className="inline-flex h-9 min-w-[130px] items-center justify-center rounded-control border border-line bg-bg px-3 text-center font-mono text-xs font-medium tabular-nums text-primary">
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>
  );
}
