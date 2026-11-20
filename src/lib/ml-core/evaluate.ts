/** Công cụ đánh giá: bình phương tối thiểu (QR Householder), đặc trưng đa thức, chia k-fold, ROC/AUC. */

/** Giải min ‖Ab − y‖² bằng phân rã QR Householder (ổn định hơn phương trình chuẩn). */
export function lstsq(A: number[][], y: number[]): number[] {
  const m = A.length, n = A[0].length;
  const R = A.map((r) => [...r]);
  const b = [...y];
  for (let k = 0; k < n; k++) {
    let norm = 0;
    for (let i = k; i < m; i++) norm += R[i][k] ** 2;
    norm = Math.sqrt(norm);
    if (norm === 0) continue;
    const alpha = R[k][k] > 0 ? -norm : norm;
    const v = new Array(m).fill(0);
    for (let i = k; i < m; i++) v[i] = R[i][k];
    v[k] -= alpha;
    let vv = 0;
    for (let i = k; i < m; i++) vv += v[i] ** 2;
    if (vv === 0) continue;
    for (let j = k; j < n; j++) {
      let s = 0;
      for (let i = k; i < m; i++) s += v[i] * R[i][j];
      const f = (2 * s) / vv;
      for (let i = k; i < m; i++) R[i][j] -= f * v[i];
    }
    let s = 0;
    for (let i = k; i < m; i++) s += v[i] * b[i];
    const f = (2 * s) / vv;
    for (let i = k; i < m; i++) b[i] -= f * v[i];
  }
  const x = new Array(n).fill(0);
  // Cột toàn số 0 (ví dụ một loại không có mặt trong tập huấn luyện): hệ số đặt bằng 0 thay vì chia cho 0
  let big = 0;
  for (let i = 0; i < n; i++) big = Math.max(big, Math.abs(R[i][i]));
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(R[i][i]) <= 1e-12 * big) { x[i] = 0; continue; }
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= R[i][j] * x[j];
    x[i] = s / R[i][i];
  }
  return x;
}

export const polyRow = (v: number, d: number, mu: number, sd: number) => {
  const z = (v - mu) / sd;
  return Array.from({ length: d + 1 }, (_, k) => z ** k);
};
export const polyEval = (coef: number[], v: number, mu: number, sd: number) => {
  const z = (v - mu) / sd;
  return coef.reduce((a, c, k) => a + c * z ** k, 0);
};

export function polyFit(x: number[], y: number[], d: number, mu: number, sd: number) {
  return lstsq(x.map((v) => polyRow(v, d, mu, sd)), y);
}

export const mseOf = (coef: number[], x: number[], y: number[], mu: number, sd: number) =>
  x.reduce((a, v, i) => a + (polyEval(coef, v, mu, sd) - y[i]) ** 2, 0) / x.length;

/** Chia n chỉ số thành k khối liên tiếp như numpy.array_split: n % k khối đầu dài hơn 1. */
export function kfold(n: number, k: number): number[][] {
  const out: number[][] = [];
  let start = 0;
  for (let f = 0; f < k; f++) {
    const len = Math.floor(n / k) + (f < n % k ? 1 : 0);
    out.push(Array.from({ length: len }, (_, i) => start + i));
    start += len;
  }
  return out;
}

export function crossValPoly(x: number[], y: number[], d: number, k: number, mu: number, sd: number) {
  return kfold(x.length, k).map((fold) => {
    const inF = new Set(fold);
    const xi = x.filter((_, i) => !inF.has(i)), yi = y.filter((_, i) => !inF.has(i));
    const coef = polyFit(xi, yi, d, mu, sd);
    return { fold, coef, mse: mseOf(coef, fold.map((i) => x[i]), fold.map((i) => y[i]), mu, sd) };
  });
}

/** Đường ROC: lần lượt hạ ngưỡng qua từng giá trị xác suất (các giá trị bằng nhau được gộp). */
export function rocCurve(prob: number[], y: number[]) {
  const idx = prob.map((_, i) => i).sort((a, b) => prob[b] - prob[a]);
  const P = y.filter((v) => v === 1).length, N = y.length - P;
  const pts = [{ thr: Infinity, fpr: 0, tpr: 0, tp: 0, fp: 0 }];
  let tp = 0, fp = 0;
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k];
    if (y[i] === 1) tp++; else fp++;
    if (k === idx.length - 1 || prob[idx[k + 1]] !== prob[i]) pts.push({ thr: prob[i], fpr: fp / N, tpr: tp / P, tp, fp });
  }
  let auc = 0;
  for (let k = 1; k < pts.length; k++) auc += (pts[k].fpr - pts[k - 1].fpr) * (pts[k].tpr + pts[k - 1].tpr) / 2;
  return { pts, auc, P, N };
}
