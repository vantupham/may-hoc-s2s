/**
 * Bài giảng chương 5: cây quyết định, rừng ngẫu nhiên, gradient boosting trên Titanic.
 * Số liệu do ml-core tính (gini, splitCandidates, buildTree, randomForest, gradientBoosting), cùng thiết lập với các lab.
 */
import data from '../../data/titanic.json';
import { gini, splitCandidates, buildTree, predictTree, randomForest, probaForest, gradientBoosting, fmt, type Row, type TreeNode } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const pc = (v: number, d = 1) => fmt(100 * v, d);
const spc = (v: number, d = 1) => `${sn(100 * v, d)} phần trăm`;

export const treePyCode = `import numpy as np, json
from pyodide.http import open_url
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

d = json.loads(open_url(".../titanic.json").read())
F = d["features"]                      # sex, pclass, age, fare, family
test = set(d["testIds"])
X = np.array([[p[f] for f in F] for p in d["people"]], dtype=float)
y = np.array([p["survived"] for p in d["people"]])
te = np.array([p["id"] in test for p in d["people"]])

cay = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X[~te], y[~te])
print(export_text(cay, feature_names=F))

rung = RandomForestClassifier(100, max_features=2, random_state=0).fit(X[~te], y[~te])
boost = GradientBoostingClassifier(n_estimators=150, max_depth=2).fit(X[~te], y[~te])
for ten, m in [("cây", cay), ("rừng", rung), ("boosting", boost)]:
    print(ten, m.score(X[te], y[te]))`;

const FEAT = ['giới tính', 'hạng vé', 'tuổi', 'giá vé', 'gia đình'];

function label(n: TreeNode) {
  if (n.feature === undefined) return n.counts[1] > n.counts[0] ? 'sống' : 'mất';
  if (n.feature === 0) return 'giới tính?';
  return `${FEAT[n.feature]} ≤ ${fmt(n.thr!, 1).replace(/,0$/, '')}?`;
}
/** Cây → danh sách nút cho cảnh Diagram (theo thứ tự duyệt theo chiều rộng, để hiện dần từng tầng) */
function toNodes(root: TreeNode) {
  const out: { id: string; parent?: string; text: string; sub: string; edge?: string; cls?: number }[] = [];
  const q: [TreeNode, string | undefined, string | undefined][] = [[root, undefined, undefined]];
  while (q.length) {
    const [n, parent, edge] = q.shift()!;
    const leaf = n.feature === undefined;
    out.push({ id: String(n.id), parent, edge, text: label(n), sub: `${n.n} · ${Math.round((100 * n.counts[1]) / n.n)}% sống`, ...(leaf ? { cls: n.counts[1] > n.counts[0] ? 1 : 0 } : {}) });
    if (!leaf) {
      const sex = n.feature === 0;
      q.push([n.left!, String(n.id), sex ? 'nam' : 'có'], [n.right!, String(n.id), sex ? 'nữ' : 'không']);
    }
  }
  return out;
}

export function treeLecture(): Lecture {
  const P = data.people;
  const testSet = new Set(data.testIds);
  const toRow = (p: (typeof P)[number]): Row => ({ x: data.features.map((f) => (p as unknown as Record<string, number>)[f]), y: p.survived });
  const all = P.map(toRow);
  const train = P.filter((p) => !testSet.has(p.id)).map(toRow);
  const test = P.filter((p) => testSet.has(p.id)).map(toRow);
  const rate = (g: typeof P) => g.filter((p) => p.survived).length / g.length;
  const men = P.filter((p) => !p.sex), women = P.filter((p) => p.sex);
  const cls = [1, 2, 3].map((c) => rate(P.filter((p) => p.pclass === c)));
  const nMissing = P.filter((p) => p.ageMissing).length;

  // Gini của cả 891 người và sau khi chia theo giới tính
  const cnt = (g: typeof P): [number, number] => [g.filter((p) => !p.survived).length, g.filter((p) => p.survived).length];
  const gAll = gini(...cnt(P)), gM = gini(...cnt(men)), gW = gini(...cnt(women));
  const gSex = (men.length / P.length) * gM + (women.length / P.length) * gW;
  // Ngưỡng tốt nhất của từng đặc trưng trên tập huấn luyện (như lab chia)
  const bestOf = (f: number) => splitCandidates(train, f).reduce((a, c) => (c.gini < a.gini ? c : a));
  const bAge = bestOf(2), bSex = bestOf(0), bFare = bestOf(3);
  const ageCurve = splitCandidates(train, 2).map((c) => [c.thr, c.gini]);
  const gTrain = gini(train.filter((r) => !r.y).length, train.filter((r) => r.y).length);
  const at = (thr: number) => splitCandidates(train, 2).reduce((a, c) => (Math.abs(c.thr - thr) < Math.abs(a.thr - thr) ? c : a));
  const a30 = at(30), a60 = at(60);

  const acc = (t: TreeNode, rows: Row[]) => rows.filter((r) => predictTree(t, r.x) === r.y).length / rows.length;
  const depthCurve = Array.from({ length: 12 }, (_, i) => { const t = buildTree(train, { maxDepth: i + 1, nFeatures: 5 }); return [i + 1, acc(t, train), acc(t, test)]; });
  const t3 = buildTree(train, { maxDepth: 3, nFeatures: 5 });
  const tree3 = toNodes(t3);
  const d = (k: number) => depthCurve[k - 1];

  const forest = randomForest(train, { nTrees: 100, maxDepth: 8, nFeatures: 5, maxFeatures: 2, seed: 1 });
  const sums = test.map(() => 0);
  const rfCurve = forest.map((t, k) => { let ok = 0; test.forEach((r, i) => { sums[i] += probaForest([t], r.x); if ((sums[i] / (k + 1) >= 0.5 ? 1 : 0) === r.y) ok++; }); return ok / test.length; });
  const gb = gradientBoosting(train, { nStages: 150, lr: 0.1, maxDepth: 2, nFeatures: 5 });
  const gbCurve = Array.from({ length: 150 }, (_, k) => test.filter((r) => (gb.proba(r.x, k + 1) >= 0.5 ? 1 : 0) === r.y).length / test.length);
  const single8 = acc(buildTree(train, { maxDepth: 8, nFeatures: 5 }), test);

  return {
    slug: 'cay-quyet-dinh',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 5', title: 'Cây quyết định', sub: 'và rừng, và boosting · Titanic' },
            lines: [
              L('Chương 5: cây quyết định, rừng ngẫu nhiên và gradient boosting.', undefined, { say: 'Chương năm: cây quyết định, rừng ngẫu nhiên và gradient boosting.' }),
              L(`Đêm 14 rạng sáng 15 tháng 4 năm 1912, tàu Titanic đâm vào băng trôi và chìm. Bộ dữ liệu ghi lại ${P.length} hành khách, trong đó ${P.filter((p) => p.survived).length} người sống sót.`, undefined, {
                say: `Đêm mười bốn rạng sáng mười lăm tháng tư năm một nghìn chín trăm mười hai, tàu Titanic đâm vào băng trôi và chìm. Bộ dữ liệu ghi lại ${speakNum(String(P.length))} hành khách, trong đó ${speakNum(String(P.filter((p) => p.survived).length))} người sống sót.`,
              }),
              L('Câu hỏi: từ giới tính, hạng vé, tuổi, giá vé và số người thân đi cùng, ai đã sống sót?'),
              L('Cây quyết định có một điểm mạnh hơn hồi quy logistic: kết quả của nó là một sơ đồ mà ai cũng đọc được, không cần biết toán.'),
            ],
          },
          {
            view: 'Chart',
            props: {
              title: 'Tỷ lệ sống sót theo nhóm',
              bars: [
                { label: 'Nam', value: rate(men), color: 0 }, { label: 'Nữ', value: rate(women), color: 1 },
                { label: 'Hạng 1', value: cls[0], color: 2 }, { label: 'Hạng 2', value: cls[1], color: 2 }, { label: 'Hạng 3', value: cls[2], color: 2 },
              ],
              ylab: 'sống sót', ydom: [0, 1], yfmt: 'pct',
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Quy tắc "phụ nữ và trẻ em lên xuồng trước" hiện rõ: ${pc(rate(women), 0)}% phụ nữ sống sót, so với ${pc(rate(men), 0)}% nam giới.`, { n: 2 }, { anim: 2, say: `Quy tắc phụ nữ và trẻ em lên xuồng trước hiện rõ: ${spc(rate(women), 0)} phụ nữ sống sót, so với ${spc(rate(men), 0)} nam giới.` }),
              L(`Hạng vé cũng vậy: ${pc(cls[0], 0)}% ở hạng 1, chỉ ${pc(cls[2], 0)}% ở hạng 3. Khoang hạng 3 nằm sâu dưới tàu, xa boong có xuồng cứu sinh.`, { n: 5 }, { anim: 2, say: `Hạng vé cũng vậy: ${spc(cls[0], 0)} ở hạng một, chỉ ${spc(cls[2], 0)} ở hạng ba. Khoang hạng ba nằm sâu dưới tàu, xa boong có xuồng cứu sinh.` }),
              L(`Và ${nMissing} hành khách không có tuổi. Ở đây ta điền tuổi trung vị, ${data.medianAge} tuổi: cách đơn giản nhất, nhưng không vô hại.`, undefined, { say: `Và ${speakNum(String(nMissing))} hành khách không có tuổi. Ở đây ta điền tuổi trung vị, ${speakNum(String(data.medianAge))} tuổi: cách đơn giản nhất, nhưng không vô hại.` }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: câu hỏi tốt nhất', section: 'truc-giac',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Chỉ được hỏi một câu', items: [
              'Thử <b>mọi câu hỏi</b> có thể: giới tính? tuổi ≤ 6? giá vé ≤ 50?',
              'Chấm điểm: câu hỏi chia đám đông thành hai nhóm <b>càng "sạch" càng tốt</b>.',
              'Chọn câu tốt nhất, rồi <b>lặp lại</b> trong từng nhóm.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Nếu chỉ được hỏi một câu để đoán ai sống sót, bạn sẽ hỏi gì? Có lẽ là giới tính.'),
              L('Cây quyết định làm đúng việc đó, nhưng có hệ thống: nó thử mọi câu hỏi có thể.', { n: 1, hl: 0 }),
              L('Chấm điểm từng câu: câu nào chia đám đông thành hai nhóm sạch nhất, tức trong mỗi nhóm gần như tất cả cùng một kết cục.', { n: 2, hl: 1 }),
              L('Một nhóm 50 người sống, 50 người mất là lẫn lộn hoàn toàn. Một nhóm 95 sống, 5 mất là gần sạch.', undefined, { say: 'Một nhóm năm mươi người sống, năm mươi người mất là lẫn lộn hoàn toàn. Một nhóm chín mươi lăm sống, năm mất là gần sạch.' }),
              L('Chọn câu tốt nhất, rồi lặp lại đúng quy trình đó trong từng nhóm con.', { n: 3, hl: 2 }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: độ vẩn đục Gini', section: 'tinh-tay',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Gini: đám đông lẫn lộn đến đâu?', items: [
              { label: 'Công thức', tex: String.raw`G = 1 - p_{\text{sống}}^2 - p_{\text{mất}}^2` },
              { label: `Cả ${P.length} người`, tex: String.raw`G = ${fmt(gAll, 3).replace(',', '{,}')}` },
              { label: 'Nam / nữ', tex: String.raw`G_{\text{nam}} = ${fmt(gM, 3).replace(',', '{,}')} \qquad G_{\text{nữ}} = ${fmt(gW, 3).replace(',', '{,}')}` },
              { label: 'Sau khi chia', tex: String.raw`\tfrac{${men.length}}{${P.length}}\cdot ${fmt(gM, 3).replace(',', '{,}')} + \tfrac{${women.length}}{${P.length}}\cdot ${fmt(gW, 3).replace(',', '{,}')} = ${fmt(gSex, 3).replace(',', '{,}')}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Đo độ "sạch" bằng độ vẩn đục Gini: một trừ bình phương tỷ lệ sống, trừ bình phương tỷ lệ mất.', { n: 1, hl: 0 }),
              L('Ý nghĩa: chọn ngẫu nhiên hai người trong nhóm, Gini là xác suất họ có kết cục khác nhau. Nhóm thuần một loại có Gini bằng 0, chia đôi đều có Gini 0,5.', undefined, { say: 'Ý nghĩa: chọn ngẫu nhiên hai người trong nhóm, Gini là xác suất họ có kết cục khác nhau. Nhóm thuần một loại có Gini bằng không, chia đôi đều có Gini không phẩy năm.' }),
              L(`Cả ${P.length} hành khách: Gini = ${fmt(gAll, 3)}, khá lẫn lộn.`, { n: 2, hl: 1 }, { say: `Cả ${speakNum(String(P.length))} hành khách: Gini bằng ${sn(gAll, 3)}, khá lẫn lộn.` }),
              L(`Chia theo giới tính: nhóm nam có Gini ${fmt(gM, 3)}, nhóm nữ ${fmt(gW, 3)}. Cả hai đều sạch hơn.`, { n: 3, hl: 2 }, { say: `Chia theo giới tính: nhóm nam có Gini ${sn(gM, 3)}, nhóm nữ ${sn(gW, 3)}. Cả hai đều sạch hơn.` }),
              L(`Lấy trung bình có trọng số theo cỡ nhóm: ${fmt(gSex, 3)}. Câu hỏi càng tốt, con số này càng nhỏ.`, { n: 4, hl: 3 }, { say: `Lấy trung bình có trọng số theo cỡ nhóm: ${sn(gSex, 3)}. Câu hỏi càng tốt, con số này càng nhỏ.` }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Kéo ngưỡng tuổi', series: [{ name: 'Gini sau khi chia', pts: ageCurve, color: 2 }], xlab: 'ngưỡng tuổi', ylab: 'Gini sau khi chia', xdom: [0, 80], ydom: [0.455, gTrain + 0.002], xfmt: 'int', legend: false },
            init: { t: 0, vx: null, hy: null },
            lines: [
              L(`Thử câu hỏi về tuổi trên ${train.length} người huấn luyện: "tuổi ≤ t?" với mọi ngưỡng t.`, { t: 1 }, { anim: 'line', ease: 'lin', say: `Thử câu hỏi về tuổi trên ${speakNum(String(train.length))} người huấn luyện: tuổi có nhỏ hơn t không, với mọi ngưỡng t.` }),
              L(`Đường ngang là Gini khi chưa chia: ${fmt(gTrain, 3)}. Chia ở 30 tuổi, Gini chỉ xuống ${fmt(a30.gini, 4)}: gần như vô ích.`, { hy: gTrain, vx: 30 }, { say: `Đường ngang là Gini khi chưa chia: ${sn(gTrain, 3)}. Chia ở ba mươi tuổi, Gini chỉ xuống ${sn(a30.gini, 4)}: gần như vô ích.` }),
              L(`Chia ở 60 tuổi cũng vậy: ${fmt(a60.gini, 4)}.`, { vx: 60 }, { say: `Chia ở sáu mươi tuổi cũng vậy: ${sn(a60.gini, 4)}.` }),
              L(`Điểm thấp nhất nằm ở ${fmt(bAge.thr, 1)} tuổi: tách trẻ nhỏ ra khỏi người lớn.`, { vx: bAge.thr }, { say: `Điểm thấp nhất nằm ở ${sn(bAge.thr, 1)} tuổi: tách trẻ nhỏ ra khỏi người lớn.` }),
              L('Chỉ cần thử các ngưỡng nằm giữa hai tuổi liên tiếp khác nhau: dịch ngưỡng trong khoảng đó không làm ai đổi nhánh.', { vx: null }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: `Câu hỏi tốt nhất của từng đặc trưng (${train.length} người huấn luyện)`,
              cols: ['Đặc trưng', 'Ngưỡng tốt nhất', 'Gini sau khi chia'],
              cls: ['t', '', ''],
              rows: [
                ['Tuổi', `≤ ${fmt(bAge.thr, 1)}`, fmt(bAge.gini, 4)],
                ['Giá vé', `≤ ${fmt(bFare.thr, 2)}`, fmt(bFare.gini, 4)],
                ['Giới tính', 'nam / nữ', fmt(bSex.gini, 4)],
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Với tuổi, thử mọi ngưỡng nằm giữa hai tuổi liên tiếp. Tốt nhất là tuổi ≤ ${fmt(bAge.thr, 1)}, Gini sau khi chia ${fmt(bAge.gini, 4)}.`, { n: 1, hl: 0 }, { say: `Với tuổi, thử mọi ngưỡng nằm giữa hai tuổi liên tiếp. Tốt nhất là chia ở ${sn(bAge.thr, 1)} tuổi, Gini sau khi chia ${sn(bAge.gini, 4)}.` }),
              L(`Giá vé: tốt nhất ${fmt(bFare.gini, 4)}.`, { n: 2, hl: 1 }, { say: `Giá vé: tốt nhất ${sn(bFare.gini, 4)}.` }),
              L(`Giới tính: ${fmt(bSex.gini, 4)}. Thắng rõ ràng, và trở thành gốc của cây.`, { n: 3, hl: 2 }, { say: `Giới tính: ${sn(bSex.gini, 4)}. Thắng rõ ràng, và trở thành gốc của cây.` }),
              L('Sau đó cây lặp lại đúng quy trình này riêng cho nhóm nam, riêng cho nhóm nữ, cho đến khi đạt độ sâu tối đa hoặc nhóm đã thuần một loại.', { hl: -1 }),
            ],
          },
          {
            view: 'Diagram', props: { title: 'Cây độ sâu 3', nodes: tree3 },
            init: { n: 0, hl: '' },
            lines: [
              L('Đây là cây độ sâu 3 học từ tập huấn luyện. Gốc là câu hỏi giới tính.', { n: 1, hl: '0' }, { say: 'Đây là cây độ sâu ba học từ tập huấn luyện. Gốc là câu hỏi giới tính.' }),
              L('Tầng thứ hai: với nam, câu hỏi tiếp theo là tuổi; với nữ, là hạng vé.', { n: 3 }, { anim: 1.5 }),
              L('Tầng cuối là các lá. Mỗi lá dự đoán theo đa số: màu cam là sống, màu xanh là mất.', { n: tree3.length }, { anim: 2.5 }),
              L('Đọc theo một nhánh như đọc một câu: nữ, hạng vé 1 hoặc 2, thì rất có thể sống sót.', { hl: '', path: '0,8,9' }, { say: 'Đọc theo một nhánh như đọc một câu: nữ, hạng vé một hoặc hai, thì rất có thể sống sót.' }),
              L('Nam, trên 13 tuổi, hạng 2 hoặc 3: nhánh đông người nhất, và chỉ khoảng một phần mười sống sót.', { path: '0,1,5,7' }, { say: 'Nam, trên mười ba tuổi, hạng hai hoặc ba: nhánh đông người nhất, và chỉ khoảng một phần mười sống sót.' }),
              L('Còn bé trai dưới 13 tuổi đi cùng gia đình nhỏ: cả 16 em trong tập huấn luyện đều sống. Quy tắc "trẻ em trước" hiện ra ngay trong cây.', { path: '0,1,2,3' }, { say: 'Còn bé trai dưới mười ba tuổi đi cùng gia đình nhỏ: cả mười sáu em trong tập huấn luyện đều sống. Quy tắc trẻ em trước hiện ra ngay trong cây.' }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết: rừng và boosting', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Từ một cây đến nhiều cây', items: [
              { label: 'Chia tham lam', tex: String.raw`(j^*, t^*) = \arg\min_{j,\,t}\; \tfrac{n_L}{n}G_L + \tfrac{n_R}{n}G_R` },
              { label: 'Rừng', tex: String.raw`p(x) = \frac{1}{T}\sum_{t=1}^{T} p_t(x)` },
              { label: 'Boosting', tex: String.raw`F_m(x) = F_{m-1}(x) + \ceta{\eta}\, h_m(x), \quad h_m \approx y - p` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Mỗi bước, cây chọn đặc trưng và ngưỡng làm Gini sau khi chia nhỏ nhất. Đây là thuật toán tham lam: tốt nhất lúc đó, không nhìn trước.', { n: 1, hl: 0 }),
              L('Một cây sâu thì thuộc lòng dữ liệu: thay đổi vài hành khách là cây đổi hẳn.'),
              L('Rừng ngẫu nhiên lợi dụng chính điểm yếu đó: trồng nhiều cây, mỗi cây trên một mẫu lấy có lặp lại, và mỗi lần chia chỉ được xét vài đặc trưng ngẫu nhiên. Rồi lấy trung bình.', { n: 2, hl: 1 }),
              L('Lấy mẫu có lặp lại nghĩa là bốc ngẫu nhiên từng người, bốc xong lại bỏ vào. Mỗi cây chỉ thấy khoảng hai phần ba số hành khách khác nhau, có người bị bốc hai ba lần.'),
              L('Các cây sai theo những cách khác nhau, nên khi cộng lại, sai số của chúng triệt tiêu bớt.'),
              L('Boosting đi hướng ngược lại: các cây nhỏ, yếu, trồng nối tiếp. Cây sau học phần mà các cây trước còn đoán sai, rồi được cộng vào với hệ số nhỏ η.', { n: 3, hl: 2 }, { say: 'Boosting đi hướng ngược lại: các cây nhỏ, yếu, trồng nối tiếp. Cây sau học phần mà các cây trước còn đoán sai, rồi được cộng vào với hệ số nhỏ ê-ta.' }),
              L('Ví dụ một hành khách sống sót mà mô hình hiện chỉ cho xác suất 0,3: phần dư là 0,7. Cây tiếp theo cố đoán đúng phần 0,7 đó, và đẩy dự đoán của người này lên một chút.', undefined, { say: 'Ví dụ một hành khách sống sót mà mô hình hiện chỉ cho xác suất không phẩy ba: phần dư là không phẩy bảy. Cây tiếp theo cố đoán đúng phần còn thiếu đó, và đẩy dự đoán của người này lên một chút.' }),
              L('Phần dư y trừ p chính là âm gradient của mất mát log. Vậy boosting là Gradient Descent, nhưng thay vì cập nhật tham số, ta cập nhật cả một hàm.', { hl: -1 }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'cay_rung_boosting.py', code: treePyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Ba mô hình với scikit-learn, trên đúng cách chia train và test của trang này.'),
              L('Cây độ sâu 3, in ra dạng chữ: giống hệt cây ta vừa xem.', { a: 13, b: 14 }, { say: 'Cây độ sâu ba, in ra dạng chữ: giống hệt cây ta vừa xem.' }),
              L('Rừng 100 cây, mỗi lần chia xét 2 đặc trưng. Boosting 150 vòng với cây độ sâu 2.', { a: 16, b: 17 }, { say: 'Rừng một trăm cây, mỗi lần chia xét hai đặc trưng. Boosting một trăm năm mươi vòng với cây độ sâu hai.' }),
              L('Rồi chấm điểm cả ba trên tập test.', { a: 18, b: 19 }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Độ sâu, rừng và boosting', section: 'danh-gia',
        scenes: [
          {
            view: 'Chart',
            props: { title: 'Cây càng sâu càng tốt?', series: [{ name: 'huấn luyện', pts: depthCurve.map(([k, a]) => [k, a]), color: 0, dots: true }, { name: `test (${test.length} người)`, pts: depthCurve.map(([k, , b]) => [k, b]), color: 1, dots: true }], xlab: 'độ sâu tối đa', ylab: 'độ chính xác', xdom: [0.5, 12.5], ydom: [0.74, 1], xfmt: 'int', yfmt: 'pct' },
            init: { n: 2, t: 0, hl: -1 },
            lines: [
              L(`Độ sâu 1, tức chỉ hỏi giới tính: đúng ${pc(d(1)[2])}% trên test.`, { t: 0.04 }, { say: `Độ sâu một, tức chỉ hỏi giới tính: đúng ${spc(d(1)[2])} trên test.` }),
              L(`Độ sâu 3: ${pc(d(3)[2])}%. Độ sâu 4 cũng ${pc(d(4)[2])}%.`, { t: 0.3 }, { anim: 'line', ease: 'lin', say: `Độ sâu ba: ${spc(d(3)[2])}. Độ sâu bốn cũng ${spc(d(4)[2])}.` }),
              L('Sâu hơn nữa: đường huấn luyện cứ đi lên, còn đường test đi xuống. Cây bắt đầu thuộc lòng từng hành khách.', { t: 1 }, { anim: 'line', ease: 'lin' }),
              L(`Với ${test.length} người trong tập test, mỗi người đúng hay sai làm độ chính xác thay đổi hơn nửa điểm phần trăm. Đừng đọc quá nhiều vào dao động nhỏ.`, undefined, { say: `Với ${speakNum(String(test.length))} người trong tập test, mỗi người đúng hay sai làm độ chính xác thay đổi hơn nửa điểm phần trăm. Đừng đọc quá nhiều vào dao động nhỏ.` }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Thêm cây', series: [{ name: 'rừng ngẫu nhiên', pts: rfCurve.map((v, i) => [i + 1, v]), color: 2 }, { name: 'gradient boosting', pts: gbCurve.map((v, i) => [i + 1, v]), color: 1 }], xlab: 'số cây', ylab: 'độ chính xác test', xdom: [1, 150], ydom: [0.72, 0.9], xfmt: 'int', yfmt: 'pct' },
            init: { n: 0, t: 1, hl: -1 },
            lines: [
              L(`Một cây sâu 8 tầng: ${pc(single8)}% trên test.`, undefined, { say: `Một cây sâu tám tầng: ${spc(single8)} trên test.` }),
              L(`Rừng ngẫu nhiên: 1 cây chỉ ${pc(rfCurve[0])}%, vì cây đó học trên một mẫu lấy có lặp lại. 100 cây: ${pc(rfCurve[99])}%.`, { n: 1, hl: 0 }, { say: `Rừng ngẫu nhiên: một cây chỉ ${spc(rfCurve[0])}, vì cây đó học trên một mẫu lấy có lặp lại. Một trăm cây: ${spc(rfCurve[99])}.` }),
              L(`Boosting: 10 vòng được ${pc(gbCurve[9])}%, 150 vòng lên ${pc(gbCurve[149])}%.`, { n: 2, hl: 1 }, { say: `Boosting: mười vòng được ${spc(gbCurve[9])}, một trăm năm mươi vòng lên ${spc(gbCurve[149])}.` }),
              L('Trên dữ liệu dạng bảng như thế này, gồm các cột số và cột phân loại, rừng và boosting thường là những mô hình mạnh nhất, mạnh hơn cả mạng nơ-ron.'),
              L('Cái giá phải trả: một trăm cây thì không còn đọc được bằng mắt như một cây đơn lẻ nữa.'),
              L('Ở bước 7, bấm "Trồng lại rừng khác" để thấy kết quả dao động bao nhiêu chỉ vì may rủi.', { hl: -1 }, { say: 'Ở bước bảy, bấm trồng lại rừng khác để thấy kết quả dao động bao nhiêu chỉ vì may rủi.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Cây quá sâu</b> → một lá cho gần như mỗi người. Giới hạn độ sâu.',
              '<b>Tin "mức quan trọng" máy móc</b> → cột nhiều giá trị dễ được chọn hơn.',
              '<b>Rò rỉ</b> → trung vị tuổi tính trên cả tập test.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ba bẫy thường gặp. Một: cây quá sâu. Luôn giới hạn độ sâu, hoặc số người tối thiểu ở mỗi lá.', { n: 1, hl: 0 }),
              L('Hai: tin vào mức quan trọng của đặc trưng một cách máy móc. Cột có nhiều giá trị khác nhau, như giá vé, có nhiều ngưỡng để thử, nên dễ được chọn hơn dù không thật sự quan trọng hơn.', { n: 2, hl: 1 }),
              L(`Ba: rò rỉ. Trung vị ${data.medianAge} tuổi ở đây được tính trên cả ${P.length} người, kể cả tập test. Đúng ra phải tính trên tập huấn luyện thôi.`, { n: 3, hl: 2 }, { say: `Ba: rò rỉ. Trung vị ${speakNum(String(data.medianAge))} tuổi ở đây được tính trên cả ${speakNum(String(P.length))} người, kể cả tập test. Đúng ra phải tính trên tập huấn luyện thôi.` }),
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
              'Cây hỏi chuỗi câu <b>có/không</b>; mỗi câu chọn theo <b>Gini</b> nhỏ nhất.',
              'Cây đọc được bằng mắt, nhưng <b>sâu quá thì thuộc lòng</b>.',
              '<b>Rừng</b>: nhiều cây khác nhau, lấy trung bình.',
              '<b>Boosting</b>: cây nhỏ nối tiếp, sửa lỗi của nhau.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Cây quyết định hỏi một chuỗi câu có hoặc không. Mỗi câu được chọn vì làm Gini sau khi chia nhỏ nhất.', { n: 1, hl: 0 }),
              L('Cây đọc được bằng mắt, nhưng sâu quá thì thuộc lòng dữ liệu.', { n: 2, hl: 1 }),
              L('Rừng ngẫu nhiên trồng nhiều cây khác nhau rồi lấy trung bình. Boosting trồng cây nhỏ nối tiếp, cây sau sửa lỗi cây trước. Cả hai thường thắng một cây đơn lẻ.', { n: 4, hl: 3 }, { anim: 2 }),
              L('Chương 6 quay lại bài toán khối u lành hay ác, với một ý tưởng hình học: đường tách xa những ca khó nhất. Đó là SVM.', { hl: -1 }, { say: 'Chương sáu quay lại bài toán khối u lành hay ác, với một ý tưởng hình học: đường tách xa những ca khó nhất. Đó là SVM.' }),
              L('Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương 6.', undefined, { say: 'Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương sáu.' }),
            ],
          },
        ],
      },
    ],
  };
}
