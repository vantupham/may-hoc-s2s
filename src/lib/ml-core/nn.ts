import { type Calc, tex, texp } from './trace';
import { mulberry32 } from './tree';

/* ======================================================================
 * Mạng nhỏ 2 → 3 → 1 (tanh, sigmoid) cho phần tính tay: mọi con số đều hiện ra.
 * ====================================================================== */
export interface Tiny { W1: number[][]; b1: number[]; w2: number[]; b2: number }

export function tinyPass(net: Tiny, x: [number, number], y: number) {
  const z1 = net.W1.map((r, j) => r[0] * x[0] + r[1] * x[1] + net.b1[j]);
  const a1 = z1.map(Math.tanh);
  const z2 = net.w2.reduce((a, w, j) => a + w * a1[j], net.b2);
  const p = 1 / (1 + Math.exp(-z2));
  const loss = -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
  const dz2 = p - y;
  const dw2 = a1.map((a) => dz2 * a);
  const da1 = net.w2.map((w) => dz2 * w);
  const dz1 = da1.map((d, j) => d * (1 - a1[j] ** 2));
  const dW1 = dz1.map((d) => [d * x[0], d * x[1]]);
  return { z1, a1, z2, p, loss, dz2, dw2, db2: dz2, da1, dz1, dW1, db1: dz1 };
}

export type TinyPass = ReturnType<typeof tinyPass>;

/** Các bước tính theo thứ tự: lan truyền xuôi rồi lan truyền ngược. */
export function tinyCalcs(net: Tiny, x: [number, number], y: number, r: TinyPass, lr: number): (Calc & { phase: 'xuôi' | 'ngược' | 'cập nhật'; focus: string[] })[] {
  const out: (Calc & { phase: 'xuôi' | 'ngược' | 'cập nhật'; focus: string[] })[] = [];
  r.z1.forEach((z, j) => out.push({
    phase: 'xuôi', focus: [`x0`, `x1`, `h${j}`, `e0-${j}`, `e1-${j}`], key: `z1${j}`, name: `Tổng có trọng số vào nơ-ron ẩn ${j + 1}`,
    formula: String.raw`\cz{z_{${j + 1}}} = \cw{w_{${j + 1}1}}\cx{x_1} + \cw{w_{${j + 1}2}}\cx{x_2} + \cb{b_{${j + 1}}}`,
    substituted: String.raw`\cz{z_{${j + 1}}} = \cw{${texp(net.W1[j][0], 2)}}\cdot\cx{${texp(x[0])}} + \cw{${texp(net.W1[j][1], 2)}}\cdot\cx{${texp(x[1])}} + \cb{${tex(net.b1[j], 2)}} = \cz{${tex(z)}}`,
    value: z,
  }));
  r.a1.forEach((a, j) => out.push({
    phase: 'xuôi', focus: [`h${j}`], key: `a1${j}`, name: `Kích hoạt của nơ-ron ẩn ${j + 1}`,
    formula: String.raw`a_{${j + 1}} = \tanh(\cz{z_{${j + 1}}})`,
    substituted: String.raw`a_{${j + 1}} = \tanh(${texp(r.z1[j])}) = ${tex(a)}`,
    value: a,
  }));
  out.push({
    phase: 'xuôi', focus: ['h0', 'h1', 'h2', 'o', 'f0', 'f1', 'f2'], key: 'z2', name: 'Đầu ra',
    formula: String.raw`\cz{z_o} = \sum_j \cw{v_j}\,a_j + \cb{c}, \quad \cp{p} = \sigma(\cz{z_o})`,
    substituted: String.raw`\cz{z_o} = ${net.w2.map((w, j) => `\\cw{${texp(w, 2)}}\\cdot${texp(r.a1[j])}`).join(' + ')} + \\cb{${tex(net.b2, 2)}} = ${tex(r.z2)}, \\quad \\cp{p} = \\sigma(${texp(r.z2)}) = \\cp{${tex(r.p)}}`,
    value: r.p,
  });
  out.push({
    phase: 'xuôi', focus: ['o'], key: 'loss', name: 'Mất mát',
    formula: String.raw`\cL{L} = -\big[\cy{y}\ln\cp{p} + (1-\cy{y})\ln(1-\cp{p})\big]`,
    substituted: String.raw`\cL{L} = ${y ? `-\\ln ${tex(r.p)}` : `-\\ln(1 - ${tex(r.p)})`} = \\cL{${tex(r.loss, 4)}}`,
    value: r.loss,
  });
  out.push({
    phase: 'ngược', focus: ['o'], key: 'dz2', name: 'Gradient tại đầu ra',
    formula: String.raw`\cg{\frac{\partial L}{\partial z_o}} = \cp{p} - \cy{y}`,
    substituted: String.raw`\cg{\frac{\partial L}{\partial z_o}} = ${tex(r.p)} - ${y} = \cg{${tex(r.dz2, 4)}}`,
    value: r.dz2,
  });
  r.dw2.forEach((g, j) => out.push({
    phase: 'ngược', focus: [`f${j}`], key: `dv${j}`, name: `Gradient của trọng số v${j + 1} (ẩn ${j + 1} → đầu ra)`,
    formula: String.raw`\cg{\frac{\partial L}{\partial v_{${j + 1}}}} = \cg{\frac{\partial L}{\partial z_o}}\cdot a_{${j + 1}}`,
    substituted: String.raw`\cg{${tex(r.dz2, 4)}}\times${texp(r.a1[j])} = \cg{${tex(g, 4)}}`,
    value: g,
  }));
  r.dz1.forEach((g, j) => out.push({
    phase: 'ngược', focus: [`h${j}`, `f${j}`], key: `dz1${j}`, name: `Gradient lùi về nơ-ron ẩn ${j + 1} (quy tắc dây chuyền)`,
    formula: String.raw`\cg{\frac{\partial L}{\partial z_{${j + 1}}}} = \underbrace{\cg{\frac{\partial L}{\partial z_o}}\, \cw{v_{${j + 1}}}}_{\partial L/\partial a_{${j + 1}}}\cdot\underbrace{(1 - a_{${j + 1}}^2)}_{\tanh'}`,
    substituted: String.raw`\cg{${tex(r.dz2, 4)}}\times\cw{${texp(net.w2[j], 2)}}\times(1 - ${texp(r.a1[j])}^2) = \cg{${tex(g, 4)}}`,
    value: g,
  }));
  r.dW1.forEach((row, j) => row.forEach((g, i) => out.push({
    phase: 'ngược', focus: [`e${i}-${j}`, `x${i}`, `h${j}`], key: `dw${j}${i}`, name: `Gradient của trọng số w${j + 1}${i + 1} (đầu vào ${i + 1} → ẩn ${j + 1})`,
    formula: String.raw`\cg{\frac{\partial L}{\partial w_{${j + 1}${i + 1}}}} = \cg{\frac{\partial L}{\partial z_{${j + 1}}}}\cdot\cx{x_{${i + 1}}}`,
    substituted: String.raw`\cg{${tex(r.dz1[j], 4)}}\times\cx{${texp(x[i])}} = \cg{${tex(g, 4)}}`,
    value: g,
  })));
  out.push({
    phase: 'cập nhật', focus: [], key: 'upd', name: 'Cập nhật mọi trọng số',
    formula: String.raw`\cw{\theta} \leftarrow \cw{\theta} - \ceta{\eta}\,\cg{\frac{\partial L}{\partial \theta}}`,
    substituted: String.raw`\text{ví dụ: } \cw{v_1} = ${tex(net.w2[0], 2)} - \ceta{${tex(lr, 1)}}\times${texp(r.dw2[0], 4)} = \cw{${tex(net.w2[0] - lr * r.dw2[0], 4)}}`,
    value: net.w2[0] - lr * r.dw2[0],
  });
  return out;
}

export function tinyUpdate(net: Tiny, r: TinyPass, lr: number): Tiny {
  return {
    W1: net.W1.map((row, j) => row.map((w, i) => w - lr * r.dW1[j][i])),
    b1: net.b1.map((b, j) => b - lr * r.db1[j]),
    w2: net.w2.map((w, j) => w - lr * r.dw2[j]),
    b2: net.b2 - lr * r.db2,
  };
}

/* ======================================================================
 * MLP đầy đủ: 64 → H (ReLU) → 10 (softmax), huấn luyện SGD theo lô.
 * Trọng số lưu ở Float64Array dạng hàng (W1[h*64 + i]).
 * ====================================================================== */
export interface MLP { nIn: number; nH: number; nOut: number; W1: Float64Array; B1: Float64Array; W2: Float64Array; B2: Float64Array }

export function initMLP(nIn: number, nH: number, nOut: number, seed: number): MLP {
  const r = mulberry32(seed);
  const gauss = () => { const u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const W1 = new Float64Array(nH * nIn).map(() => gauss() * Math.sqrt(2 / nIn));
  const W2 = new Float64Array(nOut * nH).map(() => gauss() * Math.sqrt(2 / nH));
  return { nIn, nH, nOut, W1, B1: new Float64Array(nH), W2, B2: new Float64Array(nOut) };
}

export function mlpFromArrays(W1: number[][], W2: number[][]): MLP {
  const nH = W1.length, nIn = W1[0].length, nOut = W2.length;
  return { nIn, nH, nOut, W1: Float64Array.from(W1.flat()), B1: new Float64Array(nH), W2: Float64Array.from(W2.flat()), B2: new Float64Array(nOut) };
}

export function mlpForward(n: MLP, x: ArrayLike<number>) {
  const z1 = new Float64Array(n.nH), a1 = new Float64Array(n.nH);
  for (let h = 0; h < n.nH; h++) {
    let s = n.B1[h];
    const o = h * n.nIn;
    for (let i = 0; i < n.nIn; i++) s += n.W1[o + i] * x[i];
    z1[h] = s; a1[h] = s > 0 ? s : 0;
  }
  const z2 = new Float64Array(n.nOut);
  let mx = -Infinity;
  for (let k = 0; k < n.nOut; k++) {
    let s = n.B2[k];
    const o = k * n.nH;
    for (let h = 0; h < n.nH; h++) s += n.W2[o + h] * a1[h];
    z2[k] = s; if (s > mx) mx = s;
  }
  let se = 0;
  const p = new Float64Array(n.nOut);
  for (let k = 0; k < n.nOut; k++) { p[k] = Math.exp(z2[k] - mx); se += p[k]; }
  for (let k = 0; k < n.nOut; k++) p[k] /= se;
  return { z1, a1, z2, p };
}

/** Một bước SGD trên một lô; trả về mất mát trung bình của lô (tính trước khi cập nhật). */
export function mlpStep(n: MLP, X: ArrayLike<number>[], Y: number[], idx: number[], lr: number): number {
  const gW1 = new Float64Array(n.W1.length), gB1 = new Float64Array(n.nH);
  const gW2 = new Float64Array(n.W2.length), gB2 = new Float64Array(n.nOut);
  let loss = 0;
  const m = idx.length;
  for (const i of idx) {
    const x = X[i];
    const f = mlpForward(n, x);
    loss -= Math.log(f.p[Y[i]]);
    const g2 = Float64Array.from(f.p);
    g2[Y[i]] -= 1;
    for (let k = 0; k < n.nOut; k++) {
      const g = g2[k] / m;
      gB2[k] += g;
      const o = k * n.nH;
      for (let h = 0; h < n.nH; h++) gW2[o + h] += g * f.a1[h];
    }
    for (let h = 0; h < n.nH; h++) {
      if (f.z1[h] <= 0) continue;
      let g = 0;
      for (let k = 0; k < n.nOut; k++) g += g2[k] * n.W2[k * n.nH + h];
      g /= m;
      gB1[h] += g;
      const o = h * n.nIn;
      for (let j = 0; j < n.nIn; j++) gW1[o + j] += g * x[j];
    }
  }
  for (let t = 0; t < n.W1.length; t++) n.W1[t] -= lr * gW1[t];
  for (let t = 0; t < n.nH; t++) n.B1[t] -= lr * gB1[t];
  for (let t = 0; t < n.W2.length; t++) n.W2[t] -= lr * gW2[t];
  for (let t = 0; t < n.nOut; t++) n.B2[t] -= lr * gB2[t];
  return loss / m;
}

export function mlpEpoch(n: MLP, X: ArrayLike<number>[], Y: number[], order: number[], batch: number, lr: number): number[] {
  const losses: number[] = [];
  for (let s = 0; s < order.length; s += batch) losses.push(mlpStep(n, X, Y, order.slice(s, s + batch), lr));
  return losses;
}

export const mlpPredict = (n: MLP, x: ArrayLike<number>) => { const p = mlpForward(n, x).p; let b = 0; for (let k = 1; k < p.length; k++) if (p[k] > p[b]) b = k; return b; };
