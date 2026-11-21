/**
 * Bài giảng chương 3A: khám phá và đánh giá dữ liệu (California Housing đầy đủ, Titanic, Breast Cancer).
 * Thống kê mô tả, tương quan, ngoại lai do ml-core tính (profile, pearson, iqrBounds, zscores, histogram).
 * Hai thí nghiệm dùng mô hình (nhãn sai, lệch phân phối) lấy số từ bảng ghi của bài, vốn được
 * tests/learn.test.ts tính lại bằng chính logic của lab.
 */
import california from '../../data/california.json';
import titanic from '../../data/titanic.json';
import { profile, pearson, iqrBounds, zscores, histogram, sortNum, avg, quantile, permutation, fmt } from '../ml-core';
import { khamPhaLearn } from '../hoc/kham-pha-du-lieu';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const int = (v: number) => Math.round(v).toLocaleString('vi-VN');
const rec = (id: string) => khamPhaLearn.missions.find((m) => m.id === id)!.record!.rows;

export const khamPhaPyCode = `import json
from pyodide.http import open_url

raw = json.loads(open_url(".../california.json").read())
cot = ["lon", "lat", "age", "rooms", "bedrooms", "pop", "hh", "income", "value"]
df = pd.DataFrame({k: raw[k] for k in cot})

print(df.describe().round(3).T)                 # phiếu khám từng cột
print("Ô thiếu:", df.isna().sum()[lambda s: s > 0].to_dict())
print("Dòng trùng hoàn toàn:", df.duplicated().sum())
print("Số khu vực ở đúng giá trần:", (df.value == df.value.max()).sum())

# Ngoại lai theo quy tắc 1,5·IQR trên "người mỗi hộ"
nph = df["pop"] / df.hh
q1, q3 = nph.quantile([0.25, 0.75])
ngoai_lai = nph[(nph < q1 - 1.5 * (q3 - q1)) | (nph > q3 + 1.5 * (q3 - q1))]
print("Ngoại lai người/hộ:", len(ngoai_lai), "khu vực")

print(df[cot].corr().round(2))`;

export function khamPhaLecture(): Lecture {
  const cal = california as unknown as Record<string, number[]> & { n: number; cats: string[] };
  const N = cal.n;
  const P = { income: profile(cal.income), value: profile(cal.value), age: profile(cal.age), bed: profile(cal.bedrooms as (number | null)[]) };
  const islands = cal.ocean.filter((o) => cal.cats[o] === 'ISLAND').length;

  // Biểu đồ giá nhà: cột cuối là đỉnh nhọn của giá trần
  const hv = histogram(cal.value, 13, 0, 5.2);
  // Tương quan
  const rIV = pearson(cal.income, cal.value);
  const rRP = pearson(cal.rooms, cal.pop);
  const rph = cal.rooms.map((r, i) => r / cal.hh[i]);
  const pph = cal.pop.map((p, i) => p / cal.hh[i]);
  const rRatio = pearson(rph, pph);
  const samp = permutation(N, 7).slice(0, 1500);
  const scat = (a: number[], b: number[]) => samp.map((i) => [a[i], b[i]]);
  // Ngoại lai người/hộ
  const s = sortNum(pph);
  const iq = iqrBounds(s);
  const nIqr = pph.filter((v) => v < iq.lo || v > iq.hi).length;
  const nZ = zscores(pph).filter((z) => Math.abs(z) > 3).length;
  const maxPph = s[s.length - 1];

  // Tính tay: 10 khu vực, khu vực cuối mang thu nhập bị chặn 15,0001 (như trang)
  const ids = [...permutation(N, 3).slice(0, 9), cal.income.indexOf(15.0001)];
  const inc = ids.map((i) => cal.income[i]);
  const si = sortNum(inc);
  const mean10 = avg(inc), med10 = quantile(si, 0.5), med9 = quantile(sortNum(inc.slice(0, 9)), 0.5), mean9 = avg(inc.slice(0, 9));
  const iq10 = iqrBounds(si);
  const z15 = zscores(inc)[9];

  // Titanic
  const ppl = titanic.people;
  const byClass = [1, 2, 3].map((c) => { const g = ppl.filter((p) => p.pclass === c); return g.filter((p) => p.ageMissing).length / g.length; });
  const surv = (f: (p: (typeof ppl)[number]) => boolean) => { const g = ppl.filter(f); return g.filter((p) => p.survived).length / g.length; };
  const pc = (v: number) => `${Math.round(100 * v)}%`;

  const noise = rec('nhansai');
  const shift = rec('lech');

  return {
    slug: 'kham-pha-du-lieu',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 3A', title: 'Khám phá dữ liệu', sub: 'phiếu khám sức khoẻ cho một bộ dữ liệu' },
            lines: [
              L('Chương 3A: khám phá và đánh giá dữ liệu.', undefined, { say: 'Chương ba A: khám phá và đánh giá dữ liệu.' }),
              L('Ba chương trước, dữ liệu luôn đến tay ta đã sạch sẽ: đúng hai cột, không ô trống, chia sẵn train và test. Ngoài đời không như vậy.'),
              L(`Hình dung một đồng nghiệp gửi bạn tệp ${int(N)} dòng về giá nhà ở California và hỏi: dữ liệu này dùng để huấn luyện được chưa?`),
              L('Không có nút bấm nào trả lời thay. Mô hình sẽ học mọi thứ có trong dữ liệu, kể cả lỗi nhập liệu và thói quen của người thu thập.'),
              L('Chương này dạy cách nhìn và đo. Chương 3B sẽ dạy cách sửa.', undefined, { say: 'Chương này dạy cách nhìn và đo. Chương ba B sẽ dạy cách sửa.' }),
            ],
          },
        ],
      },
      {
        id: 'kham-pha', title: 'Phiếu khám từng cột', section: 'kham-pha',
        scenes: [
          {
            view: 'Table',
            props: {
              title: `Phiếu khám: ${int(N)} khu vực`,
              cols: ['Cột', 'Thiếu', 'Trung bình', 'Trung vị', 'Lớn nhất', 'Số dòng ở max'],
              cls: ['t', '', '', '', '', ''],
              rows: [
                ['Thu nhập', String(P.income.missing), fmt(P.income.mean, 3), fmt(P.income.median, 3), fmt(P.income.max, 4), int(P.income.atMax)],
                ['Giá nhà', String(P.value.missing), fmt(P.value.mean, 3), fmt(P.value.median, 3), fmt(P.value.max, 5), int(P.value.atMax)],
                ['Tuổi nhà', String(P.age.missing), fmt(P.age.mean, 1), fmt(P.age.median, 0), fmt(P.age.max, 0), int(P.age.atMax)],
                ['Phòng ngủ', int(P.bed.missing), fmt(P.bed.mean, 0), fmt(P.bed.median, 0), int(P.bed.max), int(P.bed.atMax)],
              ],
            },
            init: { n: 0, hl: -1, hc: -1 },
            lines: [
              L('Việc đầu tiên là lập phiếu khám sức khoẻ cho từng cột: có bao nhiêu ô, thiếu bao nhiêu, giá trị nằm trong khoảng nào.', { n: 4 }, { anim: 2.5, ease: 'lin' }),
              L(`Cột phòng ngủ thiếu ${int(P.bed.missing)} ô.`, { hl: 3, hc: 1 }),
              L(`Giá nhà: ${int(P.value.atMax)} khu vực có đúng cùng một giá lớn nhất, 500.001 USD. Đó không phải giá thật: hệ thống cũ không lưu được số lớn hơn.`, { hl: 1, hc: 5 }),
              L(`Thu nhập cũng vậy: ${P.income.atMax} khu vực bị chặn ở đúng 15,0001. Tuổi nhà dừng ở ${fmt(P.age.max, 0)} năm với ${int(P.age.atMax)} khu vực.`, { hl: 0 }),
              L(`Và để ý: trung bình luôn lớn hơn trung vị. Các cột này lệch phải, có một cái đuôi dài.`, { hl: -1, hc: 2 }),
              L(`Loại vị trí "trên đảo" chỉ có ${islands} khu vực: quá ít để mô hình học được gì.`, { hc: -1 }),
            ],
          },
          {
            view: 'Chart',
            props: {
              title: 'Giá nhà: bao nhiêu khu vực ở mỗi mức giá?',
              bars: hv.map((c, i) => ({ label: fmt(i * 0.4 + 0.2, 1), value: c, color: i === 12 ? 1 : 0, text: int(c) })),
              ylab: 'số khu vực', ydom: [0, Math.max(...hv) * 1.12], yfmt: 'int',
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Vẽ phân bố giá nhà thành các cột, mỗi cột rộng 40.000 USD.', { n: 13 }, { anim: 3, ease: 'lin', say: 'Vẽ phân bố giá nhà thành các cột, mỗi cột rộng bốn mươi nghìn đô la.' }),
              L('Phân bố trơn tru, rồi đột nhiên có một cột nhô lên ở tận cùng bên phải.', { hl: 12 }),
              L('Không vấn đề nào ở đây làm chương trình báo lỗi. Mô hình vẫn chạy, chỉ là học sai một cách lặng lẽ.', { hl: -1 }),
            ],
          },
          {
            view: 'Points',
            props: {
              pts: scat(cal.rooms, cal.pop), xlab: 'tổng số phòng', ylab: 'dân số', xdom: [0, 12000], ydom: [0, 7000], dot: 2.6,
              frames: [{ read: `r = <b>${fmt(rRP, 3)}</b>` }],
            },
            init: { f: 0 },
            lines: [
              L('Bước tiếp theo: các cột liên quan với nhau thế nào. Số phòng và dân số tương quan rất mạnh.'),
              L(`Hệ số tương quan r = ${fmt(rRP, 3)}. Nhưng đây có phải một phát hiện không?`, undefined, { say: `Hệ số tương quan bằng ${speakNum(fmt(rRP, 3))}. Nhưng đây có phải một phát hiện không?` }),
              L('Không. Khu vực lớn thì vừa nhiều phòng vừa nhiều người. Cả hai cột chỉ cùng đo kích thước của khu vực.'),
            ],
          },
          {
            view: 'Points',
            props: {
              pts: scat(rph, pph), xlab: 'số phòng mỗi hộ', ylab: 'số người mỗi hộ', xdom: [0, 12], ydom: [0, 7], dot: 2.6,
              frames: [{ read: `r = <b>${fmt(rRatio, 3)}</b>` }],
            },
            init: { f: 0 },
            lines: [
              L(`Chia cả hai cho số hộ: tương quan biến mất, r = ${fmt(rRatio, 3)}.`, undefined, { say: `Chia cả hai cho số hộ: tương quan biến mất, chỉ còn ${speakNum(fmt(rRatio, 3))}.` }),
              L(`Còn thu nhập và giá nhà, r = ${fmt(rIV, 3)}, là một quan hệ thật, như ta đã dùng ở chương 1.`, undefined, { say: `Còn thu nhập và giá nhà, tương quan ${speakNum(fmt(rIV, 3))}, là một quan hệ thật, như ta đã dùng ở chương một.` }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: rác vào, rác ra', section: 'truc-giac',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Rác vào, rác ra', items: [
              'Mô hình không biết dòng nào là lỗi: nó cố khớp <b>mọi</b> dòng.',
              'Sai số bị bình phương: một điểm lệch xa nặng bằng <b>hàng chục</b> điểm thường.',
              'Nhưng không phải điểm lạ nào cũng là rác: <b>hỏi vì sao</b> trước khi xoá.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Người làm học máy có câu: rác vào, rác ra. Mô hình không biết dòng nào là lỗi, nó chỉ cố khớp mọi dòng.', { n: 1, hl: 0 }),
              L('Với hồi quy, sai số bị bình phương trước khi cộng lại. Một điểm lệch xa có sức nặng bằng hàng chục điểm bình thường.', { n: 2, hl: 1 }),
              L(`Nhưng không phải điểm lạ nào cũng là rác. Có khu vực trung bình tới ${fmt(maxPph, 0)} người mỗi hộ.`, { n: 3, hl: 2 }, { say: `Nhưng không phải điểm lạ nào cũng là rác. Có khu vực trung bình tới ${speakNum(fmt(maxPph, 0))} người mỗi hộ.` }),
              L('Đó không phải lỗi gõ phím: có thể là một trại lính hay ký túc xá. Việc của người làm dữ liệu là hỏi vì sao trước khi xoá.'),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'Hai quy tắc tìm ngoại lai', items: [
              { label: 'Quy tắc IQR', tex: String.raw`x < Q_1 - 1{,}5\cdot\text{IQR} \quad\text{hoặc}\quad x > Q_3 + 1{,}5\cdot\text{IQR}` },
              { label: 'Điểm z', tex: String.raw`|z| = \left|\frac{x - \bar x}{s}\right| > 3` },
              { label: 'Người mỗi hộ', tex: String.raw`\text{IQR: } ${nIqr} \text{ khu vực} \qquad |z| > 3\text{: } ${nZ} \text{ khu vực}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Có hai quy tắc phổ biến để đánh dấu ngoại lai.'),
              L('Quy tắc IQR: lấy khoảng giữa tứ phân vị thứ nhất và thứ ba, nới ra 1,5 lần độ rộng đó. Ngoài khoảng là ngoại lai.', { n: 1, hl: 0 }, { say: 'Quy tắc I Q R: lấy khoảng giữa tứ phân vị thứ nhất và thứ ba, nới ra một rưỡi lần độ rộng đó. Ngoài khoảng là ngoại lai.' }),
              L('Điểm z: cách trung bình hơn 3 độ lệch chuẩn là ngoại lai.', { n: 2, hl: 1 }, { say: 'Điểm z: cách trung bình hơn ba độ lệch chuẩn là ngoại lai.' }),
              L(`Trên cột người mỗi hộ: IQR đánh dấu ${nIqr} khu vực, còn điểm z chỉ đánh dấu ${nZ}. Vì sao chênh nhau nhiều vậy?`, { n: 3, hl: 2 }, { say: `Trên cột người mỗi hộ: quy tắc I Q R đánh dấu ${speakNum(String(nIqr))} khu vực, còn điểm z chỉ đánh dấu ${speakNum(String(nZ))}. Vì sao chênh nhau nhiều vậy?` }),
              L('Điểm z dùng trung bình và độ lệch chuẩn, đúng hai đại lượng mà ngoại lai làm phình to. Ngoại lai tự che giấu chính mình. Phần tính tay sẽ cho thấy rõ điều đó.', { hl: -1 }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay trên 10 khu vực', section: 'tinh-tay',
        scenes: [
          {
            view: 'Table',
            props: {
              title: 'Thu nhập của 10 khu vực (đã sắp xếp)',
              cols: ['#', 'Thu nhập', 'Điểm z'],
              cls: ['', 'v-x', ''],
              rows: si.map((v, i) => [String(i + 1), fmt(v, 4), fmt(zscores(inc)[inc.indexOf(v)], 2)]),
            },
            init: { n: 10, c: 2, hl: -1 },
            lines: [
              L('Tính lại phiếu khám bằng tay trên 10 khu vực. Chín khu vực chọn ngẫu nhiên, và một khu vực mang thu nhập lớn nhất bộ dữ liệu: 15,0001.', { hl: 9 }, { say: 'Tính lại phiếu khám bằng tay trên mười khu vực. Chín khu vực chọn ngẫu nhiên, và một khu vực mang thu nhập lớn nhất bộ dữ liệu: mười lăm phẩy không không không một.' }),
              L(`Trung bình của 10 số là ${fmt(mean10, 2)}. Trung vị, số đứng giữa, là ${fmt(med10, 3)}.`, { hl: -1 }),
              L(`Bỏ khu vực cuối đi: trung bình tụt về ${fmt(mean9, 2)}, còn trung vị gần như đứng yên ở ${fmt(med9, 3)}.`),
              L('Một khu vực đã kéo trung bình đi rất xa. Vì vậy phiếu khám luôn đặt trung bình cạnh trung vị.'),
              L(`Quy tắc IQR: giới hạn trên là ${fmt(iq10.hi, 3)}. Thu nhập 15 vượt xa, bị đánh dấu ngay.`, { hl: 9 }),
              L(`Còn điểm z của nó chỉ là ${fmt(z15, 3)}, dưới ngưỡng 3. Quy tắc z bỏ lọt!`, { c: 3 }, { say: `Còn điểm z của nó chỉ là ${speakNum(fmt(z15, 3))}, dưới ngưỡng ba. Quy tắc z bỏ lọt!` }),
              L('Thực ra với 10 số, điểm z không bao giờ vượt quá 3, dù giá trị kia lớn đến đâu. Ngoại lai làm độ lệch chuẩn phình to và tự che mình.', undefined, { say: 'Thực ra với mười số, điểm z không bao giờ vượt quá ba, dù giá trị kia lớn đến đâu. Ngoại lai làm độ lệch chuẩn phình to và tự che mình.' }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết: dữ liệu tốt là gì', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Ba lý do dữ liệu bị thiếu', items: [
              '<b>Hoàn toàn ngẫu nhiên</b> (MCAR): bỏ dòng thiếu không làm lệch, chỉ mất dữ liệu.',
              `<b>Ngẫu nhiên có điều kiện</b> (MAR): Titanic thiếu tuổi ${pc(byClass[2])} ở hạng ba, ${pc(byClass[1])} ở hạng hai.`,
              '<b>Không ngẫu nhiên</b> (MNAR): người thu nhập cao thường không khai thu nhập.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ô thiếu nên xử lý thế nào phụ thuộc vào vì sao nó thiếu.'),
              L('Thiếu hoàn toàn ngẫu nhiên, ví dụ phiếu điều tra bị thất lạc ngẫu nhiên. Bỏ dòng thiếu không làm lệch kết quả, chỉ làm mất dữ liệu.', { n: 1, hl: 0 }),
              L(`Thiếu phụ thuộc vào cột khác: trên tàu Titanic, ${pc(byClass[2])} hành khách hạng ba không rõ tuổi, so với ${pc(byClass[1])} ở hạng hai.`, { n: 2, hl: 1 }, {
                say: `Thiếu phụ thuộc vào cột khác: trên tàu Titanic, ${speakNum(String(Math.round(100 * byClass[2])))} phần trăm hành khách hạng ba không rõ tuổi, so với ${speakNum(String(Math.round(100 * byClass[1])))} phần trăm ở hạng hai.`,
              }),
              L('Thiếu phụ thuộc vào chính giá trị bị thiếu: người thu nhập rất cao thường không khai. Không cách điền nào sửa được hoàn toàn.', { n: 3, hl: 2 }),
              L(`Bản thân việc thiếu cũng là thông tin: chỉ ${pc(surv((p) => p.ageMissing))} hành khách không rõ tuổi sống sót, so với ${pc(surv((p) => !p.ageMissing))} hành khách có ghi tuổi.`, { hl: -1 }, {
                say: `Bản thân việc thiếu cũng là thông tin: chỉ ${speakNum(String(Math.round(100 * surv((p) => p.ageMissing))))} phần trăm hành khách không rõ tuổi sống sót, so với ${speakNum(String(Math.round(100 * surv((p) => !p.ageMissing))))} phần trăm hành khách có ghi tuổi.`,
              }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Thêm bốn điều cần đo', items: [
              '<b>Tương quan</b>: chỉ đo quan hệ tuyến tính, nhạy với ngoại lai, không phải nhân quả.',
              '<b>Lệch phân phối</b>: học ở nơi này, dùng ở nơi khác.',
              '<b>Nhãn sai</b>: có trong mọi bộ dữ liệu thật.',
              '<b>Cân bằng và công bằng</b>: dữ liệu mang theo định kiến của quá khứ.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tương quan có ba giới hạn: chỉ đo quan hệ tuyến tính, rất nhạy với ngoại lai, và không nói gì về nhân quả.', { n: 1, hl: 0 }),
              L('Lệch phân phối: mô hình chỉ đảm bảo hoạt động tốt trên dữ liệu giống dữ liệu huấn luyện. Học ở nội địa, dùng ở ven biển là chuyện khác.', { n: 2, hl: 1 }),
              L('Nhãn sai: người gán nhãn mệt mỏi, hướng dẫn mơ hồ, ca khó. Ngay cả bộ chữ số MNIST nổi tiếng cũng có nhãn sai.', { n: 3, hl: 2 }),
              L(`Cuối cùng là công bằng. Trên Titanic, ${pc(surv((p) => p.sex === 1))} phụ nữ sống sót so với ${pc(surv((p) => p.sex === 0))} nam giới.`, { n: 4, hl: 3 }, {
                say: `Cuối cùng là công bằng. Trên Titanic, ${speakNum(String(Math.round(100 * surv((p) => p.sex === 1))))} phần trăm phụ nữ sống sót so với ${speakNum(String(Math.round(100 * surv((p) => p.sex === 0))))} phần trăm nam giới.`,
              }),
              L('Điều đó đúng với lịch sử năm 1912, nhưng một mô hình học từ đây mà dùng cho một quyết định hôm nay sẽ là phân biệt đối xử.', undefined, { say: 'Điều đó đúng với lịch sử năm một nghìn chín trăm mười hai, nhưng một mô hình học từ đây mà dùng cho một quyết định hôm nay sẽ là phân biệt đối xử.' }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'phieu_kham.py', code: khamPhaPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Toàn bộ phiếu khám gói gọn trong vài lệnh pandas.', undefined, { say: 'Toàn bộ phiếu khám gói gọn trong vài lệnh pandas.' }),
              L('describe cho trung bình, độ lệch chuẩn, tứ phân vị của mọi cột cùng lúc.', { a: 8, b: 8 }),
              L('Đếm ô thiếu, dòng trùng, và số dòng ở đúng giá trần.', { a: 9, b: 11 }),
              L('Quy tắc IQR chỉ cần hai tứ phân vị.', { a: 13, b: 17 }, { say: 'Quy tắc I Q R chỉ cần hai tứ phân vị.' }),
              L('Và một ma trận tương quan cho mọi cặp cột. Hãy tạo thói quen chạy những lệnh này trước dòng huấn luyện đầu tiên.', { a: 19, b: 19 }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Đo bằng mô hình', section: 'danh-gia',
        scenes: [
          {
            view: 'Table',
            props: {
              title: 'Lật nhãn ngẫu nhiên trên Breast Cancer, rồi để mô hình phản đối',
              cols: ['Tỷ lệ lật', 'Độ chính xác test', 'Bị phản đối', 'Đúng là bị lật'],
              cls: ['t', '', '', ''],
              rows: noise.map((r) => [r.label.replace('p = ', ''), `${fmt(r.values[0], 1)}%`, String(r.values[1]), String(r.values[2])]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Hai lỗi nguy hiểm nhất không lộ ra trong phiếu khám, vì từng cột nhìn vẫn bình thường: nhãn sai và dữ liệu không đại diện. Ta đo chúng bằng mô hình.'),
              L(`Thí nghiệm: lật ngẫu nhiên một phần nhãn của Breast Cancer. Không lật gì, hồi quy logistic đạt ${fmt(noise[0].values[0], 1)}%.`, { n: 1 }, { say: `Thí nghiệm: lật ngẫu nhiên một phần nhãn của Breast Cancer. Không lật gì, hồi quy logistic đạt ${speakNum(fmt(noise[0].values[0], 1))} phần trăm.` }),
              L(`Lật 20%: vẫn đạt ${fmt(noise[1].values[0], 1)}%. Lật 40% thì sụp xuống ${fmt(noise[2].values[0], 1)}%.`, { n: 3 }, { anim: 2, say: `Lật hai mươi phần trăm: vẫn đạt ${speakNum(fmt(noise[1].values[0], 1))} phần trăm. Lật bốn mươi phần trăm thì sụp xuống ${speakNum(fmt(noise[2].values[0], 1))} phần trăm.` }),
              L(`Điều đáng chú ý: với 20% nhãn lật, mô hình phản đối ${noise[1].values[1]} mẫu, và ${noise[1].values[2]} mẫu trong đó đúng là bị lật.`, { hl: 1 }, { say: `Điều đáng chú ý: với hai mươi phần trăm nhãn lật, mô hình phản đối ${speakNum(String(noise[1].values[1]))} mẫu, và ${speakNum(String(noise[1].values[2]))} mẫu trong đó đúng là bị lật.` }),
              L('Nghĩa là chính mô hình có thể chỉ ra những nhãn đáng nghi để người xem lại. Đó là ý tưởng của confident learning.', { hl: -1 }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Học ở vùng A, dùng ở vùng B',
              cols: ['A → B', 'RMSE giữ lại của A', 'RMSE vùng B', 'AUC phân biệt'],
              cls: ['t', '', '', ''],
              rows: shift.map((r) => [r.label, fmt(r.values[0], 3), fmt(r.values[1], 3), fmt(r.values[2], 3)]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Lệch phân phối: học ở nội địa, kiểm tra trên phần giữ lại của nội địa, RMSE ${fmt(shift[0].values[0], 3)}. Trông rất ổn.`, { n: 1, hl: 0 }, { say: `Lệch phân phối: học ở nội địa, kiểm tra trên phần giữ lại của nội địa, sai số ${speakNum(fmt(shift[0].values[0], 3))}. Trông rất ổn.` }),
              L(`Đem dùng ở gần vịnh: RMSE vọt lên ${fmt(shift[0].values[1], 3)}, gấp hơn hai lần.`, undefined, { say: `Đem dùng ở gần vịnh: sai số vọt lên ${speakNum(fmt(shift[0].values[1], 3))}, gấp hơn hai lần.` }),
              L(`Cách phát hiện: huấn luyện một mô hình phân biệt dữ liệu vùng A với vùng B. AUC ${fmt(shift[0].values[2], 3)}, gần 1, nghĩa là hai vùng khác nhau rõ rệt.`, undefined, { say: `Cách phát hiện: huấn luyện một mô hình phân biệt dữ liệu vùng A với vùng B. Điểm A U C bằng ${speakNum(fmt(shift[0].values[2], 3))}, gần một, nghĩa là hai vùng khác nhau rõ rệt.` }),
              L(`Cặp thứ hai giống nhau hơn: AUC ${fmt(shift[1].values[2], 3)}, và sai số chỉ tăng nhẹ.`, { n: 2, hl: 1 }, { say: `Cặp thứ hai giống nhau hơn: điểm A U C chỉ ${speakNum(fmt(shift[1].values[2], 3))}, và sai số chỉ tăng nhẹ.` }),
              L('Con số đánh giá chỉ đáng tin khi tập test giống nơi mô hình sẽ được dùng.', { hl: -1 }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Xoá mọi ngoại lai theo quy tắc</b> → có thể xoá đúng trường hợp quan trọng nhất.',
              '<b>Bỏ qua giá trị bị chặn trần</b> → mô hình học một trần giả.',
              '<b>Tin vào tương quan</b> → tương quan không phải nhân quả.',
              '<b>Test cùng nơi với train</b> trong khi mô hình dùng ở nơi khác.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bốn bẫy thường gặp. Một: xoá mọi ngoại lai theo quy tắc. Ngoại lai có thể là lỗi, cũng có thể là trường hợp quan trọng nhất.', { n: 1, hl: 0 }),
              L('Hai: bỏ qua giá trị bị chặn trần.', { n: 2, hl: 1 }),
              L('Ba: tin vào tương quan như thể đó là nhân quả.', { n: 3, hl: 2 }),
              L('Bốn: đánh giá trên tập test lấy cùng nơi với tập huấn luyện, trong khi mô hình sẽ được dùng ở nơi khác.', { n: 4, hl: 3 }),
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
              'Lập <b>phiếu khám</b> trước khi huấn luyện: thiếu, chặn trần, lệch, nhóm quá nhỏ.',
              'Đặt <b>trung bình cạnh trung vị</b>.',
              'Với ngoại lai, <b>IQR bền hơn điểm z</b>; hỏi vì sao trước khi xoá.',
              '<b>Tương quan</b> không phải nhân quả.',
              '<b>Nhãn sai</b> và <b>lệch phân phối</b>: đo bằng mô hình.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Trước khi huấn luyện, lập phiếu khám cho từng cột. Không lỗi nào trong số đó làm chương trình báo lỗi.', { n: 1, hl: 0 }),
              L('Luôn đặt trung bình cạnh trung vị: lệch nhau xa nghĩa là có đuôi dài.', { n: 2, hl: 1 }),
              L('Với ngoại lai, quy tắc IQR bền hơn điểm z. Quy tắc chỉ gợi ý nhìn vào đâu.', { n: 3, hl: 2 }, { say: 'Với ngoại lai, quy tắc I Q R bền hơn điểm z. Quy tắc chỉ gợi ý nhìn vào đâu.' }),
              L('Tương quan không phải nhân quả. Nhãn sai và lệch phân phối không lộ ra trong phiếu khám: hãy đo chúng bằng mô hình.', { n: 5, hl: 4 }, { anim: 2 }),
              L('Chương 3B sẽ sửa những gì ta vừa tìm thấy: điền ô thiếu, mã hoá, chuẩn hoá, tránh rò rỉ, và chia dữ liệu cho đúng.', { hl: -1 }, { say: 'Chương ba B sẽ sửa những gì ta vừa tìm thấy: điền ô thiếu, mã hoá, chuẩn hoá, tránh rò rỉ, và chia dữ liệu cho đúng.' }),
              L('Giờ hãy cuộn xuống, tự khám bộ dữ liệu trong các phòng thí nghiệm. Hẹn gặp lại ở chương 3B.', undefined, { say: 'Giờ hãy cuộn xuống, tự khám bộ dữ liệu trong các phòng thí nghiệm. Hẹn gặp lại ở chương ba B.' }),
            ],
          },
        ],
      },
    ],
  };
}
