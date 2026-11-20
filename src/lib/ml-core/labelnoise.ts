/**
 * Nhãn sai: lật nhãn có hạt giống; hồi quy logistic có điều chuẩn L2 (Newton, giống LogisticRegression(C)
 * của scikit-learn); xác suất ngoài tập (out-of-fold); và bản rút gọn của confident learning.
 */
import { mulberry32 } from './tree';

/** Lật nhãn của các dòng trong `idx` với xác suất p. */
export function flipLabels(y: number[], idx: number[], p: number, seed: number) {
  const rnd = mulberry32(seed), out = [...y], flipped: number[] = [];
  for (const i of idx) if (rnd() < p) { out[i] = 1 - out[i]; flipped.push(i); }
  return { y: out, flipped };
}

/** Giải hệ Ax = b bằng khử Gauss có chọn phần tử trội. */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      if (f !== 0) for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j];
    x[r] = s / M[r][r];
  }
  return x;
}

const sig = (z: number) => 1 / (1 + Math.exp(-z));

/**
 * Hồi quy logistic: cực tiểu ½‖w‖² + C·Σ log-loss (hệ số chặn không bị phạt), như scikit-learn.
 * Trả về [b, w1, …, wd].
 */
export function logregL2(X: number[][], y: number[], C = 1, iters = 30): number[] {
  const d = X[0].length, p = d + 1;
  let th = new Array(p).fill(0);
  for (let it = 0; it < iters; it++) {
    const g = new Array(p).fill(0);
    const H = Array.from({ length: p }, () => new Array(p).fill(0));
    for (let i = 0; i < X.length; i++) {
      const xi = X[i];
      let z = th[0];
      for (let j = 0; j < d; j++) z += th[j + 1] * xi[j];
      const pr = sig(z), r = C * (pr - y[i]), w = C * pr * (1 - pr);
      g[0] += r;
      for (let j = 0; j < d; j++) g[j + 1] += r * xi[j];
      H[0][0] += w;
      for (let a = 0; a < d; a++) {
        const wa = w * xi[a];
        H[0][a + 1] += wa;
        for (let c = a; c < d; c++) H[a + 1][c + 1] += wa * xi[c];
      }
    }
    for (let a = 0; a < p; a++) for (let c = 0; c < a; c++) H[a][c] = H[c][a];
    for (let j = 1; j < p; j++) { g[j] += th[j]; H[j][j] += 1; }
    const step = solve(H, g);
    th = th.map((v, j) => v - step[j]);
    if (Math.max(...step.map(Math.abs)) < 1e-10) break;
  }
  return th;
}

export function probaOf(th: number[], x: number[]): number {
  let z = th[0];
  for (let j = 0; j < x.length; j++) z += th[j + 1] * x[j];
  return sig(z);
}

/** Xác suất lớp 1 ngoài tập: mỗi dòng được chấm bởi mô hình không nhìn thấy nó khi học. */
export function oofProba(X: number[][], y: number[], folds: number[][], C = 1): number[] {
  const out = new Array(X.length).fill(NaN);
  for (const f of folds) {
    const hold = new Set(f);
    const tx: number[][] = [], ty: number[] = [];
    X.forEach((x, i) => { if (!hold.has(i)) { tx.push(x); ty.push(y[i]); } });
    const th = logregL2(tx, ty, C);
    for (const i of f) out[i] = probaOf(th, X[i]);
  }
  return out;
}

/**
 * Confident learning (bản hai lớp): ngưỡng t_j = xác suất lớp j trung bình trên các dòng đang mang nhãn j.
 * Một dòng nhãn y bị nghi là sai khi xác suất của lớp kia ≥ ngưỡng của lớp kia.
 */
export function confidentFlags(p1: number[], y: number[]) {
  const pj = (i: number, j: number) => (j === 1 ? p1[i] : 1 - p1[i]);
  const t = [0, 1].map((j) => {
    let s = 0, n = 0;
    y.forEach((v, i) => { if (v === j) { s += pj(i, j); n++; } });
    return s / n;
  });
  const flags: number[] = [];
  y.forEach((v, i) => { if (pj(i, 1 - v) >= t[1 - v]) flags.push(i); });
  // xếp theo mức "phản đối" giảm dần
  flags.sort((a, b) => pj(b, 1 - y[b]) - pj(a, 1 - y[a]));
  return { t, flags };
}
