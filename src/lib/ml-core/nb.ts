/**
 * Naive Bayes đa thức cho văn bản (Multinomial NB) với làm mịn Laplace α.
 * Huấn luyện = đếm. Dự đoán = cộng log xác suất của từng từ.
 */
export const TOKEN_RE = /[a-z0-9']+/g;
export const tokenize = (s: string): string[] => s.toLowerCase().match(TOKEN_RE) ?? [];

export interface NBModel {
  vocab: string[];
  index: Map<string, number>;
  /** counts[c][j]: số lần từ j xuất hiện trong các tin thuộc lớp c */
  counts: number[][];
  /** số tin mỗi lớp */
  docs: number[];
  alpha: number;
  /** tổng số từ (trong từ điển) của mỗi lớp */
  totals: number[];
}

export function nbFromCounts(vocab: string[], counts: number[][], docs: number[], alpha = 1): NBModel {
  return {
    vocab, counts, docs, alpha,
    index: new Map(vocab.map((w, i) => [w, i])),
    totals: counts.map((row) => row.reduce((a, v) => a + v, 0)),
  };
}

/** Huấn luyện từ các văn bản có nhãn (dùng cho phần tính tay). Từ điển = mọi từ đã gặp. */
export function nbTrain(texts: { y: number; text: string }[], alpha = 1): NBModel {
  const vocab = [...new Set(texts.flatMap((t) => tokenize(t.text)))].sort();
  const index = new Map(vocab.map((w, i) => [w, i]));
  const counts = [new Array(vocab.length).fill(0), new Array(vocab.length).fill(0)];
  const docs = [0, 0];
  texts.forEach((t) => {
    docs[t.y]++;
    tokenize(t.text).forEach((w) => counts[t.y][index.get(w)!]++);
  });
  return nbFromCounts(vocab, counts, docs, alpha);
}

export interface TokenScore { token: string; known: boolean; count: number[]; logp: number[] }

/** log P(c) + Σ log P(từ | c) cho từng lớp, kèm đóng góp của từng từ. Từ lạ bị bỏ qua. */
export function nbScore(m: NBModel, text: string) {
  const V = m.vocab.length;
  const nDocs = m.docs[0] + m.docs[1];
  const prior = m.docs.map((d) => Math.log(d / nDocs));
  const tokens: TokenScore[] = tokenize(text).map((token) => {
    const j = m.index.get(token);
    if (j === undefined) return { token, known: false, count: [0, 0], logp: [0, 0] };
    const count = [m.counts[0][j], m.counts[1][j]];
    const logp = [0, 1].map((c) => Math.log((count[c] + m.alpha) / (m.totals[c] + m.alpha * V)));
    return { token, known: true, count, logp };
  });
  const joint = [0, 1].map((c) => prior[c] + tokens.reduce((a, t) => a + t.logp[c], 0));
  const mx = Math.max(...joint);
  const z = joint.map((v) => Math.exp(v - mx));
  const pSpam = z[1] / (z[0] + z[1]);
  return { prior, tokens, joint, pSpam, pred: joint[1] > joint[0] ? 1 : 0 };
}
