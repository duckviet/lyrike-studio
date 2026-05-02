import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine } from "@/entities/lyrics";

interface RegionBoxProps {
  line: LyricLine;
  isActive: boolean;
  isSelected: boolean;
  pxPerSec: number;
  isDragging?: boolean; // thêm prop

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
        "border rounded-md overflow-hidden",
        !isDragging && "transition-all duration-150", // ← chỉ transition khi không drag
        isActive
          ? "bg-primary-20 border-primary shadow-active"
          : isSelected
            ? "border-amber shadow-selected"
            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        zIndex: isActive ? 40 : isSelected ? 35 : 20,
      }}
      data-id={line.id}
    >
      <div
        className="w-3 shrink-0 bg-transparent cursor-ew-resize transition-colors duration-150 hover:bg-primary/50"
        onPointerDown={(e) => onBeginDrag(e, line, "start")}
      />
      <button
        type="button"
        className="flex-1 min-w-0 p-2 border-0 bg-transparent text-left cursor-grab text-xs font-medium text-white/80 overflow-hidden active:cursor-grabbing transition-colors hover:text-white"
        onPointerDown={(e) => onBeginDrag(e, line, "move")}
        onDragStart={(e) => e.preventDefault()} // ← thêm
        onClick={() => onSelect(line.id)}
        title={line.text}
      >
        <span className="block whitespace-nowrap overflow-hidden text-ellipsis select-none">
          {line.text}
        </span>
      </button>
      <div
        className="w-3 shrink-0 bg-transparent cursor-ew-resize transition-colors duration-150 hover:bg-primary/50"
        onPointerDown={(e) => onBeginDrag(e, line, "end")}
      />
    </div>
  );
});
