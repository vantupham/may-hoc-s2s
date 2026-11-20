import { type Calc, type Trace, fmt, tex, texp, texSum } from './trace';

/**
 * Hồi quy logistic hai đặc trưng: z = w₁x₁ + w₂x₂ + b, p = σ(z),
 * mất mát cross-entropy nhị phân.
 */
export interface LogRegState {
  w: [number, number];
  b: number;
  z: number[];
  probs: number[];
  losses: number[];
  loss: number;
  gw: [number, number];
  gb: number;
  wNext: [number, number];
  bNext: number;
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const EPS = 1e-12;
const clip = (p: number) => Math.min(1 - EPS, Math.max(EPS, p));

export function bce(y: number, p: number): number {
  const q = clip(p);
  return -(y * Math.log(q) + (1 - y) * Math.log(1 - q));
}

export function logregStep(
  X: [number, number][],
  ys: number[],
  w: [number, number],
  b: number,
  lr: number,
  detail: boolean,
): { state: LogRegState; calcs: Calc[] } {
  const n = ys.length;
  const z = X.map(([a, c]) => w[0] * a + w[1] * c + b);
  const probs = z.map(sigmoid);
  const losses = probs.map((p, i) => bce(ys[i], p));
  const loss = losses.reduce((a, v) => a + v, 0) / n;
  const diff = probs.map((p, i) => p - ys[i]);
  const gw: [number, number] = [0, 0];
  let gb = 0;
  for (let i = 0; i < n; i++) {
    gw[0] += (diff[i] * X[i][0]) / n;
    gw[1] += (diff[i] * X[i][1]) / n;
    gb += diff[i] / n;
  }
  const wNext: [number, number] = [w[0] - lr * gw[0], w[1] - lr * gw[1]];
  const bNext = b - lr * gb;

  const calcs: Calc[] = [];
  if (detail) {
    X.forEach(([a, c], i) => {
      const k = i + 1;
      calcs.push({
        key: `z${i}`, name: `Điểm số z — bệnh nhân ${k}`,
        formula: String.raw`\cz{z_{${k}}} = \cw{w_1}\cx{x_{${k}1}} + \cw{w_2}\cx{x_{${k}2}} + \cb{b}`,
        substituted: String.raw`\cz{z_{${k}}} = \cw{${tex(w[0])}}\cdot\cx{${texp(a)}} + \cw{${tex(w[1])}}\cdot\cx{${texp(c)}} + \cb{${texp(b)}} = \cz{${tex(z[i])}}`,
        value: z[i],
      });
      calcs.push({
        key: `p${i}`, name: `Xác suất ác tính — bệnh nhân ${k}`,
        formula: String.raw`\cp{p_{${k}}} = \sigma(\cz{z_{${k}}}) = \frac{1}{1+e^{-\cz{z_{${k}}}}}`,
        substituted: String.raw`\cp{p_{${k}}} = \frac{1}{1+e^{-${texp(z[i])}}} = \cp{${tex(probs[i])}}`,
        value: probs[i],
      });
      calcs.push({
        key: `l${i}`, name: `Mất mát — bệnh nhân ${k}`,
        formula: ys[i] === 1 ? String.raw`\cL{\ell_{${k}}} = -\ln \cp{p_{${k}}} \quad (\cy{y_{${k}}}=1)` : String.raw`\cL{\ell_{${k}}} = -\ln(1-\cp{p_{${k}}}) \quad (\cy{y_{${k}}}=0)`,
        substituted: ys[i] === 1 ? String.raw`\cL{\ell_{${k}}} = -\ln ${tex(probs[i])} = \cL{${tex(losses[i])}}` : String.raw`\cL{\ell_{${k}}} = -\ln(1-${tex(probs[i])}) = \cL{${tex(losses[i])}}`,
        value: losses[i],
      });
    });
  }
  calcs.push({
    key: 'loss', name: 'Mất mát trung bình (cross-entropy)',
    formula: String.raw`\cL{L} = \frac{1}{n}\sum_{i=1}^{n} \cL{\ell_i}`,
    substituted: detail
      ? texSum(String.raw`\cL{L}`, String.raw`\frac{1}{${n}}`, losses.map((l) => String.raw`\cL{${tex(l)}}`), String.raw`\cL{${tex(loss, 4)}}`, 3)
      : String.raw`\cL{L} = \cL{${tex(loss, 4)}}`,
    value: loss,
    terms: detail ? losses.map((l, i) => ({ label: `BN ${i + 1}`, value: l })) : undefined,
  });
  const gNames = ['w_1', 'w_2'];
  [0, 1].forEach((j) => {
    calcs.push({
      key: `gw${j}`, name: `Đạo hàm theo w${j + 1}`,
      formula: String.raw`\cg{\frac{\partial L}{\partial ${gNames[j]}}} = \frac{1}{n}\sum (\cp{p_i}-\cy{y_i})\,\cx{x_{i${j + 1}}}`,
      substituted: detail
        ? texSum(String.raw`\cg{\frac{\partial L}{\partial ${gNames[j]}}}`, String.raw`\frac{1}{${n}}`, diff.map((d, i) => String.raw`${texp(d)}\cdot\cx{${texp(X[i][j])}}`), String.raw`\cg{${tex(gw[j], 4)}}`, 2)
        : String.raw`\cg{\frac{\partial L}{\partial ${gNames[j]}}} = \cg{${tex(gw[j], 4)}}`,
      value: gw[j],
      terms: detail ? diff.map((d, i) => ({ label: `BN ${i + 1}`, expr: `${fmt(d)} × ${fmt(X[i][j])}`, value: d * X[i][j] })) : undefined,
    });
  });
  calcs.push({
    key: 'gb', name: 'Đạo hàm theo b',
    formula: String.raw`\cg{\frac{\partial L}{\partial b}} = \frac{1}{n}\sum (\cp{p_i}-\cy{y_i})`,
    substituted: detail
      ? texSum(String.raw`\cg{\frac{\partial L}{\partial b}}`, String.raw`\frac{1}{${n}}`, diff.map((d) => texp(d)), String.raw`\cg{${tex(gb, 4)}}`, 3)
      : String.raw`\cg{\frac{\partial L}{\partial b}} = \cg{${tex(gb, 4)}}`,
    value: gb,
  });
  [0, 1].forEach((j) => {
    calcs.push({
      key: `wNext${j}`, name: `Cập nhật w${j + 1}`,
      formula: String.raw`\cw{${gNames[j]}} \leftarrow \cw{${gNames[j]}} - \ceta{\eta}\,\cg{\frac{\partial L}{\partial ${gNames[j]}}}`,
      substituted: String.raw`\cw{${tex(w[j], 4)}} - \ceta{${tex(lr, 2)}}\times\cg{${texp(gw[j], 4)}} = \cw{${tex(wNext[j], 4)}}`,
      value: wNext[j],
    });
  });
  calcs.push({
    key: 'bNext', name: 'Cập nhật b',
    formula: String.raw`\cb{b} \leftarrow \cb{b} - \ceta{\eta}\,\cg{\frac{\partial L}{\partial b}}`,
    substituted: String.raw`\cb{${tex(b, 4)}} - \ceta{${tex(lr, 2)}}\times\cg{${texp(gb, 4)}} = \cb{${tex(bNext, 4)}}`,
    value: bNext,
  });

  return { state: { w, b, z, probs, losses, loss, gw, gb, wNext, bNext }, calcs };
}

export function logisticRegressionGD(
  X: [number, number][],
  ys: number[],
  opts: { lr?: number; epochs?: number; detail?: boolean; w0?: [number, number]; b0?: number } = {},
): Trace<LogRegState> {
  const { lr = 0.5, epochs = 100, detail = ys.length <= 12, w0 = [0, 0], b0 = 0 } = opts;
  let w: [number, number] = [...w0];
  let b = b0;
  const steps = [];
  for (let k = 0; k < epochs; k++) {
    const { state, calcs } = logregStep(X, ys, w, b, lr, detail);
    steps.push({ index: k, title: `Vòng lặp ${k + 1}`, state, calcs });
    w = state.wNext;
    b = state.bNext;
  }
  return { algorithm: 'logistic-regression-gd', params: { lr, epochs }, steps };
}

/** Ma trận nhầm lẫn tại một ngưỡng. Lớp dương (1) = ác tính. */
export function confusion(ys: number[], probs: number[], threshold = 0.5) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  ys.forEach((y, i) => {
    const pred = probs[i] >= threshold ? 1 : 0;
    if (pred === 1 && y === 1) tp++;
    else if (pred === 1 && y === 0) fp++;
    else if (pred === 0 && y === 0) tn++;
    else fn++;
  });
  const n = ys.length;
  return {
    tp, fp, tn, fn,
    accuracy: (tp + tn) / n,
    precision: tp + fp === 0 ? 0 : tp / (tp + fp),
    recall: tp + fn === 0 ? 0 : tp / (tp + fn),
  };
}
