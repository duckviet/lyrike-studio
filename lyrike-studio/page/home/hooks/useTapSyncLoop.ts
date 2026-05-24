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
  const seconds = Math.floor(elapsedMs / 1000);
  const tapMarks: TapMark[] = demoTapMarks.map((mark) => ({
    ...mark,
    active: activeIndex === mark.index,
  }));

  return {
    tapMarks,
    clock: `00:${seconds.toString().padStart(2, "0")}`,
    waveformBars: compactWaveBars,
    waveformAnimating: elapsedMs >= 2400 && elapsedMs < 2800,
  };
}
