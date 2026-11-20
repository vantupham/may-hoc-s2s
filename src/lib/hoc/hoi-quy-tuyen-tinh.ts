/**
 * Phần trải nghiệm của chương 1 (Hồi quy tuyến tính). Số liệu lấy từ ml-core (ols, mse, linearRegressionGD)
 * trên housing.mini và mẫu 400 khu vực; các số dùng scikit-learn ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const linregLearn: LessonLearn = {
  slug: 'hoi-quy-tuyen-tinh',
  minutes: 60,
  goals: [
    { text: 'Giải thích vai trò của hệ số chặn b, và vì sao w và b phải chỉnh cùng nhau.', see: 'truc-giac' },
    { text: 'Tính được hai đạo hàm ∂L/∂w, ∂L/∂b và cập nhật cả hai tham số trong một vòng.', see: 'tinh-tay' },
    { text: 'Dùng nghiệm đóng (OLS) và giải thích vì sao chuẩn hoá giúp Gradient Descent nhanh hơn nhiều.', see: 'ly-thuyet' },
    { text: 'Đánh giá mô hình đúng cách: tập test, RMSE, R² và mốc "luôn đoán trung bình".', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Gradient Descent cập nhật tham số w theo quy tắc nào?', options: ['w ← w − η·∂L/∂w', 'w ← w + η·∂L/∂w', 'w ← ∂L/∂w'], answer: 0, why: 'Đi ngược chiều độ dốc, mỗi bước dài η lần độ dốc (chương 0).' },
    { q: 'Mất mát tăng dần sau mỗi vòng. Nên làm gì?', options: ['Giảm tốc độ học η', 'Tăng η', 'Thêm vòng lặp'], answer: 0, why: 'Mất mát tăng là dấu hiệu bước quá dài, nhảy vượt qua đáy.' },
  ],
  missions: [
    {
      id: 'keo',
      step: 'truc-giac',
      title: 'Tự đặt đường thẳng qua 400 khu vực',
      predict: {
        q: 'Bạn tăng độ dốc w. Để đường thẳng vẫn đi qua giữa đám mây điểm, b phải thế nào?',
        options: ['Tăng theo', 'Giảm xuống', 'Không cần đổi'],
        answer: 1,
        why: 'Đường tốt nhất luôn đi qua điểm trung bình (x̄, ȳ), nên b = ȳ − w·x̄. Thu nhập trung bình x̄ ≈ 4,04, nên tăng w thêm 0,1 thì b phải giảm khoảng 0,4 để đường thẳng không bị nâng lên.',
      },
      tasks: [
        'Đọc "MSE của bạn" ở vị trí ban đầu (w = 0,2; b = 0,5) và ghi vào bảng.',
        'Chỉ dùng hai thanh trượt, cố đưa MSE xuống dưới 0,80. Bật "Hiện sai số" để thấy các đoạn đỏ.',
        'Bật "Hiện đường tốt nhất" và ghi "Tốt nhất có thể". Bạn cách mức đó bao nhiêu lần?',
      ],
      record: {
        cols: ['MSE'],
        rows: [
          { label: 'Ban đầu (w = 0,2; b = 0,5)', values: [1.5565] },
          { label: 'Tốt nhất có thể', values: [0.7252] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'Khi chỉnh tay, vì sao w và b "không độc lập" với nhau?',
        answer: 'Hai núm cùng quyết định độ cao của đường thẳng ở giữa đám mây điểm. Tăng w làm đường thẳng dốc lên và nâng cao phần bên phải, nên phải hạ b để kéo nó về đúng chỗ. Trên bản đồ mất mát ở bước 5, điều này hiện ra thành một thung lũng dài và chéo: đi dọc thung lũng (tăng w, giảm b) thì mất mát gần như không đổi.',
      },
    },
    {
      id: 'buoc',
      step: 'tinh-tay',
      title: 'Hai tham số, hai đạo hàm',
      predict: {
        q: 'Với η = 0,02, sau 60 vòng thì w, b đã tới nghiệm chính xác (w = 0,092; b = 1,138) chưa?',
        options: ['Đã tới nơi', 'Mất mát đã gần đáy nhưng w, b còn cách xa nghiệm', 'Mất mát tăng lên'],
        answer: 1,
        why: 'Sau 60 vòng w = 0,295 và b = 0,313 — còn rất xa 0,092 và 1,138 — dù mất mát đã giảm từ 2,42 xuống 0,303, khá gần đáy 0,229. Mặt mất mát có một thung lũng gần phẳng nên đi dọc nó rất chậm.',
      },
      tasks: [
        'Với η = 0,02, ở vòng 1 bấm vào <b>∂L/∂b</b>: nó chỉ là (2/n) nhân tổng các sai số eᵢ.',
        'Nhìn biểu đồ mất mát: sau khoảng mấy vòng thì nó gần như nằm ngang?',
        'Đọc dòng "Sau 60 vòng" với η = 0,02 và η = 0,06, ghi vào bảng. Thử thêm η = 0,065 xem chuyện gì xảy ra.',
      ],
      record: {
        cols: ['w sau 60 vòng', 'b sau 60 vòng'],
        rows: [
          { label: 'η = 0,02', values: [0.295, 0.313] },
          { label: 'η = 0,06', values: [0.216, 0.631] },
        ],
        tol: [0.0006, 0.0006],
      },
      explain: {
        q: 'Mất mát gần như nằm ngang từ khoảng vòng 10, nhưng w và b vẫn còn thay đổi. Điều đó nói gì về hình dạng mặt mất mát?',
        answer: 'Có một "thung lũng" dài và gần phẳng: nhiều cặp (w, b) khác nhau cho mất mát gần bằng nhau. Trong thung lũng gradient rất nhỏ nên bước rất ngắn, và Gradient Descent bò chậm về đáy. Với η = 0,065, bước quá dài theo hướng dốc nhất nên phân kỳ, mất mát vọt lên hàng nghìn.',
      },
    },
    {
      id: 'chuanhoa',
      step: 'ly-thuyet',
      title: 'Chuẩn hoá: từ hàng trăm bước còn một bước',
      predict: {
        q: 'Bật "Chuẩn hoá thu nhập". Số bước để tới sát đáy sẽ thay đổi thế nào?',
        options: ['Giảm từ hàng trăm xuống chỉ vài bước', 'Gần như không đổi', 'Tăng lên'],
        answer: 0,
        why: 'Chưa chuẩn hoá, η tốt nhất (0,04) cần 214 bước, các η khác còn cần hơn 300. Sau chuẩn hoá, η = 0,2 cần 11 bước và η = 0,5 chỉ cần đúng 1 bước.',
      },
      tasks: [
        'Chưa chuẩn hoá: chọn η = 0,04, ghi "Số bước cập nhật để tới sát đáy". Thử thêm η = 0,048: vì sao lại chậm hơn?',
        'Bật chuẩn hoá. Thử η = 0,2 và η = 0,5, ghi số bước.',
        'So hình dạng các đường đồng mức trước và sau khi chuẩn hoá. Bấm chạy để xem quỹ đạo.',
      ],
      record: {
        cols: ['Số bước tới sát đáy'],
        rows: [
          { label: 'Chưa chuẩn hoá, η = 0,04', values: [214] },
          { label: 'Chuẩn hoá, η = 0,2', values: [11] },
          { label: 'Chuẩn hoá, η = 0,5', values: [1] },
        ],
        tol: [0.5],
      },
      explain: {
        q: 'Vì sao chuẩn hoá làm Gradient Descent nhanh như vậy?',
        answer: 'Trước khi chuẩn hoá, x có giá trị lớn (trung bình khoảng 4) nên mất mát nhạy với w hơn b rất nhiều: cái bát dẹt. η phải đủ nhỏ cho hướng dốc nhất, nên hướng thoải bị bò rất chậm, còn η lớn hơn một chút (0,048) thì bắt đầu zíc zắc. Sau chuẩn hoá, hai hướng nhạy như nhau, cái bát gần tròn và gradient chỉ thẳng vào đáy.',
      },
    },
    {
      id: 'danhgia',
      step: 'danh-gia',
      title: 'Mô hình dự đoán tốt đến đâu trên dữ liệu mới?',
      predict: {
        q: 'Mô hình học trên 320 khu vực. Trên 80 khu vực test chưa từng thấy, R² sẽ thế nào so với trên tập train?',
        options: ['Cao hơn train', 'Thấp hơn train một chút', 'Gần bằng 0'],
        answer: 1,
        why: 'R² train 0,515, test 0,470: thấp hơn một chút. Mô hình chỉ có 2 tham số nên khó "học thuộc", và khoảng cách nhỏ. Cả hai đều xa 1 vì thu nhập chỉ giải thích được khoảng một nửa biến động giá nhà.',
      },
      tasks: [
        'Trong bảng chỉ số, ghi R² của hồi quy trên train và test, và R² của "luôn đoán giá trung bình".',
        'Kéo thanh thu nhập tới 5: giá dự đoán khoảng bao nhiêu USD, sai lệch điển hình bao nhiêu?',
        'Kéo thu nhập lên trên 10 và đọc cảnh báo. Vì sao mô hình có thể đoán giá cao hơn 500.001 USD?',
      ],
      record: {
        cols: ['R²'],
        rows: [
          { label: 'Hồi quy, train', values: [0.515] },
          { label: 'Hồi quy, test', values: [0.47] },
          { label: 'Luôn đoán trung bình, test', values: [-0.001] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'R² của "luôn đoán trung bình" gần bằng 0, thậm chí âm. Vì sao nó vẫn là một mốc so sánh quan trọng?',
        answer: 'Vì đó là mô hình "không học gì": ai cũng làm được mà không cần dữ liệu x. Mô hình nào không thắng được nó là vô dụng. R² âm nghĩa là dự đoán còn tệ hơn đoán trung bình — ở đây nó hơi âm vì trung bình được tính trên tập train, hơi lệch so với tập test. Hồi quy giảm RMSE từ khoảng 119.000 USD xuống 87.000 USD so với mốc này.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Hệ số chặn b cho phép điều gì mà mô hình ŷ = w·x ở chương 0 không làm được?', options: ['Đường thẳng không bắt buộc đi qua gốc toạ độ', 'Vẽ đường cong', 'Dùng nhiều đặc trưng'], answer: 0, why: 'b là giá trị ŷ khi x = 0: nó nâng hoặc hạ cả đường thẳng.' },
    'tinh-tay': { q: 'Ở một vòng, tổng sai số Σeᵢ = −3 với n = 5 khu vực. ∂L/∂b bằng bao nhiêu?', options: ['−0,6', '−1,2', '−3'], answer: 1, why: '∂L/∂b = (2/n)·Σeᵢ = (2/5) × (−3) = −1,2. Âm nên b sẽ tăng.' },
    'ly-thuyet': { q: 'Đường thẳng OLS tốt nhất luôn đi qua điểm nào?', options: ['Gốc toạ độ', 'Điểm trung bình (x̄, ȳ)', 'Khu vực có giá cao nhất'], answer: 1, why: 'Từ ∂L/∂b = 0 suy ra b = ȳ − w·x̄, tức ŷ(x̄) = ȳ.' },
    'ma-nguon': { q: 'Mã tự viết huấn luyện trên x′ = (x − μ)/σ. Vì sao cuối cùng phải "đổi ngược" w, b?', options: ['Để dùng mô hình với thu nhập gốc: w_gốc = w/σ, b_gốc = b − w·μ/σ', 'Để làm tròn số', 'Không cần đổi'], answer: 0, why: 'Mô hình học trên thang đã chuẩn hoá. Thay x′ = (x − μ)/σ vào ŷ = w·x′ + b rồi gom lại theo x là ra hai công thức đó.' },
  },
  codeTasks: [
    {
      title: 'Bỏ chuẩn hoá',
      task: 'Trong <code>hoi_quy_tu_viet.py</code>, đổi <code>xs = (x - mu) / sd</code> thành <code>xs = x</code>, giữ <code>eta = 0.2</code>, rồi chạy. Đoán trước: điều gì xảy ra?',
      answer: 'Phân kỳ: w, b in ra những số khổng lồ (cỡ 10⁴⁰). Với x gốc, η phải nhỏ hơn khoảng 0,05 — đúng như lab bản đồ mất mát cho thấy ở bước 5. (Công thức đổi ngược lúc này cũng không còn đúng, vì không còn chuẩn hoá.)',
    },
    {
      title: 'Thêm sai số tuyệt đối trung bình (MAE)',
      task: 'Trong <code>hoi_quy_sklearn.py</code>, thêm <code>from sklearn.metrics import mean_absolute_error</code> và in MAE trên tập test.',
      answer: 'MAE ≈ 0,683, tức dự đoán lệch trung bình khoảng 68.300 USD. RMSE (0,867) lớn hơn MAE vì RMSE bình phương sai số nên phạt nặng các khu vực sai nhiều — chủ yếu là các khu bị chặn trần.',
      code: `from sklearn.metrics import mean_absolute_error
print("MAE test =", round(mean_absolute_error(y_te, pred), 4))`,
    },
    {
      title: 'Thêm đặc trưng thứ hai: tuổi nhà',
      task: 'Sửa <code>hoi_quy_sklearn.py</code> để X gồm hai cột: thu nhập và tuổi nhà (<code>r["age"]</code>). R² test thay đổi thế nào?',
      answer: 'R² test tăng từ 0,470 lên 0,528 và MAE giảm còn 0,594. Hệ số của tuổi nhà ≈ 0,024: cùng thu nhập, khu nhà cũ hơn 10 năm đắt hơn khoảng 24.000 USD — có thể vì khu cũ thường nằm gần trung tâm đô thị cũ, nơi đất đắt hơn.',
      code: `X_tr = np.array([[r["income"], r["age"]] for r in rows if r["id"] not in test])
X_te = np.array([[r["income"], r["age"]] for r in rows if r["id"] in test])
model = LinearRegression().fit(X_tr, y_tr)
print(model.coef_.round(4), round(r2_score(y_te, model.predict(X_te)), 3))`,
    },
  ],
  quiz: [
    { q: 'Đạo hàm ∂L/∂b bằng gì?', options: ['(2/n)·Σ eᵢ·xᵢ', '(2/n)·Σ eᵢ', '(1/n)·Σ eᵢ²'], answer: 1, why: 'Đạo hàm của (w·xᵢ + b − yᵢ) theo b bằng 1, nên chỉ còn lại 2·eᵢ, lấy trung bình.' },
    { q: 'Vì sao chuẩn hoá x giúp Gradient Descent hội tụ nhanh hơn?', options: ['Vì nó làm dữ liệu ít nhiễu hơn', 'Vì nó làm các đường đồng mức tròn hơn, gradient chỉ thẳng về đáy', 'Vì nó làm giảm số dòng dữ liệu'], answer: 1, why: 'Chuẩn hoá cân bằng độ nhạy của mất mát theo từng tham số. Cái bát tròn nên một tốc độ học phù hợp với mọi hướng.' },
    { q: 'Mô hình có R² = 0,62 trên tập train và 0,20 trên tập test. Điều này cho thấy gì?', options: ['Mô hình tổng quát hoá tốt', 'Mô hình hoạt động kém hơn nhiều trên dữ liệu mới', 'Tập test bị lỗi'], answer: 1, why: 'Khoảng cách lớn giữa train và test là dấu hiệu mô hình không tổng quát hoá tốt, hoặc hai tập có phân phối khác nhau.' },
    { q: 'Vận dụng: mô hình dự đoán giá nhà có RMSE test = 0,87 (×100.000 USD). Nói với khách hàng thế nào là đúng?', options: ['Dự đoán thường lệch khoảng 87.000 USD, có căn lệch nhiều hơn', 'Dự đoán đúng 87%', 'Mọi dự đoán lệch đúng 87.000 USD'], answer: 0, why: 'RMSE là độ lệch "điển hình", cùng đơn vị với giá nhà. Nó không phải tỷ lệ phần trăm và không phải độ lệch của từng căn.' },
    { q: 'Vận dụng: w = 0,446 nghĩa là mỗi 10.000 USD thu nhập thêm ứng với khoảng 44.600 USD giá nhà. Có thể kết luận "tăng lương cho người dân sẽ làm giá nhà tăng" không?', options: ['Có, w đo tác động trực tiếp', 'Không: w chỉ đo mối liên hệ trong dữ liệu; khu thu nhập cao thường khác cả ở vị trí, trường học, việc làm', 'Có, nếu R² đủ cao'], answer: 1, why: 'Hồi quy trên dữ liệu quan sát cho thấy tương quan, không chứng minh nhân quả. Muốn kết luận nhân quả cần thí nghiệm hoặc phương pháp riêng.' },
  ],
  takeaways: {
    points: [
      'Hồi quy tuyến tính: <b>ŷ = w·x + b</b>. Hệ số chặn b cho phép đường thẳng không đi qua gốc toạ độ.',
      'Hai cách tìm w, b — <b>Gradient Descent</b> (lặp) và <b>nghiệm đóng OLS</b> (giải thẳng) — cho cùng một đáp số. Đường OLS luôn đi qua điểm trung bình (x̄, ȳ).',
      'Mặt mất mát có thể là một thung lũng dẹt: mất mát gần đáy nhưng tham số còn xa nghiệm. <b>Chuẩn hoá</b> làm nó tròn lại: từ 214 bước còn 1 bước.',
      'Luôn đánh giá trên <b>tập test</b> và so với mốc <b>"luôn đoán trung bình"</b>. Ở đây R² test = 0,47: thu nhập giải thích khoảng một nửa biến động giá nhà.',
      'Hệ số hồi quy đo <b>mối liên hệ</b>, không phải nhân quả.',
    ],
    use: [
      'Quan hệ gần tuyến tính và cần mô hình dễ giải thích: mỗi hệ số có nghĩa rõ ràng',
      'Làm mốc so sánh đầu tiên trước khi thử mô hình phức tạp',
      'Ít dữ liệu: 2 tham số khó học thuộc',
    ],
    avoid: [
      'Quan hệ cong rõ rệt hoặc có ngưỡng: cần biến đổi đặc trưng hoặc mô hình khác (cây quyết định, chương 5)',
      'Dự đoán ở vùng không có dữ liệu (ngoại suy)',
      'Nhãn bị chặn trần như giá 500.001 USD: mô hình tuyến tính không biết giá thật',
    ],
    next: { text: 'Chương 2 đổi câu hỏi: không dự đoán một con số mà dự đoán một nhãn — khối u lành hay ác. Đường thẳng vẫn ở đó, nhưng được bọc trong hàm sigmoid để thành xác suất.', slug: 'hoi-quy-logistic', title: 'Chương 2: Hồi quy logistic' },
  },
  challenges: [
    {
      level: 1,
      title: 'Nghiệm đóng cho 5 khu vực',
      task: 'Với 5 khu vực của chương 0 (x = 1,9667; 2,7556; 3,5586; 4,4435; 5,5867 và y = 0,846; 2,132; 1,604; 0,976; 1,825), tính x̄, ȳ, rồi w* = Σ(xᵢ − x̄)(yᵢ − ȳ) / Σ(xᵢ − x̄)² và b* = ȳ − w*·x̄.',
      hint: 'Lập bảng 4 cột: xᵢ − x̄, yᵢ − ȳ, tích của chúng, và (xᵢ − x̄)².',
      answer: 'x̄ = 3,6622; ȳ = 1,4766. Các tích (xᵢ − x̄)(yᵢ − ȳ) ≈ 1,069; −0,594; −0,013; −0,391; 0,671, tổng ≈ 0,741. Các bình phương ≈ 2,875; 0,822; 0,011; 0,610; 3,704, tổng ≈ 8,022. w* = 0,741/8,022 ≈ 0,0924; b* = 1,4766 − 0,0924 × 3,6622 ≈ 1,1382. Khớp với đáp số mà Gradient Descent ở lab bước 4 đang chậm chạp tiến tới.',
    },
    {
      level: 2,
      title: 'Vị trí có quan trọng không?',
      task: 'Thêm cột vị trí vào <code>hoi_quy_sklearn.py</code> dưới dạng mã hoá one-hot (mỗi loại vị trí một cột 0/1, bỏ một loại làm mốc). R² test thay đổi bao nhiêu? Hệ số của "INLAND" (nội địa) nói gì?',
      hint: 'Các loại vị trí: <code>&lt;1H OCEAN</code>, <code>INLAND</code>, <code>NEAR BAY</code>, <code>NEAR OCEAN</code>. Dùng <code>&lt;1H OCEAN</code> làm mốc.',
      answer: 'R² test tăng từ 0,470 lên 0,564. Hệ số INLAND ≈ −0,666: cùng thu nhập, nhà nội địa rẻ hơn khoảng 66.600 USD so với khu cách biển dưới 1 giờ. Đây chính là lời giải cho "căn 4" ở chương 0 — giá thấp không phải lỗi mà do vị trí. Cách mã hoá one-hot được dạy kỹ ở chương 3B.',
      code: `cats = ["INLAND", "NEAR BAY", "NEAR OCEAN"]   # bỏ "<1H OCEAN" làm mốc
feat = lambda r: [r["income"]] + [1.0 if r["ocean"] == c else 0.0 for c in cats]
X_tr = np.array([feat(r) for r in rows if r["id"] not in test])
X_te = np.array([feat(r) for r in rows if r["id"] in test])
model = LinearRegression().fit(X_tr, y_tr)
print(model.coef_.round(3), round(r2_score(y_te, model.predict(X_te)), 3))`,
    },
    {
      level: 3,
      title: 'Xử lý giá bị chặn trần',
      task: 'Trong mẫu 400 khu vực có 26 khu vực bị ghi giá đúng 5,0 (21 ở tập train, 5 ở tập test), dù giá thật có thể cao hơn nhiều. Bạn sẽ xử lý thế nào? Mỗi cách được và mất gì?',
      hint: 'Nghĩ tới ba hướng: bỏ đi, giữ nguyên, hoặc tìm thêm thông tin. Và nghĩ tới việc mô hình sẽ được dùng cho ai.',
      answer: 'Bỏ 21 khu vực bị chặn khỏi tập train thì w giảm từ 0,446 xuống 0,419 (đường thẳng bớt bị kéo lên bởi các giá "giả"). R² trên 75 khu vực test không bị chặn tăng từ 0,319 lên 0,359. Cái giá: mô hình chỉ còn đáng tin cho nhà dưới 500.000 USD, và phải nói rõ điều đó với người dùng. Giữ nguyên thì mô hình học sai ở vùng giá cao. Cách tốt nhất là tìm giá thật từ nguồn khác; nếu không được, có mô hình chuyên cho dữ liệu bị chặn (hồi quy Tobit). Không có đáp án đúng duy nhất — quan trọng là biết vấn đề tồn tại và ghi rõ giới hạn. Chương 3A đi sâu vào loại lỗi dữ liệu này.',
    },
  ],
  reflect: [
    'Bạn có bất ngờ khi mất mát đã gần đáy mà w, b vẫn còn xa nghiệm không? Điều đó thay đổi cách bạn đọc biểu đồ mất mát thế nào?',
    'Giải thích cho một người bạn vì sao phải tách tập train và tập test, trong 2–3 câu.',
    'Nếu dùng mô hình này để định giá nhà thật, bạn sẽ cảnh báo người dùng điều gì?',
  ],
};
