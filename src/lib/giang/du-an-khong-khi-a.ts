/**
 * Bài giảng chương 12A: dự án bụi mịn Hà Nội (A). Số liệu ngày (hanoi-air.json) và kết quả mô hình tính sẵn
 * bằng scripts/prep_ch12.py (hanoi-results.json), như mọi lab của bài. Phần tính tay chạy ml-core (ols, linearRegressionGD).
 */
import air from '../../data/hanoi-air.json';
import res from '../../data/hanoi-results.json';
import { ols, linearRegressionGD, fmt } from '../ml-core';
import { buildRows, type Air } from '../khongkhi';
import { duAnALearn } from '../hoc/du-an-khong-khi-a';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const rec = (id: string) => duAnALearn.missions.find((m) => m.id === id)!.record!.rows;
const UG = 'µg/m³';
const sUG = 'mi-crô-gam trên mét khối';

export function duAnALecture(): Lecture {
  const A = air as unknown as Air;
  const days = A.days, meta = A.meta;
  const yr = (d: string) => { const [y, m, dd] = d.split('-').map(Number); return y + (Date.UTC(y, m - 1, dd) - Date.UTC(y, 0, 1)) / (365.25 * 864e5); };
  const series = days.filter((d) => d.pm !== null).map((d) => [yr(d.d), d.pm as number]);
  const jan26 = days.filter((d) => d.d.startsWith('2026-01') && d.pm !== null);
  const over = jan26.filter((d) => (d.pm as number) > meta.thr).length;
  const worst = days.filter((d) => d.d >= '2025-11-01' && d.d < '2026-04-01' && d.pm !== null).reduce((a, d) => ((d.pm as number) > (a.pm as number) ? d : a));
  const st = meta.stations;
  const used = st.filter((s) => s.used);
  const s7441 = st.find((s) => s.id === 7441)!;
  const board = Object.fromEntries(res.board.map((b) => [b.id, b])) as Record<string, { name: string; mae: number; mae72: number; auc: number }>;
  const partA = ['persist', 'clim', 'ols1', 'ols', 'knn', 'tree', 'rf', 'gb'];

  // Tính tay: 5 ngày quanh Tết, đơn vị chục µg/m³ (như lab HandFitLab)
  const five = buildRows(days, meta).filter((r) => r.target >= '2025-01-30').slice(0, 5);
  const xs = five.map((r) => Math.round(r.x[0]) / 10), ys = five.map((r) => Math.round(r.y) / 10);
  const exact = ols(xs, ys);
  const gd = linearRegressionGD(xs, ys, { lr: 0.01, epochs: 80 });
  const g80 = gd.steps.at(-1)!.state;

  const alert = rec('canh-bao')[0].values, tree = rec('cay'), svm = rec('svm');
  const imp = Object.entries(res.imp).sort((a, b) => b[1] - a[1]);
  const featVi: Record<string, string> = { pm0: 'PM hôm nay', pm1: 'hôm qua', pm7: 'TB 7 ngày', ws: 'gió', rh: 'độ ẩm', t: 'nhiệt độ', rain: 'mưa', blh: 'lớp biên', north: 'gió bắc', dp: 'Δ áp suất', sin: 'mùa (sin)', cos: 'mùa (cos)' };
  const dm = (d: string) => { const [, m, dd] = d.split('-'); return `${+dd}/${+m}`; };

  return {
    slug: 'du-an-khong-khi-a',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 12A', title: 'Bụi mịn Hà Nội', sub: 'dự án cuối khoá (A): dữ liệu và mô hình cổ điển' },
            lines: [
              L('Chương 12A: dự án cuối khoá. Ta ôn lại chương 0 đến chương 8 trên một bài toán Việt Nam đang diễn ra: bụi mịn PM2.5 ở Hà Nội.', undefined, { say: 'Chương mười hai A: dự án cuối khoá. Ta ôn lại chương không đến chương tám trên một bài toán Việt Nam đang diễn ra: bụi mịn PM hai phẩy năm ở Hà Nội.' }),
            ],
          },
          {
            view: 'Chart',
            props: { title: `PM2.5 trung bình ngày ở Hà Nội (${UG})`, series: [{ name: 'PM2.5', pts: series, color: 6 }], xlab: 'năm', ylab: UG, xdom: [2023, 2026.9], ydom: [0, 180], xfmt: 'year' },
            init: { t: 0, hy: null, vx: null },
            lines: [
              L('Đây là bụi mịn trung bình mỗi ngày ở Hà Nội, từ đầu năm 2023 đến nay.', { t: 1 }, { anim: 'line', ease: 'lin', say: 'Đây là bụi mịn trung bình mỗi ngày ở Hà Nội, từ đầu năm hai nghìn không trăm hai mươi ba đến nay.' }),
              L('Mỗi mùa đông bụi dâng cao, mùa hè thì sạch hơn hẳn.'),
              L(`Ngưỡng ${fmt(meta.thr, 0)} ${UG} trung bình 24 giờ là mức giới hạn của quy chuẩn Việt Nam. Tháng 1 năm 2026 có ${over} trên ${jan26.length} ngày đủ số liệu vượt ngưỡng này.`, { hy: meta.thr }, { say: `Ngưỡng năm mươi ${sUG} trung bình hai mươi bốn giờ là mức giới hạn của quy chuẩn Việt Nam. Tháng một năm hai nghìn không trăm hai mươi sáu có ${speakNum(String(over))} trên ${speakNum(String(jan26.length))} ngày đủ số liệu vượt ngưỡng này.` }),
              L(`Ngày tệ nhất mùa đông vừa rồi, ${dm(worst.d)}/${worst.d.slice(0, 4)}, lên tới ${fmt(worst.pm as number, 0)} ${UG}.`, { vx: yr(worst.d) }, { say: `Ngày tệ nhất mùa đông vừa rồi, ngày ${speakNum(worst.d.slice(8))} tháng ${speakNum(String(+worst.d.slice(5, 7)))} năm ${speakNum(worst.d.slice(0, 4))}, lên tới ${speakNum(fmt(worst.pm as number, 0))} ${sUG}.` }),
              L('Câu hỏi của dự án: từ số liệu đến hết hôm nay, PM2.5 ngày mai là bao nhiêu, và có nên phát cảnh báo không? Vừa là hồi quy, vừa là phân loại.', { vx: null }, { say: 'Câu hỏi của dự án: từ số liệu đến hết hôm nay, PM hai phẩy năm ngày mai là bao nhiêu, và có nên phát cảnh báo không? Vừa là hồi quy, vừa là phân loại.' }),
              L(`Quy ước: mô hình học trên ${res.nTrain} ngày trước tháng 11 năm 2025, và được chấm trên mùa đông 2025–2026: ${res.nTest} ngày, trong đó ${res.alertsTest} ngày vượt ngưỡng.`, undefined, { say: `Quy ước: mô hình học trên ${speakNum(String(res.nTrain))} ngày trước tháng mười một năm hai nghìn không trăm hai mươi lăm, và được chấm trên mùa đông năm đó: ${speakNum(String(res.nTest))} ngày, trong đó ${speakNum(String(res.alertsTest))} ngày vượt ngưỡng.` }),
            ],
          },
        ],
      },
      {
        id: 'kham-pha', title: 'Chặng 1: các trạm đo', section: 'kham-pha',
        scenes: [
          {
            view: 'Table',
            props: {
              title: 'Phiếu khám từng trạm đo (OpenAQ)',
              cols: ['Trạm', 'Tương quan', 'Lệch', 'Dùng?'],
              cls: ['t', '', '', 't'],
              rows: st.map((s) => [s.name, fmt(s.r, 2), `${s.bias > 0 ? '+' : ''}${fmt(s.bias, 1)}`, s.used ? 'có' : s.kind === 'lowcost' ? 'không: giá rẻ' : 'không: lệch nhịp']),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Chặng 1, ôn chương 3: khám dữ liệu. Kho mở OpenAQ lưu số đo của hàng chục nghìn trạm. Quét cả kho, ta tìm được 7 trạm ở Hà Nội.', { n: 7 }, { anim: 3, ease: 'lin', say: 'Chặng một, ôn chương ba: khám dữ liệu. Kho mở OpenAQ lưu số đo của hàng chục nghìn trạm. Quét cả kho, ta tìm được bảy trạm ở Hà Nội.' }),
              L(`Trạm 7441 cũ ghi ${s7441.neg.toLocaleString('vi-VN')} giờ với giá trị −999: một mã lỗi, không phải số đo.`, { hl: st.indexOf(s7441) }, { say: `Trạm bảy bốn bốn một cũ ghi ${speakNum(s7441.neg.toLocaleString('vi-VN'))} giờ với giá trị âm chín trăm chín mươi chín: một mã lỗi, không phải số đo.` }),
              L('Cột tương quan đo mức trạm đó đi cùng các trạm khác. Trạm Minh Khai lệch nhịp, tương quan dưới 0,7, nên bị loại.', { hl: 1 }, { say: 'Cột tương quan đo mức trạm đó đi cùng các trạm khác. Trạm Minh Khai lệch nhịp, tương quan dưới không phẩy bảy, nên bị loại.' }),
              L('Trạm Vinhomes Ocean Park dùng cảm biến giá rẻ, đo cao hơn trung bình khoảng 12 đơn vị, cũng bị loại.', { hl: 5 }, { say: 'Trạm Vinhomes Ocean Park dùng cảm biến giá rẻ, đo cao hơn trung bình khoảng mười hai đơn vị, cũng bị loại.' }),
              L(`Còn lại ${used.length} trạm. Thêm ${meta.qa.cross} ngày-trạm bị loại vì lệch quá xa trung vị của các trạm khác cùng ngày.`, { hl: -1 }, { say: `Còn lại ${speakNum(String(used.length))} trạm. Thêm ${speakNum(String(meta.qa.cross))} ngày trạm bị loại vì lệch quá xa trung vị của các trạm khác cùng ngày.` }),
              L('Mỗi quy tắc kiểm soát chất lượng là một quyết định của người làm dự án, và quyết định nào cũng có thể sai. Hãy ghi lại chúng.'),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Chặng 2: mốc so sánh', section: 'truc-giac',
        scenes: [
          {
            view: 'Table',
            props: {
              title: 'Hai cách dự báo không cần học máy',
              cols: ['Cách dự báo', `Sai số trung bình (${UG})`],
              cls: ['t', ''],
              rows: [[board.persist.name, fmt(board.persist.mae, 2)], [board.clim.name, fmt(board.clim.mae, 2)]],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Chặng 2, ôn chương 8: trước khi học bất kỳ mô hình nào, hỏi xem không cần học máy thì làm được đến đâu.', undefined, { say: 'Chặng hai, ôn chương tám: trước khi học bất kỳ mô hình nào, hỏi xem không cần học máy thì làm được đến đâu.' }),
              L(`Cách 1: ngày mai bằng hôm nay. Sai trung bình ${fmt(board.persist.mae, 2)} ${UG}.`, { n: 1, hl: 0 }, { say: `Cách một: ngày mai bằng hôm nay. Sai trung bình ${sn(board.persist.mae, 2)} ${sUG}.` }),
              L(`Cách 2: lấy trung bình của cùng tháng các năm trước. Sai ${fmt(board.clim.mae, 2)}, còn tệ hơn.`, { n: 2, hl: 1 }, { say: `Cách hai: lấy trung bình của cùng tháng các năm trước. Sai ${sn(board.clim.mae, 2)}, còn tệ hơn.` }),
              L(`Từ giờ, mọi mô hình phải thắng con số ${fmt(board.persist.mae, 1)} thì mới đáng bàn tới.`, { hl: 0 }, { say: `Từ giờ, mọi mô hình phải thắng con số ${sn(board.persist.mae, 1)} thì mới đáng bàn tới.` }),
              L('Chỉ dùng bụi của những ngày qua thì gần như không thể thắng. Thứ giúp được là thời tiết ngày mai: gió, mưa, độ ẩm, lớp không khí sát mặt đất dày hay mỏng.', { hl: -1 }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Chặng 3: Gradient Descent ngày Tết', section: 'tinh-tay',
        scenes: [
          {
            view: 'Table',
            props: {
              title: '5 ngày quanh Tết Ất Tỵ (đơn vị: chục µg/m³)',
              cols: ['Hôm nay', 'x: PM2.5 hôm nay', 'y: PM2.5 ngày mai'],
              cls: ['t', 'v-x', 'v-y'],
              rows: five.map((r, i) => [dm(r.d), fmt(xs[i], 1), fmt(ys[i], 1)]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Chặng 3, ôn chương 0 và 1: mô hình đơn giản nhất có học, ŷ = w·x + b, với x là bụi hôm nay.', { n: 5 }, { anim: 2.5, say: 'Chặng ba, ôn chương không và một: mô hình đơn giản nhất có học, y mũ bằng w nhân x cộng b, với x là bụi hôm nay.' }),
              L('Năm ngày quanh Tết Ất Tỵ, khi bụi giảm đều. Để dễ tính tay, đơn vị là chục microgam.', undefined, { say: 'Năm ngày quanh Tết Ất Tỵ, khi bụi giảm đều. Để dễ tính tay, đơn vị là chục mi-crô-gam.' }),
              L(`Gradient Descent với η = 0,01, 80 vòng: w = ${fmt(g80.wNext, 3)}, b = ${fmt(g80.bNext, 3)}. Nghiệm đóng: w = ${fmt(exact.w, 3)}, b = ${fmt(exact.b, 3)}.`, undefined, { say: `Gradient Descent với ê-ta bằng không phẩy không một, tám mươi vòng: w bằng ${sn(g80.wNext, 3)}, b bằng ${sn(g80.bNext, 3)}. Nghiệm đóng: w bằng ${sn(exact.w, 3)}, b bằng ${sn(exact.b, 3)}.` }),
              L('w đã rất sát, còn b vẫn lệch một chút: đúng như chương 1, cái bát dẹt vì x chưa chuẩn hoá, nên Gradient Descent bò chậm dọc thung lũng.', undefined, { say: 'w đã rất sát, còn b vẫn lệch một chút: đúng như chương một, cái bát dẹt vì x chưa chuẩn hoá, nên Gradient Descent bò chậm dọc thung lũng.' }),
              L(`Trên cả ${res.nTrain} ngày huấn luyện, nghiệm đóng cho w = ${fmt(res.ols1.w, 3)}: ngày mai khoảng ${Math.round(res.ols1.w * 100)}% của hôm nay, cộng thêm một ít. Sai số trên mùa đông: ${fmt(board.ols1.mae, 2)}, chỉ nhỉnh hơn mốc một chút.`, undefined, { say: `Trên cả ${speakNum(String(res.nTrain))} ngày huấn luyện, nghiệm đóng cho w bằng ${sn(res.ols1.w, 3)}: ngày mai khoảng ${speakNum(String(Math.round(res.ols1.w * 100)))} phần trăm của hôm nay, cộng thêm một ít. Sai số trên mùa đông: ${sn(board.ols1.mae, 2)}, chỉ nhỉnh hơn mốc một chút.` }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Chặng 4–9: từng chương một', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Chặng 4: 12 đặc trưng, và rò rỉ từ tương lai', items: [
              '<b>Bụi</b>: hôm nay, hôm qua, trung bình 7 ngày.',
              '<b>Thời tiết ngày mai</b>: gió, độ ẩm, nhiệt độ, mưa, lớp biên, gió bắc, áp suất.',
              '<b>Mùa</b>: sin và cos của ngày trong năm.',
              `Điền ô thiếu: chỉ nhìn quá khứ <b>${fmt(res.fill.ffill, 1)}</b>, nội suy hai phía <b>${fmt(res.fill.interp, 1)}</b>: rò rỉ!`,
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Chặng 4, ôn chương 3B: mỗi dòng dữ liệu là một ngày, nhãn là bụi ngày hôm sau. Có 12 đặc trưng.', { n: 3 }, { anim: 3, say: 'Chặng bốn, ôn chương ba B: mỗi dòng dữ liệu là một ngày, nhãn là bụi ngày hôm sau. Có mười hai đặc trưng.' }),
              L('Chỉ số bụi có những đoạn bị thiếu. Điền bằng nội suy hai phía, tức dùng cả ngày trước lẫn ngày sau, trông rất tự nhiên.', { n: 4, hl: 3 }),
              L(`Thử dự báo trên các ô đã điền: chỉ nhìn quá khứ thì sai ${fmt(res.fill.ffill, 1)}, nội suy hai phía chỉ sai ${fmt(res.fill.interp, 1)}. Tốt đến khó tin.`, undefined, { say: `Thử dự báo trên các ô đã điền: chỉ nhìn quá khứ thì sai ${sn(res.fill.ffill, 1)}, nội suy hai phía chỉ sai ${sn(res.fill.interp, 1)}. Tốt đến khó tin.` }),
              L('Vì nội suy đã nhìn thấy ngày mai, đúng thứ ta đang cần dự báo. Đó là rò rỉ từ tương lai. Với dữ liệu thời gian, mọi phép tính chỉ được nhìn về quá khứ.', { hl: -1 }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Chặng 5–9: mỗi chương một câu hỏi', items: [
              `<b>Cảnh báo</b> (ch. 2): ngưỡng 0,5 → đúng ${alert[0]}, báo nhầm ${alert[1]}, bỏ sót ${alert[2]}.`,
              `<b>Ngày tương tự</b> (ch. 4): KNN 10 ngày, sai ${fmt(board.knn.mae, 2)}.`,
              `<b>Cây</b> (ch. 5): sâu 1 đúng ${fmt(tree[0].values[0], 1)}%, sâu 2 chỉ ${fmt(tree[1].values[0], 1)}%.`,
              `<b>SVM RBF</b> (ch. 6): γ = 10 khớp train ${fmt(svm[1].values[0], 1)}%, test ${fmt(svm[1].values[1], 1)}%.`,
              '<b>Kiểu ngày</b> (ch. 7): K-means trên hình dạng 24 giờ.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Chặng 5, ôn chương 2: hồi quy logistic ước lượng xác suất ngày mai vượt ngưỡng. Với ngưỡng 0,5, trên mùa đông: ${alert[0]} lần cảnh báo đúng, ${alert[1]} lần báo nhầm, ${alert[2]} lần bỏ sót.`, { n: 1, hl: 0 }, { say: `Chặng năm, ôn chương hai: hồi quy logistic ước lượng xác suất ngày mai vượt ngưỡng. Với ngưỡng năm mươi phần trăm, trên mùa đông: ${speakNum(String(alert[0]))} lần cảnh báo đúng, ${speakNum(String(alert[1]))} lần báo nhầm, ${speakNum(String(alert[2]))} lần bỏ sót.` }),
              L('Nếu một lần bỏ sót đắt gấp năm lần một lần báo nhầm, vì học sinh hít bụi cả ngày, thì nên hạ ngưỡng xuống rất thấp. Chọn ngưỡng là quyết định về chi phí.'),
              L(`Chặng 6, ôn chương 4: KNN có tên khác trong khí tượng là dự báo tương tự. Tìm 10 ngày quá khứ giống hôm nay nhất, xem ngày hôm sau của chúng. Sai ${fmt(board.knn.mae, 2)}.`, { n: 2, hl: 1 }, { say: `Chặng sáu, ôn chương bốn: KNN có tên khác trong khí tượng là dự báo tương tự. Tìm mười ngày quá khứ giống hôm nay nhất, xem ngày hôm sau của chúng. Sai ${sn(board.knn.mae, 2)}.` }),
              L(`Chặng 7, ôn chương 5: cây sâu 1 đúng ${fmt(tree[0].values[0], 1)}%, nhưng cây sâu 2 tụt còn ${fmt(tree[1].values[0], 1)}%. Câu hỏi thêm vào là "mai có mưa không", và mùa đông này mưa không còn rửa sạch bụi như các năm trước.`, { n: 3, hl: 2 }, { say: `Chặng bảy, ôn chương năm: cây sâu một đúng ${sn(tree[0].values[0], 1)} phần trăm, nhưng cây sâu hai tụt còn ${sn(tree[1].values[0], 1)} phần trăm. Câu hỏi thêm vào là mai có mưa không, và mùa đông này mưa không còn rửa sạch bụi như các năm trước.` }),
              L(`Chặng 8, ôn chương 6: SVM nhân RBF. γ = 0,1 đúng ${fmt(svm[0].values[1], 1)}% trên test; γ = 10 khớp tập huấn luyện tốt hơn, ${fmt(svm[1].values[0], 1)}%, nhưng test chỉ ${fmt(svm[1].values[1], 1)}%.`, { n: 4, hl: 3 }, { say: `Chặng tám, ôn chương sáu: SVM nhân RBF. Gam-ma bằng không phẩy một đúng ${sn(svm[0].values[1], 1)} phần trăm trên test; gam-ma bằng mười khớp tập huấn luyện tốt hơn, ${sn(svm[1].values[0], 1)} phần trăm, nhưng test chỉ ${sn(svm[1].values[1], 1)} phần trăm.` }),
              L(`Chặng 9, ôn chương 7: K-means trên hình dạng bụi trong 24 giờ tìm ra ${res.kinds.count.length} kiểu ngày. Kiểu có đỉnh lúc 1 giờ sáng đông nhất vào tháng 10, mùa nghịch nhiệt và đốt rơm rạ sau thu hoạch.`, { n: 5, hl: 4 }, { say: `Chặng chín, ôn chương bảy: K-means trên hình dạng bụi trong hai mươi bốn giờ tìm ra ${speakNum(String(res.kinds.count.length))} kiểu ngày. Kiểu có đỉnh lúc một giờ sáng đông nhất vào tháng mười, mùa nghịch nhiệt và đốt rơm rạ sau thu hoạch.` }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Ba mươi dòng pandas và scikit-learn', items: [
              '<b>shift(1)</b>, <b>rolling(7)</b>: chỉ nhìn về quá khứ.',
              'Thời tiết <b>ngày mai</b> lấy từ dòng của ngày mai.',
              'Chia theo thời gian: <b>train trước 1/11/2025</b>, test mùa đông.',
              '<b>GradientBoostingRegressor</b>: mô hình mạnh nhất của phần A.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ở bước 6, toàn bộ chặng 4 và mô hình mạnh nhất gói trong khoảng 30 dòng pandas và scikit-learn, chạy ngay trên trình duyệt.', { n: 1 }, { say: 'Ở bước sáu, toàn bộ chặng bốn và mô hình mạnh nhất gói trong khoảng ba mươi dòng pandas và scikit-learn, chạy ngay trên trình duyệt.' }),
              L('Để ý từng dòng tạo đặc trưng: shift và rolling chỉ nhìn về quá khứ. Một dấu trừ đặt sai chỗ là cả mô hình nhìn thấy tương lai.', { hl: 0 }),
              L('Thời tiết thì lấy của ngày mai, vì khi triển khai ta sẽ có bản tin dự báo thời tiết.', { n: 2, hl: 1 }),
              L('Chia theo thời gian, không chia ngẫu nhiên. Rồi huấn luyện gradient boosting.', { n: 4, hl: 3 }, { anim: 2 }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Bảng xếp hạng', section: 'danh-gia',
        scenes: [
          {
            view: 'Chart',
            props: { title: `Sai số trung bình trên mùa đông 2025–2026 (${UG})`, bars: partA.map((id, i) => ({ label: ['Mai = nay', 'TB tháng', 'TT 1 biến', 'TT 12 biến', 'KNN', 'Cây sâu 3', 'Rừng', 'Boosting'][i], value: board[id].mae!, color: id === 'persist' || id === 'clim' ? 5 : id === 'gb' ? 1 : 0, text: fmt(board[id].mae!, 2) })), ylab: UG, ydom: [0, 22] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Mọi mô hình của chương 0 đến 8, cùng 12 đặc trưng, cùng tập kiểm tra.', { n: 8 }, { anim: 3, ease: 'lin', say: 'Mọi mô hình của chương không đến tám, cùng mười hai đặc trưng, cùng tập kiểm tra.' }),
              L(`Hai cột xám là hai mốc. Hồi quy tuyến tính chỉ với bụi hôm nay: ${fmt(board.ols1.mae, 2)}, gần như ngang mốc.`, { hl: 2 }, { say: `Hai cột xám là hai mốc. Hồi quy tuyến tính chỉ với bụi hôm nay: ${sn(board.ols1.mae, 2)}, gần như ngang mốc.` }),
              L(`Thêm thời tiết, vẫn là hồi quy tuyến tính: ${fmt(board.ols.mae, 2)}. Đặc trưng tốt giúp nhiều hơn mô hình phức tạp.`, { hl: 3 }, { say: `Thêm thời tiết, vẫn là hồi quy tuyến tính: ${sn(board.ols.mae, 2)}. Đặc trưng tốt giúp nhiều hơn mô hình phức tạp.` }),
              L(`Cây sâu 3 tệ: ${fmt(board.tree.mae, 2)}. Rừng ngẫu nhiên ${fmt(board.rf.mae, 2)}.`, { hl: 5 }, { say: `Cây sâu ba tệ: ${sn(board.tree.mae, 2)}. Rừng ngẫu nhiên ${sn(board.rf.mae, 2)}.` }),
              L(`Đứng đầu phần A là gradient boosting: ${fmt(board.gb.mae, 2)} ${UG}, giảm khoảng một phần ba so với mốc.`, { hl: 7 }, { say: `Đứng đầu phần A là gradient boosting: ${sn(board.gb.mae, 2)} ${sUG}, giảm khoảng một phần ba so với mốc.` }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Rừng ngẫu nhiên dựa vào đặc trưng nào?', bars: imp.slice(0, 7).map(([k, v], i) => ({ label: featVi[k], value: v, color: i === 0 ? 1 : 0, text: `${Math.round(100 * v)}%` })), ylab: 'mức quan trọng', ydom: [0, 0.7], yfmt: 'pct' },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Mức quan trọng của đặc trưng: bụi hôm nay chiếm ${Math.round(100 * res.imp.pm0)}%.`, { n: 7, hl: 0 }, { anim: 2.5, say: `Mức quan trọng của đặc trưng: bụi hôm nay chiếm ${speakNum(String(Math.round(100 * res.imp.pm0)))} phần trăm.` }),
              L(`Tiếp theo là gió ngày mai, ${Math.round(100 * res.imp.ws)}%: gió mạnh thổi bụi đi.`, { hl: 1 }, { say: `Tiếp theo là gió ngày mai, ${speakNum(String(Math.round(100 * res.imp.ws)))} phần trăm: gió mạnh thổi bụi đi.` }),
              L('Nhưng nhớ bẫy của chương 5: mức quan trọng không phải nhân quả, và các đặc trưng tương quan với nhau chia nhau phần quan trọng.', { hl: -1 }, { say: 'Nhưng nhớ bẫy của chương năm: mức quan trọng không phải nhân quả, và các đặc trưng tương quan với nhau chia nhau phần quan trọng.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              `<b>Không có mốc</b>: "sai 12" chỉ có nghĩa khi biết mốc là ${fmt(board.persist.mae, 1)}.`,
              '<b>Chia ngẫu nhiên</b> dữ liệu có thời gian.',
              '<b>Giả định dự báo thời tiết hoàn hảo</b>.',
              '<b>Đổi trạm mà không ghi lại</b>.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Bốn bẫy. Một: không có mốc so sánh. Sai 12 chỉ có nghĩa khi biết mốc là ${fmt(board.persist.mae, 1)}.`, { n: 1, hl: 0 }, { say: `Bốn bẫy. Một: không có mốc so sánh. Sai mười hai chỉ có nghĩa khi biết mốc là ${sn(board.persist.mae, 1)}.` }),
              L('Hai: chia ngẫu nhiên dữ liệu có thời gian. Tập test ngẫu nhiên chứa cả mùa hè dễ đoán, con số sẽ đẹp giả tạo.', { n: 2, hl: 1 }),
              L('Ba: bảng này dùng thời tiết thật của ngày mai. Khi triển khai phải dùng bản tin dự báo, và sai số sẽ tăng lên.', { n: 3, hl: 2 }),
              L('Bốn: đổi trạm mà không ghi lại. Chỉ số năm 2023 tính từ 1 trạm, năm 2026 từ 2 đến 3 trạm. So "năm nay sạch hơn năm ngoái" trên chỉ số này phải rất cẩn thận.', { n: 4, hl: 3 }, { say: 'Bốn: đổi trạm mà không ghi lại. Chỉ số năm hai nghìn không trăm hai mươi ba tính từ một trạm, năm hai nghìn không trăm hai mươi sáu từ hai đến ba trạm. So năm nay sạch hơn năm ngoái trên chỉ số này phải rất cẩn thận.' }),
            ],
          },
        ],
      },
      {
        id: 'tong-ket', title: 'Tổng kết', section: 'tong-ket',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Nhớ gì sau phần A', items: [
              '<b>Khám dữ liệu</b> trước: trạm lỗi, mã −999, cảm biến giá rẻ.',
              '<b>Đặt mốc</b> trước khi làm mô hình.',
              'Dữ liệu thời gian: <b>chỉ nhìn quá khứ</b>, chia theo thời gian.',
              '<b>Đặc trưng tốt</b> (thời tiết) giúp nhiều hơn mô hình phức tạp.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại phần A.'),
              L('Khám dữ liệu trước tiên: trạm lỗi, mã −999, cảm biến giá rẻ đều lẫn trong dữ liệu thật.', { n: 1, hl: 0 }, { say: 'Khám dữ liệu trước tiên: trạm lỗi, mã lỗi âm chín trăm chín mươi chín, cảm biến giá rẻ đều lẫn trong dữ liệu thật.' }),
              L('Đặt mốc so sánh trước khi làm mô hình.', { n: 2, hl: 1 }),
              L('Với dữ liệu thời gian, mọi đặc trưng chỉ được nhìn về quá khứ, và tập test phải nằm sau tập huấn luyện.', { n: 3, hl: 2 }),
              L('Và đặc trưng tốt, ở đây là thời tiết ngày mai, giúp nhiều hơn mô hình phức tạp.', { n: 4, hl: 3 }),
              L('Phần B ôn chương 8 đến 11: cross-validation theo thời gian, mạng nơ-ron, tích chập và attention trên 72 giờ số liệu, và mô hình sống thế nào khi thế giới thay đổi.', { hl: -1 }, { say: 'Phần B ôn chương tám đến mười một: cross-validation theo thời gian, mạng nơ-ron, tích chập và attention trên bảy mươi hai giờ số liệu, và mô hình sống thế nào khi thế giới thay đổi.' }),
              L('Giờ hãy cuộn xuống, đi qua từng chặng của dự án. Hẹn gặp lại ở phần B.'),
            ],
          },
        ],
      },
    ],
  };
}
