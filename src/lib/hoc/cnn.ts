/**
 * Phần trải nghiệm của chương 10 (CNN). Số liệu lấy từ ml-core (decodeImage, convCellCalc, cnnForward)
 * trên fashion-cnn.json; số của ô mã NumPy chạy lại bằng NumPy và ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const cnnLearn: LessonLearn = {
  slug: 'cnn',
  minutes: 60,
  goals: [
    { text: 'Giải thích một bộ lọc 3×3 trượt qua ảnh tạo ra bản đồ đặc trưng thế nào.', see: 'truc-giac' },
    { text: 'Tính tay giá trị của một ô trong bản đồ đặc trưng: 9 phép nhân, 1 phép cộng, rồi ReLU.', see: 'tinh-tay' },
    { text: 'Giải thích chia sẻ trọng số và max-pool, và vì sao CNN cần ít tham số hơn mạng dense.', see: 'ly-thuyet' },
    { text: 'Đọc ma trận nhầm lẫn của một CNN và giải thích vì sao một số lớp khó hơn hẳn.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Hàm ReLU(z) cho kết quả gì khi z = −0,06?', options: ['0', '−0,06', '0,06'], answer: 0, why: 'ReLU(z) = max(0, z): mọi số âm thành 0. Chương 9.' },
    { q: 'Mạng dense 784 đầu vào → 32 nơ-ron có bao nhiêu trọng số (chưa tính bias)?', options: ['816', '25.088', '784'], answer: 1, why: '784 × 32 = 25.088: mỗi nơ-ron nối với mọi điểm ảnh.' },
  ],
  missions: [
    {
      id: 'tichchap',
      step: 'tinh-tay',
      title: 'Một bộ lọc trượt qua ảnh',
      predict: {
        q: 'Ảnh 1 (áo khoác), ô hàng 10, cột 10 nằm giữa thân áo — gần như đồng màu. Bộ lọc "cạnh dọc" cho giá trị (sau ReLU) thế nào?',
        options: ['Bằng 0 hoặc gần 0', 'Rất lớn', 'Một số âm'],
        answer: 0,
        why: 'Bằng 0. Bộ lọc lấy cột phải trừ cột trái: ở đây (0,13 + 0,12 + 0,11) − (0,11 + 0,18 + 0,13) = −0,06, rồi ReLU biến số âm thành 0. Vùng đồng màu thì không có cạnh nào để dò.',
      },
      tasks: [
        'Giữ ảnh 1 và ô (10; 10). Chọn bộ lọc <b>Cạnh dọc (tự đặt)</b>, ghi kết quả. Đọc 9 điểm ảnh của cửa sổ.',
        'Đổi sang <b>Làm mờ (tự đặt)</b>, rồi <b>Bộ lọc học được 1</b> và <b>2</b>, ghi kết quả của từng bộ lọc.',
        'Quay lại bộ lọc cạnh dọc, bấm vào chỗ sáng nhất trên bản đồ đặc trưng: cửa sổ ở đó trông thế nào?',
      ],
      record: {
        cols: ['Kết quả sau ReLU'],
        rows: [
          { label: 'Cạnh dọc (tự đặt)', values: [0] },
          { label: 'Làm mờ (tự đặt)', values: [0.133] },
          { label: 'Bộ lọc học được 1', values: [0] },
          { label: 'Bộ lọc học được 2', values: [0.24] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'Bộ lọc làm mờ ở ô này cho 0,133 — đúng bằng trung bình 9 điểm ảnh. Vì sao? Và các bộ lọc học được có giống bộ lọc tự đặt không?',
        answer: 'Bộ lọc làm mờ có 9 trọng số đều bằng 1/9, nên tổng có trọng số chính là trung bình của cửa sổ. Bộ lọc học được 1 có cột trái âm (khoảng −1,2; −1,1; −0,1) và cột phải dương (0,5; 1,7; 1,2) — gần giống một bộ dò cạnh dọc, nghiêng một chút — nên nó cũng cho 0 ở vùng đồng màu này, đúng như bộ lọc tự đặt. Bộ lọc học được 2 thì cho 0,24: hàng dưới của nó âm mạnh (khoảng −1,0; −1,3; −1,1) — một bộ dò cạnh ngang — nhưng có bias dương 0,42, nên ở vùng tối đồng màu nó vẫn "bật" nhẹ, và chỉ tắt khi phía dưới cửa sổ sáng lên. Mạng tự khám phá lại thứ con người từng thiết kế bằng tay, chỉ bằng cách giảm mất mát.',
      },
    },
    {
      id: 'camang',
      step: 'danh-gia',
      title: 'Cả mạng, từ điểm ảnh đến dự đoán',
      predict: {
        q: 'Trên 2.000 ảnh test, lớp nào bị nhận nhầm nhiều nhất?',
        options: ['Quần dài', 'Áo sơ mi', 'Túi xách'],
        answer: 1,
        why: 'Áo sơ mi chỉ đúng 74/190 ảnh (39%): 45 ảnh bị đoán là áo phông, 41 là áo khoác, 19 là áo len. Quần dài đúng 196/203 (96,6%).',
      },
      tasks: [
        'Chọn ảnh đầu tiên (áo khoác): ghi xác suất mạng gán cho "áo khoác" và "áo sơ mi".',
        'Đọc ma trận nhầm lẫn: ghi số ảnh áo sơ mi được đoán đúng, và số bị đoán thành áo phông.',
        'Duyệt các ảnh: tìm một ảnh bị đoán sai. Nếu chỉ nhìn ảnh 28×28 đó, bạn có tự phân biệt được không?',
      ],
      record: {
        cols: ['Giá trị'],
        rows: [
          { label: 'Ảnh 1: P(áo khoác) (%)', values: [53.5] },
          { label: 'Ảnh 1: P(áo sơ mi) (%)', values: [27.7] },
          { label: 'Áo sơ mi đoán đúng', values: [74] },
          { label: 'Áo sơ mi bị đoán là áo phông', values: [45] },
        ],
        tol: [0.06],
      },
      explain: {
        q: 'Vì sao áo sơ mi khó đến vậy, trong khi quần dài gần như không bao giờ sai?',
        answer: 'Ở 28×28 điểm ảnh xám, áo sơ mi khác áo phông và áo khoác chủ yếu ở chi tiết nhỏ — cổ áo, hàng cúc, hoạ tiết — và các chi tiết đó gần như mất hết khi thu nhỏ. Hình dáng tổng thể thì giống nhau. Quần dài có hình dáng độc nhất (hai ống). Mạng chỉ có một tầng 6 bộ lọc nên chỉ thấy cạnh và vùng sáng; mạng sâu hơn ghép cạnh thành chi tiết, thành bộ phận, và đạt trên 93%. Ngay cả người gán nhãn cũng có lúc lưỡng lự giữa các loại áo — giới hạn nằm cả ở dữ liệu.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Bộ lọc "âm bên trái, dương bên phải" cho giá trị lớn ở đâu?', options: ['Chỗ ảnh chuyển từ tối sang sáng theo chiều ngang', 'Chỗ ảnh đồng màu', 'Chỗ ảnh tối nhất'], answer: 0, why: 'Cột phải sáng hơn cột trái thì hiệu số dương và lớn: đó là một cạnh dọc.' },
    'tinh-tay': { q: 'Cửa sổ 3×3 có cả 9 điểm ảnh bằng 0,5. Bộ lọc làm mờ (mỗi trọng số 1/9) cho kết quả bao nhiêu?', options: ['0,5', '4,5', '0,056'], answer: 0, why: '9 × (0,5 × 1/9) = 0,5: trung bình của một vùng đồng màu chính là màu đó.' },
    'ly-thuyet': { q: 'Max-pool 2×2 trên bản đồ đặc trưng 26×26 cho kích thước bao nhiêu?', options: ['13 × 13', '24 × 24', '26 × 26'], answer: 0, why: 'Mỗi ô 2×2 thành một số: 26/2 = 13 theo mỗi chiều, nhỏ đi 4 lần.' },
    'ma-nguon': { q: 'Trong tich_chap.py, (cua_so * loc).sum() làm gì?', options: ['Nhân từng cặp số tương ứng rồi cộng 9 tích lại', 'Nhân hai ma trận theo kiểu đại số tuyến tính', 'Lấy giá trị lớn nhất'], answer: 0, why: 'Phép * trong NumPy nhân từng phần tử. Đó đúng là định nghĩa tích chập ở bước 5.' },
  },
  codeTasks: [
    {
      title: 'Bộ dò cạnh ngang trên vạch dọc',
      task: 'Đổi <code>loc</code> thành bộ dò cạnh ngang <code>[[-1, -1, -1], [0, 0, 0], [1, 1, 1]]</code> rồi chạy. Đoán trước bản đồ đặc trưng.',
      answer: 'Toàn số 0. Ảnh chỉ có vạch dọc; theo chiều dọc, mỗi cột đồng màu nên hàng dưới trừ hàng trên luôn bằng 0. Mỗi bộ lọc chỉ "thấy" đúng loại hoạ tiết nó được thiết kế (hoặc học) để thấy.',
    },
    {
      title: 'Đổi ảnh thành vạch ngang',
      task: 'Đổi <code>anh[:, 3] = 1.0</code> thành <code>anh[3, :] = 1.0</code>. Chạy với bộ lọc cạnh dọc, rồi với bộ lọc cạnh ngang.',
      answer: 'Cạnh dọc: toàn 0. Cạnh ngang: hàng thứ 2 của đầu ra toàn số 3 (mép trên của vạch: trên tối, dưới sáng) và hàng thứ 4 toàn −3 (mép dưới: trên sáng, dưới tối); sau ReLU chỉ còn hàng toàn số 3. Một CNN thật có nhiều bộ lọc chính là để dò được nhiều hướng cùng lúc.',
    },
    {
      title: 'Đệm viền (padding)',
      task: 'Thêm <code>anh = np.pad(anh, 1)</code> ngay sau khi tạo ảnh, đổi <code>ra = np.zeros((6, 6))</code> và hai vòng lặp thành <code>range(6)</code>. Kích thước đầu ra giờ là bao nhiêu? Hàng đầu và hàng cuối có gì khác?',
      answer: 'Đầu ra 6×6, bằng kích thước ảnh gốc. Hàng đầu và cuối cho 2 và −2 thay vì 3 và −3, vì cửa sổ ở mép có một hàng là số 0 đệm thêm. Đệm viền giữ nguyên kích thước qua nhiều tầng tích chập, đổi lại các giá trị ở mép bị "pha loãng".',
      code: `anh = np.pad(anh, 1)        # 8×8: thêm viền số 0
ra = np.zeros((6, 6))
for r in range(6):
    for c in range(6):
        ra[r, c] = (anh[r:r + 3, c:c + 3] * loc).sum()`,
    },
  ],
  quiz: [
    { q: 'Áp một bộ lọc 3×3 (không đệm viền) lên ảnh 28×28. Bản đồ đặc trưng có kích thước bao nhiêu?', options: ['28 × 28', '26 × 26', '25 × 25'], answer: 1, why: 'Cửa sổ 3×3 có 28 − 3 + 1 = 26 vị trí theo mỗi chiều.' },
    { q: 'Vì sao CNN cần ít tham số hơn nhiều so với mạng dense cho ảnh?', options: ['Vì nó bỏ bớt điểm ảnh', 'Vì cùng một bộ lọc nhỏ được dùng chung ở mọi vị trí', 'Vì nó không có bias'], answer: 1, why: 'Chia sẻ trọng số: 9 trọng số của một bộ lọc dùng cho cả 676 vị trí, thay vì mỗi vị trí một bộ trọng số riêng.' },
    { q: 'Bộ lọc [[−1, 0, 1], [−1, 0, 1], [−1, 0, 1]] cho giá trị lớn ở đâu?', options: ['Chỗ ảnh đồng màu', 'Chỗ ảnh chuyển từ tối sang sáng theo chiều ngang (cạnh dọc)', 'Chỗ ảnh chuyển từ tối sang sáng theo chiều dọc (cạnh ngang)'], answer: 1, why: 'Cột phải trừ cột trái: lớn khi bên phải sáng hơn bên trái.' },
    { q: 'Vận dụng: ảnh màu có 3 kênh (đỏ, xanh lá, xanh dương). Một bộ lọc 3×3 cho ảnh màu có bao nhiêu trọng số, chưa tính bias?', options: ['9', '27', '2.352'], answer: 1, why: 'Bộ lọc phủ 3×3 ô trên cả 3 kênh: 3 × 3 × 3 = 27 trọng số, cộng lại thành một con số ở mỗi vị trí.' },
    { q: 'Vận dụng: mô hình nhận dạng sản phẩm học trên ảnh nền trắng chụp trong studio, nhưng đoán kém với ảnh khách hàng chụp ở nhà. Vì sao, và nên làm gì?', options: ['Lệch phân phối: thêm ảnh thật vào huấn luyện, và tăng cường dữ liệu (đổi nền, xoay, đổi độ sáng)', 'Mạng quá nhỏ, chỉ cần thêm tầng', 'Ảnh khách hàng có độ phân giải quá cao'], answer: 0, why: 'Mạng học thống kê điểm ảnh của dữ liệu huấn luyện, kể cả nền trắng. Dữ liệu dùng thật khác thì phải đưa dữ liệu giống thế vào huấn luyện (chương 3A).' },
  ],
  takeaways: {
    points: [
      'Tích chập: một bộ lọc nhỏ (3×3) <b>trượt</b> qua ảnh, ở mỗi vị trí nhân 9 cặp số và cộng lại, tạo thành <b>bản đồ đặc trưng</b>.',
      '<b>Chia sẻ trọng số</b>: cùng một bộ lọc dùng cho mọi vị trí — 6 bộ lọc chỉ tốn 60 tham số, thay vì 25.088 của một tầng dense.',
      '<b>Max-pool</b> thu nhỏ bản đồ 4 lần và làm mạng ít nhạy với việc hoạ tiết dịch đi một chút.',
      'Mạng tự học ra các bộ lọc giống bộ dò cạnh mà con người từng thiết kế bằng tay.',
      'Một CNN nhỏ đạt 84,6% trên Fashion-MNIST; chỗ khó là các loại áo, khác nhau ở chi tiết mà ảnh 28×28 không giữ được.',
    ],
    use: [
      'Ảnh, và mọi dữ liệu có cấu trúc lưới: phổ âm thanh, ảnh y tế, ảnh vệ tinh',
      'Khi hoạ tiết quan trọng có thể xuất hiện ở bất kỳ vị trí nào',
      'Khi có nhiều ảnh có nhãn, hoặc có mô hình đã huấn luyện sẵn để tinh chỉnh',
    ],
    avoid: [
      'Dữ liệu dạng bảng, nơi thứ tự các cột không mang ý nghĩa không gian',
      'Rất ít ảnh mà không có mô hình huấn luyện sẵn: dễ học thuộc',
      'Ảnh khi dùng thật khác hẳn ảnh huấn luyện (nền, ánh sáng, góc chụp) mà chưa tăng cường dữ liệu',
    ],
    next: { text: 'CNN khai thác cấu trúc lưới của ảnh. Chương 11 khai thác cấu trúc chuỗi của văn bản: mỗi từ "nhìn" mọi từ khác và quyết định nên chú ý tới từ nào — cơ chế attention.', slug: 'attention', title: 'Chương 11: Chuỗi và Attention' },
  },
  challenges: [
    {
      level: 1,
      title: 'Tích chập và max-pool bằng tay',
      task: 'Ảnh 4×4 có cột cuối sáng: mỗi hàng là (0; 0; 0; 1). Áp bộ lọc cạnh dọc [[−1, 0, 1], [−1, 0, 1], [−1, 0, 1]] (không đệm viền), rồi ReLU, rồi max-pool 2×2.',
      answer: 'Đầu ra tích chập 2×2. Cột 0 của đầu ra dùng cột ảnh 0–2: phải trừ trái = 0 − 0, cộng 3 hàng = 0. Cột 1 dùng cột ảnh 1–3: (1 − 0) × 3 hàng = 3. Bản đồ [[0; 3], [0; 3]], ReLU không đổi, max-pool 2×2 ra một số: 3. Bản đồ cho biết cạnh nằm ở nửa phải; max-pool giữ lại "có cạnh" mà bỏ bớt "chính xác ở đâu".',
    },
    {
      level: 2,
      title: 'Đếm tham số',
      task: 'Viết vài dòng Python tính số tham số của: (a) mạng ở bước 7 (6 bộ lọc 3×3, max-pool về 13×13, tầng dense ra 10 lớp); (b) mạng dense 784 → 32 → 10 như chương 9 dùng cho ảnh 28×28. Mạng nào nhiều tham số hơn?',
      hint: 'Mỗi bộ lọc: 9 trọng số + 1 bias. Sau max-pool: 6 × 13 × 13 = 1.014 số đi vào tầng dense.',
      answer: '(a) 6 × 9 + 6 = 60 cho tầng tích chập; 1.014 × 10 + 10 = 10.150 cho tầng dense; tổng 10.210. (b) 784 × 32 + 32 = 25.120 và 32 × 10 + 10 = 330; tổng 25.450. CNN ít tham số hơn một nửa, mà phần lớn tham số của nó nằm ở tầng dense cuối — tầng tích chập chỉ có 60.',
      code: `cnn = (6 * 9 + 6) + (6 * 13 * 13 * 10 + 10)
dense = (784 * 32 + 32) + (32 * 10 + 10)
print(cnn, dense)`,
    },
    {
      level: 3,
      title: 'CNN có nhận ra áo ở góc ảnh không?',
      task: 'Mọi ảnh Fashion-MNIST đều căn giữa. Nếu đưa vào một chiếc áo thu nhỏ nằm ở góc trái trên, mạng ở bước 7 có nhận ra không? Phần nào của mạng "không quan tâm" vị trí, phần nào thì có?',
      hint: 'Bộ lọc dùng chung ở mọi vị trí. Còn tầng dense cuối cùng thì sao?',
      answer: 'Tầng tích chập không quan tâm vị trí: một cạnh ở góc vẫn được bộ lọc dò ra, chỉ là xuất hiện ở góc của bản đồ đặc trưng. Max-pool chịu được dịch chuyển nhỏ (1 điểm ảnh). Nhưng tầng dense cuối có trọng số riêng cho từng vị trí trên bản đồ 13×13, và nó chỉ từng thấy áo ở giữa — nên rất có thể đoán sai. CNN thật giải quyết bằng nhiều tầng tích chập và pool (để tầng cuối nhìn đặc trưng tổng hợp toàn ảnh), cùng với tăng cường dữ liệu: dịch, xoay, phóng to ảnh huấn luyện.',
    },
  ],
  reflect: [
    'Bạn có bất ngờ khi bộ lọc học được lại giống bộ dò cạnh do con người thiết kế không? Điều đó gợi ý gì về cách mạng "nhìn"?',
    'Giải thích phép tích chập cho một người bạn bằng hình ảnh con tem trượt trên tờ giấy.',
    'Nếu xây ứng dụng nhận dạng một loại ảnh bạn quan tâm (lá cây bệnh, chữ viết tay tiếng Việt…), dữ liệu khi dùng thật sẽ khác dữ liệu huấn luyện ở đâu?',
  ],
};
