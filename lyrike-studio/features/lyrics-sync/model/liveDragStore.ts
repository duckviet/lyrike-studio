import { useSyncExternalStore } from "react";

export type LiveDragRange = {
  readonly start: number;
  readonly end: number;
};

const liveRanges = new Map<string, LiveDragRange>();
const listeners = new Map<string, Set<() => void>>();

const getRange = (id: string): LiveDragRange | null => liveRanges.get(id) ?? null;

const rangesEqual = (
  left: LiveDragRange | null,
  right: LiveDragRange,
): boolean => left?.start === right.start && left.end === right.end;

const notify = (id: string): void => {
  listeners.get(id)?.forEach((listener) => listener());
};

export function subscribeLiveDragRange(id: string, listener: () => void): () => void {
  const current = listeners.get(id) ?? new Set<() => void>();
  current.add(listener);
  listeners.set(id, current);

  return () => {
    current.delete(listener);
    if (current.size === 0) listeners.delete(id);
  };
}

export function getLiveLineRangeSnapshot(lineId: string): LiveDragRange | null {
  return getRange(lineId);
}

export function getLiveWordRangeSnapshot(wordId: string): LiveDragRange | null {
  return getRange(wordId);
}

export function setLiveLineRange(lineId: string, start: number, end: number): void {
  const next = { start, end };
  if (rangesEqual(getRange(lineId), next)) return;
  liveRanges.set(lineId, next);
  notify(lineId);
}

export function setLiveWordRange(wordId: string, start: number, end: number): void {
  const next = { start, end };
  if (rangesEqual(getRange(wordId), next)) return;
  liveRanges.set(wordId, next);
  notify(wordId);
}

export function clearLiveDragRange(id: string): void {
  if (!liveRanges.delete(id)) return;
  notify(id);
}

export function useLiveLineRange(lineId: string): LiveDragRange | null {
  return useSyncExternalStore(
    (listener) => subscribeLiveDragRange(lineId, listener),
    () => getLiveLineRangeSnapshot(lineId),
    () => null,
  );
}

export function useLiveWordRange(wordId: string): LiveDragRange | null {
  return useSyncExternalStore(
    (listener) => subscribeLiveDragRange(wordId, listener),
    () => getLiveWordRangeSnapshot(wordId),
    () => null,
  );
}
