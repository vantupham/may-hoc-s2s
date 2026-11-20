/**
 * Phần trải nghiệm của chương 6 (SVM). Mọi con số trong đáp án và bảng ghi lấy từ chính các lab
 * (ml-core) hoặc từ scikit-learn 1.6 trên cùng tập train/test; tests/learn.test.ts kiểm tra lại các số của lab.
 */
import type { LessonLearn } from '../learn';

export const svmLearn: LessonLearn = {
  slug: 'svm',
  minutes: 60,
  goals: [
    { text: 'Giải thích vì sao SVM chọn đường ranh giới có lề lớn nhất, và vector hỗ trợ là gì.', see: 'truc-giac' },
    { text: 'Tính được lề mᵢ = yᵢ·f(xᵢ) và hinge loss của một bệnh nhân, nhận ra ai đang vi phạm lề.', see: 'tinh-tay' },
    { text: 'Đọc được đánh đổi của hệ số C: lề rộng hay ít vi phạm.', see: 'ly-thuyet' },
    { text: 'Nhận ra khi nào nhân RBF học thuộc lòng (γ quá lớn) và biết chọn C, γ đúng cách.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Hồi quy logistic (chương 2) tách hai lớp bằng ranh giới nào?', options: ['Đường thẳng w·x + b = 0', 'Một đường tròn quanh mỗi điểm', 'Nhiều đường thẳng song song'], answer: 0, why: 'Ranh giới là nơi xác suất bằng 0,5, tức w·x + b = 0 — một đường thẳng trong không gian hai đặc trưng.' },
    { q: 'Vì sao phải chuẩn hoá đặc trưng trước khi dùng một mô hình dựa trên khoảng cách (chương 3B)?', options: ['Để đặc trưng có thang đo lớn không lấn át đặc trưng khác', 'Để giảm số mẫu', 'Để hai lớp cân bằng'], answer: 0, why: 'Khoảng cách cộng chênh lệch của mọi đặc trưng; đặc trưng đo bằng hàng nghìn sẽ quyết định gần như mọi thứ nếu không chuẩn hoá.' },
  ],
  missions: [
    {
      id: 'le',
      step: 'truc-giac',
      title: 'Tìm đường thẳng có lề rộng nhất cho 6 bệnh nhân',
      predict: {
        q: '6 bệnh nhân này tách được hoàn toàn. Đường có lề rộng nhất sẽ chạm mép dải lề ở bao nhiêu bệnh nhân?',
        options: ['Chỉ 1 người', '2–3 người, từ cả hai nhóm', 'Cả 6 người'],
        answer: 1,
        why: 'Đường tốt nhất bị "kẹp" giữa những người gần nhất của hai nhóm: cần ít nhất một người ở mỗi phía. Ở đây là 3 người — hai lành tính và một ác tính — đều cách đường thẳng 0,798. Họ là vector hỗ trợ.',
      },
      tasks: [
        'Xoay và dịch đường thẳng cho tới khi <b>không còn ai bị phân loại sai</b>.',
        'Cố tăng "Lề hiện tại" càng lớn càng tốt bằng tay. Ghi nhớ con số tốt nhất bạn đạt được.',
        'Bấm <b>Đặt đường có lề lớn nhất</b>. Đếm số bệnh nhân có viền đen (chạm mép dải lề).',
      ],
      record: {
        cols: ['Giá trị'],
        rows: [
          { label: 'Lề lớn nhất có thể', values: [0.798] },
          { label: 'Số người chạm mép dải lề', values: [3] },
        ],
        tol: [0.005],
      },
      explain: {
        q: 'Vì sao dời một bệnh nhân ở xa ranh giới (không có viền đen) đi chỗ khác — miễn là vẫn ngoài dải lề — không làm đường tốt nhất thay đổi?',
        answer: 'Lề là khoảng cách nhỏ nhất, nên chỉ những người gần nhất quyết định nó. Người ở xa không "chạm" vào ràng buộc nào; chỉ khi họ đi vào trong dải lề, họ mới trở thành vector hỗ trợ và kéo đường thẳng đi.',
      },
    },
    {
      id: 'buoc',
      step: 'tinh-tay',
      title: 'Theo dõi subgradient từng bước',
      predict: {
        q: 'Ở bước 1, w = (0, 0) và b = 0. Bao nhiêu trong 6 bệnh nhân đang vi phạm lề (mᵢ < 1)?',
        options: ['Không ai', '3 người', 'Cả 6 người'],
        answer: 2,
        why: 'Khi w = 0 và b = 0 thì f(x) = 0 với mọi người, nên mᵢ = yᵢ·0 = 0 < 1. Ai cũng vi phạm, ai cũng góp vào gradient ở bước đầu.',
      },
      tasks: [
        'Ở bước 1, bấm vào vài giá trị mᵢ trong bảng để xem chúng được tính ra sao.',
        'Bấm tiến từng bước. Để ý <b>số chấm có viền đen</b> (người vi phạm) giảm dần, và chỉ họ góp vào g_w₁.',
        'Đổi C sang 0,1 rồi 10 và chạy tới bước cuối. Với C nào dải lề rộng nhất? Với C nào không còn ai vi phạm?',
      ],
      explain: {
        q: 'Vì sao bệnh nhân đã nằm ngoài dải lề, đúng phía, không góp gì vào gradient?',
        answer: 'Với họ mᵢ ≥ 1 nên hinge loss max(0, 1 − mᵢ) = 0 và đạo hàm theo w, b cũng bằng 0. Khi đó chỉ còn số hạng ½‖w‖² kéo w nhỏ lại — tức kéo dải lề rộng ra — cho tới khi có người chạm mép.',
      },
    },
    {
      id: 'C',
      step: 'danh-gia',
      title: 'Hệ số C trên 455 bệnh nhân',
      predict: {
        q: 'Tăng C từ 0,001 lên 100. Số vector hỗ trợ sẽ thế nào?',
        options: ['Tăng', 'Giảm', 'Gần như không đổi'],
        answer: 1,
        why: 'C lớn phạt nặng mỗi vi phạm nên dải lề hẹp lại và ít người nằm trong nó: từ 385 xuống 112 trên 455 bệnh nhân.',
      },
      tasks: [
        'Kéo thanh C qua cả 6 mức. Ở mỗi mức, đọc độ rộng lề, số vector hỗ trợ và độ chính xác test.',
        'Điền ba mức C = 0,01, C = 1 và C = 100 vào bảng bên dưới rồi bấm <b>Đối chiếu số liệu</b>.',
        'Tìm mức C nhỏ nhất mà từ đó độ chính xác test không tăng thêm nữa.',
      ],
      record: {
        cols: ['Độ rộng lề', 'Số vector hỗ trợ', 'Độ chính xác test (%)'],
        rows: [
          { label: 'C = 0,01', values: [2.149, 246, 88.6] },
          { label: 'C = 1', values: [0.846, 124, 91.2] },
          { label: 'C = 100', values: [0.747, 112, 91.2] },
        ],
        tol: [0.005, 0.5, 0.15],
      },
      explain: {
        q: 'Vì sao độ chính xác test không tăng mãi khi tăng C?',
        answer: 'Hai nhóm chồng lấn: luôn có những ca nằm lẫn sang phía nhóm kia mà không đường thẳng nào tách được. Từ C = 1, đường ranh giới gần như đứng yên — w chỉ nhích từ (2,29; 0,60) lên (2,59; 0,67) — nên dự đoán trên tập test không đổi. C lớn hơn chỉ làm lề hẹp lại mà không tách thêm được ai.',
      },
    },
    {
      id: 'rbf',
      step: 'danh-gia',
      title: 'Nhân RBF và học thuộc lòng',
      predict: {
        q: 'Tăng γ từ 0,1 lên 50. Độ chính xác trên tập huấn luyện và tập test thay đổi thế nào?',
        options: ['Cả hai cùng tăng', 'Huấn luyện tăng, test giảm', 'Cả hai cùng giảm'],
        answer: 1,
        why: 'Độ chính xác huấn luyện tăng từ 89,9% lên 94,7%, còn test giảm từ 92,1% xuống 80,7%: ranh giới uốn quanh từng bệnh nhân, tức là học thuộc lòng.',
      },
      tasks: [
        'Chọn lần lượt 4 giá trị γ, quan sát ranh giới đổi hình dạng.',
        'Ghi độ chính xác huấn luyện và test của γ = 0,1 và γ = 50 vào bảng.',
        'Ở γ = 50, tìm một "hòn đảo" màu nhỏ bao quanh vài bệnh nhân lẻ loi giữa vùng của nhóm kia.',
      ],
      record: {
        cols: ['Huấn luyện (%)', 'Test (%)'],
        rows: [
          { label: 'γ = 0,1', values: [89.9, 92.1] },
          { label: 'γ = 50', values: [94.7, 80.7] },
        ],
        tol: [0.15, 0.15],
      },
      explain: {
        q: 'Chênh lệch giữa điểm huấn luyện và điểm test ở γ = 50 nói lên điều gì? Trong thực tế bạn sẽ chọn γ thế nào?',
        answer: 'Chênh 14 điểm phần trăm là dấu hiệu quá khớp (overfitting): mô hình nhớ từng bệnh nhân thay vì học quy luật. Trong thực tế, chọn γ và C bằng cross-validation trên tập huấn luyện (chương 8) và chỉ dùng tập test một lần ở cuối — bảng trên dùng tập test chỉ để minh hoạ.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Vector hỗ trợ là gì?', options: ['Mọi bệnh nhân trong tập huấn luyện', 'Những bệnh nhân nằm trên mép hoặc bên trong dải lề', 'Hai hệ số của w'], answer: 1, why: 'Chỉ những người chạm hoặc lấn vào dải lề mới có hinge loss khác 0 hoặc nằm đúng trên ràng buộc, nên chỉ họ quyết định nghiệm.' },
    'tinh-tay': { q: 'Một bệnh nhân ác tính (y = +1) có f(x) = 0,4. Hinge loss của người đó bằng bao nhiêu?', options: ['0', '0,4', '0,6'], answer: 2, why: 'm = y·f(x) = 0,4 < 1 nên loss = 1 − 0,4 = 0,6. Người này đúng phía nhưng nằm trong dải lề.' },
    'ly-thuyet': { q: 'Trong hàm mục tiêu ½‖w‖² + C·Σ hinge, số hạng ½‖w‖² muốn điều gì?', options: ['Lề rộng', 'Ít vi phạm', 'Xác suất dự đoán chính xác'], answer: 0, why: 'Độ rộng lề = 2/‖w‖, nên ‖w‖ nhỏ nghĩa là lề rộng. Số hạng thứ hai mới đếm vi phạm.' },
    'ma-nguon': { q: 'scikit-learn giải bằng SMO, trang này giải bằng subgradient. Vì sao hai kết quả gần như trùng nhau?', options: ['Hai cách cùng tối ưu một hàm mục tiêu lồi, nên cùng tới một nghiệm tốt nhất', 'Vì hai bên dùng chung mã nguồn', 'Trùng hợp ngẫu nhiên'], answer: 0, why: 'Hàm mục tiêu của SVM lồi: mọi thuật toán đi đúng hướng đều tới cùng một cực tiểu, chỉ khác tốc độ.' },
  },
  codeTasks: [
    {
      title: 'Thêm C = 0,001',
      task: 'Trong ô mã ở trên, đổi <code>for C in (0.01, 1, 100)</code> thành <code>for C in (0.001, 0.01, 1, 100)</code> rồi chạy lại.',
      answer: 'Với C = 0,001, lề rất rộng (khoảng 8,5), có 346 vector hỗ trợ và độ chính xác test tụt còn khoảng 68%: phạt vi phạm quá nhẹ nên mô hình gần như bỏ qua dữ liệu.',
    },
    {
      title: 'Kiểm tra lại định nghĩa vector hỗ trợ',
      task: 'Sau vòng lặp, huấn luyện lại với C = 1 và tính yᵢ·f(xᵢ) cho mọi vector hỗ trợ (<code>m.support_</code> là chỉ số của họ trong tập huấn luyện).',
      hint: 'f(x) = x·w + b, với w = <code>m.coef_[0]</code> và b = <code>m.intercept_[0]</code>.',
      answer: 'Mọi giá trị đều ≤ 1: những người bằng đúng 1 nằm trên mép lề, nhỏ hơn 1 là lấn vào trong, âm là nằm sai phía (nhỏ nhất khoảng −2,27).',
      code: `m = SVC(kernel="linear", C=1).fit(X[~te], y[~te])
Xtr, ytr = X[~te], y[~te]
sv = m.support_
mi = ytr[sv] * (Xtr[sv] @ m.coef_[0] + m.intercept_[0])
print(len(sv), mi.min().round(3), mi.max().round(3))`,
    },
    {
      title: 'Chọn C và γ bằng cross-validation',
      task: 'Dùng <code>GridSearchCV</code> với C trong (0,1; 1; 10) và γ trong (0,1; 1; 10), 5 lần gập, chỉ trên tập huấn luyện. In bộ tham số tốt nhất và độ chính xác trên tập test.',
      hint: '<code>from sklearn.model_selection import GridSearchCV</code>',
      answer: 'Cross-validation chọn C = 0,1 và γ = 1 — một ranh giới gần thẳng, đúng như bản đồ RBF gợi ý — và đạt 91,2% trên tập test.',
      code: `from sklearn.model_selection import GridSearchCV
g = GridSearchCV(SVC(kernel="rbf"), {"C": [0.1, 1, 10], "gamma": [0.1, 1, 10]}, cv=5)
g.fit(X[~te], y[~te])
print(g.best_params_, round(g.score(X[te], y[te]), 3))`,
    },
  ],
  quiz: [
    { q: 'Bỏ đi một bệnh nhân nằm xa ranh giới, ngoài dải lề. Đường ranh giới của SVM thay đổi thế nào?', options: ['Không đổi', 'Dịch về phía bệnh nhân đó', 'Thay đổi hoàn toàn'], answer: 0, why: 'Hinge loss của người đó bằng 0 và họ không phải vector hỗ trợ, nên họ không ảnh hưởng tới nghiệm.' },
    { q: '‖w‖ = 4. Dải lề rộng bao nhiêu?', options: ['0,25', '0,5', '4'], answer: 1, why: 'Độ rộng lề = 2/‖w‖ = 2/4 = 0,5.' },
    { q: 'Tăng C từ 0,01 lên 100 thường làm gì?', options: ['Lề rộng ra, nhiều vector hỗ trợ hơn', 'Lề hẹp lại, ít vi phạm hơn trên tập huấn luyện', 'Không ảnh hưởng gì'], answer: 1, why: 'C lớn phạt nặng mỗi vi phạm, nên mô hình hy sinh độ rộng lề để giảm vi phạm.' },
    { q: 'Vận dụng: bác sĩ cần biết "xác suất ác tính là bao nhiêu" để tư vấn bệnh nhân. Dùng thẳng f(x) của SVM được không?', options: ['Được, f(x) chính là xác suất', 'Không: f(x) là khoảng cách có dấu; cần hiệu chỉnh (Platt) hoặc dùng hồi quy logistic', 'Được, nếu chọn C đủ lớn'], answer: 1, why: 'f(x) có thể là −2 hay 3,5 — không nằm trong [0, 1] và không được hiệu chỉnh để khớp tần suất thật.' },
    { q: 'Vận dụng: bạn thêm đặc trưng "diện tích nhân" tính bằng µm² (giá trị cỡ hàng trăm đến hàng nghìn) mà không chuẩn hoá. Điều gì dễ xảy ra?', options: ['Không ảnh hưởng gì', 'Đặc trưng này lấn át khoảng cách và gần như một mình quyết định ranh giới', 'SVM tự chuẩn hoá nên không sao'], answer: 1, why: 'Lề và nhân RBF đều dựa trên khoảng cách; đặc trưng có thang đo lớn nhất sẽ áp đảo. scikit-learn không tự chuẩn hoá.' },
  ],
  takeaways: {
    points: [
      'SVM chọn đường ranh giới có <b>lề rộng nhất</b>; độ rộng lề = 2/‖w‖.',
      'Chỉ <b>vector hỗ trợ</b> quyết định nghiệm: người ở xa, đúng phía, không ảnh hưởng gì.',
      '<b>Hinge loss</b> bằng 0 với người đã an toàn — khác mất mát log của hồi quy logistic, nơi ai cũng góp một chút.',
      '<b>C</b> cân giữa lề rộng và ít vi phạm; <b>γ</b> của nhân RBF quyết định ranh giới cong tới đâu. Cả hai chọn bằng cross-validation, không chọn bằng tập test.',
      'Đầu ra f(x) là <b>khoảng cách có dấu</b>, không phải xác suất.',
    ],
    use: [
      'Dữ liệu vừa và nhỏ (đến vài chục nghìn mẫu), kể cả khi có nhiều đặc trưng',
      'Cần ranh giới bền với sai số đo nhỏ',
      'Ranh giới cong nhưng mượt: nhân RBF',
    ],
    avoid: [
      'Hàng triệu mẫu: thời gian huấn luyện nhân phi tuyến tăng khoảng bình phương theo số mẫu',
      'Cần xác suất đáng tin để ra quyết định theo mức rủi ro',
      'Chưa chuẩn hoá đặc trưng',
    ],
    next: { text: 'Trong chương này ta nhìn tập test để thấy tác động của C và γ — trong thực tế không được làm vậy. Chương 8 cho cách làm đúng: cross-validation, và cách đọc ROC khi dịch ngưỡng.', slug: 'danh-gia-mo-hinh', title: 'Chương 8: Đánh giá mô hình' },
  },
  challenges: [
    {
      level: 1,
      title: 'Bệnh nhân #62 bị phân loại thế nào?',
      task: 'Với C = 1, lab "Hệ số C" cho w = (2,288; 0,596) và b = −0,494. Bệnh nhân #62 ác tính (y = +1) có x = (0,0349; 0,6656). Tính f(x), mᵢ và hinge loss. Người này được phân loại đúng không, có phải vector hỗ trợ không?',
      hint: 'f(x) = w₁x₁ + w₂x₂ + b; m = y·f(x); hinge = max(0, 1 − m).',
      answer: 'f(x) = 2,288·0,0349 + 0,596·0,6656 − 0,494 ≈ 0,080 + 0,397 − 0,494 = −0,017. Vậy m = −0,017 < 0: bị dự đoán nhầm là lành tính, dù chỉ sát ranh giới. Hinge loss = 1 − (−0,017) ≈ 1,017. Vì m < 1, người này là vector hỗ trợ. Đây cũng chính là bệnh nhân số 1 trong phần tính tay: ở 6 người thì tách được, nhưng giữa 455 người thì không.',
    },
    {
      level: 2,
      title: 'SVM hay hồi quy logistic?',
      task: 'Trong ô mã ở bước 6, thêm <code>LogisticRegression</code> huấn luyện trên cùng tập train và in độ chính xác test, cạnh SVM tuyến tính với C = 1. Hai mô hình khác nhau ở đâu, giống nhau ở đâu?',
      hint: '<code>from sklearn.linear_model import LogisticRegression</code>',
      answer: 'Cả hai đạt 91,2% trên tập test. Với hai đặc trưng này, cả hai đều là một đường thẳng và nằm gần nhau; khác biệt nằm ở <i>cách chọn</i> đường (lề rộng nhất hay xác suất khớp nhất) và ở đầu ra (khoảng cách hay xác suất). Bài học: mô hình "xịn" hơn không tự động tốt hơn khi dữ liệu chỉ cho phép một ranh giới thẳng.',
      code: `from sklearn.linear_model import LogisticRegression
lr = LogisticRegression().fit(X[~te], y[~te])
svm = SVC(kernel="linear", C=1).fit(X[~te], y[~te])
print("logistic:", round(lr.score(X[te], y[te]), 3), " SVM:", round(svm.score(X[te], y[te]), 3))`,
    },
    {
      level: 3,
      title: 'Bỏ sót ca ác tính nguy hiểm hơn báo nhầm',
      task: 'Trong chẩn đoán ung thư, bỏ sót một ca ác tính nguy hiểm hơn báo nhầm một ca lành tính. Bạn sẽ thay đổi SVM thế nào để phản ánh điều đó? Cái giá phải trả là gì?',
      hint: 'Nghĩ tới hai chỗ có thể chỉnh: mức phạt vi phạm của từng lớp, và ngưỡng của f(x).',
      answer: 'Cách 1: phạt vi phạm của lớp ác tính nặng hơn — trong scikit-learn là <code>class_weight={1: 3, -1: 1}</code>. Trên tập test, độ nhạy (tỷ lệ bắt được ca ác tính) tăng từ 84,6% lên 89,7%, nhưng số ca lành tính bị báo nhầm tăng từ 4 lên 14, và độ chính xác chung giảm từ 91,2% xuống 84,2%. Cách 2: giữ mô hình, hạ ngưỡng — dự đoán ác tính khi f(x) > −0,5 thay vì > 0. Cả hai đều đổi báo nhầm lấy ít bỏ sót; "độ chính xác" không còn là thước đo phù hợp. Chương 8 đo đánh đổi này bằng đường ROC.',
    },
  ],
  reflect: [
    'Điều gì trong bài làm bạn bất ngờ nhất, so với dự đoán ban đầu?',
    'Giải thích "vector hỗ trợ" và "hệ số C" cho một người chưa học máy học, trong 2–3 câu.',
    'Với một bài toán bạn quan tâm, SVM có phù hợp không? Vì sao?',
  ],
};
