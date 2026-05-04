import { useEffect } from "react";
import {
  SHORTCUT_DESCRIPTIONS,
  type ShortcutContext,
} from "@/features/editor/config/keyboardShortcuts";

const contextLabel: Record<ShortcutContext, string> = {
  global: "Global",
  noInput: "No input focused",
  lineSelected: "Line selected",
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardShortcutsHelp({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="mx-auto mt-[8vh] max-w-3xl rounded-2xl border border-line bg-bg-soft shadow-glass"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink-light">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            className="h-8 w-8 rounded-lg border border-line bg-bg text-sm text-ink-light-soft transition-colors hover:bg-bg-elev"
            onClick={onClose}
            aria-label="Close"
          >
            x
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <ul className="grid gap-2">
            {SHORTCUT_DESCRIPTIONS.map((item) => (
              <li
                key={`${item.keys}:${item.label}`}
                className="grid grid-cols-[minmax(190px,220px)_1fr_auto] items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2"
              >
                <span className="font-mono text-xs text-primary">
                  {item.keys}
                </span>
                <span className="text-sm text-ink-light">{item.label}</span>
                <span className="rounded border border-line bg-bg-elev px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-light-soft">
                  {contextLabel[item.context]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
