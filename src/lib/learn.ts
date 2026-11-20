/**
 * Phần sư phạm của một bài: mục tiêu, vòng Dự đoán → Thử → Quan sát → Giải thích, bài tập, tự đánh giá.
 * Tệp này chỉ chứa kiểu dữ liệu và hàm thuần (có kiểm thử); trạng thái lưu trong trình duyệt nằm ở learn.svelte.ts.
 */

export interface Question { q: string; options: string[]; answer: number; why: string }

export interface Goal {
  text: string;
  /** id của bước dạy mục tiêu này, để chỉ đường ôn lại */
  see: string;
}

/** Bảng số liệu người học tự đọc từ lab và điền vào. */
export interface RecordTable {
  cols: string[];
  rows: { label: string; values: number[] }[];
  /** Sai số cho phép theo từng cột (tuyệt đối) */
  tol: number[];
}

export interface Mission {
  id: string;
  title: string;
  /** id của bước chứa lab */
  step: string;
  predict?: Question;
  tasks: string[];
  record?: RecordTable;
  explain?: { q: string; answer: string };
}

export interface Exercise {
  level?: 1 | 2 | 3;
  title: string;
  task: string;
  hint?: string;
  answer: string;
  /** Mã mẫu cho lời giải, hiện dưới dạng khối mã */
  code?: string;
}

export interface Takeaways {
  points: string[];
  use: string[];
  avoid: string[];
  next?: { text: string; slug: string; title: string };
}

export interface LessonLearn {
  slug: string;
  minutes: number;
  goals: Goal[];
  warmup: Question[];
  missions: Mission[];
  /** Câu chốt cuối mỗi bước, theo id bước */
  checkpoints: Record<string, Question>;
  codeTasks: Exercise[];
  quiz: Question[];
  takeaways: Takeaways;
  challenges: Exercise[];
  reflect: string[];
}

/** Những gì người học đã làm trong một bài. */
export interface LearnState {
  /** Đáp án đã chọn cho câu dự đoán, theo id nhiệm vụ */
  pred: Record<string, number>;
  /** Nhiệm vụ đã tích, theo id nhiệm vụ */
  tasks: Record<string, boolean[]>;
  /** Số liệu đã điền: rec[id][hàng][cột] */
  rec: Record<string, string[][]>;
  /** Lời tự giải thích, theo id nhiệm vụ */
  notes: Record<string, string>;
  /** Mức tự tin 1–4 cho từng mục tiêu, 0 = chưa chấm */
  conf: number[];
  /** Trả lời các câu phản tư */
  refl: string[];
}

export const emptyState = (): LearnState => ({ pred: {}, tasks: {}, rec: {}, notes: {}, conf: [], refl: [] });

/** Đọc số kiểu Việt ("0,846", "91,2%", "1.234,5") hoặc kiểu Anh ("0.846"). Trả về null nếu không phải số. */
export function parseNum(raw: string): number | null {
  let s = raw.trim().replace(/[%\s]/g, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');
  if (!/^[-−]?\d*\.?\d+$/.test(s)) return null;
  return Number(s.replace('−', '-'));
}

/** Chấm bảng số liệu: true = khớp, false = lệch, null = chưa điền. */
export function checkRecord(t: RecordTable, input: string[][] | undefined): (boolean | null)[][] {
  return t.rows.map((r, i) => r.values.map((v, j) => {
    const x = parseNum(input?.[i]?.[j] ?? '');
    return x === null ? null : Math.abs(x - v) <= t.tol[j] + 1e-9;
  }));
}

export const CONF_LABELS = ['Chưa hiểu', 'Còn mơ hồ', 'Làm được khi có gợi ý', 'Tự giải thích được cho người khác'];
/** Nhãn ngắn trên nút chấm, cùng thứ tự với CONF_LABELS */
export const CONF_SHORT = ['Chưa hiểu', 'Mơ hồ', 'Cần gợi ý', 'Tự tin'];

export function summarize(spec: LessonLearn, st: LearnState) {
  const withPred = spec.missions.filter((m) => m.predict);
  const predicted = withPred.filter((m) => st.pred[m.id] !== undefined);
  const predRight = predicted.filter((m) => st.pred[m.id] === m.predict!.answer);
  const tasksTotal = spec.missions.reduce((a, m) => a + m.tasks.length, 0);
  const tasksDone = spec.missions.reduce((a, m) => a + (st.tasks[m.id] ?? []).slice(0, m.tasks.length).filter(Boolean).length, 0);
  const cells = spec.missions.flatMap((m) => (m.record ? checkRecord(m.record, st.rec[m.id]).flat() : []));
  const explained = spec.missions.filter((m) => m.explain && (st.notes[m.id] ?? '').trim()).length;
  const rated = spec.goals.filter((_, i) => (st.conf[i] ?? 0) > 0).length;
  const weak = spec.goals.map((g, i) => ({ ...g, i, level: st.conf[i] ?? 0 })).filter((g) => g.level > 0 && g.level <= 2);
  return {
    predTotal: withPred.length, predicted: predicted.length, predRight: predRight.length,
    tasksTotal, tasksDone,
    cellsTotal: cells.length, cellsRight: cells.filter((c) => c === true).length,
    explainTotal: spec.missions.filter((m) => m.explain).length, explained,
    rated, weak,
  };
}

/** Ghi chép của người học dưới dạng Markdown, để tải về hoặc nộp cho giáo viên. */
export function toMarkdown(title: string, spec: LessonLearn, st: LearnState, date = new Date()): string {
  const s = summarize(spec, st);
  const L: string[] = [`# Ghi chép: ${title}`, '', `Ngày: ${date.toLocaleDateString('vi-VN')}`, ''];
  L.push('## Tổng quan', '', `- Dự đoán đúng: ${s.predRight}/${s.predTotal}`, `- Nhiệm vụ đã làm: ${s.tasksDone}/${s.tasksTotal}`,
    `- Số liệu ghi đúng: ${s.cellsRight}/${s.cellsTotal}`, `- Câu đã tự giải thích: ${s.explained}/${s.explainTotal}`, '');
  L.push('## Tự đánh giá theo mục tiêu', '');
  spec.goals.forEach((g, i) => { const c = st.conf[i] ?? 0; L.push(`- ${g.text} — ${c ? `${c}/4 (${CONF_LABELS[c - 1]})` : 'chưa chấm'}`); });
  L.push('');
  for (const m of spec.missions) {
    L.push(`## ${m.title}`, '');
    if (m.predict) {
      const p = st.pred[m.id];
      L.push(`**Dự đoán:** ${m.predict.q}`, '', `- Tôi đoán: ${p === undefined ? '(chưa đoán)' : m.predict.options[p]}`,
        `- Kết quả: ${m.predict.options[m.predict.answer]}${p === undefined ? '' : p === m.predict.answer ? ' — đoán đúng' : ' — đoán chưa đúng'}`, '');
    }
    if (m.record) {
      const ok = checkRecord(m.record, st.rec[m.id]);
      L.push(`| | ${m.record.cols.join(' | ')} |`, `|---|${m.record.cols.map(() => '---').join('|')}|`);
      m.record.rows.forEach((r, i) => L.push(`| ${r.label} | ${r.values.map((_, j) => {
        const v = st.rec[m.id]?.[i]?.[j]?.trim();
        return v ? `${v}${ok[i][j] ? ' ✓' : ' ✗'}` : '';
      }).join(' | ')} |`));
      L.push('');
    }
    if (m.explain) L.push(`**${m.explain.q}**`, '', (st.notes[m.id] ?? '').trim() || '(chưa trả lời)', '');
  }
  if (spec.reflect.length) {
    L.push('## Phản tư', '');
    spec.reflect.forEach((q, i) => L.push(`**${q}**`, '', (st.refl[i] ?? '').trim() || '(chưa trả lời)', ''));
  }
  return L.join('\n');
}
