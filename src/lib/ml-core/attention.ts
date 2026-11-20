import { type Calc, tex, texp } from './trace';

/**
 * Self-attention một đầu cho phân loại tin nhắn. Trọng số huấn luyện sẵn bằng NumPy (scripts/prep_ch10.py).
 *   X = E[token] + PE,  Q = XWq, K = XWk, V = XWv,  A = softmax(QKᵀ/√d),  H = AV,  h = trung bình hàng của H,  p = σ(h·u + c)
 */
export interface AttnModel { vocab: string[]; maxLen: number; d: number; PE: number[][]; E: number[][]; Wq: number[][]; Wk: number[][]; Wv: number[][]; u: number[]; c: number }

const TOKEN_RE = /[a-z0-9']+/g;
const matmul = (X: number[][], W: number[][]) => X.map((r) => W[0].map((_, j) => r.reduce((s, v, i) => s + v * W[i][j], 0)));

export function attnTokens(m: AttnModel, text: string) {
  const index = new Map(m.vocab.map((w, i) => [w, i]));
  const words = (text.toLowerCase().match(TOKEN_RE) ?? []).slice(0, m.maxLen);
  const toks = words.length ? words : ['<unk>'];
  return toks.map((w) => ({ word: w, id: index.get(w) ?? 0 }));
}

export function attnForward(m: AttnModel, text: string) {
  const toks = attnTokens(m, text);
  const X = toks.map((t, i) => m.E[t.id].map((v, j) => v + m.PE[i][j]));
  const Q = matmul(X, m.Wq), K = matmul(X, m.Wk), V = matmul(X, m.Wv);
  const sq = Math.sqrt(m.d);
  const S = Q.map((q) => K.map((k) => q.reduce((s, v, j) => s + v * k[j], 0) / sq));
  const A = S.map((row) => { const mx = Math.max(...row); const e = row.map((v) => Math.exp(v - mx)); const se = e.reduce((s, v) => s + v, 0); return e.map((v) => v / se); });
  const H = A.map((a) => V[0].map((_, j) => a.reduce((s, w, t) => s + w * V[t][j], 0)));
  const h = H[0].map((_, j) => H.reduce((s, r) => s + r[j], 0) / H.length);
  const z = h.reduce((s, v, j) => s + v * m.u[j], m.c);
  const p = 1 / (1 + Math.exp(-z));
  return { toks, X, Q, K, V, S, A, H, h, z, p };
}

/** Phép tính của một hàng attention: điểm số với từng token, softmax, rồi trộn các vector V. */
export function attnRowCalc(r: ReturnType<typeof attnForward>, i: number, d: number): Calc {
  const L = r.toks.length;
  const show = Math.min(L, 6);
  const sc = r.S[i];
  return {
    key: `row${i}`, name: `Token "${r.toks[i].word}" nhìn vào các token khác`,
    formula: String.raw`s_{ij} = \frac{\mathbf q_i \cdot \mathbf k_j}{\sqrt{d}}, \quad a_{ij} = \frac{e^{s_{ij}}}{\sum_t e^{s_{it}}}, \quad \mathbf h_i = \sum_j a_{ij}\,\mathbf v_j`,
    substituted: String.raw`\begin{aligned} s_{${i + 1},\cdot} &= (${sc.slice(0, show).map((v) => tex(v, 2)).join(',\\ ')}${L > show ? ',\\ \\dots' : ''}) \\ a_{${i + 1},\cdot} &= (${r.A[i].slice(0, show).map((v) => tex(v < 0.0005 ? 0 : v, 3)).join(',\\ ')}${L > show ? ',\\ \\dots' : ''}) \\ \mathbf h_{${i + 1}} &= (${r.H[i].slice(0, 4).map((v) => tex(v, 2)).join(',\\ ')},\ \dots) \end{aligned}`,
    value: Math.max(...r.A[i]),
    terms: r.toks.map((t, j) => ({ label: t.word, expr: `q·k = ${(sc[j] * Math.sqrt(d)).toFixed(3).replace('.', ',')}, chia √${d}`, value: r.A[i][j] })),
    note: `Mỗi số hạng ở bảng là trọng số chú ý a_ij; tổng của chúng bằng 1.`,
  };
}

export function scoreCalc(r: ReturnType<typeof attnForward>, i: number, j: number, d: number): Calc {
  const q = r.Q[i], k = r.K[j];
  return {
    key: `s${i}${j}`, name: `Điểm số giữa "${r.toks[i].word}" (hỏi) và "${r.toks[j].word}" (được hỏi)`,
    formula: String.raw`s_{ij} = \frac{1}{\sqrt{${d}}}\sum_{t=1}^{${d}} q_{i,t}\,k_{j,t}`,
    substituted: String.raw`s = \tfrac{1}{${tex(Math.sqrt(d), 3)}}\big(${q.map((v, t) => `${texp(v, 2)}\\cdot${texp(k[t], 2)}`).slice(0, 4).join(' + ')} + \dots\big) = ${tex(r.S[i][j], 3)}`,
    value: r.S[i][j],
    terms: q.map((v, t) => ({ label: `chiều ${t + 1}`, expr: `${v.toFixed(3).replace('.', ',')} × ${k[t].toFixed(3).replace('.', ',')}`, value: v * k[t] })),
  };
}
