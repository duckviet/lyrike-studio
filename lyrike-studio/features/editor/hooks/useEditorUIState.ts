"use client";

import { useState, useCallback } from "react";
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

export function useEditorUIState(): [EditorUIState, EditorUIActions] {
  const [activeTab, setActiveTab] = useState<"source" | "timeline" | "lyrics">("timeline");
  const [zoomLevel, setZoomLevel] = useState<number>(WAVEFORM.DEFAULT_ZOOM_PX_PER_SEC);
  const [waveScrollLeft, setWaveScrollLeft] = useState(0);
  const [wavePxPerSec, setWavePxPerSec] = useState<number>(WAVEFORM.DEFAULT_ZOOM_PX_PER_SEC);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleZoomChange = useCallback((px: number) => {
    setZoomLevel(px);
    setWavePxPerSec(px);
  }, []);

  const handleScroll = useCallback((px: number) => {
    setWaveScrollLeft(px);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const state: EditorUIState = {
    activeTab,
    zoomLevel,
    waveScrollLeft,
    wavePxPerSec,
    loopEnabled,
    isSidebarCollapsed,
  };

  const actions: EditorUIActions = {
    setActiveTab,
    handleZoomChange,
    handleScroll,
    setLoopEnabled,
    toggleSidebar,
  };

  return [state, actions];
}