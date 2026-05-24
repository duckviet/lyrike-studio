import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface DemoPanelProps {
  children: ReactNode;
  title?: string;
  status?: string;
  className?: string;
  bodyClassName?: string;
  variant?: "cream" | "keylime" | "mint" | "slate";
}

const variantClass = {
  cream: "bg-home-canvas",
  keylime: "bg-home-keylime",
  mint: "bg-home-mint",
  slate: "bg-home-slate",
};

export function DemoPanel({
  children,
  title = "Lyrics Studio",
  status = "Live preview",
  className,
  bodyClassName,
  variant = "cream",
}: DemoPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-home-border text-home-ink",
        variantClass[variant],
        className,
      )}
    >
      <div className="flex min-h-12 items-center justify-between gap-4 border-b border-home-border bg-home-canvas/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-home-forest" />
            <span className="size-2.5 rounded-full bg-home-mint" />
            <span className="size-2.5 rounded-full bg-home-slate" />
          </div>
          <span className="truncate text-sm font-medium">{title}</span>
        </div>
        <span className="shrink-0 rounded-full border border-home-border bg-home-canvas px-3 py-1 text-xs text-home-charcoal">
          {status}
        </span>
      </div>
      <div className={cn("p-4 md:p-6", bodyClassName)}>{children}</div>
    </div>
  );
}
