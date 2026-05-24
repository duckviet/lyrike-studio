import { timelineRegions } from "../_lib/homeDemoData";
import { useLoopProgress } from "./useLoopProgress";

export function useWaveformAnimation() {
  const { elapsedMs, percent } = useLoopProgress(4800);
  const seconds = Math.floor((elapsedMs / 1000) % 60);
  const minutes = Math.floor(elapsedMs / 60000);
  const activeRegion =
    percent > 10 && percent < 35
      ? 0
      : percent > 40 && percent < 75
        ? 1
        : percent > 85
          ? 2
          : -1;
  const activeRange =
    activeRegion === 0
      ? { start: 10, end: 35 }
      : activeRegion === 1
        ? { start: 40, end: 75 }
        : activeRegion === 2
          ? { start: 85, end: 100 }
          : undefined;
  const activeRegionId =
    activeRegion >= 0 ? timelineRegions[activeRegion]?.id : undefined;

  return {
    playheadPosition: percent,
    timeDisplay: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    activeRegion,
    activeRange,
    activeRegionId,
  };
}
