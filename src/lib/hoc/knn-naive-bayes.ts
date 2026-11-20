/**
 * Phần trải nghiệm của chương 4 (KNN và Naive Bayes). Số liệu lấy từ ml-core (knnPredict, nbTrain,
 * nbScore, nbFromCounts) trên iris.json và sms.json; số dùng scikit-learn ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const knnNbLearn: LessonLearn = {
  slug: 'knn-naive-bayes',
  minutes: 60,
  goals: [
    { text: 'Giải thích KNN phân loại thế nào, và vì sao dự đoán thay đổi theo k.', see: 'truc-giac' },
    { text: 'Tính khoảng cách Euclid và đếm phiếu của k láng giềng.', see: 'tinh-tay' },
    { text: '"Huấn luyện" Naive Bayes bằng cách đếm, tính P(từ | lớp) với làm mịn Laplace và cộng log xác suất.', see: 'ly-thuyet' },
    { text: 'Chọn k hợp lý và đánh giá bộ lọc rác bằng số tin chặn nhầm, số tin lọt qua.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Vì sao phải chuẩn hoá đặc trưng trước khi dùng một mô hình dựa trên khoảng cách?', options: ['Để cột có thang đo lớn không lấn át các cột khác', 'Để có ít dòng hơn', 'Để các lớp cân bằng'], answer: 0, why: 'Chương 3B: khoảng cách cộng chênh lệch của mọi cột, nên cột tính bằng hàng nghìn sẽ quyết định gần như tất cả.' },
    { q: 'Chỉ 13% tin nhắn là tin rác. Mô hình "luôn nói tin thường" có độ chính xác bao nhiêu?', options: ['Khoảng 13%', 'Khoảng 87%', '50%'], answer: 1, why: 'Chương 2: đoán lớp đông luôn đúng với 87% tin. Vì vậy phải nhìn số tin rác lọt qua và số tin thường bị chặn nhầm.' },
  ],
  missions: [
    {
      id: 'knn',
      step: 'truc-giac',
      title: 'Hỏi k bông hoa gần nhất',
      predict: {
        q: 'Bông hoa mới có cánh dài 4,9 cm, rộng 1,6 cm. Với k = 5, năm láng giềng gần nhất bỏ phiếu thế nào?',
        options: ['5 phiếu versicolor', '3 versicolor, 2 virginica', '3 virginica, 2 versicolor'],
        answer: 1,
        why: 'Ba bông versicolor cách 0,1; 0,1 và 0,141 cm; hai bông virginica cách 0,2 cm. Đa số thắng: versicolor. Hoa mới nằm đúng vùng chồng lấn giữa hai loài.',
      },
      tasks: [
        'Giữ hoa mới ở (4,9; 1,6) và k = 5: ghi số phiếu từng loài. Bấm vào khoảng cách của một láng giềng để xem phép tính.',
        'Bấm vào đồ thị rồi nhấn phím <b>→</b> một lần để dời hoa sang (5,0; 1,6). Thử k = 1, 5, 9, 15 và ghi số phiếu ở k = 9.',
        'Bật <b>Tô vùng quyết định</b>: so ranh giới khi k = 1 và k = 25.',
      ],
      record: {
        cols: ['Phiếu versicolor', 'Phiếu virginica'],
        rows: [
          { label: '(4,9; 1,6), k = 5', values: [3, 2] },
          { label: '(5,0; 1,6), k = 9', values: [4, 5] },
        ],
        tol: [0.5, 0.5],
      },
      explain: {
        q: 'Ở (5,0; 1,6), dự đoán là versicolor với k = 1, virginica với k = 9, rồi lại versicolor với k = 15. Vì sao nó lật qua lật lại?',
        answer: 'Điểm này nằm ngay trong vùng chồng lấn: tăng k là mở rộng vòng tròn, và mỗi bông mới lọt vào vòng có thể nghiêng cán cân về loài này hay loài kia. Khi kết quả nhạy với k như vậy, mô hình thực ra đang nói "tôi không chắc". k nhỏ cho ranh giới lởm chởm, theo sát từng bông (dễ học thuộc); k lớn cho ranh giới mượt, nhưng k quá lớn thì loài đông hơn lấn át.',
      },
    },
    {
      id: 'nbtay',
      step: 'tinh-tay',
      title: 'Naive Bayes học từ 6 tin nhắn',
      predict: {
        q: 'Mô hình học từ 6 tin, rồi chấm câu "Call now for your free prize". Hai từ "free" và "prize" đóng góp gì vào điểm số?',
        options: ['Kéo mạnh về phía spam', 'Không gì cả — chúng chưa từng xuất hiện trong 6 tin', 'Kéo về phía tin thường'],
        answer: 1,
        why: 'Từ chưa có trong từ điển bị bỏ qua. Chỉ "call" và "now" được tính, và chúng đủ để đẩy P(spam) lên 78,3%. Dấu hiệu rác kinh điển "free" bị mù hoàn toàn vì dữ liệu quá ít.',
      },
      tasks: [
        'Với câu mẫu đầu tiên, đọc bảng: từ nào được dùng, từ nào bị bỏ qua? Ghi tổng điểm của hai lớp và P(spam).',
        'Bấm vào từ <b>call</b> để xem P(call | spam) và P(call | thường) được tính ra sao.',
        'Chọn câu "Please call me later": mô hình kết luận gì? Từ nào kéo về phía tin thường?',
      ],
      record: {
        cols: ['Tổng điểm spam', 'Tổng điểm thường', 'P(spam) (%)'],
        rows: [
          { label: 'Call now for your free prize', values: [-6.802, -8.086, 78.3] },
          { label: 'Please call me later', values: [-14.991, -14.786, 44.9] },
        ],
        tol: [0.0006, 0.0006, 0.06],
      },
      explain: {
        q: '"Call" xuất hiện 3 lần trong tin rác và 1 lần trong tin thường, nhưng câu "Please call me later" vẫn được xếp vào tin thường. Vì sao?',
        answer: 'Mỗi từ là một bằng chứng, và các bằng chứng được cộng lại (dưới dạng log). "call" kéo về spam, nhưng "me" và "later" chỉ xuất hiện trong tin thường nên kéo mạnh về phía ngược lại, đủ để lật kết quả (44,9% spam). Đó là sức mạnh của Naive Bayes: nhìn tổng thể mọi từ, không chỉ một từ khoá. Và đó cũng là điểm yếu với 6 tin: mô hình chỉ biết 37 từ.',
      },
    },
    {
      id: 'chonk',
      step: 'danh-gia',
      title: 'Chọn k cho KNN',
      predict: {
        q: 'Với k = 1, độ chính xác trên tập huấn luyện và tập test sẽ thế nào?',
        options: ['Huấn luyện gần 100%, test thấp hơn hẳn', 'Hai con số gần bằng nhau', 'Test cao hơn huấn luyện'],
        answer: 0,
        why: 'Huấn luyện 99,2%, test 90,0%. Mỗi bông huấn luyện là láng giềng gần nhất của chính nó, nên con số huấn luyện gần như vô nghĩa. Với k = 5, test lên 96,7%.',
      },
      tasks: [
        'Kéo "Xem k" về 1: ghi độ chính xác huấn luyện và test.',
        'Kéo tới k = 5 và k = 20, ghi lại.',
        'Đường test lên xuống từng bậc khoảng 3,3 điểm. Vì sao?',
      ],
      record: {
        cols: ['Huấn luyện (%)', 'Test (%)'],
        rows: [
          { label: 'k = 1', values: [99.2, 90] },
          { label: 'k = 5', values: [96.7, 96.7] },
          { label: 'k = 20', values: [97.5, 90] },
        ],
        tol: [0.06, 0.06],
      },
      explain: {
        q: 'Vì sao k = 1 không đạt đúng 100% trên tập huấn luyện? Và vì sao không nên chọn k chỉ dựa vào đường test này?',
        answer: 'Có hai bông khác loài trùng hệt số đo cánh hoa (4,8 cm; 1,8 cm): khoảng cách bằng 0, nên một trong hai bị "láng giềng" khác loài trả lời. Còn đường test: tập test chỉ có 30 bông, mỗi bông sai làm mất 3,3 điểm, nên chênh lệch giữa k = 5 và k = 7 chỉ là một bông — rất có thể là may rủi. Hơn nữa, chọn k nhìn vào tập test là dùng tập test để huấn luyện. Cách đúng: cross-validation trên tập huấn luyện (chương 8).',
      },
    },
    {
      id: 'loc',
      step: 'danh-gia',
      title: 'Bộ lọc thư rác trên 1.114 tin',
      predict: {
        q: 'Trên 1.114 tin của tập test, khoảng bao nhiêu tin thường bị chặn nhầm?',
        options: ['Khoảng 5', 'Khoảng 50', 'Khoảng 150'],
        answer: 0,
        why: 'Chỉ 5 tin thường bị chặn nhầm và 8 tin rác lọt qua: độ chính xác 98,83%, chỉ với cách đếm từ.',
      },
      tasks: [
        'Đọc độ chính xác, số tin thường bị chặn nhầm và số tin rác lọt qua.',
        'Gõ "Are you free for dinner tonight?" — một tin thường có chữ "free". P(spam) là bao nhiêu? Những từ nào kéo về phía tin thường?',
        'Đọc danh sách tin bị đoán sai. Vì sao chúng khó?',
      ],
      record: {
        cols: ['Giá trị'],
        rows: [
          { label: 'Độ chính xác (%)', values: [98.83] },
          { label: 'Tin thường bị chặn nhầm', values: [5] },
          { label: 'Tin rác lọt qua', values: [8] },
        ],
        tol: [0.006],
      },
      explain: {
        q: 'Chặn nhầm một tin thường hay để lọt một tin rác — lỗi nào đắt hơn với người dùng? Bạn sẽ chỉnh bộ lọc thế nào?',
        answer: 'Thường chặn nhầm đắt hơn: một tin hẹn phỏng vấn bị vào thư mục rác có thể gây hại thật, còn một tin quảng cáo lọt qua chỉ gây phiền. Vì vậy bộ lọc thật thường chỉ chặn khi rất chắc chắn, ví dụ P(spam) ≥ 0,9 thay vì 0,5 — chấp nhận lọt thêm vài tin rác để gần như không chặn nhầm. "Are you free for dinner tonight?" chỉ có 1,0% spam: "dinner", "tonight", "you" kéo mạnh về tin thường, át được chữ "free".',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'KNN "học" gì trong bước huấn luyện?', options: ['Không học gì: chỉ lưu lại toàn bộ dữ liệu', 'Một đường thẳng', 'Trọng số cho từng đặc trưng'], answer: 0, why: 'Toàn bộ dữ liệu huấn luyện chính là mô hình. Mọi việc tính toán dồn vào lúc dự đoán.' },
    'tinh-tay': { q: 'Khoảng cách Euclid giữa (4,9; 1,6) và (5,1; 1,6) là bao nhiêu?', options: ['0,2', '0,04', '1,6'], answer: 0, why: '√((5,1 − 4,9)² + (1,6 − 1,6)²) = √0,04 = 0,2.' },
    'ly-thuyet': { q: 'Lớp spam có tổng 23 từ, từ điển có 37 từ, và "call" xuất hiện 3 lần trong tin rác. P(call | spam) với α = 1 bằng bao nhiêu?', options: ['3/23', '4/60', '3/60'], answer: 1, why: '(3 + 1)/(23 + 37) = 4/60 ≈ 0,0667. Đó là số lab ở bước 4 hiển thị.' },
    'ma-nguon': { q: 'Trong knn_iris.py, dòng nào thực hiện việc "bỏ phiếu"?', options: ['np.bincount(y[tr][gan], minlength=3)', 'np.argsort(dist, kind="stable")', 'np.sqrt(((X[tr] - q) ** 2).sum(axis=1))'], answer: 0, why: 'bincount đếm số láng giềng thuộc mỗi loài; argmax chọn loài nhiều phiếu nhất.' },
  },
  codeTasks: [
    {
      title: 'Đổi k',
      task: 'Trong <code>knn_iris.py</code>, đổi dòng tính <code>pred</code> thành <code>knn(q, k=1)</code>, rồi <code>knn(q, k=15)</code>. Độ chính xác test thay đổi thế nào?',
      answer: 'k = 1: 90,0%. k = 5 (mặc định): 96,7%. k = 15: 93,3% — khớp với lab chọn k ở bước 7.',
    },
    {
      title: 'Một cột đổi sang milimét',
      task: 'Ngay sau dòng tạo <code>X</code>, thêm <code>X[:, 0] *= 10</code> (chiều dài tính bằng mm, chiều rộng vẫn cm). Chạy lại với k = 5. Đoán trước: độ chính xác tăng hay giảm?',
      answer: 'Giảm từ 96,7% xuống 93,3%. Chiều dài giờ lớn gấp 10 lần nên gần như một mình quyết định khoảng cách; chiều rộng — đặc trưng giúp tách versicolor và virginica — bị lu mờ. Đó là lý do phải chuẩn hoá trước KNN.',
      code: `X[:, 0] *= 10   # chiều dài: cm → mm`,
    },
    {
      title: 'Thử tin nhắn của bạn',
      task: 'Trong <code>naive_bayes_sms.py</code>, thêm vài câu vào danh sách <code>tin</code>, ví dụ "Are you free for dinner tonight?" và "URGENT! Your account has been selected for a cash reward". Đoán trước xác suất spam.',
      answer: 'Câu hẹn ăn tối có xác suất spam thấp (khoảng 1%) dù có chữ "free"; câu "URGENT … cash reward" gần như chắc chắn là spam vì toàn từ đặc trưng của tin rác. Con số của scikit-learn có thể lệch chút ít so với lab vì cách tách từ khác nhau.',
      code: `tin = ["Are you free for dinner tonight?",
       "URGENT! Your account has been selected for a cash reward"]`,
    },
  ],
  quiz: [
    { q: 'KNN với k = 1 đạt gần 100% độ chính xác trên tập huấn luyện. Điều này nói lên gì?', options: ['Mô hình hoàn hảo', 'Gần như không nói lên gì: mỗi điểm huấn luyện là láng giềng gần nhất của chính nó', 'Nên dùng k = 1 cho mọi bài toán'], answer: 1, why: 'Khoảng cách từ một điểm tới chính nó bằng 0. Muốn biết mô hình tốt đến đâu, phải đo trên dữ liệu nó chưa thấy.' },
    { q: 'Vì sao Naive Bayes cộng log xác suất thay vì nhân xác suất?', options: ['Vì cộng nhanh hơn nhân', 'Vì tích của nhiều số nhỏ bị làm tròn về 0 trên máy tính', 'Vì log làm mô hình chính xác hơn'], answer: 1, why: 'Một tin 30 từ cho tích của 30 xác suất cỡ 0,001, tức khoảng 10⁻⁹⁰ — dễ tràn về 0. Log biến tích thành tổng các số âm vừa phải.' },
    { q: 'Một từ chưa bao giờ xuất hiện trong tin thường. Không có làm mịn Laplace, điều gì xảy ra?', options: ['Từ đó bị bỏ qua', 'P(từ | thường) = 0, nên mọi tin chứa từ đó đều bị coi là rác', 'Mô hình báo lỗi'], answer: 1, why: 'log 0 = −∞ kéo tổng điểm của lớp "thường" về âm vô cùng, bất kể các từ khác nói gì.' },
    { q: 'Vận dụng: bạn dùng KNN dự đoán giá căn hộ từ diện tích (30–300 m²) và số phòng ngủ (1–6). Vấn đề là gì?', options: ['Không có vấn đề gì', 'Diện tích áp đảo khoảng cách, số phòng ngủ gần như vô nghĩa — cần chuẩn hoá', 'KNN không dùng được để dự đoán con số'], answer: 1, why: 'Chênh 1 phòng ngủ chỉ bằng chênh 1 m² diện tích. Chuẩn hoá đưa hai cột về cùng thang đo. (KNN dùng được cho hồi quy: lấy trung bình giá của k láng giềng.)' },
    { q: 'Vận dụng: bộ lọc học từ tin nhắn tiếng Anh nhận một tin tiếng Việt không dấu "Chuc mung ban da trung thuong". Kết quả đáng tin không?', options: ['Đáng tin, mô hình đạt 98,8%', 'Không: gần hết các từ chưa từng gặp nên bị bỏ qua; kết quả dựa vào vài từ tình cờ trùng và tỷ lệ lớp', 'Mô hình báo lỗi'], answer: 1, why: 'Mô hình không biết điều nó không biết: nó vẫn trả về một con số, nhưng con số đó không dựa trên bằng chứng. Đây là một dạng lệch phân phối (chương 3A).' },
  ],
  takeaways: {
    points: [
      '<b>KNN</b> không học gì: gặp điểm mới thì hỏi k điểm cũ gần nhất và để chúng bỏ phiếu. k nhỏ: ranh giới lởm chởm, dễ học thuộc; k lớn: mượt hơn nhưng có thể quá chung chung.',
      'KNN dựa trên khoảng cách nên <b>phải cùng thang đo</b>: đổi một cột sang mm làm độ chính xác tụt từ 96,7% xuống 93,3%.',
      '<b>Naive Bayes</b> "học" bằng cách đếm và dự đoán bằng cách cộng log xác suất của từng từ. Giả định các từ độc lập là sai, nhưng mô hình vẫn rất tốt (98,8% trên tin nhắn).',
      '<b>Làm mịn Laplace</b> tránh xác suất bằng 0. Từ chưa từng gặp bị bỏ qua — mô hình chỉ biết những gì có trong dữ liệu.',
      'Với dữ liệu lệch lớp, hãy nhìn <b>số chặn nhầm và số lọt qua</b>, không chỉ độ chính xác.',
    ],
    use: [
      'KNN: ít đặc trưng, dữ liệu vừa phải, ranh giới phức tạp khó mô tả bằng công thức',
      'Naive Bayes: phân loại văn bản, cần mô hình rất nhanh, ít dữ liệu',
      'Cả hai: làm mốc so sánh nhanh trước khi thử mô hình phức tạp',
    ],
    avoid: [
      'KNN với hàng trăm đặc trưng: "lời nguyền số chiều" làm mọi điểm xa nhau như nhau',
      'KNN với hàng triệu điểm mà cần dự đoán nhanh: mỗi lần dự đoán phải đo khoảng cách tới tất cả',
      'Naive Bayes khi cần xác suất chính xác: giả định độc lập làm xác suất quá tự tin (gần 0 hoặc 1)',
    ],
    next: { text: 'KNN và Naive Bayes đều khó giải thích "vì sao" bằng một câu. Chương 5 học một mô hình trả lời đúng câu đó: cây quyết định — một chuỗi câu hỏi có/không.', slug: 'cay-quyet-dinh', title: 'Chương 5: Cây quyết định và tập hợp' },
  },
  challenges: [
    {
      level: 1,
      title: 'Bỏ phiếu bằng tay',
      task: 'Hoa mới ở (4,9; 1,6). Năm bông gần nhất trong tập huấn luyện: #52 (4,9; 1,5) versicolor; #72 (4,9; 1,5) versicolor; #77 (5,0; 1,7) versicolor; #123 (4,9; 1,8) virginica; #127 (4,9; 1,8) virginica. Tính khoảng cách tới từng bông, rồi cho biết dự đoán với k = 3 và k = 5.',
      answer: '#52 và #72: √(0² + 0,1²) = 0,1. #77: √(0,1² + 0,1²) ≈ 0,141. #123 và #127: √(0² + 0,2²) = 0,2. k = 3: ba bông versicolor → versicolor. k = 5: 3 versicolor, 2 virginica → vẫn versicolor, nhưng sát nút hơn.',
    },
    {
      level: 2,
      title: 'Chọn k bằng cross-validation',
      task: 'Trong <code>knn_iris.py</code>, dùng <code>KNeighborsClassifier</code> và <code>cross_val_score</code> (5 phần) trên <b>tập huấn luyện</b> để chọn k trong 1, 3, …, 25. Rồi đo k tốt nhất trên tập test một lần duy nhất.',
      hint: '<code>from sklearn.neighbors import KNeighborsClassifier</code>; <code>from sklearn.model_selection import cross_val_score</code>.',
      answer: 'Cross-validation cho k = 1 thấp nhất (94,2%), các k từ 3 đến 25 đều trong khoảng 95–97,5%, cao nhất là k = 11 (97,5%). Trên tập test, k = 11 đạt 93,3% — thấp hơn k = 5 (96,7%) mà ta "chọn" bằng cách nhìn tập test. Con số 93,3% mới là ước lượng trung thực; 96,7% là kết quả của việc nhìn trộm.',
      code: `from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score
diem = {k: cross_val_score(KNeighborsClassifier(k), X[tr], y[tr], cv=5).mean() for k in range(1, 26, 2)}
k_tot = max(diem, key=diem.get)
print(k_tot, round(diem[k_tot], 3), KNeighborsClassifier(k_tot).fit(X[tr], y[tr]).score(X[~tr], y[~tr]))`,
    },
    {
      level: 3,
      title: 'Giả định "ngây thơ" sai đến đâu?',
      task: 'Naive Bayes giả định các từ độc lập với nhau khi đã biết lớp. Nêu một ví dụ giả định này sai rõ rệt trong tin nhắn. Vì sao mô hình vẫn phân loại tốt? Khi nào giả định này gây hại thật?',
      hint: 'Nghĩ tới những cụm từ luôn đi cùng nhau, và tới sự khác nhau giữa "đoán đúng lớp" với "đưa ra xác suất đúng".',
      answer: 'Ví dụ: "free" và "prize", hay "call" và "now", thường đi cùng nhau trong tin rác. Mô hình đếm chúng như hai bằng chứng độc lập, nên đếm trùng và trở nên quá tự tin (xác suất 99,99999%). Nhưng để phân loại, chỉ cần biết lớp nào có điểm cao hơn, và việc đếm trùng thường đẩy cả hai lớp theo cùng một hướng nên thứ tự ít bị đảo. Giả định gây hại khi ta dùng chính con số xác suất — ví dụ để đặt ngưỡng 0,9 hay để so rủi ro — hoặc khi các từ tương quan mạnh kéo về hai phía khác nhau. Khi đó cần hiệu chỉnh xác suất hoặc dùng hồi quy logistic (chương 2).',
    },
  ],
  reflect: [
    'KNN và Naive Bayes không dùng Gradient Descent. Điều đó làm bạn nghĩ lại thế nào về câu hỏi "máy học là gì"?',
    'Giải thích cho một người bạn vì sao bộ lọc học từ 6 tin nhắn lại bỏ qua chữ "free".',
    'Nếu xây bộ lọc tin nhắn rác tiếng Việt, bạn sẽ gặp những khó khăn gì mà bộ dữ liệu tiếng Anh này không có?',
  ],
};
