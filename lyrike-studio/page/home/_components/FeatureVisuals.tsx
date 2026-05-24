import { Check, Download, FileText, LoaderCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  featureWaveBars,
  timelineRegions,
} from "../_lib/homeDemoData";
import {
  useExportAnimation,
  useTapSyncLoop,
  useTranscriptionLoop,
  useWaveformAnimation,
} from "../hooks";
import { DemoPanel } from "./visuals/DemoPanel";
import { TimelineRegionsMock } from "./visuals/TimelineRegionsMock";
import { WaveformMock } from "./visuals/WaveformMock";

export function WaveformFeatureVisual() {
  const waveform = useWaveformAnimation();

  return (
    <DemoPanel title="Region editor" status={waveform.timeDisplay} variant="mint">
      <div className="flex flex-col gap-4">
        <WaveformMock
          activeRange={waveform.activeRange}
          bars={featureWaveBars}
          playheadPercent={waveform.playheadPosition}
        />
        <TimelineRegionsMock
          activeRegionId={waveform.activeRegionId}
          playheadPercent={waveform.playheadPosition}
          regions={timelineRegions}
        />
      </div>
    </DemoPanel>
  );
}

export function TranscriptionFeatureVisual() {
  const transcription = useTranscriptionLoop();

  return (
    <DemoPanel title="Transcription" status={transcription.isLoading ? "Listening" : "Ready"} variant="slate">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-home-canvas">
            <div
              className="h-full rounded-full bg-home-forest transition-[width] duration-300"
              style={{ width: `${transcription.progress}%` }}
            />
          </div>
          <span className="min-w-12 text-right font-mono text-xs text-home-charcoal">
            {transcription.progress}%
          </span>
        </div>

        <div className="grid gap-3">
          {transcription.lyrics.map((lyric) => (
            <div
              className={cn(
                "grid grid-cols-[82px_1fr] items-center gap-3 rounded-[10px] border px-3 py-2 text-sm transition-all duration-300",
                lyric.visible
                  ? "border-home-forest/25 bg-home-canvas text-home-ink"
                  : "border-home-border bg-home-canvas/45 text-home-charcoal/55",
              )}
              key={lyric.timestamp}
            >
              <span className="font-mono text-xs text-home-forest">
                {lyric.timestamp}
              </span>
              <span className="truncate">{lyric.text}</span>
            </div>
          ))}
        </div>
      </div>
    </DemoPanel>
  );
}

export function TapSyncFeatureVisual() {
  const tapSync = useTapSyncLoop();
  const activeCount = tapSync.tapMarks.filter((mark) => mark.active).length;

  return (
    <DemoPanel title="Tap sync" status={tapSync.clock} variant="keylime">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-2">
          {tapSync.tapMarks.map((mark) => (
            <div
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-1 rounded-[10px] border bg-home-canvas transition-all duration-200",
                mark.active
                  ? "border-home-forest text-home-forest"
                  : "border-home-border text-home-charcoal",
              )}
              key={mark.index}
            >
              <span className="text-lg font-semibold">{mark.index + 1}</span>
              <span className="font-mono text-xs">{mark.timestamp}</span>
            </div>
          ))}
        </div>

        <WaveformMock
          activeRange={tapSync.waveformAnimating ? { start: 14, end: 88 } : undefined}
          bars={tapSync.waveformBars}
          height="h-16"
          variant="compact"
        />

        <div className="flex items-center justify-between text-xs text-home-charcoal">
          <span>Tap sequence</span>
          <span>{Math.max(activeCount, 1)}/4</span>
        </div>
      </div>
    </DemoPanel>
  );
}

export function ExportFeatureVisual() {
  const exportAnim = useExportAnimation();
  const isPreparing = exportAnim.downloadState === "preparing";
  const isDone = exportAnim.downloadState === "done";

  return (
    <DemoPanel title="LRC export" status="my-song.lrc" variant="mint">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-home-forest">
          <FileText size={18} strokeWidth={1.8} />
          <span className="font-mono text-sm">my-song.lrc</span>
        </div>

        <div className="rounded-[12px] border border-home-border bg-home-canvas p-3">
          <code className="grid gap-1 font-mono text-xs text-home-charcoal">
            {exportAnim.lines.map((line) => (
              <span
                className={cn(
                  "rounded-[6px] px-2 py-1 transition-colors duration-200",
                  line.highlighted && "bg-home-keylime text-home-forest",
                )}
                key={line.text}
              >
                {line.text}
              </span>
            ))}
          </code>
        </div>

        <button
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] px-4 py-2 text-sm font-medium transition-colors",
            isDone
              ? "bg-home-mint text-home-forest"
              : "bg-home-forest text-home-canvas",
          )}
          disabled={exportAnim.downloadState !== "idle"}
          type="button"
        >
          {isDone ? (
            <Check size={16} strokeWidth={1.8} />
          ) : isPreparing ? (
            <LoaderCircle className="animate-spin" size={16} strokeWidth={1.8} />
          ) : (
            <Download size={16} strokeWidth={1.8} />
          )}
          <span>{isDone ? "Downloaded" : isPreparing ? "Preparing" : "Download"}</span>
        </button>
      </div>
    </DemoPanel>
  );
}
