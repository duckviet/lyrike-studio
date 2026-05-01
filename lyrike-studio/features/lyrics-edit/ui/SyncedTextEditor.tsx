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
    <div className="flex-1 min-h-0 flex flex-col p-2">
      <p className="text-xs text-muted-foreground mb-2 px-1">
        {t("format")} <code className="text-xs">[mm:ss.xx:mm:ss.xx] lyrics text</code>
      </p>
      <textarea
        className="flex-1 min-h-0 w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        spellCheck={false}
        placeholder={`[00:00.00:00:05.00] First line\n[00:05.00:00:10.00] Second line`}
      />
    </div>
  );
});
