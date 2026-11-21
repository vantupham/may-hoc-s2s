/**
 * Bài giảng chương 6: SVM trên Breast Cancer (2 đặc trưng đã chuẩn hoá).
 * Số liệu do ml-core tính (hardMargin2D, svmTrace, svmTrain); bản đồ nhân RBF tính sẵn bằng scikit-learn (svm-rbf.json).
 */
import cancer from '../../data/cancer.json';
import grid from '../../data/svm-rbf.json';
import { hardMargin2D, svmTrace, svmTrain, fmt } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const pc = (v: number, d = 1) => fmt(100 * v, d);
const spc = (v: number, d = 1) => `${sn(100 * v, d)} phần trăm`;

export const svmPyCode = `import numpy as np, json
from pyodide.http import open_url
from sklearn.svm import SVC

d = json.loads(open_url(".../cancer.json").read())
test = set(d["testIds"])
X = np.array([[p["x1"], p["x2"]] for p in d["patients"]])
y = np.array([1 if p["y"] else -1 for p in d["patients"]])
te = np.array([p["id"] in test for p in d["patients"]])

for C in (0.01, 1, 100):
    m = SVC(kernel="linear", C=C).fit(X[~te], y[~te])
    w = m.coef_[0]
    print(f"C={C}: lề={2/np.linalg.norm(w):.3f}, "
          f"vector hỗ trợ={m.n_support_.sum()}, test={m.score(X[te], y[te]):.3f}")

for g in (0.1, 1, 10, 50):
    m = SVC(kernel="rbf", C=1, gamma=g).fit(X[~te], y[~te])
    print(f"RBF γ={g}: train={m.score(X[~te], y[~te]):.3f}, test={m.score(X[te], y[te]):.3f}")`;

export function svmLecture(): Lecture {
  const mini = cancer.mini;
  const X = mini.map((p) => [p.x1, p.x2] as [number, number]);
  const Y = mini.map((p) => (p.y ? 1 : -1));
  const hm = hardMargin2D(X, Y);
  const u = [Math.cos((hm.ang * Math.PI) / 180), Math.sin((hm.ang * Math.PI) / 180)];
  const hardLine = [u[0] / hm.margin, u[1] / hm.margin, hm.off / hm.margin];
  const touch = X.map((x, i) => Y[i] * (hardLine[0] * x[0] + hardLine[1] * x[1] + hardLine[2])).map((m, i) => (Math.abs(m - 1) < 1e-3 ? i : -1)).filter((i) => i >= 0);
  const miniXd = [-1.6, 2.4], miniYd = [-1.4, 1.4];
  // Hai đường tách được nhưng sượt sát (để so với lề cực đại)
  const bad = [[1, 2.2, -0.35], [2.6, 0.6, -0.1]];
  const marginOf = (l: number[]) => Math.min(...X.map((x, i) => (Y[i] * (l[0] * x[0] + l[1] * x[1] + l[2])) / Math.hypot(l[0], l[1])));
  const mBad = bad.map(marginOf);
  const tr = svmTrace(X, Y, 1, 60);
  const stepFrames = [1, 2, 3, 5, 10, 20, 40, 60].map((k) => {
    const st = tr[k - 1].state;
    const viol = st.margins.filter((m) => m < 1).length;
    return { line: [st.w[0], st.w[1], st.b], margin: 1, read: `bước <b>${k}</b>   w = (<b>${fmt(st.w[0], 2)}</b>; <b>${fmt(st.w[1], 2)}</b>)   lề = <b>${fmt(2 / Math.hypot(st.w[0], st.w[1]), 3)}</b>   vi phạm: <b>${viol}</b>` };
  });
  const s1 = tr[0].state;

  // Toàn bộ dữ liệu: C khác nhau (như lab CLab)
  const testSet = new Set(cancer.testIds);
  const P = cancer.patients;
  const train = P.filter((p) => !testSet.has(p.id)), test = P.filter((p) => testSet.has(p.id));
  const Xtr = train.map((p) => [p.x1, p.x2] as [number, number]), Ytr = train.map((p) => (p.y ? 1 : -1));
  const Cs = [0.01, 1, 100].map((C) => {
    const m = svmTrain(Xtr, Ytr, C, 3000);
    const acc = test.filter((p) => ((m.w[0] * p.x1 + m.w[1] * p.x2 + m.b >= 0 ? 1 : 0) === p.y)).length / test.length;
    return { C, m, width: 2 / Math.hypot(m.w[0], m.w[1]), acc };
  });
  const fullPts = P.map((p) => [p.x1, p.x2]);
  const fullCls = P.map((p) => (p.y ? 1 : 0));
  const xd = [-2.6, 4.2], yd = [-2.6, 4.6];
  const cFrames = Cs.map((c) => ({ line: [c.m.w[0], c.m.w[1], c.m.b], margin: 1, read: `C = <b>${fmt(c.C, c.C < 1 ? 2 : 0)}</b>   lề = <b>${fmt(c.width, 3)}</b>   vector hỗ trợ: <b>${c.m.nSV}</b>   test: <b>${pc(c.acc)}%</b>` }));
  const g = grid as unknown as { n: number; x: number[]; y: number[]; models: { gamma: number; decision: number[]; trainAcc: number; testAcc: number; nSV: number }[] };
  const dx = g.x[1] - g.x[0], dy = g.y[1] - g.y[0];
  const gxd = [g.x[0] - dx / 2, g.x[g.n - 1] + dx / 2], gyd = [g.y[0] - dy / 2, g.y[g.n - 1] + dy / 2];
  const rbfFrames = g.models.map((m) => ({ grid: m.decision.map((v) => (v >= 0 ? 1 : 0)), read: `γ = <b>${fmt(m.gamma, m.gamma < 1 ? 1 : 0)}</b>   train <b>${pc(m.trainAcc)}%</b>   test <b>${pc(m.testAcc)}%</b>` }));
  const rbf = (gm: number) => g.models.find((m) => m.gamma === gm)!;
  const hinge = Array.from({ length: 81 }, (_, i) => { const m = -2 + i * 0.05; return [m, Math.max(0, 1 - m)]; });
  const logl = hinge.map(([m]) => [m, Math.log(1 + Math.exp(-m)) / Math.LN2]);

  return {
    slug: 'svm',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 6', title: 'SVM', sub: 'đường tách xa những ca khó nhất · Breast Cancer Wisconsin' },
            lines: [
              L('Chương 6: máy vector hỗ trợ, gọi tắt là SVM.', undefined, { say: 'Chương sáu: máy vector hỗ trợ, gọi tắt là SVM.' }),
              L('Cùng dữ liệu và cùng câu hỏi với chương 2: từ bán kính và độ nhám của nhân tế bào, khối u lành hay ác?', undefined, { say: 'Cùng dữ liệu và cùng câu hỏi với chương hai: từ bán kính và độ nhám của nhân tế bào, khối u lành hay ác?' }),
              L('Lần này ta hỏi thêm: trong mọi đường thẳng tách được dữ liệu, đường nào an toàn nhất khi gặp bệnh nhân mới?'),
            ],
          },
          {
            view: 'Points', props: { pts: X, cls: Y.map((v) => (v > 0 ? 1 : 0)), names: ['Lành tính', 'Ác tính'], xlab: 'x₁: bán kính', ylab: 'x₂: độ nhám', xdom: miniXd, ydom: miniYd, dot: 10,
              frames: [{ line: bad[0], read: 'tách đúng cả 6 người' }, { line: bad[1], read: 'cũng tách đúng cả 6 người' }, { line: hardLine, margin: 1, read: `lề cực đại: <b>${fmt(hm.margin, 3)}</b>` }] },
            init: { f: 0, ln: 0, mg: 0, hl: '' },
            lines: [
              L('Sáu bệnh nhân thật của chương 2: ba ca ác tính, ba ca lành tính. Một đường thẳng tách được hoàn toàn.', undefined, { say: 'Sáu bệnh nhân thật của chương hai: ba ca ác tính, ba ca lành tính. Một đường thẳng tách được hoàn toàn.' }),
              L('Đường này tách đúng cả sáu người.', { ln: 1 }),
              L('Đường này cũng vậy. Có vô số đường như thế.', { f: 1 }),
              L(`Nhưng chúng sượt sát một vài người. Người gần nhất chỉ cách đường thứ nhất ${fmt(mBad[0], 3)}, cách đường thứ hai ${fmt(mBad[1], 3)}.`, undefined, { say: `Nhưng chúng sượt sát một vài người. Người gần nhất chỉ cách đường thứ nhất ${sn(mBad[0], 3)}, cách đường thứ hai ${sn(mBad[1], 3)}.` }),
              L('Một ca ác tính tiếp theo hơi khác một chút, vì máy đo sai lệch hay vì tế bào khác đôi chút, là bị phân loại sai.'),
              L('Trực giác: đường thẳng cách đều và xa nhất khỏi cả hai nhóm có một khoảng đệm cho sai số đo đạc. Đó là đường SVM chọn.', { f: 2, mg: 1 }),
              L(`Người gần nhất cách nó ${fmt(hm.margin, 3)}: xa hơn ${fmt(hm.margin / mBad[0], 1)} lần so với đường thứ nhất, và ${fmt(hm.margin / mBad[1], 1)} lần so với đường thứ hai.`, undefined, { say: `Người gần nhất cách nó ${sn(hm.margin, 3)}: xa hơn ${sn(hm.margin / mBad[0], 1)} lần so với đường thứ nhất, và ${sn(hm.margin / mBad[1], 1)} lần so với đường thứ hai.` }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: lề và vector hỗ trợ', section: 'truc-giac',
        scenes: [
          {
            view: 'Points', props: { pts: X, cls: Y.map((v) => (v > 0 ? 1 : 0)), names: ['Lành tính', 'Ác tính'], xlab: 'x₁: bán kính', ylab: 'x₂: độ nhám', xdom: miniXd, ydom: miniYd, dot: 10,
              frames: [{ line: hardLine, margin: 1, read: `lề = <b>${fmt(hm.margin, 3)}</b>` }] },
            init: { f: 0, ln: 1, mg: 1, hl: '', dim: 0 },
            lines: [
              L(`Hai đường đứt là mép của dải lề. Khoảng cách từ ranh giới tới mỗi mép là ${fmt(hm.margin, 3)}, lớn nhất có thể với sáu người này.`, undefined, { say: `Hai đường đứt là mép của dải lề. Khoảng cách từ ranh giới tới mỗi mép là ${sn(hm.margin, 3)}, lớn nhất có thể với sáu người này.` }),
              L(`Để ý: có đúng ${touch.length} người chạm mép dải lề, từ cả hai nhóm.`, { hl: touch.join(','), dim: 0.6 }, { say: `Để ý: có đúng ${speakNum(String(touch.length))} người chạm mép dải lề, từ cả hai nhóm.` }),
              L('Dời những người ở xa đi đâu cũng được, miễn là họ không lấn vào dải: đường thẳng không hề thay đổi.'),
              L('Những người chạm mép gọi là vector hỗ trợ, support vectors. Tên của thuật toán đến từ đó: chỉ những ca khó nhất quyết định ranh giới.'),
              L('Ở bước 3, bạn có thể tự xoay đường thẳng để tìm lề lớn nhất.', { hl: '', dim: 0 }, { say: 'Ở bước ba, bạn có thể tự xoay đường thẳng để tìm lề lớn nhất.' }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: hinge loss', section: 'tinh-tay',
        scenes: [
          {
            view: 'Chart',
            props: { title: 'Hinge loss và mất mát log', series: [{ name: 'hinge: max(0, 1 − m)', pts: hinge, color: 2 }, { name: 'log (hồi quy logistic)', pts: logl, color: 5, dash: true }], xlab: 'm = y·f(x): đúng phía và cách ranh giới bao xa', ylab: 'mất mát', xdom: [-2, 2], ydom: [0, 3.2] },
            init: { n: 1, hl: -1, vx: null },
            lines: [
              L('Thay vì xoay bằng tay, ta tối ưu bằng một biến thể của Gradient Descent. Mất mát của SVM là hinge loss.'),
              L('Gọi m là nhãn nhân với điểm số: m dương là đúng phía, m càng lớn càng xa ranh giới.'),
              L('Hinge loss bằng 0 khi m ≥ 1, tức bệnh nhân đã nằm ngoài dải lề, đúng phía. Lấn vào dải thì mất mát tăng tuyến tính.', { vx: 1 }, { say: 'Hinge loss bằng không khi m lớn hơn hoặc bằng một, tức bệnh nhân đã nằm ngoài dải lề, đúng phía. Lấn vào dải thì mất mát tăng tuyến tính.' }),
              L('So với mất mát log của hồi quy logistic, đường đứt: nó không bao giờ bằng 0, mọi điểm đều góp một chút. Hinge loss thì bỏ qua hẳn những điểm đã an toàn.', { n: 2, vx: null }, { say: 'So với mất mát log của hồi quy logistic, đường đứt: nó không bao giờ bằng không, mọi điểm đều góp một chút. Hinge loss thì bỏ qua hẳn những điểm đã an toàn.' }),
              L('Hàm có một góc gập tại m = 1, nên ta dùng subgradient: ở mỗi bước, chỉ những người vi phạm mới góp vào hướng đi.', undefined, { say: 'Hàm có một góc gập tại m bằng một, nên ta dùng subgradient: ở mỗi bước, chỉ những người vi phạm mới góp vào hướng đi.' }),
            ],
          },
          {
            view: 'Points', props: { pts: X, cls: Y.map((v) => (v > 0 ? 1 : 0)), names: ['Lành tính', 'Ác tính'], xlab: 'x₁: bán kính', ylab: 'x₂: độ nhám', xdom: miniXd, ydom: miniYd, dot: 10, frames: stepFrames },
            init: { f: 0, ln: 1, mg: 1 },
            lines: [
              L(`Bước 1, xuất phát từ w = 0: mọi người đều vi phạm, vì m = 0 < 1. Cả sáu cùng kéo w về phía mình.`, undefined, { say: 'Bước một, xuất phát từ w bằng không: mọi người đều vi phạm, vì m bằng không, nhỏ hơn một. Cả sáu cùng kéo w về phía mình.' }),
              L(`Sau bước 1: w = (${fmt(s1.wNext[0], 3)}; ${fmt(s1.wNext[1], 3)}).`, { f: 1 }, { say: `Sau bước một: w một bằng ${sn(s1.wNext[0], 3)}, w hai bằng ${sn(s1.wNext[1], 3)}.` }),
              L('Chạy tiếp: số người vi phạm giảm dần, và chỉ còn họ đẩy đường thẳng.', { f: 7 }, { anim: 'line', ease: 'lin' }),
              L('Khi không ai còn lấn vào dải, chỉ còn số hạng giữ cho w nhỏ, tức là kéo lề rộng ra. Hai lực cân bằng ở lề cực đại.'),
              L('Vì có góc gập, đường thẳng dễ dao động quanh nghiệm. Bộ giải ở đây cho tốc độ học giảm dần theo số bước, rồi lấy trung bình các nghiệm ở nửa sau để lặng dao động.'),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết: lề, C và nhân', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Lề cứng và lề mềm', items: [
              { label: 'Độ rộng lề', tex: String.raw`\text{lề} = \frac{2}{\lVert \cw{w} \rVert}` },
              { label: 'Lề cứng', tex: String.raw`\min \tfrac12 \lVert \cw{w}\rVert^2 \quad \text{với } y_i(\cw{w}\cdot \cx{x_i} + \cb{b}) \ge 1` },
              { label: 'Lề mềm', tex: String.raw`\min \tfrac12 \lVert \cw{w}\rVert^2 + C\sum_i \max\big(0,\ 1 - y_i(\cw{w}\cdot\cx{x_i} + \cb{b})\big)` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ranh giới là nơi w·x + b = 0. Nếu quy ước những điểm gần nhất có điểm số đúng bằng 1, thì dải lề rộng 2 chia độ dài của w.', { n: 1, hl: 0 }, { say: 'Ranh giới là nơi w nhân x cộng b bằng không. Nếu quy ước những điểm gần nhất có điểm số đúng bằng một, thì dải lề rộng hai chia độ dài của w.' }),
              L('Muốn lề rộng nhất, ta làm w nhỏ nhất, với điều kiện mọi điểm nằm ngoài dải. Đó là SVM lề cứng.', { n: 2, hl: 1 }),
              L('Khi dữ liệu chồng lấn, điều kiện đó không thể thoả. Ta cho phép vi phạm nhưng phạt chúng bằng hinge loss, nhân hệ số C.', { n: 3, hl: 2 }),
              L('Số hạng đầu muốn lề rộng, số hạng sau muốn ít vi phạm. C cân hai mong muốn đó.'),
              L('Vì hinge loss bằng 0 với những điểm đã an toàn, chúng không góp gì vào gradient. Nghiệm cuối cùng chỉ phụ thuộc vào các vector hỗ trợ. Hồi quy logistic thì để mọi điểm cùng góp phần.', { hl: -1 }, { say: 'Vì hinge loss bằng không với những điểm đã an toàn, chúng không góp gì vào gradient. Nghiệm cuối cùng chỉ phụ thuộc vào các vector hỗ trợ. Hồi quy logistic thì để mọi điểm cùng góp phần.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Thủ thuật nhân', items: [
              'Ranh giới cong? Ánh xạ sang <b>không gian nhiều chiều</b> hơn: thêm x₁², x₂², x₁x₂…',
              'Mặt phẳng ở đó là <b>đường cong</b> ở đây.',
              'Dạng đối ngẫu chỉ cần <b>tích vô hướng</b>: thay bằng hàm nhân K(x, x′).',
              'Nhân RBF: K = exp(−γ‖x − x′‖²), mỗi điểm ảnh hưởng một vùng quanh mình.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Khi ranh giới thật sự cong, ta có thể ánh xạ dữ liệu sang không gian nhiều chiều hơn, ví dụ thêm bình phương và tích của các đặc trưng.', { n: 1, hl: 0 }),
              L('Một mặt phẳng trong không gian mới là một đường cong trong không gian cũ.', { n: 2, hl: 1 }),
              L('Điều kỳ diệu: dạng đối ngẫu của bài toán SVM chỉ cần tích vô hướng giữa các cặp điểm. Thay tích vô hướng bằng một hàm nhân, ta làm việc trong không gian mới mà không bao giờ phải tính toạ độ ở đó.', { n: 3, hl: 2 }),
              L('Nhân RBF hay dùng nhất. Hệ số γ quyết định mỗi bệnh nhân ảnh hưởng một vùng rộng hay hẹp quanh mình.', { n: 4, hl: 3 }, { say: 'Nhân RBF hay dùng nhất. Hệ số gam-ma quyết định mỗi bệnh nhân ảnh hưởng một vùng rộng hay hẹp quanh mình.' }),
              L(`Ví dụ với γ = 1: hai bệnh nhân cách nhau 1 đơn vị có độ giống nhau ${fmt(Math.exp(-1), 3)}. Cách nhau 2 đơn vị, chỉ còn ${fmt(Math.exp(-4), 3)}.`, undefined, { say: `Ví dụ với gam-ma bằng một: hai bệnh nhân cách nhau một đơn vị có độ giống nhau ${sn(Math.exp(-1), 3)}. Cách nhau hai đơn vị, chỉ còn ${sn(Math.exp(-4), 3)}.` }),
              L(`Với γ = 50, ngay cả khoảng cách 0,3 cũng cho độ giống nhau gần như bằng 0: ${fmt(Math.exp(-50 * 0.09), 3)}. Mỗi điểm chỉ còn biết những hàng xóm sát bên.`, undefined, { say: `Với gam-ma bằng năm mươi, ngay cả khoảng cách không phẩy ba cũng cho độ giống nhau gần như bằng không: ${sn(Math.exp(-50 * 0.09), 3)}. Mỗi điểm chỉ còn biết những hàng xóm sát bên.` }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'svm.py', code: svmPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('scikit-learn giải dạng đối ngẫu bằng thuật toán SMO của thư viện LIBSVM.'),
              L('Nhân tuyến tính với ba giá trị C: in độ rộng lề, số vector hỗ trợ và độ chính xác test.', { a: 11, b: 15 }),
              L('Kết quả trùng với bộ giải subgradient của trang này đến sai số nhỏ hơn 0,5% của hàm mục tiêu, đã được kiểm thử tự động.', undefined, { say: 'Kết quả trùng với bộ giải subgradient của trang này đến sai số nhỏ hơn không phẩy năm phần trăm của hàm mục tiêu, đã được kiểm thử tự động.' }),
              L('Rồi nhân RBF với bốn giá trị γ.', { a: 17, b: 19 }, { say: 'Rồi nhân RBF với bốn giá trị gam-ma.' }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Toàn bộ dữ liệu', section: 'danh-gia',
        scenes: [
          {
            view: 'Points', props: { pts: fullPts, cls: fullCls, names: ['Lành tính', 'Ác tính'], xlab: 'x₁: bán kính', ylab: 'x₂: độ nhám', xdom: xd, ydom: yd, dot: 3.5, frames: cFrames },
            init: { f: 0, ln: 1, mg: 1 },
            lines: [
              L(`Toàn bộ dữ liệu chồng lấn, nên cần lề mềm. C = 0,01: phạt vi phạm rất nhẹ. Lề rộng ${fmt(Cs[0].width, 3)}, có tới ${Cs[0].m.nSV} vector hỗ trợ.`, undefined, { say: `Toàn bộ dữ liệu chồng lấn, nên cần lề mềm. C bằng không phẩy không một: phạt vi phạm rất nhẹ. Lề rộng ${sn(Cs[0].width, 3)}, có tới ${speakNum(String(Cs[0].m.nSV))} vector hỗ trợ.` }),
              L(`Độ chính xác test ${pc(Cs[0].acc)}%.`, undefined, { say: `Độ chính xác test ${spc(Cs[0].acc)}.` }),
              L(`C = 1: lề hẹp lại còn ${fmt(Cs[1].width, 3)}, ${Cs[1].m.nSV} vector hỗ trợ, test ${pc(Cs[1].acc)}%.`, { f: 1 }, { say: `C bằng một: lề hẹp lại còn ${sn(Cs[1].width, 3)}, ${speakNum(String(Cs[1].m.nSV))} vector hỗ trợ, test ${spc(Cs[1].acc)}.` }),
              L(`C = 100: phạt rất nặng, lề chỉ còn ${fmt(Cs[2].width, 3)}, ${Cs[2].m.nSV} vector hỗ trợ, test vẫn ${pc(Cs[2].acc)}%.`, { f: 2 }, { say: `C bằng một trăm: phạt rất nặng, lề chỉ còn ${sn(Cs[2].width, 3)}, ${speakNum(String(Cs[2].m.nSV))} vector hỗ trợ, test vẫn ${spc(Cs[2].acc)}.` }),
              L('C lớn bám sát dữ liệu huấn luyện; C nhỏ chịu sai một chút để có lề rộng và ổn định hơn.'),
              L('Số vector hỗ trợ cũng là một tín hiệu: rất nhiều vector hỗ trợ nghĩa là nhiều ca nằm trong vùng khó, và dự đoán sẽ chậm hơn vì phải so với từng vector đó.'),
              L('Với hai đặc trưng này, SVM tuyến tính cho kết quả gần như hồi quy logistic ở chương 2. Khác biệt của nó nằm ở cách nghĩ: chỉ ca khó mới quan trọng.', undefined, { say: 'Với hai đặc trưng này, SVM tuyến tính cho kết quả gần như hồi quy logistic ở chương hai. Khác biệt của nó nằm ở cách nghĩ: chỉ ca khó mới quan trọng.' }),
            ],
          },
          {
            view: 'Points', props: { pts: fullPts, cls: fullCls, names: ['Lành tính', 'Ác tính'], xlab: 'x₁: bán kính', ylab: 'x₂: độ nhám', xdom: gxd, ydom: gyd, dot: 3.5, gx: g.n, gy: g.n, frames: rbfFrames },
            init: { f: 0, rg: 1 },
            lines: [
              L(`Nhân RBF, γ = 0,1: ranh giới gần như thẳng. Train ${pc(rbf(0.1).trainAcc)}%, test ${pc(rbf(0.1).testAcc)}%.`, undefined, { say: `Nhân RBF, gam-ma bằng không phẩy một: ranh giới gần như thẳng. Train ${spc(rbf(0.1).trainAcc)}, test ${spc(rbf(0.1).testAcc)}.` }),
              L('Tăng γ: ranh giới bắt đầu uốn cong.', { f: 2 }, { anim: 'line', ease: 'lin', say: 'Tăng gam-ma: ranh giới bắt đầu uốn cong.' }),
              L(`γ = 50: mỗi bệnh nhân chỉ ảnh hưởng một vùng rất nhỏ. Ranh giới bao quanh từng cụm điểm. Train lên ${pc(rbf(50).trainAcc)}%, test tụt còn ${pc(rbf(50).testAcc)}%.`, { f: 3 }, { say: `Gam-ma bằng năm mươi: mỗi bệnh nhân chỉ ảnh hưởng một vùng rất nhỏ. Ranh giới bao quanh từng cụm điểm. Train lên ${spc(rbf(50).trainAcc)}, test tụt còn ${spc(rbf(50).testAcc)}.` }),
              L('Đó là học thuộc lòng. Với dữ liệu này, ranh giới thẳng đã gần như tốt nhất.'),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Quên chuẩn hoá</b> → đặc trưng thang đo lớn áp đảo khoảng cách.',
              '<b>Chọn γ và C bằng tập test</b> → phải dùng cross-validation.',
              '<b>Hiểu f(x) như xác suất</b> → đó là khoảng cách có dấu.',
              '<b>Dữ liệu rất lớn</b> → nhân phi tuyến tốn bình phương số mẫu.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bốn bẫy thường gặp. Một: quên chuẩn hoá. SVM dựa trên khoảng cách, đặc trưng có thang đo lớn sẽ áp đảo.', { n: 1, hl: 0 }),
              L('Hai: chọn γ và C bằng tập test. Hai siêu tham số này phải chọn bằng cross-validation trên tập huấn luyện, chủ đề của chương 8.', { n: 2, hl: 1 }, { say: 'Hai: chọn gam-ma và C bằng tập test. Hai siêu tham số này phải chọn bằng cross-validation trên tập huấn luyện, chủ đề của chương tám.' }),
              L('Ba: hiểu đầu ra như xác suất. Điểm số của SVM là khoảng cách có dấu, không phải xác suất.', { n: 3, hl: 2 }),
              L('Bốn: dữ liệu rất lớn. SVM nhân phi tuyến tốn thời gian tăng khoảng bình phương theo số mẫu.', { n: 4, hl: 3 }),
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
              'SVM chọn đường có <b>lề rộng nhất</b>: lề = 2/‖w‖.',
              'Chỉ <b>vector hỗ trợ</b> quyết định ranh giới.',
              '<b>Hinge loss</b> bỏ qua điểm đã an toàn.',
              '<b>C</b>: lề rộng hay ít vi phạm. <b>γ</b>: ranh giới mượt hay uốn sát.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('SVM chọn đường thẳng có lề rộng nhất, và chỉ những vector hỗ trợ, các ca khó nhất, quyết định nó.', { n: 2, hl: 1 }, { anim: 2 }),
              L('Hinge loss bỏ qua những điểm đã an toàn, khác với mất mát log.', { n: 3, hl: 2 }),
              L('C cân giữa lề rộng và ít vi phạm. Nhân RBF cho ranh giới cong, với γ quyết định mượt hay uốn sát dữ liệu.', { n: 4, hl: 3 }, { say: 'C cân giữa lề rộng và ít vi phạm. Nhân RBF cho ranh giới cong, với gam-ma quyết định mượt hay uốn sát dữ liệu.' }),
              L('Trong nhiều năm trước khi mạng nơ-ron trở lại, SVM là một trong những mô hình mạnh nhất. Với dữ liệu nhỏ và vừa, có ít đặc trưng, nó vẫn là một lựa chọn rất tốt.'),
              L('Chương 7 bỏ nhãn đi hoàn toàn: học không giám sát, tìm cấu trúc trong dữ liệu khi không ai cho biết đáp án.', { hl: -1 }, { say: 'Chương bảy bỏ nhãn đi hoàn toàn: học không giám sát, tìm cấu trúc trong dữ liệu khi không ai cho biết đáp án.' }),
              L('Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương 7.', undefined, { say: 'Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương bảy.' }),
            ],
          },
        ],
      },
    ],
  };
}
