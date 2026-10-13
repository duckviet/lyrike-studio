import { useTranslations } from "next-intl";
import { ScrollReveal } from "./ScrollReveal";

export function FeatureOverview() {
  const t = useTranslations("home.overview");

  return (
    <section className="bg-home-canvas pb-4 pt-16 md:pt-24">
      <div className="mx-auto grid max-w-[1440px] gap-x-16 px-6 md:px-8 lg:grid-cols-[1.2fr_1fr]">
        <ScrollReveal className="lg:col-span-2">
          <span className="home-eyebrow mb-6">
            {t("label")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="mb-6 max-w-3xl text-balance font-serif text-4xl font-normal leading-[1.2] text-home-forest md:text-5xl">
            {t("title1")}
            <br />
            <em className="italic">{t("title2")}</em>
          </h2>
        </ScrollReveal>

        <ScrollReveal className="lg:self-center" delay={200}>
          <p className="max-w-[680px] text-lg leading-relaxed text-home-charcoal">
            {t("description")}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
