/**
 * Chuỗi thời gian (chương 12): chia theo thời gian, cross-validation trượt gốc, đặc trưng trễ,
 * mã hoá chu kỳ, điền thiếu chỉ nhìn quá khứ, phát hiện cảm biến kẹt số, tích chập 1D và attention
 * trên vector số liên tục. Đối chiếu với pandas và scikit-learn trong tests/ch12.test.ts.
 */
import type { Calc, Term } from './trace';
import { tex, texp, texSum } from './trace';
import type { Cell } from './profile';

/** Sai số tuyệt đối trung bình. */
export function mae(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

/** Chia theo thời gian: mọi dòng có ngày < cutoff vào train, còn lại vào test (ngày dạng "YYYY-MM-DD"). */
export function timeSplit(dates: string[], cutoff: string) {
  const train: number[] = [], test: number[] = [];
  dates.forEach((d, i) => (d < cutoff ? train : test).push(i));
  return { train, test };
}

/**
 * TimeSeriesSplit của scikit-learn: k phần kiểm định liên tiếp cỡ ⌊n/(k+1)⌋ ở cuối chuỗi;
 * mỗi phần học trên mọi dòng đứng trước nó. gap dòng ngay trước phần kiểm định bị bỏ ra.
 */
export function rollingOrigin(n: number, k: number, gap = 0) {
  const size = Math.floor(n / (k + 1));
  const out: { train: number[]; test: number[] }[] = [];
  for (let s = n - k * size; s < n; s += size) {
    out.push({ train: Array.from({ length: Math.max(0, s - gap) }, (_, i) => i), test: Array.from({ length: size }, (_, i) => s + i) });
  }
  return out;
}

/** Dịch chuỗi đi k bước (pandas shift(k)): phần tử i nhận giá trị i − k, đầu chuỗi là null. */
export function lag(v: Cell[], k: number): Cell[] {
  return v.map((_, i) => (i - k >= 0 && i - k < v.length ? v[i - k] : null));
}

/** Trung bình trượt w bước kết thúc tại i, bỏ qua ô thiếu (pandas rolling(w, min_periods=1).mean()). */
export function rollingMean(v: Cell[], w: number): Cell[] {
  return v.map((_, i) => {
    let s = 0, c = 0;
    for (let j = Math.max(0, i - w + 1); j <= i; j++) { const x = v[j]; if (x !== null && Number.isFinite(x)) { s += x; c++; } }
    return c ? s / c : null;
  });
}

/** Mã hoá chu kỳ: tháng 12 và tháng 1 đứng cạnh nhau trên đường tròn. */
export function cyclic(t: number, period: number): [number, number] {
  const a = (2 * Math.PI * t) / period;
  return [Math.sin(a), Math.cos(a)];
}

/** Điền bằng giá trị gần nhất trong quá khứ (pandas ffill): không bao giờ nhìn tương lai. */
export function ffill(v: Cell[]): Cell[] {
  let last: Cell = null;
  return v.map((x) => (x !== null && Number.isFinite(x) ? (last = x) : last));
}

/**
 * Nội suy tuyến tính giữa hai điểm có số liệu (pandas interpolate(limit_area="inside")).
 * Dùng cả giá trị phía sau ô thiếu, tức là nhìn vào tương lai.
 */
export function interpLinear(v: Cell[]): Cell[] {
  const out = v.slice();
  let prev = -1;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    if (x === null || !Number.isFinite(x)) continue;
    if (prev >= 0 && i - prev > 1) {
      const a = v[prev] as number;
      for (let j = prev + 1; j < i; j++) out[j] = a + ((x - a) * (j - prev)) / (i - prev);
    }
    prev = i;
  }
  return out;
}

export interface Run { start: number; len: number; value?: number }

/** Các đoạn liên tiếp bị thiếu. */
export function gaps(v: Cell[]): Run[] {
  const out: Run[] = [];
  let s = -1;
  for (let i = 0; i <= v.length; i++) {
    const miss = i < v.length && (v[i] === null || !Number.isFinite(v[i] as number));
    if (miss && s < 0) s = i;
    if (!miss && s >= 0) { out.push({ start: s, len: i - s }); s = -1; }
  }
  return out;
}

/** Các đoạn ≥ minLen giá trị có số liệu giống hệt nhau liên tiếp: dấu hiệu cảm biến kẹt số. */
export function stuckRuns(v: Cell[], minLen: number): Run[] {
  const out: Run[] = [];
  let s = 0;
  for (let i = 1; i <= v.length; i++) {
    if (i < v.length && v[i] !== null && v[i] === v[s]) continue;
    if (v[s] !== null && i - s >= minLen) out.push({ start: s, len: i - s, value: v[s] as number });
    s = i;
  }
  return out;
}

/** Tích chập 1D "valid" với nhiều kênh đầu vào: x[t][c], w[j][c] (j = 0..k−1). */
export function conv1d(x: number[][], w: number[][], b: number): number[] {
  const k = w.length, out: number[] = [];
  for (let t = 0; t + k <= x.length; t++) {
    let s = b;
    for (let j = 0; j < k; j++) for (let c = 0; c < w[j].length; c++) s += w[j][c] * x[t + j][c];
    out.push(s);
  }
  return out;
}

/** Phép tính của một ô đầu ra tích chập 1D tại vị trí t, với từng số hạng. */
export function conv1dCalc(x: number[][], w: number[][], b: number, t: number, chans: string[]): Calc {
  const terms: Term[] = [];
  const parts: string[] = [];
  for (let j = 0; j < w.length; j++) for (let c = 0; c < w[j].length; c++) {
    const v = w[j][c] * x[t + j][c];
    terms.push({ label: `giờ t+${j}, ${chans[c]}`, expr: `${tex(w[j][c])} × ${texp(x[t + j][c])}`.replace(/\{,\}/g, ','), value: v });
    parts.push(`${texp(w[j][c])}\\cdot${texp(x[t + j][c])}`);
  }
  terms.push({ label: 'độ lệch b', value: b });
  const value = terms.reduce((a, q) => a + q.value, 0);
  return {
    key: `conv${t}`,
    name: `Đầu ra bộ lọc tại vị trí ${t}`,
    formula: String.raw`z_t = \sum_{j=0}^{k-1}\sum_{c} w_{j,c}\, x_{t+j,c} + b`,
    substituted: texSum(`z_{${t}}`, '', [...parts, texp(b)], tex(value), 2),
    value,
    terms,
  };
}

export const softmax = (v: number[]) => {
  const m = Math.max(...v), e = v.map((x) => Math.exp(x - m)), s = e.reduce((a, x) => a + x, 0);
  return e.map((x) => x / s);
};

const matvec = (W: number[][], x: number[]) => W.map((r) => r.reduce((a, w, j) => a + w * x[j], 0));
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

/**
 * Attention một đầu trên chuỗi vector số: truy vấn là bước cuối cùng (q = Wq·x_T),
 * khoá và giá trị là mọi bước. Trả về điểm, trọng số chú ý và vector ngữ cảnh.
 */
export function attnLast(X: number[][], Wq: number[][], Wk: number[][], Wv: number[][]) {
  const d = Wq.length;
  const q = matvec(Wq, X[X.length - 1]);
  const K = X.map((x) => matvec(Wk, x));
  const V = X.map((x) => matvec(Wv, x));
  const scores = K.map((k) => dot(q, k) / Math.sqrt(d));
  const weights = softmax(scores);
  const ctx = Array.from({ length: Wv.length }, (_, c) => weights.reduce((a, w, t) => a + w * V[t][c], 0));
  return { q, K, V, scores, weights, ctx };
}

/** Phép tính điểm chú ý của bước t: q·k_t / √d. */
export function attnScoreCalc(r: ReturnType<typeof attnLast>, t: number, label: string): Calc {
  const d = r.q.length;
  const terms = r.q.map((qi, i) => ({ label: `chiều ${i + 1}`, expr: `${tex(qi)} × ${texp(r.K[t][i])}`.replace(/\{,\}/g, ','), value: (qi * r.K[t][i]) / Math.sqrt(d) }));
  return {
    key: `score${t}`,
    name: `Điểm chú ý của ${label}`,
    formula: String.raw`s_t = \frac{\mathbf q \cdot \mathbf k_t}{\sqrt d}`,
    substituted: (() => {
      const p = r.q.map((qi, i) => `${texp(qi)}\\cdot${texp(r.K[t][i])}`);
      const lines = [];
      for (let i = 0; i < p.length; i += 2) lines.push(p.slice(i, i + 2).join(' + '));
      const dotv = r.scores[t] * Math.sqrt(d);
      return `\\begin{aligned} \\mathbf q\\cdot\\mathbf k_{${t}} &= ${lines.join(' \\\\ &\\quad + ')} = ${tex(dotv)} \\\\ s_{${t}} &= ${texp(dotv)} / \\sqrt{${d}} = ${tex(r.scores[t])} \\end{aligned}`;
    })(),
    value: r.scores[t],
    terms,
  };
}
