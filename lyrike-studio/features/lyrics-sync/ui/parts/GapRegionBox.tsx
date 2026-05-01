import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { GapRegion } from "../../lib/gap-utils";
import { LYRICS_GAP } from "@/shared/config/constants";
import { GapPopup } from "./GapPopup";

interface GapRegionBoxProps {
  gap: GapRegion;
  pxPerSec: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onInsert: () => void;
  onExtendPrev: (() => void) | null;
  onExtendNext: (() => void) | null;
  onDeselect: () => void;
  onDelete?: (() => void) | null;
}

export const GapRegionBox = memo(function GapRegionBox({
  gap,
  pxPerSec,
  isSelected,
  onSelect,
  onInsert,
  onExtendPrev,
  onExtendNext,
  onDeselect,
  onDelete,
}: GapRegionBoxProps) {
  const left = gap.start * pxPerSec;
  const widthPx = Math.max((gap.end - gap.start) * pxPerSec, 0);

  if (widthPx < LYRICS_GAP.MIN_GAP_PX) return null;

  const isInteractive = widthPx >= LYRICS_GAP.MIN_GAP_INTERACTIVE_PX;

  return (
    <div
      className={cn(
        "absolute top-1.5 bottom-1.5",
        // Gap visual — dashed border to distinguish from lyric regions
        "border rounded-md",
        "transition-all duration-150",
        isSelected
          ? "z-30 border-white/30 bg-white/8 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
          : "z-10 border-dashed border-white/10 bg-transparent",
        isInteractive &&
          !isSelected &&
          "hover:border-white/25 hover:bg-white/5 cursor-pointer",
        !isInteractive && "pointer-events-none",
      )}
      style={{ left: `${left}px`, width: `${widthPx}px` }}
      onClick={
        isInteractive
          ? (e) => {
              e.stopPropagation();
              onSelect(gap.id);
            }
          : undefined
      }
    >
      {/* Center icon — only shown when wide enough */}
      {isInteractive && !isSelected && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-150">
          <span className="text-[10px] text-white/40 font-mono leading-none select-none">
            ···
          </span>
        </div>
      )}

      {/* Popup — only when selected */}
      {isSelected && isInteractive && (
        <GapPopup
          gap={gap}
          widthPx={widthPx}
          onInsert={onInsert}
          onExtendPrev={onExtendPrev}
          onExtendNext={onExtendNext}
          onDelete={onDelete ?? null}
          onClose={onDeselect}
        />
      )}
    </div>
  );
});
