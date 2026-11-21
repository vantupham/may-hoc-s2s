/**
 * Bài giảng chương 12B: dự án bụi mịn Hà Nội (B). Kết quả mô hình tính sẵn bằng scripts/prep_ch12.py
 * (hanoi-results.json), như mọi lab của bài; các số còn lại lấy từ bảng ghi của bài, đã được tests/learn.test.ts kiểm lại.
 */
import res from '../../data/hanoi-results.json';
import { fmt } from '../ml-core';
import { duAnBLearn } from '../hoc/du-an-khong-khi-b';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const rec = (id: string) => duAnBLearn.missions.find((m) => m.id === id)!.record!.rows;
const UG = 'µg/m³';
const sUG = 'mi-crô-gam trên mét khối';

export function duAnBLecture(): Lecture {
  const board = Object.fromEntries(res.board.map((b) => [b.id, b])) as Record<string, { name: string; mae: number; mae72: number; auc: number }>;
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const cvT = avg(res.cvTime.map((f) => f.mae)), cvR = avg(res.cvRand);
  const conv = rec('tich-chap'), attn = rec('chu-y')[0].values[0];
  const dm = (d: string) => { const [y, m, dd] = d.split('-'); return `${+dd}/${+m}/${y}`; };
  const live = res.live;
  const mon = (m: string) => `T${+m.slice(5)}/${m.slice(2, 4)}`;
  const better = live.filter((l) => l.gb < l.persist).length;
  const lastBias = live.at(-1)!;

  return {
    slug: 'du-an-khong-khi-b',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 12B', title: 'Bụi mịn Hà Nội', sub: 'dự án cuối khoá (B): mạng nơ-ron, đánh giá và triển khai' },
            lines: [
              L('Chương 12B: phần cuối của dự án bụi mịn, và cũng là bài cuối của khoá học. Ta ôn lại chương 8 đến chương 11.', undefined, { say: 'Chương mười hai B: phần cuối của dự án bụi mịn, và cũng là bài cuối của khoá học. Ta ôn lại chương tám đến chương mười một.' }),
              L(`Phần A kết thúc với gradient boosting đứng đầu: sai ${fmt(board.gb.mae, 2)} ${UG}, nhưng chỉ hơn hồi quy tuyến tính chưa tới một đơn vị.`, undefined, { say: `Phần A kết thúc với gradient boosting đứng đầu: sai ${sn(board.gb.mae, 2)} ${sUG}, nhưng chỉ hơn hồi quy tuyến tính chưa tới một đơn vị.` }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Hai cách đi tiếp', items: [
              '<b>Mô hình mạnh hơn</b> trên cùng dữ liệu: mạng nơ-ron MLP (ch. 9).',
              '<b>Dữ liệu chi tiết hơn</b>: 72 giờ gần nhất, mỗi giờ 4 số, cho CNN (ch. 10) và attention (ch. 11).',
              'Mỗi mẫu là một bảng <b>72 × 4</b>: PM2.5, gió, độ ẩm, lớp biên.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Có hai cách đi tiếp. Một: dùng mô hình mạnh hơn trên cùng dữ liệu, như mạng nơ-ron của chương 9.', { n: 1, hl: 0 }, { say: 'Có hai cách đi tiếp. Một: dùng mô hình mạnh hơn trên cùng dữ liệu, như mạng nơ-ron của chương chín.' }),
              L('Hai: cho mô hình xem dữ liệu chi tiết hơn. Thay vì một con số trung bình cho cả ngày, đưa vào 72 giờ gần nhất.', { n: 2, hl: 1 }, { say: 'Hai: cho mô hình xem dữ liệu chi tiết hơn. Thay vì một con số trung bình cho cả ngày, đưa vào bảy mươi hai giờ gần nhất.' }),
              L('Mỗi mẫu là một bảng 72 hàng, 4 cột: bụi, gió, độ ẩm và độ cao lớp biên của từng giờ, từ 0 giờ hai ngày trước đến 23 giờ hôm nay.', { n: 3, hl: 2 }, { say: 'Mỗi mẫu là một bảng bảy mươi hai hàng, bốn cột: bụi, gió, độ ẩm và độ cao lớp biên của từng giờ, từ không giờ hai ngày trước đến hai mươi ba giờ hôm nay.' }),
              L(`Chỉ những ngày có đủ 72 giờ liên tục mới dùng được: ${res.nTest} ngày kiểm tra thì còn 142 ngày. Đó là cái giá đầu tiên của dữ liệu chi tiết.`, { hl: -1 }, { say: `Chỉ những ngày có đủ bảy mươi hai giờ liên tục mới dùng được: ${speakNum(String(res.nTest))} ngày kiểm tra thì còn một trăm bốn mươi hai ngày. Đó là cái giá đầu tiên của dữ liệu chi tiết.` }),
            ],
          },
        ],
      },
      {
        id: 'cv-thoi-gian', title: 'Chặng 10: đánh giá theo thời gian', section: 'truc-giac',
        scenes: [
          {
            view: 'Chart',
            props: { title: `Cross-validation theo thời gian: 5 lần, mỗi lần kiểm tra giai đoạn sau`, bars: res.cvTime.flatMap((f, i) => [{ label: `${i + 1}: GB`, value: f.mae, color: 1, text: fmt(f.mae, 1) }, { label: `${i + 1}: mốc`, value: f.persist, color: 5, text: fmt(f.persist, 1) }]), ylab: UG, ydom: [0, 18] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Chặng 10, ôn chương 8: trước khi so mô hình mới, cần một cách chọn tham số không đụng tới tập kiểm tra. Đó là cross-validation trên tập huấn luyện.', undefined, { say: 'Chặng mười, ôn chương tám: trước khi so mô hình mới, cần một cách chọn tham số không đụng tới tập kiểm tra. Đó là cross-validation trên tập huấn luyện.' }),
              L('Với chuỗi thời gian, mỗi lần chia phải học trên quá khứ và kiểm tra trên giai đoạn ngay sau đó. Năm lần chia, cửa sổ huấn luyện lớn dần.', { n: 10 }, { anim: 3, ease: 'lin' }),
              L(`Lần thứ 3, kiểm tra từ ${dm(res.cvTime[2].from)} đến ${dm(res.cvTime[2].to)}, là một mùa đông: sai nhiều nhất, ${fmt(res.cvTime[2].mae, 2)}. Mùa đông luôn khó hơn.`, { hl: 4 }, { say: `Lần thứ ba, kiểm tra mùa đông năm hai nghìn không trăm hai mươi tư sang năm sau: sai nhiều nhất, ${sn(res.cvTime[2].mae, 2)}. Mùa đông luôn khó hơn.` }),
              L(`Lần cuối, mùa hè thu 2025, mô hình còn thua mốc: ${fmt(res.cvTime[4].mae, 2)} so với ${fmt(res.cvTime[4].persist, 2)}. Khi trời sạch và ổn định, "ngày mai bằng hôm nay" đã rất tốt.`, { hl: 8 }, { say: `Lần cuối, mùa hè thu năm hai nghìn không trăm hai mươi lăm, mô hình còn thua mốc: ${sn(res.cvTime[4].mae, 2)} so với ${sn(res.cvTime[4].persist, 2)}. Khi trời sạch và ổn định, ngày mai bằng hôm nay đã rất tốt.` }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Hai cách chia, cùng một mô hình',
              cols: ['Cách chia', 'Sai số trung bình 5 lần'],
              cls: ['t', ''],
              rows: [['Theo thời gian', fmt(cvT, 2)], ['Xáo trộn ngẫu nhiên', fmt(cvR, 2)]],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Trung bình 5 lần chia theo thời gian: ${fmt(cvT, 2)}.`, { n: 1, hl: 0 }, { say: `Trung bình năm lần chia theo thời gian: ${sn(cvT, 2)}.` }),
              L(`Nếu xáo trộn ngẫu nhiên các ngày rồi chia 5 phần như chương 8: ${fmt(cvR, 2)}. Đẹp hơn.`, { n: 2, hl: 1 }, { say: `Nếu xáo trộn ngẫu nhiên các ngày rồi chia năm phần như chương tám: ${sn(cvR, 2)}. Đẹp hơn.` }),
              L('Đẹp hơn vì sai. Khi xáo trộn, ngày 14 nằm ở tập kiểm tra trong khi ngày 13 và ngày 15 nằm ở tập huấn luyện. Bụi hôm nay gần giống hôm qua và ngày mai, nên mô hình gần như được xem trước đáp án.', { hl: -1 }, { say: 'Đẹp hơn vì sai. Khi xáo trộn, ngày mười bốn nằm ở tập kiểm tra trong khi ngày mười ba và ngày mười lăm nằm ở tập huấn luyện. Bụi hôm nay gần giống hôm qua và ngày mai, nên mô hình gần như được xem trước đáp án.' }),
            ],
          },
        ],
      },
      {
        id: 'mlp', title: 'Chặng 11: mạng nơ-ron trên dữ liệu ít', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'MLP trên 12 đặc trưng theo ngày', items: [
              `Chỉ <b>${res.nTrain} ngày</b> huấn luyện, ít hơn số ảnh chữ số của chương 9.`,
              'Thêm <b>điều chuẩn L2</b> và <b>dừng sớm</b> để khỏi học thuộc.',
              `Kết quả: <b>${fmt(board.mlp.mae, 2)}</b>, ngang gradient boosting ${fmt(board.gb.mae, 2)}.`,
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Chặng 11, ôn chương 9: một mạng MLP có thể học bất kỳ quan hệ phi tuyến nào, với điều kiện có đủ dữ liệu. Ở đây chỉ có ${res.nTrain} ngày.`, { n: 1, hl: 0 }, { say: `Chặng mười một, ôn chương chín: một mạng MLP có thể học bất kỳ quan hệ phi tuyến nào, với điều kiện có đủ dữ liệu. Ở đây chỉ có ${speakNum(String(res.nTrain))} ngày.` }),
              L('Mạng có 16 nơ-ron ẩn, điều chuẩn để giữ trọng số nhỏ, và dừng sớm khi sai số kiểm định thôi giảm.', { n: 2, hl: 1 }, { say: 'Mạng có mười sáu nơ-ron ẩn, điều chuẩn để giữ trọng số nhỏ, và dừng sớm khi sai số kiểm định thôi giảm.' }),
              L(`Kết quả ${fmt(board.mlp.mae, 2)}, ngang gradient boosting. Cùng một dữ liệu thì mô hình mạnh hơn không giúp được bao nhiêu.`, { n: 3, hl: 2 }, { say: `Kết quả ${sn(board.mlp.mae, 2)}, ngang gradient boosting. Cùng một dữ liệu thì mô hình mạnh hơn không giúp được bao nhiêu.` }),
              L('Vậy dữ liệu theo giờ giúp được gì? Hai ngày có cùng bụi trung bình 60 có thể rất khác nhau. Một ngày bụi đang dâng lên vào buổi tối, gió lặng. Ngày kia bụi đang giảm từ trưa vì gió mùa vừa về.', { hl: -1 }, { say: 'Vậy dữ liệu theo giờ giúp được gì? Hai ngày có cùng bụi trung bình sáu mươi có thể rất khác nhau. Một ngày bụi đang dâng lên vào buổi tối, gió lặng. Ngày kia bụi đang giảm từ trưa vì gió mùa vừa về.' }),
              L('Trung bình ngày xoá mất khác biệt đó. Dữ liệu theo giờ giữ lại nó.'),
              L('Đây cũng là bài học của chương 3B nhìn từ phía khác: muốn mô hình tốt hơn, nhiều khi phải hỏi lại dữ liệu đã bị tóm tắt mất những gì.', undefined, { say: 'Đây cũng là bài học của chương ba B nhìn từ phía khác: muốn mô hình tốt hơn, nhiều khi phải hỏi lại dữ liệu đã bị tóm tắt mất những gì.' }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Chặng 12–13: tích chập và attention theo giờ', section: 'tinh-tay',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Tích chập 1D trên 72 giờ', items: [
              { label: 'Một ô', tex: String.raw`s_t = b + \sum_{i=0}^{5}\sum_{c=1}^{4} k_{i,c}\; x_{t+i,\,c}, \qquad a_t = \max(0, s_t)` },
              { label: 'Tóm tắt', tex: String.raw`\text{trung bình}(a_0, \dots, a_{66}) \quad\text{và}\quad a_{66}\ \text{(6 giờ cuối)}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Chặng 12, ôn chương 10. Ở chương 10, bộ lọc 3 nhân 3 trượt trên ảnh theo hai chiều. Ở đây bộ lọc dài 6 giờ, phủ cả 4 kênh, và chỉ trượt theo một chiều: thời gian.', { n: 1, hl: 0 }, { say: 'Chặng mười hai, ôn chương mười. Ở chương mười, bộ lọc ba nhân ba trượt trên ảnh theo hai chiều. Ở đây bộ lọc dài sáu giờ, phủ cả bốn kênh, và chỉ trượt theo một chiều: thời gian.' }),
              L('Một bộ lọc có thể học hình dạng "bụi tăng dần trong khi gió giảm": một dấu hiệu báo trước ngày mai bẩn.'),
              L('Mạng có 3 bộ lọc. Từ mỗi bản đồ, nó lấy hai số: trung bình cả ba ngày, và giá trị ở 6 giờ cuối của hôm nay.', { n: 2, hl: 1 }, { say: 'Mạng có ba bộ lọc. Từ mỗi bản đồ, nó lấy hai số: trung bình cả ba ngày, và giá trị ở sáu giờ cuối của hôm nay.' }),
              L(`Một ngày trong lab: CNN dự báo ${fmt(conv[0].values[0], 1)} ${UG}, thực tế là ${fmt(conv[1].values[0], 1)}. Hụt, nhưng đúng hướng: một ngày rất bẩn.`, { hl: -1 }, { say: `Một ngày trong lab: CNN dự báo ${sn(conv[0].values[0], 1)} ${sUG}, thực tế là ${sn(conv[1].values[0], 1)}. Hụt, nhưng đúng hướng: một ngày rất bẩn.` }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Chặng 13: attention trên 72 giờ', items: [
              'Mỗi giờ là một vector: 4 kênh + <b>giờ trong ngày</b> (sin, cos).',
              'Giờ trong ngày đóng vai <b>mã hoá vị trí</b> của chương 11.',
              `24 giờ cuối nhận trung bình <b>${attn}%</b> sự chú ý: dàn khá đều trên ba ngày.`,
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Chặng 13, ôn chương 11. Ở chương 11 mỗi từ là một vector; ở đây mỗi giờ là một vector: 4 kênh, cộng giờ trong ngày dưới dạng sin và cos.', { n: 1, hl: 0 }, { say: 'Chặng mười ba, ôn chương mười một. Ở chương mười một mỗi từ là một vector; ở đây mỗi giờ là một vector: bốn kênh, cộng giờ trong ngày dưới dạng sin và cos.' }),
              L('Giờ trong ngày đóng vai trò mã hoá vị trí: 13 giờ hôm qua và 13 giờ hôm nay có cùng nhịp ngày đêm.', { n: 2, hl: 1 }, { say: 'Giờ trong ngày đóng vai trò mã hoá vị trí: mười ba giờ hôm qua và mười ba giờ hôm nay có cùng nhịp ngày đêm.' }),
              L(`Trung bình trên 142 ngày kiểm tra, 24 giờ gần nhất nhận ${attn}% sự chú ý, gần đúng một phần ba. Mô hình học được rằng hình dạng của cả ba ngày đều có ích, chứ không chỉ hôm nay.`, { n: 3, hl: 2 }, { say: `Trung bình trên một trăm bốn mươi hai ngày kiểm tra, hai mươi tư giờ gần nhất nhận ${speakNum(String(attn))} phần trăm sự chú ý, gần đúng một phần ba. Mô hình học được rằng hình dạng của cả ba ngày đều có ích, chứ không chỉ hôm nay.` }),
              L('Nhắc lại bẫy của chương 11: trọng số chú ý không phải lời giải thích. Đừng viết "AI phát hiện bụi lúc 13 giờ hôm qua là nguyên nhân của ô nhiễm hôm nay".', { hl: -1 }, { say: 'Nhắc lại bẫy của chương mười một: trọng số chú ý không phải lời giải thích. Đừng viết rằng AI phát hiện bụi lúc mười ba giờ hôm qua là nguyên nhân của ô nhiễm hôm nay.' }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Ở bước 6', items: [
              '<b>TimeSeriesSplit</b>: cross-validation theo thời gian.',
              '<b>MLPRegressor</b> với điều chuẩn và dừng sớm.',
              'CNN 1D và attention huấn luyện bằng <b>NumPy</b>; trang chỉ chạy lan truyền xuôi.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ở bước 6, cross-validation theo thời gian chỉ là một dòng: TimeSeriesSplit của scikit-learn.', { n: 1, hl: 0 }, { say: 'Ở bước sáu, cross-validation theo thời gian chỉ là một dòng: TimeSeriesSplit của scikit-learn.' }),
              L('Mạng MLP cũng có sẵn, với điều chuẩn và dừng sớm.', { n: 2, hl: 1 }),
              L('CNN 1D và attention được huấn luyện bằng NumPy thuần trong kho mã của dự án, giống chương 10 và 11; trang này chỉ chạy lan truyền xuôi với trọng số đã lưu.', { n: 3, hl: 2 }, { say: 'CNN 1D và attention được huấn luyện bằng NumPy thuần trong kho mã của dự án, giống chương mười và mười một; trang này chỉ chạy lan truyền xuôi với trọng số đã lưu.' }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Chặng 14: xếp hạng và triển khai', section: 'danh-gia',
        scenes: [
          {
            view: 'Chart',
            props: { title: `Bảng xếp hạng cuối cùng (sai số, ${UG})`, bars: ['persist', 'ols', 'rf', 'gb', 'mlp', 'attn', 'cnn'].map((id, i) => ({ label: ['Mai = nay', 'Tuyến tính', 'Rừng', 'Boosting', 'MLP', 'Attention', 'CNN 1D'][i], value: board[id].mae!, color: id === 'persist' ? 5 : id === 'cnn' || id === 'attn' ? 1 : 0, text: fmt(board[id].mae!, 2) })), ylab: UG, ydom: [0, 18] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bảng xếp hạng cuối cùng của cả khoá học.', { n: 7 }, { anim: 3, ease: 'lin' }),
              L(`CNN 1D đứng đầu: ${fmt(board.cnn.mae, 2)} ${UG}. Attention thứ hai: ${fmt(board.attn.mae, 2)}.`, { hl: 6 }, { say: `CNN 1D đứng đầu: ${sn(board.cnn.mae, 2)} ${sUG}. Attention thứ hai: ${sn(board.attn.mae, 2)}.` }),
              L(`Nhưng công bằng thì phải so trên cùng 142 ngày có đủ 72 giờ. Trên đúng những ngày đó, gradient boosting sai ${fmt(board.gb.mae72!, 2)}, và mốc "ngày mai bằng hôm nay" sai ${fmt(board.persist.mae72!, 1)}.`, { hl: 3 }, { say: `Nhưng công bằng thì phải so trên cùng một trăm bốn mươi hai ngày có đủ bảy mươi hai giờ. Trên đúng những ngày đó, gradient boosting sai ${sn(board.gb.mae72!, 2)}, và mốc ngày mai bằng hôm nay sai ${sn(board.persist.mae72!, 1)}.` }),
              L('CNN vẫn thắng rõ, chỉ với khoảng 100 tham số. Thứ giúp nó không phải độ phức tạp, mà là dữ liệu theo giờ.', { hl: -1 }, { say: 'CNN vẫn thắng rõ, chỉ với khoảng một trăm tham số. Thứ giúp nó không phải độ phức tạp, mà là dữ liệu theo giờ.' }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Mô hình chỉ thấy mùa hè',
              cols: ['Học trên', `Sai số mùa đông (${UG})`],
              cls: ['t', ''],
              rows: [[`Chỉ tháng 5–9 (${res.drift.nSummer} ngày)`, fmt(res.drift.summerOnly, 2)], ['Mọi tháng', fmt(res.drift.all, 2)]],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Thí nghiệm lệch phân phối của chương 3A: chỉ cho gradient boosting học các tháng 5 đến 9. Ngày bẩn nhất nó từng thấy là ${fmt(res.drift.maxSummerY, 1)}.`, { n: 1, hl: 0 }, { say: `Thí nghiệm lệch phân phối của chương ba A: chỉ cho gradient boosting học các tháng năm đến chín. Ngày bẩn nhất nó từng thấy là ${sn(res.drift.maxSummerY, 1)}.` }),
              L(`Mùa đông có ngày lên tới ${fmt(res.drift.maxTestY, 0)}. Cây quyết định không thể đoán vượt quá những gì nó từng thấy. Sai số mùa đông: ${fmt(res.drift.summerOnly, 2)}, so với ${fmt(res.drift.all, 2)} khi học mọi tháng.`, { n: 2, hl: 1 }, { say: `Mùa đông có ngày lên tới ${speakNum(fmt(res.drift.maxTestY, 0))}. Cây quyết định không thể đoán vượt quá những gì nó từng thấy. Sai số mùa đông: ${sn(res.drift.summerOnly, 2)}, so với ${sn(res.drift.all, 2)} khi học mọi tháng.` }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Sau triển khai: sai số từng tháng, không học lại', series: [{ name: 'gradient boosting', pts: live.map((l, i) => [i + 1, l.gb]), color: 1, dots: true }, { name: 'ngày mai = hôm nay', pts: live.map((l, i) => [i + 1, l.persist]), color: 5, dots: true, dash: true }, { name: 'độ lệch trung bình', pts: live.map((l, i) => [i + 1, l.bias]), color: 2, dots: true }], xlab: `tháng (từ ${mon(live[0].m)} đến ${mon(live.at(-1)!.m)})`, ylab: UG, xdom: [0.5, live.length + 0.5], ydom: [-2, 11], xfmt: 'int' },
            init: { n: 0, hl: -1 },
            lines: [
              L('Cuối cùng, giả sử ta chốt mô hình vào ngày 1 tháng 4 năm 2026 và cho chạy tiếp, không học lại.', undefined, { say: 'Cuối cùng, giả sử ta chốt mô hình vào ngày một tháng tư năm hai nghìn không trăm hai mươi sáu và cho chạy tiếp, không học lại.' }),
              L(`Từng tháng, sai số của mô hình và của mốc. Mô hình thắng mốc ${better} trên ${live.length} tháng.`, { n: 2 }, { anim: 2, say: `Từng tháng, sai số của mô hình và của mốc. Mô hình thắng mốc ${speakNum(String(better))} trên ${speakNum(String(live.length))} tháng.` }),
              L(`Nhưng nhìn đường độ lệch: dự báo ngày càng cao hơn thực tế. Đến tháng ${+lastBias.m.slice(5)}, mô hình đoán cao trung bình ${fmt(lastBias.bias, 1)} ${UG}.`, { n: 3, hl: 2 }, { say: `Nhưng nhìn đường độ lệch: dự báo ngày càng cao hơn thực tế. Đến tháng ${speakNum(String(+lastBias.m.slice(5)))}, mô hình đoán cao trung bình ${sn(lastBias.bias, 1)} ${sUG}.` }),
              L('Thế giới đã thay đổi. Trong giai đoạn này có lộ trình hạn chế xe máy chạy xăng trong Vành đai 1, và cùng lúc một trạm đo ngừng hoạt động. Dữ liệu dự báo không tách được hai thay đổi đó ra.', { hl: -1 }),
              L('Bài học: mô hình không phải xây một lần là xong. Phải theo dõi sai số và độ lệch hằng tháng, và có lịch học lại.'),
              L('Một cách làm phổ biến: mỗi tháng so sai số mới với sai số lúc triển khai. Nếu độ lệch vượt một ngưỡng đặt trước, học lại trên dữ liệu gần nhất, và kiểm tra lại bằng cross-validation theo thời gian như chặng 10.', undefined, { say: 'Một cách làm phổ biến: mỗi tháng so sai số mới với sai số lúc triển khai. Nếu độ lệch vượt một ngưỡng đặt trước, học lại trên dữ liệu gần nhất, và kiểm tra lại bằng cross-validation theo thời gian như chặng mười.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Chọn mô hình chỉ theo sai số</b>: CNN cần 72 giờ liên tục.',
              '<b>Coi trọng số attention là lời giải thích</b>.',
              '<b>Đọc sai số giảm như bằng chứng chính sách thành công</b>.',
              '<b>Không học lại</b>.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bốn bẫy. Một: chọn mô hình chỉ theo sai số. CNN đứng đầu nhưng cần 72 giờ liên tục; một đêm mất tín hiệu là không có dự báo. Luôn cần một mô hình dự phòng đơn giản.', { n: 1, hl: 0 }, { say: 'Bốn bẫy. Một: chọn mô hình chỉ theo sai số. CNN đứng đầu nhưng cần bảy mươi hai giờ liên tục; một đêm mất tín hiệu là không có dự báo. Luôn cần một mô hình dự phòng đơn giản.' }),
              L('Hai: coi trọng số attention là lời giải thích.', { n: 2, hl: 1 }),
              L('Ba: đọc sai số giảm như bằng chứng một chính sách thành công. Khi hai thay đổi xảy ra cùng lúc, dữ liệu dự báo không tách được chúng.', { n: 3, hl: 2 }),
              L('Bốn: không học lại. Mùa đông tới sẽ khác mùa đông vừa qua.', { n: 4, hl: 3 }),
            ],
          },
        ],
      },
      {
        id: 'tong-ket', title: 'Tổng kết khoá học', section: 'tong-ket',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Mười ba chương, một quy trình', items: [
              '<b>Khám dữ liệu</b>, đặt <b>mốc</b>, chia theo đúng cách mô hình sẽ được dùng.',
              'Bắt đầu <b>đơn giản</b>; thêm độ phức tạp khi đo được lợi ích.',
              '<b>Đặc trưng và dữ liệu tốt</b> thường thắng mô hình phức tạp.',
              'Sau triển khai: <b>theo dõi</b> và <b>học lại</b>.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Đây là bài giảng cuối cùng. Mười ba chương gói lại thành một quy trình.'),
              L('Khám dữ liệu, đặt mốc so sánh, và chia dữ liệu đúng như cách mô hình sẽ được dùng.', { n: 1, hl: 0 }),
              L('Bắt đầu từ mô hình đơn giản, và chỉ thêm độ phức tạp khi đo được lợi ích của nó.', { n: 2, hl: 1 }),
              L('Đặc trưng tốt và dữ liệu tốt thường thắng mô hình phức tạp: thời tiết ngày mai ở phần A, dữ liệu theo giờ ở phần B.', { n: 3, hl: 2 }),
              L('Và mô hình sống trong một thế giới thay đổi: hãy theo dõi nó, và học lại.', { n: 4, hl: 3 }),
              L('Từ Gradient Descent trên năm căn nhà đến attention trên 72 giờ bụi mịn, mọi phép tính đều là những phép cộng, phép nhân bạn đã tự làm bằng tay.', { hl: -1 }, { say: 'Từ Gradient Descent trên năm căn nhà đến attention trên bảy mươi hai giờ bụi mịn, mọi phép tính đều là những phép cộng, phép nhân bạn đã tự làm bằng tay.' }),
              L('Cảm ơn bạn đã học cùng Máy học S2S. Giờ hãy cuộn xuống, hoàn thành dự án, và mang những gì đã học tới một bài toán của chính bạn.'),
            ],
          },
        ],
      },
    ],
  };
}
