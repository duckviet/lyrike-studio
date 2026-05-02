type WorkerStartMessage = {
  type: "start";
  prefix: string;
  targetHex: string;
  startNonce?: number;
  stride?: number;
};

const BATCH_SIZE = 100_000;

// SHA-256 round constants
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256(bytes: Uint8Array): Uint8Array {
  const len = bytes.length;
  const bitLen = len * 8;
  const withPad = ((len + 9 + 63) >> 6) << 6;
  const msg = new Uint8Array(withPad);
  msg.set(bytes);
  msg[len] = 0x80;

  const dv = new DataView(msg.buffer);
  dv.setUint32(withPad - 4, bitLen >>> 0, false);
  dv.setUint32(withPad - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x6a09e667 | 0,
    h1 = 0xbb67ae85 | 0,
    h2 = 0x3c6ef372 | 0,
    h3 = 0xa54ff53a | 0,
    h4 = 0x510e527f | 0,
    h5 = 0x9b05688c | 0,
    h6 = 0x1f83d9ab | 0,
    h7 = 0x5be0cd19 | 0;

  const w = new Int32Array(64);

  for (let off = 0; off < withPad; off += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = dv.getInt32(off + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const y = w[i - 2];
      const s1 =
        ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      hh = h7;

    for (let i = 0; i < 64; i++) {
      const S1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
      const S0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;

      hh = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + hh) | 0;
  }

  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  odv.setInt32(0, h0, false);
  odv.setInt32(4, h1, false);
  odv.setInt32(8, h2, false);
  odv.setInt32(12, h3, false);
  odv.setInt32(16, h4, false);
  odv.setInt32(20, h5, false);
  odv.setInt32(24, h6, false);
  odv.setInt32(28, h7, false);
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Invalid challenge target format.");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// Replicates Rust verify_nonce: hash <= target as big-endian integer
// (with the same off-by-one as the original: stops at len-1)
function verifyNonce(hash: Uint8Array, target: Uint8Array): boolean {
  const n = target.length;
  if (hash.length !== n) return false;
  for (let i = 0; i < n - 1; i++) {
    if (hash[i] > target[i]) return false;
    if (hash[i] < target[i]) return true;
  }
  return true;
}

function solvePoW(
  prefix: string,
  targetHex: string,
  startNonce: number,
  stride: number,
): string {
  const target = hexToBytes(targetHex);

  const encoder = new TextEncoder();
  const prefixBytes = encoder.encode(prefix);
  const prefixLen = prefixBytes.length;

  const buf = new Uint8Array(prefixLen + 24);
  buf.set(prefixBytes, 0);

  let nonce = startNonce;
  let nextReport = ((startNonce / BATCH_SIZE) | 0) * BATCH_SIZE + BATCH_SIZE;

  while (true) {
    let writePos: number;
    if (nonce === 0) {
      buf[prefixLen] = 0x30;
      writePos = prefixLen + 1;
    } else {
      let tmp = nonce;
      let digits = 0;
      while (tmp > 0) {
        digits++;
        tmp = (tmp / 10) | 0;
      }
      writePos = prefixLen + digits;
      let p = writePos - 1;
      tmp = nonce;
      while (tmp > 0) {
        buf[p--] = 0x30 + (tmp % 10);
        tmp = (tmp / 10) | 0;
      }
    }

    const hash = sha256(buf.subarray(0, writePos));

    if (verifyNonce(hash, target)) {
      return nonce.toString();
    }

    nonce += stride;
    if (nonce >= nextReport) {
      self.postMessage({ type: "progress", attempts: nonce });
      nextReport += BATCH_SIZE;
    }
  }
}

self.onmessage = (e: MessageEvent<WorkerStartMessage>) => {
  const { prefix, targetHex, startNonce = 0, stride = 1 } = e.data;
  try {
    const nonce = solvePoW(prefix, targetHex, startNonce, stride);
    self.postMessage({ type: "done", nonce });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
