/**
 * Đối chiếu ml-core (TypeScript) với NumPy và scikit-learn.
 * Kết quả tham chiếu sinh bởi scripts/prepare_data.py.
 */
import { describe, expect, it } from 'vitest';
import ref from './fixtures/reference.json';
import housing from '../src/data/housing.json';
import cancer from '../src/data/cancer.json';
import { linearRegressionGD, ols, logisticRegressionGD, calcOf, mse, confusion, sigmoid } from '../src/lib/ml-core';

const mx = housing.mini.map((h) => h.income);
const my = housing.mini.map((h) => h.value);
const sx = housing.sample.map((h) => h.income);
const sy = housing.sample.map((h) => h.value);
const X = cancer.patients.map((p) => [p.x1, p.x2] as [number, number]);
const Y = cancer.patients.map((p) => p.y);

const close = (a: number, b: number, tol = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe('Gradient descent một biến (b cố định)', () => {
  const t = linearRegressionGD(mx, my, { lr: 0.01, epochs: 30, fitIntercept: false });
  it('khớp NumPy ở từng vòng lặp', () => {
    ref.gd1d.history.forEach((h, k) => {
      close(t.steps[k].state.w, h.w);
      close(t.steps[k].state.loss, h.loss);
      close(t.steps[k].state.dw, h.dw);
    });
    close(t.steps.at(-1)!.state.wNext, ref.gd1d.w);
  });
  it('b luôn bằng 0', () => t.steps.forEach((s) => expect(s.state.b).toBe(0)));
});

describe('Hồi quy tuyến tính bằng gradient descent', () => {
  it('khớp NumPy trên 5 căn nhà', () => {
    const t = linearRegressionGD(mx, my, { lr: 0.02, epochs: 50 });
    ref.linregMini.history.forEach((h, k) => {
      close(t.steps[k].state.w, h.w);
      close(t.steps[k].state.b, h.b);
      close(t.steps[k].state.db, h.db);
    });
  });
  it('khớp NumPy trên mẫu 400 căn', () => {
    const t = linearRegressionGD(sx, sy, { lr: 0.02, epochs: 200 });
    close(t.steps.at(-1)!.state.wNext, ref.linregSample.w);
    close(t.steps.at(-1)!.state.bNext, ref.linregSample.b);
  });
  it('mất mát giảm dần khi tốc độ học hợp lý', () => {
    const t = linearRegressionGD(sx, sy, { lr: 0.02, epochs: 200 });
    for (let k = 1; k < t.steps.length; k++) expect(t.steps[k].state.loss).toBeLessThanOrEqual(t.steps[k - 1].state.loss + 1e-12);
  });
  it('các phép tính trong trace khớp trạng thái', () => {
    const s = linearRegressionGD(mx, my, { lr: 0.02, epochs: 3 }).steps[2];
    expect(calcOf(s, 'dw')!.value).toBe(s.state.dw);
    expect(calcOf(s, 'loss')!.value).toBe(s.state.loss);
    const sumTerms = calcOf(s, 'dw')!.terms!.reduce((a, t) => a + t.value, 0);
    close((2 / mx.length) * sumTerms, s.state.dw);
    close(mse(mx, my, s.state.w, s.state.b), s.state.loss);
  });
});

describe('Nghiệm đóng OLS', () => {
  it('khớp scikit-learn LinearRegression', () => {
    const r = ols(sx, sy);
    close(r.w, ref.olsSample.w);
    close(r.b, ref.olsSample.b);
  });
});

describe('Hồi quy logistic', () => {
  const t = logisticRegressionGD(X, Y, { lr: 0.5, epochs: 300 });
  it('khớp NumPy ở từng vòng lặp', () => {
    ref.logreg.history.forEach((h, k) => {
      close(t.steps[k].state.w[0], h.w[0]);
      close(t.steps[k].state.w[1], h.w[1]);
      close(t.steps[k].state.b, h.b);
      close(t.steps[k].state.loss, h.loss);
    });
  });
  it('chạy đủ lâu thì tiến về nghiệm scikit-learn', () => {
    const long = logisticRegressionGD(X, Y, { lr: 1, epochs: 20000, detail: false });
    const last = long.steps.at(-1)!.state;
    close(last.wNext[0], ref.sklearnLogreg.w[0], 1e-3);
    close(last.wNext[1], ref.sklearnLogreg.w[1], 1e-3);
    close(last.bNext, ref.sklearnLogreg.b, 1e-3);
  });
  it('sigmoid và ma trận nhầm lẫn đúng', () => {
    close(sigmoid(0), 0.5);
    const c = confusion([1, 1, 0, 0], [0.9, 0.2, 0.6, 0.1]);
    expect(c).toMatchObject({ tp: 1, fn: 1, fp: 1, tn: 1, accuracy: 0.5 });
  });
});
