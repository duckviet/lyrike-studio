"use client";

import { useState } from "react";
import { AudioLines, Check, MousePointer2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import { compactWaveBars, timelineRegions } from "../_lib/homeDemoData";
import { WaveformMock } from "./visuals/WaveformMock";

const timestamps = ["00:12.40", "00:18.20", "00:25.80", "00:31.60"] as const;

export function HeroPreview() {
  const t = useTranslations("home.preview");
  const [selected, setSelected] = useState(1);
  const region = timelineRegions[selected];

  return (
    <div className="relative min-w-0 rounded-[14px] bg-home-mint p-4 pb-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4 text-xs text-home-forest">
        <span className="flex items-center gap-2 font-medium"><AudioLines aria-hidden="true" size={18} />Lyrike Studio</span>
        <span className="rounded-full border border-home-forest/20 px-3 py-1">{t("badge")}</span>
      </div>
      <div className="home-lyric-sheet overflow-hidden rounded-[14px] border border-home-forest/10 bg-home-canvas">
        <div className="flex items-center justify-between gap-4 border-b border-home-border px-5 py-5 md:px-6">
          <div>
            <p className="text-xs text-home-charcoal">{t("trackLabel")}</p>
            <p className="mt-1 text-lg font-medium text-home-forest">Moonlight session</p>
          </div>
          <span className="font-mono text-xs text-home-charcoal">.lrc</span>
        </div>
        <div className="px-2 py-4 md:px-3" role="group" aria-label={t("instruction")}>
          {timelineRegions.map((line, index) => (
            <button
              aria-pressed={selected === index}
              className={cn("home-lyric-row grid w-full grid-cols-[72px_1fr] items-center gap-3 rounded-[10px] px-3 py-4 text-left text-sm md:grid-cols-[80px_1fr]", selected === index ? "bg-home-keylime text-home-forest" : "text-home-charcoal hover:bg-home-keylime/50")}
              key={line.id}
              onClick={() => setSelected(index)}
              type="button"
            >
              <span className="font-mono text-xs">{timestamps[index]}</span>
              <span className={selected === index ? "font-semibold" : ""}>{line.label}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-home-border bg-home-keylime/40 px-4 py-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-home-forest">
            <span className="flex items-center gap-2"><AudioLines aria-hidden="true" size={14} />{t("timeline")}</span>
            <output className="font-mono" aria-live="polite">{timestamps[selected]}</output>
          </div>
          <WaveformMock activeRange={region ? { start: region.left, end: region.left + region.width } : undefined} bars={compactWaveBars} height="h-24" playheadPercent={region?.left} variant="compact" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-home-forest">
        <span className="flex items-center gap-2"><MousePointer2 aria-hidden="true" size={14} />{t("instruction")}</span>
        <span className="flex items-center gap-1.5"><Check aria-hidden="true" size={14} />{t("precision")}</span>
      </div>
    </div>
  );
}
