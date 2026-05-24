import { useEffect, useState } from "react";

export function useLoopProgress(durationMs: number) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    let frame = 0;
    let startTime = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      setElapsedMs((timestamp - startTime) % durationMs);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [durationMs]);

  return {
    elapsedMs,
    progress: elapsedMs / durationMs,
    percent: (elapsedMs / durationMs) * 100,
  };
}
