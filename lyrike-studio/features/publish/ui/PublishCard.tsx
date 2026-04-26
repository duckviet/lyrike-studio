"use client";

import type { PublishFlowState } from "@/features/publish";

interface PublishCardProps {
  publishState: PublishFlowState;
  onPublish: () => void;
}

export function PublishCard({ publishState, onPublish }: PublishCardProps) {
  return (
    <section className="publish-card">
      <div className="card-header">
        <span className="tag">Publish</span>
      </div>

      <button
        type="button"
        className="btn-action primary"
        disabled={publishState.status === "running"}
        onClick={onPublish}
      >
        {publishState.status === "running" ? (
          <>
            <span className="spinner" /> Publishing...
          </>
        ) : (
          "Publish to LRCLIB"
        )}
      </button>

      <ol className="publish-steps" aria-label="Publish progress">
        {publishState.steps.map((step) => (
          <li key={step.id} data-status={step.status}>
            <span className="step-dot" aria-hidden="true" />
            <span>{step.label}</span>
          </li>
        ))}
      </ol>

      <p className={`publish-message ${publishState.status}`}>
        {publishState.message}
        {publishState.status === "running" &&
          publishState.currentStep === "pow" &&
          publishState.nonceAttempts > 0 && (
            <>
              {" "}
              (attempts: {publishState.nonceAttempts.toLocaleString()})
            </>
          )}
      </p>
    </section>
  );
}