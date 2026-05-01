import { useTranslations } from "next-intl";
import { ScrollReveal } from "./ScrollReveal";

export function WorkflowSteps() {
  const t = useTranslations("home.workflow");

  const steps = [
    { number: "01", key: "steps.0" },
    { number: "02", key: "steps.1" },
    { number: "03", key: "steps.2" },
    { number: "04", key: "steps.3" },
  ];

  return (
    <section className="py-20 px-8 bg-cream-dark">
      <div className="max-w-[1200px] mx-auto text-center">
        <ScrollReveal>
          <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-ink-soft mb-4">
            {t("label")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-ink leading-snug mb-6">
            {t("title1")}
            <br />
            <em className="italic bg-cream px-1">{t("title2")}</em>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200} direction="none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative p-8 bg-cream rounded-2xl shadow-ink-sm">
                <span className="block font-serif text-5xl font-normal text-ink opacity-15 mb-4">
                  {step.number}
                </span>
                <h4 className="text-lg font-semibold text-ink mb-2">{t(`${step.key}.title`)}</h4>
                <p className="text-sm text-ink-soft m-0 leading-snug">{t(`${step.key}.description`)}</p>
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