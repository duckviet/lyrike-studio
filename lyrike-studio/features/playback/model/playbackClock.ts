import { useSyncExternalStore } from "react";
import { editorMediaController } from "@/features/editor/store/editorControllers";

const subscribeTime = (listener: () => void): (() => void) => {
  return editorMediaController.subscribe("timeupdate", () => {
    listener();
  });
};

const getTimeSnapshot = (): number => editorMediaController.getCurrentTime();

export function getPlaybackTime(): number {
  return getTimeSnapshot();
}

export function usePlaybackTimeSnapshot(roundToSeconds = false): number {
  return useSyncExternalStore(
    subscribeTime,
    () => {
      const time = getTimeSnapshot();
      return roundToSeconds ? Math.floor(time) : Math.round(time * 10) / 10;
    },
    () => 0,
  );
}
