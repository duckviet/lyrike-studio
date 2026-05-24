import { useTranslations } from "next-intl";
import { ScrollReveal } from "./ScrollReveal";
import { FeatureCards } from "./FeatureCards";

export function FeatureOverview() {
  const t = useTranslations("home.overview");

  return (
    <section className="bg-home-canvas py-20" id="demo">
      <div className="mx-auto max-w-[1200px] px-6 md:px-8">
        <ScrollReveal>
          <span className="mb-4 block text-xs font-semibold uppercase text-home-forest">
            {t("label")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="mb-6 max-w-3xl font-serif text-4xl font-normal leading-tight text-home-forest md:text-5xl">
            {t("title1")}
            <br />
            <em className="italic">{t("title2")}</em>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mb-12 max-w-[680px] text-lg leading-relaxed text-home-charcoal">
            {t("description")}
          </p>
        </ScrollReveal>
      </div>

      <FeatureCards />
    </section>
  );
}
