import { Check, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import { useLoopProgress } from "../../hooks";
import { DemoPanel } from "./DemoPanel";

const DEMO_URL = "youtube.com/watch?v=lyrike-demo";
const TYPING_MS = 1800;
const READY_DELAY_MS = 600;

export function UrlFetchMock() {
  const t = useTranslations("home.mock");
  const { elapsedMs } = useLoopProgress(3600);

  const typedChars = Math.min(
    DEMO_URL.length,
    Math.floor((elapsedMs / TYPING_MS) * DEMO_URL.length),
  );
  const isReady = elapsedMs >= TYPING_MS + READY_DELAY_MS;

  return (
    <DemoPanel title={t("sourcePanel")} status={isReady ? t("audioReady") : "..."} variant="slate">
      <div className="flex flex-col gap-4">
        <div className="rounded-[10px] border border-home-border bg-home-canvas px-4 py-3">
          <span className="font-mono text-sm text-home-ink">
            {DEMO_URL.slice(0, typedChars)}
            <span
              aria-hidden="true"
              className={cn(
                "ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-home-forest",
                isReady ? "opacity-0" : "animate-pulse",
              )}
            />
          </span>
        </div>

        <div
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-medium transition-colors",
            isReady
              ? "bg-home-mint text-home-forest"
              : "bg-home-forest text-home-canvas",
          )}
        >
          {isReady ? (
            <Check size={16} strokeWidth={1.8} />
          ) : (
            <Radio size={16} strokeWidth={1.8} />
          )}
          <span>{isReady ? t("audioReady") : t("fetchMedia")}</span>
        </div>
      </div>
    </DemoPanel>
  );
}
