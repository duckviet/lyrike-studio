import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";
import { ScrollReveal } from "./ScrollReveal";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="min-h-screen flex items-center px-8 py-32">
      <div className="max-w-[1200px] mx-auto w-full">
        <ScrollReveal>
          <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-ink-soft mb-6">
            {t("label")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="font-serif text-4xl md:text-6xl font-normal text-ink leading-tight mb-8">
            {t.rich("title", {
              em: (chunks) => (
                <em className="italic bg-cream-dark px-1">{chunks}</em>
              ),
              br: () => <br />,
            })}
            <br />
            {t("subtitle")}
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="flex items-center gap-6 mb-16">
            <Link
              href="/studio"
              className="bg-accent text-cream px-8 py-4 rounded-full font-medium shadow-green hover:bg-accent-warm transition-all duration-300"
            >
              {t("cta")}
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 text-base font-medium text-ink transition-colors duration-200 hover:text-accent"
            >
              {t("demo")}{" "}
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300} direction="none">
          <div className="relative">
            <div className="bg-cream p-4 rounded-2xl shadow-ink-lg border border-ink/5">
              <div className="bg-linear-to-b from-gray-900 to-gray-950 p-4 min-h-[320px]">
                <div className="flex gap-1.5 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27ca3f]" />
                </div>
                <div className="flex gap-4 h-60">
                  <div className="w-20 shrink-0 flex flex-col gap-2 p-2 bg-white/5 rounded-lg">
                    <div className="h-3 bg-white/10 rounded" />
                    <div className="h-3 bg-white/10 rounded" />
                    <div className="h-3 w-[60%] bg-white/10 rounded" />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex-1 flex items-center gap-0.5 p-3 bg-black/30 rounded-lg">
                      {Array.from({ length: 60 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-linear-to-t from-primary to-primary/30 rounded-sm min-w-[2px]"
                          style={{
                            height: `${((i * 17) % 70) + 15}%`,
                            animationDelay: `${i * 50}ms`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="h-[60px] relative bg-white/5 rounded-lg p-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-2 bottom-2 bg-indigo/40 border border-indigo/60 rounded text-[10px] text-white/80 flex items-center px-2 whitespace-nowrap overflow-hidden"
                          style={{ left: `${i * 12}%`, width: `${8 + i * 2}%` }}
                        >
                          Lyric {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
