import { ScrollReveal } from "./_components/ScrollReveal";
import { Hero } from "./_components/Hero";
import { FeatureOverview } from "./_components/FeatureOverview";
import { FeatureCards } from "./_components/FeatureCards";
import { WorkflowSteps } from "./_components/WorkflowSteps";
import { FinalCTA } from "./_components/FinalCTA";
import { Footer } from "./_components/Footer";

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Hero />
      <FeatureOverview />
      <FeatureCards />
      <WorkflowSteps />
      <FinalCTA />
      <Footer />
    </div>
  );
};
