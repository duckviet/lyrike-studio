"use client";

import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCTA() {
  return (
    <section className="py-24 px-8 text-center">
      <div className="max-w-[600px] mx-auto">
        <ScrollReveal>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-ink leading-snug mb-6">
            Ready to sync?
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Link 
            href="/studio" 
            className="inline-block px-10 py-4 bg-accent text-white text-lg font-semibold rounded-full transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-green-200"
          >
            Open the editor — it's free
          </Link>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-base text-ink-soft mt-6">No account needed. No install. Just paste & go.</p>
        </ScrollReveal>
      </div>
    </section>
  );
}