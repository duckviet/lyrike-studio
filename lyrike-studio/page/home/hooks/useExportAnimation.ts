import { useState, useEffect } from "react";

interface ExportLine {
  text: string;
  highlighted: boolean;
}

export function useExportAnimation() {
  const [lines, setLines] = useState<ExportLine[]>([
    { text: "[00:12.34]First line here", highlighted: false },
    { text: "[00:15.67]Second line here", highlighted: false },
    { text: "[00:18.90]Third line here", highlighted: false },
  ]);
  const [downloadState, setDownloadState] = useState<
    "idle" | "preparing" | "done"
  >("idle");

  useEffect(() => {
    const sequence = [
      { delay: 200, action: "highlight-0" },
      { delay: 800, action: "highlight-1" },
      { delay: 1400, action: "highlight-2" },
      { delay: 2000, action: "state-preparing" },
      { delay: 2600, action: "state-done" },
      { delay: 3800, action: "reset" },
    ];

    const timers = sequence.map(({ delay, action }) =>
      setTimeout(() => {
        if (action.startsWith("highlight-")) {
          const idx = parseInt(action.split("-")[1]);
          setLines((prev) =>
            prev.map((l, i) => ({
              ...l,
              highlighted: i === idx,
            })),
          );
        } else if (action === "state-preparing") {
          setDownloadState("preparing");
        } else if (action === "state-done") {
          setDownloadState("done");
        } else if (action === "reset") {
          setLines((prev) => prev.map((l) => ({ ...l, highlighted: false })));
          setDownloadState("idle");
        }
      }, delay),
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    const restartTimer = setInterval(() => {
      setLines((prev) => prev.map((l) => ({ ...l, highlighted: false })));
      setDownloadState("idle");
    }, 3800);

    return () => clearInterval(restartTimer);
  }, []);

  return { lines, downloadState };
}
