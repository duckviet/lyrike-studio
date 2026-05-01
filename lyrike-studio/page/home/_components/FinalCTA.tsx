"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCTA() {
  const t = useTranslations("home.finalCta");

  return (
    <section className="py-24 px-8 text-center">
      <div className="max-w-[600px] mx-auto">
        <ScrollReveal>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-ink leading-snug mb-6">
            {t("title")}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Link 
            href="/studio" 
            className="inline-block px-10 py-4 bg-accent text-white text-lg font-semibold rounded-full transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-green-200"
          >
            {t("cta")}
          </Link>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-base text-ink-soft mt-6">{t("description")}</p>
        </ScrollReveal>
      </div>
    </section>
  );
}