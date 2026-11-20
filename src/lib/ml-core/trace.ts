/**
 * Định dạng "trace" dùng chung cho mọi thuật toán trong ml-core.
 *
 * Mỗi thuật toán vừa tính kết quả vừa ghi lại từng bước (Step). Mỗi bước giữ
 * trạng thái (state) và danh sách phép tính (Calc) giải thích các con số mới
 * sinh ra ở bước đó. Giao diện chỉ đọc từ trace, nên hình vẽ, bảng số và công
 * thức luôn khớp nhau.
 */

/** Một số hạng đóng góp vào phép tính, ví dụ một dòng dữ liệu trong tổng Σ. */
export interface Term {
  label: string;
  /** Biểu thức đã thay số, ví dụ "(1.20 − 0.85) × 1.97" */
  expr?: string;
  value: number;
}

/** Một phép tính có thể truy vết: tên, công thức, giá trị, và các số hạng tạo ra nó. */
export interface Calc {
  /** Khoá ổn định để giao diện tìm phép tính, ví dụ "dw" */
  key: string;
  /** Tên tiếng Việt hiển thị */
  name: string;
  /** Công thức tổng quát (LaTeX) */
  formula: string;
  /** Công thức đã thay số thật (LaTeX) */
  substituted?: string;
  value: number;
  terms?: Term[];
  note?: string;
}

export interface Step<S> {
  index: number;
  title: string;
  state: S;
  calcs: Calc[];
}

export interface Trace<S> {
  algorithm: string;
  params: Record<string, number | boolean | string>;
  steps: Step<S>[];
}

/** Lấy phép tính theo khoá trong một bước. */
export function calcOf<S>(step: Step<S>, key: string): Calc | undefined {
  return step.calcs.find((c) => c.key === key);
}

/** Định dạng số kiểu Việt Nam: dấu phẩy thập phân. */
export function fmt(v: number, digits = 3): string {
  if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : 'NaN';
  if (Math.abs(v) < 1e-12) v = 0;
  const abs = Math.abs(v);
  let s: string;
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-4)) s = v.toExponential(2);
  else s = v.toFixed(digits);
  return s.replace(/-/g, '−').replace('.', ',');
}

/** Số trong LaTeX: dùng {,} để KaTeX không chèn khoảng trắng sau dấu phẩy. */
export function tex(v: number, digits = 3): string {
  return fmt(v, digits).replace(',', '{,}');
}

/**
 * Biểu thức tổng đã thay số, tự xuống dòng mỗi `perLine` số hạng để vừa khung hẹp.
 * Ví dụ: lhs = \frac{2}{5}( t1 + t2 + … ) = kết quả
 */
export function texSum(lhs: string, prefix: string, terms: string[], result: string, perLine = 2): string {
  const chunks: string[] = [];
  for (let i = 0; i < terms.length; i += perLine) chunks.push(terms.slice(i, i + perLine).join(' + '));
  if (chunks.length <= 1) return `${lhs} = ${prefix}\\left(${chunks[0] ?? ''}\\right) = ${result}`;
  const body = chunks.map((c, i) => (i === 0 ? `${lhs} &= ${prefix}\\big(${c}` : `&\\qquad + ${c}`)).join(' \\\\ ');
  return `\\begin{aligned} ${body}\\big) \\\\ &= ${result} \\end{aligned}`;
}

/** Số âm trong biểu thức thay số được đặt trong ngoặc. */
export function texp(v: number, digits = 3): string {
  return v < 0 ? `(${tex(v, digits)})` : tex(v, digits);
}
