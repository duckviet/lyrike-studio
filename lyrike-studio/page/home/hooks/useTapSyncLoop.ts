import { useState, useEffect, useRef } from "react";

interface TapMark {
  index: number;
  timestamp: string;
  active: boolean;
}

export function useTapSyncLoop() {
  const [tapMarks, setTapMarks] = useState<TapMark[]>([
    { index: 0, timestamp: "00:15", active: false },
    { index: 1, timestamp: "00:35", active: false },
    { index: 2, timestamp: "00:55", active: false },
    { index: 3, timestamp: "01:15", active: false },
  ]);
  // Generate fixed waveform pattern instead of random
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    return (i * 31) % 100;
  });
  const [clock, setClock] = useState("00:00");
  const [waveformAnimating, setWaveformAnimating] = useState(false);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const sequence = [
      { delay: 0, action: "tap-0" },
      { delay: 600, action: "tap-1" },
      { delay: 1200, action: "tap-2" },
      { delay: 1800, action: "tap-3" },
      { delay: 2400, action: "waveform-pulse" },
      { delay: 3000, action: "reset" },
    ];

    const timers = sequence.map(({ delay, action }) =>
      setTimeout(() => {
        if (action.startsWith("tap-")) {
          const idx = parseInt(action.split("-")[1]);
          setTapMarks((prev) =>
            prev.map((m, i) => ({
              ...m,
              active: i === idx,
            })),
          );
        } else if (action === "waveform-pulse") {
          setWaveformAnimating(true);
          setTimeout(() => setWaveformAnimating(false), 400);
        } else if (action === "reset") {
          setTapMarks((prev) => prev.map((m) => ({ ...m, active: false })));
          setClock("00:00");
        }
      }, delay),
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) % 3000; // 3s loop
      const seconds = Math.floor(elapsed / 1000);
      setClock(`00:${seconds.toString().padStart(2, "0")}`);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return { tapMarks, clock, waveformBars, waveformAnimating };
}
