"use client";

import { cn } from "@/shared/lib/utils";

export type RegionEdge = "start" | "end";

interface RegionGripProps {
  edge: RegionEdge;
  /** Hit-area width in px. Shrink it on very short regions. */
  width?: number;
  onPointerDown: (event: React.PointerEvent) => void;
  className?: string;
}

/**
 * Single resize handle used by every timeline region (sync line, karaoke line
 * and karaoke word) so they look and behave identically.
 */
export function RegionGrip({
  edge,
  width = 12,
  onPointerDown,
  className,
}: RegionGripProps) {
  return (
    <div
      aria-hidden="true"
      data-region-grip={edge}
      className={cn(
        "group flex shrink-0 cursor-ew-resize items-center justify-center bg-transparent text-white/70",
        "transition-colors duration-150 hover:bg-primary/60",
        className,
      )}
      style={{ width, touchAction: "none" }}
      onPointerDown={onPointerDown}
    >
      <span className="pointer-events-none hidden select-none group-hover:block">
        |
      </span>
    </div>
  );
}

/** Grip width that never eats the whole region when it is tiny. */
export function gripWidthFor(regionWidth: number, max = 12): number {
  return Math.min(max, Math.max(4, regionWidth / 3));
}

/** Shared fill/border tone for lines (sync + karaoke line bar). */
export function lineTone(isActive: boolean, isSelected: boolean): string {
  if (isActive) return "bg-amber/40 text-white";
  if (isSelected) return "bg-amber/30 text-white border border-amber/40";
  return "bg-white/10 hover:bg-white/20";
}
