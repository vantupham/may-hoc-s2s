import { describe, expect, it } from 'vitest';
import { parseNum, checkRecord, summarize, toMarkdown, emptyState, type LessonLearn } from '../src/lib/learn';
import { svmLearn } from '../src/lib/hoc/svm';
import { allLearn } from '../src/lib/hoc/index';
import { svmTrain, svmTrace, hardMargin2D } from '../src/lib/ml-core';
import { lessons, sectionsFor } from '../src/lib/lessons';
import cancer from '../src/data/cancer.json';
import grid from '../src/data/svm-rbf.json';

describe('parseNum', () => {
  it('đọc số kiểu Việt và kiểu Anh', () => {
    expect(parseNum('0,846')).toBe(0.846);
    expect(parseNum('0.846')).toBe(0.846);
    expect(parseNum(' 91,2 % ')).toBe(91.2);
    expect(parseNum('1.234,5')).toBe(1234.5);
    expect(parseNum('−0,5')).toBe(-0.5);
    expect(parseNum('124')).toBe(124);
  });
  it('trả về null khi không phải số', () => {
    expect(parseNum('')).toBeNull();
    expect(parseNum('abc')).toBeNull();
    expect(parseNum('1,2,3')).toBeNull();
  });
});

describe('checkRecord', () => {
  const t = { cols: ['a', 'b'], rows: [{ label: 'r', values: [0.846, 124] }], tol: [0.005, 0.5] };
  it('chấm theo sai số từng cột, ô trống là null', () => {
    expect(checkRecord(t, [['0,85', '']])).toEqual([[true, null]]);
    expect(checkRecord(t, [['0,9', '125']])).toEqual([[false, false]]);
    expect(checkRecord(t, undefined)).toEqual([[null, null]]);
  });
});

describe('summarize và toMarkdown', () => {
  const spec = svmLearn;
  it('trạng thái rỗng: chưa làm gì', () => {
    const s = summarize(spec, emptyState());
    expect(s.predTotal).toBe(4);
    expect(s.predicted).toBe(0);
    expect(s.tasksDone).toBe(0);
    expect(s.tasksTotal).toBe(12);
    expect(s.cellsTotal).toBe(2 + 9 + 4);
    expect(s.weak).toEqual([]);
  });
  it('đếm đúng dự đoán, nhiệm vụ, ô số liệu và mục tiêu cần ôn', () => {
    const st = emptyState();
    st.pred = { le: 1, buoc: 0, C: 1 };
    st.tasks = { le: [true, true, false], C: [true] };
    st.rec = { le: [['0,798'], ['2']] };
    st.notes = { le: 'vì lề chỉ phụ thuộc người gần nhất', C: '  ' };
    st.conf = [4, 2, 0, 1];
    const s = summarize(spec, st);
    expect([s.predicted, s.predRight]).toEqual([3, 2]);
    expect(s.tasksDone).toBe(3);
    expect(s.cellsRight).toBe(1);
    expect(s.explained).toBe(1);
    expect(s.rated).toBe(3);
    expect(s.weak.map((g) => g.see)).toEqual(['tinh-tay', 'danh-gia']);
    const md = toMarkdown('SVM', spec, st, new Date(2026, 10, 20));
    expect(md).toContain('Dự đoán đúng: 2/4');
    expect(md).toContain('| Lề lớn nhất có thể | 0,798 ✓ |');
    expect(md).toContain('| Số người chạm mép dải lề | 2 ✗ |');
    expect(md).toContain('(chưa trả lời)');
  });
});

describe('Nội dung trải nghiệm hợp lệ', () => {
  const all: LessonLearn[] = allLearn;
  for (const spec of all) {
    const lesson = lessons.find((l) => l.slug === spec.slug)!;
    const ids = new Set(sectionsFor(lesson).map((s) => s.id));
    it(`${spec.slug}: bài được đánh dấu extended, mọi id bước tồn tại`, () => {
      expect(lesson.extended).toBe(true);
      for (const g of spec.goals) expect(ids).toContain(g.see);
      for (const m of spec.missions) expect(ids).toContain(m.step);
      for (const k of Object.keys(spec.checkpoints)) expect(ids).toContain(k);
    });
    it(`${spec.slug}: đáp án nằm trong các lựa chọn, bảng ghi có đủ sai số`, () => {
      const qs = [...spec.warmup, ...spec.quiz, ...Object.values(spec.checkpoints), ...spec.missions.flatMap((m) => (m.predict ? [m.predict] : []))];
      for (const q of qs) expect(q.answer).toBeLessThan(q.options.length);
      for (const m of spec.missions) if (m.record) {
        expect(m.record.tol.length).toBe(m.record.cols.length);
        for (const r of m.record.rows) expect(r.values.length).toBe(m.record.cols.length);
      }
      expect(new Set(spec.missions.map((m) => m.id)).size).toBe(spec.missions.length);
    });
  }
});

describe('SVM: số trong bảng ghi và đáp án khớp với các lab', () => {
  const mini = cancer.mini;
  const Xm = mini.map((p) => [p.x1, p.x2] as [number, number]);
  const Ym = mini.map((p) => (p.y ? 1 : -1));
  const M = Object.fromEntries(svmLearn.missions.map((m) => [m.id, m]));

  it('lề cứng chính xác của 6 bệnh nhân khớp scikit-learn (SVC tuyến tính, C = 10⁸: lề 0,79755, 3 vector hỗ trợ)', () => {
    const r = hardMargin2D(Xm, Ym);
    expect(r.margin).toBeCloseTo(0.79755, 4);
    const u = [Math.cos((r.ang * Math.PI) / 180), Math.sin((r.ang * Math.PI) / 180)];
    const d = mini.map((p, i) => Ym[i] * (u[0] * p.x1 + u[1] * p.x2 + r.off));
    expect(d.filter((x) => Math.abs(x - r.margin) < 1e-4).length).toBe(3);
    const rec = M.le.record!;
    expect(Math.abs(r.margin - rec.rows[0].values[0])).toBeLessThanOrEqual(rec.tol[0]);
    expect(rec.rows[1].values[0]).toBe(3);
  });

  it('lab tính tay: bước 1 ai cũng vi phạm; cuối cùng C = 10 không còn ai vi phạm', () => {
    expect(svmTrace(Xm, Ym, 1, 60)[0].state.margins.every((m) => m < 1)).toBe(true);
    const last = (C: number) => svmTrace(Xm, Ym, C, 60).at(-1)!.state;
    expect(last(10).margins.filter((m) => m < 1).length).toBe(0);
    const width = (C: number) => 2 / Math.hypot(...last(C).w);
    expect(width(0.1)).toBeGreaterThan(width(1));
    expect(width(1)).toBeGreaterThan(width(10));
  });

  it('lab hệ số C: bảng ghi khớp số lab hiển thị, số vector hỗ trợ giảm khi C tăng', () => {
    const test = new Set(cancer.testIds);
    const tr = cancer.patients.filter((p) => !test.has(p.id));
    const te = cancer.patients.filter((p) => test.has(p.id));
    const X = tr.map((p) => [p.x1, p.x2] as [number, number]);
    const y = tr.map((p) => (p.y ? 1 : -1));
    const nsv: number[] = [];
    for (const C of [0.001, 0.01, 0.1, 1, 10, 100]) nsv.push(svmTrain(X, y, C, 3000).nSV);
    for (let i = 1; i < nsv.length; i++) expect(nsv[i]).toBeLessThan(nsv[i - 1]);
    const rec = M.C.record!;
    [0.01, 1, 100].forEach((C, i) => {
      const m = svmTrain(X, y, C, 3000);
      const acc = te.filter((p) => ((m.w[0] * p.x1 + m.w[1] * p.x2 + m.b >= 0 ? 1 : 0) === p.y)).length / te.length;
      const got = [2 / Math.hypot(...m.w), m.nSV, acc * 100];
      got.forEach((g, j) => expect(Math.abs(g - rec.rows[i].values[j])).toBeLessThanOrEqual(rec.tol[j]));
    });
  });

  it('lab RBF: bảng ghi khớp lưới tính sẵn; γ lớn thì huấn luyện tăng, test giảm', () => {
    const g = (grid as any).models as { gamma: number; trainAcc: number; testAcc: number }[];
    const lo = g.find((x) => x.gamma === 0.1)!, hi = g.find((x) => x.gamma === 50)!;
    const rec = M.rbf.record!;
    [lo, hi].forEach((x, i) => {
      expect(Math.abs(x.trainAcc * 100 - rec.rows[i].values[0])).toBeLessThanOrEqual(rec.tol[0]);
      expect(Math.abs(x.testAcc * 100 - rec.rows[i].values[1])).toBeLessThanOrEqual(rec.tol[1]);
    });
    expect(hi.trainAcc).toBeGreaterThan(lo.trainAcc);
    expect(hi.testAcc).toBeLessThan(lo.testAcc);
  });
});

describe('Mọi bài extended đều có nội dung trải nghiệm và ngược lại', () => {
  it('khớp hai chiều giữa lessons.ts và src/lib/hoc', () => {
    const ext = lessons.filter((l) => l.extended).map((l) => l.slug).sort();
    expect(allLearn.map((s) => s.slug).sort()).toEqual(ext);
  });
});

/** So một hàng của bảng ghi với giá trị tính lại, theo sai số của từng cột. */
function expectRow(m: { record?: { rows: { label: string; values: number[] }[]; tol: number[] } }, row: number, got: number[]) {
  const r = m.record!;
  got.forEach((g, j) => expect(Math.abs(g - r.rows[row].values[j]), `${r.rows[row].label}, cột ${j}`).toBeLessThanOrEqual(r.tol[j]));
}
const missionOf = (spec: LessonLearn, id: string) => spec.missions.find((m) => m.id === id)!;

describe('Chương 0: số trong bảng ghi khớp với các lab', async () => {
  const { gdLearn } = await import('../src/lib/hoc/gradient-descent');
  const { linearRegressionGD, mse } = await import('../src/lib/ml-core');
  const housing = (await import('../src/data/housing.json')).default;
  const xs = housing.mini.map((h) => h.income), ys = housing.mini.map((h) => h.value);
  const wStar = xs.reduce((a, x, i) => a + x * ys[i], 0) / xs.reduce((a, x) => a + x * x, 0);
  const run = (lr: number) => linearRegressionGD(xs, ys, { lr, w0: 0, epochs: 25, fitIntercept: false }).steps;

  it('lab tự tìm w: mất mát lúc xuất phát và tại đáy', () => {
    expectRow(missionOf(gdLearn, 'tay'), 0, [0, mse(xs, ys, 0, 0)]);
    expectRow(missionOf(gdLearn, 'tay'), 1, [wStar, mse(xs, ys, wStar, 0)]);
    // Ô "w" có sai số 0,012: lab báo "rất gần" khi cách đáy dưới 0,011 nên mọi w người học đọc được đều lọt
    expect(missionOf(gdLearn, 'tay').record!.tol[0]).toBeGreaterThan(0.011);
  });
  it('lab từng vòng: w mới ở vòng 1, 6, 25 với η = 0,01', () => {
    const s = run(0.01);
    [0, 5, 24].forEach((k, i) => expectRow(missionOf(gdLearn, 'vong'), i, [s[k].state.wNext]));
  });
  it('lab tốc độ học: η = 0,002 và 0,03; η = 0,07 phân kỳ, ngưỡng 2/L″ nằm giữa 0,065 và 0,07', () => {
    expectRow(missionOf(gdLearn, 'eta'), 0, [run(0.002)[24].state.wNext]);
    expectRow(missionOf(gdLearn, 'eta'), 1, [run(0.03)[24].state.wNext]);
    expect(run(0.07)[24].state.loss).toBeGreaterThan(100);
    const etaMax = 2 / ((2 * xs.reduce((a, x) => a + x * x, 0)) / xs.length);
    expect(etaMax).toBeGreaterThan(0.065);
    expect(etaMax).toBeLessThan(0.07);
  });
});

describe('Chương 1: số trong bảng ghi khớp với các lab', async () => {
  const { linregLearn } = await import('../src/lib/hoc/hoi-quy-tuyen-tinh');
  const { linearRegressionGD, mse, ols, r2 } = await import('../src/lib/ml-core');
  const housing = (await import('../src/data/housing.json')).default;
  const sx = housing.sample.map((r) => r.income), sy = housing.sample.map((r) => r.value);

  it('lab kéo đường thẳng: MSE ban đầu và tốt nhất', () => {
    const best = ols(sx, sy);
    expectRow(missionOf(linregLearn, 'keo'), 0, [mse(sx, sy, 0.2, 0.5)]);
    expectRow(missionOf(linregLearn, 'keo'), 1, [mse(sx, sy, best.w, best.b)]);
  });
  it('lab từng bước: w, b sau 60 vòng', () => {
    const xs = housing.mini.map((h) => h.income), ys = housing.mini.map((h) => h.value);
    [0.02, 0.06].forEach((lr, i) => {
      const s = linearRegressionGD(xs, ys, { lr, epochs: 60 }).steps.at(-1)!.state;
      expectRow(missionOf(linregLearn, 'buoc'), i, [s.wNext, s.bNext]);
    });
  });
  it('lab bản đồ mất mát: số bước tới sát đáy trước và sau chuẩn hoá', () => {
    const mu = sx.reduce((a, v) => a + v, 0) / sx.length;
    const sd = Math.sqrt(sx.reduce((a, v) => a + (v - mu) ** 2, 0) / sx.length);
    const reach = (xx: number[], lr: number) => {
      const b = ols(xx, sy);
      return linearRegressionGD(xx, sy, { lr, epochs: 300, detail: false }).steps.findIndex((s) => Math.hypot(s.state.w - b.w, s.state.b - b.b) < 0.01);
    };
    const z = sx.map((v) => (v - mu) / sd);
    expectRow(missionOf(linregLearn, 'chuanhoa'), 0, [reach(sx, 0.04)]);
    expectRow(missionOf(linregLearn, 'chuanhoa'), 1, [reach(z, 0.2)]);
    expectRow(missionOf(linregLearn, 'chuanhoa'), 2, [reach(z, 0.5)]);
  });
  it('lab đánh giá: R² train, test và mốc đoán trung bình', () => {
    const ts = new Set(housing.testIds);
    const tr = housing.sample.filter((r) => !ts.has(r.id)), te = housing.sample.filter((r) => ts.has(r.id));
    const m = ols(tr.map((r) => r.income), tr.map((r) => r.value));
    const mean = tr.reduce((a, r) => a + r.value, 0) / tr.length;
    const R = (rows: typeof tr, f: (x: number) => number) => r2(rows.map((r) => r.value), rows.map((r) => f(r.income)));
    expectRow(missionOf(linregLearn, 'danhgia'), 0, [R(tr, (x) => m.w * x + m.b)]);
    expectRow(missionOf(linregLearn, 'danhgia'), 1, [R(te, (x) => m.w * x + m.b)]);
    expectRow(missionOf(linregLearn, 'danhgia'), 2, [R(te, () => mean)]);
  });
});

describe('Chương 2: số trong bảng ghi khớp với các lab', async () => {
  const { logregLearn } = await import('../src/lib/hoc/hoi-quy-logistic');
  const { sigmoid, bce, logisticRegressionGD, confusion } = await import('../src/lib/ml-core');
  const cancer = (await import('../src/data/cancer.json')).default;
  const P = cancer.patients;

  it('lab sigmoid', () => {
    [2, -2, 5].forEach((z, i) => expectRow(missionOf(logregLearn, 'sigmoid'), i, [sigmoid(z) * 100]));
  });
  it('lab tự vẽ ranh giới: vị trí ban đầu và lời giải gợi ý', () => {
    const ev = (w1: number, w2: number, b: number) => {
      const pr = P.map((p) => sigmoid(w1 * p.x1 + w2 * p.x2 + b));
      return [(100 * pr.filter((q, i) => (q >= 0.5 ? 1 : 0) === P[i].y).length) / P.length, pr.reduce((a, q, i) => a + bce(P[i].y, q), 0) / P.length];
    };
    expectRow(missionOf(logregLearn, 'ranhgioi'), 0, ev(1, 0, 0));
    expectRow(missionOf(logregLearn, 'ranhgioi'), 1, ev(3.55, 0.91, -0.71));
  });
  it('lab từng vòng: w và mất mát ở vòng 40', () => {
    const X = cancer.mini.map((p) => [p.x1, p.x2] as [number, number]), Y = cancer.mini.map((p) => p.y);
    [1, 3].forEach((lr, i) => {
      const s = logisticRegressionGD(X, Y, { lr, epochs: 40 }).steps[39].state;
      expectRow(missionOf(logregLearn, 'buoc'), i, [s.w[0], s.w[1], s.loss]);
    });
  });
  it('lab ngưỡng: bỏ sót, báo nhầm, độ nhạy ở ngưỡng 0,5 và 0,2', () => {
    const ts = new Set(cancer.testIds);
    const tr = P.filter((p) => !ts.has(p.id)), te = P.filter((p) => ts.has(p.id));
    const s = logisticRegressionGD(tr.map((p) => [p.x1, p.x2] as [number, number]), tr.map((p) => p.y), { lr: 1, epochs: 2000, detail: false }).steps.at(-1)!.state;
    const pr = te.map((p) => sigmoid(s.wNext[0] * p.x1 + s.wNext[1] * p.x2 + s.bNext));
    [0.5, 0.2].forEach((t, i) => {
      const cm = confusion(te.map((p) => p.y), pr, t);
      expectRow(missionOf(logregLearn, 'nguong'), i, [cm.fn, cm.fp, cm.recall * 100]);
    });
  });
});

describe('Chương 3A: số trong bảng ghi khớp với các lab', async () => {
  const { khamPhaLearn: K } = await import('../src/lib/hoc/kham-pha-du-lieu');
  const ml = await import('../src/lib/ml-core');
  const { houseFeatures, bedMedian, scaleCols, pick } = await import('../src/lib/dulieu');
  const { readFileSync } = await import('node:fs');
  const cal = JSON.parse(readFileSync('src/data/california.json', 'utf8'));

  it('phiếu khám: thu nhập và giá nhà', () => {
    (['income', 'value'] as const).forEach((k, i) => { const p = ml.profile(cal[k]); expectRow(missionOf(K, 'phieu'), i, [p.mean, p.median, p.atMax]); });
  });
  it('tương quan, kể cả khi chia theo số hộ', () => {
    const per = (a: (number | null)[]) => a.map((v, i) => (v === null ? null : v / cal.hh[i]));
    expectRow(missionOf(K, 'tuongquan'), 0, [ml.pearson(cal.income, cal.value)]);
    expectRow(missionOf(K, 'tuongquan'), 1, [ml.pearson(cal.rooms, cal.pop)]);
    expectRow(missionOf(K, 'tuongquan'), 2, [ml.pearson(per(cal.rooms), per(cal.pop))]);
  });
  it('ngoại lai người mỗi hộ: IQR và điểm z', () => {
    const v = Array.from({ length: cal.n }, (_, i) => cal.pop[i] / cal.hh[i]);
    const b = ml.iqrBounds(ml.sortNum(v), 1.5), mu = ml.avg(v), sd = ml.std(v, 0);
    expectRow(missionOf(K, 'ngoailai'), 0, [v.filter((x) => x < b.lo || x > b.hi).length]);
    expectRow(missionOf(K, 'ngoailai'), 1, [v.filter((x) => Math.abs(x - mu) > 3 * sd).length]);
  });
  it('tính tay 10 khu vực', () => {
    const ids = [...ml.permutation(cal.n, 3).slice(0, 9), cal.income.indexOf(15.0001)];
    const x = ids.map((i: number) => cal.income[i]), s = ml.sortNum(x), b = ml.iqrBounds(s);
    const mu = ml.avg(x), sd = ml.std(x, 0);
    [mu, ml.quantileCalc(s, 0.5, '').value, b.hi, (15.0001 - mu) / sd].forEach((g, i) => expectRow(missionOf(K, 'tay'), i, [g]));
  });
  it('nhãn sai: độ chính xác, số bị phản đối, số đúng là bị lật', () => {
    const bc = JSON.parse(readFileSync('src/data/cancer30.json', 'utf8'));
    const test = new Set(bc.testIds);
    const tr = bc.X.map((_: unknown, i: number) => i).filter((i: number) => !test.has(i));
    const st = bc.features.map((_: unknown, j: number) => ml.standardize([0], tr.map((i: number) => bc.X[i][j])));
    const sc = (r: number[]) => r.map((v, j) => (v - st[j].mu) / st[j].sd);
    const X = tr.map((i: number) => sc(bc.X[i])), y = tr.map((i: number) => bc.y[i]);
    const Xt = bc.testIds.map((i: number) => sc(bc.X[i])), yt = bc.testIds.map((i: number) => bc.y[i]);
    [0, 20, 40].forEach((p, row) => {
      const all = y.map((_: unknown, i: number) => i);
      const f = ml.flipLabels(y, all, p / 100, 11);
      const th = ml.logregL2(X, f.y, 1);
      const acc = Xt.reduce((a: number, x: number[], i: number) => a + ((ml.probaOf(th, x) >= 0.5 ? 1 : 0) === yt[i] ? 1 : 0), 0) / yt.length;
      const c = ml.confidentFlags(ml.oofProba(X, f.y, ml.chunks(all, 5), 1), f.y);
      const fl = new Set(f.flipped);
      expectRow(missionOf(K, 'nhansai'), row, [acc * 100, c.flags.length, c.flags.filter((i: number) => fl.has(i)).length]);
    });
  });
  it('lệch phân phối: RMSE hai vùng và AUC phân biệt', () => {
    const X = houseFeatures(cal, bedMedian(cal), 'none', false);
    [[1, 3], [0, 2]].forEach(([ra, rb], row) => {
      const A = cal.ocean.map((o: number, i: number) => (o === ra ? i : -1)).filter((i: number) => i >= 0);
      const B = cal.ocean.map((o: number, i: number) => (o === rb ? i : -1)).filter((i: number) => i >= 0);
      const pa = ml.permutation(A.length, 1).map((k) => A[k]), nh = Math.round(A.length * 0.2);
      const coef = ml.linFit(pick(X, pa.slice(nh)), pick(cal.value, pa.slice(nh)));
      const inR = ml.rmse(ml.linPredict(coef, pick(X, pa.slice(0, nh))), pick(cal.value, pa.slice(0, nh)));
      const outR = ml.rmse(ml.linPredict(coef, pick(X, B)), pick(cal.value, B));
      const sa = ml.permutation(A.length, 2).slice(0, 1200).map((k) => A[k]), sb = ml.permutation(B.length, 3).slice(0, 1200).map((k) => B[k]);
      const rows = [...sa, ...sb], lab = [...sa.map(() => 0), ...sb.map(() => 1)];
      const Z = scaleCols(pick(X, rows), rows.map((_, i) => i));
      const auc = ml.rocCurve(ml.oofProba(Z, lab, ml.chunks(ml.permutation(rows.length, 4), 5), 1), lab).auc;
      expectRow(missionOf(K, 'lech'), row, [inR, outR, auc]);
    });
  });
});

describe('Chương 3B: số trong bảng ghi khớp với các lab', async () => {
  const { xuLyLearn: X } = await import('../src/lib/hoc/xu-ly-du-lieu');
  const L = await import('./helpers/dulieu-labs');
  const ml = await import('../src/lib/ml-core');
  const { houseFeatures, pick } = await import('../src/lib/dulieu');
  const { readFileSync } = await import('node:fs');
  const cal = JSON.parse(readFileSync('src/data/california.json', 'utf8'));

  it('điền ô thiếu: MAE và RMSE của trung vị, KNN', () => {
    const r = L.imputeScores(cal);
    expectRow(missionOf(X, 'dien'), 0, [r.mae.median, r.cv.median]);
    expectRow(missionOf(X, 'dien'), 1, [r.mae.knn, r.cv.knn]);
  });
  it('mã hoá vị trí', () => {
    const bed = ml.imputeMedian(cal.bedrooms), folds = ml.chunks(ml.permutation(cal.n, 42), 5);
    const cv = (F: number[][]) => folds.reduce((s, te) => { const inF = new Set(te), tr = [...Array(cal.n).keys()].filter((i) => !inF.has(i)); return s + ml.rmse(ml.linPredict(ml.linFit(pick(F, tr), pick(cal.value, tr)), pick(F, te)), pick(cal.value, te)); }, 0) / folds.length;
    (['none', 'ordinal', 'onehot'] as const).forEach((k, i) => expectRow(missionOf(X, 'mahoa'), i, [cv(houseFeatures(cal, bed, k))]));
  });
  it('rò rỉ dữ liệu ở cỡ ô 0,05°', () => {
    const r = L.leakScores(cal, 0.05);
    [r.base, r.teLeak, r.band].forEach((s, i) => expectRow(missionOf(X, 'rori'), i, [s.test, s.future]));
  });
  it('ba cách chia', () => {
    (['random', 'strat', 'group'] as const).forEach((m, i) => { const r = L.splitScores(cal, m); expectRow(missionOf(X, 'chia'), i, [r.rmse, r.same * 100]); });
  });
  it('đường cong học ở n = 200 và 16.512', () => {
    const p = L.curvePoints(cal, [200, 16512]);
    p.forEach((q, i) => expectRow(missionOf(X, 'nhieu'), i, [q.linVa, q.knnVa]));
  });
  it('trước và sau: dòng 1 và dòng 4', () => {
    const r = L.beforeAfter(cal);
    expectRow(missionOf(X, 'truocsau'), 0, [r[0].rnd, r[0].grp]);
    expectRow(missionOf(X, 'truocsau'), 1, [r[3].rnd, r[3].grp]);
  });
});

describe('Chương 4: số trong bảng ghi khớp với các lab', async () => {
  const { knnNbLearn: K } = await import('../src/lib/hoc/knn-naive-bayes');
  const ml = await import('../src/lib/ml-core');
  const iris = (await import('../src/data/iris.json')).default;
  const sms = (await import('../src/data/sms.json')).default;
  const ts = new Set(iris.testIds);
  const pts = iris.flowers.map((f) => ({ id: f.id, a: f.len, b: f.wid, y: f.y }));
  const train = pts.filter((p) => !ts.has(p.id)), test = pts.filter((p) => ts.has(p.id));

  it('phiếu bầu của láng giềng, kể cả sau khi bấm phím → (4,9 + 0,1 như lab)', () => {
    const v1 = ml.knnPredict({ a: 4.9, b: 1.6 }, train, 5, 3).votes;
    const v2 = ml.knnPredict({ a: 4.9 + 0.1, b: 1.6 }, train, 9, 3).votes;
    expectRow(missionOf(K, 'knn'), 0, [v1[1], v1[2]]);
    expectRow(missionOf(K, 'knn'), 1, [v2[1], v2[2]]);
  });
  it('Naive Bayes trên 6 tin', () => {
    const m = ml.nbTrain(sms.mini);
    ['Call now for your free prize', 'Please call me later'].forEach((t, i) => {
      const s = ml.nbScore(m, t);
      expectRow(missionOf(K, 'nbtay'), i, [s.joint[1], s.joint[0], s.pSpam * 100]);
    });
  });
  it('chọn k', () => {
    const acc = (set: typeof pts, k: number) => (100 * set.filter((p) => ml.knnPredict(p, train, k, 3).pred === p.y).length) / set.length;
    [1, 5, 20].forEach((k, i) => expectRow(missionOf(K, 'chonk'), i, [acc(train, k), acc(test, k)]));
  });
  it('bộ lọc trên 1.114 tin', () => {
    const m = ml.nbFromCounts(sms.vocab, sms.counts, sms.docs, 1);
    let tp = 0, fp = 0, tn = 0, fn = 0;
    sms.test.forEach((t) => { const r = ml.nbScore(m, t.text); if (r.pred && t.y) tp++; else if (r.pred) fp++; else if (t.y) fn++; else tn++; });
    expectRow(missionOf(K, 'loc'), 0, [(100 * (tp + tn)) / sms.test.length]);
    expectRow(missionOf(K, 'loc'), 1, [fp]);
    expectRow(missionOf(K, 'loc'), 2, [fn]);
  });
});

describe('Chương 5: số trong bảng ghi khớp với các lab', async () => {
  const { treeLearn: T } = await import('../src/lib/hoc/cay-quyet-dinh');
  const ml = await import('../src/lib/ml-core');
  const data = (await import('../src/data/titanic.json')).default;
  const P = data.people, ts = new Set(data.testIds), F = data.features;
  const toRow = (p: (typeof P)[number]) => ({ x: F.map((f) => (p as unknown as Record<string, number>)[f]), y: p.survived });
  const train = P.filter((p) => !ts.has(p.id)).map(toRow), test = P.filter((p) => ts.has(p.id)).map(toRow);

  it('Gini tính tay từ bảng bước 2 (cả 891 hành khách)', () => {
    const g = (a: typeof P) => { const s = a.filter((p) => p.survived).length; return ml.gini(a.length - s, s); };
    const male = P.filter((p) => !p.sex), fem = P.filter((p) => p.sex);
    [g(P), g(male), g(fem), (male.length * g(male) + fem.length * g(fem)) / P.length].forEach((v, i) => expectRow(missionOf(T, 'gini'), i, [v]));
  });
  it('câu hỏi gốc tốt nhất của tuổi, giới tính, giá vé', () => {
    const best = (k: number) => ml.splitCandidates(train, k).reduce((b, x) => (x.gini < b.gini - 1e-12 ? x : b));
    [F.indexOf('age'), F.indexOf('sex'), F.indexOf('fare')].forEach((k, i) => expectRow(missionOf(T, 'chia'), i, [best(k).gini]));
  });
  it('độ sâu 1, 3, 4', () => {
    const acc = (t: ReturnType<typeof ml.buildTree>, rs: typeof train) => (100 * rs.filter((r) => ml.predictTree(t, r.x) === r.y).length) / rs.length;
    [1, 3, 4].forEach((d, i) => { const t = ml.buildTree(train, { maxDepth: d, nFeatures: 5 }); expectRow(missionOf(T, 'dosau'), i, [acc(t, train), acc(t, test)]); });
  });
  it('rừng (hạt giống 1) và boosting', () => {
    const forest = ml.randomForest(train, { nTrees: 100, maxDepth: 8, nFeatures: 5, maxFeatures: 2, seed: 1 });
    const sums = test.map(() => 0);
    const rf = forest.map((t, k) => { let ok = 0; test.forEach((r, i) => { sums[i] += ml.probaForest([t], r.x); if ((sums[i] / (k + 1) >= 0.5 ? 1 : 0) === r.y) ok++; }); return (100 * ok) / test.length; });
    const gb = ml.gradientBoosting(train, { nStages: 150, lr: 0.1, maxDepth: 2, nFeatures: 5 });
    const g = (k: number) => (100 * test.filter((r) => (gb.proba(r.x, k) >= 0.5 ? 1 : 0) === r.y).length) / test.length;
    [rf[0], rf[99], g(10), g(150)].forEach((v, i) => expectRow(missionOf(T, 'rung'), i, [v]));
  });
});

describe('Chương 7: số trong bảng ghi khớp với các lab', async () => {
  const { unsupLearn: U } = await import('../src/lib/hoc/khong-giam-sat');
  const ml = await import('../src/lib/ml-core');
  const peng = (await import('../src/data/penguins.json')).default;
  const dg = (await import('../src/data/digits.json')).default;
  const X = peng.birds.map((b) => [b.a, b.b] as [number, number]);

  it('K-means từ tâm khởi tạo của lab', () => {
    const st = ml.kmeans(X, peng.initIdx.map((i) => X[i]));
    [st[0].inertia, st.at(-1)!.inertia, st.length].forEach((v, i) => expectRow(missionOf(U, 'kmeans'), i, [v]));
    const lab = st.at(-1)!.labels;
    const right = [0, 1, 2].reduce((a, c) => a + Math.max(...[0, 1, 2].map((s) => peng.birds.filter((b, i) => lab[i] === c && b.species === s).length)), 0);
    expect(right).toBe(318);
  });
  it('DBSCAN theo eps', () => {
    [0.28, 0.2, 0.4].forEach((e, i) => { const db = ml.dbscan(X, e, 5); expectRow(missionOf(U, 'dbscan'), i, [db.nClusters, db.labels.filter((l) => l < 0).length]); });
  });
  it('PCA: phương sai giữ lại', () => {
    const P = ml.pca(dg.digits.map((d) => d.px));
    const cum = (k: number) => P.ratio.slice(0, k).reduce((a, r) => a + r, 0) * 100;
    [2, 10, 20].forEach((k, i) => expectRow(missionOf(U, 'pca'), i, [cum(k)]));
  });
});

describe('Chương 8: số trong bảng ghi khớp với các lab', async () => {
  const { evalLearn: E } = await import('../src/lib/hoc/danh-gia-mo-hinh');
  const ml = await import('../src/lib/ml-core');
  const housing = (await import('../src/data/housing.json')).default;
  const cancer = (await import('../src/data/cancer.json')).default;
  const ts = new Set(housing.testIds);
  const tr = housing.sample.filter((r) => !ts.has(r.id)), te = housing.sample.filter((r) => ts.has(r.id));
  const x = tr.map((r) => r.income), y = tr.map((r) => r.value);
  const mu = x.reduce((a, v) => a + v, 0) / x.length, sd = Math.sqrt(x.reduce((a, v) => a + (v - mu) ** 2, 0) / x.length);

  it('cross-validation bậc 3 và 9: phần 5 và trung bình', () => {
    const cv = (d: number) => ml.crossValPoly(x, y, d, 5, mu, sd);
    const c3 = cv(3), c9 = cv(9), avg = (c: typeof c3) => c.reduce((a, f) => a + f.mse, 0) / 5;
    expectRow(missionOf(E, 'cv'), 0, [c3[4].mse, c9[4].mse]);
    expectRow(missionOf(E, 'cv'), 1, [avg(c3), avg(c9)]);
  });
  it('MSE huấn luyện và test theo bậc; bậc 9 có MSE test thấp nhất', () => {
    const tests = Array.from({ length: 10 }, (_, i) => ml.mseOf(ml.polyFit(x, y, i + 1, mu, sd), te.map((r) => r.income), te.map((r) => r.value), mu, sd));
    expect(tests.indexOf(Math.min(...tests))).toBe(8);
    [1, 4, 9].forEach((d, i) => { const c = ml.polyFit(x, y, d, mu, sd); expectRow(missionOf(E, 'biasvar'), i, [ml.mseOf(c, x, y, mu, sd), tests[d - 1]]); });
  });
  it('ROC: TPR, FPR của mô hình A ở ngưỡng 0,5 và 0,2 (làm tròn như lab)', () => {
    const cts = new Set(cancer.testIds);
    const ctr = cancer.patients.filter((p) => !cts.has(p.id)), cte = cancer.patients.filter((p) => cts.has(p.id));
    const s = ml.logisticRegressionGD(ctr.map((p) => [p.x1, p.x2] as [number, number]), ctr.map((p) => p.y), { lr: 1, epochs: 2000, detail: false }).steps.at(-1)!.state;
    const pA = cte.map((p) => ml.sigmoid(s.wNext[0] * p.x1 + s.wNext[1] * p.x2 + s.bNext));
    [0.5, 0.2].forEach((t, i) => { const cm = ml.confusion(cte.map((p) => p.y), pA, t); expectRow(missionOf(E, 'roc'), i, [Math.round(cm.recall * 100), Math.round((100 * cm.fp) / (cm.fp + cm.tn))]); });
  });
});

describe('Chương 9: số trong bảng ghi khớp với các lab', async () => {
  const { nnLearn: N } = await import('../src/lib/hoc/mang-no-ron');
  const ml = await import('../src/lib/ml-core');
  const cancer = (await import('../src/data/cancer.json')).default;
  const tiny = (await import('../src/data/tinynet.json')).default as Parameters<typeof ml.tinyPass>[0];
  const dg = (await import('../src/data/digits.json')).default;
  const split = (await import('../src/data/digits-split.json')).default;

  it('lan truyền ngược: 6 lần cập nhật cho bệnh nhân 1 làm hại bệnh nhân 4', () => {
    const [p1, , , p4] = cancer.mini;
    const loss = (net: typeof tiny, p: typeof p1) => ml.tinyPass(net, [p.x1, p.x2], p.y).loss;
    let net = JSON.parse(JSON.stringify(tiny));
    expectRow(missionOf(N, 'lantruyen'), 0, [loss(net, p4)]);
    expectRow(missionOf(N, 'lantruyen'), 1, [loss(net, p1)]);
    for (let k = 0; k < 6; k++) net = ml.tinyUpdate(net, ml.tinyPass(net, [p1.x1, p1.x2], p1.y), 0.5);
    expectRow(missionOf(N, 'lantruyen'), 2, [loss(net, p1)]);
    expectRow(missionOf(N, 'lantruyen'), 3, [loss(net, p4)]);
  });
  it('huấn luyện chữ số: η = 0,1 (hạt giống 1) và η = 2 sau "Khởi tạo lại" (hạt giống 2)', () => {
    const test = new Set(split.testIds);
    const tr = dg.digits.filter((_, i) => !test.has(i)), te = dg.digits.filter((_, i) => test.has(i));
    const X = tr.map((d) => d.px.map((v) => v / 16)), Y = tr.map((d) => d.y), Xt = te.map((d) => d.px.map((v) => v / 16)), Yt = te.map((d) => d.y);
    const run = (seed: number, lr: number) => {
      const net = ml.initMLP(64, 32, 10, seed);
      for (let len = 1; len <= 15; len++) {
        const r = ml.mulberry32(seed * 1000 + len), order = Array.from({ length: X.length }, (_, i) => i);
        for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        ml.mlpEpoch(net, X, Y, order, 32, lr);
      }
      const acc = (xs: number[][], ys: number[]) => (100 * xs.filter((x, i) => ml.mlpPredict(net, x) === ys[i]).length) / xs.length;
      return [acc(X, Y), acc(Xt, Yt)];
    };
    expectRow(missionOf(N, 'huanluyen'), 0, run(1, 0.1));
    expectRow(missionOf(N, 'huanluyen'), 1, run(2, 2));
  });
});

describe('Chương 10: số trong bảng ghi khớp với các lab', async () => {
  const { cnnLearn: C } = await import('../src/lib/hoc/cnn');
  const ml = await import('../src/lib/ml-core');
  const data = (await import('../src/data/fashion-cnn.json')).default;

  it('một ô của bản đồ đặc trưng (ảnh 1, hàng 10, cột 10)', () => {
    const img = ml.decodeImage(data.images[0].b64);
    const ks = [{ k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], b: 0 }, { k: Array.from({ length: 3 }, () => [1 / 9, 1 / 9, 1 / 9]), b: 0 }, { k: data.Wc[0], b: data.bc[0] }, { k: data.Wc[1], b: data.bc[1] }];
    ks.forEach((f, i) => expectRow(missionOf(C, 'tichchap'), i, [Math.max(0, ml.convCellCalc(img, f.k, f.b, 10, 10).value)]));
  });
  it('xác suất của ảnh 1 và ma trận nhầm lẫn', () => {
    const shirt = data.names.indexOf('Áo sơ mi'), tee = data.names.indexOf('Áo phông'), coat = data.names.indexOf('Áo khoác');
    const r = ml.cnnForward(data as unknown as Parameters<typeof ml.cnnForward>[0], ml.decodeImage(data.images[0].b64));
    expectRow(missionOf(C, 'camang'), 0, [r.p[coat] * 100]);
    expectRow(missionOf(C, 'camang'), 1, [r.p[shirt] * 100]);
    expectRow(missionOf(C, 'camang'), 2, [data.confusion[shirt][shirt]]);
    expectRow(missionOf(C, 'camang'), 3, [data.confusion[shirt][tee]]);
  });
});

describe('Chương 11: số trong bảng ghi khớp với các lab', async () => {
  const { attnLearn: A } = await import('../src/lib/hoc/attention');
  const ml = await import('../src/lib/ml-core');
  const model = (await import('../src/data/attention.json')).default as unknown as Parameters<typeof ml.attnForward>[0];
  const sms = (await import('../src/data/sms.json')).default;

  it('p(spam) của các câu trong lab', () => {
    const pick = (s: string) => sms.test.find((t) => t.text.startsWith(s))!.text;
    [pick('You have won ?1,000'), pick('You have an important customer'), 'free call now', 'now call free']
      .forEach((t, i) => expectRow(missionOf(A, 'chuy'), i, [ml.attnForward(model, t).p * 100]));
  });
  it('attention so với Naive Bayes trên 1.114 tin', () => {
    const nb = ml.nbFromCounts(sms.vocab, sms.counts, sms.docs, 1);
    const st = (f: (t: string) => number) => {
      let tp = 0, fp = 0, fn = 0, tn = 0;
      sms.test.forEach((r) => { const q = f(r.text) >= 0.5; if (q && r.y) tp++; else if (q) fp++; else if (r.y) fn++; else tn++; });
      return [(100 * (tp + tn)) / sms.test.length, fn, fp];
    };
    expectRow(missionOf(A, 'sosanh'), 0, st((t) => ml.attnForward(model, t).p));
    expectRow(missionOf(A, 'sosanh'), 1, st((t) => ml.nbScore(nb, t).pSpam));
  });
});

describe('Toàn bộ khoá học', () => {
  it('mọi bài đã sẵn sàng đều có khung trải nghiệm', () => {
    expect(lessons.filter((l) => l.ready && !l.extended).map((l) => l.slug)).toEqual([]);
  });
});
