/**
 * Bài giảng chương 0: Gradient Descent trên 5 khu vực housing.mini, rồi 400 khu vực housing.sample.
 * Mọi con số trong lời giảng do ml-core tính (linearRegressionGD, mse), cùng cách với trang bài học.
 */
import housing from '../../data/housing.json';
import { linearRegressionGD, mse, fmt } from '../ml-core';
import { readNumber as speakNum, speak } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
/** Số tiền kiểu Việt: 37000 → "37.000" */
const money = (v: number) => Math.round(v).toLocaleString('vi-VN');

export const gdPyCode = (xs: number[], ys: number[]) => `import numpy as np

# 5 khu vực thật trong dữ liệu California Housing
x = np.array([${xs.join(', ')}])   # thu nhập (×10.000 USD)
y = np.array([${ys.join(', ')}])   # giá nhà (×100.000 USD)

w = 0.0          # điểm xuất phát
eta = 0.01       # tốc độ học
n = len(x)

for k in range(25):
    y_hat = w * x                 # 1. dự đoán
    e = y_hat - y                 # 2. sai số
    L = np.mean(e ** 2)           # 3. mất mát MSE
    dw = 2 / n * np.sum(e * x)    # 4. đạo hàm (độ dốc)
    w = w - eta * dw              # 5. bước xuống dốc
    if k < 3 or k == 24:
        print(f"vòng {k+1:2d}: L = {L:.4f}  dL/dw = {dw:+.4f}  w mới = {w:.4f}")

print("Nghiệm chính xác w* =", np.sum(x * y) / np.sum(x * x))`;

export function gdLecture(): Lecture {
  const mini = housing.mini;
  const xs = mini.map((h) => h.income);
  const ys = mini.map((h) => h.value);
  const n = xs.length;
  const run = (lr: number, epochs = 25) => linearRegressionGD(xs, ys, { lr, epochs, fitIntercept: false });
  const t = run(0.01);
  const s0 = t.steps[0].state;
  const wAt = (tr: ReturnType<typeof run>, k: number) => tr.steps[k - 1].state.wNext;
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const wStar = sxy / sxx;
  const Lstar = mse(xs, ys, wStar, 0);
  const L0 = mse(xs, ys, 0, 0);
  const L1w = mse(xs, ys, 1, 0);
  const Lafter1 = mse(xs, ys, s0.wNext, 0);
  const curv = (2 / n) * sxx;
  const thr = 2 / curv;
  const sumEx = s0.errors.reduce((a, e, i) => a + e * xs[i], 0);
  const tSlow = run(0.002);
  const tDiv = run(0.07);
  const Ldiv25 = tDiv.steps[24].state.loss;
  const oceanVi: Record<string, string> = { INLAND: 'Nội địa', 'NEAR OCEAN': 'Gần biển', '<1H OCEAN': 'Cách biển < 1 giờ', 'NEAR BAY': 'Gần vịnh', ISLAND: 'Đảo' };

  const SX = housing.sample.map((s) => s.income);
  const SY = housing.sample.map((s) => s.value);
  const tAll = linearRegressionGD(SX, SY, { lr: 0.01, epochs: 100, fitIntercept: false });
  const wAll = tAll.steps.at(-1)!.state.wNext;

  const bowl = { xs, ys, xmax: 6.5, ymax: 3, wmin: -0.3, wmax: 1.1, labels: mini.map((_, i) => String(i + 1)) };
  const code = gdPyCode(xs, ys);

  return {
    slug: 'gradient-descent',
    voice: VOICE,
    chapters: [
      {
        id: 'mo-dau', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 0', title: 'Gradient Descent', sub: 'xuống dốc từng bước · California Housing' },
            lines: [
              L('Xin chào. Đây là bài giảng chương 0 của Máy học S2S: Gradient Descent, thuật toán xuống dốc từng bước.', undefined, { say: 'Xin chào. Đây là bài giảng chương không của Máy học S2S: Gradient Descent, thuật toán xuống dốc từng bước.' }),
              L('Gần như mọi mô hình học máy, từ một đường thẳng đến mạng nơ-ron hàng tỷ tham số, đều học bằng cùng một cách.'),
              L('Đoán, đo xem sai bao nhiêu, rồi chỉnh một chút theo hướng bớt sai. Rồi lặp lại.'),
              L('Trong bài giảng này, ta làm đúng như vậy bằng tay trên 5 khu dân cư có thật ở California, từng phép cộng, phép nhân.', undefined, { say: 'Trong bài giảng này, ta làm đúng như vậy bằng tay trên năm khu dân cư có thật ở California, từng phép cộng, phép nhân.' }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: '5 khu vực trong California Housing (1990)',
              cols: ['Căn', 'Vị trí', 'Thu nhập x (×10.000 USD)', 'Giá nhà y (×100.000 USD)'],
              cls: ['', 't', 'v-x', 'v-y'],
              rows: mini.map((h, i) => [String(i + 1), oceanVi[h.ocean] ?? h.ocean, fmt(h.income, 4), fmt(h.value, 3)]),
            },
            init: { n: 0, hl: -1, hc: -1 },
            lines: [
              L('Đây là dữ liệu. Mỗi dòng là một khu vực trong cuộc điều tra dân số Mỹ năm 1990.', { n: 5 }, { anim: 2.5, ease: 'lin' }),
              L('Cột x là thu nhập trung bình của người dân, tính theo đơn vị 10.000 USD.', { hc: 2 }),
              L('Cột y là giá nhà trung bình, tính theo đơn vị 100.000 USD.', { hc: 3 }),
              L(`Ví dụ căn 1: thu nhập ${fmt(xs[0], 4)}, tức khoảng ${money(xs[0] * 10000)} USD một năm, và giá nhà khoảng ${money(ys[0] * 100000)} USD.`, { hl: 0, hc: -1 }, {
                say: speak(`Ví dụ căn 1: thu nhập khoảng ${money(xs[0] * 10000)} USD một năm, và giá nhà khoảng ${money(ys[0] * 100000)} USD.`),
              }),
              L('Câu hỏi của bài: biết thu nhập của một khu vực, ta có đoán được giá nhà ở đó không?', { hl: -1 }),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Mô hình đơn giản nhất', items: [{ tex: String.raw`\cyh{\hat y} = \cw{w} \cdot \cx{x}` }] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Thử mô hình đơn giản nhất: giá nhà tỷ lệ với thu nhập, ŷ = w · x.', { n: 1 }, { say: 'Ta thử mô hình đơn giản nhất có thể: giá nhà tỷ lệ với thu nhập. Giá dự đoán, gọi là y mũ, bằng w nhân x.' }),
              L('Chỉ có một con số cần tìm: hệ số w. "Học" ở đây nghĩa là tìm ra w tốt nhất.', { hl: 0 }),
            ],
          },
        ],
      },
      {
        id: 'du-lieu', title: 'Đo sai số', section: 'kham-pha',
        scenes: [
          {
            view: 'gd/Bowl', props: bowl,
            init: { w: 0.25, line: 0, res: 0, sq: 0, bowl: 0, lab: 1, hl: -1 },
            lines: [
              L('Vẽ 5 khu vực lên mặt phẳng: trục ngang là thu nhập, trục đứng là giá nhà.'),
              L('Thu nhập tăng dần từ căn 1 đến căn 5, nhưng giá nhà thì không tăng đều.'),
              L('Căn 4 có thu nhập cao thứ hai mà giá lại thấp thứ hai: nó nằm sâu trong nội địa, còn căn 2 ở gần biển.', { hl: 3 }),
              L('Vậy không có đường thẳng nào đi qua cả 5 điểm. Câu hỏi đúng là: đường thẳng nào sai ít nhất?', { hl: -1, line: 1 }),
              L('Với mỗi căn, sai số e = ŷ − y: đoạn đỏ nối giá thật với đường dự đoán.', { res: 1 }, { say: 'Với mỗi căn, sai số e bằng giá dự đoán trừ giá thật: đó là đoạn đỏ nối điểm với đường thẳng.' }),
              L('Ta bình phương sai số, tức vẽ một hình vuông có cạnh bằng sai số. Số âm không còn triệt tiêu số dương, và sai lớn bị phạt nặng hơn.', { sq: 1 }),
              L('Trung bình diện tích các hình vuông gọi là sai số bình phương trung bình, MSE. Đó chính là mất mát L.', undefined, { say: 'Trung bình diện tích các hình vuông gọi là sai số bình phương trung bình, viết tắt em ét e. Đó chính là mất mát L.' }),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Mất mát MSE', items: [{ tex: String.raw`\cL{L}(\cw{w}) = \frac{1}{n}\sum_{i=1}^{n}\left(\cw{w}\,\cx{x_i} - \cy{y_i}\right)^2` }] },
            init: { n: 0, hl: -1 },
            lines: [
              L('L(w) = (1/n) · Σ (w·xᵢ − yᵢ)²', { n: 1 }, { say: 'Viết thành công thức: L của w bằng trung bình, trên n căn, của bình phương w nhân x i trừ y i.' }),
              L('Mục tiêu từ giờ: tìm w làm L nhỏ nhất.', { hl: 0 }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: cái bát', section: 'truc-giac',
        scenes: [
          {
            view: 'gd/Bowl', props: bowl,
            init: { w: 0, line: 1, res: 1, sq: 1, bowl: 0, lab: 0, hl: -1, star: 0 },
            lines: [
              L('Bắt đầu với w = 0: đường thẳng nằm sát trục ngang, mọi dự đoán bằng 0.'),
              L(`Mọi sai số lúc này chính là âm giá nhà, và mất mát L = ${fmt(L0, 3)}.`, { bowl: 1 }),
              L('Bên phải là đồ thị L theo w. Mỗi vị trí của đường thẳng là một điểm trên đường cong này.'),
              L('Giờ tăng dần w. Để ý các hình vuông co lại, và điểm trên đường cong trượt xuống.', { w: 0.22 }, { anim: 'line' }),
              L(`Tới khoảng w = ${fmt(wStar, 2)}, mất mát chạm đáy: L = ${fmt(Lstar, 3)}.`, { w: wStar, star: 1 }, { anim: 'line' }),
              L('Đi quá đáy, đường thẳng dốc quá, các hình vuông lại to ra.', { w: 0.7 }, { anim: 'line' }),
              L(`Ở w = 1, mất mát vọt lên ${fmt(L1w, 2)}. Hình vuông của căn 5 to nhanh nhất, vì thu nhập của nó lớn nhất.`, { w: 1, hl: 4 }, { anim: 'line' }),
              L('Đường cong có hình cái bát. Tìm w tốt nhất nghĩa là tìm đáy bát.', { w: wStar, hl: -1 }, { anim: 2 }),
              L('Với một tham số, dò bằng mắt được. Nhưng mô hình thật có hàng nghìn, thậm chí hàng tỷ tham số. Ta cần một cách tự động.'),
              L('Ở bước 3 của bài, bạn có thể tự kéo thanh trượt để cảm nhận cái bát này.'),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay từng vòng', section: 'tinh-tay',
        scenes: [
          {
            view: 'Bullets', props: { title: 'Xuống dốc trong sương mù', items: ['Không thấy đáy, nhưng cảm được dốc dưới chân.', 'Bước một bước theo hướng xuống dốc.', 'Lặp lại.'] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Hình dung bạn đứng trên sườn đồi trong sương mù. Không thấy đáy, nhưng cảm được chân mình đang dốc về phía nào.', { n: 1 }),
              L('Bước một bước theo hướng xuống dốc. Rồi lặp lại. Đó là toàn bộ ý tưởng của Gradient Descent.', { n: 3 }, { say: 'Bước một bước theo hướng xuống dốc. Rồi lặp lại. Đó là toàn bộ ý tưởng của Gradient Descent.' }),
            ],
          },
          {
            view: 'Formula',
            props: {
              title: 'Một vòng lặp gồm bốn việc',
              items: [
                { label: '1. Dự đoán', tex: String.raw`\cyh{\hat y_i} = \cw{w}\,\cx{x_i}` },
                { label: '2. Sai số', tex: String.raw`\ce{e_i} = \cyh{\hat y_i} - \cy{y_i}` },
                { label: '3. Độ dốc', tex: String.raw`\cg{\frac{\partial L}{\partial w}} = \frac{2}{n}\sum_i \ce{e_i}\,\cx{x_i}` },
                { label: '4. Bước xuống dốc', tex: String.raw`\cw{w_{\text{mới}}} = \cw{w} - \ceta{\eta}\,\cg{\frac{\partial L}{\partial w}}` },
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Mỗi vòng lặp gồm bốn việc.'),
              L('Một, dự đoán cho từng căn: ŷᵢ = w·xᵢ.', { n: 1, hl: 0 }, { say: 'Một, dự đoán cho từng căn: y mũ i bằng w nhân x i.' }),
              L('Hai, sai số: eᵢ = ŷᵢ − yᵢ.', { n: 2, hl: 1 }, { say: 'Hai, sai số: e i bằng dự đoán trừ giá thật.' }),
              L('Ba, độ dốc ∂L/∂w = (2/n)·Σ eᵢxᵢ.', { n: 3, hl: 2 }, { say: 'Ba, độ dốc, tức đạo hàm của L theo w: bằng hai phần n nhân tổng các tích e i nhân x i.' }),
              L('Bốn, bước xuống dốc: w mới = w − η·∂L/∂w, với η là tốc độ học, độ dài mỗi bước.', { n: 4, hl: 3 }, { say: 'Bốn, bước xuống dốc: w mới bằng w trừ ê-ta nhân độ dốc. Ê-ta là tốc độ học, quyết định độ dài mỗi bước.' }),
              L('Độ dốc dương nghĩa là đi sang phải thì L tăng, nên phải đi sang trái. Vì vậy có dấu trừ.', { hl: -1 }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Vòng 1, xuất phát từ w = 0',
              cols: ['Căn', 'x', 'y', 'ŷ = w·x', 'e = ŷ − y', 'e·x'],
              cls: ['', 'v-x', 'v-y', 'v-yh', 'v-e', 'v-g'],
              rows: xs.map((x, i) => [String(i + 1), fmt(x, 4), fmt(ys[i], 3), fmt(s0.preds[i], 3), fmt(s0.errors[i], 3), fmt(s0.errors[i] * x, 3)]),
              foot: `Σ e·x = ${fmt(sumEx, 3)}   →   ∂L/∂w = (2/5) × (${fmt(sumEx, 3)}) = ${fmt(s0.dw, 3)}`,
            },
            init: { n: 5, c: 3, foot: 0, hl: -1 },
            lines: [
              L('Làm vòng 1 bằng tay, xuất phát từ w = 0.'),
              L('Với w = 0, mọi dự đoán đều bằng 0.', { c: 4 }),
              L('Nên sai số chính là âm giá nhà.', { c: 5 }),
              L('Nhân từng sai số với thu nhập của căn đó.', { c: 6 }),
              L(`Cộng năm tích lại được ${fmt(sumEx, 2)}. Nhân với hai phần năm, độ dốc bằng ${fmt(s0.dw, 2)}.`, { foot: 1 }),
            ],
          },
          {
            view: 'Formula',
            props: {
              title: 'Bước đầu tiên',
              items: [
                { tex: String.raw`\cw{w_{\text{mới}}} = 0 - \ceta{0{,}01} \times (\cg{${fmt(s0.dw, 4).replace(',', '{,}')}}) = \cw{${fmt(s0.wNext, 4).replace(',', '{,}')}}` },
                { tex: String.raw`\cL{L}: \; ${fmt(L0, 4).replace(',', '{,}')} \;\longrightarrow\; ${fmt(Lafter1, 4).replace(',', '{,}')}` },
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Độ dốc âm: đi sang phải sẽ xuống dốc. Với η = 0,01: w mới = 0 − 0,01 × (${fmt(s0.dw, 2)}) = ${fmt(s0.wNext, 4)}.`, { n: 1 }, {
                say: `Độ dốc âm, nghĩa là đi sang phải sẽ xuống dốc. Với ê-ta bằng không phẩy không một, w mới bằng không trừ không phẩy không một nhân ${speakNum(fmt(s0.dw, 2))}, tức là ${speakNum(fmt(s0.wNext, 4))}.`,
              }),
              L(`Chỉ sau một bước, mất mát giảm từ ${fmt(L0, 3)} xuống ${fmt(Lafter1, 3)}.`, { n: 2 }),
            ],
          },
          {
            view: 'gd/Bowl', props: bowl,
            init: { line: 1, res: 1, sq: 1, bowl: 1, gd: 1, k: 0, eta: '0.01', star: 1, tan: 0 },
            lines: [
              L('Giờ để máy lặp lại bốn việc đó.'),
              L(`Vòng 1: quả bóng nhảy một bước dài, từ 0 tới ${fmt(wAt(t, 1), 3)}.`, { k: 1 }, { anim: 1.5 }),
              L(`Vòng 2, vòng 3, … tới vòng 6, w đạt ${fmt(wAt(t, 6), 3)}.`, { k: 6 }, { anim: 'line', ease: 'lin' }),
              L('Để ý: các bước ngắn dần, dù tốc độ học không hề đổi.', { tan: 1 }),
              L('Vì độ dài bước bằng η nhân độ lớn của độ dốc. Càng gần đáy, đường cong càng phẳng, độ dốc càng nhỏ.', undefined, { say: 'Vì độ dài bước bằng ê-ta nhân độ lớn của độ dốc. Càng gần đáy, đường cong càng phẳng, độ dốc càng nhỏ.' }),
              L('Thuật toán tự phanh khi sắp tới nơi, không cần ai bảo.'),
              L(`Sau 25 vòng, w = ${fmt(wAt(t, 25), 4)}, gần như chạm đáy.`, { k: 25, tan: 0 }, { anim: 'line', ease: 'lin' }),
            ],
          },
          {
            view: 'gd/Bowl', props: bowl,
            init: { line: 1, res: 0, sq: 0, bowl: 1, gd: 1, k: 0, eta: '0.002', star: 1, tan: 0 },
            lines: [
              L('Tốc độ học quyết định rất nhiều. Thử η nhỏ: 0,002.', { k: 25 }, { anim: 'line', ease: 'lin', say: 'Tốc độ học quyết định rất nhiều. Thử ê-ta nhỏ: không phẩy không không hai.' }),
              L(`Sau 25 vòng, w mới tới ${fmt(wAt(tSlow, 25), 3)}, còn xa đáy. Quá chậm.`),
              L('Tăng η lên 0,03.', { eta: '0.03', k: 0 }, { anim: 0.01, say: 'Tăng ê-ta lên không phẩy không ba.' }),
              L('Chỉ khoảng 4 vòng là gần như chạm đáy.', { k: 12 }, { anim: 'line', ease: 'lin' }),
              L('η = 0,05: bóng nhảy qua lại hai bên đáy rồi mới lắng xuống.', { eta: '0.05', k: 0 }, { anim: 0.01, say: 'Ê-ta bằng không phẩy không năm: bóng nhảy qua lại hai bên đáy rồi mới lắng xuống.' }),
              L('Xem nó dao động.', { k: 14 }, { anim: 'line', ease: 'lin' }),
              L(`η = 0,07, vừa vượt ngưỡng: mỗi lần nhảy lại xa đáy hơn. Thuật toán phân kỳ.`, { eta: '0.07', k: 0 }, { anim: 0.01, say: 'Ê-ta bằng không phẩy không bảy, vừa vượt ngưỡng: mỗi lần nhảy lại xa đáy hơn. Thuật toán phân kỳ.' }),
              L(`Sau 25 vòng, mất mát lên tới khoảng ${money(Ldiv25)}.`, { k: 8 }, { anim: 'line', ease: 'lin' }),
              L('Ở bước 4 của bài, bạn có thể tự bấm từng vòng và thử các tốc độ học khác nhau.'),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: {
              title: 'Độ dốc đến từ đâu?',
              items: [
                { label: 'Quy tắc dây chuyền', tex: String.raw`\frac{d}{d\cw{w}}\left(\cw{w}\cx{x_i} - \cy{y_i}\right)^2 = 2\left(\cw{w}\cx{x_i} - \cy{y_i}\right)\cx{x_i} = 2\,\ce{e_i}\,\cx{x_i}` },
                { label: 'Lấy trung bình', tex: String.raw`\cg{\frac{\partial L}{\partial w}} = \frac{2}{n}\sum_{i} \ce{e_i}\,\cx{x_i}` },
                { label: 'Cập nhật', tex: String.raw`\cw{w} \leftarrow \cw{w} - \ceta{\eta}\,\cg{\frac{\partial L}{\partial w}}` },
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Công thức độ dốc đến từ đâu?'),
              L('Mỗi số hạng của L có dạng (w·xᵢ − yᵢ)². Theo quy tắc dây chuyền, đạo hàm của u² là 2u nhân đạo hàm của u.', { n: 1, hl: 0 }, { say: 'Mỗi số hạng của L là bình phương của w nhân x i trừ y i. Theo quy tắc dây chuyền, đạo hàm của u bình phương bằng hai u nhân đạo hàm của u.' }),
              L('Ở đây u chính là sai số eᵢ, còn đạo hàm của u theo w là xᵢ. Vậy mỗi số hạng cho 2·eᵢ·xᵢ.', undefined, { say: 'Ở đây u chính là sai số e i, còn đạo hàm của u theo w là x i. Vậy mỗi số hạng cho hai e i nhân x i.' }),
              L('Lấy trung bình trên n căn, ta được đúng công thức độ dốc đã dùng.', { n: 2, hl: 1 }),
              L('Quy tắc cập nhật đi ngược chiều độ dốc. Gần đáy, độ dốc gần 0 nên bước tự ngắn lại.', { n: 3, hl: 2 }),
            ],
          },
          {
            view: 'Formula',
            props: {
              title: 'Bước dài bao nhiêu thì quá dài?',
              items: [
                { label: 'Độ cong', tex: String.raw`L''(\cw{w}) = \frac{2}{n}\sum \cx{x_i}^2 = ${fmt(curv, 2).replace(',', '{,}')}` },
                { label: 'Ngưỡng hội tụ', tex: String.raw`\ceta{\eta} < \frac{2}{L''} \approx ${fmt(thr, 4).replace(',', '{,}')}` },
                { label: 'Nghiệm chính xác', tex: String.raw`\cw{w^*} = \frac{\sum \cx{x_i}\cy{y_i}}{\sum \cx{x_i}^2} = \cw{${fmt(wStar, 4).replace(',', '{,}')}}` },
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Khi nào bước quá dài? Độ cong của cái bát, tức đạo hàm bậc hai L″, bằng ${fmt(curv, 2)}.`, { n: 1, hl: 0 }, { say: `Khi nào bước quá dài? Độ cong của cái bát, tức đạo hàm bậc hai của L, bằng ${speakNum(fmt(curv, 2))}.` }),
              L(`Gradient Descent chỉ hội tụ khi η < 2/L″ ≈ ${fmt(thr, 4)}. Vì thế 0,065 còn hội tụ, còn 0,07 thì phân kỳ.`, { n: 2, hl: 1 }, {
                say: `Thuật toán chỉ hội tụ khi ê-ta nhỏ hơn hai chia cho độ cong, xấp xỉ ${speakNum(fmt(thr, 4))}. Vì thế không phẩy không sáu lăm còn hội tụ, còn không phẩy không bảy thì phân kỳ.`,
              }),
              L(`Bài toán một tham số này có nghiệm chính xác: cho đạo hàm bằng 0, ta được w* = Σxy / Σx² = ${fmt(wStar, 4)}.`, { n: 3, hl: 2 }, {
                say: `Bài toán một tham số này có nghiệm chính xác: cho đạo hàm bằng không, ta được w sao bằng tổng x nhân y chia cho tổng x bình phương, bằng ${speakNum(fmt(wStar, 4))}.`,
              }),
              L(`Gradient Descent sau 25 vòng đạt ${fmt(wAt(t, 25), 4)}. Hai cách cho cùng một đáp số.`, undefined, { say: `Gradient Descent sau hai mươi lăm vòng đạt ${speakNum(fmt(wAt(t, 25), 4))}. Hai cách cho cùng một đáp số.` }),
              L('Ở các mô hình lớn không có công thức giải trực tiếp, Gradient Descent là con đường duy nhất.', { hl: -1 }, { say: 'Ở các mô hình lớn không có công thức giải trực tiếp, Gradient Descent là con đường duy nhất.' }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'gradient_descent.py', code },
            init: { a: 0, b: 0 },
            lines: [
              L('Toàn bộ thuật toán chỉ khoảng mười dòng NumPy.', undefined, { say: 'Toàn bộ thuật toán chỉ khoảng mười dòng NumPy.' }),
              L('Đầu tiên là dữ liệu: 5 thu nhập và 5 giá nhà.', { a: 4, b: 5 }),
              L('Điểm xuất phát w = 0, tốc độ học eta = 0,01.', { a: 7, b: 8 }, { say: 'Điểm xuất phát w bằng không, tốc độ học ê-ta bằng không phẩy không một.' }),
              L('Vòng lặp chạy 25 lần.', { a: 11, b: 11 }),
              L('Bên trong là đúng bốn việc: dự đoán, sai số, mất mát và độ dốc.', { a: 12, b: 15 }),
              L('Và dòng quan trọng nhất: w = w − eta · dw. Đó là bước xuống dốc.', { a: 16, b: 16 }, { say: 'Và dòng quan trọng nhất: w bằng w trừ ê-ta nhân đê w. Đó là bước xuống dốc.' }),
              L('Cuối cùng in nghiệm chính xác để đối chiếu.', { a: 20, b: 20 }),
              L('Ở bước 6, bạn có thể chạy đoạn mã này ngay trên trình duyệt, sửa eta hay điểm xuất phát rồi chạy lại.', { a: 0, b: 0 }, { say: 'Ở bước sáu, bạn có thể chạy đoạn mã này ngay trên trình duyệt, sửa ê-ta hay điểm xuất phát rồi chạy lại.' }),
            ],
          },
        ],
      },
      {
        id: 'toan-bo', title: 'Toàn bộ dữ liệu', section: 'danh-gia',
        scenes: [
          {
            view: 'gd/Bowl',
            props: { xs: SX, ys: SY, xmax: Math.ceil(Math.max(...SX)), ymax: 5.5, wmin: -0.1, wmax: 0.8, dot: 2.6 },
            init: { line: 1, res: 0, sq: 0, bowl: 1, gd: 1, k: 0, eta: '0.01', star: 0, tan: 0 },
            lines: [
              L('Cùng thuật toán đó, chạy trên 400 khu vực ngẫu nhiên thay vì 5.'),
              L(`Sau 100 vòng, w ≈ ${fmt(wAll, 3)}: mỗi 10.000 USD thu nhập ứng với khoảng ${money(Math.round(wAll * 100) * 1000)} USD giá nhà.`, { k: 100 }, { anim: 'line', ease: 'lin' }),
              L('Gradient Descent không quan tâm có 5 hay 5 triệu dòng. Chỉ có tổng Σ dài hơn.', undefined, { say: 'Gradient Descent không quan tâm có năm hay năm triệu dòng. Chỉ có phép tính tổng dài hơn.' }),
            ],
          },
          {
            view: 'Bullets',
            props: {
              title: 'Ba bẫy cần nhớ',
              items: [
                '<b>Tốc độ học quá lớn</b> → dao động hoặc phân kỳ. Dấu hiệu: mất mát tăng hoặc nhảy lên xuống.',
                '<b>Tốc độ học quá nhỏ</b> → hội tụ rất chậm, tốn thời gian tính toán.',
                '<b>Mô hình quá đơn giản</b> → tối ưu hoàn hảo vẫn sai nhiều với căn 4.',
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ba bẫy cần nhớ.'),
              L('Một: tốc độ học quá lớn thì dao động hoặc phân kỳ. Dấu hiệu là mất mát tăng, hoặc nhảy lên xuống.', { n: 1, hl: 0 }),
              L('Hai: tốc độ học quá nhỏ thì hội tụ rất chậm.', { n: 2, hl: 1 }),
              L('Ba: mô hình quá đơn giản. Dù tối ưu hoàn hảo, đường thẳng qua gốc toạ độ vẫn sai nhiều với căn 4. Thêm hệ số chặn và thêm đặc trưng là chủ đề của các bài sau.', { n: 3, hl: 2 }),
            ],
          },
        ],
      },
      {
        id: 'tong-ket', title: 'Tổng kết', section: 'tong-ket',
        scenes: [
          {
            view: 'Bullets',
            props: {
              title: 'Nhớ gì sau bài này',
              items: [
                '"Học" = tìm tham số làm <b>mất mát nhỏ nhất</b>, ở đây là MSE.',
                'Mỗi vòng: <b>dự đoán → sai số → độ dốc → bước ngược chiều độ dốc</b>.',
                'Độ dài bước = η × |độ dốc|: <b>tự ngắn lại</b> khi gần đáy.',
                'η quá nhỏ: chậm. η vượt 2/L″: <b>phân kỳ</b>.',
                `Có nghiệm chính xác (w* = ${fmt(wStar, 4)}) thì dùng nó để <b>kiểm tra</b>.`,
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Học nghĩa là tìm tham số làm mất mát nhỏ nhất. Với bài toán dự đoán một con số, mất mát thường là MSE.', { n: 1, hl: 0 }, { say: 'Học nghĩa là tìm tham số làm mất mát nhỏ nhất. Với bài toán dự đoán một con số, mất mát thường là sai số bình phương trung bình.' }),
              L('Gradient Descent lặp bốn việc: dự đoán, sai số, độ dốc, rồi bước ngược chiều độ dốc.', { n: 2, hl: 1 }, { say: 'Gradient Descent lặp bốn việc: dự đoán, sai số, độ dốc, rồi bước ngược chiều độ dốc.' }),
              L('Bước tự ngắn lại khi gần đáy.', { n: 3, hl: 2 }),
              L('Tốc độ học quá nhỏ thì chậm, quá lớn thì phân kỳ. Mất mát tăng là dấu hiệu cần giảm η.', { n: 4, hl: 3 }, { say: 'Tốc độ học quá nhỏ thì chậm, quá lớn thì phân kỳ. Mất mát tăng là dấu hiệu cần giảm ê-ta.' }),
              L('Khi có nghiệm chính xác, hãy dùng nó để kiểm tra kết quả.', { n: 5, hl: 4 }),
              L('Chương 1 sẽ thêm hệ số chặn b, dùng 400 khu vực, và đo xem mô hình dự đoán tốt đến đâu trên dữ liệu chưa từng thấy.', { hl: -1 }, { say: 'Chương một sẽ thêm hệ số chặn b, dùng bốn trăm khu vực, và đo xem mô hình dự đoán tốt đến đâu trên dữ liệu chưa từng thấy.' }),
              L('Giờ hãy cuộn xuống, làm các phòng thí nghiệm và trả lời câu hỏi trong bài. Hẹn gặp lại ở chương 1.', undefined, { say: 'Giờ hãy cuộn xuống, làm các phòng thí nghiệm và trả lời câu hỏi trong bài. Hẹn gặp lại ở chương một.' }),
            ],
          },
        ],
      },
    ],
  };
}
