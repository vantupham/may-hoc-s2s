/** K-means (thuật toán Lloyd) có ghi trace, và DBSCAN. Dữ liệu 2 chiều. */
export type P2 = [number, number];

export interface KMStep {
  /** tâm cụm dùng ở bước gán */
  centers: P2[];
  /** nhãn sau khi gán mỗi điểm vào tâm gần nhất */
  labels: number[];
  /** tâm mới = trung bình các điểm trong cụm */
  newCenters: P2[];
  /** tổng bình phương khoảng cách tới tâm (inertia) với tâm hiện tại */
  inertia: number;
  moved: number;
}

const d2 = (p: P2, c: P2) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;

export function assign(X: P2[], centers: P2[]) {
  return X.map((p) => {
    let best = 0;
    for (let k = 1; k < centers.length; k++) if (d2(p, centers[k]) < d2(p, centers[best])) best = k;
    return best;
  });
}

export function kmeans(X: P2[], init: P2[], maxIter = 100): KMStep[] {
  const steps: KMStep[] = [];
  let centers = init.map((c) => [...c] as P2);
  let prev: number[] | null = null;
  for (let it = 0; it < maxIter; it++) {
    const labels = assign(X, centers);
    const inertia = X.reduce((a, p, i) => a + d2(p, centers[labels[i]]), 0);
    const newCenters = centers.map((c, k) => {
      const mem = X.filter((_, i) => labels[i] === k);
      return mem.length ? ([mem.reduce((a, p) => a + p[0], 0) / mem.length, mem.reduce((a, p) => a + p[1], 0) / mem.length] as P2) : c;
    });
    const moved = prev ? labels.filter((l, i) => l !== prev![i]).length : labels.length;
    steps.push({ centers, labels, newCenters, inertia, moved });
    const shift = centers.reduce((a, c, k) => a + d2(c, newCenters[k]), 0);
    prev = labels;
    centers = newCenters;
    if (shift === 0) break;
  }
  return steps;
}

/** DBSCAN: điểm lõi có ít nhất minPts điểm (kể cả chính nó) trong bán kính eps. Nhãn −1 là nhiễu. */
export function dbscan(X: P2[], eps: number, minPts: number) {
  const n = X.length;
  const e2 = eps * eps;
  const nb = X.map((p) => X.map((q, j) => (d2(p, q) <= e2 ? j : -1)).filter((j) => j >= 0));
  const core = nb.map((s) => s.length >= minPts);
  const labels = new Array(n).fill(-1);
  let c = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1 || !core[i]) continue;
    const stack = [i];
    labels[i] = c;
    while (stack.length) {
      const j = stack.pop()!;
      if (!core[j]) continue;
      for (const k of nb[j]) {
        if (labels[k] === -1) { labels[k] = c; stack.push(k); }
      }
    }
    c++;
  }
  return { labels, core, nClusters: c };
}
