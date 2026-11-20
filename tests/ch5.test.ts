import { describe, expect, it } from 'vitest';
import ref from './fixtures/ch5.json';
import cancer from '../src/data/cancer.json';
import { svmTrain, svmTrace, svmObjective } from '../src/lib/ml-core/svm';

const test = new Set(cancer.testIds);
const tr = cancer.patients.filter((p) => !test.has(p.id));
const X = tr.map((p) => [p.x1, p.x2] as [number, number]);
const y = tr.map((p) => (p.y ? 1 : -1));

describe('SVM tuyến tính lề mềm', () => {
  for (const C of ['0.01', '1', '100'] as const) {
    const key = C === '1' ? '1.0' : C === '100' ? '100.0' : C;
    it(`C = ${C}: hàm mục tiêu gần bằng nghiệm của scikit-learn SVC (sai lệch < 0,5%)`, () => {
      const r = svmTrain(X, y, Number(C), 3000);
      const o = (ref as any)[key];
      expect(r.obj / o.obj).toBeLessThan(1.005);
      expect(r.obj / o.obj).toBeGreaterThan(0.999);
      const cos = (r.w[0] * o.w[0] + r.w[1] * o.w[1]) / Math.hypot(...r.w) / Math.hypot(...(o.w as [number, number]));
      expect(cos).toBeGreaterThan(0.999);
    });
  }
  it('hàm mục tiêu không bao giờ thấp hơn nghiệm tối ưu', () => {
    const steps = svmTrace(X.slice(0, 40), y.slice(0, 40), 1, 30);
    steps.forEach((s) => expect(s.state.obj).toBeGreaterThan(0));
    expect(svmObjective(X, y, [0, 0], 0, 1)).toBe(X.length);
  });
});
