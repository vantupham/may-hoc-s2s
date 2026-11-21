/**
 * Bài giảng chương 2: Hồi quy logistic trên Breast Cancer Wisconsin (2 đặc trưng đã chuẩn hoá).
 * Số liệu do ml-core tính: logisticRegressionGD (6 bệnh nhân, η = 1; toàn bộ train, η = 1, 2000 vòng như lab), confusion.
 */
import cancer from '../../data/cancer.json';
import { logisticRegressionGD, sigmoid, confusion, fmt } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const pct = (v: number, d = 1) => fmt(100 * v, d);

export const logregPyCode = (mini: { x1: number; x2: number; y: number }[]) => `import numpy as np

# 6 bệnh nhân thật (đặc trưng đã chuẩn hoá)
X = np.array([${mini.map((p) => `[${p.x1}, ${p.x2}]`).join(', ')}])
y = np.array([${mini.map((p) => p.y).join(', ')}])   # 1 = ác tính

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

w, b, eta, n = np.zeros(2), 0.0, 1.0, len(y)
for k in range(40):
    z = X @ w + b                 # 1. điểm số
    p = sigmoid(z)                # 2. xác suất
    L = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))   # 3. cross-entropy
    gw = X.T @ (p - y) / n        # 4. gradient — gọn bất ngờ!
    gb = np.mean(p - y)
    w, b = w - eta * gw, b - eta * gb`;

/** Lưới xác suất p(x) trên khung, để tô vùng quyết định */
function probGrid(w: number[], b: number, xd: number[], yd: number[], gx: number, gy: number) {
  const g: number[] = [];
  for (let j = 0; j < gy; j++)
    for (let i = 0; i < gx; i++) {
      const x = xd[0] + ((xd[1] - xd[0]) * (i + 0.5)) / gx, y = yd[0] + ((yd[1] - yd[0]) * (j + 0.5)) / gy;
      const p = sigmoid(w[0] * x + w[1] * y + b);
      g.push(Math.min(0.999, Math.max(0.001, p)));
    }
  return g;
}

export function logregLecture(): Lecture {
  const mini = cancer.mini;
  const X = mini.map((p) => [p.x1, p.x2] as [number, number]);
  const Y = mini.map((p) => p.y);
  const t1 = logisticRegressionGD(X, Y, { lr: 1, epochs: 40 });
  const t3 = logisticRegressionGD(X, Y, { lr: 3, epochs: 40 });
  const s0 = t1.steps[0].state, s1 = t1.steps[1].state, s40 = t1.steps[39].state, s40b = t3.steps[39].state;
  const xd = [-2.6, 4.2], yd = [-2.6, 4.6];
  const miniXd = [-1.6, 2.4], miniYd = [-1.4, 1.4];
  const G = { gx: 60, gy: 36 };
  // "Vòng k" theo quy ước của lab: trạng thái ở đầu vòng k (trước khi cập nhật)
  const miniFrames = [1, 2, 3, 4, 6, 9, 13, 21, 31, 40].map((k) => {
    const st = t1.steps[k - 1].state;
    return {
      line: Math.hypot(st.w[0], st.w[1]) > 1e-9 ? [st.w[0], st.w[1], st.b] : undefined,
      grid: probGrid(st.w, st.b, miniXd, miniYd, G.gx, G.gy),
      read: `vòng <b>${k}</b>   w = (<b>${fmt(st.w[0], 2)}</b>; <b>${fmt(st.w[1], 2)}</b>)   b = <b>${fmt(st.b, 2)}</b>   L = <b>${fmt(st.loss, 3)}</b>`,
    };
  });

  // Toàn bộ dữ liệu: train 455, test 114, giống lab FullLogReg
  const testSet = new Set(cancer.testIds);
  const P = cancer.patients;
  const tr = P.filter((p) => !testSet.has(p.id)), te = P.filter((p) => testSet.has(p.id));
  const tf = logisticRegressionGD(tr.map((p) => [p.x1, p.x2] as [number, number]), tr.map((p) => p.y), { lr: 1, epochs: 2000, detail: false });
  const fw = tf.steps.at(-1)!.state.wNext, fb = tf.steps.at(-1)!.state.bNext;
  const probs = te.map((p) => sigmoid(fw[0] * p.x1 + fw[1] * p.x2 + fb));
  const c5 = confusion(te.map((p) => p.y), probs, 0.5);
  const c2 = confusion(te.map((p) => p.y), probs, 0.2);
  const sens = (c: typeof c5) => c.tp / (c.tp + c.fn);
  const fullPts = P.map((p) => [p.x1, p.x2]);
  const fullCls = P.map((p) => (p.y ? 1 : 0));
  const testIdx = P.map((p, i) => (testSet.has(p.id) ? i : -1)).filter((i) => i >= 0);

  // Ranh giới tự đặt ở bước 3: w = (1; 0), b = 0 trên toàn bộ 569 bệnh nhân (như lab)
  const pAll = P.map((p) => sigmoid(p.x1));
  const acc0 = P.filter((p, i) => (pAll[i] >= 0.5 ? 1 : 0) === p.y).length / P.length;
  const loss0 = -P.reduce((a, p, i) => a + (p.y ? Math.log(pAll[i]) : Math.log(1 - pAll[i])), 0) / P.length;
  const prec = (c: typeof c5) => c.tp / (c.tp + c.fp);
  const sig = Array.from({ length: 161 }, (_, i) => { const z = -8 + i * 0.1; return [z, sigmoid(z)]; });
  const ce1 = Array.from({ length: 99 }, (_, i) => { const p = 0.01 + i * 0.01; return [p, -Math.log(p)]; });
  const ce0 = ce1.map(([p]) => [p, -Math.log(1 - p)]);
  const texN = (v: number, d: number) => fmt(v, d).replace(',', '{,}');

  return {
    slug: 'hoi-quy-logistic',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 2', title: 'Hồi quy logistic', sub: 'lành hay ác, và chắc chắn bao nhiêu · Breast Cancer Wisconsin' },
            lines: [
              L('Chương 2: hồi quy logistic, mô hình phân loại đầu tiên của chúng ta.', undefined, { say: 'Chương hai: hồi quy logistic, mô hình phân loại đầu tiên của chúng ta.' }),
              L('Ở hai chương trước, đầu ra là một con số. Lần này đầu ra là một nhãn: khối u lành tính hay ác tính.'),
              L(`Dữ liệu là ${cancer.nMalignant + cancer.nBenign} mẫu sinh thiết khối u vú trong bộ Breast Cancer Wisconsin: ${cancer.nMalignant} ca ác tính và ${cancer.nBenign} ca lành tính.`),
              L('Một lưu ý trước khi bắt đầu: đây là bài học về thuật toán, không phải công cụ chẩn đoán. Chẩn đoán thật cần nhiều xét nghiệm và bác sĩ.'),
            ],
          },
          {
            view: 'Points', props: { pts: fullPts, cls: fullCls, names: ['Lành tính', 'Ác tính'], xlab: 'x₁: bán kính (đã chuẩn hoá)', ylab: 'x₂: độ nhám (đã chuẩn hoá)', xdom: xd, ydom: yd, dot: 4, frames: [{}] },
            init: { f: 0 },
            lines: [
              L('Để vẽ được trên mặt phẳng, ta chỉ dùng hai đặc trưng của nhân tế bào: bán kính trung bình và độ nhám bề mặt, cả hai đã chuẩn hoá như chương 1.'),
              L('Mỗi chấm là một bệnh nhân. Màu cam là ác tính, màu xanh là lành tính.'),
              L('Hai nhóm tách khá rõ theo bán kính, độ nhám giúp thêm một chút. Nhưng vùng giữa chồng lấn: sẽ có những ca khó.'),
              L('Vì vậy mô hình tốt không chỉ nói lành hay ác, mà còn nói chắc chắn bao nhiêu.'),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: sigmoid', section: 'truc-giac',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Hai bước', items: [
              { label: '1. Điểm số', tex: String.raw`\cz{z} = \cw{w_1}\cx{x_1} + \cw{w_2}\cx{x_2} + \cb{b}` },
              { label: '2. Xác suất', tex: String.raw`\cp{p} = \sigma(\cz{z}) = \frac{1}{1 + e^{-\cz{z}}}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bước 1 giống hồi quy tuyến tính: tính một điểm số z bằng tổ hợp tuyến tính của hai đặc trưng.', { n: 1, hl: 0 }, { say: 'Bước một giống hồi quy tuyến tính: tính một điểm số z bằng tổ hợp tuyến tính của hai đặc trưng.' }),
              L('Nhưng z có thể là bất kỳ số nào, từ âm vô cùng đến dương vô cùng. Đó không phải xác suất.'),
              L('Bước 2: ép z vào khoảng từ 0 đến 1 bằng hàm sigmoid.', { n: 2, hl: 1 }, { say: 'Bước hai: ép z vào khoảng từ không đến một bằng hàm sigmoid.' }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Hàm sigmoid', series: [{ name: 'σ(z)', pts: sig, color: 2 }], xlab: 'z', ylab: 'p', xdom: [-8, 8], ydom: [0, 1], legend: false },
            init: { t: 0 },
            lines: [
              L('Đây là đồ thị sigmoid: một đường cong hình chữ S.', { t: 1 }, { anim: 'line', ease: 'lin' }),
              L(`z = 0 cho đúng 0,5: không biết gì. z = 2 cho ${pct(sigmoid(2))}%, z = −2 cho ${pct(sigmoid(-2))}%.`, { vx: 0, hy: 0.5 }, {
                say: `z bằng không cho đúng không phẩy năm: không biết gì. z bằng hai cho ${speakNum(pct(sigmoid(2)))} phần trăm, z bằng âm hai cho ${speakNum(pct(sigmoid(-2)))} phần trăm.`,
              }),
              L(`z = 5 đã cho ${pct(sigmoid(5))}%. Điểm số càng xa 0, mô hình càng chắc chắn.`, { vx: 5 }, { say: `z bằng năm đã cho ${speakNum(pct(sigmoid(5)))} phần trăm. Điểm số càng xa không, mô hình càng chắc chắn.` }),
              L('Những điểm có z = 0, tức p = 0,5, tạo thành một đường thẳng trên mặt phẳng. Đó là ranh giới quyết định.', { vx: null, hy: null }, { say: 'Những điểm có z bằng không, tức xác suất bằng không phẩy năm, tạo thành một đường thẳng trên mặt phẳng. Đó là ranh giới quyết định.' }),
            ],
          },
          {
            view: 'Points',
            props: { pts: fullPts, cls: fullCls, names: ['Lành tính', 'Ác tính'], xlab: 'x₁: bán kính', ylab: 'x₂: độ nhám', xdom: xd, ydom: yd, dot: 4, ...G,
              frames: [
                { line: [1, 0, 0], grid: probGrid([1, 0], 0, xd, yd, G.gx, G.gy), read: `w = (<b>1</b>; <b>0</b>)   b = <b>0</b>   đúng <b>${pct(acc0)}%</b>   L = <b>${fmt(loss0, 4)}</b>` },
                { line: [fw[0], fw[1], fb], grid: probGrid(fw, fb, xd, yd, G.gx, G.gy), read: `w = (<b>${fmt(fw[0], 2)}</b>; <b>${fmt(fw[1], 2)}</b>)   b = <b>${fmt(fb, 2)}</b>` },
              ] },
            init: { f: 0, ln: 0, rg: 0 },
            lines: [
              L('Thử tự đặt một ranh giới đơn giản: chỉ dùng bán kính, w = (1; 0), b = 0. Ranh giới là đường thẳng đứng tại bán kính trung bình.', { ln: 1, rg: 1 }, { say: 'Thử tự đặt một ranh giới đơn giản: chỉ dùng bán kính, w một bằng một, w hai bằng không, b bằng không. Ranh giới là đường thẳng đứng tại bán kính trung bình.' }),
              L(`Trên cả 569 bệnh nhân, ranh giới này đoán đúng ${pct(acc0)}%, mất mát ${fmt(loss0, 4)}.`, undefined, { say: `Trên cả năm trăm sáu mươi chín bệnh nhân, ranh giới này đoán đúng ${speakNum(pct(acc0))} phần trăm, mất mát ${speakNum(fmt(loss0, 4))}.` }),
              L('Nền tô màu chuyển dần từ xanh sang cam: càng xa ranh giới, mô hình càng chắc chắn.'),
              L('Nghiêng đường thẳng để độ nhám góp phần, và tăng độ lớn trọng số để mô hình tự tin hơn ở hai bên, mất mát sẽ giảm thêm.', { f: 1 }),
              L('Ở bước 3 của bài, bạn có thể tự kéo ba thanh trượt để tìm ranh giới tốt hơn.', undefined, { say: 'Ở bước ba của bài, bạn có thể tự kéo ba thanh trượt để tìm ranh giới tốt hơn.' }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay từng vòng', section: 'tinh-tay',
        scenes: [
          {
            view: 'Table',
            props: {
              title: '6 bệnh nhân, vòng 1 với w = (0; 0), b = 0',
              cols: ['#', 'x₁', 'x₂', 'y', 'p', 'ℓ = −ln', 'p − y'],
              cls: ['', 'v-x', 'v-x', 'v-y', 'v-p', 'v-L', 'v-g'],
              rows: mini.map((p, i) => [String(i + 1), fmt(p.x1, 3), fmt(p.x2, 3), String(p.y), fmt(s0.probs[i], 2), fmt(s0.losses[i], 3), fmt(s0.probs[i] - p.y, 2)]),
            },
            init: { n: 6, c: 4, hl: -1 },
            lines: [
              L('Làm tay trên 6 bệnh nhân thật: 3 ca ác tính, 3 ca lành tính. Xuất phát với mọi trọng số bằng 0.', undefined, { say: 'Làm tay trên sáu bệnh nhân thật: ba ca ác tính, ba ca lành tính. Xuất phát với mọi trọng số bằng không.' }),
              L('Mọi z bằng 0, nên mọi xác suất bằng 0,5.', { c: 5 }, { say: 'Mọi z bằng không, nên mọi xác suất bằng không phẩy năm.' }),
              L(`Mỗi người đóng góp mất mát −ln 0,5 = ${fmt(s0.losses[0], 4)}.`, { c: 6 }, { say: `Mỗi người đóng góp mất mát bằng âm lô-ga-rít của không phẩy năm, tức ${speakNum(fmt(s0.losses[0], 4))}.` }),
              L('Cột cuối là p − y: âm 0,5 với ca ác tính, dương 0,5 với ca lành tính. Đó chính là "sai số" của mô hình.', { c: 7 }, { say: 'Cột cuối là xác suất trừ nhãn thật: âm không phẩy năm với ca ác tính, dương không phẩy năm với ca lành tính. Đó chính là sai số của mô hình.' }),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Gradient và bước đầu tiên', items: [
              { label: 'Gradient', tex: String.raw`\cg{\frac{\partial L}{\partial w_j}} = \frac{1}{n}\sum_i (\cp{p_i} - \cy{y_i})\,\cx{x_{ij}} \qquad \cg{\frac{\partial L}{\partial b}} = \frac{1}{n}\sum_i (\cp{p_i} - \cy{y_i})` },
              { label: 'Vòng 1', tex: String.raw`\cg{\nabla_w} = (\cg{${texN(s0.gw[0], 3)}};\ \cg{${texN(s0.gw[1], 3)}}) \qquad \cw{w} = (\cw{${texN(s0.wNext[0], 3)}};\ \cw{${texN(s0.wNext[1], 3)}})` },
              { label: 'Mất mát', tex: String.raw`\cL{L}: ${texN(s0.loss, 4)} \longrightarrow ${texN(s1.loss, 4)}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Gradient theo mỗi trọng số là trung bình của p − y nhân đặc trưng tương ứng. Dạng giống hệt hồi quy tuyến tính.', { n: 1, hl: 0 }, { say: 'Gradient theo mỗi trọng số là trung bình của xác suất trừ nhãn, nhân đặc trưng tương ứng. Dạng giống hệt hồi quy tuyến tính.' }),
              L(`Với η = 1, sau vòng 1: w₁ = ${fmt(s0.wNext[0], 3)}, w₂ = ${fmt(s0.wNext[1], 3)}.`, { n: 2, hl: 1 }, { say: `Với ê-ta bằng một, sau vòng một: w một bằng ${speakNum(fmt(s0.wNext[0], 3))}, w hai bằng ${speakNum(fmt(s0.wNext[1], 3))}.` }),
              L(`Mất mát giảm từ ${fmt(s0.loss, 4)} xuống ${fmt(s1.loss, 4)} chỉ sau một bước.`, { n: 3, hl: 2 }),
            ],
          },
          {
            view: 'Points', props: { pts: X, cls: Y, names: ['Lành tính', 'Ác tính'], xlab: 'x₁', ylab: 'x₂', xdom: miniXd, ydom: miniYd, dot: 9, frames: miniFrames, ...G },
            init: { f: 0, ln: 1, rg: 1 },
            lines: [
              L('Trên mặt phẳng: nền tô màu là xác suất ác tính, cam đậm là gần 1, xanh đậm là gần 0. Đường đen là ranh giới p = 0,5.', undefined, { say: 'Trên mặt phẳng: nền tô màu là xác suất ác tính, cam đậm là gần một, xanh đậm là gần không. Đường đen là ranh giới năm mươi phần trăm.' }),
              L('Chạy tiếp các vòng và xem ranh giới xoay vào vị trí.', { f: 9 }, { anim: 'line', ease: 'lin' }),
              L(`Ở vòng 40: w = (${fmt(s40.w[0], 3)}; ${fmt(s40.w[1], 2)}), mất mát chỉ còn ${fmt(s40.loss, 4)}.`, undefined, {
                say: `Ở vòng bốn mươi: w một bằng ${speakNum(fmt(s40.w[0], 3))}, w hai bằng ${speakNum(fmt(s40.w[1], 2))}, mất mát chỉ còn ${speakNum(fmt(s40.loss, 4))}.`,
              }),
              L(`Với η = 3, ở vòng 40 mất mát còn ${fmt(s40b.loss, 4)}, trọng số còn lớn hơn: w₁ = ${fmt(s40b.w[0], 3)}.`, undefined, { say: `Với ê-ta bằng ba, ở vòng bốn mươi mất mát còn ${speakNum(fmt(s40b.loss, 4))}, trọng số còn lớn hơn: w một bằng ${speakNum(fmt(s40b.w[0], 3))}.` }),
              L('Vì sao trọng số cứ tăng? Khi ranh giới đã tách đúng cả 6 người, cách duy nhất để giảm mất mát nữa là làm mọi xác suất gần 0 hoặc 1 hơn, tức là kéo z ra xa 0.', undefined, { say: 'Vì sao trọng số cứ tăng? Khi ranh giới đã tách đúng cả sáu người, cách duy nhất để giảm mất mát nữa là làm mọi xác suất gần không hoặc gần một hơn, tức là kéo z ra xa không.' }),
              L('Sáu điểm này tách được hoàn toàn, nên mô hình cứ tự tin hơn mãi: trọng số tăng không dừng. Trên dữ liệu thật có chồng lấn, điều đó không xảy ra.'),
              L('Ở bước 4 của bài, bạn có thể bấm vào từng con số để xem phép tính đầy đủ.', undefined, { say: 'Ở bước bốn của bài, bạn có thể bấm vào từng con số để xem phép tính đầy đủ.' }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết: cross-entropy', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Mất mát cross-entropy', items: [
              { label: 'Một người', tex: String.raw`\ell = -\big[\cy{y}\ln \cp{p} + (1-\cy{y})\ln(1-\cp{p})\big]` },
              { label: 'Trung bình', tex: String.raw`\cL{L} = \frac{1}{n}\sum_i \ell_i` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Với một người có y = 1, ta muốn p càng gần 1 càng tốt: mất mát là −ln p. Với y = 0, mất mát là −ln(1 − p).', { n: 1, hl: 0 }, { say: 'Với một người có nhãn bằng một, ta muốn xác suất càng gần một càng tốt: mất mát là âm lô-ga-rít của p. Với nhãn bằng không, mất mát là âm lô-ga-rít của một trừ p.' }),
              L('Gộp lại thành một công thức, rồi lấy trung bình trên mọi người. Đó là cross-entropy.', { n: 2, hl: 1 }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Phạt nặng khi sai mà tự tin', series: [{ name: 'y = 1: −ln p', pts: ce1, color: 1 }, { name: 'y = 0: −ln(1 − p)', pts: ce0, color: 0 }], xlab: 'p (xác suất ác tính mô hình đưa ra)', ylab: 'mất mát ℓ', xdom: [0, 1], ydom: [0, 4.6] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Đường cam: ca ác tính. Mô hình đoán p càng nhỏ, mất mát càng lớn, và tiến ra vô cùng khi p về 0.', { n: 1, hl: 0 }, { say: 'Đường cam: ca ác tính. Mô hình đoán xác suất càng nhỏ, mất mát càng lớn, và tiến ra vô cùng khi xác suất về không.' }),
              L('Đường xanh: ca lành tính, đối xứng lại.', { n: 2, hl: 1 }),
              L(`Đoán sai một cách tự tin bị phạt rất nặng. Còn đoán 0,5 bị phạt ln 2 ≈ ${fmt(Math.LN2, 3)}: mức không biết gì.`, { hl: -1, vx: 0.5 }, { say: `Đoán sai một cách tự tin bị phạt rất nặng. Còn đoán năm mươi phần trăm bị phạt ${speakNum(fmt(Math.LN2, 3))}: mức không biết gì.` }),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Gradient gọn đến bất ngờ', items: [
              { label: 'Dây chuyền', tex: String.raw`\frac{\partial \ell}{\partial w_j} = \frac{\partial \ell}{\partial \cp{p}}\cdot\frac{\partial \cp{p}}{\partial \cz{z}}\cdot\frac{\partial \cz{z}}{\partial w_j}` },
              { label: 'Sigmoid', tex: String.raw`\frac{\partial \cp{p}}{\partial \cz{z}} = \cp{p}(1-\cp{p})` },
              { label: 'Kết quả', tex: String.raw`\frac{\partial \ell}{\partial w_j} = (\cp{p} - \cy{y})\,\cx{x_j}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Vì sao gradient lại gọn như vậy? Áp dụng quy tắc dây chuyền qua ba tầng: mất mát, xác suất, điểm số.', { n: 1, hl: 0 }),
              L('Đạo hàm của sigmoid là p(1 − p), và nó triệt tiêu đúng mẫu số trong đạo hàm của cross-entropy.', { n: 2, hl: 1 }, { say: 'Đạo hàm của sigmoid là p nhân một trừ p, và nó triệt tiêu đúng mẫu số trong đạo hàm của cross-entropy.' }),
              L('Kết quả: dự đoán trừ thật, nhân đầu vào. Đây cũng là lý do không dùng MSE cho phân loại: ghép MSE với sigmoid cho gradient gần bằng 0 đúng lúc mô hình sai nặng.', { n: 3, hl: 2 }),
              L('Bài toán này không có công thức đóng. Nhưng cross-entropy là hàm lồi, chỉ có một đáy, nên Gradient Descent luôn tìm được nó.', { hl: -1 }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'hoi_quy_logistic.py', code: logregPyCode(mini) },
            init: { a: 0, b: 0 },
            lines: [
              L('Phiên bản tự viết chỉ hơn chục dòng.'),
              L('Hàm sigmoid đúng một dòng.', { a: 7, b: 8 }),
              L('Mỗi vòng: điểm số, xác suất, mất mát cross-entropy.', { a: 12, b: 14 }),
              L('Gradient là X chuyển vị nhân p trừ y, chia n. Rồi cập nhật cả w và b.', { a: 15, b: 17 }, { say: 'Gradient là X chuyển vị nhân với p trừ y, chia cho n. Rồi cập nhật cả w và b.' }),
              L('Ở bước 6 còn có phiên bản scikit-learn chạy trên toàn bộ dữ liệu, với hai ngưỡng khác nhau.', { a: 0, b: 0 }, { say: 'Ở bước sáu còn có phiên bản scikit-learn chạy trên toàn bộ dữ liệu, với hai ngưỡng khác nhau.' }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Đánh giá và chọn ngưỡng', section: 'danh-gia',
        scenes: [
          {
            view: 'Points',
            props: { pts: fullPts, cls: fullCls, names: ['Lành tính', 'Ác tính'], xlab: 'x₁: bán kính', ylab: 'x₂: độ nhám', xdom: xd, ydom: yd, dot: 4, ...G,
              frames: [{ line: [fw[0], fw[1], fb], grid: probGrid(fw, fb, xd, yd, G.gx, G.gy), read: `w = (<b>${fmt(fw[0], 2)}</b>; <b>${fmt(fw[1], 2)}</b>)   b = <b>${fmt(fb, 2)}</b>` }] },
            init: { f: 0, ln: 0, rg: 0, dim: 0 },
            lines: [
              L(`Toàn bộ dữ liệu: ${tr.length} bệnh nhân để huấn luyện, ${te.length} để kiểm tra.`),
              L('Sau 2.000 vòng, ranh giới nằm chéo qua vùng chồng lấn. Lần này trọng số dừng lại ở giá trị hữu hạn.', { ln: 1, rg: 1 }, { say: 'Sau hai nghìn vòng, ranh giới nằm chéo qua vùng chồng lấn. Lần này trọng số dừng lại ở giá trị hữu hạn.' }),
              L('Mô hình xuất ra xác suất. Quyết định cuối cùng phụ thuộc ngưỡng ta chọn, và ngưỡng không phải chuyện toán học: nó là chuyện cái giá của từng loại sai lầm.', { hl: testIdx.join(','), dim: 0.7 }),
            ],
          },
          {
            view: 'Grid',
            props: {
              title: `Ma trận nhầm lẫn trên ${te.length} bệnh nhân test`,
              mats: [
                { title: 'Ngưỡng 0,5', rows: ['Thật: ác', 'Thật: lành'], cols: ['Đoán ác', 'Đoán lành'], vals: [[c5.tp, c5.fn], [c5.fp, c5.tn]], kind: 'heat', digits: 0, cell: 120 },
                { title: 'Ngưỡng 0,2', rows: ['Thật: ác', 'Thật: lành'], cols: ['Đoán ác', 'Đoán lành'], vals: [[c2.tp, c2.fn], [c2.fp, c2.tn]], kind: 'heat', digits: 0, cell: 120 },
              ],
            },
            init: { n: 0, hl: '' },
            lines: [
              L('Ma trận nhầm lẫn đếm bốn loại kết quả: đúng ác, đúng lành, bỏ sót và báo nhầm.', { n: 1 }),
              L(`Ngưỡng 0,5: bỏ sót ${c5.fn} ca ác tính, báo nhầm ${c5.fp} ca lành tính. Độ nhạy ${pct(sens(c5))}%.`, { hl: '0,0,1' }, { say: `Ngưỡng năm mươi phần trăm: bỏ sót ${speakNum(String(c5.fn))} ca ác tính, báo nhầm ${speakNum(String(c5.fp))} ca lành tính. Độ nhạy ${speakNum(pct(sens(c5)))} phần trăm.` }),
              L(`Độ chính xác ở ngưỡng này là ${pct(c5.accuracy)}%. Nghe rất tốt, nhưng nó gộp hai loại sai lầm rất khác nhau làm một.`, { hl: '' }, { say: `Độ chính xác ở ngưỡng này là ${speakNum(pct(c5.accuracy))} phần trăm. Nghe rất tốt, nhưng nó gộp hai loại sai lầm rất khác nhau làm một.` }),
              L(`Độ nhạy là tỷ lệ ca ác tính được phát hiện. Độ chuẩn là tỷ lệ báo động đúng trong số các lần báo ác tính: ở đây ${pct(prec(c5))}%.`, undefined, { say: `Độ nhạy là tỷ lệ ca ác tính được phát hiện. Độ chuẩn là tỷ lệ báo động đúng trong số các lần báo ác tính: ở đây ${speakNum(pct(prec(c5)))} phần trăm.` }),
              L('Với ung thư, bỏ sót đắt hơn báo nhầm rất nhiều: người bị bỏ sót có thể mất cơ hội điều trị, còn người bị báo nhầm chỉ phải làm thêm xét nghiệm.'),
              L(`Hạ ngưỡng xuống 0,2: chỉ còn bỏ sót ${c2.fn} ca, độ nhạy lên ${pct(sens(c2))}%. Đổi lại, báo nhầm tăng lên ${c2.fp} ca.`, { n: 2, hl: '1,0,1' }, { say: `Hạ ngưỡng xuống hai mươi phần trăm: chỉ còn bỏ sót ${speakNum(String(c2.fn))} ca, độ nhạy lên ${speakNum(pct(sens(c2)))} phần trăm. Đổi lại, báo nhầm tăng lên ${speakNum(String(c2.fp))} ca.` }),
              L(`Độ chuẩn giảm xuống ${pct(prec(c2))}%. Hạ ngưỡng là đổi báo nhầm lấy ít bỏ sót hơn, không bao giờ được cả hai.`, undefined, { say: `Độ chuẩn giảm xuống ${speakNum(pct(prec(c2)))} phần trăm. Hạ ngưỡng là đổi báo nhầm lấy ít bỏ sót hơn, không bao giờ được cả hai.` }),
              L('Không có ngưỡng đúng cho mọi bài toán. Ở bước 7, bạn có thể tự kéo ngưỡng và xem ma trận thay đổi.', { hl: '' }, { say: 'Không có ngưỡng đúng cho mọi bài toán. Ở bước bảy, bạn có thể tự kéo ngưỡng và xem ma trận thay đổi.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Chỉ nhìn độ chính xác</b> → bệnh hiếm thì "luôn nói lành" cũng đạt 99%.',
              '<b>Coi ngưỡng 0,5 là đúng</b> → chọn ngưỡng theo chi phí bỏ sót và báo nhầm.',
              '<b>Dữ liệu tách được hoàn toàn</b> → trọng số tăng vô hạn; cần điều chuẩn.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ba bẫy thường gặp.'),
              L('Một: chỉ nhìn độ chính xác. Nếu chỉ 1% bệnh nhân bị ung thư, mô hình luôn nói lành tính đạt 99% mà vô dụng.', { n: 1, hl: 0 }, { say: 'Một: chỉ nhìn độ chính xác. Nếu chỉ một phần trăm bệnh nhân bị ung thư, mô hình luôn nói lành tính đạt chín mươi chín phần trăm mà vô dụng.' }),
              L('Hai: coi ngưỡng 0,5 là mặc định đúng.', { n: 2, hl: 1 }, { say: 'Hai: coi ngưỡng năm mươi phần trăm là mặc định đúng.' }),
              L('Ba: dữ liệu tách được hoàn toàn làm trọng số tăng vô hạn. Người ta thêm điều chuẩn để giữ trọng số nhỏ.', { n: 3, hl: 2 }),
            ],
          },
        ],
      },
      {
        id: 'tong-ket', title: 'Tổng kết', section: 'tong-ket',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Nhớ gì sau bài này', items: [
              'Điểm số <b>z = w·x + b</b>, ép qua <b>sigmoid</b> thành xác suất.',
              'Ranh giới quyết định <b>p = 0,5</b> là một đường thẳng.',
              'Mất mát <b>cross-entropy</b>: phạt nặng khi sai mà tự tin.',
              'Gradient = <b>(p − y)·x</b>, giống hồi quy tuyến tính.',
              'Ngưỡng là <b>quyết định về chi phí</b>, đọc ma trận nhầm lẫn.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Hồi quy logistic tính một điểm số tuyến tính, rồi ép qua sigmoid thành xác suất.', { n: 1, hl: 0 }),
              L('Ranh giới năm mươi phần trăm là một đường thẳng.', { n: 2, hl: 1 }),
              L('Mất mát cross-entropy phạt nặng những dự đoán sai mà tự tin, và cho gradient gọn: dự đoán trừ thật, nhân đầu vào.', { n: 4, hl: 3 }, { anim: 2 }),
              L('Ngưỡng là quyết định về chi phí của sai lầm. Hãy đọc ma trận nhầm lẫn, đừng chỉ nhìn độ chính xác.', { n: 5, hl: 4 }),
              L('Chương 3 dừng lại với thuật toán để nhìn kỹ dữ liệu: khám phá, đánh giá và xử lý nó trước khi huấn luyện.', { hl: -1 }, { say: 'Chương ba dừng lại với thuật toán để nhìn kỹ dữ liệu: khám phá, đánh giá và xử lý nó trước khi huấn luyện.' }),
              L('Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương 3.', undefined, { say: 'Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương ba.' }),
            ],
          },
        ],
      },
    ],
  };
}
