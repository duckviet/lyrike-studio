type ShortcutHandlers = {
  onSaveDraft: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePlayback: () => void;
  onTapSync: () => void;
  onSelectOffset: (offset: number) => void;
  onFineSeek: (deltaSeconds: number) => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function createGlobalKeydownHandler(
  handlers: ShortcutHandlers,
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const withCtrlOrMeta = event.ctrlKey || event.metaKey;

    if (withCtrlOrMeta && key === "s") {
      event.preventDefault();
      handlers.onSaveDraft();
      return;
    }

    if (withCtrlOrMeta && key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        handlers.onRedo();
      } else {
        handlers.onUndo();
      }
      return;
    }

    if (withCtrlOrMeta && key === "y") {
      event.preventDefault();
      handlers.onRedo();
      return;
    }

    if (isTypingTarget(event.target)) {
      return;
    }

    if (key === " ") {
      event.preventDefault();
      handlers.onTogglePlayback();
      return;
    }

    if (key === "enter" || key === "t") {
      event.preventDefault();
      handlers.onTapSync();
      return;
    }

    if (key === "arrowup") {
      event.preventDefault();
      handlers.onSelectOffset(-1);
      return;
    }

    if (key === "arrowdown") {
      event.preventDefault();
      handlers.onSelectOffset(1);
      return;
    }

    if (key === "arrowleft") {
      event.preventDefault();
      handlers.onFineSeek(-0.25);
      return;
    }

    if (key === "arrowright") {
      event.preventDefault();
      handlers.onFineSeek(0.25);
    }
  };
}
