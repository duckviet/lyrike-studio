"use client";

import { LyricsProvider } from "@/entities/lyrics/ui/LyricsProvider";
import StudioPage from "@/page/studio";

export default function Page() {
  return (
    <LyricsProvider>
      <StudioPage />
    </LyricsProvider>
  );
}
