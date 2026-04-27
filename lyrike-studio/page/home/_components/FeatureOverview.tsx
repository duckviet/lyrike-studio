import { useTranslations } from "next-intl";
import { ScrollReveal } from "./ScrollReveal";

export function FeatureOverview() {
  const t = useTranslations("home.overview");

  return (
    <section className="py-20 px-8 bg-linear-to-b from-cream to-cream-dark">
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
          <p className="text-lg leading-relaxed text-ink-soft max-w-[600px] mb-12">
            {t("description")}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300} direction="none">
          <div className="flex gap-6 mt-8">
            <div className="flex-1">
              <div className="bg-linear-to-b from-[#1a1d24] to-[#0f1115] rounded-2xl p-5 min-h-[180px] shadow-ink-md transition-transform duration-300 hover:-translate-y-2">
                <div className="flex items-center gap-0.5 h-24">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-linear-to-t from-primary to-primary/20 rounded-sm min-w-[2px]"
                      style={{ height: `${((i * 13) % 70) + 15}%` }}
                    />
                  ))}
                </div>
              </div>
              <span className="block mt-4 text-xs font-semibold uppercase text-ink-soft tracking-widest">{t("waveform")}</span>
            </div>
            <div className="flex-1 translate-y-10">
              <div className="bg-linear-to-b from-[#1a1d24] to-[#0f1115] rounded-2xl p-5 min-h-[180px] shadow-ink-md transition-transform duration-300 hover:-translate-y-2">
                <div className="relative h-24">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10" />
                  <div className="absolute top-[30%] h-[40%] bg-indigo/40 rounded border border-indigo/50" style={{ left: "5%", width: "25%" }} />
                  <div className="absolute top-[30%] h-[40%] bg-indigo/40 rounded border border-indigo/50" style={{ left: "35%", width: "35%" }} />
                  <div className="absolute top-[30%] h-[40%] bg-indigo/40 rounded border border-indigo/50" style={{ left: "75%", width: "20%" }} />
                </div>
              </div>
              <span className="block mt-4 text-xs font-semibold uppercase text-ink-soft tracking-widest">{t("timeline")}</span>
            </div>
            <div className="flex-1 translate-y-5">
              <div className="bg-linear-to-b from-[#1a1d24] to-[#0f1115] rounded-2xl p-5 min-h-[180px] shadow-ink-md transition-transform duration-300 hover:-translate-y-2">
                <div className="font-mono text-xs text-white/70 leading-relaxed">
                  <span className="block">[00:12.34] First line</span>
                  <span className="block">[00:15.67] Second line</span>
                  <span className="block">[00:18.90] Third line</span>
                </div>
              </div>
              <span className="block mt-4 text-xs font-semibold uppercase text-ink-soft tracking-widest">{t("export")}</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}