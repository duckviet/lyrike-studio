import { cn } from "@/shared/lib/utils";

interface ActiveRange {
  start: number;
  end: number;
}

interface WaveformMockProps {
  bars: number[];
  activeRange?: ActiveRange;
  playheadPercent?: number;
  height?: string;
  variant?: "full" | "compact";
  className?: string;
}

export function WaveformMock({
  bars,
  activeRange,
  playheadPercent,
  height = "h-36",
  variant = "full",
  className,
}: WaveformMockProps) {
  const roundedClass = variant === "compact" ? "rounded-[3px]" : "rounded-[6px]";
  const gapClass = variant === "compact" ? "gap-0.5" : "gap-1";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] border border-home-border bg-home-canvas px-3 py-4",
        height,
        className,
      )}
    >
      {activeRange && (
        <div
          className="absolute inset-y-3 rounded-[10px] bg-home-keylime/70 ring-1 ring-home-forest/15"
          style={{
            left: `${activeRange.start}%`,
            width: `${activeRange.end - activeRange.start}%`,
          }}
        />
      )}

      <div className={cn("relative z-10 flex h-full items-center", gapClass)}>
        {bars.map((bar, index) => {
          const position = (index / Math.max(bars.length - 1, 1)) * 100;
          const isActive =
            activeRange &&
            position >= activeRange.start &&
            position <= activeRange.end;

          return (
            <span
              aria-hidden="true"
              className={cn(
                "min-w-[2px] flex-1 transition-colors duration-200",
                roundedClass,
                isActive ? "bg-home-forest" : "bg-home-forest/35",
              )}
              key={`${bar}-${index}`}
              style={{ height: `${bar}%` }}
            />
          );
        })}
      </div>

      {typeof playheadPercent === "number" && (
        <div
          className="absolute inset-y-2 z-20 w-0.5 rounded-full bg-home-forest"
          style={{ left: `${Math.min(100, Math.max(0, playheadPercent))}%` }}
        />
      )}
    </div>
  );
}
