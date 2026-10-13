"use client";

import Image from "next/image";
import { Check, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LyricsMeta } from "@/entities/lyrics";
import type { FetchMediaResponse } from "@/lib/api";
import { formatTime } from "@/shared/utils/formatters";
import type { PublishFlowState } from "../model/publishFlow";
import type { PublishReadiness } from "../model/publishPayload";
import { PublishCard } from "./PublishCard";
import {
  countInstrumentalGaps,
  INSTRUMENTAL_SYMBOL,
} from "../model/fillInstrumentalGaps";
import { PublishMetaForm } from "./PublishMetaForm";

interface PublishTabProps {
  mediaInfo: FetchMediaResponse;
  meta: LyricsMeta;
  readiness: PublishReadiness;
  publishState: PublishFlowState | null;
  syncedLines: readonly { start: number; end: number; text: string }[];
  fillGaps: { enabled: boolean; minGap: number };
  onFillGapsChange: (next: { enabled: boolean; minGap: number }) => void;
  onUpdateMetaField: (update: Partial<LyricsMeta>) => void;
  onPublish: () => void;
}

export function PublishTab({
  mediaInfo,
  meta,
  readiness,
  publishState,
  syncedLines,
  fillGaps,
  onFillGapsChange,
  onUpdateMetaField,
  onPublish,
}: PublishTabProps) {
  const t = useTranslations("editor.publish");

  const checks: { id: keyof PublishReadiness; label: string }[] = [
    { id: "track", label: t("checkTrack") },
    { id: "artist", label: t("checkArtist") },
    { id: "duration", label: t("checkDuration") },
    { id: "lyrics", label: t("checkLyrics") },
  ];

  const gapCount = fillGaps.enabled
    ? countInstrumentalGaps(syncedLines, { minGap: fillGaps.minGap })
    : 0;

  return (
    <div className="flex flex-col gap-5 p-5 pl-0">
      <div className="flex items-center gap-3">
        <Image
          width={72}
          height={72}
          src={`https://i.ytimg.com/vi/${mediaInfo.videoId}/mqdefault.jpg`}
          className="aspect-square w-[72px] rounded-inner border border-line-soft bg-bg object-cover"
          alt={mediaInfo.trackName || "Track thumbnail"}
        />
        <div className="grid min-w-0 gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-light-soft">
            {t("duration")}
          </span>
          <span className="font-mono text-sm font-medium text-ink-light">
            {mediaInfo.duration ? formatTime(mediaInfo.duration) : "--:--"}
          </span>
        </div>
      </div>

      <PublishMetaForm
        meta={meta}
        placeholders={{
          title: mediaInfo.trackName,
          artist: mediaInfo.artistName,
        }}
        onUpdateMetaField={onUpdateMetaField}
      />

      <div className="grid gap-2 rounded-control border border-line-soft px-3 py-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-light">
          <input
            type="checkbox"
            className="accent-primary"
            checked={fillGaps.enabled}
            onChange={(e) =>
              onFillGapsChange({ ...fillGaps, enabled: e.target.checked })
            }
          />
          {t("fillGaps", { symbol: INSTRUMENTAL_SYMBOL })}
        </label>
        {fillGaps.enabled && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-light-soft">
            <span>{t("fillGapsMin")}</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={fillGaps.minGap}
              onChange={(e) =>
                onFillGapsChange({
                  ...fillGaps,
                  minGap: Math.max(0.5, Number(e.target.value) || 0.5),
                })
              }
              className="w-16 rounded-control border border-line bg-white px-2 py-1 text-sm text-ink outline-none focus:border-primary-deep"
            />
            <span>s</span>
            <span className="ml-auto">
              {t("fillGapsCount", { count: gapCount })}
            </span>
          </div>
        )}
      </div>

      <ul className="m-0 grid list-none gap-1.5 p-0" aria-label={t("checklist")}>
        {checks.map(({ id, label }) => {
          const ok = readiness[id];
          return (
            <li
              key={id}
              className={`flex items-center gap-2 text-sm ${ok ? "text-success" : "text-ink-light-soft"}`}
            >
              {ok ? <Check size={14} /> : <Circle size={14} />}
              <span>{label}</span>
            </li>
          );
        })}
      </ul>

      <PublishCard
        publishState={publishState}
        onPublish={onPublish}
        disabled={!readiness.ready}
      />
    </div>
  );
}
