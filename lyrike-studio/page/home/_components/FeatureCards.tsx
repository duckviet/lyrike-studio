import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { cn } from "@/shared/lib/utils";
import { homeFeatures, type HomeFeatureId } from "../_lib/homeDemoData";
import { ScrollReveal } from "./ScrollReveal";
import {
  ExportFeatureVisual,
  TapSyncFeatureVisual,
  TranscriptionFeatureVisual,
  WaveformFeatureVisual,
} from "./FeatureVisuals";

const visualByFeature: Record<HomeFeatureId, ComponentType> = {
  waveform: WaveformFeatureVisual,
  transcription: TranscriptionFeatureVisual,
  tap: TapSyncFeatureVisual,
  export: ExportFeatureVisual,
};

const surfaceClass = {
  mint: "bg-home-mint",
  slate: "bg-home-slate",
  keylime: "bg-home-keylime",
};

export function FeatureCards() {
  const t = useTranslations("home.features");

  return (
    <section className="px-6 pb-20 md:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-14 md:gap-20">
        {homeFeatures.map((feature, index) => {
          const Visual = visualByFeature[feature.id];
          const reverse = feature.align === "right";

          return (
            <ScrollReveal
              className={cn(
                "grid items-center gap-8 rounded-[14px] border border-home-border p-5 md:grid-cols-2 md:gap-12 md:p-10",
                surfaceClass[feature.surface],
              )}
              delay={index * 100}
              key={feature.id}
            >
              <div className={cn("max-w-xl", reverse && "md:order-2")}>
                <span className="mb-4 block text-xs font-semibold uppercase text-home-forest">
                  {t(`${feature.id}.label`)}
                </span>
                <h3 className="mb-4 font-serif text-3xl font-normal leading-tight text-home-forest md:text-4xl">
                  {t(`${feature.id}.title`)}
                </h3>
                <p className="m-0 text-base leading-relaxed text-home-charcoal md:text-lg">
                  {t(`${feature.id}.description`)}
                </p>
              </div>

              <div className={cn(reverse && "md:order-1")}>
                <Visual />
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
