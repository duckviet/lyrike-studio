"use client";

import type { LyricsMeta } from "@/entities/lyrics";

interface MetaFormProps {
  meta: LyricsMeta;
  onUpdateMetaField: (key: keyof LyricsMeta, value: string) => void;
}

export function MetaForm({ meta, onUpdateMetaField }: MetaFormProps) {
  return (
    <div className="meta-grid">
      <label className="stack-field">
        Track
        <input
          type="text"
          value={meta.title}
          onChange={(e) => onUpdateMetaField("title", e.target.value)}
        />
      </label>
      <label className="stack-field">
        Artist
        <input
          type="text"
          value={meta.artist}
          onChange={(e) => onUpdateMetaField("artist", e.target.value)}
        />
      </label>
      <label className="stack-field">
        Album
        <input
          type="text"
          value={meta.album}
          onChange={(e) => onUpdateMetaField("album", e.target.value)}
        />
      </label>
      <label className="stack-field">
        By
        <input
          type="text"
          value={meta.by}
          onChange={(e) => onUpdateMetaField("by", e.target.value)}
        />
      </label>
      <label className="stack-field">
        Offset
        <input
          type="number"
          step="1"
          value={meta.offset}
          onChange={(e) => onUpdateMetaField("offset", e.target.value)}
        />
      </label>
    </div>
  );
}