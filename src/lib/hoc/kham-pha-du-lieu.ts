/**
 * Phần trải nghiệm của chương 3A (Khám phá và đánh giá dữ liệu). Số liệu lấy từ ml-core trên
 * california.json và cancer30.json, tính lại đúng như các lab; số dùng pandas ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const khamPhaLearn: LessonLearn = {
  slug: 'kham-pha-du-lieu',
  minutes: 75,
  goals: [
    { text: 'Lập "phiếu khám" cho một bộ dữ liệu: thiếu, trùng, chặn trần, lệch, nhóm quá nhỏ.', see: 'kham-pha' },
    { text: 'Tính tứ phân vị, giới hạn IQR và điểm z; giải thích vì sao điểm z có thể "bao che" ngoại lai.', see: 'tinh-tay' },
    { text: 'Đọc ma trận tương quan một cách thận trọng: tuyến tính, nhạy ngoại lai, không phải nhân quả.', see: 'kham-pha' },
    { text: 'Phân biệt ba kiểu dữ liệu thiếu (MCAR, MAR, MNAR) và các tiêu chí của một bộ dữ liệu tốt.', see: 'ly-thuyet' },
    { text: 'Dùng mô hình để phát hiện nhãn sai và lệch phân phối.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Vì sao một điểm sai lệch xa ảnh hưởng mạnh tới hồi quy tuyến tính?', options: ['Vì sai số được bình phương trước khi cộng', 'Vì hồi quy bỏ qua các điểm gần', 'Vì điểm đó có nhãn khác'], answer: 0, why: 'Chương 0 và 1: sai số 3 đóng góp 9, gấp 9 lần sai số 1.' },
    { q: 'Mô hình "luôn đoán lớp đông" có thể có độ chính xác cao. Điều đó xảy ra khi nào?', options: ['Khi các lớp rất lệch nhau về số lượng', 'Khi dữ liệu đã chuẩn hoá', 'Khi có nhiều đặc trưng'], answer: 0, why: 'Chương 2: nếu 87% thư không phải rác, "luôn nói không phải rác" đã đúng 87%.' },
  ],
  missions: [
    {
      id: 'phieu',
      step: 'kham-pha',
      title: 'Khám sức khoẻ cho 20.640 khu vực',
      predict: {
        q: 'Cột "Thu nhập trung vị": trung bình sẽ lớn hơn, nhỏ hơn hay bằng trung vị?',
        options: ['Lớn hơn', 'Nhỏ hơn', 'Bằng nhau'],
        answer: 0,
        why: 'Trung bình 3,871 > trung vị 3,535: phân phối lệch phải. Một số khu vực rất giàu kéo trung bình lên, và có 49 khu vực bị ghi đúng 15,0001 — dấu hiệu chặn trần.',
      },
      tasks: [
        'Chọn cột <b>Thu nhập trung vị</b>: ghi trung bình, trung vị và số dòng ở giá trị lớn nhất.',
        'Chọn cột <b>Giá nhà trung vị</b>: ghi ba con số tương tự. Đọc cờ cảnh báo màu đỏ.',
        'Chọn <b>Tổng số phòng ngủ</b> (thiếu bao nhiêu ô?) và <b>Vị trí so với biển</b> (loại nào quá ít?).',
      ],
      record: {
        cols: ['Trung bình', 'Trung vị', 'Số dòng ở giá trị lớn nhất'],
        rows: [
          { label: 'Thu nhập', values: [3.8707, 3.5348, 49] },
          { label: 'Giá nhà', values: [2.0686, 1.797, 965] },
        ],
        tol: [0.0006, 0.0006, 0.5],
      },
      explain: {
        q: 'Không có cột nào làm chương trình báo lỗi, mô hình vẫn chạy được. Vậy vì sao phải khám dữ liệu?',
        answer: 'Vì mô hình học mọi thứ có trong dữ liệu, kể cả lỗi. 965 khu vực giá 5,00001 dạy mô hình rằng giá nhà không bao giờ vượt 500.001 USD. 207 ô phòng ngủ trống sẽ làm nhiều thư viện báo lỗi hoặc lặng lẽ bỏ dòng. 5 khu vực "trên đảo" quá ít để học được gì. Những lỗi này không gây sập chương trình — chúng chỉ làm con số cuối cùng sai theo cách khó thấy.',
      },
    },
    {
      id: 'tuongquan',
      step: 'kham-pha',
      title: 'Tương quan thật và tương quan giả',
      predict: {
        q: '"Số phòng" và "dân số" tương quan r = 0,86 — rất mạnh. Chia cả hai cho số hộ (thành phòng/hộ và người/hộ), tương quan còn bao nhiêu?',
        options: ['Vẫn khoảng 0,86', 'Gần 0', 'Âm mạnh'],
        answer: 1,
        why: 'Còn −0,005, tức gần như bằng 0. Khu vực đông hộ thì vừa nhiều phòng vừa nhiều người: cả hai chỉ cùng phụ thuộc vào cỡ khu vực. Khi bỏ yếu tố cỡ, quan hệ biến mất.',
      },
      tasks: [
        'Bấm ô <b>thu nhập × giá nhà</b>, ghi r.',
        'Bấm ô <b>số phòng × dân số</b>, ghi r. Bật "Chia … cho số hộ" rồi bấm ô <b>phòng/hộ × người/hộ</b>, ghi r.',
        'Tìm cặp tương quan âm mạnh nhất trong ma trận. Nó nói gì về địa lý California?',
      ],
      record: {
        cols: ['r'],
        rows: [
          { label: 'Thu nhập × giá nhà', values: [0.688] },
          { label: 'Số phòng × dân số', values: [0.857] },
          { label: 'Phòng/hộ × người/hộ', values: [-0.005] },
        ],
        tol: [0.006],
      },
      explain: {
        q: 'Vĩ độ và kinh độ tương quan r = −0,92. Có phải "đi lên phía bắc làm kinh độ giảm"?',
        answer: 'Không có quan hệ nhân quả nào ở đây. Bờ biển California chạy chéo từ tây bắc xuống đông nam, và dân cư tập trung dọc bờ biển, nên khu vực càng ở phía bắc thì càng ở phía tây. Tương quan phản ánh hình dạng của bang và nơi người ta sống. Đó là lý do mọi tương quan cần một câu hỏi "vì sao?".',
      },
    },
    {
      id: 'ngoailai',
      step: 'truc-giac',
      title: 'Ngoại lai: lỗi hay sự thật hiếm?',
      predict: {
        q: 'Cột "Người mỗi hộ", quy tắc IQR với k = 1,5 đánh dấu khoảng bao nhiêu khu vực là ngoại lai?',
        options: ['Khoảng 10', 'Khoảng 700', 'Khoảng 5.000'],
        answer: 1,
        why: '711 khu vực (3,4%). Quy tắc điểm z với |z| > 3 chỉ đánh dấu 8: vài khu vực cực lớn (tới 1.243 người/hộ) làm độ lệch chuẩn phình to, nên ngưỡng z bị đẩy rất xa.',
      },
      tasks: [
        'Với <b>Người mỗi hộ</b> và quy tắc IQR k = 1,5, ghi số khu vực bị đánh dấu.',
        'Đổi sang <b>điểm z, |z| &gt; 3</b> và ghi lại. Xem bảng 5 khu vực cực đoan nhất.',
        'Ở phần dưới, kéo chấm đỏ tới thu nhập 11, giá 0. Hệ số góc w thay đổi thế nào so với 24 khu vực thật?',
      ],
      record: {
        cols: ['Số khu vực bị đánh dấu'],
        rows: [
          { label: 'IQR, k = 1,5', values: [711] },
          { label: 'Điểm z, |z| > 3', values: [8] },
        ],
        tol: [0.5],
      },
      explain: {
        q: 'Có một khu vực 7.460 người nhưng chỉ 6 hộ (1.243 người mỗi hộ). Đó là lỗi hay là thật? Bạn sẽ làm gì trước khi xoá nó?',
        answer: 'Không hộ gia đình nào có 1.243 người, nhưng con số có thể là thật: dân số của một cơ sở tập thể (trại giam, ký túc xá, doanh trại) được đếm vào khu vực, còn "hộ" chỉ tính vài gia đình sống quanh đó. Trước khi xoá: xem các cột khác của dòng đó (19 phòng, nội địa), tra toạ độ, và hỏi người thu thập. Nếu đúng là cơ sở tập thể thì nó không đại diện cho "khu dân cư" — có thể loại, nhưng phải có lý do và ghi lại. Với điểm kéo được: đặt ở (11; 0), w giảm từ 0,490 xuống khoảng 0,259 — một điểm sai làm đường thẳng gần như nằm ngang.',
      },
    },
    {
      id: 'tay',
      step: 'tinh-tay',
      title: 'Tính tay trên 10 khu vực',
      predict: {
        q: 'Khu vực thu nhập 15,0001 nằm giữa 9 khu vực thu nhập 1,7–5,6. Điểm z của nó là bao nhiêu? Quy tắc |z| > 3 có bắt được nó không?',
        options: ['z ≈ 2,8: không bắt được', 'z ≈ 10: bắt được', 'z ≈ 0: không bắt được'],
        answer: 0,
        why: 'z = 2,83. Chính khu vực này kéo trung bình lên 4,32 (9 khu còn lại chỉ có trung bình 3,13) và làm độ lệch chuẩn phình to, nên tự nó trông "không quá lạ". Quy tắc IQR thì bắt được: giới hạn trên là 8,47.',
      },
      tasks: [
        'Bấm <b>Q1</b>, <b>Q2</b>, <b>Q3</b> để xem mỗi tứ phân vị được nội suy giữa hai số nào.',
        'Bấm <b>IQR</b> và <b>z</b>: ghi giới hạn trên và điểm z vào bảng, cùng trung bình và trung vị.',
        'Bấm <b>r</b>: tương quan thu nhập–giá nhà trên 10 khu vực này là bao nhiêu? Một khu vực có thể làm thay đổi nó nhiều không?',
      ],
      record: {
        cols: ['Giá trị'],
        rows: [
          { label: 'Trung bình', values: [4.32] },
          { label: 'Trung vị', values: [2.942] },
          { label: 'Giới hạn trên 1,5·IQR', values: [8.466] },
          { label: 'Điểm z của 15,0001', values: [2.833] },
        ],
        tol: [0.0015],
      },
      explain: {
        q: 'Vì sao trong mẫu nhỏ, điểm z dễ "bao che" cho ngoại lai, còn quy tắc IQR thì không?',
        answer: 'Điểm z dùng trung bình và độ lệch chuẩn — hai đại lượng mà chính ngoại lai kéo lệch và làm phình to. Với 10 điểm, một điểm cực đoan chiếm phần lớn độ lệch chuẩn, nên khoảng cách của nó tính theo "đơn vị độ lệch chuẩn" bị thu nhỏ. Tứ phân vị chỉ phụ thuộc vào thứ tự ở giữa dãy, nên ngoại lai gần như không làm chúng thay đổi.',
      },
    },
    {
      id: 'nhansai',
      step: 'danh-gia',
      title: 'Nhãn sai: mô hình học sai rồi tự tìm ra',
      predict: {
        q: 'Lật ngẫu nhiên 30% nhãn huấn luyện. Độ chính xác trên tập test sạch (lúc không lật là 98,2%) sẽ thế nào?',
        options: ['Sụp xuống khoảng 70%', 'Chỉ giảm vài điểm, còn khoảng 94%', 'Không đổi'],
        answer: 1,
        why: '93,9%: hồi quy logistic khá bền vì nhãn lật ngẫu nhiên chủ yếu "triệt tiêu" nhau. Đến 40% thì nhiễu gần bằng tín hiệu và độ chính xác sụp còn 76,3%.',
      },
      tasks: [
        'Kéo p về 0%, 20% và 40%. Ở mỗi mức, ghi độ chính xác test, số mẫu bị "phản đối" và số trong đó đúng là bị lật.',
        'Ở p = 20%: tỷ lệ "phản đối đúng" là bao nhiêu phần trăm?',
        'Bấm vài dòng trong bảng mẫu bị nghi: xác suất ngoài tập của chúng thế nào so với ngưỡng tự tin?',
      ],
      record: {
        cols: ['Độ chính xác test (%)', 'Bị phản đối', 'Đúng là bị lật'],
        rows: [
          { label: 'p = 0%', values: [98.2, 2, 0] },
          { label: 'p = 20%', values: [95.6, 90, 78] },
          { label: 'p = 40%', values: [76.3, 219, 137] },
        ],
        tol: [0.06, 0.5, 0.5],
      },
      explain: {
        q: 'Vì sao một mô hình học trên dữ liệu bẩn lại tìm được chính những nhãn bẩn?',
        answer: 'Khi nhãn sai còn là thiểu số, mô hình vẫn học được quy luật từ đa số nhãn đúng. Một mẫu bị lật vẫn nằm sâu trong vùng của lớp thật, nên xác suất ngoài tập (từ mô hình chưa thấy mẫu đó) dồn về lớp thật, vượt ngưỡng tự tin. Ở p = 20%, 78/90 = 87% số mẫu bị nghi đúng là bị lật: chỉ cần kiểm tra lại 90 mẫu thay vì cả 455. Ở p = 40%, nhiễu gần bằng tín hiệu nên quy luật bị hỏng, cách này kém đi rõ.',
      },
    },
    {
      id: 'lech',
      step: 'danh-gia',
      title: 'Học ở nơi này, dùng ở nơi khác',
      predict: {
        q: 'Học ở vùng Nội địa, dùng ở vùng Gần vịnh. RMSE trên vùng Gần vịnh so với trên phần giữ lại của chính vùng Nội địa thế nào?',
        options: ['Gần bằng', 'Gấp khoảng 2,5 lần', 'Nhỏ hơn'],
        answer: 1,
        why: 'Từ 0,524 lên 1,311 — gấp 2,5 lần. Mô hình phân biệt hai vùng đạt AUC 0,887: hai vùng khác nhau rất rõ, nên con số đánh giá trên vùng Nội địa không nói được gì về vùng Gần vịnh.',
      },
      tasks: [
        'Với mặc định (A = Nội địa, B = Gần vịnh), ghi hai RMSE và AUC.',
        'Đổi A = Cách biển &lt; 1 giờ và B = Gần biển, ghi lại.',
        'So hai đường phân phối thu nhập ở mỗi cặp. Cặp nào giống nhau hơn, và điều đó khớp với AUC không?',
      ],
      record: {
        cols: ['RMSE giữ lại của A', 'RMSE vùng B', 'AUC phân biệt'],
        rows: [
          { label: 'Nội địa → Gần vịnh', values: [0.524, 1.311, 0.887] },
          { label: 'Cách biển < 1 giờ → Gần biển', values: [0.688, 0.826, 0.646] },
        ],
        tol: [0.0006, 0.0006, 0.0006],
      },
      explain: {
        q: 'AUC của mô hình "đoán dòng thuộc A hay B" cho biết điều gì? Vì sao nó giúp dự báo RMSE sẽ tăng?',
        answer: 'AUC ≈ 0,5 nghĩa là không phân biệt được hai tập: chúng giống nhau, và đánh giá trên A dùng được cho B. AUC gần 1 nghĩa là hai tập khác nhau rõ rệt. Cặp Nội địa → Gần vịnh (AUC 0,887) có RMSE tăng 2,5 lần; cặp Cách biển → Gần biển (AUC 0,646) chỉ tăng khoảng 20%. Ưu điểm lớn: AUC tính được mà không cần nhãn của tập B — dùng được ngay trước khi triển khai.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Vì sao trước khi xoá một ngoại lai, nên hỏi "vì sao nó lạ"?', options: ['Vì nó có thể là trường hợp thật và quan trọng, không phải lỗi', 'Vì xoá dòng làm chậm mô hình', 'Vì quy tắc IQR luôn sai'], answer: 0, why: 'Ngoại lai có thể là lỗi nhập liệu, cũng có thể là một trại lính, một khu rất giàu — thông tin mà mô hình cần biết.' },
    'tinh-tay': { q: 'Mười số có Q1 = 2 và Q3 = 5. Giới hạn trên theo quy tắc 1,5·IQR là bao nhiêu?', options: ['6,5', '9,5', '7'], answer: 1, why: 'IQR = 5 − 2 = 3. Giới hạn trên = Q3 + 1,5 × 3 = 9,5.' },
    'ly-thuyet': { q: 'Người thu nhập rất cao thường không khai thu nhập. Đây là kiểu dữ liệu thiếu nào?', options: ['Thiếu hoàn toàn ngẫu nhiên (MCAR)', 'Thiếu ngẫu nhiên có điều kiện (MAR)', 'Thiếu không ngẫu nhiên (MNAR)'], answer: 2, why: 'Việc thiếu phụ thuộc vào chính giá trị bị thiếu. Không cách điền nào sửa được hoàn toàn; ít nhất nên thêm cột "có bị thiếu không".' },
    'ma-nguon': { q: 'Lệnh pandas nào cho biết số ô thiếu của từng cột?', options: ['df.isna().sum()', 'df.describe()', 'df.corr()'], answer: 0, why: 'isna() đánh dấu từng ô trống, sum() đếm theo cột. describe() bỏ qua ô trống nên không cho thấy chúng.' },
  },
  codeTasks: [
    {
      title: 'Ngoại lai của "phòng mỗi hộ"',
      task: 'Trong ô mã, đổi <code>nph = df["pop"] / df.hh</code> thành <code>nph = df["rooms"] / df.hh</code> rồi chạy lại. Có bao nhiêu ngoại lai, lớn nhất là bao nhiêu?',
      answer: '511 khu vực, lớn nhất 141,9 phòng mỗi hộ — có lẽ là khu nghỉ dưỡng hoặc khách sạn, nơi có nhiều phòng nhưng ít hộ thường trú. Lại một nhóm "không sai, nhưng không giống khu dân cư bình thường".',
    },
    {
      title: 'Nhìn tận mắt dòng lạ nhất',
      task: 'Thêm một dòng in toàn bộ thông tin của khu vực có nhiều người mỗi hộ nhất.',
      hint: 'Dùng <code>nph.idxmax()</code> để lấy chỉ số dòng, rồi <code>df.loc[...]</code>.',
      answer: '19 phòng, 5 phòng ngủ, 7.460 người, 6 hộ, thu nhập 10,23, giá 1,375, nội địa. Thu nhập trung vị cao vọt lại tính trên chỉ 6 hộ — thêm một dấu hiệu dòng này không phải khu dân cư bình thường.',
      code: `print(df.loc[nph.idxmax()])`,
    },
    {
      title: 'Ô thiếu có ngẫu nhiên không?',
      task: 'Tính tỷ lệ ô thiếu của cột phòng ngủ theo từng loại vị trí. Nếu tỷ lệ gần như nhau giữa các nhóm thì gợi ý điều gì?',
      answer: 'Khoảng 0,8–1,1% ở mọi nhóm (trừ "trên đảo" chỉ có 5 dòng). Tỷ lệ đều như vậy gợi ý ô thiếu gần với "hoàn toàn ngẫu nhiên" theo vị trí — chưa chứng minh được, nhưng là dấu hiệu tốt. Ngược lại, trên Titanic, tuổi thiếu tập trung ở hạng ba: đó là MAR.',
      code: `print(df.groupby("ocean").bedrooms.apply(lambda s: round(100 * s.isna().mean(), 2)))`,
    },
  ],
  quiz: [
    { q: 'Trung bình dân số mỗi khu vực là 1.425, trung vị là 1.166. Điều đó gợi ý gì?', options: ['Dữ liệu đối xứng', 'Có một đuôi dài về phía giá trị lớn', 'Có nhiều ô thiếu'], answer: 1, why: 'Vài khu vực rất đông dân kéo trung bình lên, còn trung vị gần như không đổi. Độ lệch (skew) của cột này gần 5.' },
    { q: 'Một mô hình phân biệt "dòng huấn luyện" với "dòng dùng thật" đạt AUC 0,98. Nên kết luận gì?', options: ['Mô hình chính rất tốt', 'Hai tập dữ liệu khác nhau rất nhiều, điểm đánh giá trên tập huấn luyện không đáng tin', 'Cần thêm đặc trưng'], answer: 1, why: 'Nếu hai tập giống nhau, không mô hình nào phân biệt được chúng (AUC ≈ 0,5).' },
    { q: 'Vì sao confident learning dùng xác suất ngoài tập (out-of-fold) chứ không dùng xác suất của mô hình học trên toàn bộ dữ liệu?', options: ['Để chạy nhanh hơn', 'Vì mô hình đã thấy một mẫu khi học thì có xu hướng đồng ý với nhãn của mẫu đó, kể cả khi nhãn sai', 'Vì scikit-learn bắt buộc'], answer: 1, why: 'Mô hình có thể "học thuộc" nhãn sai. Xác suất ngoài tập đến từ mô hình chưa thấy mẫu đó, nên trung thực hơn.' },
    { q: 'Vận dụng: khảo sát lương có cột lương thiếu 30%, và phần lớn ô thiếu thuộc nhóm quản lý cấp cao. Điền ô thiếu bằng trung bình cả cột thì sao?', options: ['Ổn, trung bình là con số an toàn', 'Lương của nhóm quản lý bị đánh giá thấp hẳn: thiếu không ngẫu nhiên nên điền trung bình làm lệch dữ liệu', 'Không ảnh hưởng gì tới mô hình'], answer: 1, why: 'Đây là MNAR (hoặc ít nhất MAR theo chức vụ). Điền theo nhóm chức vụ và thêm cột "lương bị thiếu" tốt hơn nhiều.' },
    { q: 'Vận dụng: mô hình chấm điểm tín dụng học trên khách hàng thành phố, sắp được dùng ở nông thôn. Việc đầu tiên nên làm?', options: ['Triển khai luôn vì độ chính xác test đạt 92%', 'So phân phối hai nhóm (ví dụ AUC phân biệt) và đánh giá trên một mẫu khách hàng nông thôn có nhãn', 'Tăng số vòng huấn luyện'], answer: 1, why: '92% đo trên khách hàng thành phố. Như lab Nội địa → Gần vịnh: sai số có thể tăng gấp đôi khi đổi nơi dùng.' },
  ],
  takeaways: {
    points: [
      'Trước khi huấn luyện, lập <b>phiếu khám</b> cho từng cột: thiếu, trùng, chặn trần, lệch, nhóm quá nhỏ. Không lỗi nào trong số đó làm chương trình báo lỗi.',
      'Luôn đặt <b>trung bình cạnh trung vị</b>: lệch nhau xa nghĩa là có đuôi dài cần xem kỹ.',
      'Với ngoại lai, <b>quy tắc IQR bền hơn điểm z</b> (z = 2,83 đã bỏ lọt thu nhập 15,0001). Quy tắc chỉ gợi ý nhìn vào đâu — hãy hỏi vì sao trước khi xoá.',
      '<b>Tương quan</b> chỉ đo quan hệ tuyến tính, nhạy với ngoại lai và không phải nhân quả: số phòng–dân số 0,86 biến mất (−0,005) khi chia theo số hộ.',
      '<b>Nhãn sai</b> và <b>lệch phân phối</b> không lộ ra trong phiếu khám. Đo chúng bằng mô hình: confident learning và AUC phân biệt hai tập.',
    ],
    use: [
      'Mọi dự án, trước dòng huấn luyện đầu tiên',
      'Khi nhận dữ liệu từ người khác hoặc từ một nguồn mới',
      'Khi mô hình đột nhiên kém đi sau khi triển khai: kiểm tra lệch phân phối',
    ],
    avoid: [
      'Định xoá ngoại lai hàng loạt theo quy tắc: hãy xem từng nhóm trước',
      'Định kết luận nhân quả từ ma trận tương quan',
      'Dữ liệu lệch phải hoặc mẫu nhỏ: đừng dựa vào điểm z, dùng IQR hoặc thang log',
    ],
    next: { text: 'Bài 3A dạy nhìn và đo. Bài 3B dạy sửa: điền ô thiếu, mã hoá, chuẩn hoá, tránh rò rỉ dữ liệu, chia train/test đúng cách — và trả lời câu hỏi: nhiều dữ liệu hơn hay dữ liệu tốt hơn?', slug: 'xu-ly-du-lieu', title: 'Chương 3B: Xử lý dữ liệu' },
  },
  challenges: [
    {
      level: 1,
      title: 'Tứ phân vị bằng tay',
      task: 'Dãy thu nhập đã sắp xếp của 10 khu vực ở bước 4: 1,7222; 1,9286; 1,9439; 2,3849; 2,5625; 3,3214; 3,8816; 4,8646; 5,5951; 15,0001. Tính Q1, Q3 theo cách nội suy (vị trí (n − 1)·q, đếm từ 0), rồi giới hạn ngoại lai 1,5·IQR. Khu vực 5,5951 có phải ngoại lai không?',
      hint: 'Q1 ở vị trí 9 × 0,25 = 2,25: nằm giữa phần tử thứ 2 và thứ 3 (đếm từ 0), lấy thêm 25% khoảng cách.',
      answer: 'Q1 = 1,9439 + 0,25 × (2,3849 − 1,9439) ≈ 2,0542. Q3 ở vị trí 6,75: 3,8816 + 0,75 × (4,8646 − 3,8816) ≈ 4,6189. IQR ≈ 2,5647. Giới hạn: [2,0542 − 3,8471; 4,6189 + 3,8471] ≈ [−1,793; 8,466]. 5,5951 nằm trong giới hạn nên không phải ngoại lai; chỉ 15,0001 vượt ra ngoài.',
    },
    {
      level: 2,
      title: 'Pearson hay Spearman?',
      task: 'Trong ô mã, tính thêm tương quan Spearman (<code>df.corr(method="spearman")</code>) cho cặp thu nhập–giá nhà và số phòng–dân số. So với Pearson.',
      answer: 'Thu nhập–giá nhà: Pearson 0,688, Spearman 0,677 — gần nhau, quan hệ gần tuyến tính. Số phòng–dân số: Pearson 0,857, Spearman 0,816. Spearman tính trên thứ hạng nên không bị vài khu vực khổng lồ kéo lệch. Khi hai con số chênh nhau nhiều, nghĩa là có ngoại lai hoặc quan hệ cong.',
      code: `print(df[["income", "value"]].corr(method="spearman").round(3))
print(df[["rooms", "pop"]].corr(method="spearman").round(3))`,
    },
    {
      level: 3,
      title: 'Viết phiếu dữ liệu cho California Housing',
      task: 'Viết một "phiếu dữ liệu" (datasheet) ngắn, khoảng 10 dòng, cho bộ California Housing: ai thu thập, khi nào, mỗi dòng là gì, các giới hạn đã biết, và bộ dữ liệu <i>không nên</i> dùng cho việc gì.',
      hint: 'Dựa vào những gì bạn đã phát hiện trong bài: chặn trần, ô thiếu, dòng trùng toạ độ, cơ sở tập thể, thời điểm 1990.',
      answer: 'Một phiếu tốt nên có: (1) Nguồn: điều tra dân số Mỹ năm 1990, do Pace và Barry tổng hợp (1997). (2) Mỗi dòng là một <i>khu vực điều tra</i> (vài trăm đến vài nghìn người), không phải một căn nhà. (3) Giá và thu nhập là trung vị của khu vực; giá bị chặn ở 500.001 USD (965 dòng), thu nhập ở 15,0001 (49 dòng), tuổi nhà ở 52. (4) Cột phòng ngủ thiếu 207 ô, phân bố đều theo vị trí. (5) 8.050 dòng trùng toạ độ với dòng khác — phải chia train/test theo nhóm. (6) Có khu vực là cơ sở tập thể (tới 1.243 người/hộ). (7) Không nên dùng để định giá nhà ngày nay (giá đã thay đổi hoàn toàn sau hơn 30 năm), cũng không nên dùng cho từng căn nhà riêng lẻ. Không có đáp án duy nhất — điều quan trọng là người đọc phiếu biết dữ liệu dùng được vào việc gì và không dùng được vào việc gì.',
    },
  ],
  reflect: [
    'Phát hiện nào trong bài làm bạn bất ngờ nhất? Nếu không khám dữ liệu, nó sẽ gây hại gì cho mô hình?',
    'Giải thích cho một người bạn vì sao "tương quan không phải nhân quả", dùng ví dụ số phòng và dân số.',
    'Với một bộ dữ liệu bạn từng gặp (điểm thi, khảo sát, bán hàng…), bạn đoán nó có những vấn đề nào trong bài này?',
  ],
};
