import { cn } from "@/shared/lib/utils";

export interface EditorSegment<T extends string> {
  id: T;
  label: string;
  title?: string;
}

interface EditorSegmentedControlProps<T extends string> {
  items: EditorSegment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function EditorSegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className,
  size = "md",
}: EditorSegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-line bg-bg p-1",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => (
        <button
          aria-selected={value === item.id}
          className={cn(
            "rounded-sm border border-transparent font-semibold transition-colors flex-1 min-h-0 h-full",
            size === "sm" ? "px-3 text-[11px]" : "px-3 text-xs",
            value === item.id
              ? "bg-bg-elev text-primary"
              : "text-ink-light hover:bg-bg-elev/60 hover:text-primary",
          )}
          key={item.id}
          onClick={() => onChange(item.id)}
          role="tab"
          title={item.title}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
