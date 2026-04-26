"use client";

import { SourcePanel } from "@/features/media-source/ui/SourcePanel";

interface SourcePanelAdapterProps {
  activeTab: "source" | "timeline" | "lyrics";
  sourceInput: string;
  setSourceInput: (value: string) => void;
  fetchState: "idle" | "loading" | "ready" | "error";
  sourceMessage: string;
  mediaInfo: any;
  publishState: any;
  transcribeState: string;
  formatTime: (seconds: number) => string;
  onFetch: () => Promise<void>;
  onPublish: () => Promise<void>;
  onTranscribe: () => Promise<void>;
}

export function SourcePanelAdapter(props: SourcePanelAdapterProps) {
  return <SourcePanel {...props} />;
}