import { describe, expect, it } from 'vitest';
import ref from './fixtures/ch7.json';
import housing from '../src/data/housing.json';
import { polyFit, mseOf, crossValPoly, rocCurve, kfold } from '../src/lib/ml-core/evaluate';

const test = new Set(housing.testIds);
const tr = housing.sample.filter((r) => !test.has(r.id));
const te = housing.sample.filter((r) => test.has(r.id));
const x = tr.map((r) => r.income), y = tr.map((r) => r.value);
const xt = te.map((r) => r.income), yt = te.map((r) => r.value);
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));

describe('Hồi quy đa thức bằng QR', () => {
  for (const d of [1, 3, 6, 10]) {
    it(`bậc ${d}: hệ số, MSE huấn luyện và MSE test khớp numpy.linalg.lstsq`, () => {
      const r = (ref.deg as any)[String(d)];
      const c = polyFit(x, y, d, ref.mu, ref.sd);
      c.forEach((v, k) => expect(rel(v, r.coef[k]) < 1e-6 || Math.abs(v - r.coef[k]) < 1e-9).toBe(true));
      expect(rel(mseOf(c, x, y, ref.mu, ref.sd), r.train)).toBeLessThan(1e-9);
      expect(rel(mseOf(c, xt, yt, ref.mu, ref.sd), r.test)).toBeLessThan(1e-8);
    });
  }
});

describe('Cross-validation 5 phần', () => {
  it('chia giống numpy.array_split', () => {
    expect(kfold(320, 5).map((f) => f.length)).toEqual([64, 64, 64, 64, 64]);
    expect(kfold(7, 3).map((f) => f.length)).toEqual([3, 2, 2]);
  });
  for (const d of [1, 4, 8]) {
    it(`bậc ${d}: MSE từng phần khớp`, () => {
      const cv = crossValPoly(x, y, d, 5, ref.mu, ref.sd);
      cv.forEach((f, k) => expect(rel(f.mse, (ref.deg as any)[String(d)].cv[k])).toBeLessThan(1e-6));
    });
  }
});

describe('ROC và AUC', () => {
  it('AUC khớp scikit-learn roc_auc_score', () => {
    const r = rocCurve(ref.roc.prob, ref.roc.y);
    expect(r.auc).toBeCloseTo(ref.roc.auc, 12);
    expect(r.pts.at(-1)!.fpr).toBe(1);
    expect(r.pts.at(-1)!.tpr).toBe(1);
  });
});
