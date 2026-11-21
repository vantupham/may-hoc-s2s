/**
 * Bài giảng chương 9: mạng nơ-ron. Mạng tí hon 2 → 3 → 1 trên 6 bệnh nhân (tinynet.json, η = 0,5 như lab),
 * rồi MLP 64 → 32 → 10 trên chữ số 8×8 (khởi tạo hạt giống 1, lô 32, như lab DigitTrainer).
 */
import cancer from '../../data/cancer.json';
import tiny from '../../data/tinynet.json';
import digits from '../../data/digits.json';
import split from '../../data/digits-split.json';
import { tinyPass, tinyUpdate, initMLP, mlpEpoch, mlpPredict, mulberry32, fmt, type Tiny } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const pc = (v: number, d = 1) => fmt(100 * v, d);
const spc = (v: number, d = 1) => `${sn(100 * v, d)} phần trăm`;

export const nnPyCode = `H = 32
W1 = rng.normal(0, np.sqrt(2 / 64), (H, 64)); b1 = np.zeros(H)
W2 = rng.normal(0, np.sqrt(2 / H), (10, H)); b2 = np.zeros(10)

for epoch in range(15):
    rng.shuffle(tr)
    for s in range(0, len(tr), 32):
        i = tr[s:s + 32]; x, y = X[i], Y[i]
        z1 = x @ W1.T + b1; a1 = np.maximum(0, z1)             # xuôi: lớp ẩn ReLU
        z2 = a1 @ W2.T + b2; z2 -= z2.max(1, keepdims=True)
        p = np.exp(z2); p /= p.sum(1, keepdims=True)           # softmax
        g2 = p.copy(); g2[np.arange(len(i)), y] -= 1; g2 /= len(i)   # ngược: ∂L/∂z2 = p − y
        g1 = (g2 @ W2) * (z1 > 0)                              # qua ReLU
        W2 -= 0.1 * g2.T @ a1; b2 -= 0.1 * g2.sum(0)
        W1 -= 0.1 * g1.T @ x;  b1 -= 0.1 * g1.sum(0)`;

/** Huấn luyện MLP như lab: xáo thứ tự mỗi epoch bằng mulberry32(seed·1000 + số epoch đã chạy + 1) */
function train(X: number[][], Y: number[], Xt: number[][], Yt: number[], lr: number, epochs: number, seed = 1) {
  const net = initMLP(64, 32, 10, seed);
  const acc = (xs: number[][], ys: number[]) => xs.filter((x, i) => mlpPredict(net, x) === ys[i]).length / xs.length;
  const curve = [{ ep: 0, loss: NaN, tr: acc(X, Y), te: acc(Xt, Yt) }];
  for (let e = 0; e < epochs; e++) {
    const r = mulberry32(seed * 1000 + curve.length);
    const order = Array.from({ length: X.length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const ls = mlpEpoch(net, X, Y, order, 32, lr);
    curve.push({ ep: curve.length, loss: ls.reduce((a, v) => a + v, 0) / ls.length, tr: acc(X, Y), te: acc(Xt, Yt) });
  }
  return { net, curve };
}

export function nnLecture(): Lecture {
  const P = cancer.mini;
  const xy = (i: number) => [[P[i].x1, P[i].x2] as [number, number], P[i].y] as const;
  const net0 = tiny as Tiny;
  const r1 = tinyPass(net0, ...xy(0));
  const r4 = tinyPass(net0, ...xy(3));
  let net = net0;
  for (let k = 0; k < 6; k++) net = tinyUpdate(net, tinyPass(net, ...xy(0)), 0.5);
  const r1b = tinyPass(net, ...xy(0)), r4b = tinyPass(net, ...xy(3));

  const D = digits.digits;
  const test = new Set(split.testIds);
  const tr = D.filter((_, i) => !test.has(i)), te = D.filter((_, i) => test.has(i));
  const X = tr.map((d) => d.px.map((v) => v / 16)), Y = tr.map((d) => d.y);
  const Xt = te.map((d) => d.px.map((v) => v / 16)), Yt = te.map((d) => d.y);
  const good = train(X, Y, Xt, Yt, 0.1, 15);
  const bad = train(X, Y, Xt, Yt, 2, 15, 2); // như lab: bấm "Khởi tạo lại" (hạt giống 2) rồi chạy với η = 2
  const g15 = good.curve[15], b15 = bad.curve[15];
  const cm = Array.from({ length: 10 }, () => new Array(10).fill(0));
  Xt.forEach((x, i) => { cm[Yt[i]][mlpPredict(good.net, x)]++; });
  let worst = [0, 1, 0];
  for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) if (a !== b && cm[a][b] > worst[2]) worst = [a, b, cm[a][b]];
  const hiddenImg = Array.from({ length: 6 }, (_, h) => Array.from({ length: 8 }, (_, r) => Array.from(good.net.W1.slice(h * 64 + r * 8, h * 64 + r * 8 + 8))));
  const img = (px: number[]) => Array.from({ length: 8 }, (_, r) => px.slice(r * 8, r * 8 + 8));
  const firstOf = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => D.find((x) => x.y === d)!);
  const zgrid = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);

  return {
    slug: 'mang-no-ron',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 9', title: 'Mạng nơ-ron', sub: 'lan truyền ngược từng con số · chữ số viết tay 8×8' },
            lines: [
              L('Chương 9: mạng nơ-ron.', undefined, { say: 'Chương chín: mạng nơ-ron.' }),
              L('Bài toán: cho ảnh 8 nhân 8 điểm ảnh của một chữ số viết tay, đó là số mấy? Đầu vào là 64 con số, đầu ra là một trong 10 lớp.', undefined, { say: 'Bài toán: cho ảnh tám nhân tám điểm ảnh của một chữ số viết tay, đó là số mấy? Đầu vào là sáu mươi tư con số, đầu ra là một trong mười lớp.' }),
              L('Hồi quy logistic chỉ vẽ được ranh giới thẳng. Với ảnh, ranh giới giữa số 3 và số 8 phức tạp hơn nhiều.', undefined, { say: 'Hồi quy logistic chỉ vẽ được ranh giới thẳng. Với ảnh, ranh giới giữa số ba và số tám phức tạp hơn nhiều.' }),
            ],
          },
          {
            view: 'Grid', props: { title: 'Mẫu đầu tiên của mỗi chữ số', mats: firstOf.map((d) => ({ title: String(d.y), vals: img(d.px), kind: 'img', cell: 9 })) },
            init: { n: 0 },
            lines: [
              L(`Ảnh do 43 người viết, được quét và thu nhỏ năm 1998. Có ${D.length.toLocaleString('vi-VN')} ảnh, mỗi chữ số khoảng 180 ảnh.`, { n: 10 }, { anim: 2, say: `Ảnh do bốn mươi ba người viết, được quét và thu nhỏ năm một nghìn chín trăm chín mươi tám. Có ${speakNum(D.length.toLocaleString('vi-VN'))} ảnh, mỗi chữ số khoảng một trăm tám mươi ảnh.` }),
              L('Độ đậm mỗi ô từ 0 đến 16; ta chia cho 16 để đưa về khoảng 0 đến 1.', undefined, { say: 'Độ đậm mỗi ô từ không đến mười sáu; ta chia cho mười sáu để đưa về khoảng không đến một.' }),
              L('Để hiểu cơ chế học, ta bắt đầu với một mạng tí hon trên 6 bệnh nhân quen thuộc của chương 2. Rồi áp dụng đúng thuật toán đó cho chữ số.', undefined, { say: 'Để hiểu cơ chế học, ta bắt đầu với một mạng tí hon trên sáu bệnh nhân quen thuộc của chương hai. Rồi áp dụng đúng thuật toán đó cho chữ số.' }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: nơ-ron và khúc gập', section: 'truc-giac',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Một nơ-ron', items: [
              { label: 'Tổng có trọng số', tex: String.raw`\cz{z} = \cw{w_1}\cx{x_1} + \cw{w_2}\cx{x_2} + \cb{b}` },
              { label: 'Kích hoạt', tex: String.raw`a = g(\cz{z})` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Mỗi nơ-ron làm hai việc. Một: tính tổng có trọng số của đầu vào, giống hệt hồi quy tuyến tính.', { n: 1, hl: 0 }),
              L('Hai: đưa tổng đó qua một hàm kích hoạt phi tuyến.', { n: 2, hl: 1 }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Ba hàm kích hoạt', series: [
              { name: 'sigmoid', pts: zgrid.map((z) => [z, 1 / (1 + Math.exp(-z))]), color: 0 },
              { name: 'tanh', pts: zgrid.map((z) => [z, Math.tanh(z)]), color: 1 },
              { name: 'ReLU', pts: zgrid.map((z) => [z, Math.max(0, z)]), color: 2 },
            ], xlab: 'z', ylab: 'g(z)', xdom: [-4, 4], ydom: [-1.2, 3] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Sigmoid ta đã gặp ở chương 2: ép mọi số vào khoảng 0 đến 1.', { n: 1, hl: 0 }, { say: 'Sigmoid ta đã gặp ở chương hai: ép mọi số vào khoảng không đến một.' }),
              L('Tanh tương tự nhưng từ âm 1 đến 1. Mạng tí hon của ta dùng tanh.', { n: 2, hl: 1 }, { say: 'Tanh tương tự nhưng từ âm một đến một. Mạng tí hon của ta dùng tanh.' }),
              L('ReLU đơn giản nhất: số âm thành 0, số dương giữ nguyên. Mạng chữ số dùng ReLU.', { n: 3, hl: 2 }, { say: 'ReLU đơn giản nhất: số âm thành không, số dương giữ nguyên. Mạng chữ số dùng ReLU.' }),
              L('Vì sao cần chúng? Không có hàm kích hoạt, ghép bao nhiêu tầng tuyến tính lại vẫn chỉ là một hàm tuyến tính. Chính các khúc gập cho phép mạng uốn ranh giới theo hình dạng tuỳ ý.', { hl: -1 }),
              L('Người ta chứng minh được: một mạng chỉ cần một tầng ẩn đủ rộng là có thể xấp xỉ mọi hàm liên tục, với độ chính xác tuỳ ý. Đó là định lý xấp xỉ phổ quát.'),
              L('Học vẫn là Gradient Descent. Câu hỏi khó là: với hàng nghìn trọng số ở các tầng khác nhau, làm sao biết mỗi trọng số góp bao nhiêu vào sai số ở đầu ra? Câu trả lời là lan truyền ngược.'),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: lan truyền ngược', section: 'tinh-tay',
        scenes: [
          {
            view: 'Table',
            props: {
              title: 'Mạng 2 → 3 → 1, bệnh nhân 1 (ác tính, y = 1)',
              cols: ['Nơ-ron ẩn', 'z = w·x + b', 'a = tanh z', 'trọng số ra v', 'δ = ∂L/∂z'],
              cls: ['t', 'v-z', '', 'v-w', 'v-g'],
              rows: [0, 1, 2].map((j) => [`h${j + 1}`, fmt(r1.z1[j], 3), fmt(r1.a1[j], 3), fmt(net0.w2[j], 2), fmt(r1.dz1[j], 4)]),
              foot: `đầu ra: z = ${fmt(r1.z2, 3)}  →  p = ${fmt(r1.p, 3)}   mất mát = ${fmt(r1.loss, 4)}   δ ra = p − y = ${fmt(r1.dz2, 3)}`,
            },
            init: { n: 3, c: 3, foot: 0 },
            lines: [
              L('Mạng tí hon: 2 đầu vào, 3 nơ-ron ẩn dùng tanh, 1 nơ-ron ra dùng sigmoid. Đưa bệnh nhân 1 vào, một ca ác tính.', undefined, { say: 'Mạng tí hon: hai đầu vào, ba nơ-ron ẩn dùng tanh, một nơ-ron ra dùng sigmoid. Đưa bệnh nhân một vào, một ca ác tính.' }),
              L('Lan truyền xuôi: mỗi nơ-ron ẩn tính tổng có trọng số, rồi qua tanh.', { c: 3 }),
              L(`Nơ-ron ra cộng ba giá trị đó theo trọng số v, qua sigmoid, được p = ${fmt(r1.p, 3)}. Mất mát cross-entropy: ${fmt(r1.loss, 4)}.`, { c: 4, foot: 1 }, { say: `Nơ-ron ra cộng ba giá trị đó theo trọng số v, qua sigmoid, được xác suất ${sn(r1.p, 3)}. Mất mát cross-entropy: ${sn(r1.loss, 4)}.` }),
              L(`Lan truyền ngược bắt đầu ở đầu ra: giống hồi quy logistic, δ = p − y = ${fmt(r1.dz2, 3)}.`, undefined, { say: `Lan truyền ngược bắt đầu ở đầu ra: giống hồi quy logistic, đen-ta bằng p trừ y, bằng ${sn(r1.dz2, 3)}.` }),
              L('Lùi về nơ-ron ẩn: nhân δ ra với trọng số v nối tới nó, rồi nhân với đạo hàm tanh, 1 − a².', { c: 5 }, { say: 'Lùi về nơ-ron ẩn: nhân đen-ta ra với trọng số v nối tới nó, rồi nhân với đạo hàm của tanh, tức một trừ a bình phương.' }),
              L('Gradient của một trọng số ở tầng đầu bằng δ của nơ-ron đó nhân với đầu vào. Mỗi tầng đi lùi thêm một thừa số: đó là quy tắc dây chuyền, áp dụng lặp lại.', undefined, { say: 'Gradient của một trọng số ở tầng đầu bằng đen-ta của nơ-ron đó nhân với đầu vào. Mỗi tầng đi lùi thêm một thừa số: đó là quy tắc dây chuyền, áp dụng lặp lại.' }),
              L(`Ví dụ trọng số ra của h3, v = ${fmt(net0.w2[2], 2)}. Gradient của nó là δ ra nhân a của h3: ${fmt(r1.dw2[2], 4)}. Với η = 0,5, v mới = ${fmt(net0.w2[2] - 0.5 * r1.dw2[2], 4)}.`, undefined, { say: `Ví dụ trọng số ra của nơ-ron thứ ba, v bằng ${sn(net0.w2[2], 2)}. Gradient của nó là đen-ta ra nhân giá trị kích hoạt của nơ-ron đó: ${sn(r1.dw2[2], 4)}. Với ê-ta bằng không phẩy năm, v mới bằng ${sn(net0.w2[2] - 0.5 * r1.dw2[2], 4)}.` }),
              L('Gradient âm nên v tăng: nơ-ron h3 đang đẩy về phía "ác tính", và mạng muốn nghe nó nhiều hơn với ca ác tính này.'),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Cập nhật 6 lần chỉ theo bệnh nhân 1 (η = 0,5)',
              cols: ['', 'Mất mát ban đầu', 'Sau 6 lần cập nhật'],
              cls: ['t', '', ''],
              rows: [['Bệnh nhân 1 (ác tính)', fmt(r1.loss, 4), fmt(r1b.loss, 4)], ['Bệnh nhân 4 (lành tính)', fmt(r4.loss, 4), fmt(r4b.loss, 4)]],
            },
            init: { n: 0, hl: -1, hc: -1 },
            lines: [
              L(`Áp dụng cập nhật 6 lần, chỉ dùng gradient của bệnh nhân 1. Mất mát của bệnh nhân 1 giảm từ ${fmt(r1.loss, 4)} xuống ${fmt(r1b.loss, 4)}.`, { n: 1, hl: 0 }, { say: `Áp dụng cập nhật sáu lần, chỉ dùng gradient của bệnh nhân một. Mất mát của bệnh nhân một giảm từ ${sn(r1.loss, 4)} xuống ${sn(r1b.loss, 4)}.` }),
              L(`Nhưng bệnh nhân 4, một ca lành tính: mất mát tăng từ ${fmt(r4.loss, 4)} lên ${fmt(r4b.loss, 4)}, gấp đôi.`, { n: 2, hl: 1 }, { say: `Nhưng bệnh nhân bốn, một ca lành tính: mất mát tăng từ ${sn(r4.loss, 4)} lên ${sn(r4b.loss, 4)}, gấp đôi.` }),
              L('Học theo một mẫu có thể làm hỏng mẫu khác. Vì vậy người ta lấy gradient trung bình trên cả một lô nhiều mẫu.', { hl: -1 }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Mạng 64 → 32 → 10', items: [
              { label: 'Xuôi', tex: String.raw`a^{(1)} = \text{ReLU}(W^{(1)}\cx{x} + b^{(1)}), \quad \cz{z}^{(2)} = W^{(2)} a^{(1)} + b^{(2)}` },
              { label: 'Softmax', tex: String.raw`\cp{p_k} = \frac{e^{z_k}}{\sum_j e^{z_j}}, \qquad \cL{L} = -\ln \cp{p_{y}}` },
              { label: 'Ngược', tex: String.raw`\delta^{(2)} = \cp{p} - \cy{y}, \qquad \delta^{(1)} = \big(W^{(2)\top}\delta^{(2)}\big) \odot g'(z^{(1)})` },
              { label: 'Gradient', tex: String.raw`\frac{\partial L}{\partial W^{(l)}} = \delta^{(l)}\, a^{(l-1)\top}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Mạng chữ số: 64 đầu vào, 32 nơ-ron ẩn dùng ReLU, 10 đầu ra.', { n: 1, hl: 0 }, { say: 'Mạng chữ số: sáu mươi tư đầu vào, ba mươi hai nơ-ron ẩn dùng ReLU, mười đầu ra.' }),
              L('Tầng cuối dùng softmax để biến 10 điểm số thành 10 xác suất cộng lại bằng 1. Mất mát vẫn là cross-entropy: âm log xác suất của lớp đúng.', { n: 2, hl: 1 }, { say: 'Tầng cuối dùng softmax để biến mười điểm số thành mười xác suất cộng lại bằng một. Mất mát vẫn là cross-entropy: âm lô-ga-rít xác suất của lớp đúng.' }),
              L('Lan truyền ngược: ở tầng cuối, δ = p − y, với y viết dạng one-hot. Lùi một tầng: nhân với ma trận trọng số chuyển vị, rồi nhân từng phần tử với đạo hàm của hàm kích hoạt.', { n: 3, hl: 2 }, { say: 'Lan truyền ngược: ở tầng cuối, đen-ta bằng p trừ y, với y viết dạng one-hot. Lùi một tầng: nhân với ma trận trọng số chuyển vị, rồi nhân từng phần tử với đạo hàm của hàm kích hoạt.' }),
              L('Trọng số ban đầu được chọn ngẫu nhiên, nhỏ, với độ lệch chuẩn căn của hai chia số đầu vào. Nhờ vậy tín hiệu không phình to hay teo nhỏ khi đi qua từng tầng.'),
              L('Gradient của mỗi ma trận trọng số là một phép nhân ma trận. Tính gradient cho mọi trọng số chỉ tốn cỡ một lần lan truyền xuôi.', { n: 4, hl: 3 }),
              L('Gradient Descent theo lô: thay vì tính trên toàn bộ ảnh, ta lấy trung bình trên 32 ảnh rồi cập nhật ngay. Gradient nhiễu một chút, nhưng mỗi epoch có 45 bước cập nhật thay vì 1.', { hl: -1 }, { say: 'Gradient Descent theo lô: thay vì tính trên toàn bộ ảnh, ta lấy trung bình trên ba mươi hai ảnh rồi cập nhật ngay. Gradient nhiễu một chút, nhưng mỗi epoch có bốn mươi lăm bước cập nhật thay vì một.' }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'mang_no_ron.py', code: nnPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Toàn bộ mạng và lan truyền ngược bằng NumPy, khoảng 20 dòng.', undefined, { say: 'Toàn bộ mạng và lan truyền ngược bằng NumPy, khoảng hai mươi dòng.' }),
              L('Khởi tạo trọng số ngẫu nhiên, nhỏ, theo cỡ của tầng.', { a: 2, b: 3 }),
              L('Mỗi lô 32 ảnh: lan truyền xuôi qua ReLU và softmax.', { a: 8, b: 10 }, { say: 'Mỗi lô ba mươi hai ảnh: lan truyền xuôi qua ReLU và softmax.' }),
              L('Lan truyền ngược: p trừ y, rồi lùi qua ReLU. Mỗi dòng ứng với một công thức vừa xem.', { a: 11, b: 12 }),
              L('Cập nhật bốn ma trận và vector. Trong thực tế, PyTorch hay JAX tự động tính phần lan truyền ngược cho bất kỳ mạng nào bạn viết.', { a: 13, b: 14 }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Huấn luyện trên chữ số', section: 'danh-gia',
        scenes: [
          {
            view: 'Chart',
            props: { title: `Độ chính xác test theo epoch (${te.length} ảnh test)`, series: [{ name: 'η = 0,1', pts: good.curve.map((c) => [c.ep, c.te]), color: 2, dots: true }, { name: 'η = 2', pts: bad.curve.map((c) => [c.ep, c.te]), color: 1, dots: true }], xlab: 'epoch', ylab: 'độ chính xác test', xdom: [0, 15], ydom: [0, 1], xfmt: 'int', yfmt: 'pct' },
            init: { n: 1, t: 0, hl: -1 },
            lines: [
              L(`Trước khi học, mạng đoán bừa: khoảng ${pc(good.curve[0].te, 0)}%. Mất mát cỡ ln 10, đúng mức "không biết gì" với 10 lớp.`, undefined, { say: `Trước khi học, mạng đoán bừa: khoảng ${spc(good.curve[0].te, 0)}. Mất mát cỡ lô-ga-rít của mười, đúng mức không biết gì với mười lớp.` }),
              L(`Với η = 0,1, chỉ sau 1 epoch đã đạt ${pc(good.curve[1].te)}%.`, { t: 1 / 15 }, { anim: 1.5, say: `Với ê-ta bằng không phẩy một, chỉ sau một epoch đã đạt ${spc(good.curve[1].te)}.` }),
              L(`Sau 15 epoch: ${pc(g15.tr)}% trên tập huấn luyện, ${pc(g15.te)}% trên tập test.`, { t: 1 }, { anim: 'line', ease: 'lin', say: `Sau mười lăm epoch: ${spc(g15.tr)} trên tập huấn luyện, ${spc(g15.te)} trên tập test.` }),
              L(`Khoảng cách giữa huấn luyện và test chỉ khoảng ${fmt(100 * (g15.tr - g15.te), 1)} điểm phần trăm: mạng chưa học thuộc lòng. Nếu khoảng cách này lớn dần qua các epoch, đó là lúc nên dừng.`, undefined, { say: `Khoảng cách giữa huấn luyện và test chỉ khoảng ${sn(100 * (g15.tr - g15.te), 1)} điểm phần trăm: mạng chưa học thuộc lòng. Nếu khoảng cách này lớn dần qua các epoch, đó là lúc nên dừng.` }),
              L(`Thử η = 2: mất mát nhảy loạn, như quả bóng văng khỏi lòng chảo ở chương 0. Sau 15 epoch chỉ ${pc(b15.tr)}% trên huấn luyện, ${pc(b15.te)}% trên test: còn tệ hơn đoán bừa.`, { n: 2, hl: 1 }, { say: `Thử ê-ta bằng hai: mất mát nhảy loạn, như quả bóng văng khỏi lòng chảo ở chương không. Sau mười lăm epoch chỉ ${spc(b15.tr)} trên huấn luyện, ${spc(b15.te)} trên test: còn tệ hơn đoán bừa.` }),
            ],
          },
          {
            view: 'Grid',
            props: { title: 'Nhầm lẫn trên tập test (η = 0,1)', mats: [{ rows: [...'0123456789'], cols: [...'0123456789'], vals: cm, kind: 'heat', digits: 0, cell: 34 }] },
            init: { n: 1, hl: '' },
            lines: [
              L('Ma trận nhầm lẫn: hàng là chữ số thật, cột là chữ số mạng đoán. Đường chéo đậm là đoán đúng.'),
              L(`Nhầm nhiều nhất: số ${worst[0]} bị đoán là ${worst[1]}, ${worst[2]} lần.`, { hl: `0,${worst[0]},${worst[1]}` }, { say: `Nhầm nhiều nhất: số ${speakNum(String(worst[0]))} bị đoán là ${speakNum(String(worst[1]))}, ${speakNum(String(worst[2]))} lần.` }),
              L('Những chữ số có nét giống nhau là nơi mạng còn vất vả, giống như mắt người khi nhìn chữ viết vội.', { hl: '' }),
            ],
          },
          {
            view: 'Grid',
            props: { title: 'Trọng số của 6 nơ-ron ẩn', mats: hiddenImg.map((m, h) => ({ title: `h${h + 1}`, vals: m, kind: 'heat', signed: true, bare: true, cell: 13 })) },
            init: { n: 0 },
            lines: [
              L('Mỗi nơ-ron ẩn có 64 trọng số, xếp lại thành ảnh 8 nhân 8. Màu đỏ là trọng số dương, xanh là âm.', { n: 6 }, { anim: 2, say: 'Mỗi nơ-ron ẩn có sáu mươi tư trọng số, xếp lại thành ảnh tám nhân tám. Màu đỏ là trọng số dương, xanh là âm.' }),
              L(`Cả mạng có ${64 * 32 + 32 + 32 * 10 + 10} tham số. Mỗi tham số được chỉnh hàng trăm lần, mỗi lần theo đúng công thức lan truyền ngược ta vừa tính tay.`, undefined, { say: `Cả mạng có ${speakNum((64 * 32 + 32 + 32 * 10 + 10).toLocaleString('vi-VN'))} tham số. Mỗi tham số được chỉnh hàng trăm lần, mỗi lần theo đúng công thức lan truyền ngược ta vừa tính tay.` }),
              L('Mỗi nơ-ron thành một bộ dò: sáng lên khi ảnh có nét ở vùng đỏ, và tắt đi khi có nét ở vùng xanh. Không ai dạy chúng điều đó.'),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Khởi tạo mọi trọng số bằng 0</b> → mọi nơ-ron ẩn mãi giống nhau.',
              '<b>Gradient biến mất</b> với sigmoid, tanh qua nhiều tầng → dùng ReLU.',
              '<b>Không chuẩn hoá đầu vào</b> → học kém ổn định.',
              '<b>Quá khớp</b> → theo dõi test, dừng sớm hoặc điều chuẩn.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bốn bẫy thường gặp. Một: khởi tạo mọi trọng số bằng 0. Mọi nơ-ron ẩn nhận cùng gradient và mãi mãi giống nhau.', { n: 1, hl: 0 }, { say: 'Bốn bẫy thường gặp. Một: khởi tạo mọi trọng số bằng không. Mọi nơ-ron ẩn nhận cùng gradient và mãi mãi giống nhau.' }),
              L('Hai: gradient biến mất. Đạo hàm của sigmoid hay tanh gần 0 khi z lớn; nhân qua nhiều tầng, gradient ở các tầng đầu gần như bằng 0.', { n: 2, hl: 1 }, { say: 'Hai: gradient biến mất. Đạo hàm của sigmoid hay tanh gần không khi z lớn; nhân qua nhiều tầng, gradient ở các tầng đầu gần như bằng không.' }),
              L('Ba: không chuẩn hoá đầu vào.', { n: 3, hl: 2 }),
              L('Bốn: quá khớp. Theo dõi độ chính xác test; dừng sớm hoặc điều chuẩn khi khoảng cách giữa huấn luyện và test lớn dần.', { n: 4, hl: 3 }),
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
              'Nơ-ron = tổng có trọng số + <b>hàm kích hoạt phi tuyến</b>.',
              '<b>Lan truyền ngược</b> = quy tắc dây chuyền lặp lại: δ ra = p − y.',
              'Học trên một mẫu có thể hỏng mẫu khác → <b>lô</b>.',
              '<b>Tốc độ học</b> sai làm hỏng tất cả.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Một nơ-ron là tổng có trọng số cộng một hàm kích hoạt phi tuyến. Không có phi tuyến, mạng nhiều tầng chỉ là một mô hình tuyến tính.', { n: 1, hl: 0 }),
              L('Lan truyền ngược là quy tắc dây chuyền áp dụng lặp lại, bắt đầu từ p trừ y ở đầu ra.', { n: 2, hl: 1 }),
              L('Học theo lô vì một mẫu có thể kéo mạng đi sai hướng với mẫu khác. Và tốc độ học sai thì không gì cứu được.', { n: 4, hl: 3 }, { anim: 2 }),
              L(`Mạng 64, 32, 10 đạt khoảng ${pc(g15.te, 0)}% trên ảnh chưa từng thấy, chỉ sau 15 lượt qua dữ liệu.`, { hl: -1 }, { say: `Mạng sáu mươi tư, ba mươi hai, mười đạt khoảng ${spc(g15.te, 0)} trên ảnh chưa từng thấy, chỉ sau mười lăm lượt qua dữ liệu.` }),
              L('Chương 10 làm mạng thông minh hơn với ảnh: thay vì nhìn từng điểm ảnh riêng lẻ, nó trượt những bộ lọc nhỏ qua ảnh. Đó là mạng tích chập.', undefined, { say: 'Chương mười làm mạng thông minh hơn với ảnh: thay vì nhìn từng điểm ảnh riêng lẻ, nó trượt những bộ lọc nhỏ qua ảnh. Đó là mạng tích chập.' }),
              L('Giờ hãy cuộn xuống, tự huấn luyện mạng và thử vẽ chữ số của bạn. Hẹn gặp lại ở chương 10.', undefined, { say: 'Giờ hãy cuộn xuống, tự huấn luyện mạng và thử vẽ chữ số của bạn. Hẹn gặp lại ở chương mười.' }),
            ],
          },
        ],
      },
    ],
  };
}
