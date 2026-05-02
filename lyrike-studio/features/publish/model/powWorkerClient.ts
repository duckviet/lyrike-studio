export type SolvePowInput = {
  prefix: string;
  targetHex: string;
  onProgress?: (attempts: number) => void;
};

type WorkerStartMessage = {
  type: "start";
  prefix: string;
  targetHex: string;
};

type WorkerProgressMessage = {
  type: "progress";
  attempts: number;
};

type WorkerDoneMessage = {
  type: "done";
  nonce: string;
};

type WorkerErrorMessage = {
  type: "error";
  message: string;
};

type WorkerOutboundMessage =
  | WorkerProgressMessage
  | WorkerDoneMessage
  | WorkerErrorMessage;

export function solvePowInWorker(input: SolvePowInput): Promise<string> {
  const worker = new Worker(new URL("./powWorker.ts", import.meta.url), {
    type: "module",
  });

  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        input.onProgress?.(message.attempts);
        return;
      }

      if (message.type === "done") {
        worker.terminate();
        resolve(message.nonce);
        return;
      }

      if (message.type === "error") {
        worker.terminate();
        reject(new Error(message.message));
      }
    };

    worker.onerror = () => {
      worker.terminate();
      reject(new Error("PoW worker crashed while solving challenge."));
    };

    const message: WorkerStartMessage = {
      type: "start",
      prefix: input.prefix,
      targetHex: input.targetHex,
    };
    worker.postMessage(message);
  });
}
