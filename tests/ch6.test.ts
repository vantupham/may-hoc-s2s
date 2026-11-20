import { describe, expect, it } from 'vitest';
import ref from './fixtures/ch6.json';
import peng from '../src/data/penguins.json';
import dg from '../src/data/digits.json';
import { kmeans, dbscan, type P2 } from '../src/lib/ml-core/cluster';
import { pca } from '../src/lib/ml-core/pca';

const X = peng.birds.map((b) => [b.a, b.b] as P2);

describe('K-means', () => {
  const steps = kmeans(X, peng.initIdx.map((i) => X[i]));
  it('nhãn và tâm cụm khớp scikit-learn KMeans (cùng tâm khởi tạo)', () => {
    const last = steps.at(-1)!;
    expect(last.labels).toEqual(ref.kmLabels);
    last.newCenters.forEach((c, k) => { expect(c[0]).toBeCloseTo(ref.kmCenters[k][0], 10); expect(c[1]).toBeCloseTo(ref.kmCenters[k][1], 10); });
  });
  it('inertia không bao giờ tăng', () => {
    for (let i = 1; i < steps.length; i++) expect(steps[i].inertia).toBeLessThanOrEqual(steps[i - 1].inertia + 1e-12);
  });
});

describe('DBSCAN', () => {
  it('nhãn khớp scikit-learn (eps = 0,28, min_samples = 5)', () => {
    expect(dbscan(X, 0.28, 5).labels).toEqual(ref.dbLabels);
  });
});

describe('PCA trên chữ số 8×8', () => {
  const D = dg.digits.map((d) => d.px);
  const p = pca(D);
  it('tỷ lệ phương sai giải thích khớp scikit-learn', () => {
    ref.pcaRatio.forEach((r, k) => expect(p.ratio[k]).toBeCloseTo(r, 8));
  });
  it('thành phần chính khớp (sai khác dấu được phép)', () => {
    ref.pcaComp.forEach((c, k) => {
      const dot = c.reduce((a, v, j) => a + v * p.vectors[k][j], 0);
      expect(Math.abs(dot)).toBeCloseTo(1, 8);
    });
  });
  it('phép chiếu khớp (theo trị tuyệt đối)', () => {
    ref.pcaProj.forEach((row, i) => p.project(D[i], 3).forEach((v, k) => expect(Math.abs(v)).toBeCloseTo(Math.abs(row[k]), 6)));
  });
});
