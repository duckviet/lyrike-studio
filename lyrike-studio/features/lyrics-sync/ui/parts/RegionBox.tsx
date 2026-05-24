import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine } from "@/entities/lyrics";

interface RegionBoxProps {
  line: LyricLine;
  isActive: boolean;
  isSelected: boolean;
  pxPerSec: number;
  isDragging?: boolean;

  onBeginDrag: (
    event: React.PointerEvent,
    line: LyricLine,
    edge: "start" | "end" | "move",
  ) => void;
  onSelect: (id: string) => void;
}

export const RegionBox = memo(function RegionBox({
  line,
  isActive,
  isSelected,
  pxPerSec,
  isDragging,
  onBeginDrag,
  onSelect,
}: RegionBoxProps) {
  const left = line.start * pxPerSec;
  const width = Math.max((line.end - line.start) * pxPerSec, 1);

  return (
    <div
      className={cn(
        "absolute top-1.5 bottom-1.5 flex items-stretch",
        "rounded-control overflow-hidden border-0",
        !isDragging && "transition-colors duration-150",
        isActive
          ? "bg-amber/40 text-white"
          : isSelected
            ? "bg-amber/30 text-white border border-amber/40"
            : "bg-white/10 hover:bg-white/20",
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        zIndex: isActive ? 40 : isSelected ? 35 : 20,
      }}
      data-id={line.id}
    >
      <div
        className="w-3 shrink-0 bg-transparent cursor-ew-resize transition-colors duration-150 hover:bg-primary/60"
        onPointerDown={(e) => onBeginDrag(e, line, "start")}
      />
      <button
        type="button"
        className="min-w-0 flex-1 cursor-grab overflow-hidden border-0 bg-transparent p-2 text-left text-xs font-medium text-white/85 transition-colors hover:text-white active:cursor-grabbing"
        onPointerDown={(e) => onBeginDrag(e, line, "move")}
        onDragStart={(e) => e.preventDefault()}
        onClick={() => onSelect(line.id)}
        title={line.text}
      >
        <span className="block whitespace-nowrap overflow-hidden text-ellipsis select-none">
          {line.text}
        </span>
      </button>
      <div
        className="w-3 shrink-0 bg-transparent cursor-ew-resize transition-colors duration-150 hover:bg-primary/60"
        onPointerDown={(e) => onBeginDrag(e, line, "end")}
      />
    </div>
  );
});
