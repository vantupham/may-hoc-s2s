/**
 * Bài giảng chương 8: đánh giá mô hình. Cross-validation và bias–variance với hồi quy đa thức (400 khu vực California),
 * ROC/AUC với hồi quy logistic (Breast Cancer). Số liệu do ml-core tính, cùng thiết lập với các lab của bài.
 */
import housing from '../../data/housing.json';
import cancer from '../../data/cancer.json';
import { polyFit, polyEval, mseOf, crossValPoly, mulberry32, logisticRegressionGD, sigmoid, rocCurve, confusion, fmt } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const pc = (v: number, d = 0) => fmt(100 * v, d);
const spc = (v: number, d = 0) => `${sn(100 * v, d)} phần trăm`;
const big = (v: number) => (v >= 100 ? Math.round(v).toLocaleString('vi-VN') : fmt(v, 3));

export const evalPyCode = `from sklearn.model_selection import KFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import roc_auc_score

# Chuẩn hoá nằm TRONG pipeline: mỗi lần chia, nó chỉ học từ 4 phần huấn luyện
for d in (1, 3, 6, 9):
    mo_hinh = make_pipeline(StandardScaler(), PolynomialFeatures(d), LinearRegression())
    mse = -cross_val_score(mo_hinh, X, y, cv=KFold(5), scoring="neg_mean_squared_error")
    print(f"bậc {d}: MSE từng phần {mse.round(3)}, trung bình {mse.mean():.3f}")

p = LogisticRegression().fit(Xc[~m], yc[~m]).predict_proba(Xc[m])[:, 1]
print("AUC test:", round(roc_auc_score(yc[m], p), 4))`;

export function evalLecture(): Lecture {
  const testSet = new Set(housing.testIds);
  const tr = housing.sample.filter((r) => !testSet.has(r.id)), te = housing.sample.filter((r) => testSet.has(r.id));
  const x = tr.map((r) => r.income), y = tr.map((r) => r.value);
  const xt = te.map((r) => r.income), yt = te.map((r) => r.value);
  const mu = x.reduce((a, v) => a + v, 0) / x.length;
  const sd = Math.sqrt(x.reduce((a, v) => a + (v - mu) ** 2, 0) / x.length);
  const grid = Array.from({ length: 160 }, (_, i) => 0.3 + i * 0.095);
  const curve = (c: number[]) => grid.map((v) => [v, polyEval(c, v, mu, sd)]);
  const fit = (d: number) => polyFit(x, y, d, mu, sd);
  const cloud = { name: 'khu vực huấn luyện', pts: x.map((v, i) => [v, y[i]]), color: 5, dots: true, line: false, r: 3 };
  const nHigh = x.filter((v) => v > 12.1).length;

  const cv3 = crossValPoly(x, y, 3, 5, mu, sd), cv9 = crossValPoly(x, y, 9, 5, mu, sd);
  const avg = (c: typeof cv3) => c.reduce((a, f) => a + f.mse, 0) / c.length;
  const worst9 = cv9.reduce((a, f, i) => (f.mse > cv9[a].mse ? i : a), 0);
  const table = Array.from({ length: 10 }, (_, i) => {
    const d = i + 1, c = fit(d);
    return { d, train: mseOf(c, x, y, mu, sd), cv: avg(crossValPoly(x, y, d, 5, mu, sd)), test: mseOf(c, xt, yt, mu, sd) };
  });
  const T = (d: number) => table[d - 1];
  const bestCv = table.reduce((a, r) => (r.cv < a.cv ? r : a));
  const boots = (d: number) => { const r = mulberry32(77); return Array.from({ length: 20 }, () => { const idx = Array.from({ length: x.length }, () => Math.floor(r() * x.length)); return polyFit(idx.map((i) => x[i]), idx.map((i) => y[i]), d, mu, sd); }); };

  // ROC: mô hình A (bán kính + độ nhám), B (chỉ độ nhám) — như lab ROCLab
  const ct = new Set(cancer.testIds);
  const ctr = cancer.patients.filter((p) => !ct.has(p.id)), cte = cancer.patients.filter((p) => ct.has(p.id));
  const fitLR = (useR: boolean) => {
    const s = logisticRegressionGD(ctr.map((p) => [useR ? p.x1 : 0, p.x2] as [number, number]), ctr.map((p) => p.y), { lr: 1, epochs: 2000, detail: false }).steps.at(-1)!.state;
    return cte.map((p) => sigmoid(s.wNext[0] * (useR ? p.x1 : 0) + s.wNext[1] * p.x2 + s.bNext));
  };
  const yc = cte.map((p) => p.y);
  const pA = fitLR(true), pB = fitLR(false);
  const A = rocCurve(pA, yc), Bc = rocCurve(pB, yc);
  const c5 = confusion(yc, pA, 0.5), c2 = confusion(yc, pA, 0.2);
  const tpr = (c: typeof c5) => c.tp / (c.tp + c.fn), fpr = (c: typeof c5) => c.fp / (c.fp + c.tn);

  return {
    slug: 'danh-gia-mo-hinh',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 8', title: 'Đánh giá mô hình', sub: 'con số độ chính xác đáng tin đến đâu?' },
            lines: [
              L('Chương 8: đánh giá mô hình. Con số độ chính xác của ta đáng tin đến đâu?', undefined, { say: 'Chương tám: đánh giá mô hình. Con số độ chính xác của ta đáng tin đến đâu?' }),
              L('Bài toán: dự đoán giá nhà từ thu nhập bằng một đa thức. Bậc 1 là đường thẳng của chương 1. Bậc cao hơn cho đường cong uốn lượn hơn. Bậc nào tốt nhất?', undefined, { say: 'Bài toán: dự đoán giá nhà từ thu nhập bằng một đa thức. Bậc một là đường thẳng của chương một. Bậc cao hơn cho đường cong uốn lượn hơn. Bậc nào tốt nhất?' }),
              L(`Cách ngây thơ: thử từng bậc, xem bậc nào có sai số thấp nhất trên tập test. Nhưng khi đó ta đã chọn mô hình vì nó làm tốt trên đúng ${te.length} khu vực test. Tập test đã thành một phần của việc huấn luyện.`, undefined, { say: `Cách ngây thơ: thử từng bậc, xem bậc nào có sai số thấp nhất trên tập test. Nhưng khi đó ta đã chọn mô hình vì nó làm tốt trên đúng ${speakNum(String(te.length))} khu vực test. Tập test đã thành một phần của việc huấn luyện.` }),
            ],
          },
          {
            view: 'Chart',
            props: { title: `${x.length} khu vực huấn luyện và ba đa thức`, series: [cloud, { name: 'bậc 1', pts: curve(fit(1)), color: 0 }, { name: 'bậc 3', pts: curve(fit(3)), color: 2 }, { name: 'bậc 9', pts: curve(fit(9)), color: 1 }], xlab: 'thu nhập', ylab: 'giá nhà', xdom: [0, 15.5], ydom: [-0.5, 5.6] },
            init: { n: 1, hl: -1 },
            lines: [
              L(`Dữ liệu là 400 khu vực đã gặp ở chương 1: ${x.length} để huấn luyện, ${te.length} để test.`, undefined, { say: `Dữ liệu là bốn trăm khu vực đã gặp ở chương một: ${speakNum(String(x.length))} để huấn luyện, ${speakNum(String(te.length))} để test.` }),
              L('Thu nhập lệch phải: phần lớn dưới 6, vài khu vực trên 10.', undefined, { say: 'Thu nhập lệch phải: phần lớn dưới sáu, vài khu vực trên mười.' }),
              L(`Và trong ${x.length} khu vực huấn luyện, chỉ có ${nHigh} khu vực thu nhập trên 12, đúng mức bị chặn trần 15,0001. Một điểm đơn độc như vậy có thể quyết định cả hình dạng của một đa thức bậc cao.`, undefined, { say: `Và trong ${speakNum(String(x.length))} khu vực huấn luyện, chỉ có ${speakNum(String(nHigh))} khu vực thu nhập trên mười hai, đúng mức bị chặn trần. Một điểm đơn độc như vậy có thể quyết định cả hình dạng của một đa thức bậc cao.` }),
              L('Bậc 1: đường thẳng.', { n: 2, hl: 1 }, { say: 'Bậc một: đường thẳng.' }),
              L('Bậc 3: hơi cong, bám dữ liệu tốt hơn một chút.', { n: 3, hl: 2 }, { say: 'Bậc ba: hơi cong, bám dữ liệu tốt hơn một chút.' }),
              L('Bậc 9: uốn lượn, và vặn mình về phía khu vực đơn độc ở bên phải.', { n: 4, hl: 3 }, { say: 'Bậc chín: uốn lượn, và vặn mình về phía khu vực đơn độc ở bên phải.' }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: học thuộc hay hiểu bài', section: 'truc-giac',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Học sinh ôn thi', items: [
              '<b>Học thuộc</b> đáp án 20 bài tập: đúng 100% bài đó, lúng túng với đề mới.',
              '<b>Chỉ học một mẹo</b>: sai đều ở mọi đề.',
              '<b>Tự kiểm tra</b>: che một phần bài tập, học phần còn lại, làm thử phần bị che.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Hình dung một học sinh ôn thi. Nếu chỉ học thuộc đáp án của đúng 20 bài tập trong sách, em sẽ làm đúng 100% bài tập đó, nhưng gặp đề thi mới là lúng túng.', { n: 1, hl: 0 }, { say: 'Hình dung một học sinh ôn thi. Nếu chỉ học thuộc đáp án của đúng hai mươi bài tập trong sách, em sẽ làm đúng hết bài tập đó, nhưng gặp đề thi mới là lúng túng.' }),
              L('Đó là đa thức bậc cao: quá linh hoạt, thuộc lòng cả nhiễu. Người ta gọi là quá khớp, overfitting.'),
              L('Nếu chỉ học một mẹo duy nhất, em sai đều ở mọi đề. Đó là mô hình quá đơn giản, chưa khớp, underfitting.', { n: 2, hl: 1 }),
              L('Cross-validation là cách tự kiểm tra trước kỳ thi: tự che một phần bài tập, học phần còn lại, rồi làm thử phần bị che. Làm vậy nhiều lần với các phần khác nhau để có điểm trung bình đáng tin.', { n: 3, hl: 2 }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: 5 phần', section: 'tinh-tay',
        scenes: [
          {
            view: 'Table',
            props: {
              title: `Cross-validation 5 phần trên ${x.length} khu vực huấn luyện`,
              cols: ['Phần bị che', 'MSE bậc 3', 'MSE bậc 9'],
              cls: ['t', '', ''],
              rows: [...cv3.map((f, i) => [`Phần ${i + 1}`, fmt(f.mse, 4), big(cv9[i].mse)]), ['Trung bình', fmt(avg(cv3), 3), big(avg(cv9))]],
            },
            init: { n: 0, hl: -1, hc: -1 },
            lines: [
              L(`Chia ${x.length} khu vực huấn luyện thành 5 phần. Lần lượt che từng phần, học trên 4 phần còn lại, rồi đo sai số trên phần bị che.`, { n: 5 }, { anim: 3, ease: 'lin', say: `Chia ${speakNum(String(x.length))} khu vực huấn luyện thành năm phần. Lần lượt che từng phần, học trên bốn phần còn lại, rồi đo sai số trên phần bị che.` }),
              L(`Với bậc 3, năm con số dao động từ ${fmt(Math.min(...cv3.map((f) => f.mse)), 2)} đến ${fmt(Math.max(...cv3.map((f) => f.mse)), 2)}: cùng một cỡ, chỉ khác vì mỗi phần có những khu vực dễ, khó khác nhau. Trung bình ${fmt(avg(cv3), 3)}.`, { n: 6, hc: 1, hl: 5 }, { say: `Với bậc ba, năm con số dao động từ ${sn(Math.min(...cv3.map((f) => f.mse)), 2)} đến ${sn(Math.max(...cv3.map((f) => f.mse)), 2)}: cùng một cỡ, chỉ khác vì mỗi phần có những khu vực dễ, khó khác nhau. Trung bình ${sn(avg(cv3), 3)}.` }),
              L(`Với bậc 9, phần ${worst9 + 1} có MSE lên tới ${big(cv9[worst9].mse)}, trong khi bậc 3 ở cùng phần đó chỉ ${fmt(cv3[worst9].mse, 4)}.`, { hc: 2, hl: worst9 }, { say: `Với bậc chín, phần ${speakNum(String(worst9 + 1))} có sai số lên tới ${speakNum(big(cv9[worst9].mse))}, trong khi bậc ba ở cùng phần đó chỉ ${sn(cv3[worst9].mse, 4)}.` }),
              L('Đó là phần chứa khu vực thu nhập 15,0001. Khi nó bị che, mô hình học trên những khu vực có thu nhập thấp hơn nhiều, rồi phải đoán ở một nơi xa tít. Đa thức bậc 9 phóng vọt lên trời.', undefined, { say: 'Đó là phần chứa khu vực thu nhập cao nhất. Khi nó bị che, mô hình học trên những khu vực có thu nhập thấp hơn nhiều, rồi phải đoán ở một nơi xa tít. Đa thức bậc chín phóng vọt lên trời.' }),
              L(`Trung bình của bậc 9 là ${big(avg(cv9))}. Cross-validation đã bắt được mô hình nguy hiểm này, dù tập test không hề thấy.`, { hl: 5 }, { say: `Trung bình của bậc chín là ${speakNum(big(avg(cv9)))}. Cross-validation đã bắt được mô hình nguy hiểm này, dù tập test không hề thấy.` }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết: bias, variance, ROC', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Ba tập dữ liệu và phân tích sai số', items: [
              { label: 'Cross-validation', tex: String.raw`\text{CV} = \frac{1}{K}\sum_{k=1}^{K} \text{MSE}\big(\hat f^{(-k)}, D_k\big)` },
              { label: 'Bias–variance', tex: String.raw`\mathbb{E}\big[(y - \hat f(x))^2\big] = \text{bias}^2 + \text{variance} + \sigma^2` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ba tập dữ liệu, ba vai trò. Tập huấn luyện để học tham số. Tập kiểm định để chọn siêu tham số, như bậc đa thức, k hay C. Tập test để báo cáo một lần duy nhất, ở cuối.'),
              L('Cross-validation tận dụng dữ liệu bằng cách cho mỗi phần lần lượt làm tập kiểm định, rồi lấy trung bình.', { n: 1, hl: 0 }),
              L('Thường chia 5 hoặc 10 phần. Chia càng nhiều phần thì mỗi lần học trên nhiều dữ liệu hơn, nhưng phải huấn luyện nhiều lần hơn. Cực đoan nhất là mỗi phần chỉ một mẫu, gọi là để-lại-một.', undefined, { say: 'Thường chia năm hoặc mười phần. Chia càng nhiều phần thì mỗi lần học trên nhiều dữ liệu hơn, nhưng phải huấn luyện nhiều lần hơn. Cực đoan nhất là mỗi phần chỉ một mẫu, gọi là để lại một.' }),
              L('Tưởng tượng thu thập lại dữ liệu nhiều lần và huấn luyện lại. Sai số kỳ vọng tách thành ba phần.', { n: 2, hl: 1 }),
              L('Bias: mô hình sai một cách có hệ thống, vì quá đơn giản. Variance: mô hình đổi nhiều khi dữ liệu đổi, vì quá linh hoạt. Và nhiễu: phần không mô hình nào giảm được.'),
              L('Ở đây nhiễu rất lớn: giá nhà còn phụ thuộc vị trí, tuổi nhà, trường học, và vô số điều mà thu nhập không nói được.'),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Bậc 1: 20 lần lấy mẫu lại', series: [cloud, ...boots(1).map((c) => ({ name: '', pts: curve(c), color: 0, faint: true }))], xlab: 'thu nhập', ylab: 'giá nhà', xdom: [0, 15.5], ydom: [-0.5, 5.6] },
            init: { n: 21 },
            lines: [
              L('Học bậc 1 trên 20 mẫu lấy lại khác nhau từ cùng dữ liệu. 20 đường thẳng gần như trùng nhau: variance thấp.', undefined, { say: 'Học bậc một trên hai mươi mẫu lấy lại khác nhau từ cùng dữ liệu. Hai mươi đường thẳng gần như trùng nhau: variance thấp.' }),
              L('Nhưng chúng cùng bỏ lỡ chỗ cong của dữ liệu: đó là bias.'),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Bậc 9: 20 lần lấy mẫu lại', series: [cloud, ...boots(9).map((c) => ({ name: '', pts: curve(c), color: 1, faint: true }))], xlab: 'thu nhập', ylab: 'giá nhà', xdom: [0, 15.5], ydom: [-0.5, 5.6] },
            init: { n: 21 },
            lines: [
              L('Bậc 9: các đường toả ra như một chiếc quạt, nhất là ở vùng thu nhập cao, nơi dữ liệu thưa. Variance rất cao.', undefined, { say: 'Bậc chín: các đường toả ra như một chiếc quạt, nhất là ở vùng thu nhập cao, nơi dữ liệu thưa. Variance rất cao.' }),
              L('Mô hình tốt nằm ở giữa: đủ linh hoạt để bắt được hình dạng thật, đủ ổn định để không đổi theo từng mẫu.'),
              L('Đây là đánh đổi cốt lõi của học máy: giảm bias thường làm tăng variance, và ngược lại. Mọi kỹ thuật chọn mô hình đều là cách tìm điểm cân bằng giữa hai thứ đó.'),
              L('Thêm dữ liệu giúp giảm variance: các đường sẽ chụm lại. Nhưng thêm dữ liệu không chữa được bias: đường thẳng vẫn là đường thẳng.'),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'ROC trên 114 bệnh nhân test', series: [{ name: `A: bán kính + độ nhám (AUC ${fmt(A.auc, 3)})`, pts: A.pts.map((p) => [p.fpr, p.tpr]), color: 1 }, { name: `B: chỉ độ nhám (AUC ${fmt(Bc.auc, 3)})`, pts: Bc.pts.map((p) => [p.fpr, p.tpr]), color: 0 }, { name: 'đoán bừa', pts: [[0, 0], [1, 1]], color: 5, dash: true }], xlab: 'tỷ lệ báo nhầm (FPR)', ylab: 'tỷ lệ bắt được (TPR)', xdom: [0, 1], ydom: [0, 1], xfmt: 'pct', yfmt: 'pct' },
            init: { n: 0, hl: -1 },
            lines: [
              L('Với phân loại, mỗi ngưỡng cho một cặp số: tỷ lệ báo nhầm, và tỷ lệ bắt được ca ác tính.'),
              L('Tỷ lệ bắt được là số ca ác tính được báo, chia tổng số ca ác tính. Tỷ lệ báo nhầm là số ca lành tính bị báo ác, chia tổng số ca lành tính.'),
              L('Hạ ngưỡng từ cao xuống thấp, nối mọi cặp lại: đó là đường ROC.', { n: 1, hl: 0 }),
              L(`Mô hình A dùng cả bán kính và độ nhám: AUC, diện tích dưới đường cong, là ${fmt(A.auc, 3)}.`, undefined, { say: `Mô hình A dùng cả bán kính và độ nhám: diện tích dưới đường cong, gọi là AUC, bằng ${sn(A.auc, 3)}.` }),
              L(`Mô hình B chỉ dùng độ nhám: AUC ${fmt(Bc.auc, 3)}, tệ hơn hẳn.`, { n: 2, hl: 1 }, { say: `Mô hình B chỉ dùng độ nhám: AUC ${sn(Bc.auc, 3)}, tệ hơn hẳn.` }),
              L('AUC bằng 1 là phân biệt hoàn hảo, 0,5 là đoán bừa, đường chéo. AUC giúp so mô hình trước khi chọn ngưỡng.', { n: 3, hl: -1 }, { say: 'AUC bằng một là phân biệt hoàn hảo, không phẩy năm là đoán bừa, tức đường chéo. AUC giúp so mô hình trước khi chọn ngưỡng.' }),
              L(`Ngưỡng 0,5 bắt được ${pc(tpr(c5))}% ca ác tính, báo nhầm ${pc(fpr(c5))}%. Ngưỡng 0,2 bắt được ${pc(tpr(c2))}%, nhưng báo nhầm lên ${pc(fpr(c2))}%.`, undefined, { say: `Ngưỡng năm mươi phần trăm bắt được ${spc(tpr(c5))} ca ác tính, báo nhầm ${spc(fpr(c5))}. Ngưỡng hai mươi phần trăm bắt được ${spc(tpr(c2))}, nhưng báo nhầm lên ${spc(fpr(c2))}.` }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'danh_gia.py', code: evalPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Trong scikit-learn, đặt mọi bước tiền xử lý vào một Pipeline.', { a: 9, b: 9 }),
              L('Khi đó cross_val_score học lại bộ chuẩn hoá trong từng lần chia, chỉ trên 4 phần huấn luyện. Đó là cách tránh rò rỉ dữ liệu.', { a: 7, b: 11 }, { say: 'Khi đó hàm cross val score học lại bộ chuẩn hoá trong từng lần chia, chỉ trên bốn phần huấn luyện. Đó là cách tránh rò rỉ dữ liệu.' }),
              L('Kết quả vì thế hơi khác phòng thí nghiệm ở bước 4, vốn dùng trung bình của cả tập huấn luyện cho đơn giản.', { a: 0, b: 0 }, { say: 'Kết quả vì thế hơi khác phòng thí nghiệm ở bước bốn, vốn dùng trung bình của cả tập huấn luyện cho đơn giản.' }),
              L('Cuối cùng là AUC của hồi quy logistic trên tập test.', { a: 13, b: 14 }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Toàn bộ: chọn bậc', section: 'danh-gia',
        scenes: [
          {
            view: 'Chart',
            props: { title: 'Sai số theo bậc đa thức', series: [{ name: 'huấn luyện', pts: table.map((r) => [r.d, r.train]), color: 0, dots: true }, { name: 'cross-validation', pts: table.map((r) => [r.d, r.cv]), color: 1, dots: true }, { name: 'test', pts: table.map((r) => [r.d, r.test]), color: 2, dots: true, dash: true }], xlab: 'bậc đa thức', ylab: 'MSE', xdom: [0.5, 10.5], ydom: [0.6, 1.0], xfmt: 'int' },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Sai số huấn luyện luôn giảm khi bậc tăng: từ ${fmt(T(1).train, 4)} ở bậc 1 xuống ${fmt(T(9).train, 4)} ở bậc 9. Mô hình linh hoạt hơn thì khớp tập huấn luyện tốt hơn.`, { n: 1, hl: 0 }, { say: `Sai số huấn luyện luôn giảm khi bậc tăng: từ ${sn(T(1).train, 4)} ở bậc một xuống ${sn(T(9).train, 4)} ở bậc chín. Mô hình linh hoạt hơn thì khớp tập huấn luyện tốt hơn.` }),
              L(`Đường cross-validation giảm nhẹ, thấp nhất ở bậc ${bestCv.d}, rồi vọt lên khỏi khung hình.`, { n: 2, hl: 1 }, { say: `Đường cross-validation giảm nhẹ, thấp nhất ở bậc ${speakNum(String(bestCv.d))}, rồi vọt lên khỏi khung hình.` }),
              L(`Đường test thì khá phẳng: bậc 1 là ${fmt(T(1).test, 4)}, bậc 4 là ${fmt(T(4).test, 4)}, bậc 9 là ${fmt(T(9).test, 4)}.`, { n: 3, hl: 2 }, { say: `Đường test thì khá phẳng: bậc một là ${sn(T(1).test, 4)}, bậc bốn là ${sn(T(4).test, 4)}, bậc chín là ${sn(T(9).test, 4)}.` }),
              L(`Vậy quy trình đúng: chọn bậc ${bestCv.d} nhờ cross-validation, huấn luyện lại trên cả ${x.length} khu vực, rồi mới mở tập test đúng một lần để báo cáo.`, undefined, { say: `Vậy quy trình đúng: chọn bậc ${speakNum(String(bestCv.d))} nhờ cross-validation, huấn luyện lại trên cả ${speakNum(String(x.length))} khu vực, rồi mới mở tập test đúng một lần để báo cáo.` }),
              L('Vì sao đường test lại phẳng? Mọi khu vực test đều nằm trong vùng thu nhập dày dữ liệu. Nhìn tập test, ta sẽ tưởng bậc 9 vô hại. Cross-validation cho thấy nó có thể phát điên với một khu vực mới ở vùng thưa.', { hl: -1 }, { say: 'Vì sao? Mọi khu vực test đều nằm trong vùng thu nhập dày dữ liệu. Nhìn tập test, ta sẽ tưởng bậc chín vô hại. Cross-validation cho thấy nó có thể phát điên với một khu vực mới ở vùng thưa.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Chọn mô hình bằng tập test</b> → test chỉ dùng một lần, ở cuối.',
              '<b>Rò rỉ</b> → mọi bước tiền xử lý vào pipeline.',
              '<b>Chia ngẫu nhiên khi có nhóm hoặc thời gian</b>.',
              '<b>Tin con số của tập test nhỏ</b> → báo cáo cả độ lệch giữa các phần.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bốn bẫy thường gặp. Một: chọn mô hình bằng tập test. Mọi lựa chọn phải dựa trên cross-validation.', { n: 1, hl: 0 }),
              L('Hai: rò rỉ. Chuẩn hoá hay điền dữ liệu thiếu trên toàn bộ dữ liệu trước khi chia.', { n: 2, hl: 1 }),
              L('Ba: chia ngẫu nhiên khi dữ liệu có nhóm, hoặc theo thời gian. Dự báo tương lai thì tập kiểm định phải nằm sau tập huấn luyện.', { n: 3, hl: 2 }),
              L(`Bốn: tin vào con số của một tập test nhỏ. Với ${te.length} mẫu, khoảng tin cậy rất rộng. Hãy báo cáo cả độ lệch giữa các phần.`, { n: 4, hl: 3 }, { say: `Bốn: tin vào con số của một tập test nhỏ. Với ${speakNum(String(te.length))} mẫu, khoảng tin cậy rất rộng. Hãy báo cáo cả độ lệch giữa các phần.` }),
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
              '<b>Huấn luyện</b> học tham số, <b>kiểm định</b> chọn mô hình, <b>test</b> báo cáo một lần.',
              '<b>Cross-validation</b> cho điểm trung bình đáng tin, và bắt được mô hình bất ổn.',
              'Sai số = <b>bias² + variance + nhiễu</b>.',
              '<b>ROC, AUC</b> so mô hình phân loại trước khi chọn ngưỡng.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Huấn luyện để học tham số, kiểm định để chọn mô hình, test để báo cáo một lần duy nhất.', { n: 1, hl: 0 }),
              L('Cross-validation cho một điểm trung bình đáng tin, và bắt được những mô hình bất ổn mà một tập test nhỏ bỏ lọt.', { n: 2, hl: 1 }),
              L('Sai số gồm bias, variance và nhiễu. Mô hình quá đơn giản thì bias cao, quá linh hoạt thì variance cao.', { n: 3, hl: 2 }),
              L('Với phân loại, đường ROC và AUC giúp so mô hình trước khi chọn ngưỡng.', { n: 4, hl: 3 }),
              L('Một con số đánh giá chỉ có nghĩa khi bạn biết nó được đo trên dữ liệu nào, và dữ liệu được chia ra sao.'),
              L('Chương 9 bước vào mạng nơ-ron: nơ-ron, hàm kích hoạt, và lan truyền ngược từng con số.', { hl: -1 }, { say: 'Chương chín bước vào mạng nơ-ron: nơ-ron, hàm kích hoạt, và lan truyền ngược từng con số.' }),
              L('Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương 9.', undefined, { say: 'Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương chín.' }),
            ],
          },
        ],
      },
    ],
  };
}
