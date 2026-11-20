/**
 * Phần trải nghiệm của chương 8 (Đánh giá mô hình). Số liệu lấy từ ml-core (crossValPoly, polyFit, mseOf,
 * logisticRegressionGD, rocCurve, confusion); số dùng scikit-learn ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const evalLearn: LessonLearn = {
  slug: 'danh-gia-mo-hinh',
  minutes: 60,
  goals: [
    { text: 'Chạy cross-validation K phần và đọc được từng con số của từng phần.', see: 'tinh-tay' },
    { text: 'Phân biệt ba tập huấn luyện, kiểm định, test; biết vì sao không chọn mô hình theo tập test.', see: 'ly-thuyet' },
    { text: 'Nhận ra bias cao và variance cao qua MSE huấn luyện, MSE cross-validation và độ toả của mô hình.', see: 'danh-gia' },
    { text: 'Đọc đường ROC, giải thích AUC bằng lời thường, và biết khi nào AUC chưa đủ.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Hạ ngưỡng phân loại từ 0,5 xuống 0,2 thường làm gì?', options: ['Bắt thêm ca dương, nhưng báo nhầm nhiều hơn', 'Giảm cả hai loại sai', 'Không đổi gì'], answer: 0, why: 'Chương 2: ngưỡng đổi loại sai này lấy loại sai kia.' },
    { q: 'Chọn k của KNN bằng cách nhìn độ chính xác trên tập test có vấn đề gì?', options: ['Tập test đã bị dùng để chọn, nên điểm test không còn trung thực', 'Không có vấn đề', 'Chạy chậm'], answer: 0, why: 'Chương 4: con số đo trên tập đã dùng để chọn luôn lạc quan hơn thực tế.' },
  ],
  missions: [
    {
      id: 'cv',
      step: 'tinh-tay',
      title: 'Cross-validation 5 phần',
      predict: {
        q: 'Với đa thức bậc 9, MSE của 5 phần cross-validation sẽ thế nào?',
        options: ['Đều nhau, khoảng 0,7', 'Bốn phần quanh 0,5–1, nhưng một phần lên tới hàng chục nghìn', 'Phần nào cũng rất lớn'],
        answer: 1,
        why: 'Phần 5 có MSE 19.957, bốn phần còn lại 0,53–0,98. Trung bình bị kéo lên 3.992. Với bậc 3, phần 5 chỉ 0,527 và trung bình 0,723.',
      },
      tasks: [
        'Với bậc 3 (mặc định), ghi MSE của phần 5 và MSE trung bình.',
        'Kéo bậc lên 9: ghi lại hai con số đó.',
        'Bấm vào phần 5: thu nhập lớn nhất của phần bị giấu là bao nhiêu? Nhìn đường cong ở vùng thu nhập 12–15.',
      ],
      record: {
        cols: ['Bậc 3', 'Bậc 9'],
        rows: [
          { label: 'MSE phần 5', values: [0.5266, 19957] },
          { label: 'MSE trung bình 5 phần', values: [0.723, 3992] },
        ],
        tol: [0.0006, 0.6],
      },
      explain: {
        q: 'Vì sao chỉ có phần 5 "nổ tung" với bậc 9?',
        answer: 'Phần 5 chứa khu vực thu nhập 15,0001 — khu vực duy nhất trên 12,1 trong cả tập huấn luyện. Khi phần 5 bị giấu, mô hình chỉ thấy thu nhập tới 12,04, rồi phải đoán ở 15: đó là ngoại suy. Đa thức bậc 9 uốn lượn mạnh ngoài vùng có dữ liệu nên dự đoán vọt lên hàng trăm. Đa thức bậc 3 cứng hơn nên ngoại suy ôn hoà. Cross-validation phát hiện được vì nó buộc mô hình đối mặt với tình huống "chưa từng thấy" ở nhiều chỗ khác nhau.',
      },
    },
    {
      id: 'biasvar',
      step: 'danh-gia',
      title: 'Bias và variance',
      predict: {
        q: 'Theo MSE trên tập test, bậc đa thức nào (từ 1 đến 10) là tốt nhất?',
        options: ['Bậc 1', 'Bậc 4', 'Bậc 9'],
        answer: 2,
        why: 'Bậc 9 có MSE test thấp nhất (0,7090), nhỉnh hơn bậc 4 (0,7128). Nhưng cross-validation của bậc 9 là 3.992 — một mô hình rất bất ổn. Chọn theo tập test sẽ chọn nhầm mô hình nguy hiểm nhất. Cross-validation chọn bậc 4 (0,7198).',
      },
      tasks: [
        'Kéo bậc về 1, 4 và 9: ghi MSE huấn luyện và MSE test ở dòng chú thích dưới hình.',
        'Ở mỗi bậc, nhìn 20 đường mờ (mỗi đường học trên một mẫu bootstrap): chúng toả rộng nhất ở bậc nào, ở vùng thu nhập nào?',
        'Đọc bảng MSE theo bậc: bậc nào có CV nhỏ nhất?',
      ],
      record: {
        cols: ['MSE huấn luyện', 'MSE test'],
        rows: [
          { label: 'Bậc 1', values: [0.7223, 0.7515] },
          { label: 'Bậc 4', values: [0.6998, 0.7128] },
          { label: 'Bậc 9', values: [0.6731, 0.709] },
        ],
        tol: [0.0006, 0.0006],
      },
      explain: {
        q: 'Theo tập test, bậc 9 tốt nhất. Theo cross-validation, bậc 4. Bạn tin bên nào, và vì sao?',
        answer: 'Tin cross-validation. Tập test chỉ có 80 khu vực, và mọi khu vực đó đều nằm trong vùng đã có dữ liệu huấn luyện, nên nó không thử thách được điểm yếu của bậc 9: ngoại suy. Cross-validation lặp 5 lần trên 320 khu vực, mỗi lần giấu một vùng khác nhau, nên lộ ra rằng bậc 9 có variance khổng lồ — 20 đường mờ toả tung ở vùng thu nhập cao. Còn MSE huấn luyện luôn giảm khi bậc tăng: nó không bao giờ dùng để chọn mô hình.',
      },
    },
    {
      id: 'roc',
      step: 'danh-gia',
      title: 'Đường ROC và AUC',
      predict: {
        q: 'Mô hình B chỉ dùng độ nhám, bỏ bán kính. AUC của B so với A (dùng cả hai) thế nào?',
        options: ['Gần bằng A', 'Thấp hơn rõ rệt', 'Cao hơn A'],
        answer: 1,
        why: 'A: 0,9217. B: 0,7068. Bán kính mang gần hết thông tin: chỉ dùng bán kính đã đạt AUC 0,9205.',
      },
      tasks: [
        'Ghi AUC của mô hình A và B.',
        'Kéo ngưỡng của A về 0,5 rồi 0,2: ghi TPR và FPR. Điểm đánh dấu chạy trên đường ROC theo hướng nào?',
        'Kéo ngưỡng xuống 0,1: TPR có tăng thêm không? FPR thì sao?',
      ],
      record: {
        cols: ['TPR (%)', 'FPR (%)'],
        rows: [
          { label: 'Ngưỡng 0,5', values: [85, 5] },
          { label: 'Ngưỡng 0,2', values: [90, 21] },
        ],
        tol: [0.6, 0.6],
      },
      explain: {
        q: 'Giải thích "AUC = 0,92" bằng lời thường. Vì sao nó hữu ích để so A với B, và nó không trả lời được câu hỏi gì?',
        answer: 'Chọn ngẫu nhiên một ca ác tính và một ca lành tính: có 92% khả năng mô hình A cho ca ác tính điểm cao hơn. AUC không phụ thuộc ngưỡng, nên so được hai mô hình trước khi phải quyết định ngưỡng. Nhưng AUC không cho biết nên chọn ngưỡng nào — điều đó phụ thuộc cái giá của bỏ sót và báo nhầm (chương 2). Và hai mô hình có thể có AUC gần nhau nhưng đường ROC cắt nhau: mô hình này tốt hơn ở vùng FPR thấp, mô hình kia ở vùng FPR cao.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Học sinh học thuộc đáp án của đúng 20 bài tập trong sách, gặp đề mới thì lúng túng. Đó là hình ảnh của gì?', options: ['Variance cao — quá khớp', 'Bias cao — quá đơn giản', 'Nhiễu không giảm được'], answer: 0, why: 'Khớp hoàn hảo dữ liệu đã thấy nhưng không tổng quát hoá. Còn "luôn chọn đáp án dài nhất" là bias cao: sai đều ở mọi đề.' },
    'tinh-tay': { q: 'Cross-validation 5 phần trên 320 khu vực: mỗi lần mô hình học trên bao nhiêu khu vực?', options: ['64', '256', '320'], answer: 1, why: 'Mỗi phần 64 khu vực; học trên 4 phần = 256, chấm trên phần còn lại = 64. Lặp 5 lần để phần nào cũng được làm phần kiểm định một lần.' },
    'ly-thuyet': { q: 'Trong phân tích bias–variance, thành phần nào không mô hình nào giảm được?', options: ['Nhiễu σ²', 'Bias²', 'Variance'], answer: 0, why: 'Giá nhà phụ thuộc nhiều thứ ngoài thu nhập. Phần đó là nhiễu đối với mô hình chỉ dùng thu nhập.' },
    'ma-nguon': { q: 'Vì sao đặt StandardScaler vào trong pipeline?', options: ['Để ở mỗi lần chia, chuẩn hoá chỉ học từ các phần huấn luyện', 'Để chạy nhanh hơn', 'Vì PolynomialFeatures bắt buộc'], answer: 0, why: 'Nếu chuẩn hoá trên cả 320 khu vực trước khi chia, phần kiểm định đã góp vào trung bình và độ lệch chuẩn: rò rỉ (chương 3B).' },
  },
  codeTasks: [
    {
      title: 'Thêm bậc 4 và bậc 6',
      task: 'Trong <code>danh_gia.py</code>, đổi <code>for d in (1, 3, 6, 9)</code> thành <code>(1, 3, 4, 6, 9)</code>. Bậc nào có MSE trung bình thấp nhất? Phần nào luôn "có chuyện"?',
      answer: 'Bậc 4 thấp nhất (0,720), sát bậc 3 (0,723). Bậc 6 đã lên 20,8 và bậc 9 lên 3.992 — luôn do phần 5, phần chứa khu vực thu nhập 15,0001. Các con số trùng với lab ở bước 4 vì <code>KFold(5)</code> không xáo trộn chia phần đúng như lab.',
    },
    {
      title: 'Xáo trộn trước khi chia',
      task: 'Đổi <code>cv=KFold(5)</code> thành <code>cv=KFold(5, shuffle=True, random_state=0)</code>. Kết quả bậc 9 thay đổi thế nào? Bậc tốt nhất có đổi không?',
      answer: 'Bậc 9: trung bình còn 38,8 thay vì 3.992 — vẫn tệ, nhưng mức tệ phụ thuộc điểm 15,0001 rơi vào phần nào và nó đi cùng những điểm nào. Bậc tốt nhất đổi thành bậc 3 (0,716). Bài học: điểm CV cũng dao động theo cách chia; với dữ liệu nhỏ, nên lặp lại CV vài lần với các cách xáo trộn khác nhau.',
      code: `cv = KFold(5, shuffle=True, random_state=0)`,
    },
    {
      title: 'AUC của từng đặc trưng',
      task: 'Ở phần ung thư vú, tính AUC khi chỉ dùng độ nhám (<code>Xc[:, [1]]</code>) và khi chỉ dùng bán kính (<code>Xc[:, [0]]</code>).',
      answer: 'Chỉ độ nhám: 0,7068 — khớp mô hình B của lab. Chỉ bán kính: 0,9205, gần bằng cả hai đặc trưng (0,9217). Độ nhám thêm gần như không gì khi đã có bán kính.',
      code: `for cot in ([1], [0]):
    p = LogisticRegression().fit(Xc[~m][:, cot], yc[~m]).predict_proba(Xc[m][:, cot])[:, 1]
    print(cot, round(roc_auc_score(yc[m], p), 4))`,
    },
  ],
  quiz: [
    { q: 'Mô hình có MSE huấn luyện rất thấp nhưng MSE cross-validation rất cao. Đó là dấu hiệu của gì?', options: ['Bias cao', 'Variance cao (quá khớp)', 'Dữ liệu quá ít nhiễu'], answer: 1, why: 'Khớp rất tốt dữ liệu đã thấy nhưng dự đoán kém trên dữ liệu chưa thấy: mô hình đã học thuộc.' },
    { q: 'Bạn chuẩn hoá toàn bộ 400 khu vực rồi mới chia 5 phần cho cross-validation. Có vấn đề gì?', options: ['Không có vấn đề', 'Thông tin của phần kiểm định đã lọt vào bước chuẩn hoá', 'Chuẩn hoá làm sai giá trị y'], answer: 1, why: 'Mọi bước học từ dữ liệu phải được làm lại bên trong mỗi lần chia. Dùng pipeline.' },
    { q: 'Mô hình A có AUC 0,92, mô hình B có AUC 0,75. Điều nào chắc chắn đúng?', options: ['A có độ chính xác cao hơn B ở ngưỡng 0,5', 'A nhìn chung xếp hạng ca dương trên ca âm tốt hơn B', 'A tốt hơn B ở mọi ngưỡng'], answer: 1, why: 'AUC đo khả năng xếp hạng tổng thể. Ở một ngưỡng cụ thể, hoặc ở một vùng của đường ROC, B vẫn có thể tốt hơn.' },
    { q: 'Vận dụng: bạn thử 50 bộ siêu tham số, chọn bộ có điểm cross-validation cao nhất, rồi báo cáo luôn điểm đó. Vấn đề là gì?', options: ['Không có vấn đề', 'Điểm của bộ được chọn lạc quan, vì chính nó đã dùng để chọn — cần một tập test giữ riêng, hoặc cross-validation lồng nhau', 'Không được dùng cross-validation để chọn siêu tham số'], answer: 1, why: 'Thử 50 lần thì bộ tốt nhất phần nào thắng nhờ may. Con số báo cáo phải đến từ dữ liệu chưa tham gia vào việc chọn.' },
    { q: 'Vận dụng: hai mô hình sàng lọc có AUC 0,90 và 0,88. Bệnh viện chỉ chấp nhận tỷ lệ báo nhầm dưới 5%. Chọn thế nào?', options: ['Luôn chọn mô hình AUC 0,90', 'So hai đường ROC ở vùng FPR dưới 5%: mô hình AUC thấp hơn vẫn có thể tốt hơn ở đó', 'Chọn ngẫu nhiên vì chênh lệch nhỏ'], answer: 1, why: 'AUC tính trên toàn bộ dải FPR từ 0 đến 1. Khi chỉ một vùng quan trọng, hãy so đúng vùng đó.' },
  ],
  takeaways: {
    points: [
      'Ba tập, ba việc: <b>huấn luyện</b> để học, <b>kiểm định</b> để chọn, <b>test</b> để báo cáo một lần duy nhất.',
      '<b>Cross-validation</b> lặp việc chia nhiều lần, nên lộ ra những điểm yếu mà một tập test nhỏ không thấy (bậc 9: test 0,709, CV 3.992).',
      '<b>Bias cao</b>: sai đều, cả huấn luyện lẫn kiểm định. <b>Variance cao</b>: khớp huấn luyện, toả tung khi dữ liệu đổi. MSE huấn luyện luôn giảm khi mô hình phức tạp hơn — đừng dùng nó để chọn.',
      '<b>Ngoại suy</b> là nơi mô hình phức tạp nguy hiểm nhất: đa thức bậc 9 đoán giá 6,05 ở vùng không có dữ liệu.',
      '<b>AUC</b> = xác suất mô hình xếp ca dương trên ca âm. Dùng để so mô hình; còn chọn ngưỡng thì phải dựa vào cái giá của sai lầm.',
    ],
    use: [
      'Cross-validation: mọi lần chọn siêu tham số (bậc, k, C, độ sâu…)',
      'ROC/AUC: so các mô hình phân loại trước khi chọn ngưỡng',
      'Đường học và bias–variance: quyết định nên làm mô hình đơn giản hơn hay phức tạp hơn',
    ],
    avoid: [
      'Dữ liệu theo thời gian hoặc theo nhóm: K-fold ngẫu nhiên không đủ — chia theo thời gian, theo nhóm (chương 3B)',
      'Lớp rất lệch (1% ca dương): AUC có thể đẹp mà độ chuẩn vẫn tệ — xem thêm đường precision–recall',
      'Báo cáo điểm cross-validation của bộ siêu tham số đã được chọn bằng chính nó',
    ],
    next: { text: 'Đến đây bạn đã có đủ công cụ để huấn luyện và đánh giá trung thực. Chương 9 bước vào mô hình mạnh nhất của học máy hiện đại: mạng nơ-ron.', slug: 'mang-no-ron', title: 'Chương 9: Mạng nơ-ron' },
  },
  challenges: [
    {
      level: 1,
      title: 'Tính AUC bằng tay',
      task: 'Sáu bệnh nhân: ba ca ác tính có điểm 0,9; 0,6; 0,4 và ba ca lành tính có điểm 0,7; 0,3; 0,2. Tính AUC bằng cách đếm: trong 9 cặp (ác, lành), bao nhiêu cặp ca ác tính có điểm cao hơn?',
      answer: '0,9 cao hơn cả 3 ca lành (3 cặp). 0,6 cao hơn 0,3 và 0,2 (2 cặp), thua 0,7. 0,4 cao hơn 0,3 và 0,2 (2 cặp). Tổng 7/9 ≈ 0,778. Chỉ ca lành 0,7 "chen" lên trên hai ca ác — chính nó kéo AUC xuống.',
    },
    {
      level: 2,
      title: 'Lặp lại cross-validation',
      task: 'Viết vòng lặp chạy <code>KFold(5, shuffle=True, random_state=s)</code> với s = 0…9 cho bậc 3 và bậc 4, in trung bình và độ lệch chuẩn của 10 điểm CV. Hai bậc có thật sự khác nhau không?',
      hint: 'Gom điểm trung bình của mỗi lần lặp vào một danh sách, rồi dùng <code>np.mean</code> và <code>np.std</code>.',
      answer: 'Bậc 3: 0,7211 ± 0,0080. Bậc 4: 0,7271 ± 0,0106. Hai bậc chênh nhau 0,006 — nhỏ hơn cả độ lệch chuẩn giữa các lần xáo trộn (với một lần xáo trộn, bậc 4 có thể thắng, lần khác lại thua). Kết luận trung thực: bậc 3 và bậc 4 tốt như nhau với dữ liệu này — nên chọn bậc 3 vì đơn giản hơn. Một con số CV duy nhất có thể đánh lừa khi chênh lệch nhỏ.',
      code: `for d in (3, 4):
    diem = []
    for s in range(10):
        mo_hinh = make_pipeline(StandardScaler(), PolynomialFeatures(d), LinearRegression())
        diem.append(-cross_val_score(mo_hinh, X, y, cv=KFold(5, shuffle=True, random_state=s), scoring="neg_mean_squared_error").mean())
    print(d, round(np.mean(diem), 4), "±", round(np.std(diem), 4))`,
    },
    {
      level: 3,
      title: 'Viết lại một báo cáo "95%"',
      task: 'Đồng nghiệp gửi báo cáo một dòng: "Mô hình đạt độ chính xác 95%." Liệt kê những câu hỏi bạn sẽ hỏi lại, rồi viết khung một báo cáo đánh giá trung thực.',
      hint: 'Đo trên tập nào? So với mốc nào? Dao động bao nhiêu? Đúng với nhóm nào, sai với nhóm nào? Ngưỡng nào?',
      answer: 'Câu hỏi: 95% trên tập nào (train, kiểm định, test giữ riêng)? Tập test đã bị dùng để chọn gì chưa? Mốc "luôn đoán lớp đông" đạt bao nhiêu? Lớp có lệch không — độ nhạy, độ chuẩn, AUC là bao nhiêu? Dao động giữa các lần chia bao nhiêu? Tập test có giống nơi dùng thật không? Kết quả từng nhóm (vùng, giới, độ tuổi)? Khung báo cáo tốt: (1) mô hình và dữ liệu; (2) cách chia và vì sao; (3) điểm cross-validation trung bình ± độ lệch chuẩn; (4) điểm test giữ riêng, đo một lần; (5) so với mốc đơn giản; (6) ma trận nhầm lẫn ở ngưỡng đã chọn và lý do chọn ngưỡng; (7) kết quả theo nhóm; (8) giới hạn đã biết — ví dụ "chưa thử ở vùng thu nhập trên 12".',
    },
  ],
  reflect: [
    'Trước bài này, bạn có tin một con số "độ chính xác trên tập test" không? Giờ bạn sẽ hỏi thêm những gì?',
    'Giải thích bias và variance cho một người bạn bằng ví dụ học sinh ôn thi.',
    'Trong các chương trước, có con số nào bạn từng tin mà giờ thấy nên kiểm tra lại bằng cross-validation?',
  ],
};
