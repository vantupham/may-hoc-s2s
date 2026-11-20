import { describe, expect, it } from 'vitest';
import ref from './fixtures/ch4.json';
import data from '../src/data/titanic.json';
import { buildTree, predictTree, randomForest, probaForest, gradientBoosting, gini, splitCandidates, type Row } from '../src/lib/ml-core/tree';

const test = new Set(data.testIds);
const toRow = (p: (typeof data.people)[number]): Row => ({ x: data.features.map((f) => (p as any)[f] as number), y: p.survived });
const train = data.people.filter((p) => !test.has(p.id)).map(toRow);
const testR = data.people.filter((p) => test.has(p.id)).map(toRow);
const acc = (f: (x: number[]) => number, rs: Row[]) => rs.filter((r) => f(r.x) === r.y).length / rs.length;

describe('Cây quyết định CART', () => {
  for (const d of [1, 2, 3] as const) {
    it(`độ sâu ${d}: khớp scikit-learn DecisionTreeClassifier`, () => {
      const t = buildTree(train, { maxDepth: d, nFeatures: 5 });
      const r = (ref as any)[`depth${d}`];
      expect(data.features[t.feature!]).toBe(r.rootFeature);
      expect(t.thr).toBeCloseTo(r.rootThreshold, 9);
      expect(testR.map((x) => predictTree(t, x.x))).toEqual(r.pred);
    });
  }
  it('độ sâu 4: cùng độ chính xác huấn luyện với scikit-learn (khi hai cách chia hoà nhau, thứ tự chọn có thể khác)', () => {
    const t = buildTree(train, { maxDepth: 4, nFeatures: 5 });
    expect(acc((x) => predictTree(t, x), train)).toBeCloseTo(ref.depth4.trainAcc, 12);
  });
  it('Gini đúng định nghĩa', () => {
    expect(gini(5, 5)).toBeCloseTo(0.5, 12);
    expect(gini(10, 0)).toBe(0);
    const c = splitCandidates(train, 0)[0];
    expect(c.left[0] + c.left[1] + c.right[0] + c.right[1]).toBe(train.length);
  });
});

describe('Random Forest và Gradient Boosting', () => {
  it('rừng có hạt giống cố định cho kết quả lặp lại được', () => {
    const a = randomForest(train, { nTrees: 5, maxDepth: 4, nFeatures: 5, maxFeatures: 2, seed: 7 });
    const b = randomForest(train, { nTrees: 5, maxDepth: 4, nFeatures: 5, maxFeatures: 2, seed: 7 });
    expect(testR.map((r) => probaForest(a, r.x))).toEqual(testR.map((r) => probaForest(b, r.x)));
  });
  it('rừng 50 cây đạt ít nhất 78% trên tập test', () => {
    const f = randomForest(train, { nTrees: 50, maxDepth: 6, nFeatures: 5, maxFeatures: 2, seed: 1 });
    expect(acc((x) => (probaForest(f, x) >= 0.5 ? 1 : 0), testR)).toBeGreaterThan(0.78);
  });
  it('boosting: mất mát huấn luyện giảm qua từng vòng', () => {
    const g = gradientBoosting(train, { nStages: 60, lr: 0.1, maxDepth: 2, nFeatures: 5 });
    for (let i = 1; i < g.losses.length; i++) expect(g.losses[i]).toBeLessThanOrEqual(g.losses[i - 1] + 1e-12);
    expect(acc((x) => (g.proba(x) >= 0.5 ? 1 : 0), testR)).toBeGreaterThan(0.8);
  });
});
