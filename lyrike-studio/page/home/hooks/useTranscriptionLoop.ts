import { useState, useEffect } from "react";

interface LyricLine {
  timestamp: string;
  text: string;
  visible: boolean;
}

export function useTranscriptionLoop() {
  const [lyrics, setLyrics] = useState<LyricLine[]>([
    { timestamp: "[00:05.00]", text: "♪ La la la la ♪", visible: false },
    {
      timestamp: "[00:08.50]",
      text: "Dancing in the moonlight",
      visible: false,
    },
    {
      timestamp: "[00:12.00]",
      text: "Spinning round and round",
      visible: false,
    },
  ]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sequence = [
      { delay: 300, lineIndex: 0 },
      { delay: 900, lineIndex: 1 },
      { delay: 1500, lineIndex: 2 },
      { delay: 2200, state: "done" }, // Mark as done
      { delay: 3500, state: "reset" }, // Reset for loop
    ];

    const timers = sequence.map(({ delay, lineIndex, state }) =>
      setTimeout(() => {
        if (state === "done") {
          setIsLoading(false);
          setProgress(100);
        } else if (state === "reset") {
          setLyrics((prev) => prev.map((l) => ({ ...l, visible: false })));
          setProgress(0);
          setIsLoading(true);
        } else if (typeof lineIndex === "number") {
          setLyrics((prev) => {
            const updated = [...prev];
            updated[lineIndex].visible = true;
            return updated;
          });
          setProgress((lineIndex + 1) * 33);
        }
      }, delay),
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    // Restart loop after 3.5s
    const restartTimer = setInterval(() => {
      setLyrics((prev) => prev.map((l) => ({ ...l, visible: false })));
      setProgress(0);
      setIsLoading(true);
    }, 3500);

    return () => clearInterval(restartTimer);
  }, []);

  return { lyrics, progress, isLoading };
}
