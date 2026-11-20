import { type Calc, tex, texp, texSum } from './trace';

/**
 * SVM tuyến tính lề mềm, giải bài toán gốc bằng subgradient (kiểu Pegasos, b không bị điều chuẩn):
 *   min_w,b  ½‖w‖² + C Σ max(0, 1 − yᵢ(w·xᵢ + b)),   yᵢ ∈ {−1, +1}
 * Chia cả hai vế cho C·n: λ/2‖w‖² + (1/n)Σ hinge, với λ = 1/(C·n), bước ηₜ = 1/(λ t).
 * Kết quả cuối là trung bình các bước ở nửa sau (Polyak), hội tụ về nghiệm của scikit-learn SVC.
 */
export interface SvmState {
  w: [number, number];
  b: number;
  margins: number[];
  hinge: number[];
  obj: number;
  gw: [number, number];
  gb: number;
  eta: number;
  wNext: [number, number];
  bNext: number;
}

export const svmObjective = (X: [number, number][], y: number[], w: [number, number], b: number, C: number) =>
  0.5 * (w[0] ** 2 + w[1] ** 2) + C * X.reduce((a, x, i) => a + Math.max(0, 1 - y[i] * (w[0] * x[0] + w[1] * x[1] + b)), 0);

export function svmStep(X: [number, number][], y: number[], w: [number, number], b: number, C: number, t: number, detail: boolean) {
  const n = y.length;
  const lam = 1 / (C * n);
  const margins = X.map((x, i) => y[i] * (w[0] * x[0] + w[1] * x[1] + b));
  const hinge = margins.map((m) => Math.max(0, 1 - m));
  let s0 = 0, s1 = 0, sb = 0;
  margins.forEach((m, i) => { if (m < 1) { s0 += y[i] * X[i][0]; s1 += y[i] * X[i][1]; sb += y[i]; } });
  const gw: [number, number] = [lam * w[0] - s0 / n, lam * w[1] - s1 / n];
  const gb = -sb / n;
  const eta = Math.min(10, 1 / (lam * t));
  const wNext: [number, number] = [w[0] - eta * gw[0], w[1] - eta * gw[1]];
  const bNext = b - eta * gb;
  const obj = svmObjective(X, y, w, b, C);
  const state: SvmState = { w, b, margins, hinge, obj, gw, gb, eta, wNext, bNext };
  const calcs: Calc[] = [];
  if (detail) {
    X.forEach((x, i) => {
      calcs.push({
        key: `m${i}`, name: `Lề của bệnh nhân ${i + 1}`,
        formula: String.raw`m_{${i + 1}} = y_{${i + 1}}\,(\cw{w_1}\cx{x_{1}} + \cw{w_2}\cx{x_{2}} + \cb{b})`,
        substituted: String.raw`m_{${i + 1}} = ${texp(y[i], 0)}\times(\cw{${tex(w[0])}}\cdot\cx{${texp(x[0])}} + \cw{${tex(w[1])}}\cdot\cx{${texp(x[1])}} + \cb{${texp(b)}}) = ${tex(margins[i])}`,
        value: margins[i],
        note: margins[i] >= 1 ? 'Lề ≥ 1: điểm nằm ngoài vùng lề, đúng phía. Không đóng góp vào gradient.' : 'Lề < 1: điểm vi phạm lề (hoặc bị phân loại sai). Nó kéo đường ranh giới về phía mình.',
      });
    });
    const viol = margins.map((m, i) => (m < 1 ? i : -1)).filter((i) => i >= 0);
    const terms = viol.length ? viol : [-1];
    calcs.push({
      key: 'gw0', name: 'Subgradient theo w₁',
      formula: String.raw`\cg{g_{w_1}} = \lambda\,\cw{w_1} - \frac{1}{n}\sum_{m_i < 1} y_i\,\cx{x_{i1}}, \quad \lambda = \frac{1}{C\,n}`,
      substituted: texSum(String.raw`\cg{g_{w_1}}`, String.raw`${tex(lam, 4)}\times${texp(w[0])} - \frac{1}{${n}}`, terms.map((i) => (i < 0 ? '0' : String.raw`${texp(y[i], 0)}\cdot\cx{${texp(X[i][0])}}`)), String.raw`\cg{${tex(gw[0], 4)}}`, 3),
      value: gw[0],
    });
    calcs.push({
      key: 'gb', name: 'Subgradient theo b',
      formula: String.raw`\cg{g_b} = -\frac{1}{n}\sum_{m_i < 1} y_i`,
      substituted: String.raw`\cg{g_b} = -\frac{1}{${n}}(${viol.length ? viol.map((i) => texp(y[i], 0)).join(' + ') : '0'}) = \cg{${tex(gb, 4)}}`,
      value: gb,
    });
    calcs.push({
      key: 'upd', name: 'Cập nhật',
      formula: String.raw`\eta_t = \frac{1}{\lambda t}, \quad \cw{\mathbf w} \leftarrow \cw{\mathbf w} - \eta_t\,\cg{\mathbf g_w}, \quad \cb{b} \leftarrow \cb{b} - \eta_t\,\cg{g_b}`,
      substituted: String.raw`\eta_{${t}} = ${tex(eta, 3)}, \quad \cw{\mathbf w} = (${tex(wNext[0])}, ${tex(wNext[1])}), \quad \cb{b} = ${tex(bNext)}`,
      value: eta,
    });
  }
  return { state, calcs };
}

export function svmTrace(X: [number, number][], y: number[], C: number, steps: number) {
  let w: [number, number] = [0, 0];
  let b = 0;
  const out = [];
  for (let t = 1; t <= steps; t++) {
    const { state, calcs } = svmStep(X, y, w, b, C, t, true);
    out.push({ index: t - 1, title: `Bước ${t}`, state, calcs });
    w = state.wNext; b = state.bNext;
  }
  return out;
}

/** Huấn luyện đầy đủ, trả về nghiệm trung bình ở nửa sau. */
export function svmTrain(X: [number, number][], y: number[], C: number, T = 3000) {
  const n = y.length;
  const lam = 1 / (C * n);
  let w0 = 0, w1 = 0, b = 0, a0 = 0, a1 = 0, ab = 0, k = 0;
  for (let t = 1; t <= T; t++) {
    let s0 = 0, s1 = 0, sb = 0;
    for (let i = 0; i < n; i++) {
      if (y[i] * (w0 * X[i][0] + w1 * X[i][1] + b) < 1) { s0 += y[i] * X[i][0]; s1 += y[i] * X[i][1]; sb += y[i]; }
    }
    const eta = Math.min(10, 1 / (lam * t));
    w0 -= eta * (lam * w0 - s0 / n);
    w1 -= eta * (lam * w1 - s1 / n);
    b -= eta * (-sb / n);
    if (t > T / 2) { a0 += w0; a1 += w1; ab += b; k++; }
  }
  const w: [number, number] = [a0 / k, a1 / k];
  const bb = ab / k;
  const margins = X.map((x, i) => y[i] * (w[0] * x[0] + w[1] * x[1] + bb));
  return { w, b: bb, margins, obj: svmObjective(X, y, w, bb, C), nSV: margins.filter((m) => m <= 1 + 1e-3).length };
}
