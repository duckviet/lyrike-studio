import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type EditorButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type EditorButtonSize = "sm" | "md" | "icon";

interface EditorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: EditorButtonVariant;
  size?: EditorButtonSize;
  icon?: ReactNode;
}

const variantClass: Record<EditorButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-white hover:bg-primary-deep disabled:hover:bg-primary",
  secondary:
    "border-line bg-bg text-ink-light hover:border-primary/40 hover:bg-bg-elev/70 hover:text-primary",
  ghost:
    "border-transparent bg-transparent text-ink-light hover:bg-bg-elev/70 hover:text-primary",
  danger:
    "border-danger/20 bg-danger-8 text-danger hover:border-danger/40 hover:bg-danger-10",
};

const sizeClass: Record<EditorButtonSize, string> = {
  sm: "h-9 min-h-9 px-3 text-xs",
  md: "h-11 min-h-11 px-5 text-sm",
  icon: "size-9 p-0",
};

export function EditorButton({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...props
}: EditorButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      type={type}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
