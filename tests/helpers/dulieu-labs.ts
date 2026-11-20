/**
 * Tính lại đúng các con số mà phòng thí nghiệm chương 3B hiển thị (cùng hạt giống ngẫu nhiên, cùng bước),
 * để kiểm tra các bảng ghi trong src/lib/hoc/xu-ly-du-lieu.ts. Logic chép từ các component dulieu/*.svelte.
 */
import * as ml from '../../src/lib/ml-core';
import { houseFeatures, block1, pick, type Cal, type Cancer30 } from '../../src/lib/dulieu';

/** ImputeLab: MAE khi đoán lại 1.000 ô đã biết, và RMSE cross-validation của mô hình giá nhà. */
export function imputeScores(c: Cal) {
  const Z = [c.rooms, c.hh, c.pop].map((a) => ml.standardize(a as number[]).z);
  const fillAll = (col: (number | null)[]) => ({
    mean: ml.imputeMean(col), median: ml.imputeMedian(col),
    group: ml.imputeGroupMedian(col, c.ocean.map((o) => c.cats[o])), knn: ml.knnImpute(Z, col, 5).values,
  });
  const known = c.bedrooms.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
  const hide = ml.permutation(known.length, 7).slice(0, 1000).map((k) => known[k]);
  const col2 = [...c.bedrooms]; for (const i of hide) col2[i] = null;
  const f2 = fillAll(col2);
  const mae = (v: number[]) => hide.reduce((a, i) => a + Math.abs(v[i] - (c.bedrooms[i] as number)), 0) / hide.length;
  const f = fillAll(c.bedrooms);
  const folds = ml.chunks(ml.permutation(c.n, 42), 5);
  const cv = (bed: number[], keep: (i: number) => boolean) => {
    const X = houseFeatures(c, bed);
    let s = 0;
    for (const fo of folds) {
      const te = fo.filter(keep), inF = new Set(fo), tr: number[] = [];
      for (let i = 0; i < c.n; i++) if (!inF.has(i) && keep(i)) tr.push(i);
      s += ml.rmse(ml.linPredict(ml.linFit(pick(X, tr), pick(c.value, tr)), pick(X, te)), pick(c.value, te));
    }
    return s / folds.length;
  };
  return {
    mae: { mean: mae(f2.mean), median: mae(f2.median), group: mae(f2.group), knn: mae(f2.knn) },
    cv: { drop: cv(f.median, (i) => c.bedrooms[i] !== null), mean: cv(f.mean, () => true), median: cv(f.median, () => true), group: cv(f.group, () => true), knn: cv(f.knn, () => true) },
  };
}

/** LeakLab: RMSE báo cáo trên tập test và RMSE thật trên "khu vực mới", cho từng kịch bản. */
export function leakScores(c: Cal, deg = 0.05) {
  const p = ml.permutation(c.n, 3), a = Math.round(c.n * 0.6), b = Math.round(c.n * 0.8);
  const tr = p.slice(0, a), te = p.slice(a, b), fu = p.slice(b);
  const X = houseFeatures(c, ml.imputeMedian(c.bedrooms)), y = c.value;
  const cell = c.lat.map((la, i) => `${Math.floor(la / deg)},${Math.floor(c.lon[i] / deg)}`);
  const sums = (idx: number[]) => { const s = new Map<string, [number, number]>(); for (const i of idx) { const q = s.get(cell[i]) ?? [0, 0]; q[0] += y[i]; q[1]++; s.set(cell[i], q); } return s; };
  const meanOf = (idx: number[]) => idx.reduce((s, i) => s + y[i], 0) / idx.length;
  const enc = (src: Map<string, [number, number]>, i: number, self: boolean, gm: number) => { const q = src.get(cell[i]); if (!q) return gm; const S = q[0] - (self ? y[i] : 0), N = q[1] - (self ? 1 : 0); return N > 0 ? S / N : gm; };
  const run = (extra: (i: number, set: 'tr' | 'te' | 'fu') => number[]) => {
    const row = (i: number, s: 'tr' | 'te' | 'fu') => [...X[i], ...extra(i, s)];
    const coef = ml.linFit(tr.map((i) => row(i, 'tr')), pick(y, tr));
    return { test: ml.rmse(ml.linPredict(coef, te.map((i) => row(i, 'te'))), pick(y, te)), future: ml.rmse(ml.linPredict(coef, fu.map((i) => row(i, 'fu'))), pick(y, fu)) };
  };
  const sTr = sums(tr), sAll = sums([...tr, ...te]), gTr = meanOf(tr), gAll = meanOf([...tr, ...te]);
  const band = (i: number) => Math.min(4, Math.floor(y[i]));
  const counts = [0, 0, 0, 0, 0]; for (const i of tr) counts[band(i)]++;
  const mode = counts.indexOf(Math.max(...counts));
  return {
    base: run(() => []),
    teOk: run((i, s) => [s === 'tr' ? enc(sTr, i, true, gTr) : s === 'te' ? enc(sTr, i, false, gTr) : enc(sAll, i, false, gAll)]),
    teLeak: run((i) => [enc(sAll, i, false, gAll)]),
    band: run((i, s) => [s === 'fu' ? mode : band(i)]),
  };
}

/** SplitLab: RMSE của KNN (k = 10) và tỷ lệ khu vực test trùng toạ độ với tập train, theo cách chia. */
export function splitScores(c: Cal, m: 'random' | 'strat' | 'group') {
  const s = ml.sortNum(c.value), cuts = [0.2, 0.4, 0.6, 0.8].map((q) => ml.quantile(s, q));
  const strata = c.value.map((v) => cuts.filter((t) => v > t).length);
  const sp = m === 'random' ? ml.randomSplit(c.n, 0.2, 1) : m === 'strat' ? ml.stratifiedSplit(strata, 0.2, 1) : ml.groupSplit(block1(c), 0.2, 1);
  const cols = [c.lon, c.lat, c.income].map((a) => { const st = ml.standardize(pick(a, sp.train)); return [Float64Array.from(pick(a, sp.train), (v) => (v - st.mu) / st.sd), Float64Array.from(pick(a, sp.test), (v) => (v - st.mu) / st.sd)]; });
  const pred = ml.knnRegress(cols.map((q) => q[0]), pick(c.value, sp.train), cols.map((q) => q[1]), 10);
  const seen = new Set(sp.train.map((i) => `${c.lon[i]},${c.lat[i]}`));
  return { rmse: ml.rmse(pred, pick(c.value, sp.test)), same: sp.test.filter((i) => seen.has(`${c.lon[i]},${c.lat[i]}`)).length / sp.test.length };
}

/** CurveLab: sai số kiểm định theo số mẫu (tuyến tính và KNN), và lưới "ít mà sạch / nhiều mà nhiễu". */
export function curvePoints(c: Cal, ns = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 16512]) {
  const X = houseFeatures(c, ml.imputeMedian(c.bedrooms));
  const sp = ml.randomSplit(c.n, 0.2, 0), yv = pick(c.value, sp.test);
  return ns.map((n) => {
    const tr = sp.train.slice(0, n), ytr = pick(c.value, tr);
    const coef = ml.linFit(pick(X, tr), ytr);
    const cols = [c.lon, c.lat, c.income].map((a) => { const st = ml.standardize(pick(a, tr)); return [Float64Array.from(pick(a, tr), (v) => (v - st.mu) / st.sd), Float64Array.from(pick(a, sp.test), (v) => (v - st.mu) / st.sd)]; });
    return { n, linTr: ml.rmse(ml.linPredict(coef, pick(X, tr)), ytr), linVa: ml.rmse(ml.linPredict(coef, pick(X, sp.test)), yv), knnVa: ml.rmse(ml.knnRegress(cols.map((q) => q[0]), ytr, cols.map((q) => q[1]), 10), yv) };
  });
}
export function noiseGrid(d: Cancer30, sizes = [50, 100, 200, 455], noise = [0, 10, 20, 30]) {
  const test = new Set(d.testIds), tr = d.X.map((_, i) => i).filter((i) => !test.has(i));
  const st = d.features.map((_, j) => ml.standardize(tr.map((i) => d.X[i][j])));
  const sc = (r: number[]) => r.map((v, j) => (v - st[j].mu) / st[j].sd);
  const order = ml.permutation(tr.length, 5).map((k) => tr[k]);
  const Xt = d.testIds.map((i) => sc(d.X[i])), yt = d.testIds.map((i) => d.y[i]);
  return sizes.map((n) => noise.map((p) => {
    const idx = order.slice(0, n), X = idx.map((i) => sc(d.X[i]));
    const f = ml.flipLabels(idx.map((i) => d.y[i]), idx.map((_, k) => k), p / 100, 11);
    const th = ml.logregL2(X, f.y, 1);
    return Xt.reduce((a, x, i) => a + ((ml.probaOf(th, x) >= 0.5 ? 1 : 0) === yt[i] ? 1 : 0), 0) / yt.length;
  }));
}

/** BeforeAfter: RMSE cross-validation (ngẫu nhiên và theo ô 1°) sau từng bước xử lý. */
export function beforeAfter(c: Cal) {
  const bed = ml.imputeMedian(c.bedrooms);
  const build = (s: number) => Array.from({ length: c.n }, (_, i) => {
    const r = [c.income[i]];
    if (s >= 1) r.push(c.age[i], c.rooms[i], bed[i], c.pop[i], c.hh[i], c.lat[i], c.lon[i]);
    if (s >= 2) for (let k = 1; k < 5; k++) r.push(c.ocean[i] === k ? 1 : 0);
    if (s >= 3) r.push(Math.log(c.income[i]), Math.log(c.rooms[i] / c.hh[i]), bed[i] / c.rooms[i], Math.log(c.pop[i] / c.hh[i]));
    return r;
  });
  const fold = ml.groupKFold(block1(c), 5), rndF = ml.chunks(ml.permutation(c.n, 42), 5);
  const grpF = [0, 1, 2, 3, 4].map((k) => fold.map((f, i) => (f === k ? i : -1)).filter((i) => i >= 0));
  return [0, 1, 2, 3, 4].map((s) => {
    const X = build(Math.min(s, 3));
    const keep = s === 4 ? (i: number) => c.value[i] < 5.00001 : () => true;
    const cv = (folds: number[][]) => folds.reduce((a, te0) => {
      const inF = new Set(te0), te = te0.filter(keep), tr: number[] = [];
      for (let i = 0; i < c.n; i++) if (!inF.has(i) && keep(i)) tr.push(i);
      return a + ml.rmse(ml.linPredict(ml.linFit(pick(X, tr), pick(c.value, tr)), pick(X, te)), pick(c.value, te));
    }, 0) / folds.length;
    return { rnd: cv(rndF), grp: cv(grpF) };
  });
}
