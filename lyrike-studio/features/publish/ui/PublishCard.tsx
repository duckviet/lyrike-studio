import { useTranslations } from "next-intl";
import type { PublishFlowState } from "@/features/publish";

interface PublishCardProps {
  publishState: PublishFlowState;
  onPublish: () => void;
}

export function PublishCard({ publishState, onPublish }: PublishCardProps) {
  const t = useTranslations("dashboard.publish");

  return (
    <section className="border border-line rounded-2xl bg-bg-soft p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center">
        <span className="inline-flex rounded-md bg-primary-10 text-primary px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider border border-primary-20">
          {t("label")}
        </span>
      </div>

      <button
        type="button"
        className="min-h-[42px] rounded-xl border-none px-5 py-3 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all duration-150 cursor-pointer tracking-tight bg-accent hover:bg-accent-deep shadow-sm"
        disabled={publishState.status === "running"}
        onClick={onPublish}
      >
        {publishState.status === "running" ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
            {t("running")}
          </>
        ) : (
          t("button")
        )}
      </button>

      <ol
        className="m-0 p-0 list-none grid gap-1.5"
        aria-label="Publish progress"
      >
        {publishState.steps.map((step) => (
          <li
            key={step.id}
            className={`flex items-center gap-2 text-sm ${step.status === "running" ? "text-ink-light font-semibold" : ""} ${step.status === "success" ? "text-success" : ""} ${step.status === "error" ? "text-danger" : ""} ${step.status === "idle" ? "text-ink-light-soft" : ""}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                step.status === "success"
                  ? "bg-success shadow-[0_0_0_1px_inset_var(--success-deep)]"
                  : step.status === "error"
                    ? "bg-danger shadow-[0_0_0_1px_inset_#dc2626]"
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

      <p
        className={`m-0 border-l-4 border-line rounded-lg p-3 text-sm leading-relaxed ${publishState.status === "success" ? "border-l-success bg-success-8 text-success" : ""} ${publishState.status === "error" ? "border-l-danger bg-danger-8 text-danger" : ""} ${publishState.status === "running" ? "text-ink-light-soft" : ""}`}
      >
        {publishState.message}
        {publishState.status === "running" &&
          publishState.currentStep === "pow" &&
          publishState.nonceAttempts > 0 && (
            <> ({t("attempts")}: {publishState.nonceAttempts.toLocaleString()})</>
          )}
      </p>
    </section>
  );
}
