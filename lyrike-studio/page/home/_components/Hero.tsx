import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";
import { HeroPreview } from "./HeroPreview";

export function Hero() {
  const t = useTranslations("home.hero");
  return (
    <section className="px-6 pb-14 pt-12 md:px-8 md:pb-20 md:pt-20">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <p className="home-eyebrow mb-8">{t("label")}</p>
          <h1 className="text-balance font-serif text-5xl font-normal leading-[1.12] tracking-tight text-home-forest md:text-6xl xl:text-7xl">
            {t("title")}<span className="mt-1 block">{t("subtitle")}</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-home-charcoal md:text-lg">{t("description")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link className="home-action bg-home-forest text-home-canvas hover:bg-home-forest/90" href="/studio">
              {t("cta")}<ArrowUpRight aria-hidden="true" size={18} />
            </Link>
            <a className="home-action text-home-forest hover:bg-home-keylime" href="#demo">
              {t("demo")}<ArrowDown aria-hidden="true" size={16} />
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-home-charcoal"><Check aria-hidden="true" size={14} />{t("note")}</p>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}
