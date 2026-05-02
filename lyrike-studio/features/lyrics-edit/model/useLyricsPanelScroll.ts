import { useRef, useEffect } from "react";
import type { LyricsState } from "@/entities/lyrics";

/**
 * Manages auto-scroll behaviour for the synced lyrics list.
 * Scrolls to the active line during playback, and to the selected
 * line when the user picks one (unless it is already the active line).
 */
export function useLyricsPanelScroll(lyricsState: LyricsState) {
  const listRef = useRef<HTMLUListElement>(null);
  const lastScrolledActiveIdRef = useRef<string | null>(null);
  const lastScrolledSelectedIdRef = useRef<string | null>(null);

  const scrollLineIntoView = (lineId: string) => {
    const list = listRef.current;
    if (!list) return;

    const el = list.querySelector<HTMLElement>(`[data-id="${lineId}"]`);
    if (!el) return;

    const listRect = list.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset =
      elRect.top - listRect.top - listRect.height / 2 + elRect.height / 2;

    list.scrollBy({ top: offset, behavior: "smooth" });
  };

  // Scroll to active line during playback
  useEffect(() => {
    const { tab, activeLineId } = lyricsState;
    if (
      tab !== "synced" ||
      !activeLineId ||
      activeLineId === lastScrolledActiveIdRef.current
    )
      return;

    lastScrolledActiveIdRef.current = activeLineId;
    scrollLineIntoView(activeLineId);
  }, [lyricsState.activeLineId, lyricsState.tab]);

  // Scroll to selected line when user selects (skip if same as active)
  useEffect(() => {
    const { tab, selectedLineId, activeLineId } = lyricsState;
    if (
      tab !== "synced" ||
      !selectedLineId ||
      selectedLineId === activeLineId ||
      selectedLineId === lastScrolledSelectedIdRef.current
    )
      return;

    lastScrolledSelectedIdRef.current = selectedLineId;
    scrollLineIntoView(selectedLineId);
  }, [lyricsState, lyricsState.selectedLineId, lyricsState.tab]);

  return { listRef };
}
