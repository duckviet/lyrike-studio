import { create } from "zustand";
import { WAVEFORM } from "@/shared/config/constants";

export interface EditorUIState {
  activeTab: "source" | "timeline" | "lyrics";
  zoomLevel: number;
  waveScrollLeft: number;
  wavePxPerSec: number;
  loopEnabled: boolean;
  isSidebarCollapsed: boolean;
}

export interface EditorUIActions {
  setActiveTab: (tab: "source" | "timeline" | "lyrics") => void;
  handleZoomChange: (px: number) => void;
  handleScroll: (px: number) => void;
  setLoopEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
}

export const useEditorUIStore = create<EditorUIState & EditorUIActions>((set) => ({
  activeTab: "timeline",
  zoomLevel: WAVEFORM.DEFAULT_ZOOM_PX_PER_SEC,
  waveScrollLeft: 0,
  wavePxPerSec: WAVEFORM.DEFAULT_ZOOM_PX_PER_SEC,
  loopEnabled: false,
  isSidebarCollapsed: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  handleZoomChange: (px) => set({ zoomLevel: px, wavePxPerSec: px }),
  handleScroll: (px) => set({ waveScrollLeft: px }),
  setLoopEnabled: (value) =>
    set((state) => ({
      loopEnabled: typeof value === "function" ? value(state.loopEnabled) : value,
    })),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
