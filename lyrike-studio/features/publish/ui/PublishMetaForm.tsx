"use client";

import type { LyricsMeta } from "@/entities/lyrics";
import { useTranslations } from "next-intl";

interface PublishMetaFormProps {
  meta: LyricsMeta;
  placeholders?: { title?: string; artist?: string };
  onUpdateMetaField: (update: Partial<LyricsMeta>) => void;
}

const LABEL_CLASS =
  "grid gap-1 text-[0.68rem] font-bold uppercase tracking-wider text-ink-light-soft";
const INPUT_CLASS =
  "w-full rounded-control border border-line bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink-light outline-none transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/15";

export function PublishMetaForm({
  meta,
  placeholders,
  onUpdateMetaField,
}: PublishMetaFormProps) {
  const t = useTranslations("editor.meta");

  return (
    <div className="grid gap-3">
      <label className={LABEL_CLASS}>
        {t("track")}
        <input
          type="text"
          className={INPUT_CLASS}
          value={meta.title}
          placeholder={placeholders?.title}
          onChange={(e) => onUpdateMetaField({ title: e.target.value })}
        />
      </label>
      <label className={LABEL_CLASS}>
        {t("artist")}
        <input
          type="text"
          className={INPUT_CLASS}
          value={meta.artist}
          placeholder={placeholders?.artist}
          onChange={(e) => onUpdateMetaField({ artist: e.target.value })}
        />
      </label>
      <label className={LABEL_CLASS}>
        {t("album")}
        <input
          type="text"
          className={INPUT_CLASS}
          value={meta.album}
          onChange={(e) => onUpdateMetaField({ album: e.target.value })}
        />
      </label>

      <details className="rounded-control border border-line-soft px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-ink-light">
          {t("lrcTags")}
        </summary>
        <p className="m-0 mt-2 text-xs text-ink-light-soft">{t("lrcTagsHint")}</p>
        <div className="mt-3 grid gap-3">
          <label className={LABEL_CLASS}>
            {t("by")}
            <input
              type="text"
              className={INPUT_CLASS}
              value={meta.by}
              onChange={(e) => onUpdateMetaField({ by: e.target.value })}
            />
          </label>
          <label className={LABEL_CLASS}>
            {t("offset")}
            <input
              type="number"
              step="1"
              className={INPUT_CLASS}
              value={meta.offset}
              onChange={(e) =>
                onUpdateMetaField({ offset: Number(e.target.value) })
              }
            />
          </label>
        </div>
      </details>
    </div>
  );
}
