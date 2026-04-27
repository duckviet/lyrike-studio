import type { Metadata } from "next";
import { HomePage } from "@/page/home";

export const metadata: Metadata = {
  title: "LyricSync Editor - Precise, Not Complicated",
  description: "The creative side of syncing lyrics. Professional LRC editor with waveform visualization.",
};

export default function LandingPage() {
  return <HomePage />;
}