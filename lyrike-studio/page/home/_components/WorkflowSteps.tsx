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
    <section className="bg-home-keylime px-6 py-20 md:px-8">
      <div className="mx-auto max-w-[1200px] text-center">
        <ScrollReveal>
          <span className="mb-4 block text-xs font-semibold uppercase text-home-forest">
            {t("label")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="mb-6 font-serif text-4xl font-normal leading-tight text-home-forest md:text-5xl">
            {t("title1")}
            <br />
            <em className="italic">{t("title2")}</em>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={200} direction="none">
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                className="relative rounded-[14px] border border-home-border bg-home-canvas p-7 text-left"
                key={step.number}
              >
                <span className="mb-5 block font-serif text-5xl font-normal leading-none text-home-mint">
                  {step.number}
                </span>
                <h4 className="mb-2 text-lg font-semibold text-home-forest">
                  {t(`${step.key}.title`)}
                </h4>
                <p className="m-0 text-sm leading-relaxed text-home-charcoal">
                  {t(`${step.key}.description`)}
                </p>
                {index < steps.length - 1 && (
                  <div className="absolute left-full top-1/2 hidden h-px w-5 bg-home-border md:block" />
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
