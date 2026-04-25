type WorkerStartMessage = {
  type: "start";
  prefix: string;
  targetHex: string;
};

const BATCH_SIZE = 2500;

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Invalid challenge target format.");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesLessOrEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] < b[i]) {
      return true;
    }
    if (a[i] > b[i]) {
      return false;
    }
  }

  return true;
}

async function solve(prefix: string, targetHex: string): Promise<string> {
  const targetBytes = hexToBytes(targetHex);
  let nonce = 0;

  while (true) {
    for (let i = 0; i < BATCH_SIZE; i += 1) {
      const text = `${prefix}${nonce}`;
      const encoded = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      const hashBytes = new Uint8Array(hashBuffer);

      if (bytesLessOrEqual(hashBytes, targetBytes)) {
        return String(nonce);
      }
      nonce += 1;
    }

    postMessage({ type: "progress", attempts: nonce });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

self.onmessage = async (event: MessageEvent<WorkerStartMessage>) => {
  const message = event.data;
  if (message.type !== "start") {
    return;
  }

  try {
    const nonce = await solve(message.prefix, message.targetHex);
    postMessage({ type: "done", nonce });
  } catch (error) {
    postMessage({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to solve proof of work.",
    });
  }
};
