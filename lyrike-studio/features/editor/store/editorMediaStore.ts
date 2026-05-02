import { create } from "zustand";
import type { FetchMediaResponse, PeaksResponse } from "@/lib/api";
import type { PublishFlowState } from "@/features/publish";

export type LoadState = "idle" | "loading" | "ready" | "error";

export interface EditorMediaStoreState {
  sourceInput: string;
  sourceMessage: string;
  mediaInfo: FetchMediaResponse | null;
  peaksInfo: PeaksResponse | null;
  fetchState: LoadState;
  transcribeState: LoadState | string;
  peaksState: LoadState;
  peaksMessage: string;
  publishState: PublishFlowState | null;
}

export interface EditorMediaStoreActions {
  setSourceInput: (value: string) => void;
  setSourceMessage: (value: string) => void;
  setMediaInfo: (info: FetchMediaResponse | null) => void;
  setPeaksInfo: (info: PeaksResponse | null) => void;
  setFetchState: (state: LoadState) => void;
  setTranscribeState: (state: LoadState | string) => void;
  setPeaksState: (state: LoadState) => void;
  setPeaksMessage: (msg: string) => void;
  setPublishState: (state: PublishFlowState | null) => void;
}

export const useEditorMediaStore = create<EditorMediaStoreState & EditorMediaStoreActions>((set) => ({
  sourceInput: "",
  sourceMessage: "No source loaded yet.",
  mediaInfo: null,
  peaksInfo: null,
  fetchState: "idle",
  transcribeState: "idle",
  peaksState: "idle",
  peaksMessage: "No peaks generated yet.",
  publishState: null,

  setSourceInput: (sourceInput) => set({ sourceInput }),
  setSourceMessage: (sourceMessage) => set({ sourceMessage }),
  setMediaInfo: (mediaInfo) => set({ mediaInfo }),
  setPeaksInfo: (peaksInfo) => set({ peaksInfo }),
  setFetchState: (fetchState) => set({ fetchState }),
  setTranscribeState: (transcribeState) => set({ transcribeState }),
  setPeaksState: (peaksState) => set({ peaksState }),
  setPeaksMessage: (peaksMessage) => set({ peaksMessage }),
  setPublishState: (publishState) => set({ publishState }),
}));
