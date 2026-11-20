/**
 * Phần trải nghiệm của chương 5 (Cây quyết định và tập hợp). Số liệu lấy từ ml-core (gini, splitCandidates,
 * buildTree, randomForest, gradientBoosting) trên titanic.json; số dùng scikit-learn ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const treeLearn: LessonLearn = {
  slug: 'cay-quyet-dinh',
  minutes: 60,
  goals: [
    { text: 'Tính độ vẩn đục Gini của một nhóm và Gini sau khi chia.', see: 'truc-giac' },
    { text: 'Giải thích cây chọn câu hỏi thế nào: thử mọi đặc trưng, mọi ngưỡng, chọn Gini nhỏ nhất (tham lam).', see: 'tinh-tay' },
    { text: 'Nhận ra cây quá sâu học thuộc dữ liệu, và chọn độ sâu hợp lý.', see: 'danh-gia' },
    { text: 'Phân biệt Random Forest (bỏ phiếu song song) với Gradient Boosting (sửa lỗi nối tiếp).', see: 'ly-thuyet' },
  ],
  warmup: [
    { q: 'Tập test có 178 hành khách. Một người đoán đúng hay sai thay đổi độ chính xác bao nhiêu?', options: ['Khoảng 0,56 điểm phần trăm', 'Khoảng 5 điểm', '0,01 điểm'], answer: 0, why: '100/178 ≈ 0,56. Nhớ con số này khi so hai mô hình chênh nhau 1 điểm.' },
    { q: 'Điền tuổi thiếu bằng trung vị tính trên cả train lẫn test là lỗi gì?', options: ['Rò rỉ dữ liệu', 'Quá khớp', 'Không có lỗi'], answer: 0, why: 'Chương 3B: mọi tham số của bước xử lý phải học từ tập huấn luyện.' },
  ],
  missions: [
    {
      id: 'gini',
      step: 'truc-giac',
      title: 'Tính tay câu hỏi đầu tiên: "Nam hay nữ?"',
      predict: {
        q: 'Hỏi giới tính trước. Nhánh nữ có 74% người sống sót, nhánh nam 19%. Theo Gini, nhánh nào "sạch" hơn (ít lẫn lộn hơn)?',
        options: ['Nhánh nam', 'Nhánh nữ', 'Như nhau'],
        answer: 0,
        why: 'Gini nhánh nam = 0,306, nhánh nữ = 0,383. Nghe ngược, nhưng 19% sống nghĩa là 81% cùng một kết cục — khá thuần. Nhánh nữ 74/26 lẫn hơn. Gini đo độ lẫn lộn, không đo tỷ lệ sống.',
      },
      tasks: [
        'Dùng bảng ở bước 2. Tính Gini của cả 891 hành khách (342 người sống): G = 1 − p(sống)² − p(mất)².',
        'Tính Gini của nhóm nam (577 người, 109 người sống) và nhóm nữ (314 người, 233 người sống).',
        'Tính Gini sau khi chia: trung bình của hai nhóm, có trọng số theo số người.',
      ],
      record: {
        cols: ['Gini'],
        rows: [
          { label: 'Cả 891 hành khách', values: [0.473] },
          { label: 'Nhóm nam', values: [0.306] },
          { label: 'Nhóm nữ', values: [0.383] },
          { label: 'Sau khi chia theo giới tính', values: [0.333] },
        ],
        tol: [0.003],
      },
      explain: {
        q: 'Gini giảm từ 0,473 xuống 0,333 sau khi hỏi giới tính. Con số "mức giảm" này dùng để làm gì?',
        answer: 'Để so các câu hỏi với nhau: câu hỏi nào làm Gini giảm nhiều nhất thì "tách" tốt nhất. Cây thử mọi câu hỏi có thể và chọn câu có Gini sau khi chia nhỏ nhất. Gini lớn nhất (0,5) khi nhóm chia đôi 50/50 và bằng 0 khi cả nhóm cùng một kết cục.',
      },
    },
    {
      id: 'chia',
      step: 'tinh-tay',
      title: 'Tìm câu hỏi gốc tốt nhất',
      predict: {
        q: 'Trên 713 hành khách của tập huấn luyện, đặc trưng nào cho câu hỏi gốc tốt nhất (Gini sau khi chia nhỏ nhất)?',
        options: ['Tuổi', 'Giới tính', 'Giá vé'],
        answer: 1,
        why: 'Giới tính: 0,341. Hạng vé: 0,425 (≤ 2,5). Giá vé: 0,434 (≤ 10,825 bảng). Tuổi: 0,464 (≤ 6,5 tuổi). Giới tính thắng xa.',
      },
      tasks: [
        'Với <b>Tuổi</b> (mặc định), bấm <b>Chọn ngưỡng tốt nhất</b>: ghi ngưỡng và Gini sau khi chia.',
        'Kéo thanh ngưỡng tuổi qua lại: Gini sau khi chia thay đổi thế nào? Có ngưỡng "18 tuổi" tốt hơn không?',
        'Đọc bảng bên phải: ghi Gini tốt nhất của <b>Giới tính</b> và <b>Giá vé</b>.',
      ],
      record: {
        cols: ['Gini sau khi chia'],
        rows: [
          { label: 'Tuổi (ngưỡng tốt nhất)', values: [0.4645] },
          { label: 'Giới tính', values: [0.3409] },
          { label: 'Giá vé', values: [0.4335] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'Câu hỏi tuổi tốt nhất là "≤ 6,5 tuổi?", không phải "≤ 18 tuổi?". Điều đó nói gì về cách cây "suy nghĩ"?',
        answer: 'Cây không biết khái niệm "trẻ em" hay "người lớn". Nó chỉ thử mọi ngưỡng giữa hai tuổi liên tiếp và chọn ngưỡng làm Gini giảm nhiều nhất. Nhóm dưới 6,5 tuổi rất nhỏ (39 người) nhưng 69% sống sót, khác hẳn phần còn lại — nên tách được nhiều nhất. Nó tìm ra quy luật "trẻ nhỏ được cứu trước" từ số liệu, nhưng với một ngưỡng mà con người sẽ không đặt.',
      },
    },
    {
      id: 'dosau',
      step: 'danh-gia',
      title: 'Cây càng sâu càng tốt?',
      predict: {
        q: 'Tăng độ sâu tối đa từ 3 lên 12. Độ chính xác trên tập test thay đổi thế nào?',
        options: ['Tăng đều theo độ sâu', 'Giảm, dù độ chính xác huấn luyện tăng', 'Không đổi'],
        answer: 1,
        why: 'Huấn luyện tăng từ 82,3% lên 94,4%, nhưng test giảm từ 86,0% xuống 81,5%. Cây sâu tạo những lá cho từng nhóm vài người: học thuộc dữ liệu chứ không học quy luật.',
      },
      tasks: [
        'Đặt độ sâu 1, 3 và 4: ghi độ chính xác huấn luyện và test.',
        'Nhìn biểu đồ (độ sâu 1–12): từ độ sâu nào đường test bắt đầu đi xuống?',
        'Chọn một hành khách trong danh sách, theo đường đi của họ qua cây. Lời giải thích của cây có hợp lý không?',
      ],
      record: {
        cols: ['Huấn luyện (%)', 'Test (%)'],
        rows: [
          { label: 'Độ sâu 1', values: [78, 81.5] },
          { label: 'Độ sâu 3', values: [82.3, 86] },
          { label: 'Độ sâu 4', values: [83.3, 86] },
        ],
        tol: [0.06, 0.06],
      },
      explain: {
        q: 'Ở độ sâu 1, độ chính xác test (81,5%) lại cao hơn huấn luyện (78,0%). Có phải mô hình "giỏi hơn" trên dữ liệu mới?',
        answer: 'Không. Cây độ sâu 1 chỉ có một quy tắc: "nữ thì sống, nam thì mất". Quy tắc này tình cờ đúng với tỷ lệ cao hơn ở 178 người của tập test. Với tập nhỏ như vậy, mỗi người là 0,56 điểm — chênh 3,5 điểm chỉ là khoảng 6 người. Đừng đọc quá nhiều vào một lần chia; cross-validation (chương 8) cho con số ổn định hơn.',
      },
    },
    {
      id: 'rung',
      step: 'danh-gia',
      title: 'Rừng cây và cây nối tiếp',
      predict: {
        q: 'Rừng 100 cây (mỗi cây sâu 8) so với một cây sâu 8 trên tập test?',
        options: ['Tốt hơn rất nhiều, trên 95%', 'Nhỉnh hơn một chút', 'Kém hơn'],
        answer: 1,
        why: 'Rừng 83,7%, một cây 83,1% — hơn đúng một hành khách. Gradient Boosting 150 vòng đạt 86,0%. Trên dữ liệu nhỏ, ít đặc trưng như Titanic, các mô hình mạnh không bỏ xa nhau nhiều.',
      },
      tasks: [
        'Đừng bấm "Trồng lại rừng khác" vội. Kéo "Số cây" về 1 và 100: ghi độ chính xác.',
        'Kéo "Số vòng" của boosting về 10 và 150: ghi độ chính xác và xem mất mát huấn luyện giảm.',
        'Giờ bấm "Trồng lại rừng khác" vài lần: kết quả với 100 cây dao động trong khoảng nào?',
      ],
      record: {
        cols: ['Độ chính xác test (%)'],
        rows: [
          { label: 'Rừng, 1 cây', values: [76.4] },
          { label: 'Rừng, 100 cây', values: [83.7] },
          { label: 'Boosting, 10 vòng', values: [79.2] },
          { label: 'Boosting, 150 vòng', values: [86] },
        ],
        tol: [0.06],
      },
      explain: {
        q: 'Rừng chỉ hơn một cây sâu đúng một hành khách. Vậy có nên kết luận "rừng không tốt hơn một cây"?',
        answer: 'Chưa nên. Trên 178 người, chênh một người là trong vùng may rủi — nút "Trồng lại rừng khác" cho thấy kết quả dao động vài điểm. Ưu điểm chính của rừng là ổn định: một cây sâu thay đổi hẳn khi đổi vài hành khách, còn trung bình 100 cây thì ít thay đổi. Lợi thế đó rõ hơn trên dữ liệu lớn, nhiều đặc trưng. Muốn so công bằng: cross-validation và nhiều lần chia.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Gini = 0 nghĩa là gì?', options: ['Cả nhóm có cùng một kết cục', 'Nhóm chia đôi 50/50', 'Nhóm không có ai'], answer: 0, why: 'G = 1 − 1² − 0² = 0: chọn ngẫu nhiên hai người, chắc chắn cùng kết cục.' },
    'tinh-tay': { q: 'Vì sao cây chỉ cần thử các ngưỡng nằm giữa hai giá trị liên tiếp khác nhau?', options: ['Vì dịch ngưỡng trong khoảng đó không làm ai đổi nhánh', 'Để chạy nhanh hơn, dù kém chính xác hơn', 'Vì ngưỡng phải là số nguyên'], answer: 0, why: 'Nếu không ai đổi nhánh thì Gini không đổi. Nên với n giá trị khác nhau chỉ có n − 1 ngưỡng đáng thử — và thử hết là tìm được ngưỡng tốt nhất.' },
    'ly-thuyet': { q: 'Random Forest và Gradient Boosting khác nhau cơ bản ở đâu?', options: ['Rừng trồng các cây độc lập rồi bỏ phiếu; boosting trồng nối tiếp, cây sau sửa lỗi của các cây trước', 'Rừng dùng cây nông, boosting dùng cây sâu', 'Không khác nhau'], answer: 0, why: 'Rừng giảm dao động bằng cách lấy trung bình nhiều cây khác nhau. Boosting giảm sai lệch bằng cách cộng dần các cây nhỏ, mỗi cây học phần còn sai.' },
    'ma-nguon': { q: 'export_text(cay, feature_names=F) in ra gì?', options: ['Toàn bộ các câu hỏi của cây dưới dạng chữ', 'Độ chính xác của cây', 'Dữ liệu huấn luyện'], answer: 0, why: 'Đó là ưu điểm lớn của cây: mô hình chính là một danh sách quy tắc "nếu… thì…" mà ai cũng đọc được.' },
  },
  codeTasks: [
    {
      title: 'Bỏ giới hạn độ sâu',
      task: 'Trong <code>cay_titanic.py</code>, đổi <code>max_depth=3</code> thành <code>max_depth=None</code> cho cây đầu tiên. Đoán trước độ chính xác test, và xem <code>export_text</code> in ra dài cỡ nào.',
      answer: 'Cây mọc sâu 22 tầng, 169 lá; đúng 98,3% trên tập huấn luyện nhưng chỉ 75,8% trên tập test — tụt hơn 10 điểm so với cây độ sâu 3 (86,0%). Bản in ra dài hàng trăm dòng: không còn "dễ đọc" nữa.',
      code: `cay = DecisionTreeClassifier(max_depth=None, random_state=0).fit(X[~te], y[~te])
print(cay.get_depth(), cay.get_n_leaves(), cay.score(X[te], y[te]))`,
    },
    {
      title: 'Bỏ đặc trưng "quan trọng thứ hai"',
      task: 'Rừng xếp giá vé là đặc trưng quan trọng thứ hai. Bỏ cột giá vé (<code>X = np.delete(X, 3, axis=1)</code>, đặt ngay sau dòng tạo X) rồi chạy lại rừng. Đoán trước: độ chính xác giảm bao nhiêu?',
      answer: 'Không giảm — còn nhích từ 83,7% lên 84,3%. Giá vé có nhiều giá trị khác nhau nên có nhiều ngưỡng để thử, dễ được cây chọn, và "mức quan trọng" của rừng đếm điều đó. Thông tin của giá vé phần lớn đã có trong hạng vé. Mức quan trọng dựa trên Gini là gợi ý, không phải bằng chứng.',
      code: `X = np.delete(X, 3, axis=1)   # bỏ cột giá vé
F = [f for f in F if f != "fare"]`,
    },
    {
      title: 'Chọn độ sâu bằng cross-validation',
      task: 'Dùng <code>cross_val_score</code> (5 phần) trên tập huấn luyện để chọn <code>max_depth</code> từ 1 đến 10.',
      hint: '<code>from sklearn.model_selection import cross_val_score</code>',
      answer: 'Điểm cross-validation tăng từ 78,0% (độ sâu 1) lên cao nhất 81,1% ở độ sâu 6, rồi giảm dần về 78,7% ở độ sâu 10 — đúng hình chữ U ngược của bias–variance. Lưu ý: độ sâu tốt nhất theo cross-validation (6) khác với độ sâu đẹp nhất trên tập test (3–4): tập test nhỏ dễ đánh lừa.',
      code: `from sklearn.model_selection import cross_val_score
for md in range(1, 11):
    print(md, round(cross_val_score(DecisionTreeClassifier(max_depth=md, random_state=0), X[~te], y[~te], cv=5).mean(), 3))`,
    },
  ],
  quiz: [
    { q: 'Một nút có 30 người sống và 10 người mất. Gini của nút bằng bao nhiêu?', options: ['0,25', '0,375', '0,5'], answer: 1, why: 'G = 1 − (30/40)² − (10/40)² = 1 − 0,5625 − 0,0625 = 0,375.' },
    { q: 'Vì sao Random Forest chỉ cho mỗi nút xét vài đặc trưng ngẫu nhiên?', options: ['Để chạy nhanh hơn', 'Để các cây khác nhau hơn, nhờ đó bỏ phiếu triệt tiêu được lỗi', 'Vì các đặc trưng khác không quan trọng'], answer: 1, why: 'Nếu cây nào cũng được xét mọi đặc trưng, chúng sẽ đều hỏi "giới tính?" trước và giống nhau, nên trung bình chẳng giúp gì.' },
    { q: 'Trong Gradient Boosting, cây thứ m học cái gì?', options: ['Nhãn y gốc', 'Phần sai y − p của tổng các cây trước', 'Một mẫu bootstrap ngẫu nhiên'], answer: 1, why: 'Mỗi cây mới sửa phần sai còn lại. Vì vậy các cây phải được trồng tuần tự, không song song như Random Forest.' },
    { q: 'Vận dụng: ngân hàng phải giải thích cho khách vì sao hồ sơ vay bị từ chối. Mô hình nào phù hợp nhất?', options: ['Một cây quyết định nông', 'Rừng 500 cây', 'Gradient Boosting 1.000 vòng'], answer: 0, why: 'Một cây nông là một chuỗi câu hỏi đọc được: "thu nhập ≤ X và nợ > Y thì từ chối". Rừng và boosting thường chính xác hơn nhưng khó giải thích từng quyết định.' },
    { q: 'Vận dụng: cây độ sâu 10 đạt 92% trên train, 82% trên test; cây độ sâu 3 đạt 82% trên train, 86% trên test. Chọn cây nào?', options: ['Độ sâu 10, vì độ chính xác huấn luyện cao hơn', 'Độ sâu 3: đơn giản hơn, test cao hơn, khoảng cách train–test nhỏ', 'Không chọn được'], answer: 1, why: 'Khoảng cách 10 điểm giữa train và test là dấu hiệu học thuộc. Cây nông vừa tốt hơn trên dữ liệu mới vừa dễ giải thích. (Tốt nhất là xác nhận bằng cross-validation.)' },
  ],
  takeaways: {
    points: [
      'Cây quyết định là chuỗi câu hỏi có/không. Ở mỗi nút, nó <b>thử mọi đặc trưng và mọi ngưỡng</b>, chọn câu làm <b>Gini sau khi chia</b> nhỏ nhất.',
      '<b>Gini</b> đo độ lẫn lộn: 0 khi thuần một kết cục, 0,5 khi chia đôi. Nhánh 19% sống "sạch" hơn nhánh 74% sống.',
      'Cây quá sâu <b>học thuộc</b>: huấn luyện 94%, test 81%. Luôn giới hạn độ sâu và chọn nó bằng cross-validation.',
      '<b>Random Forest</b>: nhiều cây khác nhau bỏ phiếu → ổn định hơn. <b>Gradient Boosting</b>: cây nhỏ nối tiếp sửa lỗi → thường chính xác nhất.',
      '<b>Mức quan trọng</b> của đặc trưng là gợi ý, không phải bằng chứng: bỏ giá vé — đặc trưng "quan trọng thứ hai" — không làm mô hình kém đi.',
    ],
    use: [
      'Cần giải thích từng quyết định bằng quy tắc đọc được (cây nông)',
      'Dữ liệu dạng bảng, trộn cột số và cột phân loại, không cần chuẩn hoá',
      'Muốn độ chính xác cao trên dữ liệu bảng: Gradient Boosting thường là lựa chọn hàng đầu',
    ],
    avoid: [
      'Dữ liệu ảnh, âm thanh, văn bản dài: mạng nơ-ron phù hợp hơn (chương 9–11)',
      'Cần dự đoán mượt theo đặc trưng liên tục, hoặc ngoại suy ra ngoài vùng dữ liệu: cây chỉ cho các bậc thang',
      'Dùng một cây rất sâu làm mô hình cuối cùng',
    ],
    next: { text: 'Cây chia không gian thành các hộp chữ nhật. Chương 6 trở lại với một đường thẳng, nhưng chọn nó theo cách khác: đường cách xa những ca khó nhất — SVM.', slug: 'svm', title: 'Chương 6: SVM' },
  },
  challenges: [
    {
      level: 1,
      title: 'Gini của câu hỏi giá vé',
      task: 'Câu hỏi "giá vé ≤ 10,825 bảng?" chia 713 hành khách thành: nhánh trái 284 người (224 mất, 60 sống), nhánh phải 429 người (212 mất, 217 sống). Tính Gini từng nhánh và Gini sau khi chia. So với giới tính (0,341).',
      answer: 'Trái: 1 − (60/284)² − (224/284)² ≈ 1 − 0,045 − 0,622 = 0,333. Phải: 1 − (217/429)² − (212/429)² ≈ 1 − 0,256 − 0,244 = 0,500 — gần như chia đôi. Sau khi chia: (284/713) × 0,333 + (429/713) × 0,500 ≈ 0,133 + 0,301 = 0,434. Kém xa giới tính (0,341): nhánh vé đắt vẫn lẫn lộn hoàn toàn.',
    },
    {
      level: 2,
      title: 'Đọc cây độ sâu 3',
      task: 'Chạy <code>cay_titanic.py</code> và đọc phần <code>export_text</code>. Viết lại cây thành 3–4 câu tiếng Việt kiểu "Nếu… thì…". Quy tắc nào bất ngờ nhất?',
      answer: 'Cây bắt đầu bằng giới tính. Với nam: nếu ≤ 13 tuổi và đi cùng ít người thân (≤ 3) thì sống — 16/16 bé trai như vậy sống sót; nhưng bé trai trong gia đình đông người (> 3 người thân) thì 13/14 không qua khỏi. Nam trên 13 tuổi: dự đoán mất (hạng 1 vẫn có 36% sống, hạng 2–3 chỉ 11%). Với nữ: hạng 1–2 gần như đều sống (132/140). Nữ hạng 3: vé ≤ 22,91 bảng thì 56% sống; vé đắt hơn thì 18/21 không qua khỏi. Điều bất ngờ: "gia đình đông" xuất hiện hai lần — trực tiếp qua số người thân, và gián tiếp qua giá vé, vì một vé thường mua chung cho cả gia đình. Gia đình đông khó thoát cùng nhau.',
    },
    {
      level: 3,
      title: 'Mô tả hay quy định?',
      task: 'Mô hình học được rằng "nữ và trẻ em sống sót nhiều hơn". Một người đề xuất dùng cây này để quyết định ai được lên xuồng cứu sinh trước trong một kịch bản cứu hộ ngày nay. Bạn nghĩ sao?',
      hint: 'Phân biệt mô hình <i>mô tả</i> điều đã xảy ra với mô hình dùng để <i>ra quyết định</i>. Ai chịu tác động, và họ có được hỏi ý kiến không?',
      answer: 'Cây mô tả đúng điều đã xảy ra năm 1912 — kết quả của một chuẩn mực xã hội thời đó, cộng với chuyện hạng 3 ở xa boong tàu. Dùng nó để quyết định ngày nay là biến một bất bình đẳng lịch sử (theo giới, theo giàu nghèo — hạng vé) thành quy tắc tự động, không ai chịu trách nhiệm. Bài học chung: một mô hình chính xác về quá khứ không cho ta quyền dùng nó để quyết định tương lai. Trước khi dùng, phải hỏi: đặc trưng nào là thuộc tính được bảo vệ (giới tính, dân tộc…), quyết định ảnh hưởng tới ai, và ai có quyền phản đối.',
    },
  ],
  reflect: [
    'Gini của nhánh 19% sống lại nhỏ hơn nhánh 74% sống. Điều đó thay đổi cách bạn hiểu chữ "sạch" thế nào?',
    'Giải thích cho một người bạn vì sao cây quá sâu lại dự đoán kém hơn trên dữ liệu mới.',
    'Trong cuộc sống, bạn đã gặp "cây quyết định" nào (quy trình tư vấn, chẩn đoán, tuyển sinh…)? Nó có những câu hỏi gì?',
  ],
};
