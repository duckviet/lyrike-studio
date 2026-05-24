import { useLoopProgress } from "./useLoopProgress";

interface ExportLine {
  text: string;
  highlighted: boolean;
}

export function useExportAnimation() {
  const { elapsedMs } = useLoopProgress(3800);
  const highlightedIndex =
    elapsedMs >= 1400 ? 2 : elapsedMs >= 800 ? 1 : elapsedMs >= 200 ? 0 : -1;
  const lines: ExportLine[] = [
    { text: "[00:12.34]First line here", highlighted: highlightedIndex === 0 },
    {
      text: "[00:15.67]Second line here",
      highlighted: highlightedIndex === 1,
    },
    { text: "[00:18.90]Third line here", highlighted: highlightedIndex === 2 },
  ];
  const downloadState =
    elapsedMs >= 2600 ? "done" : elapsedMs >= 2000 ? "preparing" : "idle";

  return { lines, downloadState };
}
