export function floatsToBlob(vec: number[]): Uint8Array<ArrayBuffer> {
  const ab = new ArrayBuffer(vec.length * 4);
  const f32 = new Float32Array(ab);
  for (let i = 0; i < vec.length; i++) f32[i] = vec[i];
  return new Uint8Array(ab);
}

export function blobToFloats(buf: Uint8Array): Float32Array {
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return new Float32Array(ab);
}

export function cosineSim(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function l2norm(a: number[]): number[] {
  let n = 0;
  for (const v of a) n += v * v;
  const d = Math.sqrt(n) || 1;
  return a.map((v) => v / d);
}
