import { memo } from "react";
import { cn } from "@/shared/lib/utils";
import type { LyricLine } from "@/entities/lyrics";
import { useLiveLineRange } from "../../model/liveDragStore";
import { RegionGrip, gripWidthFor, lineTone } from "./RegionGrip";

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
  const liveRange = useLiveLineRange(line.id);
  const start = liveRange?.start ?? line.start;
  const end = liveRange?.end ?? line.end;
  const left = start * pxPerSec;
  const width = Math.max((end - start) * pxPerSec, 1);
  const gripWidth = gripWidthFor(width);

  return (
    <div
      className={cn(
        "absolute top-1.5 bottom-1.5 flex items-stretch will-change-transform",
        "rounded-control overflow-hidden border-0",
        !isDragging && "transition-colors duration-150",
        lineTone(isActive, isSelected),
      )}
      style={{
        transform: `translateX(${left}px)`,
        width: `${width}px`,
        zIndex: isActive ? 40 : isSelected ? 35 : 20,
      }}
      data-id={line.id}
    >
      <RegionGrip edge="start" width={gripWidth} onPointerDown={(e) => onBeginDrag(e, line, "start")} />
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
      <RegionGrip edge="end" width={gripWidth} onPointerDown={(e) => onBeginDrag(e, line, "end")} />
    </div>
  );
});
