/** Mã hoá và biến đổi đặc trưng: one-hot, chuẩn hoá, min-max, log. */
import { avg, std } from './profile';

/** One-hot: mỗi loại một cột 0/1. dropFirst bỏ cột đầu để tránh trùng với hệ số chặn. */
export function oneHot(codes: number[], nCats: number, dropFirst = false): number[][] {
  const start = dropFirst ? 1 : 0;
  return codes.map((c) => Array.from({ length: nCats - start }, (_, j) => (c === j + start ? 1 : 0)));
}

/** Chuẩn hoá z = (x − μ)/σ với σ tính ddof = 0, giống StandardScaler. Tham số học từ `fitOn` nếu có. */
export function standardize(v: ArrayLike<number>, fitOn?: ArrayLike<number>) {
  const src = Array.from(fitOn ?? v);
  const mu = avg(src), sd = std(src, 0);
  return { mu, sd, z: Array.from(v, (x) => (x - mu) / sd) };
}

/** Min-max về [0, 1], giống MinMaxScaler. */
export function minMax(v: ArrayLike<number>, fitOn?: ArrayLike<number>) {
  const src = Array.from(fitOn ?? v);
  let lo = Infinity, hi = -Infinity;
  for (const x of src) { if (x < lo) lo = x; if (x > hi) hi = x; }
  return { lo, hi, z: Array.from(v, (x) => (x - lo) / (hi - lo)) };
}

/** log(1 + x), giống numpy.log1p. */
export const log1p = (v: ArrayLike<number>) => Array.from(v, (x) => Math.log1p(x));
