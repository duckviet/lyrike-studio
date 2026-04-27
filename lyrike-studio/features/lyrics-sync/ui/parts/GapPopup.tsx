import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import type { GapRegion } from "../../lib/gap-utils";

interface GapPopupProps {
  gap: GapRegion;
  widthPx: number;
  onInsert: () => void;
  onExtendPrev: (() => void) | null;
  onExtendNext: (() => void) | null;
  onClose: () => void;
}

export function GapPopup({
  onInsert,
  onExtendPrev,
  onExtendNext,
  onClose,
}: GapPopupProps) {
  const t = useTranslations("dashboard.actions");

  return (
    <div
      className={cn(
        "absolute z-50 bottom-[calc(100%+6px)]",
        "left-1/2 -translate-x-1/2",
        "flex items-center gap-px",
        "bg-[#1a1f2b] border border-white/15 rounded-lg",
        "shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
        "p-1",
        "animate-in fade-in zoom-in-95 duration-100",
        "pointer-events-auto",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Caret */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white/15" />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-px w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-[#1a1f2b]" />

      {onExtendPrev && (
        <PopupAction
          label="⊢"
          title={t("extendPrev")}
          onClick={() => {
            onExtendPrev();
            onClose();
          }}
          variant="neutral"
        />
      )}

      <PopupAction
        label="+"
        title={t("insertGap")}
        onClick={() => {
          onInsert();
          onClose();
        }}
        variant="primary"
      />

      {onExtendNext && (
        <PopupAction
          label="⊣"
          title={t("extendNext")}
          onClick={() => {
            onExtendNext();
            onClose();
          }}
          variant="neutral"
        />
      )}
    </div>
  );
}

function PopupAction({
  label,
  title,
  onClick,
  variant,
}: {
  label: string;
  title: string;
  onClick: () => void;
  variant: "primary" | "neutral";
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "w-7 h-7 rounded-md border text-xs font-semibold cursor-pointer",
        "transition-all duration-100",
        variant === "primary"
          ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
          : "border-white/10 text-white/60 bg-transparent hover:bg-white/10 hover:text-white/90",
      )}
    >
      {label}
    </button>
  );
}
