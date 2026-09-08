"use client";

import { ArrowUpRight, AudioLines } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";

export function FinalCTA() {
  const t = useTranslations("home.finalCta");
  return (
    <section className="home-inverse bg-home-canvas px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 rounded-[14px] bg-home-forest p-8 text-home-canvas md:p-12 lg:flex-row lg:items-center">
        <div>
          <AudioLines aria-hidden="true" className="mb-6 text-home-mint" size={32} strokeWidth={1.5} />
          <h2 className="text-balance font-serif text-4xl font-normal leading-tight md:text-5xl">{t("title")}</h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-home-canvas/80">{t("description")}</p>
        </div>
        <Link className="home-action shrink-0 bg-home-canvas text-home-forest hover:bg-home-keylime" href="/studio">
          {t("cta")}<ArrowUpRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </section>
  );
}
