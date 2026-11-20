import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import ref from './fixtures/dulieu.json';
import {
  profile, pearson, quantile, sortNum, iqrBounds,
  imputeMean, imputeMedian, groupMedians, knnImpute,
  standardize, minMax, log1p, oneHot,
  permutation, groupKFold, stratifiedSplit, groupSplit, chunks,
  logregL2, flipLabels, oofProba, confidentFlags,
} from '../src/lib/ml-core';

const cal = JSON.parse(readFileSync('src/data/california.json', 'utf8'));
const bc = JSON.parse(readFileSync('src/data/cancer30.json', 'utf8'));
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
const colOf: Record<string, string> = {
  longitude: 'lon', latitude: 'lat', housing_median_age: 'age', total_rooms: 'rooms', total_bedrooms: 'bedrooms',
  population: 'pop', households: 'hh', median_income: 'income', median_house_value: 'value',
};

describe('Phiếu khám từng cột khớp pandas describe() và skew()', () => {
  for (const [name, r] of Object.entries(ref.profile)) {
    it(name, () => {
      const p = profile(cal[colOf[name]]);
      expect(p.count).toBe(r.count);
      expect(p.missing).toBe(r.missing);
      expect(p.atMax).toBe(r.atMax);
      for (const k of ['mean', 'std', 'min', 'q1', 'median', 'q3', 'max', 'skew'] as const) expect(rel(p[k], (r as any)[k])).toBeLessThan(1e-9);
    });
  }
});

describe('Phân vị và tương quan', () => {
  it('phân vị 25, 50, 75 của 10 dòng khớp numpy.percentile', () => {
    const s = sortNum(ref.quantile10.x);
    [0.25, 0.5, 0.75].forEach((q, k) => expect(rel(quantile(s, q), ref.quantile10.q[k])).toBeLessThan(1e-12));
    const b = iqrBounds(s);
    expect(rel(b.hi, ref.quantile10.q[2] + 1.5 * (ref.quantile10.q[2] - ref.quantile10.q[0]))).toBeLessThan(1e-12);
  });
  it('ma trận Pearson khớp pandas corr() (bỏ cặp có ô thiếu)', () => {
    const cols = ref.corr.cols.map((c) => cal[colOf[c]]);
    ref.corr.matrix.forEach((row, i) => row.forEach((v, j) => expect(Math.abs(pearson(cols[i], cols[j]) - v)).toBeLessThan(1e-9)));
  });
});

describe('Điền giá trị thiếu', () => {
  it('trung bình và trung vị khớp SimpleImputer', () => {
    const m = imputeMean(cal.bedrooms), d = imputeMedian(cal.bedrooms);
    const i = cal.bedrooms.indexOf(null);
    expect(rel(m[i], ref.impute.mean)).toBeLessThan(1e-12);
    expect(d[i]).toBe(ref.impute.median);
  });
  it('trung vị theo nhóm khớp pandas groupby().median()', () => {
    const g = groupMedians(cal.bedrooms, cal.ocean.map((c: number) => cal.cats[c]));
    for (const [k, v] of Object.entries(ref.impute.groupMedian)) expect(g.get(k)).toBe(v);
  });
  it('KNN 5 láng giềng khớp KNNImputer trên 3.000 dòng đầu', () => {
    const n = 3000;
    const Z = [cal.rooms, cal.hh, cal.pop].map((c: number[]) => standardize(c.slice(0, n)).z);
    const r = knnImpute(Z, cal.bedrooms.slice(0, n), 5);
    ref.impute.knn.rows.forEach((row, k) => expect(rel(r.values[row], ref.impute.knn.values[k])).toBeLessThan(1e-12));
  });
});

describe('Biến đổi đặc trưng', () => {
  it('chuẩn hoá, min-max, log1p, one-hot khớp scikit-learn và NumPy', () => {
    const s = standardize(cal.income), mm = minMax(cal.income);
    expect(rel(s.mu, ref.transform.mean)).toBeLessThan(1e-12);
    expect(rel(s.sd, ref.transform.scale)).toBeLessThan(1e-12);
    ref.transform.z5.forEach((v, i) => expect(Math.abs(s.z[i] - v)).toBeLessThan(1e-12));
    expect(mm.lo).toBe(ref.transform.min); expect(mm.hi).toBe(ref.transform.max);
    log1p(cal.pop.slice(0, 5)).forEach((v, i) => expect(rel(v, ref.transform.log1p5[i])).toBeLessThan(1e-14));
    expect(oneHot(ref.transform.onehot10.codes, 5)).toEqual(ref.transform.onehot10.matrix);
  });
});

describe('Chia dữ liệu', () => {
  it('hoán vị có hạt giống giống bản Python', () => {
    expect(permutation(ref.permutation.n, ref.permutation.seed)).toEqual(ref.permutation.p);
  });
  it('GroupKFold khớp scikit-learn', () => {
    expect(groupKFold(ref.groupKFold.groups, 5)).toEqual(ref.groupKFold.fold);
  });
  it('chia phân tầng giữ đúng tỷ lệ từng tầng; chia theo nhóm không để nhóm nào ở cả hai tập', () => {
    const strata = cal.value.map((v: number) => Math.min(4, Math.floor(v / 1.2)));
    const s = stratifiedSplit(strata, 0.2, 1);
    for (let k = 0; k < 5; k++) {
      const all = strata.filter((v: number) => v === k).length, te = s.test.filter((i) => strata[i] === k).length;
      expect(Math.abs(te - all * 0.2)).toBeLessThanOrEqual(0.5);
    }
    const g = groupSplit(ref.groupKFold.groups, 0.2, 1);
    const tg = new Set(g.test.map((i) => ref.groupKFold.groups[i]));
    expect(g.train.some((i) => tg.has(ref.groupKFold.groups[i]))).toBe(false);
    expect(g.test.length + g.train.length).toBe(cal.n);
  });
});

describe('Nhãn sai và confident learning', () => {
  const test = new Set<number>(bc.testIds);
  const tr = bc.X.map((_: number[], i: number) => i).filter((i: number) => !test.has(i));
  const raw = tr.map((i: number) => bc.X[i]);
  const cols = raw[0].map((_: number, j: number) => standardize(raw.map((r: number[]) => r[j])));
  const X = raw.map((r: number[]) => r.map((v, j) => (v - cols[j].mu) / cols[j].sd));
  const y = tr.map((i: number) => bc.y[i]);
  it('hồi quy logistic L2 (C = 1) khớp LogisticRegression của scikit-learn', () => {
    const th = logregL2(X, y, 1);
    th.forEach((v, j) => expect(Math.abs(v - ref.logreg.coef[j])).toBeLessThan(1e-6));
  });
  it('lật nhãn, xác suất ngoài tập, ngưỡng và danh sách nghi sai khớp bản NumPy', () => {
    const f = flipLabels(y, y.map((_: number, i: number) => i), ref.noise.p, ref.noise.seed);
    expect(f.flipped).toEqual(ref.noise.flipped);
    const p = oofProba(X, f.y, chunks(y.map((_: number, i: number) => i), 5), 1);
    p.forEach((v, i) => expect(Math.abs(v - ref.noise.oof[i])).toBeLessThan(1e-6));
    const c = confidentFlags(p, f.y);
    c.t.forEach((v, j) => expect(Math.abs(v - ref.noise.t[j])).toBeLessThan(1e-7));
    expect([...c.flags].sort((a, b) => a - b)).toEqual(ref.noise.flags);
  });
});
