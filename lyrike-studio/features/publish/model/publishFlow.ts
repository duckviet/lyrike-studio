import type {
  PublishChallengeResponse,
  PublishLyricsPayload,
  PublishResponse,
} from "@/lib/api";

export type PublishStepId = "validate" | "pow" | "publish" | "done";
export type PublishStepStatus = "idle" | "running" | "success" | "error";

export type PublishStep = {
  id: PublishStepId;
  label: string;
  status: PublishStepStatus;
};

export type PublishRunStatus = "idle" | "running" | "success" | "error";

export type PublishFlowState = {
  status: PublishRunStatus;
  currentStep: PublishStepId | null;
  steps: PublishStep[];
  message: string;
  nonceAttempts: number;
};

type RunPublishFlowInput = {
  buildPayload: () => PublishLyricsPayload;
  requestChallenge: () => Promise<PublishChallengeResponse>;
  solvePow: (input: {
    prefix: string;
    targetHex: string;
    onProgress: (attempts: number) => void;
  }) => Promise<string>;
  publish: (input: {
    payload: PublishLyricsPayload;
    publishToken: string;
  }) => Promise<PublishResponse>;
};

export const PUBLISH_STEPS = {
  VALIDATE: "validate",
  POW: "pow",
  PUBLISH: "publish",
  DONE: "done",
} as const;

const BASE_STEPS: PublishStep[] = [
  { id: "validate", label: "Validate", status: "idle" },
  { id: "pow", label: "PoW", status: "idle" },
  { id: "publish", label: "Publish", status: "idle" },
  { id: "done", label: "Done", status: "idle" },
];

function createInitialState(): PublishFlowState {
  return {
    status: "idle",
    currentStep: null,
    steps: BASE_STEPS.map((step) => ({ ...step })),
    message: "Ready to publish.",
    nonceAttempts: 0,
  };
}

function patchStepStatus(
  steps: PublishStep[],
  stepId: PublishStepId,
  status: PublishStepStatus,
): PublishStep[] {
  return steps.map((step) => (step.id === stepId ? { ...step, status } : step));
}

function parsePublishError(error: unknown): string {
  return error instanceof Error ? error.message : "Publish flow failed.";
}

export function createPublishFlowMachine(
  onStateChange: (state: PublishFlowState) => void,
) {
  let state = createInitialState();

  function emit(next: PublishFlowState): void {
    state = next;
    onStateChange(next);
  }

  function updateStep(
    stepId: PublishStepId,
    status: PublishStepStatus,
    message: string,
  ): void {
    emit({
      ...state,
      status: status === "error" ? "error" : "running",
      currentStep: stepId,
      steps: patchStepStatus(state.steps, stepId, status),
      message,
    });
  }

  return {
    getState(): PublishFlowState {
      return state;
    },

    reset(): void {
      emit(createInitialState());
    },

    async run(input: RunPublishFlowInput): Promise<void> {
      if (state.status === "running") {
        return;
      }

      emit({
        ...createInitialState(),
        status: "running",
        currentStep: "validate",
        message: "Validating payload...",
      });

      try {
        updateStep("validate", "running", "Validating payload...");
        const payload = input.buildPayload();
        updateStep("validate", "success", "Validation passed.");

        updateStep("pow", "running", "Requesting challenge from API...");
        const challenge = await input.requestChallenge();

        const nonce = await input.solvePow({
          prefix: challenge.prefix,
          targetHex: challenge.target,
          onProgress: (attempts) => {
            emit({
              ...state,
              status: "running",
              currentStep: "pow",
              nonceAttempts: attempts,
              message: `Solving Proof of Work (${attempts.toLocaleString()} attempts)...`,
            });
          },
        });
        updateStep("pow", "success", `PoW solved with nonce ${nonce}.`);

        updateStep("publish", "running", "Submitting publish payload...");
        await input.publish({
          payload,
          publishToken: `${challenge.prefix}:${nonce}`,
        });
        updateStep("publish", "success", "Publish request accepted.");

        emit({
          ...state,
          status: "success",
          currentStep: "done",
          steps: patchStepStatus(state.steps, "done", "success"),
          message: "Publish completed successfully.",
        });
      } catch (error) {
        const currentStep = state.currentStep ?? "validate";
        emit({
          ...state,
          status: "error",
          currentStep,
          steps: patchStepStatus(state.steps, currentStep, "error"),
          message: parsePublishError(error),
        });
      }
    },
  };
}