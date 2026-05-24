import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type EditorStatusTone = "neutral" | "success" | "error" | "loading";

interface EditorStatusCalloutProps {
  tone?: EditorStatusTone;
  children: ReactNode;
  className?: string;
}

const toneClass: Record<EditorStatusTone, string> = {
  neutral: "border-l-line bg-bg text-ink-light-soft",
  success: "border-l-primary bg-primary-8 text-ink-light",
  error: "border-l-danger bg-danger-8 text-danger",
  loading: "border-l-amber bg-amber-soft text-ink-light",
};

export function EditorStatusCallout({
  tone = "neutral",
  children,
  className,
}: EditorStatusCalloutProps) {
  return (
    <div
      className={cn(
        "rounded-inner border border-line border-l-4 p-3 text-sm leading-relaxed",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
