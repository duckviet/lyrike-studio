import { compactWaveBars, tapMarks as demoTapMarks } from "../_lib/homeDemoData";
import { useLoopProgress } from "./useLoopProgress";

interface TapMark {
  index: number;
  timestamp: string;
  active: boolean;
}

export function useTapSyncLoop() {
  const { elapsedMs } = useLoopProgress(3000);
  const activeIndex =
    elapsedMs < 600
      ? 0
      : elapsedMs < 1200
        ? 1
        : elapsedMs < 1800
          ? 2
          : elapsedMs < 2400
            ? 3
            : -1;
  const tapMarks: TapMark[] = demoTapMarks.map((mark) => ({
    ...mark,
    active: activeIndex === mark.index,
  }));

  // Clock shows the timestamp of the line being tapped so it always
  // agrees with the marks; hold the last one once the sequence ends.
  const displayIndex = activeIndex >= 0 ? activeIndex : demoTapMarks.length - 1;
  const completedCount = activeIndex >= 0 ? activeIndex + 1 : demoTapMarks.length;

  return {
    tapMarks,
    clock: demoTapMarks[displayIndex].timestamp,
    completedCount,
    totalCount: demoTapMarks.length,
    waveformBars: compactWaveBars,
    waveformAnimating: elapsedMs >= 2400 && elapsedMs < 2800,
  };
}
