import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import { ScrollReveal } from "./ScrollReveal";
import { DemoPanel } from "./visuals/DemoPanel";
import { UrlFetchMock } from "./visuals/UrlFetchMock";
import {
  ExportFeatureVisual,
  TapSyncFeatureVisual,
  TranscriptionFeatureVisual,
  WaveformFeatureVisual,
} from "./FeatureVisuals";

interface JourneyStep {
  title: string;
  description: string;
}

// Visuals follow the real studio flow: fetch -> transcribe -> tap -> fine-tune -> export.
const stepVisuals = [
  UrlFetchMock,
  TranscriptionFeatureVisual,
  TapSyncFeatureVisual,
  WaveformFeatureVisual,
  ExportFeatureVisual,
];

const stepSurfaces = [
  "bg-home-slate",
  "bg-home-mint",
  "bg-home-keylime",
  "bg-home-mint",
  "bg-home-slate",
];

export function JourneySection() {
  const t = useTranslations("home.journey");
  const steps = t.raw("steps") as JourneyStep[];

  return (
    <section className="bg-home-canvas py-16 md:py-20" id="demo">
      <div className="mx-auto max-w-[1200px] px-6 md:px-8">
        <ScrollReveal>
          <span className="home-eyebrow mb-4">
            {t("label")}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="mb-12 max-w-3xl font-serif text-4xl font-normal leading-tight text-home-forest md:text-5xl">
            {t("title1")}
            <br />
            <em className="italic">{t("title2")}</em>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <DemoPanel
            className="mb-14 md:mb-20"
            status={t("screenshotBadge")}
            title="Lyrike Studio"
            variant="cream"
          >
            <Image
              alt={t("screenshotAlt")}
              className="h-auto w-full rounded-[10px] border border-home-border"
              height={1000}
              sizes="(max-width: 767px) calc(100vw - 112px), (max-width: 1200px) calc(100vw - 176px), 1088px"
              src="/images/studio-screenshot.png"
              width={1600}
            />
          </DemoPanel>
        </ScrollReveal>

        <div className="flex flex-col gap-14 md:gap-20">
          {steps.map((step, index) => {
            const Visual = stepVisuals[index];
            const reverse = index % 2 === 1;

            return (
              <ScrollReveal
                className={cn(
                  "grid items-center gap-8 border-t border-home-forest/15 pt-10 md:grid-cols-2 md:gap-16 md:pt-14",
                )}
                delay={index * 100}
                key={step.title}
              >
                <div className={cn("max-w-xl", reverse && "md:order-2")}>
                  <span className="mb-5 block font-mono text-sm font-medium text-home-forest">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mb-4 font-serif text-3xl font-normal leading-tight text-home-forest md:text-4xl">
                    {step.title}
                  </h3>
                  <p className="m-0 text-base leading-relaxed text-home-charcoal md:text-lg">
                    {step.description}
                  </p>
                </div>

                <div className={cn("min-w-0 rounded-[14px] p-4 md:p-6", stepSurfaces[index % stepSurfaces.length], reverse && "md:order-1")}>
                  {Visual ? <Visual /> : null}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
