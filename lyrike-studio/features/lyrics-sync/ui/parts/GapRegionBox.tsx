import { memo, useCallback } from "react";
import { cn } from "@/shared/lib/utils";
import type { GapRegion } from "../../lib/gap-utils";
import { LYRICS_GAP } from "@/shared/config/constants";
import { GapPopup } from "./GapPopup";

interface GapRegionBoxProps {
  gap: GapRegion;
  pxPerSec: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onInsert: (gap: GapRegion) => void;
  onExtendPrev: ((gap: GapRegion) => void) | null;
  onExtendNext: ((gap: GapRegion) => void) | null;
  onDeselect: () => void;
  onDelete?: ((gap: GapRegion) => void) | null;
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
  const handleInsert = useCallback(() => onInsert(gap), [gap, onInsert]);
  const handleExtendPrev = useCallback(() => onExtendPrev?.(gap), [gap, onExtendPrev]);
  const handleExtendNext = useCallback(() => onExtendNext?.(gap), [gap, onExtendNext]);
  const handleDelete = useCallback(() => onDelete?.(gap), [gap, onDelete]);

  if (widthPx < LYRICS_GAP.MIN_GAP_PX) return null;

  const isInteractive = widthPx >= LYRICS_GAP.MIN_GAP_INTERACTIVE_PX;

  return (
    <div
      className={cn(
        "absolute top-1.5 bottom-1.5",
        // Gap visual — dashed border to distinguish from lyric regions
        "border rounded-control",
        "transition-all duration-150",
        isSelected
          ? "z-30 border-amber/70 bg-amber-25 shadow-selected"
          : "z-10 border-dashed border-white/15 bg-transparent",
        isInteractive &&
          !isSelected &&
          "hover:border-amber/50 hover:bg-white/5 cursor-pointer",
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
          <span className="select-none font-mono text-[10px] leading-none text-white/45">
            ···
          </span>
        </div>
      )}

      {/* Popup — only when selected */}
      {isSelected && isInteractive && (
        <GapPopup
          gap={gap}
          widthPx={widthPx}
          onInsert={handleInsert}
          onExtendPrev={onExtendPrev ? handleExtendPrev : null}
          onExtendNext={onExtendNext ? handleExtendNext : null}
          onDelete={onDelete ? handleDelete : null}
          onClose={onDeselect}
        />
      )}
    </div>
  );
});
