"use client";

import { LoaderCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface EditorBusyOverlayProps {
  busy: boolean;
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Dims and makes its children inert while a long task runs, with a visible
 * spinner + label, so nothing can be edited mid-flight.
 */
export function EditorBusyOverlay({
  busy,
  label,
  children,
  className,
}: EditorBusyOverlayProps) {
  return (
    <div className={cn("relative min-h-0 flex-1 flex flex-col", className)}>
      <div
        aria-busy={busy}
        inert={busy}
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-opacity duration-150",
          busy && "opacity-50",
        )}
      >
        {children}
      </div>
      {busy && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-50 grid place-items-center bg-white/30"
        >
          <div className="inline-flex items-center gap-2 rounded-control border border-line bg-white px-4 py-2 text-sm font-medium text-ink-light shadow-sm">
            <LoaderCircle className="animate-spin" size={16} />
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
