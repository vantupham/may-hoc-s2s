import { type Calc, tex } from './trace';

/** Một điểm dữ liệu có nhãn trong không gian 2 chiều. */
export interface Pt2 { id: number; a: number; b: number; y: number }

export interface Neighbor { id: number; y: number; dist: number; da: number; db: number }

/** Khoảng cách Euclid từ q tới mọi điểm, sắp xếp tăng dần (ổn định theo thứ tự ban đầu). */
export function neighbors(q: { a: number; b: number }, pts: Pt2[]): Neighbor[] {
  return pts
    .map((p, i) => ({ i, id: p.id, y: p.y, da: p.a - q.a, db: p.b - q.b, dist: Math.hypot(p.a - q.a, p.b - q.b) }))
    .sort((u, v) => u.dist - v.dist || u.i - v.i)
    .map(({ i, ...rest }) => rest);
}

/** Bỏ phiếu đa số trong k láng giềng gần nhất; hoà thì chọn lớp có chỉ số nhỏ hơn (như scikit-learn). */
export function knnPredict(q: { a: number; b: number }, pts: Pt2[], k: number, nClass: number) {
  const nb = neighbors(q, pts).slice(0, k);
  const votes = new Array(nClass).fill(0);
  nb.forEach((n) => votes[n.y]++);
  let best = 0;
  for (let c = 1; c < nClass; c++) if (votes[c] > votes[best]) best = c;
  return { pred: best, votes, nb };
}

/** Phép tính khoảng cách tới một láng giềng, để hiển thị. */
export function distCalc(q: { a: number; b: number }, p: { a: number; b: number }, label: string): Calc {
  const d = Math.hypot(p.a - q.a, p.b - q.b);
  return {
    key: `d-${label}`,
    name: `Khoảng cách tới ${label}`,
    formula: String.raw`d = \sqrt{(\cx{a} - a_q)^2 + (\cx{b} - b_q)^2}`,
    substituted: String.raw`d = \sqrt{(\cx{${tex(p.a, 1)}} - ${tex(q.a, 2)})^2 + (\cx{${tex(p.b, 1)}} - ${tex(q.b, 2)})^2} = ${tex(d, 3)}`,
    value: d,
  };
}
