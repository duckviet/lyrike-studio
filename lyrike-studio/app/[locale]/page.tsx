import type { Metadata } from "next";
import { HomePage } from "@/page/home";

export const metadata: Metadata = {
  title: "Lyrike Studio - Precise, Not Complicated",
  description:
    "The creative side of syncing lyrics. LRC editor with waveform visualization, word-level karaoke, and LRCLIB publishing.",
};

export default function LandingPage() {
  return <HomePage />;
}