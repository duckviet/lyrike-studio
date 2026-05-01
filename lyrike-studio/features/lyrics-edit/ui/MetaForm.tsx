"use client";

import type { LyricsMeta } from "@/entities/lyrics";
import { useTranslations } from "next-intl";

interface MetaFormProps {
  meta: LyricsMeta;
  onUpdateMetaField: (update: Partial<LyricsMeta>) => void;
}

export function MetaForm({ meta, onUpdateMetaField }: MetaFormProps) {
  const t = useTranslations("editor.meta");

  return (
    <div className="grid gap-3 overflow-y-auto p-4">
      <label className="grid gap-1 text-[0.72rem] text-ink-light-soft font-bold uppercase tracking-wider">
        {t("track")}
        <input
          type="text"
          className="w-full p-3 text-sm border border-line rounded-lg bg-bg text-ink-light outline-none transition-all duration-150"
          value={meta.title}
          onChange={(e) => onUpdateMetaField({ title: e.target.value })}
        />
      </label>
      <label className="grid gap-1 text-[0.72rem] text-ink-light-soft font-bold uppercase tracking-wider">
        {t("artist")}
        <input
          type="text"
          className="w-full p-3 text-sm border border-line rounded-lg bg-bg text-ink-light outline-none transition-all duration-150"
          value={meta.artist}
          onChange={(e) => onUpdateMetaField({ artist: e.target.value })}
        />
      </label>
      <label className="grid gap-1 text-[0.72rem] text-ink-light-soft font-bold uppercase tracking-wider">
        {t("album")}
        <input
          type="text"
          className="w-full p-3 text-sm border border-line rounded-lg bg-bg text-ink-light outline-none transition-all duration-150"
          value={meta.album}
          onChange={(e) => onUpdateMetaField({ album: e.target.value })}
        />
      </label>
      <label className="grid gap-1 text-[0.72rem] text-ink-light-soft font-bold uppercase tracking-wider">
        {t("by")}
        <input
          type="text"
          className="w-full p-3 text-sm border border-line rounded-lg bg-bg text-ink-light outline-none transition-all duration-150"
          value={meta.by}
          onChange={(e) => onUpdateMetaField({ by: e.target.value })}
        />
      </label>
      <label className="grid gap-1 text-[0.72rem] text-ink-light-soft font-bold uppercase tracking-wider">
        {t("offset")}
        <input
          type="number"
          step="1"
          className="w-full p-3 text-sm border border-line rounded-lg bg-bg text-ink-light outline-none transition-all duration-150"
          value={meta.offset}
          onChange={(e) =>
            onUpdateMetaField({ offset: Number(e.target.value) })
          }
        />
      </label>
    </div>
  );
}
