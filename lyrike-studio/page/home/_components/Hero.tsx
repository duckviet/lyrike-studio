import { useTranslations } from "next-intl";
import { Link } from "@/shared/lib/i18n/navigation";
import { heroWaveBars, timelineRegions } from "../_lib/homeDemoData";
import { useWaveformAnimation } from "../hooks";
import { ScrollReveal } from "./ScrollReveal";
import { DemoPanel } from "./visuals/DemoPanel";
import { TimelineRegionsMock } from "./visuals/TimelineRegionsMock";
import { WaveformMock } from "./visuals/WaveformMock";

export function Hero() {
  const t = useTranslations("home.hero");
  const waveform = useWaveformAnimation();

  return (
    <section className="px-6 py-10 md:px-8 md:py-14">
      <div className="mx-auto grid min-h-[calc(100vh-112px)] max-w-[1200px] items-center gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <ScrollReveal className="h-full">
          <div className="flex h-full min-h-[420px] flex-col justify-between rounded-[14px] bg-home-forest p-8 text-home-canvas md:p-10 lg:p-12">
            <div>
              <span className="mb-8 block text-xs font-semibold uppercase text-home-canvas/75">
                {t("label")}
              </span>
              <h1 className="font-serif text-5xl font-normal leading-[1.05] md:text-6xl">
                {t.rich("title", {
                  em: (chunks) => <em className="italic">{chunks}</em>,
                  br: () => <br />,
                })}
                <br />
                {t("subtitle")}
              </h1>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-home-canvas px-6 text-sm font-medium text-home-forest transition-colors hover:bg-home-keylime"
                href="/studio"
              >
                {t("cta")}
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-[14px] border border-home-canvas/25 px-6 text-sm font-medium text-home-canvas transition-colors hover:bg-home-canvas/10"
                href="#demo"
              >
                {t("demo")}
              </a>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="h-full" delay={120} direction="none">
          <DemoPanel
            bodyClassName="flex h-full flex-col gap-5"
            className="h-full min-h-[420px]"
            status={waveform.timeDisplay}
            title="Waveform timeline"
            variant="slate"
          >
            <div className="grid gap-4 md:grid-cols-[150px_1fr]">
              <aside className="rounded-[14px] border border-home-border bg-home-canvas p-4">
                <div className="mb-5 h-2 w-16 rounded-full bg-home-forest" />
                <div className="grid gap-3">
                  <div className="h-10 rounded-[10px] bg-home-keylime" />
                  <div className="h-10 rounded-[10px] bg-home-mint" />
                  <div className="h-10 rounded-[10px] bg-home-keylime/70" />
                </div>
              </aside>

              <div className="flex min-w-0 flex-col gap-4">
                <WaveformMock
                  activeRange={waveform.activeRange}
                  bars={heroWaveBars}
                  height="h-56"
                  playheadPercent={waveform.playheadPosition}
                />
                <TimelineRegionsMock
                  activeRegionId={waveform.activeRegionId}
                  playheadPercent={waveform.playheadPosition}
                  regions={timelineRegions}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {["Waveform", "Regions", "LRC export"].map((label) => (
                <div
                  className="rounded-[12px] border border-home-border bg-home-canvas p-4"
                  key={label}
                >
                  <div className="mb-3 h-1.5 w-10 rounded-full bg-home-forest" />
                  <p className="m-0 text-sm font-medium text-home-ink">{label}</p>
                </div>
              ))}
            </div>
          </DemoPanel>
        </ScrollReveal>
      </div>
    </section>
  );
}
