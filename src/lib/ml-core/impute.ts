/** Điền giá trị thiếu: hằng số, trung bình, trung vị, trung vị theo nhóm, K láng giềng gần nhất. */
import type { Cell } from './profile';
import { present, avg, sortNum, quantile } from './profile';

export const median = (v: number[]): number => quantile(sortNum(v), 0.5);

export function fillWith(col: Cell[], value: number): number[] {
  return col.map((x) => (x === null ? value : x));
}

/** Như SimpleImputer(strategy='mean'). */
export const imputeMean = (col: Cell[]) => fillWith(col, avg(present(col)));
/** Như SimpleImputer(strategy='median'). */
export const imputeMedian = (col: Cell[]) => fillWith(col, median(present(col)));

/** Trung vị của từng nhóm, rồi điền ô thiếu bằng trung vị nhóm của dòng đó. */
export function groupMedians(col: Cell[], groups: (string | number)[]) {
  const by = new Map<string | number, number[]>();
  col.forEach((x, i) => { if (x !== null) { const g = groups[i]; if (!by.has(g)) by.set(g, []); by.get(g)!.push(x); } });
  const med = new Map<string | number, number>();
  for (const [g, v] of by) med.set(g, median(v));
  return med;
}

export function imputeGroupMedian(col: Cell[], groups: (string | number)[]): number[] {
  const med = groupMedians(col, groups), all = median(present(col));
  return col.map((x, i) => (x === null ? med.get(groups[i]) ?? all : x));
}

/**
 * KNN: với mỗi dòng thiếu, tìm k dòng có đủ giá trị và gần nhất theo khoảng cách Euclid
 * trên các cột X (đã chuẩn hoá), rồi lấy trung bình giá trị của chúng. Giống KNNImputer(weights='uniform')
 * khi các cột X không có ô thiếu.
 */
export function knnImpute(X: ArrayLike<number>[], col: Cell[], k: number) {
  const donors: number[] = [];
  col.forEach((x, i) => { if (x !== null) donors.push(i); });
  const d = X.length;
  const out = col.map((x) => x as number);
  const neighbours = new Map<number, { idx: number[]; dist: number[] }>();
  col.forEach((x, i) => {
    if (x !== null) return;
    // giữ k khoảng cách nhỏ nhất bằng mảng đã sắp xếp
    const bi: number[] = [], bd: number[] = [];
    for (const j of donors) {
      let s = 0;
      for (let c = 0; c < d; c++) { const t = X[c][i] - X[c][j]; s += t * t; }
      if (bd.length < k || s < bd[bd.length - 1]) {
        let p = bd.length;
        while (p > 0 && bd[p - 1] > s) p--;
        bd.splice(p, 0, s); bi.splice(p, 0, j);
        if (bd.length > k) { bd.pop(); bi.pop(); }
      }
    }
    out[i] = avg(bi.map((j) => col[j] as number));
    neighbours.set(i, { idx: bi, dist: bd.map(Math.sqrt) });
  });
  return { values: out, neighbours };
}
