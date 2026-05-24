import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import type { GapRegion } from "../../lib/gap-utils";

interface GapPopupProps {
  gap: GapRegion;
  widthPx: number;
  onInsert: () => void;
  onExtendPrev: (() => void) | null;
  onExtendNext: (() => void) | null;
  onDelete: (() => void) | null;
  onClose: () => void;
}

export function GapPopup({
  onInsert,
  onExtendPrev,
  onExtendNext,
  onDelete,
  onClose,
}: GapPopupProps) {
  const t = useTranslations("dashboard.actions");

  return (
    <div
      className={cn(
        "absolute z-50 bottom-[calc(100%+6px)]",
        "left-1/2 -translate-x-1/2",
        "flex items-center gap-px",
        "rounded-inner border border-line bg-bg",
        "shadow-ink-md",
        "p-1",
        "animate-in fade-in zoom-in-95 duration-100",
        "pointer-events-auto",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Caret */}
      <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-line" />
      <div className="absolute left-1/2 top-full mt-px h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-bg-soft" />

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

      {onDelete && (
        <PopupAction
          label="✕"
          title={t("deleteGap")}
          onClick={() => {
            onDelete();
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
        "h-7 w-7 rounded-control border text-xs font-semibold cursor-pointer",
        "transition-all duration-100",
        variant === "primary"
          ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
          : "border-line text-ink-light-soft bg-transparent hover:bg-bg-elev hover:text-ink-light",
      )}
    >
      {label}
    </button>
  );
}
