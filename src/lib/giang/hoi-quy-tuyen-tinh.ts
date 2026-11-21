/**
 * Bài giảng chương 1: Hồi quy tuyến tính trên 400 khu vực (housing.sample) và 5 khu vực của chương 0.
 * Mọi con số trong lời giảng do ml-core tính (ols, mse, r2, linearRegressionGD), cùng cách với trang và các lab.
 */
import housing from '../../data/housing.json';
import { linearRegressionGD, ols, mse, r2, fmt } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const money = (v: number) => Math.round(v).toLocaleString('vi-VN');
/** Số vòng để (w, b) tới cách đáy dưới 0,01 — cùng cách đếm với lab bản đồ mất mát */
function reach(xs: number[], ys: number[], lr: number, epochs = 300) {
  const best = ols(xs, ys);
  const t = linearRegressionGD(xs, ys, { lr, epochs, detail: false });
  const pts = [[0, 0], ...t.steps.map((s) => [s.state.wNext, s.state.bNext])];
  return pts.findIndex(([w, b]) => Math.hypot(w - best.w, b - best.b) < 0.01);
}

export const linregPyCode = `import numpy as np, json
from pyodide.http import open_url

# Tải 400 khu vực từ chính trang web này
data = json.loads(open_url(".../housing.json").read())
x = np.array([r["income"] for r in data["sample"]])
y = np.array([r["value"] for r in data["sample"]])

# Chuẩn hoá x để Gradient Descent hội tụ nhanh
mu, sd = x.mean(), x.std()
xs = (x - mu) / sd

w, b, eta, n = 0.0, 0.0, 0.2, len(x)
for k in range(50):
    e = (w * xs + b) - y
    dw = 2 / n * np.sum(e * xs)
    db = 2 / n * np.sum(e)
    w, b = w - eta * dw, b - eta * db

# Đổi ngược về đơn vị gốc: y = w*(x-mu)/sd + b
w_goc = w / sd
b_goc = b - w * mu / sd
print(f"Gradient Descent: w = {w_goc:.4f}, b = {b_goc:.4f}")`;

export function linregLecture(): Lecture {
  const sample = housing.sample;
  const SX = sample.map((r) => r.income);
  const SY = sample.map((r) => r.value);
  const best = ols(SX, SY);
  const Lbest = mse(SX, SY, best.w, best.b);
  const L0 = mse(SX, SY, 0.2, 0.5);
  const mx = SX.reduce((a, v) => a + v, 0) / SX.length;
  const nCap = SY.filter((v) => v >= 5).length;

  // 5 khu vực của chương 0, giờ có thêm b
  const xs = housing.mini.map((h) => h.income);
  const ys = housing.mini.map((h) => h.value);
  const t02 = linearRegressionGD(xs, ys, { lr: 0.02, epochs: 60 });
  const t06 = linearRegressionGD(xs, ys, { lr: 0.06, epochs: 60 });
  const s0 = t02.steps[0].state;
  const s60 = t02.steps[59].state;
  const s60b = t06.steps[59].state;
  const miniBest = ols(xs, ys);
  const miniLbest = mse(xs, ys, miniBest.w, miniBest.b);
  const sumE = s0.errors.reduce((a, e) => a + e, 0);
  const sumEx = s0.errors.reduce((a, e, i) => a + e * xs[i], 0);

  // Chuẩn hoá
  const mu = mx;
  const sd = Math.sqrt(SX.reduce((a, v) => a + (v - mu) ** 2, 0) / SX.length);
  const ZX = SX.map((v) => (v - mu) / sd);
  const nRaw = reach(SX, SY, 0.04);
  const nZ2 = reach(ZX, SY, 0.2);
  const nZ5 = reach(ZX, SY, 0.5);

  // Đánh giá: 320 train, 80 test
  const testSet = new Set(housing.testIds);
  const testIdx = sample.map((r, i) => (testSet.has(r.id) ? i : -1)).filter((i) => i >= 0);
  const tr = sample.filter((r) => !testSet.has(r.id));
  const te = sample.filter((r) => testSet.has(r.id));
  const model = ols(tr.map((r) => r.income), tr.map((r) => r.value));
  const pred = (rows: typeof sample, f: (x: number) => number) => rows.map((r) => f(r.income));
  const lin = (x: number) => model.w * x + model.b;
  const meanTr = tr.reduce((a, r) => a + r.value, 0) / tr.length;
  const r2Tr = r2(tr.map((r) => r.value), pred(tr, lin));
  const r2Te = r2(te.map((r) => r.value), pred(te, lin));
  const r2Base = r2(te.map((r) => r.value), pred(te, () => meanTr));
  const rmse = (rows: typeof sample, f: (x: number) => number) => Math.sqrt(rows.reduce((a, r) => a + (f(r.income) - r.value) ** 2, 0) / rows.length);
  const rmseTe = rmse(te, lin);
  const rmseBase = rmse(te, () => meanTr);
  const usd = (v: number) => `${money(v * 100000)} USD`;
  const usdK = (v: number) => `${money(Math.round(v * 100) * 1000)} USD`; // làm tròn tới nghìn

  const oceanVi: Record<string, string> = { INLAND: 'Nội địa', 'NEAR OCEAN': 'Gần biển', '<1H OCEAN': 'Cách biển < 1 giờ', 'NEAR BAY': 'Gần vịnh', ISLAND: 'Đảo' };
  const cloud = { xs: SX, ys: SY, xmax: Math.ceil(Math.max(...SX)), ymax: 5.4, dot: 3.2 };
  const miniCt = { xs, ys, dw: [-0.15, 0.6], db: [-0.3, 1.5], epochs: 60 };
  const texN = (v: number, d: number) => fmt(v, d).replace(',', '{,}');

  return {
    slug: 'hoi-quy-tuyen-tinh',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 1', title: 'Hồi quy tuyến tính', sub: 'hai núm vặn w và b · 400 khu vực California' },
            lines: [
              L('Chào mừng bạn đến với chương 1: hồi quy tuyến tính.', undefined, { say: 'Chào mừng bạn đến với chương một: hồi quy tuyến tính.' }),
              L('Ở chương trước, mô hình chỉ có một núm vặn w, và đường thẳng buộc phải đi qua gốc toạ độ.'),
              L('Bài này thêm núm thứ hai, hệ số chặn b, và dùng 400 khu vực thật thay vì 5.'),
              L('Ta sẽ tìm đường thẳng tốt nhất bằng hai cách, rồi đo xem nó dự đoán tốt đến đâu trên dữ liệu chưa từng thấy.'),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Vài khu vực trong mẫu 400 khu vực',
              cols: ['#', 'Vị trí', 'Thu nhập x', 'Giá nhà y'],
              cls: ['', 't', 'v-x', 'v-y'],
              rows: sample.slice(0, 6).map((r) => [String(r.id), oceanVi[r.ocean] ?? r.ocean, fmt(r.income, 4), fmt(r.value, 3)]),
            },
            init: { n: 0, hl: -1, hc: -1 },
            lines: [
              L(`Đây là vài khu vực trong mẫu 400 khu vực, chọn ngẫu nhiên từ ${housing.nTotal.toLocaleString('vi-VN')} khu vực của cuộc điều tra dân số California năm 1990.`, { n: 6 }, { anim: 3, ease: 'lin' }),
              L('Đầu vào x vẫn là thu nhập trung bình, đầu ra y vẫn là giá nhà.', { hc: 2 }),
              L('Đầu ra là một con số liên tục, không phải một nhãn. Bài toán như vậy gọi là hồi quy.', { hc: 3 }),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Mô hình: đường thẳng hai tham số', items: [{ tex: String.raw`\cyh{\hat y} = \cw{w}\,\cx{x} + \cb{b}` }] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Mô hình: ŷ = w·x + b.', { n: 1 }, { say: 'Mô hình: y mũ bằng w nhân x, cộng b.' }),
              L('w cho biết giá tăng bao nhiêu khi thu nhập tăng một đơn vị.', { hl: 0 }),
              L('b là giá dự đoán khi thu nhập bằng 0. Nhờ b, đường thẳng không còn bắt buộc đi qua gốc toạ độ.'),
            ],
          },
        ],
      },
      {
        id: 'kham-pha', title: 'Nhìn dữ liệu', section: 'kham-pha',
        scenes: [
          {
            view: 'lr/Fit', props: cloud,
            init: { w: best.w, b: best.b, line: 0, res: 0, cap: 0, mean: 0 },
            lines: [
              L('Trước khi huấn luyện bất cứ thứ gì, hãy nhìn dữ liệu. Mỗi chấm là một khu vực.'),
              L(`Có xu hướng rõ: thu nhập cao thì giá nhà cao. Hệ số tương quan là ${fmt(housing.stats.corr, 2)}.`),
              L('Nhưng đám mây điểm rất dày theo chiều dọc: cùng một mức thu nhập, giá nhà chênh nhau rất nhiều. Một đường thẳng chỉ bắt được xu hướng chung.'),
              L(`Để ý hàng điểm nằm ngang ở trên cùng. Đó là ${nCap} khu vực có giá ghi đúng 500.001 USD.`, { cap: 1 }),
              L('Dữ liệu bị chặn trần: giá thật có thể cao hơn nhiều. Mô hình sẽ học sai ở vùng giá cao, và ta sẽ thấy dấu vết của nó ở cuối bài.'),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: hai núm vặn', section: 'truc-giac',
        scenes: [
          {
            view: 'lr/Fit', props: cloud,
            init: { w: 0.2, b: 0.5, line: 1, res: 0, cap: 0, mean: 0 },
            lines: [
              L(`Thử đặt w = 0,2 và b = 0,5. Mất mát MSE bằng ${fmt(L0, 3)}.`, { res: 1 }),
              L('Đường thẳng quá thấp ở bên phải. Ta tăng độ dốc w.', { w: 0.6 }, { anim: 'line' }),
              L('Giờ bên phải đã khá hơn, nhưng cả đường thẳng bị nâng lên quá cao. Phải hạ b xuống.', { b: -0.4 }, { anim: 'line' }),
              L('Hai núm không độc lập: tăng độ dốc thì thường phải hạ hệ số chặn, để đường thẳng vẫn đi qua giữa đám mây.'),
              L('Có một điểm mà đường thẳng tốt nhất luôn đi qua: điểm trung bình, x̄ và ȳ.', { mean: 1 }, { say: 'Có một điểm mà đường thẳng tốt nhất luôn đi qua: điểm trung bình của x và của y.' }),
              L(`Đường tốt nhất: w = ${fmt(best.w, 3)}, b = ${fmt(best.b, 3)}, và MSE giảm xuống ${fmt(Lbest, 3)}, chỉ còn khoảng một nửa.`, { w: best.w, b: best.b }, { anim: 2.5 }),
              L('Ở bước 3 của bài, bạn có thể tự kéo hai thanh trượt và cố đưa MSE xuống dưới 0,80.', { res: 0 }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: hai đạo hàm', section: 'tinh-tay',
        scenes: [
          {
            view: 'Formula',
            props: {
              title: 'Hai tham số, hai đạo hàm',
              items: [
                { label: 'Theo w', tex: String.raw`\cg{\frac{\partial L}{\partial w}} = \frac{2}{n}\sum_i \ce{e_i}\,\cx{x_i}` },
                { label: 'Theo b', tex: String.raw`\cg{\frac{\partial L}{\partial b}} = \frac{2}{n}\sum_i \ce{e_i}` },
                { label: 'Cập nhật', tex: String.raw`\cw{w} \leftarrow \cw{w} - \ceta{\eta}\,\cg{\tfrac{\partial L}{\partial w}} \qquad \cb{b} \leftarrow \cb{b} - \ceta{\eta}\,\cg{\tfrac{\partial L}{\partial b}}` },
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Thuật toán giống hệt chương 0, chỉ thêm một đạo hàm.'),
              L('Đạo hàm theo w vẫn là hai phần n nhân tổng eᵢ·xᵢ.', { n: 1, hl: 0 }, { say: 'Đạo hàm theo w vẫn là hai phần n nhân tổng các tích e i nhân x i.' }),
              L('Đạo hàm theo b là hai phần n nhân tổng các sai số, vì đạo hàm của w·xᵢ + b − yᵢ theo b bằng 1.', { n: 2, hl: 1 }, { say: 'Đạo hàm theo b là hai phần n nhân tổng các sai số, vì đạo hàm của sai số theo b bằng một.' }),
              L('Mỗi vòng, cả hai tham số cùng bước ngược chiều độ dốc của chính nó.', { n: 3, hl: 2 }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Vòng 1 trên 5 khu vực, w = b = 0',
              cols: ['Căn', 'x', 'y', 'e = ŷ − y', 'e·x'],
              cls: ['', 'v-x', 'v-y', 'v-e', 'v-g'],
              rows: xs.map((x, i) => [String(i + 1), fmt(x, 4), fmt(ys[i], 3), fmt(s0.errors[i], 3), fmt(s0.errors[i] * x, 3)]),
              foot: `Σe = ${fmt(sumE, 3)} → ∂L/∂b = ${fmt(s0.db, 3)}    Σe·x = ${fmt(sumEx, 3)} → ∂L/∂w = ${fmt(s0.dw, 3)}`,
            },
            init: { n: 5, c: 3, foot: 0 },
            lines: [
              L('Quay lại 5 khu vực của chương 0, xuất phát từ w = 0 và b = 0. Mọi dự đoán bằng 0, nên sai số là âm giá nhà.', { c: 4 }),
              L('Cột cuối vẫn là sai số nhân thu nhập.', { c: 5 }),
              L(`Hai phần năm nhân tổng sai số cho ∂L/∂b = ${fmt(s0.db, 2)}. Hai phần năm nhân tổng cột cuối cho ∂L/∂w = ${fmt(s0.dw, 2)}.`, { foot: 1 }, {
                say: `Hai phần năm nhân tổng sai số cho đạo hàm theo b bằng ${speakNum(fmt(s0.db, 2))}. Hai phần năm nhân tổng cột cuối cho đạo hàm theo w bằng ${speakNum(fmt(s0.dw, 2))}.`,
              }),
              L('Cả hai đều âm, nên cả w và b cùng tăng.'),
            ],
          },
          {
            view: 'lr/Contour', props: { ...miniCt, note: '5 khu vực' },
            init: { eta: '0.02', k: 0, kmax: 60 },
            lines: [
              L('Nhìn từ trên cao: mỗi đường cong nối các cặp w, b có cùng mất mát, như đường đồng mức trên bản đồ địa hình. Ngôi sao là đáy.'),
              L(`Chạy 60 vòng với η = 0,02.`, { k: 60 }, { anim: 'line', ease: 'lin', say: 'Chạy sáu mươi vòng với ê-ta bằng không phẩy không hai.' }),
              L(`Mất mát giảm rất nhanh trong vài vòng đầu, từ ${fmt(s0.loss, 2)} xuống ${fmt(s60.loss, 3)}, rồi gần như nằm ngang.`),
              L(`Nhưng w = ${fmt(s60.wNext, 3)} và b = ${fmt(s60.bNext, 3)} vẫn còn rất xa đáy: ${fmt(miniBest.w, 3)} và ${fmt(miniBest.b, 3)}.`),
              L('Vì đáy nằm trong một thung lũng dài và gần phẳng. Trong thung lũng, độ dốc rất nhỏ nên bước rất ngắn.'),
              L(`Tăng η lên 0,06: sau 60 vòng, w = ${fmt(s60b.wNext, 3)}, b = ${fmt(s60b.bNext, 3)}. Gần hơn, nhưng vẫn chưa tới.`, { eta: '0.06', k: 0 }, { anim: 0.01, say: `Tăng ê-ta lên không phẩy không sáu: sau sáu mươi vòng, w bằng ${speakNum(fmt(s60b.wNext, 3))}, b bằng ${speakNum(fmt(s60b.bNext, 3))}. Gần hơn, nhưng vẫn chưa tới.` }),
              L('Xem quỹ đạo đi xuống rồi bò dọc thung lũng.', { k: 60 }, { anim: 'line', ease: 'lin' }),
              L('Phần lý thuyết sẽ chỉ ra cách làm cái thung lũng này biến mất.'),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết: nghiệm đóng và chuẩn hoá', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: {
              title: 'Nghiệm đóng: giải thẳng, không cần lặp',
              items: [
                { label: 'Đạo hàm theo b = 0', tex: String.raw`\sum \ce{e_i} = 0 \;\Rightarrow\; \cb{b} = \bar{\cy{y}} - \cw{w}\,\bar{\cx{x}}` },
                { label: 'Đạo hàm theo w = 0', tex: String.raw`\cw{w^*} = \frac{\sum (\cx{x_i}-\bar{\cx{x}})(\cy{y_i}-\bar{\cy{y}})}{\sum (\cx{x_i}-\bar{\cx{x}})^2}` },
                { label: '400 khu vực', tex: String.raw`\cw{w^*} = \cw{${texN(best.w, 4)}} \qquad \cb{b^*} = \cb{${texN(best.b, 4)}}` },
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bài toán này có thể giải thẳng. Tại đáy, cả hai đạo hàm bằng 0.'),
              L('Từ đạo hàm theo b bằng 0, tổng sai số bằng 0, suy ra b = ȳ − w·x̄. Đó là lý do đường tốt nhất đi qua điểm trung bình.', { n: 1, hl: 0 }, { say: 'Từ đạo hàm theo b bằng không, tổng sai số bằng không, suy ra b bằng trung bình y trừ w nhân trung bình x. Đó là lý do đường tốt nhất đi qua điểm trung bình.' }),
              L('Thay vào đạo hàm theo w bằng 0 rồi rút gọn, ta được công thức bình phương tối thiểu, OLS.', { n: 2, hl: 1 }, { say: 'Thay vào phương trình đạo hàm theo w bằng không rồi rút gọn, ta được công thức bình phương tối thiểu.' }),
              L(`Với 400 khu vực: w = ${fmt(best.w, 4)}, b = ${fmt(best.b, 4)}. Mỗi 10.000 USD thu nhập tăng thêm, giá nhà dự đoán tăng khoảng ${usdK(best.w)}.`, { n: 3, hl: 2 }),
              L('Vậy vì sao vẫn học Gradient Descent? Vì công thức đóng chỉ có ở vài mô hình đơn giản. Hồi quy logistic và mạng nơ-ron không có công thức nào cả.', { hl: -1 }),
            ],
          },
          {
            view: 'lr/Contour', props: { xs: SX, ys: SY, dw: [-0.15, 0.9], db: [-0.6, 1.6], note: 'thu nhập gốc' },
            init: { eta: '0.04', k: 0, kmax: 300 },
            lines: [
              L('Quay lại cái thung lũng. Đây là bản đồ mất mát của 400 khu vực, thu nhập để nguyên.'),
              L('Các đường đồng mức là những hình elip rất dẹt, nằm chéo.'),
              L(`Với η = 0,04, tốc độ tốt nhất ở đây, quả bóng cần ${nRaw} bước mới tới sát đáy.`, { k: nRaw + 5 }, { anim: 'line', ease: 'lin', say: `Với ê-ta bằng không phẩy không bốn, tốc độ tốt nhất ở đây, quả bóng cần ${speakNum(String(nRaw))} bước mới tới sát đáy.` }),
              L('Thu nhập có giá trị khoảng 4, nên mất mát nhạy với w hơn b rất nhiều. η phải đủ nhỏ cho hướng dốc nhất, và hướng thoải thì bị bò rất chậm.', undefined, { say: 'Thu nhập có giá trị khoảng bốn, nên mất mát nhạy với w hơn b rất nhiều. Ê-ta phải đủ nhỏ cho hướng dốc nhất, và hướng thoải thì bị bò rất chậm.' }),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Chuẩn hoá', items: [{ tex: String.raw`\cx{x'} = \frac{\cx{x} - \mu}{\sigma} = \frac{\cx{x} - ${texN(mu, 2)}}{${texN(sd, 2)}}` }] },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Cách chữa: chuẩn hoá. Trừ trung bình ${fmt(mu, 2)}, rồi chia cho độ lệch chuẩn ${fmt(sd, 2)}.`, { n: 1 }),
              L('Sau chuẩn hoá, thu nhập có trung bình 0 và độ lệch chuẩn 1, cùng cỡ với hệ số chặn.', { hl: 0 }),
            ],
          },
          {
            view: 'lr/Contour', props: { xs: ZX, ys: SY, dw: [-0.4, 1.6], db: [-0.4, 2.8], xlab: "w (x đã chuẩn hoá)", note: 'thu nhập đã chuẩn hoá' },
            init: { eta: '0.2', k: 0, kmax: 30 },
            lines: [
              L('Cùng dữ liệu, cùng thuật toán. Các đường đồng mức giờ gần như những vòng tròn.'),
              L(`Với η = 0,2, chỉ ${nZ2} bước là tới sát đáy.`, { k: nZ2 + 2 }, { anim: 'line', ease: 'lin', say: `Với ê-ta bằng không phẩy hai, chỉ ${speakNum(String(nZ2))} bước là tới sát đáy.` }),
              L(`Với η = 0,5: đúng ${nZ5} bước. Độ dốc chỉ thẳng vào đáy.`, { eta: '0.5', k: 0 }, { anim: 0.01, say: `Với ê-ta bằng không phẩy năm: đúng ${speakNum(String(nZ5))} bước. Độ dốc chỉ thẳng vào đáy.` }),
              L(`Từ ${nRaw} bước xuống ${nZ5} bước, chỉ nhờ đổi thang đo của dữ liệu.`, { k: 6 }, { anim: 'line', ease: 'lin' }),
              L('Ở bước 5 của bài, bạn có thể bật tắt chuẩn hoá và tự thử các tốc độ học.'),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'hoi_quy_tu_viet.py', code: linregPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Phiên bản tự viết bằng NumPy.'),
              L('Tải 400 khu vực từ chính trang web.', { a: 4, b: 7 }),
              L('Chuẩn hoá thu nhập: trừ trung bình, chia độ lệch chuẩn.', { a: 9, b: 11 }),
              L('Vòng lặp: tính sai số, hai đạo hàm, rồi cập nhật cùng lúc w và b.', { a: 14, b: 18 }),
              L('Mô hình học trên thang đã chuẩn hoá, nên cuối cùng phải đổi ngược về đơn vị gốc.', { a: 20, b: 23 }),
              L('Trong thực tế, ta dùng scikit-learn: ba dòng là đủ, và kết quả trùng với nghiệm đóng. Cả hai ô mã đều chạy được ở bước 6.', { a: 0, b: 0 }, { say: 'Trong thực tế, ta dùng scikit-learn: ba dòng là đủ, và kết quả trùng với nghiệm đóng. Cả hai ô mã đều chạy được ở bước sáu.' }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Đánh giá trên dữ liệu mới', section: 'danh-gia',
        scenes: [
          {
            view: 'lr/Fit', props: { ...cloud, test: testIdx },
            init: { w: model.w, b: model.b, line: 0, split: 0 },
            lines: [
              L('Mô hình chỉ có giá trị nếu dự đoán tốt trên dữ liệu mới.'),
              L(`Ta tách 400 khu vực thành ${tr.length} khu vực để huấn luyện và ${te.length} khu vực để kiểm tra. Mô hình không được nhìn tập kiểm tra khi học.`, { split: 1 }, { say: `Ta tách bốn trăm khu vực thành ${speakNum(String(tr.length))} khu vực để huấn luyện, gọi là tập train, và ${speakNum(String(te.length))} khu vực để kiểm tra, gọi là tập test. Mô hình không được nhìn tập test khi học.` }),
              L(`Học trên tập train: ŷ = ${fmt(model.w, 3)}·x + ${fmt(model.b, 3)}.`, { line: 1 }, { say: `Học trên tập train, ta được w bằng ${speakNum(fmt(model.w, 3))} và b bằng ${speakNum(fmt(model.b, 3))}.` }),
              L('Giờ mới chấm điểm trên tập test.', { only: 'test' }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Kết quả trên dữ liệu chưa từng thấy',
              cols: ['Mô hình', 'Tập', 'RMSE', 'R²'],
              cls: ['t', 't', '', ''],
              rows: [
                ['Hồi quy tuyến tính', 'Train', usd(rmse(tr, lin)), fmt(r2Tr, 3)],
                ['Hồi quy tuyến tính', 'Test', usd(rmseTe), fmt(r2Te, 3)],
                ['Luôn đoán trung bình', 'Test', usd(rmseBase), fmt(r2Base, 3)],
              ],
            },
            init: { n: 0, hl: -1, hc: -1 },
            lines: [
              L('RMSE là căn bậc hai của MSE, cùng đơn vị với giá nhà: mô hình thường sai khoảng chừng này.', { n: 1, hc: 2 }),
              L('R² là tỷ lệ biến động của giá nhà mà mô hình giải thích được. 0 là không hơn gì đoán trung bình, 1 là hoàn hảo.', { hc: 3 }, { say: 'R bình phương là tỷ lệ biến động của giá nhà mà mô hình giải thích được. Không là không hơn gì đoán trung bình, một là hoàn hảo.' }),
              L(`Trên tập train, R² = ${fmt(r2Tr, 3)}. Trên tập test, R² = ${fmt(r2Te, 3)}: thấp hơn một chút, như thường lệ.`, { n: 2, hl: 1, hc: -1 }, { say: `Trên tập train, R bình phương bằng ${speakNum(fmt(r2Tr, 3))}. Trên tập test, bằng ${speakNum(fmt(r2Te, 3))}: thấp hơn một chút, như thường lệ.` }),
              L(`Thu nhập chỉ giải thích được khoảng một nửa biến động giá nhà. Mô hình thường sai khoảng ${usdK(rmseTe)}.`),
              L(`Luôn có một mốc ngây thơ để so: luôn đoán giá trung bình. R² của nó gần 0, và RMSE khoảng ${usdK(rmseBase)}.`, { n: 3, hl: 2 }),
              L('Mô hình nào không thắng được mốc này là vô dụng. Hồi quy của ta thắng rõ ràng.'),
            ],
          },
          {
            view: 'Bullets',
            props: {
              title: 'Bẫy thường gặp',
              items: [
                '<b>Đánh giá trên tập train</b> → con số đẹp hơn thực tế.',
                '<b>Quên chuẩn hoá</b> khi dùng Gradient Descent → hội tụ rất chậm.',
                '<b>Dữ liệu bị chặn trần</b> → mô hình không biết giá thật cao hơn 500.001 USD.',
                '<b>Ngoại suy</b> ra vùng thu nhập gần như không có dữ liệu → không đáng tin.',
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bốn bẫy thường gặp.'),
              L('Một: đánh giá trên tập train. Con số sẽ đẹp hơn thực tế. Luôn báo cáo trên tập test.', { n: 1, hl: 0 }),
              L('Hai: quên chuẩn hoá khi dùng Gradient Descent.', { n: 2, hl: 1 }),
              L('Ba: dữ liệu bị chặn trần. Mô hình tuyến tính không thể biết giá thật cao hơn mức trần.', { n: 3, hl: 2 }),
              L('Bốn: ngoại suy. Dự đoán ở vùng thu nhập rất cao, nơi gần như không có dữ liệu, là không đáng tin.', { n: 4, hl: 3 }),
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
                'ŷ = w·x + b: <b>b</b> cho phép đường thẳng không đi qua gốc toạ độ.',
                'Hai đạo hàm: <b>(2/n)·Σeᵢxᵢ</b> và <b>(2/n)·Σeᵢ</b>, cập nhật cùng lúc.',
                'Đường tốt nhất đi qua <b>điểm trung bình</b>; OLS giải thẳng được.',
                '<b>Chuẩn hoá</b> làm cái bát tròn lại: từ hàng trăm bước còn vài bước.',
                'Chấm điểm trên <b>tập test</b>, so với mốc <b>luôn đoán trung bình</b>.',
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Hệ số chặn b cho phép đường thẳng không đi qua gốc toạ độ.', { n: 1, hl: 0 }),
              L('Mỗi tham số có một đạo hàm riêng, và cả hai cùng được cập nhật trong mỗi vòng.', { n: 2, hl: 1 }),
              L('Đường tốt nhất đi qua điểm trung bình, và với hồi quy tuyến tính ta có thể giải thẳng bằng công thức.', { n: 3, hl: 2 }),
              L('Chuẩn hoá dữ liệu làm Gradient Descent nhanh hơn hàng trăm lần.', { n: 4, hl: 3 }),
              L('Và luôn chấm điểm trên tập test, so với một mốc ngây thơ.', { n: 5, hl: 4 }),
              L('Chương 2 chuyển từ dự đoán một con số sang dự đoán một nhãn: khối u lành hay ác, với hồi quy logistic.', { hl: -1 }, { say: 'Chương hai chuyển từ dự đoán một con số sang dự đoán một nhãn: khối u lành hay ác, với hồi quy logistic.' }),
              L('Giờ hãy cuộn xuống, làm các phòng thí nghiệm và trả lời câu hỏi trong bài. Hẹn gặp lại ở chương 2.', undefined, { say: 'Giờ hãy cuộn xuống, làm các phòng thí nghiệm và trả lời câu hỏi trong bài. Hẹn gặp lại ở chương hai.' }),
            ],
          },
        ],
      },
    ],
  };
}
