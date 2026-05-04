import { useTranslations } from "next-intl";
import { ScrollReveal } from "./ScrollReveal";
import { FeatureCards } from "./FeatureCards";

export function FeatureOverview() {
  const t = useTranslations("home.overview");

  return (
    <section className="py-20 px-8 bg-linear-to-b from-cream-dark via-cream to-cream-dark">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-ink-soft mb-4">
            {t("label")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-ink leading-snug mb-6">
            {t("title1")}
            <br />
            <em className="italic bg-cream-dark px-1">{t("title2")}</em>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-lg leading-relaxed text-ink/65 max-w-[600px] mb-12">
            {t("description")}
          </p>
        </ScrollReveal>
      </div>

      <FeatureCards />
    </section>
  );
}