/**
 * Chương 12: đối chiếu các hàm chuỗi thời gian của ml-core với pandas / scikit-learn,
 * và đối chiếu những gì trang tự tính lại trên trình duyệt với kết quả của scripts/prep_ch12.py.
 */
import { describe, expect, it } from 'vitest';
import fx from './fixtures/ch12.json';
import air from '../src/data/hanoi-air.json';
import res from '../src/data/hanoi-results.json';
import nets from '../src/data/hanoi-nets.json';
import { ffill, interpLinear, lag, rollingMean, rollingOrigin, stuckRuns, gaps, conv1d, attnLast, mae, linFit, linPredict, knnRegress, logregL2, cyclic } from '../src/lib/ml-core';
import { buildRows, scaler, auc, cnn72, attn72, withHour, FEATS, type Air, type Nets } from '../src/lib/khongkhi';
import { duAnALearn } from '../src/lib/hoc/du-an-khong-khi-a';
import { duAnBLearn } from '../src/lib/hoc/du-an-khong-khi-b';
import { buildTree, predictTree, sigmoid, linearRegressionGD, ols } from '../src/lib/ml-core';

const A = air as unknown as Air;
const N = nets as unknown as Nets;
const close = (a: (number | null)[], b: (number | null)[], tol = 1e-9) => {
  expect(a.length).toBe(b.length);
  a.forEach((v, i) => (b[i] === null ? expect(v).toBeNull() : expect(Math.abs((v as number) - (b[i] as number))).toBeLessThan(tol)));
};

describe('chuỗi thời gian: khớp pandas', () => {
  const s = fx.series as (number | null)[];
  it('ffill, nội suy hai phía, shift, rolling mean', () => {
    close(ffill(s), fx.ffill);
    close(interpLinear(s), fx.interp);
    close(lag(s, 2), fx.shift2);
    close(rollingMean(s, 7), fx.roll7);
  });
  it('TimeSeriesSplit của scikit-learn, có và không có gap', () => {
    expect(rollingOrigin(47, 5)).toEqual(fx.tss);
    expect(rollingOrigin(30, 4, 2)).toEqual(fx.tssGap);
  });
  it('đoạn thiếu và đoạn kẹt số', () => {
    expect(gaps([1, null, null, 2, null])).toEqual([{ start: 1, len: 2 }, { start: 4, len: 1 }]);
    expect(stuckRuns([3, 5, 5, 5, 5, null, 5, 5], 3)).toEqual([{ start: 1, len: 4, value: 5 }]);
  });
  it('mã hoá chu kỳ: 31/12 và 1/1 nằm cạnh nhau', () => {
    const [a, b] = [cyclic(365, 365.25), cyclic(1, 365.25)];
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThan(0.04);
  });
  it('tích chập 1D nhiều kênh', () => {
    expect(conv1d([[1, 0], [2, 1], [3, 0], [4, 2]], [[1, 0], [0, 1]], 0.5)).toEqual([2.5, 2.5, 5.5]);
  });
});

describe('dựng đặc trưng trên trình duyệt khớp prep_ch12.py', () => {
  const rows = buildRows(A.days, A.meta);
  it('số dòng train / test / sau triển khai', () => {
    expect(rows.filter((r) => r.split === 'train').length).toBe(fx.nRows.train);
    expect(rows.filter((r) => r.split === 'test').length).toBe(fx.nRows.test);
    expect(rows.filter((r) => r.split === 'live').length).toBe(fx.nRows.live);
  });
  it('từng đặc trưng của 4 dòng mẫu', () => {
    for (const [target, vals] of Object.entries(fx.featRows as Record<string, number[]>)) {
      const r = rows.find((q) => q.target === target)!;
      expect(r).toBeDefined();
      close([...r.x, r.y], vals, 1e-9);
    }
    expect(FEATS.length).toBe(12);
  });
  const tr = rows.filter((r) => r.split === 'train'), te = rows.filter((r) => r.split === 'test');
  it('mốc "ngày mai = hôm nay" và trung bình cùng tháng', () => {
    expect(mae(te.map((r) => r.x[0]), te.map((r) => r.y))).toBeCloseTo(fx.persistMae, 2);
    const by = new Map<number, number[]>();
    for (const r of tr) { const m = +r.target.slice(5, 7); by.set(m, [...(by.get(m) ?? []), r.y]); }
    const clim = (r: (typeof te)[0]) => { const v = by.get(+r.target.slice(5, 7))!; return v.reduce((a, x) => a + x, 0) / v.length; };
    expect(mae(te.map(clim), te.map((r) => r.y))).toBeCloseTo(fx.climMae, 2);
  });
  it('hồi quy tuyến tính 1 và 12 đặc trưng khớp scikit-learn', () => {
    const c1 = linFit(tr.map((r) => [r.x[0]]), tr.map((r) => r.y));
    expect(c1[1]).toBeCloseTo(fx.ols1[0], 8);
    expect(c1[0]).toBeCloseTo(fx.ols1[1], 7);
    const s = scaler(tr.map((r) => r.x));
    const c = linFit(tr.map((r) => s.z(r.x)), tr.map((r) => r.y));
    expect(mae(linPredict(c, te.map((r) => s.z(r.x))), te.map((r) => r.y))).toBeCloseTo(fx.olsMae, 2);
  });
  it('KNN 10 ngày tương tự khớp scikit-learn', () => {
    const s = scaler(tr.map((r) => r.x));
    const cols = (rs: typeof tr) => FEATS.map((_, j) => Float64Array.from(rs, (r) => s.z(r.x)[j]));
    const p = knnRegress(cols(tr), tr.map((r) => r.y), cols(te), 10);
    expect(mae(p, te.map((r) => r.y))).toBeCloseTo(fx.knnMae, 2);
  });
  it('hồi quy logistic cảnh báo: AUC khớp bảng xếp hạng', () => {
    const s = scaler(tr.map((r) => r.x)), thr = A.meta.thr;
    const th = logregL2(tr.map((r) => s.z(r.x)), tr.map((r) => (r.y > thr ? 1 : 0)), 1, 30);
    const z = te.map((r) => s.z(r.x).reduce((a, v, j) => a + v * th[j + 1], th[0]));
    const row = res.board.find((b) => b.id === 'logreg')!;
    // scikit-learn dừng L-BFGS theo sai số; Newton của ml-core hội tụ hẳn: chênh nhau dưới 0,002
    expect(Math.abs(auc(z, te.map((r) => r.y > thr)) - row.auc!)).toBeLessThan(0.002);
  });
});

describe('CNN 1D và attention trên 72 giờ: trình duyệt tính lại đúng dự đoán đã lưu', () => {
  it('CNN: mọi ngày test', () => {
    const p = N.wins.map((w) => cnn72(N.cnn, w).pred);
    close(p, N.pCnn, 0.006);
    expect(mae(p, N.wins.map((w) => w.y))).toBeCloseTo(fx.cnnMae, 1);
  });
  it('attention: mọi ngày test, trọng số chú ý ngày đầu khớp NumPy', () => {
    const p = N.wins.map((w) => attn72(N.attn, w).pred);
    close(p, N.pAtt, 0.006);
    const r = attn72(N.attn, N.wins[0]);
    close(r.weights, fx.attnFirst, 1e-5);
    expect(r.weights.reduce((a, v) => a + v, 0)).toBeCloseTo(1, 12);
    expect(withHour(N.wins[0].x)[23].length).toBe(6);
    expect(attnLast([[0, 1], [1, 0]], [[1, 0]], [[1, 0]], [[0, 1]]).weights[1]).toBeGreaterThan(0.5); // truy vấn là bước cuối, khớp khoá của chính nó
  });
});

describe('bảng ghi của bài 12A và 12B khớp số liệu thật', () => {
  const rec = (spec: typeof duAnALearn, id: string) => spec.missions.find((m) => m.id === id)!.record!;
  const ok = (r: ReturnType<typeof rec>, row: number, col: number, got: number) => expect(Math.abs(got - r.rows[row].values[col])).toBeLessThanOrEqual(r.tol[col]);
  const rows = buildRows(A.days, A.meta);
  const tr = rows.filter((r) => r.split === 'train'), te = rows.filter((r) => r.split === 'test');
  const board = (id: string) => res.board.find((b) => b.id === id)!;
  it('12A: trạm đo, mốc so sánh, điền thiếu', () => {
    const r = rec(duAnALearn, 'tram');
    ok(r, 0, 0, A.meta.stations.filter((s) => s.used).length);
    ok(r, 1, 0, A.meta.stations.find((s) => s.id === 7441)!.neg);
    ok(r, 2, 0, A.meta.qa.cross);
    const m = rec(duAnALearn, 'moc');
    ok(m, 0, 0, board('persist').mae!); ok(m, 1, 0, board('clim').mae!);
    const f = rec(duAnALearn, 'ro-ri');
    ok(f, 0, 0, res.fill.ffill); ok(f, 1, 0, res.fill.interp);
  });
  it('12A: tính tay 5 ngày Tết, η = 0,045 phân kỳ', () => {
    const five = rows.filter((r) => r.target >= '2025-01-30').slice(0, 5);
    const xs = five.map((r) => Math.round(r.x[0]) / 10), ys = five.map((r) => Math.round(r.y) / 10);
    const o = ols(xs, ys), r = rec(duAnALearn, 'tay');
    ok(r, 0, 0, o.w); ok(r, 0, 1, o.b);
    expect(linearRegressionGD(xs, ys, { lr: 0.045, epochs: 80 }).steps.at(-1)!.state.loss).toBeGreaterThan(1e6);
    expect(Math.abs(linearRegressionGD(xs, ys, { lr: 0.01, epochs: 80 }).steps.at(-1)!.state.w - o.w)).toBeLessThan(0.01);
  });
  it('12A: ngưỡng cảnh báo 0,5, cây sâu 1 và 2, SVM, bảng xếp hạng', () => {
    const s = scaler(tr.map((r) => r.x));
    const th = logregL2(tr.map((r) => s.z(r.x)), tr.map((r) => (r.y > 50 ? 1 : 0)), 1, 30);
    let tp = 0, fp = 0, fn = 0;
    te.forEach((r) => { const a = sigmoid(s.z(r.x).reduce((q, v, j) => q + v * th[j + 1], th[0])) >= 0.5, y = r.y > 50; if (a && y) tp++; else if (a) fp++; else if (y) fn++; });
    const c = rec(duAnALearn, 'canh-bao'); ok(c, 0, 0, tp); ok(c, 0, 1, fp); ok(c, 0, 2, fn);
    const t = rec(duAnALearn, 'cay');
    [1, 2].forEach((d, i) => {
      const T = buildTree(tr.map((r) => ({ x: r.x, y: r.y > 50 ? 1 : 0 })), { maxDepth: d, nFeatures: 12, minLeaf: 5 });
      ok(t, i, 0, (te.filter((r) => predictTree(T, r.x) === (r.y > 50 ? 1 : 0)).length / te.length) * 100);
    });
    const v = rec(duAnALearn, 'svm'), g = res.svm.models;
    ok(v, 0, 0, g[0].trainAcc); ok(v, 0, 1, g[0].testAcc); ok(v, 1, 0, g[2].trainAcc); ok(v, 1, 1, g[2].testAcc);
    const b = rec(duAnALearn, 'bang-a'); ok(b, 0, 0, board('gb').mae!); ok(b, 1, 0, board('ols').mae!);
  });
  it('12B: cross-validation, CNN ngày 8/1/2026, attention, bảng cuối, lệch mùa', () => {
    const cv = rec(duAnBLearn, 'cv');
    ok(cv, 0, 0, res.cvTime.reduce((a, c) => a + c.mae, 0) / 5); ok(cv, 1, 0, res.cvRand.reduce((a, c) => a + c, 0) / 5);
    expect(rollingOrigin(res.nTrain, 5).map((f) => f.test[0])).toEqual(res.cvTime.map((c) => c.test[0]));
    const w = N.wins.find((x) => x.d === '2026-01-08')!, k = rec(duAnBLearn, 'tich-chap');
    ok(k, 0, 0, cnn72(N.cnn, w).pred); ok(k, 1, 0, w.y);
    const mean = new Array(72).fill(0); N.wins.forEach((x) => attn72(N.attn, x).weights.forEach((v, t) => (mean[t] += v / N.wins.length)));
    ok(rec(duAnBLearn, 'chu-y'), 0, 0, mean.slice(48).reduce((a, v) => a + v, 0) * 100);
    const f = rec(duAnBLearn, 'bang');
    ['cnn', 'attn', 'gb', 'mlp'].forEach((id, i) => ok(f, i, 0, board(id).mae!));
    const d = rec(duAnBLearn, 'troi'); ok(d, 0, 0, res.drift.summerOnly); ok(d, 1, 0, res.drift.all);
  });
});
