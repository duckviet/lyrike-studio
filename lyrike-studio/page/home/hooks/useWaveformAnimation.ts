import { timelineRegions } from "../_lib/homeDemoData";
import { useLoopProgress } from "./useLoopProgress";

export function useWaveformAnimation() {
  const { elapsedMs, percent } = useLoopProgress(4800);
  const seconds = Math.floor((elapsedMs / 1000) % 60);
  const minutes = Math.floor(elapsedMs / 60000);

  // Highlight the region the playhead is currently inside, so the
  // waveform range and the regions track always agree visually.
  const activeRegionIndex = timelineRegions.findIndex(
    (region) => percent >= region.left && percent <= region.left + region.width,
  );
  const activeRegion =
    activeRegionIndex >= 0 ? timelineRegions[activeRegionIndex] : undefined;
  const activeRange = activeRegion
    ? {
        start: activeRegion.left,
        end: activeRegion.left + activeRegion.width,
      }
    : undefined;

  return {
    playheadPosition: percent,
    timeDisplay: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    activeRegion: activeRegionIndex,
    activeRange,
    activeRegionId: activeRegion?.id,
  };
}
