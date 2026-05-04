import { useEffect } from "react";

export type KeyComboHandler = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
  handler: (event: KeyboardEvent) => void;
};

function normalizeKey(key: string): string {
  if (key === "Spacebar" || key === "Space") return " ";
  return key.toLowerCase();
}

export function useKeyCombo(combos: KeyComboHandler[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: KeyboardEvent) => {
      const pressed = normalizeKey(event.key);

      for (const combo of combos) {
        if (
          pressed === normalizeKey(combo.key) &&
          event.ctrlKey === Boolean(combo.ctrl) &&
          event.shiftKey === Boolean(combo.shift) &&
          event.altKey === Boolean(combo.alt) &&
          event.metaKey === Boolean(combo.meta)
        ) {
          if (combo.preventDefault) {
            event.preventDefault();
          }
          combo.handler(event);
          return;
        }
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [combos, enabled]);
}
