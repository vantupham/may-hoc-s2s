/**
 * Bài giảng chương 4: KNN trên Iris (chiều dài, chiều rộng cánh hoa) và Naive Bayes trên SMS Spam Collection.
 * Số liệu do ml-core tính: neighbors, knnPredict, nbTrain, nbFromCounts, nbScore.
 */
import iris from '../../data/iris.json';
import sms from '../../data/sms.json';
import { neighbors, knnPredict, nbTrain, nbFromCounts, nbScore, fmt, type Pt2 } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));

export const knnPyCode = `import numpy as np, json
from pyodide.http import open_url

d = json.loads(open_url(".../iris.json").read())
test = set(d["testIds"])
X = np.array([[f["len"], f["wid"]] for f in d["flowers"]])
y = np.array([f["y"] for f in d["flowers"]])
tr = np.array([f["id"] not in test for f in d["flowers"]])

def knn(q, k=5):
    dist = np.sqrt(((X[tr] - q) ** 2).sum(axis=1))   # khoảng cách tới mọi bông hoa
    gan = np.argsort(dist, kind="stable")[:k]          # k bông gần nhất
    phieu = np.bincount(y[tr][gan], minlength=3)       # đếm phiếu
    return phieu.argmax(), phieu

print("Hoa (4,9 cm; 1,6 cm):", knn(np.array([4.9, 1.6])))
pred = np.array([knn(q)[0] for q in X[~tr]])
print("Độ chính xác test:", (pred == y[~tr]).mean())`;

export function knnNbLecture(): Lecture {
  const F = iris.flowers;
  const test = new Set(iris.testIds);
  const toPt = (f: (typeof F)[number]): Pt2 => ({ id: f.id, a: f.len, b: f.wid, y: f.y });
  const train = F.filter((f) => !test.has(f.id)).map(toPt);
  const tst = F.filter((f) => test.has(f.id)).map(toPt);
  const trainIdx = new Map(F.map((f, i) => [f.id, i]));
  const avgOf = (c: number, k: 'len' | 'wid') => { const a = F.filter((f) => f.y === c); return a.reduce((s, f) => s + f[k], 0) / a.length; };
  const xd = [0.6, 7.2], yd = [-0.1, 2.7];
  const G = { gx: 66, gy: 28 };
  const grid = (k: number) => {
    const g: number[] = [];
    for (let j = 0; j < G.gy; j++)
      for (let i = 0; i < G.gx; i++) g.push(knnPredict({ a: xd[0] + ((xd[1] - xd[0]) * (i + 0.5)) / G.gx, b: yd[0] + ((yd[1] - yd[0]) * (j + 0.5)) / G.gy }, train, k, 3).pred);
    return g;
  };
  const acc = (pts: Pt2[], k: number) => pts.filter((p) => knnPredict(p, train, k, 3).pred === p.y).length / pts.length;
  const q1 = { a: 4.9, b: 1.6 }, q2 = { a: 5.0, b: 1.6 };
  const nb5 = neighbors(q1, train).slice(0, 5);
  const v5 = knnPredict(q1, train, 5, 3).votes;
  const v9 = knnPredict(q2, train, 9, 3).votes;
  const nbIdx = (q: { a: number; b: number }, k: number) => neighbors(q, train).slice(0, k).map((n) => trainIdx.get(n.id)!).join(',');
  const pts = F.map((f) => [f.len, f.wid]);
  const cls = F.map((f) => f.y);
  const accs = [1, 5, 20].map((k) => [acc(train, k), acc(tst, k)]);

  // Naive Bayes: 6 tin để tính tay, rồi toàn bộ bảng đếm
  const mini = nbTrain(sms.mini);
  const sA = nbScore(mini, 'Call now for your free prize');
  const sB = nbScore(mini, 'Please call me later');
  const full = nbFromCounts(sms.vocab, sms.counts, sms.docs);
  const scored = sms.test.map((t) => ({ y: t.y, pred: nbScore(full, t.text).pred }));
  const accNb = scored.filter((s) => s.pred === s.y).length / scored.length;
  const fp = scored.filter((s) => s.pred === 1 && s.y === 0).length;
  const fn = scored.filter((s) => s.pred === 0 && s.y === 1).length;
  const spamPct = (100 * sms.nSpam) / sms.nTotal;
  const tok = (s: ReturnType<typeof nbScore>) => s.tokens.filter((t) => t.known);
  const V = mini.vocab.length;
  const call = sA.tokens.find((t) => t.token === 'call')!;
  const now = sA.tokens.find((t) => t.token === 'now')!;
  const spamT = sms.test.filter((t) => t.y === 1), hamT = sms.test.filter((t) => t.y === 0);
  const examples = [[spamT[2], 'rác'], [spamT[0], 'rác'], [hamT[3], 'thường'], [hamT[5], 'thường']] as const;
  const kCurve = Array.from({ length: 30 }, (_, i) => i + 1).map((k) => [k, acc(train, k), acc(tst, k)]);

  return {
    slug: 'knn-naive-bayes',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Hai bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 4', title: 'KNN và Naive Bayes', sub: 'hỏi hàng xóm, và đếm từ · Iris, SMS Spam' },
            lines: [
              L('Chương 4: hai thuật toán phân loại đơn giản đến bất ngờ, K láng giềng gần nhất và Naive Bayes.', undefined, { say: 'Chương bốn: hai thuật toán phân loại đơn giản đến bất ngờ, K láng giềng gần nhất và Naive Bayes.' }),
              L('Bài toán thứ nhất. Năm 1936, nhà thống kê Ronald Fisher công bố số đo của 150 bông hoa diên vĩ thuộc ba loài, mỗi loài 50 bông. Cho số đo cánh hoa của một bông mới, nó thuộc loài nào?', undefined, { say: 'Bài toán thứ nhất. Năm một nghìn chín trăm ba mươi sáu, nhà thống kê Ronald Fisher công bố số đo của một trăm năm mươi bông hoa diên vĩ thuộc ba loài, mỗi loài năm mươi bông. Cho số đo cánh hoa của một bông mới, nó thuộc loài nào?' }),
              L(`Bài toán thứ hai. Bộ SMS Spam Collection gồm ${sms.nTotal.toLocaleString('vi-VN')} tin nhắn thật, trong đó ${sms.nSpam} tin là tin rác. Cho một tin mới, có nên chặn nó không?`),
              L('Bài thứ nhất có đầu vào là hai con số. Bài thứ hai có đầu vào là một đoạn văn bản: ta phải tự biến chữ thành số.'),
            ],
          },
          {
            view: 'Points', props: { pts, cls, names: ['setosa', 'versicolor', 'virginica'], xlab: 'chiều dài cánh hoa (cm)', ylab: 'chiều rộng cánh hoa (cm)', xdom: xd, ydom: yd, dot: 6, frames: [{}] },
            init: { f: 0 },
            lines: [
              L(`Đây là 150 bông hoa. Setosa có cánh hoa nhỏ hẳn: trung bình dài ${fmt(avgOf(0, 'len'), 2)} cm, nằm tách riêng ở góc dưới.`, undefined, { say: `Đây là một trăm năm mươi bông hoa. Setosa có cánh hoa nhỏ hẳn: trung bình dài ${sn(avgOf(0, 'len'), 2)} xăng-ti-mét, nằm tách riêng ở góc dưới.` }),
              L(`Versicolor dài trung bình ${fmt(avgOf(1, 'len'), 2)} cm, virginica ${fmt(avgOf(2, 'len'), 2)} cm. Hai loài này nằm sát nhau và chồng lấn một chút.`, undefined, { say: `Versicolor dài trung bình ${sn(avgOf(1, 'len'), 2)} xăng-ti-mét, virginica ${sn(avgOf(2, 'len'), 2)} xăng-ti-mét. Hai loài này nằm sát nhau và chồng lấn một chút.` }),
              L('Chỗ chồng lấn đó là nơi mô hình sẽ phải vất vả.'),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Vài tin nhắn trong bộ SMS Spam Collection',
              cols: ['Tin nhắn', 'Nhãn'],
              cls: ['t', 't'],
              rows: examples.map(([t, y]) => [t.text.length > 46 ? `${t.text.slice(0, 44)}…` : t.text, y]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Còn tin nhắn: vài ví dụ thật cho thấy ngay khác biệt.', { n: 4 }, { anim: 2 }),
              L('Tin rác hay có số điện thoại dài, chữ in hoa, và những từ như free, call, claim, prize.', { hl: 0 }),
              L('Tin thường thì ngắn, viết tắt, thân mật, nhiều từ lóng.', { hl: 2 }),
              L(`Và tin rác hiếm: chỉ ${fmt(spamPct, 1)}% toàn bộ tin nhắn. Điều này sẽ quan trọng khi đánh giá.`, { hl: -1 }, { say: `Và tin rác hiếm: chỉ ${sn(spamPct, 1)} phần trăm toàn bộ tin nhắn. Điều này sẽ quan trọng khi đánh giá.` }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: hỏi hàng xóm', section: 'truc-giac',
        scenes: [
          {
            view: 'Points', props: { pts, cls, names: ['setosa', 'versicolor', 'virginica'], xlab: 'chiều dài cánh hoa (cm)', ylab: 'chiều rộng cánh hoa (cm)', xdom: xd, ydom: yd, dot: 6, ...G,
              frames: [{}, { grid: grid(1), read: 'k = <b>1</b>' }, { grid: grid(5), read: 'k = <b>5</b>' }, { grid: grid(20), read: 'k = <b>20</b>' }] },
            init: { f: 0, q: null, nb: '', rg: 0 },
            lines: [
              L('KNN: hãy cho tôi biết bạn bè của bạn là ai, tôi sẽ nói bạn là ai.'),
              L('Một bông hoa lạ dài 4,9 cm, rộng 1,6 cm: tam giác tím.', { q: [4.9, 1.6] }, { say: 'Một bông hoa lạ dài bốn phẩy chín xăng-ti-mét, rộng một phẩy sáu xăng-ti-mét: tam giác tím.' }),
              L(`Tìm 5 bông đã biết loài gần nó nhất. Bông gần nhất cách ${fmt(nb5[0].dist, 3)} cm.`, { nb: nbIdx(q1, 5) }, { say: `Tìm năm bông đã biết loài gần nó nhất. Bông gần nhất cách ${sn(nb5[0].dist, 3)} xăng-ti-mét.` }),
              L(`Năm láng giềng bỏ phiếu: ${v5[1]} phiếu versicolor, ${v5[2]} phiếu virginica. Đa số thắng: versicolor.`, undefined, { say: `Năm láng giềng bỏ phiếu: ${speakNum(String(v5[1]))} phiếu versicolor, ${speakNum(String(v5[2]))} phiếu virginica. Đa số thắng: versicolor.` }),
              L(`Dịch sang 5,0 cm và hỏi 9 láng giềng: ${v9[1]} phiếu versicolor, ${v9[2]} phiếu virginica. Dự đoán lật sang virginica.`, { q: [5.0, 1.6], nb: nbIdx(q2, 9) }, { say: `Dịch sang năm xăng-ti-mét và hỏi chín láng giềng: ${speakNum(String(v9[1]))} phiếu versicolor, ${speakNum(String(v9[2]))} phiếu virginica. Dự đoán lật sang virginica.` }),
              L('Không có tham số nào để học. Toàn bộ dữ liệu huấn luyện chính là mô hình.', { q: null, nb: '' }),
              L('Tô màu mọi điểm trên mặt phẳng theo dự đoán. Với k = 1, ranh giới lởm chởm, uốn theo từng bông hoa.', { f: 1, rg: 1 }, { say: 'Tô màu mọi điểm trên mặt phẳng theo dự đoán. Với k bằng một, ranh giới lởm chởm, uốn theo từng bông hoa.' }),
              L('Tăng k lên 5, rồi 20: ranh giới mượt dần, bớt bị một bông lạc loài kéo đi.', { f: 3 }, { anim: 'line', ease: 'lin', say: 'Tăng k lên năm, rồi hai mươi: ranh giới mượt dần, bớt bị một bông lạc loài kéo đi.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Naive Bayes: mỗi từ là một bằng chứng', items: [
              'Có từ <b>"free"</b>: khả năng là rác tăng lên.',
              'Thêm <b>"prize"</b>: tăng nữa. Thêm <b>"mum"</b>: giảm đi.',
              'Cộng dồn mọi bằng chứng, <b>như thể các từ độc lập</b>.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Naive Bayes nghĩ khác: mỗi từ trong tin nhắn là một bằng chứng.'),
              L('Một tin có từ free: khả năng là rác tăng lên.', { n: 1, hl: 0 }),
              L('Thêm prize, tăng nữa. Thêm mum, giảm đi.', { n: 2, hl: 1 }),
              L('Naive Bayes cộng dồn các bằng chứng đó, mỗi từ một lần, như thể chúng độc lập với nhau. Giả định đó ngây thơ, vì thế mới có tên Naive, nhưng lại chạy rất tốt.', { n: 3, hl: 2 }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: đếm từ', section: 'tinh-tay',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'KNN: chỉ cần khoảng cách', items: [
              { label: 'Euclid', tex: String.raw`d = \sqrt{(\cx{a} - a_q)^2 + (\cx{b} - b_q)^2}` },
              { label: 'Gần nhất', tex: String.raw`d = \sqrt{(${fmt(nb5[0].da + 4.9, 1).replace(',', '{,}')} - 4{,}9)^2 + (${fmt(nb5[0].db + 1.6, 1).replace(',', '{,}')} - 1{,}6)^2} = ${fmt(nb5[0].dist, 3).replace(',', '{,}')}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Với KNN, phép tính duy nhất là khoảng cách Euclid: định lý Pythagoras trên mặt phẳng.', { n: 1, hl: 0 }),
              L(`Bông gần nhất dài ${fmt(nb5[0].da + 4.9, 1)}, rộng ${fmt(nb5[0].db + 1.6, 1)}. Khoảng cách: ${fmt(nb5[0].dist, 3)} cm.`, { n: 2, hl: 1 }, { say: `Bông gần nhất dài ${sn(nb5[0].da + 4.9, 1)}, rộng ${sn(nb5[0].db + 1.6, 1)}. Khoảng cách: ${sn(nb5[0].dist, 3)} xăng-ti-mét.` }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: '"Call now for your free prize" — học từ 6 tin nhắn',
              cols: ['Từ', 'Gặp trong rác', 'Gặp trong thường', 'log P(từ | rác)', 'log P(từ | thường)'],
              cls: ['t', '', '', 'v-pos', 'v-neg'],
              rows: [
                ...tok(sA).map((t) => [t.token, String(t.count[1]), String(t.count[0]), fmt(t.logp[1], 3), fmt(t.logp[0], 3)]),
                ['Tổng (kèm log tiên nghiệm)', '', '', fmt(sA.joint[1], 3), fmt(sA.joint[0], 3)],
              ],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Naive Bayes "huấn luyện" chỉ bằng cách đếm. Lấy 6 tin nhắn thật, 3 tin rác và 3 tin thường, đếm mỗi từ xuất hiện bao nhiêu lần ở mỗi loại.', { n: tok(sA).length }, { anim: 2, say: 'Naive Bayes huấn luyện chỉ bằng cách đếm. Lấy sáu tin nhắn thật, ba tin rác và ba tin thường, đếm mỗi từ xuất hiện bao nhiêu lần ở mỗi loại.' }),
              L('Chấm điểm tin mới: "Call now for your free prize". Chỉ những từ đã gặp mới được tính, từ lạ bị bỏ qua.'),
              L('Để ý từ call: nó có trong cả tin rác lẫn tin thường, nhưng nhiều hơn ở tin rác, nên kéo về phía rác một chút.', { hl: 0 }),
              L(`Cộng log xác suất: điểm rác ${fmt(sA.joint[1], 3)}, điểm thường ${fmt(sA.joint[0], 3)}. Điểm rác cao hơn.`, { n: tok(sA).length + 1, hl: tok(sA).length }, { say: `Cộng lô-ga-rít xác suất: điểm rác ${sn(sA.joint[1], 3)}, điểm thường ${sn(sA.joint[0], 3)}. Điểm rác cao hơn.` }),
              L(`Đổi ra xác suất: ${fmt(100 * sA.pSpam, 1)}% là tin rác.`, { hl: -1 }, { say: `Đổi ra xác suất: ${sn(100 * sA.pSpam, 1)} phần trăm là tin rác.` }),
              L(`Còn "Please call me later": điểm rác ${fmt(sB.joint[1], 3)}, điểm thường ${fmt(sB.joint[0], 3)}, chỉ ${fmt(100 * sB.pSpam, 1)}% là rác. Không chặn.`, undefined, { say: `Còn tin please call me later: điểm rác ${sn(sB.joint[1], 3)}, điểm thường ${sn(sB.joint[0], 3)}, chỉ ${sn(100 * sB.pSpam, 1)} phần trăm là rác. Không chặn.` }),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Một từ, một con số', items: [
              { label: 'Làm mịn', tex: String.raw`P(\text{call} \mid \text{rác}) = \frac{n + \alpha}{N + \alpha|V|} = \frac{${call.count[1]} + 1}{${mini.totals[1]} + ${V}}` },
              { label: 'Log', tex: String.raw`\log P(\text{call} \mid \text{rác}) = ${fmt(call.logp[1], 3).replace(',', '{,}')} \qquad \log P(\text{call} \mid \text{thường}) = ${fmt(call.logp[0], 3).replace(',', '{,}')}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Mỗi con số trong bảng tính thế nào? Lấy từ call. Nó xuất hiện ${call.count[1]} lần trong các tin rác, và ${call.count[0]} lần trong tin thường.`, undefined, { say: `Mỗi con số trong bảng tính thế nào? Lấy từ call. Nó xuất hiện ${speakNum(String(call.count[1]))} lần trong các tin rác, và ${speakNum(String(call.count[0]))} lần trong tin thường.` }),
              L(`Cộng 1 vào số đếm, chia cho tổng số từ của tin rác cộng kích thước từ điển: ${call.count[1]} cộng 1, chia ${mini.totals[1]} cộng ${V}.`, { n: 1, hl: 0 }, { say: `Cộng một vào số đếm, chia cho tổng số từ của tin rác cộng kích thước từ điển: ${speakNum(String(call.count[1]))} cộng một, chia ${speakNum(String(mini.totals[1]))} cộng ${speakNum(String(V))}.` }),
              L(`Lấy log được ${fmt(call.logp[1], 3)} cho tin rác, so với ${fmt(call.logp[0], 3)} cho tin thường: call nghiêng về phía rác.`, { n: 2, hl: 1 }, { say: `Lấy lô-ga-rít được ${sn(call.logp[1], 3)} cho tin rác, so với ${sn(call.logp[0], 3)} cho tin thường: call nghiêng về phía rác.` }),
              L(`Còn từ now chưa từng xuất hiện trong tin thường. Nhờ có cộng 1, nó vẫn có xác suất khác 0 ở đó: log bằng ${fmt(now.logp[0], 3)}, thay vì âm vô cùng.`, undefined, { say: `Còn từ now chưa từng xuất hiện trong tin thường. Nhờ có cộng một, nó vẫn có xác suất khác không ở đó: lô-ga-rít bằng ${sn(now.logp[0], 3)}, thay vì âm vô cùng.` }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'KNN và Naive Bayes trong công thức', items: [
              { label: 'KNN', tex: String.raw`\hat y(q) = \arg\max_c \sum_{i \in N_k(q)} [\,y_i = c\,]` },
              { label: 'Bayes', tex: String.raw`P(c \mid w_1,\dots,w_m) \;\propto\; P(c)\prod_{j} P(w_j \mid c)` },
              { label: 'Lấy log', tex: String.raw`\log P(c) + \sum_j \log \frac{n_{c,w_j} + \alpha}{N_c + \alpha |V|}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('KNN viết thành công thức: trong k láng giềng gần nhất, lớp nào nhiều phiếu nhất thì thắng.', { n: 1, hl: 0 }),
              L('Vì khoảng cách cộng trực tiếp các chiều, mọi đặc trưng phải cùng thang đo. Một cột tính bằng mi-li-mét sẽ áp đảo cột tính bằng mét.'),
              L('KNN không có bước huấn luyện, nhưng mỗi lần dự đoán phải tính khoảng cách tới toàn bộ dữ liệu.'),
              L('Với hàng triệu điểm, người ta dùng cấu trúc dữ liệu như cây k-d để tìm láng giềng nhanh mà không phải đo tới từng điểm.', undefined, { say: 'Với hàng triệu điểm, người ta dùng cấu trúc dữ liệu như cây k d để tìm láng giềng nhanh mà không phải đo tới từng điểm.' }),
              L('Naive Bayes dùng định lý Bayes: xác suất lớp nhân với xác suất của từng từ trong lớp đó.', { n: 2, hl: 1 }),
              L('Tích nhiều số nhỏ dễ tràn về 0 trên máy tính, nên ta lấy log để biến tích thành tổng.', { n: 3, hl: 2 }, { say: 'Tích nhiều số nhỏ dễ tràn về không trên máy tính, nên ta lấy lô-ga-rít để biến tích thành tổng.' }),
              L('Hằng số α = 1 là làm mịn Laplace. Không có nó, một từ chưa từng gặp trong tin thường sẽ có xác suất 0, và một từ đó đủ để lật cả kết quả.', undefined, { say: 'Hằng số an-pha bằng một là làm mịn Laplace. Không có nó, một từ chưa từng gặp trong tin thường sẽ có xác suất bằng không, và một từ đó đủ để lật cả kết quả.' }),
              L('Naive Bayes thì ngược lại với KNN: huấn luyện chỉ là đếm, một lượt qua dữ liệu, và dự đoán chỉ cần cộng vài con số. Nhanh đến mức nó từng là bộ lọc thư rác chuẩn của các hộp thư điện tử.', { hl: -1 }),
              L('Giả định độc lập rõ ràng là sai: free và prize hay đi cùng nhau. Nhưng ta chỉ cần biết lớp nào điểm cao hơn, và thứ hạng đó thường vẫn đúng.'),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'knn.py', code: knnPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('KNN tự viết bằng NumPy chỉ trong vài dòng.'),
              L('Tính khoảng cách tới mọi bông hoa trong tập huấn luyện.', { a: 11, b: 11 }),
              L('Sắp xếp, lấy k bông gần nhất, rồi đếm phiếu.', { a: 12, b: 14 }),
              L('Ở bước 6, bạn sẽ thấy thêm Naive Bayes của scikit-learn, dùng đúng từ điển và bảng đếm của trang này.', { a: 0, b: 0 }, { say: 'Ở bước sáu, bạn sẽ thấy thêm Naive Bayes của scikit-learn, dùng đúng từ điển và bảng đếm của trang này.' }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Đánh giá', section: 'danh-gia',
        scenes: [
          {
            view: 'Table',
            props: {
              title: 'Chọn k cho KNN',
              cols: ['k', 'Huấn luyện', 'Test (30 bông)'],
              cls: ['', '', ''],
              rows: [1, 5, 20].map((k, i) => [String(k), `${fmt(100 * accs[i][0], 1)}%`, `${fmt(100 * accs[i][1], 1)}%`]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`k = 1: đúng ${fmt(100 * accs[0][0], 1)}% trên tập huấn luyện, gần như hoàn hảo, vì mỗi bông tự là láng giềng gần nhất của chính nó. Trên test chỉ ${fmt(100 * accs[0][1], 1)}%.`, { n: 1, hl: 0 }, {
                say: `k bằng một: đúng ${sn(100 * accs[0][0], 1)} phần trăm trên tập huấn luyện, gần như hoàn hảo, vì mỗi bông tự là láng giềng gần nhất của chính nó. Trên test chỉ ${sn(100 * accs[0][1], 1)} phần trăm.`,
              }),
              L(`k = 5: ${fmt(100 * accs[1][1], 1)}% trên test, tốt nhất.`, { n: 2, hl: 1 }, { say: `k bằng năm: ${sn(100 * accs[1][1], 1)} phần trăm trên test, tốt nhất.` }),
              L(`k = 20: lại xuống ${fmt(100 * accs[2][1], 1)}%. Hỏi quá nhiều hàng xóm thì hàng xóm ở xa cũng được tính.`, { n: 3, hl: 2 }, { say: `k bằng hai mươi: lại xuống ${sn(100 * accs[2][1], 1)} phần trăm. Hỏi quá nhiều hàng xóm thì hàng xóm ở xa cũng được tính.` }),
              L('Tập test chỉ có 30 bông, mỗi bông sai làm độ chính xác giảm hơn 3 điểm. Chương 8 sẽ dùng cross-validation để chọn k chắc chắn hơn.', { hl: -1 }, { say: 'Tập test chỉ có ba mươi bông, mỗi bông sai làm độ chính xác giảm hơn ba điểm. Chương tám sẽ dùng cross-validation để chọn k chắc chắn hơn.' }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Độ chính xác theo k', series: [{ name: 'huấn luyện', pts: kCurve.map(([k, a]) => [k, a]), color: 0, dots: true }, { name: 'test (30 bông)', pts: kCurve.map(([k, , b]) => [k, b]), color: 1, dots: true }], xlab: 'k', ylab: 'độ chính xác', xdom: [0, 31], ydom: [0.85, 1.005], xfmt: 'int', yfmt: 'pct' },
            init: { n: 2, t: 0, hl: -1 },
            lines: [
              L('Vẽ cả hai đường cho k từ 1 đến 30.', { t: 1 }, { anim: 'line', ease: 'lin', say: 'Vẽ cả hai đường cho k từ một đến ba mươi.' }),
              L('Đường huấn luyện cao nhất ở k nhỏ: mô hình nhớ từng bông. Đường test thì nhảy lên xuống từng bậc 3,3%, vì mỗi bậc là đúng một bông hoa.', { hl: 1 }, { say: 'Đường huấn luyện cao nhất ở k nhỏ: mô hình nhớ từng bông. Đường test thì nhảy lên xuống từng bậc ba phẩy ba phần trăm, vì mỗi bậc là đúng một bông hoa.' }),
              L('Một tập test nhỏ như vậy không đủ để chọn k một cách chắc chắn.', { hl: -1 }),
            ],
          },
          {
            view: 'Grid',
            props: {
              title: `Bộ lọc tin rác trên ${sms.test.length.toLocaleString('vi-VN')} tin test`,
              mats: [{ title: `Độ chính xác ${fmt(100 * accNb, 2)}%`, rows: ['Thật: rác', 'Thật: thường'], cols: ['Chặn', 'Cho qua'], vals: [[scored.filter((s) => s.y === 1 && s.pred === 1).length, fn], [fp, scored.filter((s) => s.y === 0 && s.pred === 0).length]], kind: 'heat', digits: 0, cell: 130 }],
            },
            init: { n: 1, hl: '' },
            lines: [
              L(`Naive Bayes học từ toàn bộ bảng đếm, rồi chấm ${sms.test.length.toLocaleString('vi-VN')} tin test: đúng ${fmt(100 * accNb, 2)}%.`, undefined, { say: `Naive Bayes học từ toàn bộ bảng đếm, rồi chấm ${speakNum(sms.test.length.toLocaleString('vi-VN'))} tin test: đúng ${sn(100 * accNb, 2)} phần trăm.` }),
              L(`Nhưng chỉ ${fmt(spamPct, 1)}% tin là rác, nên luôn đoán "tin thường" cũng đã đạt ${fmt(100 - spamPct, 1)}%. Phải nhìn kỹ hơn.`, undefined, { say: `Nhưng chỉ ${sn(spamPct, 1)} phần trăm tin là rác, nên luôn đoán tin thường cũng đã đạt ${sn(100 - spamPct, 1)} phần trăm. Phải nhìn kỹ hơn.` }),
              L(`${fn} tin rác lọt qua.`, { hl: '0,0,1' }, { say: `${speakNum(String(fn))} tin rác lọt qua.` }),
              L(`Và ${fp} tin thường bị chặn nhầm. Với bộ lọc tin nhắn, chặn nhầm tin của người thân thường tệ hơn để lọt một tin quảng cáo.`, { hl: '0,1,0' }, { say: `Và ${speakNum(String(fp))} tin thường bị chặn nhầm. Với bộ lọc tin nhắn, chặn nhầm tin của người thân thường tệ hơn để lọt một tin quảng cáo.` }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>KNN với đặc trưng khác thang đo</b> → luôn chuẩn hoá trước.',
              '<b>KNN trong nhiều chiều</b> → mọi điểm đều "xa" như nhau.',
              '<b>Quên làm mịn</b> trong Naive Bayes → một từ lạ lật kết quả.',
              '<b>Dữ liệu lệch lớp</b> → nhìn số lọt qua và chặn nhầm.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bốn bẫy thường gặp. Một: KNN với đặc trưng khác thang đo.', { n: 1, hl: 0 }),
              L('Hai: KNN trong nhiều chiều. Khi có hàng trăm đặc trưng, mọi điểm đều xa nhau gần như bằng nhau, và khái niệm láng giềng mất ý nghĩa. Đó là lời nguyền số chiều.', { n: 2, hl: 1 }),
              L('Ba: quên làm mịn trong Naive Bayes.', { n: 3, hl: 2 }),
              L('Bốn: dữ liệu lệch lớp. Đừng chỉ nhìn độ chính xác.', { n: 4, hl: 3 }),
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
              '<b>KNN</b>: k láng giềng gần nhất bỏ phiếu; dữ liệu chính là mô hình.',
              'k nhỏ: ranh giới lởm chởm. k lớn: <b>mượt</b>, nhưng quá lớn thì mờ.',
              '<b>Naive Bayes</b>: đếm từ, cộng log xác suất, giả định các từ độc lập.',
              '<b>Làm mịn Laplace</b> để từ lạ không lật kết quả.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('KNN để k láng giềng gần nhất bỏ phiếu. Không có gì để học: dữ liệu chính là mô hình.', { n: 1, hl: 0 }),
              L('k nhỏ cho ranh giới lởm chởm, k lớn cho ranh giới mượt, nhưng quá lớn thì mờ đi.', { n: 2, hl: 1 }),
              L('Naive Bayes đếm từ, cộng log xác suất, và giả định các từ độc lập với nhau. Làm mịn Laplace giữ cho từ lạ không lật kết quả.', { n: 4, hl: 3 }, { anim: 2, say: 'Naive Bayes đếm từ, cộng lô-ga-rít xác suất, và giả định các từ độc lập với nhau. Làm mịn Laplace giữ cho từ lạ không lật kết quả.' }),
              L('Cả hai là những mốc so sánh rất tốt cho mọi dự án: nhanh, dễ giải thích, và thường khó đánh bại hơn ta tưởng. Hãy luôn thử chúng trước khi dùng một mô hình phức tạp.'),
              L('Chương 5 học cách hỏi một chuỗi câu hỏi có hoặc không: cây quyết định, rừng ngẫu nhiên và boosting, trên dữ liệu tàu Titanic.', { hl: -1 }, { say: 'Chương năm học cách hỏi một chuỗi câu hỏi có hoặc không: cây quyết định, rừng ngẫu nhiên và boosting, trên dữ liệu tàu Titanic.' }),
              L('Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương 5.', undefined, { say: 'Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương năm.' }),
            ],
          },
        ],
      },
    ],
  };
}
