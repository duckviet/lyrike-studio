"use client";
import { Hero } from "./_components/Hero";
import { MetricsBar } from "./_components/MetricsBar";
import { FeatureOverview } from "./_components/FeatureOverview";
import { FeatureCards } from "./_components/FeatureCards";
import { WorkflowSteps } from "./_components/WorkflowSteps";
import { FinalCTA } from "./_components/FinalCTA";
import { Footer } from "./_components/Footer";

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Hero />
      <MetricsBar />
      <FeatureOverview />
      <WorkflowSteps />
      <FinalCTA />
      <Footer />
    </div>
  );
};
