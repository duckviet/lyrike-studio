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

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function solvePoW(prefix: string, targetHex: string): Promise<string> {
  const target = hexToBytes(targetHex);
  const targetLen = target.length;
  let nonce = 0;
  let found = false;
  let nonceOut = "";

  while (!found) {
    const attempt = new TextEncoder().encode(`${prefix}${nonce}`);
    const hashBuffer = await crypto.subtle.digest("SHA-1", attempt);
    const hash = new Uint8Array(hashBuffer);

    let matches = true;
    for (let i = 0; i < targetLen; i++) {
      if (hash[i] !== target[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      found = true;
      nonceOut = nonce.toString();
    } else {
      nonce++;
      if (nonce % BATCH_SIZE === 0) {
        self.postMessage({ type: "progress", attempts: nonce });
      }
    }
  }

  return nonceOut;
}

self.onmessage = async (e: MessageEvent<WorkerStartMessage>) => {
  const { prefix, targetHex } = e.data;
  try {
    const nonce = await solvePoW(prefix, targetHex);
    self.postMessage({ type: "done", nonce });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};