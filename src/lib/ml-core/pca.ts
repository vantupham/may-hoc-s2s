/**
 * PCA: trừ trung bình, tính ma trận hiệp phương sai, tìm vector riêng bằng thuật toán Jacobi
 * (xoay dần để triệt tiêu các phần tử ngoài đường chéo). Ổn định và đủ nhanh cho 64 chiều.
 */
export function mean(X: number[][]) {
  const d = X[0].length;
  const m = new Array(d).fill(0);
  X.forEach((r) => r.forEach((v, j) => (m[j] += v)));
  return m.map((v) => v / X.length);
}

export function covariance(X: number[][], mu = mean(X)) {
  const n = X.length, d = mu.length;
  const C = Array.from({ length: d }, () => new Array(d).fill(0));
  for (const r of X) {
    for (let i = 0; i < d; i++) {
      const a = r[i] - mu[i];
      if (a === 0) continue;
      for (let j = i; j < d; j++) C[i][j] += a * (r[j] - mu[j]);
    }
  }
  for (let i = 0; i < d; i++) for (let j = i; j < d; j++) { C[i][j] /= n - 1; C[j][i] = C[i][j]; }
  return C;
}

/** Trị riêng và vector riêng của ma trận đối xứng, sắp giảm dần theo trị riêng. vectors[k] là vector riêng thứ k. */
export function jacobiEigen(S: number[][], sweeps = 60) {
  const n = S.length;
  const A = S.map((r) => [...r]);
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j): number => (i === j ? 1 : 0)));
  for (let s = 0; s < sweeps; s++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), sn = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - sn * akq;
          A[k][q] = sn * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - sn * aqk;
          A[q][k] = sn * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - sn * vkq;
          V[k][q] = sn * vkp + c * vkq;
        }
      }
    }
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  return { values: order.map((i) => A[i][i]), vectors: order.map((i) => V.map((row) => row[i])) };
}

export function pca(X: number[][]) {
  const mu = mean(X);
  const C = covariance(X, mu);
  const { values, vectors } = jacobiEigen(C);
  const total = values.reduce((a, v) => a + Math.max(0, v), 0);
  const project = (x: number[], k: number) => vectors.slice(0, k).map((v) => v.reduce((a, w, j) => a + w * (x[j] - mu[j]), 0));
  const reconstruct = (z: number[]) => mu.map((m, j) => m + z.reduce((a, zk, k) => a + zk * vectors[k][j], 0));
  return { mu, values, vectors, ratio: values.map((v) => v / total), project, reconstruct };
}
