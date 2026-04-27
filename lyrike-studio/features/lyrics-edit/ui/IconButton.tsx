"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // becomes title + aria-label
  size?: "sm" | "md";
}

export function IconButton({
  label,
  size = "md",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-grid place-items-center",
        "border border-line rounded-lg bg-bg-elev",
        "text-ink-light font-semibold cursor-pointer",
        "transition-all duration-150",
        "hover:border-primary hover:text-primary",
        // Dark bg hover for light-on-dark panels; override per context if needed
        "hover:bg-bg-elev/80",
        size === "md" && "w-8 h-8 text-sm",
        size === "sm" && "w-6 h-6 text-xs",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
