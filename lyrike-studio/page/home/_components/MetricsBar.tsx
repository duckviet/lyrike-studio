import { useTranslations } from "next-intl";
import { ScrollReveal } from "./ScrollReveal";

interface Metric {
  value: string;
  label: string;
}

export function MetricsBar() {
  const t = useTranslations("home");
  const metrics = t.raw("metrics") as Metric[];

  return (
    <section className="px-6 py-8 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="grid border-y border-home-forest/15 md:grid-cols-3">
            {metrics.map((metric) => (
              <div
                className="border-home-forest/15 px-4 py-6 text-left first:border-l-0 md:border-l md:px-8"
                key={metric.value}
              >
                <div className="text-2xl font-medium tracking-tight text-home-forest">
                  {metric.value}
                </div>
                <div className="mt-2 text-sm text-home-charcoal">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default MetricsBar;
