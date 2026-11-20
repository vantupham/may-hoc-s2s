/** Các trường hợp biên: dữ liệu một lớp, xác suất bão hoà, định dạng số mũ. */
import { describe, expect, it } from 'vitest';
import { fmt } from '../src/lib/ml-core/trace';
import { rocCurve } from '../src/lib/ml-core/evaluate';
import { tinyPass, type Tiny } from '../src/lib/ml-core/nn';
import { gradientBoosting, type Row } from '../src/lib/ml-core/tree';

describe('fmt', () => {
  it('dùng dấu trừ Unicode cho cả số mũ', () => {
    expect(fmt(1.5e-5)).toBe('1,50e−5');
    expect(fmt(-1.5e-5)).toBe('−1,50e−5');
    expect(fmt(-2.25)).toBe('−2,250');
  });
});

describe('rocCurve khi chỉ có một lớp', () => {
  it('không chia cho 0, AUC là NaN', () => {
    for (const y of [[1, 1, 1], [0, 0, 0]]) {
      const r = rocCurve([0.9, 0.5, 0.1], y);
      r.pts.forEach((p) => { expect(Number.isFinite(p.fpr)).toBe(true); expect(Number.isFinite(p.tpr)).toBe(true); });
      expect(r.auc).toBeNaN();
    }
  });
});

describe('tinyPass khi đầu ra bão hoà', () => {
  it('mất mát hữu hạn', () => {
    const net: Tiny = { W1: [[50, 50], [50, 50], [50, 50]], b1: [0, 0, 0], w2: [50, 50, 50], b2: 0 };
    const r = tinyPass(net, [10, 10], 0);
    expect(Number.isFinite(r.loss)).toBe(true);
    expect(r.loss).toBeGreaterThan(20);
  });
});

describe('gradientBoosting trên tập một lớp', () => {
  it('log-odds ban đầu và xác suất hữu hạn', () => {
    const rows: Row[] = [{ x: [0], y: 1 }, { x: [1], y: 1 }, { x: [2], y: 1 }];
    const g = gradientBoosting(rows, { nStages: 3, lr: 0.1, maxDepth: 1, nFeatures: 1 });
    expect(Number.isFinite(g.f0)).toBe(true);
    g.losses.forEach((l) => expect(Number.isFinite(l)).toBe(true));
    expect(g.proba([1])).toBeGreaterThan(0.99);
  });
});
