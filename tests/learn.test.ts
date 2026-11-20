import { describe, expect, it } from 'vitest';
import { parseNum, checkRecord, summarize, toMarkdown, emptyState, type LessonLearn } from '../src/lib/learn';
import { svmLearn } from '../src/lib/hoc/svm';
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
  const all: LessonLearn[] = [svmLearn];
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
