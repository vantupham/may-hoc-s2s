/** Hồ sơ dữ liệu: thống kê mô tả, tứ phân vị, độ lệch, tương quan, ngoại lai. Đối chiếu với pandas và NumPy. */
import type { Calc, Term } from './trace';
import { tex, texp, fmt } from './trace';

export type Cell = number | null;

export const present = (v: Cell[]): number[] => v.filter((x): x is number => x !== null && Number.isFinite(x));
export const sortNum = (v: number[]): number[] => [...v].sort((a, b) => a - b);
export const avg = (v: number[]): number => v.reduce((a, x) => a + x, 0) / v.length;

/** Độ lệch chuẩn; ddof = 1 như pandas, ddof = 0 như NumPy/StandardScaler. */
export function std(v: number[], ddof = 1): number {
  const m = avg(v);
  return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - ddof));
}

/** Phân vị kiểu NumPy mặc định (nội suy tuyến tính): vị trí h = (n − 1)·q trên mảng đã sắp xếp. */
export function quantile(sorted: number[], q: number): number {
  const h = (sorted.length - 1) * q;
  const lo = Math.floor(h), hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

/** Phân vị kèm phép tính để hiển thị. */
export function quantileCalc(sorted: number[], q: number, name: string, key = `q${q}`): Calc {
  const n = sorted.length, h = (n - 1) * q, lo = Math.floor(h), hi = Math.min(lo + 1, n - 1), f = h - lo;
  const value = quantile(sorted, q);
  return {
    key, name, value,
    formula: String.raw`h = (n-1)\,q,\quad Q = x_{(\lfloor h\rfloor)} + (h-\lfloor h\rfloor)\big(x_{(\lfloor h\rfloor+1)} - x_{(\lfloor h\rfloor)}\big)`,
    substituted: String.raw`\begin{aligned} h &= (${n}-1)\cdot ${tex(q, 2)} = ${tex(h, 2)} \\ Q &= ${tex(sorted[lo], 4)} + ${tex(f, 2)}\cdot(${tex(sorted[hi], 4)} - ${texp(sorted[lo], 4)}) \\ &= ${tex(value, 4)} \end{aligned}`,
    note: `Số thứ tự đếm từ 0 trên dãy đã sắp xếp tăng dần: x(${lo}) = ${fmt(sorted[lo], 4)}, x(${hi}) = ${fmt(sorted[hi], 4)}.`,
  };
}

/** Độ lệch (skewness) có hiệu chỉnh mẫu, giống pandas Series.skew(). */
export function skewness(v: number[]): number {
  const n = v.length, m = avg(v);
  let m2 = 0, m3 = 0;
  for (const x of v) { const d = x - m; m2 += d * d; m3 += d * d * d; }
  m2 /= n; m3 /= n;
  if (m2 === 0) return 0;
  const g1 = m3 / m2 ** 1.5;
  return (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
}

/** Giá trị xuất hiện nhiều nhất và số lần. Dùng để phát hiện dữ liệu bị chặn trần. */
export function mostFrequent(v: number[]): { value: number; count: number } {
  const c = new Map<number, number>();
  for (const x of v) c.set(x, (c.get(x) ?? 0) + 1);
  let best = { value: NaN, count: 0 };
  for (const [value, count] of c) if (count > best.count || (count === best.count && value > best.value)) best = { value, count };
  return best;
}

export interface Profile {
  count: number; missing: number; mean: number; std: number; min: number;
  q1: number; median: number; q3: number; max: number; skew: number;
  /** Số dòng mang đúng giá trị lớn nhất */
  atMax: number;
  mode: { value: number; count: number };
}

/** Phiếu khám một cột số, tương đương pandas describe() + skew() + isna().sum(). */
export function profile(col: Cell[]): Profile {
  const v = present(col), s = sortNum(v);
  const max = s[s.length - 1];
  let atMax = 0;
  for (let i = s.length - 1; i >= 0 && s[i] === max; i--) atMax++;
  return {
    count: v.length, missing: col.length - v.length, mean: avg(v), std: std(v), min: s[0],
    q1: quantile(s, 0.25), median: quantile(s, 0.5), q3: quantile(s, 0.75), max, skew: skewness(v), atMax,
    mode: mostFrequent(v),
  };
}

/** Giới hạn ngoại lai theo quy tắc k·IQR (Tukey). */
export function iqrBounds(sorted: number[], k = 1.5) {
  const q1 = quantile(sorted, 0.25), q3 = quantile(sorted, 0.75), iqr = q3 - q1;
  return { q1, q3, iqr, lo: q1 - k * iqr, hi: q3 + k * iqr };
}

/** Điểm z: (x − trung bình) / độ lệch chuẩn (ddof = 0 như scipy.stats.zscore). */
export function zscores(v: number[]): number[] {
  const m = avg(v), s = std(v, 0);
  return v.map((x) => (x - m) / s);
}

/** Hệ số tương quan Pearson, bỏ qua các cặp có ô thiếu. */
export function pearson(x: Cell[], y: Cell[]): number {
  let n = 0, sx = 0, sy = 0;
  for (let i = 0; i < x.length; i++) if (x[i] !== null && y[i] !== null) { n++; sx += x[i]!; sy += y[i]!; }
  const mx = sx / n, my = sy / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    if (x[i] === null || y[i] === null) continue;
    const a = x[i]! - mx, b = y[i]! - my;
    sxy += a * b; sxx += a * a; syy += b * b;
  }
  return sxy / Math.sqrt(sxx * syy);
}

/** Pearson kèm từng số hạng (dùng cho mẫu nhỏ, ví dụ 10 dòng). */
export function pearsonCalc(x: number[], y: number[], labels?: string[]): Calc {
  const n = x.length, mx = avg(x), my = avg(y);
  const terms: Term[] = x.map((xi, i) => ({
    label: labels?.[i] ?? `dòng ${i + 1}`,
    expr: `(${fmt(xi, 2)} − ${fmt(mx, 2)}) × (${fmt(y[i], 2)} − ${fmt(my, 2)})`,
    value: (xi - mx) * (y[i] - my),
  }));
  const sxy = terms.reduce((a, t) => a + t.value, 0);
  const sxx = x.reduce((a, v) => a + (v - mx) ** 2, 0), syy = y.reduce((a, v) => a + (v - my) ** 2, 0);
  const value = sxy / Math.sqrt(sxx * syy);
  return {
    key: 'r', name: `Hệ số tương quan r trên ${n} dòng`, value, terms,
    formula: String.raw`r = \frac{\sum_i (x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum_i (x_i-\bar x)^2}\,\sqrt{\sum_i (y_i-\bar y)^2}}`,
    substituted: String.raw`r = \frac{${tex(sxy, 3)}}{\sqrt{${tex(sxx, 3)}}\cdot\sqrt{${tex(syy, 3)}}} = ${tex(value, 3)}`,
    note: `Trung bình: x̄ = ${fmt(mx, 3)}, ȳ = ${fmt(my, 3)}. Tử số là tổng các số hạng trong bảng.`,
  };
}

/** Đếm số giá trị rơi vào từng khoảng đều nhau trên [lo, hi]. */
export function histogram(v: number[], bins: number, lo: number, hi: number): number[] {
  const h = new Array(bins).fill(0), w = (hi - lo) / bins;
  for (const x of v) {
    if (x < lo || x > hi) continue;
    h[Math.min(bins - 1, Math.floor((x - lo) / w))]++;
  }
  return h;
}
