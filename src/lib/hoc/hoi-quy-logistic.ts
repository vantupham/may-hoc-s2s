/**
 * Phần trải nghiệm của chương 2 (Hồi quy logistic). Số liệu lấy từ ml-core (sigmoid, bce,
 * logisticRegressionGD, confusion) trên cancer.json; các số scikit-learn ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const logregLearn: LessonLearn = {
  slug: 'hoi-quy-logistic',
  minutes: 60,
  goals: [
    { text: 'Giải thích vì sao cần hàm sigmoid, và đọc được xác suất p từ điểm số z.', see: 'truc-giac' },
    { text: 'Tính được mất mát cross-entropy và gradient (p − y)·x của một bệnh nhân.', see: 'tinh-tay' },
    { text: 'Giải thích vì sao trọng số tăng mãi khi dữ liệu tách được hoàn toàn.', see: 'ly-thuyet' },
    { text: 'Đọc ma trận nhầm lẫn và chọn ngưỡng theo cái giá của từng loại sai lầm.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Gradient của MSE theo w trong hồi quy tuyến tính là (2/n)·Σ eᵢxᵢ. eᵢ là gì?', options: ['Dự đoán trừ giá trị thật', 'Giá trị thật', 'Bình phương sai số'], answer: 0, why: 'eᵢ = ŷᵢ − yᵢ. Ở chương này bạn sẽ gặp lại đúng dạng "(dự đoán − thật) × đầu vào".' },
    { q: 'Vì sao phải chuẩn hoá đặc trưng trước khi chạy Gradient Descent?', options: ['Để mặt mất mát tròn hơn, hội tụ nhanh hơn', 'Để mô hình chính xác hơn trên tập test', 'Để có ít dữ liệu hơn'], answer: 0, why: 'Chương 1: chuẩn hoá đưa số bước từ 214 xuống còn 1.' },
  ],
  missions: [
    {
      id: 'sigmoid',
      step: 'truc-giac',
      title: 'Biến điểm số thành xác suất',
      predict: {
        q: 'Điểm số z = 2. Xác suất p = σ(2) khoảng bao nhiêu?',
        options: ['Khoảng 20%', 'Khoảng 50%', 'Khoảng 88%'],
        answer: 2,
        why: 'σ(2) = 1/(1 + e⁻²) ≈ 0,881. Chỉ cần z = 2 là mô hình đã khá chắc chắn; z = 5 thì đã 99,3%.',
      },
      tasks: [
        'Kéo z về 0: p bằng bao nhiêu?',
        'Kéo z tới 2, −2 và 5, ghi p vào bảng.',
        'Kéo z ra hai đầu (−8 và 8): p có bao giờ chạm đúng 0 hay 1 không?',
      ],
      record: {
        cols: ['p (%)'],
        rows: [
          { label: 'z = 2', values: [88.1] },
          { label: 'z = −2', values: [11.9] },
          { label: 'z = 5', values: [99.3] },
        ],
        tol: [0.06],
      },
      explain: {
        q: 'Cộng p ở z = 2 với p ở z = −2 ra bao nhiêu? Vì sao kết quả đó hợp lý?',
        answer: '88,1% + 11,9% = 100%. Tổng quát σ(−z) = 1 − σ(z): đảo dấu điểm số là đổi vai "ác tính" và "lành tính". Và p không bao giờ chạm đúng 0 hay 1, nên mô hình không bao giờ chắc chắn tuyệt đối — đó cũng là lý do mất mát −ln p luôn hữu hạn.',
      },
    },
    {
      id: 'ranhgioi',
      step: 'truc-giac',
      title: 'Tự vẽ ranh giới cho 569 bệnh nhân',
      predict: {
        q: 'Ban đầu w₁ = 1, w₂ = 0, b = 0: chỉ dùng bán kính. Độ chính xác khoảng bao nhiêu?',
        options: ['Khoảng 50%', 'Khoảng 86%', 'Gần 100%'],
        answer: 1,
        why: '86,3%: chỉ riêng bán kính đã tách khá tốt. Thêm độ nhám và chỉnh b, lời giải gợi ý đạt 89,1%.',
      },
      tasks: [
        'Ghi độ chính xác và mất mát ở vị trí ban đầu.',
        'Tự chỉnh 3 thanh trượt để độ chính xác vượt 88%. Các chấm viền đen (bị phân loại sai) nằm ở đâu?',
        'Bấm <b>Gợi ý một lời giải tốt</b> và ghi hai con số.',
      ],
      record: {
        cols: ['Độ chính xác (%)', 'Mất mát L'],
        rows: [
          { label: 'Ban đầu (1; 0; 0)', values: [86.3, 0.4512] },
          { label: 'Lời giải gợi ý', values: [89.1, 0.256] },
        ],
        tol: [0.06, 0.0006],
      },
      explain: {
        q: 'Từ vị trí ban đầu tới lời giải gợi ý, độ chính xác chỉ tăng 3 điểm, nhưng mất mát giảm gần một nửa. Vì sao?',
        answer: 'Độ chính xác chỉ đếm đúng/sai. Mất mát còn đo độ tự tin: trọng số lớn hơn đẩy p của các ca rõ ràng về sát 0 hoặc 1, nên mất mát giảm mạnh dù nhãn dự đoán của nhiều ca không đổi. Vì độ chính xác nhảy bậc (không có đạo hàm) còn mất mát thì trơn, ta tối ưu mất mát.',
      },
    },
    {
      id: 'buoc',
      step: 'tinh-tay',
      title: 'Hồi quy logistic từng vòng',
      predict: {
        q: 'Sau vòng 1 (η = 1, xuất phát từ 0), w₁ và w₂ sẽ thế nào?',
        options: ['Cả hai dương', 'Cả hai âm', 'Vẫn bằng 0'],
        answer: 0,
        why: 'Gradient = (−0,369; −0,387). Ca ác tính có x lớn và p − y = −0,5 nên kéo trọng số lên. Sau vòng 1: w = (0,369; 0,387).',
      },
      tasks: [
        'Ở vòng 1, bấm vào <b>∂L/∂w₁</b> để thấy nó là trung bình của (p − y)·x₁.',
        'Với η = 1, bấm tới vòng 40. Ghi w₁, w₂ ở dòng trên cùng và mất mát L.',
        'Đổi η = 3, bấm lại tới vòng 40 và ghi. Trọng số lớn hơn hay nhỏ hơn?',
      ],
      record: {
        cols: ['w₁', 'w₂', 'Mất mát L'],
        rows: [
          { label: 'η = 1, vòng 40', values: [1.903, 3.05, 0.0351] },
          { label: 'η = 3, vòng 40', values: [2.383, 4.26, 0.0122] },
        ],
        tol: [0.0006, 0.0006, 0.00006],
      },
      explain: {
        q: 'Sáu bệnh nhân này tách được hoàn toàn. Vì sao trọng số cứ tăng và mất mát cứ giảm mà không bao giờ dừng?',
        answer: 'Khi mọi người đã nằm đúng phía, nhân tất cả trọng số lên làm mọi p sát 0 hoặc 1 hơn, nên mất mát nhỏ thêm. Không có điểm nào làm mất mát tăng trở lại, nên không có đáy: mất mát chỉ tiến về 0 (chạy 400 vòng thì w ≈ (2,7; 5,7), L ≈ 0,004). Trên dữ liệu thật có chồng lấn, trọng số quá lớn sẽ phạt nặng các ca nằm sai phía, nên có đáy hữu hạn. Thực tế người ta thêm điều chuẩn để giữ trọng số nhỏ.',
      },
    },
    {
      id: 'nguong',
      step: 'danh-gia',
      title: 'Cái giá của một ngưỡng',
      predict: {
        q: 'Hạ ngưỡng từ 0,5 xuống 0,2. Số ca ác tính bị bỏ sót (trong 39 ca ác tính của tập test) thay đổi thế nào?',
        options: ['Giảm, nhưng không về 0', 'Giảm về 0', 'Tăng lên'],
        answer: 0,
        why: 'Bỏ sót giảm từ 6 xuống 4, đổi lại báo nhầm tăng từ 4 lên 16. Hạ tiếp xuống 0,1 vẫn bỏ sót 4: đó là những ca ác tính trông rất giống lành tính theo hai đặc trưng này.',
      },
      tasks: [
        'Ở ngưỡng 0,5, ghi số bỏ sót, báo nhầm và độ nhạy (recall).',
        'Kéo ngưỡng về 0,2 và ghi lại.',
        'Kéo ngưỡng lên 0,8: độ chuẩn (precision) tăng tới bao nhiêu? Cái giá là gì?',
      ],
      record: {
        cols: ['Bỏ sót', 'Báo nhầm', 'Độ nhạy (%)'],
        rows: [
          { label: 'Ngưỡng 0,5', values: [6, 4, 84.6] },
          { label: 'Ngưỡng 0,2', values: [4, 16, 89.7] },
        ],
        tol: [0.5, 0.5, 0.06],
      },
      explain: {
        q: 'Nếu bạn là bác sĩ dùng mô hình này để sàng lọc, bạn chọn ngưỡng nào? Hãy lý luận bằng cái giá của mỗi loại sai.',
        answer: 'Bỏ sót một ca ác tính có thể làm chậm điều trị — rất đắt. Báo nhầm dẫn tới thêm một xét nghiệm và vài ngày lo lắng — đắt nhưng ít hơn nhiều. Vì vậy sàng lọc thường dùng ngưỡng thấp (khoảng 0,2): chấp nhận 16 báo nhầm để bỏ sót ít hơn. Ở ngưỡng 0,8 độ chuẩn lên 96,2% nhưng bỏ sót 14 ca — không chấp nhận được cho sàng lọc. Không có ngưỡng "đúng" về mặt toán học; ngưỡng là một quyết định y khoa.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Ranh giới quyết định là tập các điểm có…', options: ['p = 0,5, tức z = 0', 'p = 1', 'z = 1'], answer: 0, why: 'σ(0) = 0,5: nơi mô hình phân vân nhất. Vì z = w₁x₁ + w₂x₂ + b = 0 là phương trình đường thẳng, ranh giới là một đường thẳng.' },
    'tinh-tay': { q: 'Một bệnh nhân lành tính (y = 0) có p = 0,8 và x₁ = 1,5. Người này góp bao nhiêu vào tổng Σ(p − y)·x₁ của ∂L/∂w₁?', options: ['+1,2', '−1,2', '+0,3'], answer: 0, why: '(0,8 − 0) × 1,5 = 1,2. Dương nên người này kéo w₁ giảm xuống — đúng, vì mô hình đang nghiêng nhầm về ác tính.' },
    'ly-thuyet': { q: 'Bệnh nhân y = 1 và mô hình cho p = 0,5. Mất mát ℓ của người này bằng bao nhiêu?', options: ['0', 'ln 2 ≈ 0,693', '1'], answer: 1, why: 'ℓ = −ln 0,5 = ln 2 ≈ 0,693: mức "không biết gì".' },
    'ma-nguon': { q: 'Trong mã scikit-learn, vì sao có C=np.inf?', options: ['Để tắt điều chuẩn, cho giống bản tự viết', 'Để chạy nhanh hơn', 'Để dùng nhiều đặc trưng hơn'], answer: 0, why: 'Mặc định scikit-learn có điều chuẩn (C = 1), kéo trọng số về gần 0. C càng lớn, điều chuẩn càng yếu; C = ∞ là tắt hẳn.' },
  },
  codeTasks: [
    {
      title: 'Chạy lâu hơn trên 6 bệnh nhân',
      task: 'Trong <code>logistic_tu_viet.py</code>, đổi <code>range(40)</code> thành <code>range(400)</code> và <code>k == 39</code> thành <code>k == 399</code>. Đoán trước: w ở vòng cuối lớn hơn hay nhỏ hơn?',
      answer: 'Lớn hơn: w ≈ (2,71; 5,65) so với (1,91; 3,08) ở vòng 40, còn L giảm từ 0,035 xuống 0,004. Trọng số tăng mãi vì dữ liệu tách được hoàn toàn — đúng như phần giải thích ở bước 4.',
    },
    {
      title: 'Thêm ngưỡng 0,1 và 0,8',
      task: 'Trong <code>logistic_sklearn.py</code>, đổi <code>for nguong in (0.5, 0.2)</code> thành <code>(0.1, 0.2, 0.5, 0.8)</code>. Ngưỡng nào làm cả bỏ sót lẫn báo nhầm cùng nhỏ?',
      answer: 'Không có ngưỡng nào như vậy. Ngưỡng 0,1: bỏ sót 4, báo nhầm 25. Ngưỡng 0,8: bỏ sót 14, báo nhầm 1. Giảm loại sai này luôn làm tăng loại sai kia — muốn giảm cả hai phải có mô hình tốt hơn (thêm đặc trưng), không phải dịch ngưỡng.',
    },
    {
      title: 'Bật điều chuẩn',
      task: 'Đổi <code>C=np.inf</code> thành <code>C=1</code> rồi <code>C=0.01</code>. Trọng số thay đổi thế nào? Độ chính xác test thì sao?',
      answer: 'C = ∞: w ≈ (3,95; 1,00). C = 1: w ≈ (3,41; 0,92), độ chính xác test vẫn 91,2%. C = 0,01: w ≈ (0,77; 0,38), độ chính xác tụt còn 85,1% — điều chuẩn quá mạnh làm mô hình "rụt rè". Điều chuẩn vừa phải là cách chữa bệnh trọng số tăng mãi của bước 4.',
    },
  ],
  quiz: [
    { q: 'Một bệnh nhân có z = 0. Mô hình cho xác suất ác tính bao nhiêu?', options: ['0', '0,5', '1'], answer: 1, why: 'σ(0) = 1 / (1 + e⁰) = 1/2. Điểm này nằm đúng trên ranh giới quyết định.' },
    { q: 'Bệnh nhân ác tính (y = 1) nhưng mô hình cho p = 0,01. Mất mát của người này?', options: ['Khoảng 0,01', 'Khoảng 0,69', 'Khoảng 4,6'], answer: 2, why: '−ln(0,01) ≈ 4,6. Đoán sai một cách tự tin bị phạt nặng, còn p = 0,5 chỉ bị phạt 0,69.' },
    { q: 'Hạ ngưỡng từ 0,5 xuống 0,2 thường làm gì?', options: ['Giảm số ca bỏ sót, tăng số ca báo nhầm', 'Tăng số ca bỏ sót, giảm số ca báo nhầm', 'Không thay đổi gì vì mô hình giữ nguyên'], answer: 0, why: 'Ngưỡng thấp hơn nghĩa là chỉ cần nghi ngờ nhẹ cũng gọi là ác tính: bắt được nhiều ca thật hơn (độ nhạy tăng) nhưng cũng nhiều báo động nhầm hơn (độ chuẩn giảm).' },
    { q: 'Vận dụng: mô hình sàng lọc cho p = 0,35 với một bệnh nhân. Bệnh viện dùng ngưỡng 0,2. Kết luận thế nào?', options: ['Xếp vào nhóm nghi ác tính, cho làm xét nghiệm thêm', 'Lành tính vì p < 0,5', 'Không kết luận được'], answer: 0, why: '0,35 ≥ 0,2 nên theo quy ước của bệnh viện, người này cần kiểm tra thêm. Ngưỡng 0,5 không phải luật tự nhiên.' },
    { q: 'Vận dụng: chỉ 13% thư là thư rác. Mô hình A "luôn nói không phải rác" đạt độ chính xác 87%. Mô hình B đạt 95% và bắt được 80% thư rác. Nhận xét nào đúng?', options: ['A gần bằng B, nên dùng A cho đơn giản', 'A vô dụng: nó bắt được 0% thư rác. Với dữ liệu lệch lớp phải nhìn độ nhạy và độ chuẩn', 'B kém vì độ nhạy chưa tới 100%'], answer: 1, why: 'Khi một lớp chiếm đa số, độ chính xác cao có thể chỉ là "luôn đoán lớp đông". Độ nhạy của A bằng 0.' },
  ],
  takeaways: {
    points: [
      '<b>Phân loại</b> là dự đoán một nhãn. Hồi quy logistic tính điểm số z = w·x + b rồi ép thành xác suất <b>p = σ(z)</b>.',
      '<b>Ranh giới quyết định</b> (p = 0,5, tức z = 0) là một đường thẳng.',
      'Mất mát <b>cross-entropy</b> phạt rất nặng việc sai một cách tự tin. Gradient gọn bất ngờ: <b>(p − y)·x</b>.',
      'Không có nghiệm đóng, nhưng mất mát lồi nên Gradient Descent luôn tới đáy. Dữ liệu tách được hoàn toàn thì trọng số tăng mãi — cần <b>điều chuẩn</b>.',
      '<b>Ngưỡng</b> là quyết định về cái giá của sai lầm: hạ ngưỡng bắt thêm ca bệnh, đổi lại nhiều báo nhầm hơn.',
    ],
    use: [
      'Cần xác suất, không chỉ nhãn (sàng lọc, đánh giá rủi ro)',
      'Cần giải thích: mỗi trọng số cho biết đặc trưng đẩy về lớp nào, mạnh bao nhiêu',
      'Ranh giới gần thẳng; làm mốc so sánh đầu tiên cho mọi bài toán phân loại',
    ],
    avoid: [
      'Ranh giới cong phức tạp: dùng cây quyết định, SVM nhân RBF hoặc mạng nơ-ron',
      'Các đặc trưng tác động qua lại mạnh mà chưa tạo thêm đặc trưng kết hợp',
      'Dữ liệu tách được hoàn toàn mà không có điều chuẩn',
    ],
    next: { text: 'Đến đây bạn đã có hai mô hình. Trước khi học thêm mô hình, chương 3A hỏi một câu quan trọng hơn: dữ liệu có đáng tin không?', slug: 'kham-pha-du-lieu', title: 'Chương 3A: Khám phá và đánh giá dữ liệu' },
  },
  challenges: [
    {
      level: 1,
      title: 'Xác suất của một bệnh nhân mới',
      task: 'Mô hình ở bước 7 là p = σ(3,954·x₁ + 0,998·x₂ − 0,686). Một bệnh nhân mới có x = (0,5; −0,2) (đã chuẩn hoá). Tính z, p, và nhãn dự đoán ở ngưỡng 0,5 và 0,8. Nếu thật ra người này lành tính, mất mát bằng bao nhiêu?',
      hint: 'σ(z) = 1/(1 + e⁻ᶻ); e⁻¹·⁰⁹ ≈ 0,336. Với y = 0, ℓ = −ln(1 − p).',
      answer: 'z = 3,954 × 0,5 + 0,998 × (−0,2) − 0,686 ≈ 1,977 − 0,200 − 0,686 = 1,091. p = 1/(1 + 0,336) ≈ 0,749. Ngưỡng 0,5: ác tính. Ngưỡng 0,8: lành tính — cùng một bệnh nhân, hai kết luận. Nếu thật ra lành tính: ℓ = −ln(0,251) ≈ 1,38.',
    },
    {
      level: 2,
      title: 'Vẽ đường đánh đổi',
      task: 'Viết vòng lặp trong <code>logistic_sklearn.py</code> in độ nhạy và độ chuẩn với các ngưỡng 0,1; 0,2; …; 0,9. Hai đại lượng biến đổi ngược chiều nhau thế nào?',
      answer: 'Độ nhạy giảm dần từ 89,7% (ngưỡng 0,1–0,3) xuống 61,5% (ngưỡng 0,9); độ chuẩn tăng từ 58,3% lên 100%. Có những đoạn ngưỡng tăng mà độ nhạy đứng yên — vì 4 ca ác tính "khó" có p rất thấp. Chương 8 vẽ đầy đủ đánh đổi này bằng đường ROC.',
      code: `probs = model.predict_proba(X_te)[:, 1]
for t in np.arange(0.1, 1.0, 0.1):
    pred = (probs >= t).astype(int)
    print(f"{t:.1f}: recall {recall_score(y_te, pred):.3f}  precision {precision_score(y_te, pred, zero_division=0):.3f}")`,
    },
    {
      level: 3,
      title: 'Chọn ngưỡng theo chi phí — và cái bẫy',
      task: 'Giả sử bỏ sót một ca ác tính tốn chi phí gấp 10 lần báo nhầm. Tổng chi phí = 10 × bỏ sót + báo nhầm. Bạn chọn ngưỡng thế nào? Có được dùng tập test để chọn không?',
      hint: 'Thử tính chi phí trên tập test ở ngưỡng 0,5 và 0,2. Rồi nghĩ: nếu chọn ngưỡng nhìn vào tập test, con số trên tập test còn trung thực không?',
      answer: 'Trên tập test: ngưỡng 0,5 tốn 10 × 6 + 4 = 64; ngưỡng 0,2 tốn 10 × 4 + 16 = 56. Dò mọi ngưỡng trên tập test thì tốt nhất là 0,4 với chi phí 48 — nhưng đó là gian lận: ta đã dùng tập test để chọn, nên 48 là con số quá lạc quan. Cách đúng: chọn ngưỡng trên tập train (ra 0,12), rồi mới đo trên tập test: bỏ sót 4, báo nhầm 22, chi phí 62. Con số 62 mới là trung thực. Tốt hơn nữa là chọn bằng cross-validation (chương 8).',
    },
  ],
  reflect: [
    'Trước bài này, bạn có nghĩ ngưỡng 0,5 là "đúng" không? Giờ bạn nghĩ gì?',
    'Giải thích cho một người bạn vì sao mô hình có độ chính xác 87% vẫn có thể vô dụng.',
    'Trong một bài toán bạn biết (y tế, tài chính, học tập…), bỏ sót và báo nhầm loại nào đắt hơn?',
  ],
};
