export type ShortcutContext = "global" | "noInput" | "lineSelected";

export type ShortcutDescription = {
  keys: string;
  context: ShortcutContext;
  label: string;
};

export const SHORTCUT_DESCRIPTIONS: ShortcutDescription[] = [
  { keys: "Space", context: "global", label: "Toggle playback" },
  { keys: "Left / Right", context: "global", label: "Seek +/-2s" },
  {
    keys: "Shift + Left / Right",
    context: "global",
    label: "Seek +/-5s",
  },
  { keys: "Up / Down", context: "noInput", label: "Navigate lines" },
  { keys: "Enter", context: "lineSelected", label: "Jump to line" },
  {
    keys: "Ctrl/Cmd + Enter",
    context: "lineSelected",
    label: "Insert line after",
  },
  {
    keys: "Delete / Backspace",
    context: "lineSelected",
    label: "Delete line",
  },
  {
    keys: "Ctrl/Cmd + Up/Down",
    context: "lineSelected",
    label: "Reorder line",
  },
  { keys: "Ctrl/Cmd + D", context: "lineSelected", label: "Split line" },
  {
    keys: "Ctrl/Cmd + M",
    context: "lineSelected",
    label: "Merge with previous",
  },
  { keys: "T", context: "noInput", label: "Tap sync" },
  { keys: "Q / W", context: "noInput", label: "Nudge start -/+" },
  { keys: "E / R", context: "noInput", label: "Nudge end -/+" },
  { keys: "Ctrl/Cmd + Z", context: "global", label: "Undo" },
  {
    keys: "Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y",
    context: "global",
    label: "Redo",
  },
  { keys: "Ctrl/Cmd + S", context: "global", label: "Save draft" },
  { keys: "Escape", context: "lineSelected", label: "Clear selection" },
  { keys: "?", context: "noInput", label: "Open shortcuts help" },
];
