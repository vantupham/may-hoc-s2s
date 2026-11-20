/** Chia dữ liệu: ngẫu nhiên, phân tầng theo nhãn, theo nhóm; GroupKFold như scikit-learn. */
import { mulberry32 } from './tree';

/** Hoán vị 0..n−1 bằng Fisher–Yates với bộ sinh có hạt giống. */
export function permutation(n: number, seed: number): number[] {
  const rnd = mulberry32(seed);
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Chia ngẫu nhiên: nTest phần tử đầu của hoán vị vào tập test. */
export function randomSplit(n: number, testFrac: number, seed: number) {
  const p = permutation(n, seed), nt = Math.round(n * testFrac);
  return { test: p.slice(0, nt), train: p.slice(nt) };
}

/** Chia phân tầng: chia ngẫu nhiên riêng trong từng tầng để tỷ lệ các tầng ở hai tập bằng nhau. */
export function stratifiedSplit(strata: number[], testFrac: number, seed: number) {
  const p = permutation(strata.length, seed);
  const by = new Map<number, number[]>();
  for (const i of p) { if (!by.has(strata[i])) by.set(strata[i], []); by.get(strata[i])!.push(i); }
  const test: number[] = [], train: number[] = [];
  for (const [, idx] of [...by].sort((a, b) => a[0] - b[0])) {
    const nt = Math.round(idx.length * testFrac);
    test.push(...idx.slice(0, nt)); train.push(...idx.slice(nt));
  }
  return { test, train };
}

/** Chia theo nhóm: xáo thứ tự các nhóm, lấy lần lượt cả nhóm vào tập test tới khi đủ cỡ. */
export function groupSplit(groups: (number | string)[], testFrac: number, seed: number) {
  const uniq = [...new Set(groups)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const order = permutation(uniq.length, seed).map((i) => uniq[i]);
  const size = new Map<number | string, number>();
  for (const g of groups) size.set(g, (size.get(g) ?? 0) + 1);
  const target = Math.round(groups.length * testFrac), inTest = new Set<number | string>();
  let cum = 0;
  for (const g of order) { if (cum >= target) break; inTest.add(g); cum += size.get(g)!; }
  const test: number[] = [], train: number[] = [];
  groups.forEach((g, i) => (inTest.has(g) ? test : train).push(i));
  return { test, train };
}

/**
 * GroupKFold (không xáo trộn) của scikit-learn: sắp các nhóm theo số mẫu giảm dần,
 * lần lượt đưa mỗi nhóm vào phần đang có ít mẫu nhất. Trả về số phần của từng dòng.
 */
export function groupKFold(groups: (number | string)[], k: number): number[] {
  const uniq = [...new Set(groups)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const size = new Map<number | string, number>();
  for (const g of groups) size.set(g, (size.get(g) ?? 0) + 1);
  // như argsort ổn định tăng dần rồi đảo ngược: nhóm bằng cỡ thì nhóm đứng sau đi trước
  const order = uniq.map((g, i) => [g, i] as const).sort((a, b) => size.get(b[0])! - size.get(a[0])! || b[1] - a[1]).map(([g]) => g);
  const load = new Array(k).fill(0), foldOf = new Map<number | string, number>();
  for (const g of order) {
    let f = 0;
    for (let j = 1; j < k; j++) if (load[j] < load[f]) f = j;
    foldOf.set(g, f); load[f] += size.get(g)!;
  }
  return groups.map((g) => foldOf.get(g)!);
}

/** Các phần liên tiếp kích thước gần bằng nhau (numpy.array_split) trên một danh sách chỉ số. */
export function chunks<T>(a: T[], k: number): T[][] {
  const n = a.length, out: T[][] = [];
  let s = 0;
  for (let i = 0; i < k; i++) { const len = Math.floor(n / k) + (i < n % k ? 1 : 0); out.push(a.slice(s, s + len)); s += len; }
  return out;
}
