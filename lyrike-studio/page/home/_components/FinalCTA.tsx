"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCTA() {
  const t = useTranslations("home.finalCta");

  return (
    <section className="bg-home-canvas px-6 py-24 text-center md:px-8">
      <div className="mx-auto max-w-[720px] rounded-[14px] border border-home-border bg-home-slate p-8 md:p-12">
        <ScrollReveal>
          <h2 className="mb-6 font-serif text-4xl font-normal leading-tight text-home-forest md:text-5xl">
            {t("title")}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-home-forest px-8 text-base font-medium text-home-canvas transition-colors hover:bg-home-forest/90"
            href="/studio"
          >
            {t("cta")}
          </Link>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-6 text-base text-home-charcoal">{t("description")}</p>
        </ScrollReveal>
      </div>
    </section>
  );
}
