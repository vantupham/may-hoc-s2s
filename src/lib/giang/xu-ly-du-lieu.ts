/**
 * Bài giảng chương 3B: xử lý dữ liệu và xây bộ dữ liệu tốt.
 * Phần tính tay do ml-core tính (imputeGroupMedian, standardize, minMax). Các thí nghiệm dùng mô hình
 * lấy số từ bảng ghi của bài, vốn được tests/learn.test.ts tính lại bằng chính logic của lab.
 */
import california from '../../data/california.json';
import { imputeGroupMedian, standardize, minMax, present, fmt } from '../ml-core';
import { xuLyLearn } from '../hoc/xu-ly-du-lieu';
import { oceanVi } from '../dulieu';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const rec = (id: string) => xuLyLearn.missions.find((m) => m.id === id)!.record!.rows;
const sn = (v: number, d: number) => speakNum(fmt(v, d));

export const xuLyPyCode = `from sklearn.pipeline import make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, FunctionTransformer
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold, GroupKFold, cross_val_score

xu_ly = ColumnTransformer([
    # Mọi bước học tham số nằm TRONG pipeline:
    # mỗi lần chia, chúng chỉ học từ phần huấn luyện.
    ("so", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), so),
    ("log", make_pipeline(SimpleImputer(strategy="median"),
                          FunctionTransformer(np.log1p), StandardScaler()), ["income", "pop"]),
    ("vi_tri", OneHotEncoder(handle_unknown="ignore"), ["ocean"]),
])
mo_hinh = make_pipeline(xu_ly, LinearRegression())

o_dia_ly = np.floor(df.lat) * 1000 + np.floor(df.lon)
for ten, cv, nhom in [("ngẫu nhiên", KFold(5, shuffle=True, random_state=0), None),
                      ("theo vùng", GroupKFold(5), o_dia_ly)]:
    rmse = -cross_val_score(mo_hinh, df, y, cv=cv, groups=nhom,
                            scoring="neg_root_mean_squared_error")`;

export function xuLyLecture(): Lecture {
  const cal = california as unknown as { n: number; cats: string[]; ocean: number[]; bedrooms: (number | null)[]; rooms: number[]; pop: number[]; income: number[] };
  const groups = cal.ocean.map((o) => cal.cats[o]);
  const filled = imputeGroupMedian(cal.bedrooms, groups);
  const missIdx = cal.bedrooms.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
  const m1 = missIdx.find((i) => cal.ocean[i] === 1)!, m2 = missIdx.find((i) => cal.ocean[i] === 0)!;
  const others = [3, 2, 0, 1].map((o) => cal.ocean.findIndex((v, i) => v === o && cal.bedrooms[i] !== null && i > 1000));
  const ids = [m1, others[0], m2, others[1], others[2], others[3]];
  const med = (g: string) => { const v = present(cal.bedrooms.filter((_, j) => groups[j] === g)).sort((a, b) => a - b); const n = v.length; return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2; };
  const allBed = present(cal.bedrooms).sort((a, b) => a - b);
  const medAll = allBed.length % 2 ? allBed[(allBed.length - 1) / 2] : (allBed[allBed.length / 2 - 1] + allBed[allBed.length / 2]) / 2;
  const inc6 = ids.map((i) => cal.income[i]);
  const z6 = standardize(inc6).z, mm6 = minMax(inc6).z, lg6 = inc6.map((v) => Math.log(v));
  const nMiss = missIdx.length;

  const dien = rec('dien'), mahoa = rec('mahoa'), rori = rec('rori'), chia = rec('chia'), nhieu = rec('nhieu'), ts = rec('truocsau');
  const eps = 0.3;

  return {
    slug: 'xu-ly-du-lieu',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 3B', title: 'Xử lý dữ liệu', sub: 'cùng một mô hình, chỉ dữ liệu thay đổi' },
            lines: [
              L('Chương 3B: xử lý dữ liệu và xây một bộ dữ liệu tốt.', undefined, { say: 'Chương ba B: xử lý dữ liệu và xây một bộ dữ liệu tốt.' }),
              L('Chương trước đã tìm ra những vấn đề của dữ liệu California. Giờ ta sửa chúng.'),
              L('Thí nghiệm của cả chương: giữ nguyên một mô hình hồi quy tuyến tính, không đổi thuật toán, chỉ dữ liệu thay đổi.'),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Luật xuyên suốt', items: [
              'Mọi bước <b>học một con số từ dữ liệu</b> (trung vị để điền, trung bình để chuẩn hoá)…',
              '…chỉ được học từ <b>tập huấn luyện</b>.',
              'Phá luật này là <b>rò rỉ dữ liệu</b>: điểm đánh giá đẹp hơn sự thật.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Có một luật xuyên suốt bài. Mọi bước xử lý có học một con số từ dữ liệu, như trung vị để điền ô trống hay trung bình để chuẩn hoá…', { n: 1, hl: 0 }),
              L('…đều chỉ được học từ tập huấn luyện.', { n: 2, hl: 1 }),
              L('Phá luật này gọi là rò rỉ dữ liệu: lỗi khiến điểm đánh giá đẹp hơn sự thật, và chỉ lộ ra khi mô hình đã được dùng.', { n: 3, hl: 2 }),
            ],
          },
        ],
      },
      {
        id: 'kham-pha', title: 'Việc cần làm', section: 'kham-pha',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Phiếu khám, xếp theo việc cần làm', items: [
              `<b>Điền</b>: cột phòng ngủ thiếu ${nMiss} ô.`,
              '<b>Mã hoá</b>: vị trí so với biển là chữ, mô hình chỉ hiểu số.',
              '<b>Biến đổi</b>: các cột đếm lệch phải, thang đo chênh nhau.',
              '<b>Thiết kế</b>: số đếm phụ thuộc cỡ khu vực, cần tỷ lệ.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Nhắc lại phiếu khám của chương 3A, xếp theo việc cần làm.', undefined, { say: 'Nhắc lại phiếu khám của chương ba A, xếp theo việc cần làm.' }),
              L(`Một: điền. Cột phòng ngủ thiếu ${nMiss} ô.`, { n: 1, hl: 0 }),
              L('Hai: mã hoá. Vị trí so với biển là chữ, mà mô hình chỉ hiểu số.', { n: 2, hl: 1 }),
              L('Ba: biến đổi thang đo. Các cột đếm lệch phải, và thu nhập với dân số chênh nhau hàng nghìn lần.', { n: 3, hl: 2 }),
              L('Bốn: thiết kế đặc trưng. Số phòng hay số người phụ thuộc vào cỡ khu vực, nên tỷ lệ mới là thứ có ý nghĩa.', { n: 4, hl: 3 }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: mỗi cách điền là một giả định', section: 'truc-giac',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Không có cách điền "trung lập"', items: [
              '<b>Trung bình / trung vị</b>: ô trống giống một khu vực điển hình.',
              '<b>Theo nhóm</b>: ô trống giống các khu vực cùng nhóm.',
              '<b>Láng giềng gần nhất</b>: ô trống giống các khu vực giống nó ở mọi cột khác.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Không có cách điền trung lập. Mỗi cách là một giả định về lý do ô bị trống.'),
              L('Điền trung vị là giả định ô trống trông giống một khu vực điển hình.', { n: 1, hl: 0 }),
              L('Điền theo nhóm là giả định nó giống các khu vực cùng nhóm.', { n: 2, hl: 1 }),
              L('Điền bằng láng giềng gần nhất là giả định nó giống những khu vực có các cột khác gần nó nhất.', { n: 3, hl: 2 }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Che bớt ô thật, điền lại, rồi so',
              cols: ['Cách điền', 'Sai lệch khi đoán lại', 'RMSE mô hình giá nhà'],
              cls: ['t', '', ''],
              rows: dien.map((r) => [r.label, `${fmt(r.values[0], 1)} phòng`, fmt(r.values[1], 4)]),
            },
            init: { n: 0, hl: -1, hc: -1 },
            lines: [
              L('Để so các cách điền, ta che bớt những ô đang có số thật, điền lại, rồi đo sai lệch.', { n: 2 }, { anim: 2 }),
              L(`Điền trung vị sai trung bình ${fmt(dien[0].values[0], 1)} phòng. Láng giềng gần nhất chỉ sai ${fmt(dien[1].values[0], 1)} phòng, chính xác hơn hẳn.`, { hc: 1 }, { say: `Điền trung vị sai trung bình ${sn(dien[0].values[0], 1)} phòng. Láng giềng gần nhất chỉ sai ${sn(dien[1].values[0], 1)} phòng, chính xác hơn hẳn.` }),
              L(`Nhưng sai số của mô hình giá nhà gần như không đổi: ${fmt(dien[0].values[1], 4)} so với ${fmt(dien[1].values[1], 4)}.`, { hc: 2 }, { say: `Nhưng sai số của mô hình giá nhà gần như không đổi: ${sn(dien[0].values[1], 4)} so với ${sn(dien[1].values[1], 4)}.` }),
              L('Vì chỉ khoảng một phần trăm số ô bị thiếu. Đoán lại ô thiếu thật giỏi chưa chắc làm mô hình tốt hơn: hãy luôn đo bằng chính mục tiêu cuối.', { hc: -1 }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Mã hoá cột vị trí',
              cols: ['Cách mã hoá', 'RMSE'],
              cls: ['t', ''],
              rows: mahoa.map((r) => [r.label, fmt(r.values[0], 4)]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Cột vị trí: bỏ đi, RMSE là ${fmt(mahoa[0].values[0], 4)}.`, { n: 1, hl: 0 }, { say: `Cột vị trí: bỏ đi, sai số là ${sn(mahoa[0].values[0], 4)}.` }),
              L(`Đánh số từ 0 đến 4: ${fmt(mahoa[1].values[0], 4)}, gần như không giúp gì. Con số tự đặt ra một thứ tự giả: "gần vịnh" không lớn gấp đôi "nội địa".`, { n: 2, hl: 1 }, { say: `Đánh số từ không đến bốn: ${sn(mahoa[1].values[0], 4)}, gần như không giúp gì. Con số tự đặt ra một thứ tự giả: gần vịnh không lớn gấp đôi nội địa.` }),
              L(`One-hot, mỗi loại một cột 0 hoặc 1: ${fmt(mahoa[2].values[0], 4)}, tốt nhất.`, { n: 3, hl: 2 }, { say: `One-hot, mỗi loại một cột chỉ chứa không hoặc một: ${sn(mahoa[2].values[0], 4)}, tốt nhất.` }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay qua dây chuyền', section: 'tinh-tay',
        scenes: [
          {
            view: 'Table',
            props: {
              title: '6 khu vực đi qua dây chuyền',
              cols: ['Vị trí', 'Phòng ngủ', 'Sau điền', 'Thu nhập', 'z', 'min-max', 'log'],
              cls: ['t', '', 'v-g', 'v-x', '', '', ''],
              rows: ids.map((i, k) => [oceanVi[groups[i]] ?? groups[i], cal.bedrooms[i] === null ? '—' : String(cal.bedrooms[i]), fmt(filled[i], 0), fmt(inc6[k], 4), fmt(z6[k], 2), fmt(mm6[k], 2), fmt(lg6[k], 2)]),
            },
            init: { n: 6, c: 4, hl: -1, hc: -1 },
            lines: [
              L('Sáu khu vực đi qua cả dây chuyền. Hai khu vực đầu và thứ ba thiếu số phòng ngủ.', { hl: 0 }, { say: 'Sáu khu vực đi qua cả dây chuyền. Khu vực thứ nhất và thứ ba thiếu số phòng ngủ.' }),
              L(`Điền theo trung vị của nhóm: khu vực nội địa nhận ${fmt(med(groups[m1]), 0)} phòng, khu vực "cách biển dưới 1 giờ" nhận ${fmt(med(groups[m2]), 0)}. Trung vị chung của cả bộ là ${fmt(medAll, 0)}.`, { hc: 2 }, {
                say: `Điền theo trung vị của nhóm: khu vực nội địa nhận ${speakNum(fmt(med(groups[m1]), 0))} phòng, khu vực cách biển dưới một giờ nhận ${speakNum(fmt(med(groups[m2]), 0))}. Trung vị chung của cả bộ là ${speakNum(fmt(medAll, 0))}.`,
              }),
              L('Cột thu nhập qua ba phép biến đổi thang đo.', { c: 5, hc: 3 }),
              L('Chuẩn hoá z: trừ trung bình, chia độ lệch chuẩn. Trung bình về 0, độ lệch chuẩn về 1, nhưng hình dạng phân phối giữ nguyên.', { c: 5, hc: 4 }, { say: 'Chuẩn hoá z: trừ trung bình, chia độ lệch chuẩn. Trung bình về không, độ lệch chuẩn về một, nhưng hình dạng phân phối giữ nguyên.' }),
              L('Min-max ép mọi giá trị vào đoạn từ 0 đến 1, nên rất nhạy với một giá trị cực lớn.', { c: 6, hc: 5 }, { say: 'Min-max ép mọi giá trị vào đoạn từ không đến một, nên rất nhạy với một giá trị cực lớn.' }),
              L('Log thì kéo cái đuôi dài bên phải lại gần, làm phân phối lệch trở nên cân đối hơn.', { c: 7, hc: 6 }),
              L('Và nhớ luật: trung vị, trung bình, độ lệch chuẩn ở đây đều phải tính trên tập huấn luyện, rồi đem áp dụng cho tập test.', { hc: -1 }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết: rò rỉ và cách chia', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Ba dạng rò rỉ dữ liệu', items: [
              '<b>Từ nhãn</b>: đặc trưng tính từ đáp án, hoặc chỉ có sau khi biết đáp án.',
              '<b>Từ tập test</b>: bước xử lý học tham số trên cả tập test.',
              '<b>Qua bản sao</b>: cùng một đối tượng nằm ở cả hai tập.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Rò rỉ xảy ra khi mô hình được huấn luyện hoặc đánh giá với thông tin mà lúc dùng thật nó không có.'),
              L('Rò rỉ từ nhãn: một đặc trưng tính từ chính đáp án, hoặc chỉ có sau khi biết đáp án, như số tiền bồi thường khi dự đoán ai sẽ nộp đơn bảo hiểm.', { n: 1, hl: 0 }),
              L('Rò rỉ từ tập test: chuẩn hoá, điền thiếu hay chọn đặc trưng trên toàn bộ dữ liệu trước khi chia.', { n: 2, hl: 1 }),
              L('Rò rỉ qua bản sao: cùng một bệnh nhân chụp hai lần, hay cùng một toạ độ, nằm ở cả train và test.', { n: 3, hl: 2 }),
              L('Cách phòng: đặt mọi bước vào một pipeline, chỉ gọi fit trên phần huấn luyện. Và với từng cột, hỏi: lúc cần dự đoán, cột này đã có giá trị chưa?', { hl: -1 }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Chia train/test thế nào', items: [
              '<b>Ngẫu nhiên</b>: các dòng độc lập, dữ liệu thật đến từ cùng nguồn.',
              '<b>Phân tầng</b>: có lớp hiếm, giữ đúng tỷ lệ lớp ở mỗi tập.',
              '<b>Theo nhóm</b>: cả nhóm (vùng, bệnh nhân, người dùng) vào một tập.',
              '<b>Theo thời gian</b>: học trên quá khứ, kiểm tra trên tương lai.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tập test phải mô phỏng đúng tình huống mô hình sẽ gặp. Có bốn cách chia.'),
              L('Ngẫu nhiên, khi các dòng độc lập với nhau.', { n: 1, hl: 0 }),
              L('Phân tầng, khi có lớp hiếm, để tập test nhỏ không thiếu hẳn lớp hiếm.', { n: 2, hl: 1 }),
              L('Theo nhóm, khi các dòng trong cùng nhóm giống nhau: cả nhóm phải vào cùng một tập.', { n: 3, hl: 2 }),
              L('Theo thời gian, khi dự báo tương lai: học trên quá khứ, kiểm tra trên giai đoạn sau.', { n: 4, hl: 3 }),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Dữ liệu tốt hơn, hay nhiều hơn?', items: [
              { label: 'Lật tỷ lệ ε', tex: String.raw`\text{khoảng cách đúng – sai} = 1 - 2\varepsilon` },
              { label: 'ε = 30%', tex: String.raw`1 - 2 \times 0{,}3 = ${fmt(1 - 2 * eps, 1).replace(',', '{,}')}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Nhãn bị lật ngẫu nhiên với tỷ lệ ε thì mỗi nhãn chỉ còn mang một phần thông tin: khoảng cách giữa đúng và sai còn 1 − 2ε.', { n: 1, hl: 0 }, { say: 'Nhãn bị lật ngẫu nhiên với tỷ lệ ép-xi-lon thì mỗi nhãn chỉ còn mang một phần thông tin: khoảng cách giữa đúng và sai còn một trừ hai ép-xi-lon.' }),
              L('Lật 30% thì khoảng cách chỉ còn 0,4 thay vì 1. Mô hình cần nhiều mẫu hơn hẳn để lọc ra cùng một tín hiệu.', { n: 2, hl: 1 }, { say: 'Lật ba mươi phần trăm thì khoảng cách chỉ còn không phẩy bốn thay vì một. Mô hình cần nhiều mẫu hơn hẳn để lọc ra cùng một tín hiệu.' }),
              L('Còn với nhãn sai có hệ thống, thêm bao nhiêu mẫu cũng không lọc được. Đó là lý do làm sạch nhãn thường đáng giá hơn thu thập thêm.', { hl: -1 }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Phiếu dữ liệu', items: [
              '<b>Nguồn</b>: điều tra dân số Mỹ 1990, mỗi dòng là một khu vực, không phải một căn nhà.',
              '<b>Giới hạn</b>: giá và thu nhập bị chặn trần; dữ liệu đã hơn 30 năm tuổi.',
              '<b>Mục đích được phép</b>: học tập, không định giá nhà thật hôm nay.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Cuối cùng, một bộ dữ liệu tốt nên đi kèm một phiếu dữ liệu, giống bảng thông số của linh kiện điện tử. Đó là đề xuất "Datasheets for Datasets" của Gebru và cộng sự.'),
              L('Phiếu ghi nguồn gốc: dữ liệu này từ điều tra dân số Mỹ năm 1990, mỗi dòng là một khu vực, không phải một căn nhà.', { n: 1, hl: 0 }, { say: 'Phiếu ghi nguồn gốc: dữ liệu này từ điều tra dân số Mỹ năm một nghìn chín trăm chín mươi, mỗi dòng là một khu vực, không phải một căn nhà.' }),
              L('Ghi giới hạn: giá và thu nhập bị chặn trần, và dữ liệu đã hơn 30 năm tuổi.', { n: 2, hl: 1 }, { say: 'Ghi giới hạn: giá và thu nhập bị chặn trần, và dữ liệu đã hơn ba mươi năm tuổi.' }),
              L('Và ghi mục đích được phép: dùng để học tập, không phải để định giá một căn nhà thật hôm nay.', { n: 3, hl: 2 }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn: pipeline', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'pipeline.py', code: xuLyPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Trong scikit-learn, ColumnTransformer áp dụng các bước khác nhau cho các nhóm cột khác nhau.', { a: 8, b: 15 }),
              L('Cột số: điền trung vị rồi chuẩn hoá. Thu nhập và dân số: thêm log. Cột vị trí: one-hot.', { a: 11, b: 14 }),
              L('Pipeline nối các bước xử lý với mô hình thành một khối.', { a: 16, b: 16 }),
              L('Cross-validation gọi fit của cả khối trên từng phần huấn luyện, nên không có gì rò rỉ sang phần kiểm tra.', { a: 18, b: 22 }),
              L('Vòng lặp cuối so hai cách chia: ngẫu nhiên và theo ô địa lý. Bạn có thể chạy nó ở bước 6.', undefined, { say: 'Vòng lặp cuối so hai cách chia: ngẫu nhiên và theo ô địa lý. Bạn có thể chạy nó ở bước sáu.' }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Ba thí nghiệm', section: 'danh-gia',
        scenes: [
          {
            view: 'Table',
            props: {
              title: 'Rò rỉ: điểm báo cáo và điểm khi dùng thật',
              cols: ['Mô hình', 'RMSE báo cáo', 'RMSE khi dùng thật'],
              cls: ['t', '', ''],
              rows: rori.map((r) => [r.label, fmt(r.values[0], 4), fmt(r.values[1], 4)]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Thí nghiệm 1. Mô hình gốc báo cáo RMSE ${fmt(rori[0].values[0], 4)}, khi dùng thật là ${fmt(rori[0].values[1], 4)}.`, { n: 1, hl: 0 }, { say: `Thí nghiệm một. Mô hình gốc báo cáo sai số ${sn(rori[0].values[0], 4)}, khi dùng thật là ${sn(rori[0].values[1], 4)}.` }),
              L(`Thêm cột "giá trung bình của ô lưới", tính trên cả train lẫn test: điểm báo cáo đẹp hẳn, ${fmt(rori[1].values[0], 4)}. Nhưng khi dùng thật chỉ còn ${fmt(rori[1].values[1], 4)}.`, { n: 2, hl: 1 }, { say: `Thêm cột giá trung bình của ô lưới, tính trên cả train lẫn test: điểm báo cáo đẹp hẳn, ${sn(rori[1].values[0], 4)}. Nhưng khi dùng thật chỉ còn ${sn(rori[1].values[1], 4)}.` }),
              L(`Tệ nhất: cột "phân khúc giá" tính từ chính giá nhà. Báo cáo ${fmt(rori[2].values[0], 4)}, đẹp như mơ. Dùng thật: ${fmt(rori[2].values[1], 4)}, tệ hơn cả mô hình gốc.`, { n: 3, hl: 2 }, { say: `Tệ nhất: cột phân khúc giá tính từ chính giá nhà. Báo cáo ${sn(rori[2].values[0], 4)}, đẹp như mơ. Dùng thật: ${sn(rori[2].values[1], 4)}, tệ hơn cả mô hình gốc.` }),
              L('Cột tốt đến khó tin thường là rò rỉ. Trước khi vui mừng vì một đặc trưng mạnh, hãy hỏi: lúc cần dự đoán, ta đã biết giá trị này chưa?', { hl: -1 }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Cách chia quyết định điểm số',
              cols: ['Cách chia', 'RMSE', 'Trùng toạ độ với train'],
              cls: ['t', '', ''],
              rows: chia.map((r) => [r.label, fmt(r.values[0], 3), `${fmt(r.values[1], 1)}%`]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Thí nghiệm 2. Chia ngẫu nhiên: RMSE ${fmt(chia[0].values[0], 3)}. Nhưng ${fmt(chia[0].values[1], 1)}% khu vực test có toạ độ trùng với một khu vực trong train.`, { n: 2 }, { anim: 2, say: `Thí nghiệm hai. Chia ngẫu nhiên: sai số ${sn(chia[0].values[0], 3)}. Nhưng ${sn(chia[0].values[1], 1)} phần trăm khu vực test có toạ độ trùng với một khu vực trong train.` }),
              L(`Chia theo ô địa lý một độ, không ô nào nằm ở cả hai tập: RMSE tăng lên ${fmt(chia[2].values[0], 3)}.`, { n: 3, hl: 2 }, { say: `Chia theo ô địa lý một độ, không ô nào nằm ở cả hai tập: sai số tăng lên ${sn(chia[2].values[0], 3)}.` }),
              L('Nếu mô hình sẽ được dùng ở vùng mới, con số thứ hai mới là sự thật. Chia ngẫu nhiên để mô hình nhớ anh em sinh đôi thay vì học quy luật.', { hl: -1 }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Nhiều dữ liệu hơn giúp ai?',
              cols: ['Số mẫu', 'Tuyến tính', 'KNN'],
              cls: ['t', '', ''],
              rows: nhieu.map((r) => [r.label, fmt(r.values[0], 3), fmt(r.values[1], 3)]),
            },
            init: { n: 0, hl: -1, hc: -1 },
            lines: [
              L(`Thí nghiệm 3: đường cong học. Với 200 mẫu, hồi quy tuyến tính có RMSE ${fmt(nhieu[0].values[0], 3)}, KNN ${fmt(nhieu[0].values[1], 3)}.`, { n: 1 }, { say: `Thí nghiệm ba: đường cong học. Với hai trăm mẫu, hồi quy tuyến tính có sai số ${sn(nhieu[0].values[0], 3)}, KNN ${sn(nhieu[0].values[1], 3)}.` }),
              L(`Tăng lên hơn 16 nghìn mẫu: tuyến tính chỉ nhích xuống ${fmt(nhieu[1].values[0], 3)}, còn KNN xuống hẳn ${fmt(nhieu[1].values[1], 3)}.`, { n: 2 }, { say: `Tăng lên hơn mười sáu nghìn mẫu: tuyến tính chỉ nhích xuống ${sn(nhieu[1].values[0], 3)}, còn KNN xuống hẳn ${sn(nhieu[1].values[1], 3)}.` }),
              L('Mô hình tuyến tính đã chạm giới hạn của chính nó: thêm dữ liệu vô ích, cần đặc trưng tốt hơn. KNN thì vẫn còn đói dữ liệu.', { hc: 1 }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Gom lại: trước và sau khi xử lý',
              cols: ['Dữ liệu', 'Chia ngẫu nhiên', 'Chia theo vùng'],
              cls: ['t', '', ''],
              rows: ts.map((r) => [r.label, fmt(r.values[0], 4), fmt(r.values[1], 4)]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Gom mọi bước lại. Chỉ dùng thu nhập: RMSE ${fmt(ts[0].values[0], 4)} khi chia ngẫu nhiên.`, { n: 1, hl: 0 }, { say: `Gom mọi bước lại. Chỉ dùng thu nhập: sai số ${sn(ts[0].values[0], 4)} khi chia ngẫu nhiên.` }),
              L(`Thêm các đặc trưng tự thiết kế: ${fmt(ts[1].values[0], 4)}, và ${fmt(ts[1].values[1], 4)} khi chia theo vùng. Cùng một mô hình, chỉ dữ liệu thay đổi.`, { n: 2, hl: 1 }, { say: `Thêm các đặc trưng tự thiết kế: ${sn(ts[1].values[0], 4)}, và ${sn(ts[1].values[1], 4)} khi chia theo vùng. Cùng một mô hình, chỉ dữ liệu thay đổi.` }),
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
              'Mỗi cách điền là một <b>giả định</b>; đo bằng mục tiêu cuối.',
              'Cột phân loại: <b>one-hot</b>, không đánh số tuỳ ý.',
              'Mọi bước học tham số nằm <b>trong pipeline</b>, chỉ fit trên train.',
              'Chia <b>theo nhóm, theo thời gian</b> khi dữ liệu có cấu trúc.',
              'Đường cong học đã phẳng: <b>đừng thu thập thêm</b>, hãy cải thiện đặc trưng.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Mỗi cách điền ô trống là một giả định. Hãy đo bằng mục tiêu cuối cùng, không phải độ chính xác của việc điền.', { n: 1, hl: 0 }),
              L('Cột phân loại thì mã hoá one-hot.', { n: 2, hl: 1 }),
              L('Mọi bước học tham số nằm trong pipeline và chỉ học trên tập huấn luyện. Cột tốt đến khó tin thường là rò rỉ.', { n: 3, hl: 2 }),
              L('Chia dữ liệu theo đúng cách mô hình sẽ được dùng: theo nhóm, theo thời gian khi cần.', { n: 4, hl: 3 }),
              L('Và khi đường cong học đã phẳng, đừng đi thu thập thêm: hãy cải thiện đặc trưng hoặc mô hình.', { n: 5, hl: 4 }),
              L('Chương 4 trở lại với thuật toán: K láng giềng gần nhất và Naive Bayes.', { hl: -1 }, { say: 'Chương bốn trở lại với thuật toán: K láng giềng gần nhất và Naive Bayes.' }),
              L('Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương 4.', undefined, { say: 'Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương bốn.' }),
            ],
          },
        ],
      },
    ],
  };
}
