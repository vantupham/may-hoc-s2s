/**
 * Cây quyết định CART (Gini), Random Forest và Gradient Boosting cho phân loại nhị phân.
 * Cách chọn ngưỡng giống scikit-learn: trung điểm giữa hai giá trị liên tiếp khác nhau,
 * duyệt tăng dần, chỉ nhận ngưỡng tốt hơn hẳn.
 */
export interface Row { x: number[]; y: number }

export interface TreeNode {
  id: number;
  depth: number;
  n: number;
  counts: [number, number];
  gini: number;
  feature?: number;
  thr?: number;
  left?: TreeNode;
  right?: TreeNode;
  /** dùng cho cây hồi quy trong boosting */
  value?: number;
}

export const gini = (n0: number, n1: number) => {
  const n = n0 + n1;
  return n === 0 ? 0 : 1 - (n0 / n) ** 2 - (n1 / n) ** 2;
};

export interface Candidate { thr: number; left: [number, number]; right: [number, number]; gini: number }

/** Mọi ngưỡng có thể của một đặc trưng, kèm Gini có trọng số sau khi chia. */
export function splitCandidates(rows: Row[], f: number): Candidate[] {
  const s = rows.map((r) => [r.x[f], r.y] as const).sort((a, b) => a[0] - b[0]);
  const tot: [number, number] = [0, 0];
  s.forEach(([, y]) => tot[y]++);
  const l: [number, number] = [0, 0];
  const out: Candidate[] = [];
  const n = s.length;
  for (let i = 0; i < n - 1; i++) {
    l[s[i][1]]++;
    if (s[i + 1][0] <= s[i][0]) continue;
    const r: [number, number] = [tot[0] - l[0], tot[1] - l[1]];
    const nl = i + 1, nr = n - nl;
    out.push({ thr: (s[i][0] + s[i + 1][0]) / 2, left: [l[0], l[1]], right: r, gini: (nl / n) * gini(l[0], l[1]) + (nr / n) * gini(r[0], r[1]) });
  }
  return out;
}

export function bestSplit(rows: Row[], feats: number[]) {
  let best: (Candidate & { feature: number }) | null = null;
  for (const f of feats) {
    for (const c of splitCandidates(rows, f)) if (!best || c.gini < best.gini - 1e-12) best = { ...c, feature: f };
  }
  return best;
}

/** Bộ sinh số ngẫu nhiên có hạt giống, để kết quả lặp lại được. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample<T>(arr: T[], k: number, rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k).sort((u: any, v: any) => u - v);
}

export interface TreeOpts { maxDepth: number; nFeatures: number; maxFeatures?: number; rnd?: () => number; minLeaf?: number }

export function buildTree(rows: Row[], o: TreeOpts): TreeNode {
  let id = 0;
  const all = Array.from({ length: o.nFeatures }, (_, i) => i);
  const grow = (rs: Row[], depth: number): TreeNode => {
    const counts: [number, number] = [0, 0];
    rs.forEach((r) => counts[r.y]++);
    const node: TreeNode = { id: id++, depth, n: rs.length, counts, gini: gini(counts[0], counts[1]) };
    if (depth >= o.maxDepth || node.gini === 0 || rs.length < 2) return node;
    const feats = o.maxFeatures && o.rnd ? sample(all, o.maxFeatures, o.rnd) : all;
    const sp = bestSplit(rs, feats);
    if (!sp || sp.gini >= node.gini - 1e-12) return node;
    const L = rs.filter((r) => r.x[sp.feature] <= sp.thr);
    const R = rs.filter((r) => r.x[sp.feature] > sp.thr);
    if (L.length < (o.minLeaf ?? 1) || R.length < (o.minLeaf ?? 1)) return node;
    node.feature = sp.feature;
    node.thr = sp.thr;
    node.left = grow(L, depth + 1);
    node.right = grow(R, depth + 1);
    return node;
  };
  return grow(rows, 0);
}

/** Đường đi của một mẫu từ gốc tới lá. */
export function pathOf(node: TreeNode, x: number[]): TreeNode[] {
  const p = [node];
  let cur = node;
  while (cur.left && cur.right) {
    cur = x[cur.feature!] <= cur.thr! ? cur.left : cur.right;
    p.push(cur);
  }
  return p;
}
export const leafOf = (node: TreeNode, x: number[]) => pathOf(node, x).at(-1)!;
export const probaTree = (node: TreeNode, x: number[]) => { const l = leafOf(node, x); return l.counts[1] / l.n; };
export const predictTree = (node: TreeNode, x: number[]) => { const l = leafOf(node, x); return l.counts[1] > l.counts[0] ? 1 : 0; };

export function nodes(node: TreeNode): TreeNode[] {
  return [node, ...(node.left ? nodes(node.left) : []), ...(node.right ? nodes(node.right) : [])];
}

/* ------------------------------------------------------------------ Random Forest */
export function randomForest(rows: Row[], o: { nTrees: number; maxDepth: number; nFeatures: number; maxFeatures: number; seed: number }) {
  const rnd = mulberry32(o.seed);
  const trees: TreeNode[] = [];
  for (let t = 0; t < o.nTrees; t++) {
    const boot = Array.from({ length: rows.length }, () => rows[Math.floor(rnd() * rows.length)]);
    trees.push(buildTree(boot, { maxDepth: o.maxDepth, nFeatures: o.nFeatures, maxFeatures: o.maxFeatures, rnd }));
  }
  return trees;
}
export const probaForest = (trees: TreeNode[], x: number[]) => trees.reduce((a, t) => a + probaTree(t, x), 0) / trees.length;

/* ------------------------------------------------------------------ Gradient Boosting (log-loss) */
interface RRow { x: number[]; r: number; h: number }

function regTree(rows: RRow[], maxDepth: number, nFeatures: number): TreeNode {
  let id = 0;
  const grow = (rs: RRow[], depth: number): TreeNode => {
    const sr = rs.reduce((a, r) => a + r.r, 0);
    const sh = rs.reduce((a, r) => a + r.h, 0);
    const node: TreeNode = { id: id++, depth, n: rs.length, counts: [0, 0], gini: 0, value: sh > 1e-12 ? sr / sh : 0 };
    if (depth >= maxDepth || rs.length < 2) return node;
    let best: { f: number; thr: number; score: number } | null = null;
    // Tiêu chí MSE trên phần dư: tối đa hoá (ΣrL)²/nL + (ΣrR)²/nR
    for (let f = 0; f < nFeatures; f++) {
      const s = [...rs].sort((a, b) => a.x[f] - b.x[f]);
      let sl = 0;
      for (let i = 0; i < s.length - 1; i++) {
        sl += s[i].r;
        if (s[i + 1].x[f] <= s[i].x[f]) continue;
        const nl = i + 1, nr = s.length - nl;
        const score = (sl * sl) / nl + ((sr - sl) ** 2) / nr;
        if (!best || score > best.score + 1e-12) best = { f, thr: (s[i].x[f] + s[i + 1].x[f]) / 2, score };
      }
    }
    if (!best) return node;
    node.feature = best.f;
    node.thr = best.thr;
    node.left = grow(rs.filter((r) => r.x[best!.f] <= best!.thr), depth + 1);
    node.right = grow(rs.filter((r) => r.x[best!.f] > best!.thr), depth + 1);
    return node;
  };
  return grow(rows, 0);
}

export function gradientBoosting(rows: Row[], o: { nStages: number; lr: number; maxDepth: number; nFeatures: number }) {
  const p0 = rows.reduce((a, r) => a + r.y, 0) / rows.length;
  const f0 = Math.log(p0 / (1 - p0));
  const F = rows.map(() => f0);
  const trees: TreeNode[] = [];
  const losses: number[] = [];
  const sig = (z: number) => 1 / (1 + Math.exp(-z));
  const lossOf = () => -rows.reduce((a, r, i) => { const p = Math.min(1 - 1e-12, Math.max(1e-12, sig(F[i]))); return a + r.y * Math.log(p) + (1 - r.y) * Math.log(1 - p); }, 0) / rows.length;
  losses.push(lossOf());
  for (let m = 0; m < o.nStages; m++) {
    const rr: RRow[] = rows.map((r, i) => { const p = sig(F[i]); return { x: r.x, r: r.y - p, h: p * (1 - p) }; });
    const t = regTree(rr, o.maxDepth, o.nFeatures);
    trees.push(t);
    rows.forEach((r, i) => { F[i] += o.lr * leafOf(t, r.x).value!; });
    losses.push(lossOf());
  }
  const score = (x: number[], upto = trees.length) => trees.slice(0, upto).reduce((a, t) => a + o.lr * leafOf(t, x).value!, f0);
  return { f0, trees, losses, proba: (x: number[], upto?: number) => sig(score(x, upto)) };
}
