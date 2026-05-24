import { cn } from "@/shared/lib/utils";
import type { TimelineRegion } from "../../_lib/homeDemoData";

interface TimelineRegionsMockProps {
  regions: TimelineRegion[];
  activeRegionId?: string;
  playheadPercent?: number;
  className?: string;
}

export function TimelineRegionsMock({
  regions,
  activeRegionId,
  playheadPercent,
  className,
}: TimelineRegionsMockProps) {
  return (
    <div
      className={cn(
        "relative h-16 overflow-hidden rounded-[14px] border border-home-border bg-home-canvas",
        className,
      )}
    >
      <div className="absolute inset-x-3 top-2 flex justify-between text-[11px] text-home-charcoal/70">
        <span>0:00</span>
        <span>1:00</span>
        <span>2:00</span>
      </div>

      <div className="absolute inset-x-3 bottom-2 top-7">
        {regions.map((region) => {
          const isActive = activeRegionId === region.id;

          return (
            <div
              className={cn(
                "absolute top-0 flex h-7 min-w-0 items-center rounded-[7px] border px-2 text-xs transition-colors",
                isActive
                  ? "border-home-forest bg-home-forest text-home-canvas"
                  : "border-home-border bg-home-keylime text-home-ink",
              )}
              key={region.id}
              style={{ left: `${region.left}%`, width: `${region.width}%` }}
            >
              <span className="truncate">{region.label}</span>
            </div>
          );
        })}
      </div>

      {typeof playheadPercent === "number" && (
        <div
          className="absolute inset-y-0 z-20 w-0.5 rounded-full bg-home-forest"
          style={{ left: `${Math.min(100, Math.max(0, playheadPercent))}%` }}
        />
      )}
    </div>
  );
}
