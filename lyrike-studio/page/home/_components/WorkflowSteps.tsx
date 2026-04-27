"use client";

import { ScrollReveal } from "./ScrollReveal";

const steps = [
  { number: "01", title: "Paste URL", description: "Drop a YouTube link or upload audio file" },
  { number: "02", title: "Audio Ready", description: "We extract the audio and generate waveform" },
  { number: "03", title: "Sync Lines", description: "Edit timestamps or tap to sync manually" },
  { number: "04", title: "Export LRC", description: "Download your timed lyrics instantly" },
];

export function WorkflowSteps() {
  return (
    <section className="py-20 px-8 bg-cream-dark">
      <div className="max-w-[1200px] mx-auto text-center">
        <ScrollReveal>
          <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-ink-soft mb-4">
            THE WORKFLOW
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-ink leading-snug mb-6">
            Nothing here is rushed.
            <br />
            <em className="italic bg-cream px-1">Including the timing.</em>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200} direction="none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative p-8 bg-cream rounded-2xl shadow-ink-sm">
                <span className="block font-serif text-5xl font-normal text-ink opacity-15 mb-4">
                  {step.number}
                </span>
                <h4 className="text-lg font-semibold text-ink mb-2">{step.title}</h4>
                <p className="text-sm text-ink-soft m-0 leading-snug">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-ink-soft/20" />
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}