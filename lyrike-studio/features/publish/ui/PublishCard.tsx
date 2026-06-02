import { useTranslations } from "next-intl";
import { LoaderCircle, Send } from "lucide-react";
import type { PublishFlowState } from "@/features/publish";
import { EditorButton, EditorStatusCallout } from "@/features/editor";

interface PublishCardProps {
  publishState: PublishFlowState | null;
  onPublish: () => void;
}

export function PublishCard({ publishState, onPublish }: PublishCardProps) {
  const t = useTranslations("dashboard.publish");

  return (
    <section className="flex flex-col gap-3 pr-4 pb-2">
      <div className="flex items-center">
        <span className="inline-flex rounded-md bg-primary-10 text-primary px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider border border-primary-20">
          {t("label")}
        </span>
      </div>

      <EditorButton
        className="w-full"
        disabled={publishState?.status === "running"}
        icon={
          publishState?.status === "running" ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <Send size={16} />
          )
        }
        onClick={onPublish}
        variant="primary"
      >
        {publishState?.status === "running" ? t("running") : t("button")}
      </EditorButton>

      <ol
        className="m-0 p-0 list-none grid gap-1.5"
        aria-label="Publish progress"
      >
        {publishState?.steps.map((step) => (
          <li
            key={step.id}
            className={`flex items-center gap-2 text-sm ${step.status === "running" ? "text-ink-light font-semibold" : ""} ${step.status === "success" ? "text-success" : ""} ${step.status === "error" ? "text-danger" : ""} ${step.status === "idle" ? "text-ink-light-soft" : ""}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${step.status === "success"
                ? "bg-success shadow-[0_0_0_1px_inset_var(--success-deep)]"
                : step.status === "error"
                  ? "bg-danger shadow-[0_0_0_1px_inset_var(--danger)]"
                  : step.status === "running"
                    ? "bg-primary animate-pulse shadow-[0_0_0_1px_inset_var(--primary-deep),0_0_12px_var(--primary-50)]"
                    : "bg-line shadow-[0_0_0_1px_inset_var(--line)]"
                }`}
              aria-hidden="true"
            />
            <span>{step.label}</span>
          </li>
        ))}
      </ol>

      <EditorStatusCallout
        tone={
          publishState?.status === "success"
            ? "success"
            : publishState?.status === "error"
              ? "error"
              : publishState?.status === "running"
                ? "loading"
                : "neutral"
        }
      >
        {publishState?.message}
        {publishState?.status === "running" &&
          publishState?.currentStep === "pow" &&
          publishState?.nonceAttempts > 0 && (
            <>
              {" "}
              ({t("attempts")}: {publishState?.nonceAttempts.toLocaleString()})
            </>
          )}
      </EditorStatusCallout>
    </section>
  );
}
