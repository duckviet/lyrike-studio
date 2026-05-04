import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";
import { ScrollReveal } from "./ScrollReveal";

export function Hero() {
  const t = useTranslations("home.hero");

  const waveBars = Array.from({ length: 100 }).map((_, i) => {
    const base = Math.sin(i * 0.45) * 38 + 52;
    const noise = Math.sin(i * 2.3) * 12;
    const random = i % 5 === 0 ? 18 : 0;
    const height = Math.max(18, Math.min(92, base + noise + random));

    return Math.round(height);
  });

  return (
    <section className="min-h-screen flex items-center px-8 py-20 md:py-32">
      <div className="max-w-[1200px] mx-auto w-full">
        {/* Text content giữ nguyên */}
        <ScrollReveal>
          <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-ink-soft mb-6">
            {t("label")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="font-serif text-4xl md:text-[56px] font-normal text-ink leading-[1.05] mb-8">
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
          <div className="flex items-center gap-5 mb-14">
            <Link
              href="/studio"
              className="bg-accent text-cream px-8 py-3.5 rounded-full font-medium shadow-lg hover:bg-accent-warm transition-all duration-200"
            >
              {t("cta")}
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-ink hover:text-accent transition-colors"
            >
              {t("demo")} <span>→</span>
            </a>
          </div>
        </ScrollReveal>

        {/* HERO UI - Cải tiến */}
        <ScrollReveal delay={300} direction="none">
          <div className="relative">
            <div className="bg-cream p-3 rounded-3xl shadow-ink-lg border border-ink/5">
              <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden">
                {/* Window Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27ca3f]" />
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Sidebar */}
                    <div className="w-20 shrink-0 bg-white/5 rounded-xl p-3 flex flex-col gap-2">
                      <div className="h-3 bg-white/10 rounded" />
                      <div className="h-3 bg-white/10 rounded" />
                      <div className="h-3 w-[60%] bg-white/10 rounded" />
                    </div>

                    {/* Waveform + Timeline */}
                    <div className="flex-1 flex flex-col gap-3">
                      {/* Waveform - Cải tiến */}
                      <div className="h-[180px] bg-[#111113] rounded-2xl p-4 flex items-center relative overflow-hidden border border-white/5">
                        <div className="flex items-center justify-center gap-[2px] w-full h-full">
                          {waveBars.map((height, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-linear-to-t from-emerald/90 to-emerald-300/80 rounded-lg transition-all"
                              style={{
                                height: `${height}%`,
                                animationDelay: `${i * 8}ms`,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Timeline Region - Cải tiến đẹp hơn */}
                      <div className="h-[58px] bg-[#1C1C1F] rounded-xl px-4 relative overflow-hidden border border-white/10">
                        <div className="absolute inset-0 flex items-center">
                          {[
                            {
                              left: "5%",
                              width: "11%",
                              label: "Dancing in the moonlight",
                              active: true,
                            },
                            { left: "18%", width: "13%", label: "Lyric 2" },
                            { left: "33%", width: "9%", label: "Lyric 3" },
                            { left: "44%", width: "14%", label: "Lyric 4" },
                            { left: "60%", width: "12%", label: "Lyric 5" },
                            { left: "74%", width: "15%", label: "Lyric 6" },
                          ].map((region, index) => (
                            <div
                              key={index}
                              className={`absolute top-1/2 -translate-y-1/2 h-9 rounded-lg px-3 flex items-center text-sm border transition-all
                                ${
                                  region.active
                                    ? "bg-white/10 border-white/30 text-white"
                                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                                }`}
                              style={{
                                left: region.left,
                                width: region.width,
                              }}
                            >
                              <span className="truncate text-[13px] font-medium">
                                {region.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Playhead */}
                        <div
                          className="playhead absolute top-0 bottom-0 w-[3px] bg-accent z-30 rounded-full"
                          style={{
                            boxShadow: "0 0 12px rgb(52 211 153 / 0.5)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <style jsx>{`
          .playhead {
            animation: playheadMove 2800ms linear 800ms infinite;
            left: 0;
          }

          @keyframes playheadMove {
            0% {
              left: 0%;
            }
            100% {
              left: 100%;
            }
          }

          /* Waveform animation tự nhiên hơn */
          .flex-1.bg-gradient-to-t {
            animation: wavePop 900ms cubic-bezier(0.23, 1, 0.32, 1) both;
          }

          @keyframes wavePop {
            from {
              transform: scaleY(0.2);
              opacity: 0.3;
            }
            to {
              transform: scaleY(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </section>
  );
}