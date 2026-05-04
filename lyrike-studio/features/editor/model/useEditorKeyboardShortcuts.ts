import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLyricsStore } from "@/entities/lyrics/store/lyricsStore";
import { TIMING } from "@/shared/config/constants";
import { useKeyCombo, type KeyComboHandler } from "@/shared/hooks/useKeyCombo";

type Deps = {
  enabled?: boolean;
  currentTime: number;
  onTogglePlayback: () => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (time: number) => void;
  onSaveDraft: () => void;
  onOpenShortcutsHelp?: () => void;
};

const isInputFocused = () => {
  const active = document.activeElement;
  if (!active) return false;

  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement
  ) {
    return true;
  }

  return active instanceof HTMLElement && active.isContentEditable;
};

const isModalOpen = () => {
  return Boolean(
    document.querySelector(
      "dialog[open], [aria-modal='true'], [role='dialog']",
    ),
  );
};

export function useEditorKeyboardShortcuts({
  enabled = true,
  currentTime,
  onTogglePlayback,
  onSeekBy,
  onSeekTo,
  onSaveDraft,
  onOpenShortcutsHelp,
}: Deps) {
  const currentTimeRef = useRef(currentTime);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const getSelectedLine = useCallback(() => {
    const { selectedLineId, doc } = useLyricsStore.getState();
    if (!selectedLineId) return null;
    return doc.syncedLines.find((line) => line.id === selectedLineId) ?? null;
  }, []);

  const combos = useMemo<KeyComboHandler[]>(() => {
    return [
      {
        key: " ",
        handler: (event) => {
          if (isInputFocused() || isModalOpen()) return;
          event.preventDefault();
          onTogglePlayback();
        },
      },
      {
        key: "ArrowLeft",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          onSeekBy(-2);
        },
      },
      {
        key: "ArrowRight",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          onSeekBy(2);
        },
      },
      {
        key: "ArrowLeft",
        shift: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          onSeekBy(-5);
        },
      },
      {
        key: "ArrowRight",
        shift: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          onSeekBy(5);
        },
      },
      {
        key: "ArrowUp",
        preventDefault: true,
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          useLyricsStore.getState().selectByOffset(-1);
        },
      },
      {
        key: "ArrowDown",
        preventDefault: true,
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          useLyricsStore.getState().selectByOffset(1);
        },
      },
      {
        key: "Enter",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          const line = getSelectedLine();
          if (line) onSeekTo(line.start);
        },
      },
      {
        key: "Delete",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId)
            useLyricsStore.getState().deleteLine(selectedLineId);
        },
      },
      {
        key: "Backspace",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId)
            useLyricsStore.getState().deleteLine(selectedLineId);
        },
      },
      {
        key: "t",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          useLyricsStore.getState().tapSync(currentTimeRef.current);
        },
      },
      {
        key: "q",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          const line = getSelectedLine();
          if (line) {
            useLyricsStore
              .getState()
              .nudgeLine(line.id, "start", -TIMING.NUDGE_DELTA_SEC);
          }
        },
      },
      {
        key: "w",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          const line = getSelectedLine();
          if (line) {
            useLyricsStore
              .getState()
              .nudgeLine(line.id, "start", TIMING.NUDGE_DELTA_SEC);
          }
        },
      },
      {
        key: "e",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          const line = getSelectedLine();
          if (line) {
            useLyricsStore
              .getState()
              .nudgeLine(line.id, "end", -TIMING.NUDGE_DELTA_SEC);
          }
        },
      },
      {
        key: "r",
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          const line = getSelectedLine();
          if (line) {
            useLyricsStore
              .getState()
              .nudgeLine(line.id, "end", TIMING.NUDGE_DELTA_SEC);
          }
        },
      },
      {
        key: "Escape",
        handler: () => {
          if (isModalOpen()) return;
          useLyricsStore.getState().clearSelection();
        },
      },
      {
        key: "?",
        shift: true,
        preventDefault: true,
        handler: () => {
          if (isInputFocused() || isModalOpen()) return;
          onOpenShortcutsHelp?.();
        },
      },
      {
        key: "Enter",
        ctrl: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId)
            useLyricsStore.getState().insertAfter(selectedLineId);
        },
      },
      {
        key: "Enter",
        meta: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId)
            useLyricsStore.getState().insertAfter(selectedLineId);
        },
      },
      {
        key: "ArrowUp",
        ctrl: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId)
            useLyricsStore.getState().reorder(selectedLineId, "up");
        },
      },
      {
        key: "ArrowUp",
        meta: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId)
            useLyricsStore.getState().reorder(selectedLineId, "up");
        },
      },
      {
        key: "ArrowDown",
        ctrl: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId) {
            useLyricsStore.getState().reorder(selectedLineId, "down");
          }
        },
      },
      {
        key: "ArrowDown",
        meta: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId) {
            useLyricsStore.getState().reorder(selectedLineId, "down");
          }
        },
      },
      {
        key: "d",
        ctrl: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId)
            useLyricsStore.getState().splitLine(selectedLineId);
        },
      },
      {
        key: "d",
        meta: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId)
            useLyricsStore.getState().splitLine(selectedLineId);
        },
      },
      {
        key: "m",
        ctrl: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId) {
            useLyricsStore.getState().mergeWithPrevious(selectedLineId);
          }
        },
      },
      {
        key: "m",
        meta: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          const { selectedLineId } = useLyricsStore.getState();
          if (selectedLineId) {
            useLyricsStore.getState().mergeWithPrevious(selectedLineId);
          }
        },
      },
      {
        key: "z",
        ctrl: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          useLyricsStore.getState().undo();
        },
      },
      {
        key: "z",
        meta: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          useLyricsStore.getState().undo();
        },
      },
      {
        key: "z",
        ctrl: true,
        shift: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          useLyricsStore.getState().redo();
        },
      },
      {
        key: "z",
        meta: true,
        shift: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          useLyricsStore.getState().redo();
        },
      },
      {
        key: "y",
        ctrl: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          useLyricsStore.getState().redo();
        },
      },
      {
        key: "y",
        meta: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          useLyricsStore.getState().redo();
        },
      },
      {
        key: "s",
        ctrl: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          onSaveDraft();
        },
      },
      {
        key: "s",
        meta: true,
        preventDefault: true,
        handler: () => {
          if (isModalOpen()) return;
          onSaveDraft();
        },
      },
    ];
  }, [
    getSelectedLine,
    onOpenShortcutsHelp,
    onSaveDraft,
    onSeekBy,
    onSeekTo,
    onTogglePlayback,
  ]);

  useKeyCombo(combos, enabled);
}
