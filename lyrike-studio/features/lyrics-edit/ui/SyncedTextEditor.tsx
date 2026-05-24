"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

interface SyncedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export const SyncedTextEditor = memo(function SyncedTextEditor({
  value,
  onChange,
  onBlur,
}: SyncedTextEditorProps) {
  const t = useTranslations("editor.textEditor");

  return (
    <div className="flex min-h-0 flex-1 flex-col p-2">
      <p className="mb-2 px-1 text-xs text-ink-light-soft">{t("format")} </p>
      <textarea
        className="min-h-0 flex-1 w-full resize-none rounded-inner border border-line bg-bg px-3 py-2 font-mono text-sm leading-relaxed text-ink-light outline-none placeholder:text-ink-light-soft/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        spellCheck={false}
        placeholder={`[00:00.00:00:05.00] First line\n[00:05.00:00:10.00] Second line`}
      />
    </div>
  );
});
