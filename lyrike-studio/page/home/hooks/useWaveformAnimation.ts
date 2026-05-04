import { useState, useEffect, useRef } from "react";

export function useWaveformAnimation() {
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [timeDisplay, setTimeDisplay] = useState("0:00");
  const [activeRegion, setActiveRegion] = useState(-1);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) % 4800; // 4.8s loop
      const position = (elapsed / 4800) * 100;

      setPlayheadPosition(position);

      // Time display
      const seconds = Math.floor((elapsed / 1000) % 60);
      const minutes = Math.floor(elapsed / 60000);
      setTimeDisplay(`${minutes}:${seconds.toString().padStart(2, "0")}`);

      // Region detection
      if (position > 10 && position < 35) setActiveRegion(0);
      else if (position > 40 && position < 75) setActiveRegion(1);
      else if (position > 85) setActiveRegion(2);
      else setActiveRegion(-1);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return { playheadPosition, timeDisplay, activeRegion };
}
