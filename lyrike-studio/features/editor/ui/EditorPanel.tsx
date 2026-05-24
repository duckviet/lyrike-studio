import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface EditorPanelProps {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  contentClassName?: string;
  padded?: boolean;
}

export function EditorPanel({
  children,
  title,
  actions,
  className,
  bodyClassName,
  contentClassName,
  padded = false,
}: EditorPanelProps) {
  return (
    <section
      className={cn(
        "min-h-0 overflow-hidden rounded-outer bg-[#e5e8e5] text-ink-light",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex min-h-14 items-center justify-between gap-3 px-5 py-3">
          {typeof title === "string" ? (
            <h2 className="font-serif text-xl font-normal italic leading-none text-primary">
              {title}
            </h2>
          ) : (
            title
          )}
          {actions}
        </header>
      )}
      <div
        className={cn(
          "min-h-0",
          padded && "p-4",
          bodyClassName,
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
