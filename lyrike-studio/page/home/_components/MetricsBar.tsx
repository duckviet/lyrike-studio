import { ScrollReveal } from "./ScrollReveal";

const metrics = [
  { value: "LRC", label: "Industry standard" },
  { value: "No account", label: "No sign-up needed" },
  { value: "Free", label: "Open source-friendly" },
];

export function MetricsBar() {
  return (
    <section className="px-6 py-8 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="grid overflow-hidden rounded-[14px] border border-home-border bg-home-keylime md:grid-cols-3">
            {metrics.map((metric) => (
              <div
                className="border-home-border p-6 text-center first:border-l-0 md:border-l md:p-8 md:text-center"
                key={metric.value}
              >
                <div className="font-serif text-4xl font-normal leading-none text-home-forest">
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
