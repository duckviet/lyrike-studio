"use client";

import { cn } from "@/shared/lib/utils";

interface PlainLyricsEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PlainLyricsEditor({
  value,
  onChange,
  className,
}: PlainLyricsEditorProps) {
  return (
    <label
      className={cn(
        "grid gap-1",
        "text-[0.72rem] font-bold uppercase tracking-wider text-ink-light-soft",
        className,
      )}
    >
      Plain Lyrics
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full min-h-[260px] resize-y",
          "p-4 text-sm leading-relaxed font-[inherit]",
          "border border-line rounded-lg",
          "bg-bg text-ink-light",
          "outline-none transition-all duration-150",
          "focus:border-primary focus:ring-1 focus:ring-primary/20",
        )}
      />
    </label>
  );
}
