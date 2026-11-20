/**
 * Phần trải nghiệm của chương 11 (Chuỗi và Attention). Số liệu lấy từ ml-core (attnForward, nbFromCounts,
 * nbScore) trên attention.json và sms.json; số của ô mã NumPy chạy lại bằng NumPy và ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const attnLearn: LessonLearn = {
  slug: 'attention',
  minutes: 60,
  goals: [
    { text: 'Giải thích self-attention bằng hình ảnh câu hỏi (q), nhãn tên (k) và ghi chú (v).', see: 'truc-giac' },
    { text: 'Tính điểm số s = q·k/√d, softmax theo hàng, và đầu ra là trung bình có trọng số của các v.', see: 'tinh-tay' },
    { text: 'Giải thích vì sao cần mã hoá vị trí và vì sao chia cho √d.', see: 'ly-thuyet' },
    { text: 'So sánh trung thực một mô hình attention với Naive Bayes trên cùng dữ liệu.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Softmax biến một hàng điểm số thành gì?', options: ['Các xác suất dương, cộng lại bằng 1', 'Các số từ −1 đến 1', 'Một số duy nhất'], answer: 0, why: 'Chương 9: softmax lấy mũ rồi chia cho tổng, nên mọi phần tử dương và tổng bằng 1.' },
    { q: 'Naive Bayes coi "call now for free" và "free for now, call" thế nào?', options: ['Giống hệt nhau', 'Khác nhau vì thứ tự từ khác', 'Không chấm được'], answer: 0, why: 'Chương 4: Naive Bayes chỉ đếm từ, không biết thứ tự hay ngữ cảnh. Attention ra đời để khắc phục điều đó.' },
  ],
  missions: [
    {
      id: 'chuy',
      step: 'tinh-tay',
      title: 'Mỗi từ hỏi, mọi từ trả lời',
      predict: {
        q: 'Trong tin rác "You have won ?1,000 cash or a ?2,000 prize! To claim…", từ nào nhận nhiều chú ý nhất (trung bình trên mọi hàng của ma trận A)?',
        options: ['you', 'claim', 'cash'],
        answer: 1,
        why: '"claim" nhận trung bình 71,4% sự chú ý của cả 14 token. Mô hình học cách chú ý rất "gắt": mỗi token dồn gần hết vào một hai token đáng ngờ nhất, và p(spam) gần như 100%.',
      },
      tasks: [
        'Với tin mặc định, nhìn ma trận chú ý A: cột nào đậm nhất? Ghi p(spam). Bấm một ô để xem s = q·k/√d được tính từ hai vector nào.',
        'Bấm mẫu "You have an important customer service…" (đây là tin rác): ghi p(spam). Mô hình chú ý vào đâu?',
        'Gõ "free call now", rồi "now call free": ghi p(spam) của mỗi câu. Cùng ba từ, sao kết quả khác nhau?',
      ],
      record: {
        cols: ['p(spam) (%)'],
        rows: [
          { label: 'You have won ?1,000 cash…', values: [100] },
          { label: 'You have an important customer service…', values: [33.63] },
          { label: 'free call now', values: [58.13] },
          { label: 'now call free', values: [50.08] },
        ],
        tol: [0.006],
      },
      explain: {
        q: 'Tin "important customer service announcement" là tin rác nhưng mô hình chỉ cho 33,6%. Và vì sao đổi thứ tự ba từ lại đổi kết quả?',
        answer: 'Tin này không có từ rác "kinh điển" (free, prize, claim, số điện thoại dài); "customer", "service", "important" cũng xuất hiện trong tin thường. Mô hình nhỏ (d = 8, một tầng) dồn chú ý vào "service" và không đủ bằng chứng. Còn thứ tự: mỗi token được cộng một vector mã hoá vị trí trước khi tính q, k, v, nên "free" ở vị trí 1 và "free" ở vị trí 3 là hai vector khác nhau. Không có mã hoá vị trí, hai câu sẽ cho đúng cùng một xác suất — mô hình sẽ lại là "túi từ" như Naive Bayes.',
      },
    },
    {
      id: 'sosanh',
      step: 'danh-gia',
      title: 'Attention đấu Naive Bayes',
      predict: {
        q: 'Trên 1.114 tin test, mô hình self-attention so với Naive Bayes của chương 4 thế nào?',
        options: ['Attention tốt hơn hẳn', 'Gần như ngang nhau — Naive Bayes còn nhỉnh hơn một chút', 'Attention kém hẳn'],
        answer: 1,
        why: 'Attention 98,38%, Naive Bayes 98,83%. Attention để lọt 14 tin rác, Naive Bayes chỉ 8. Hai mô hình bất đồng ở 15 tin.',
      },
      tasks: [
        'Ghi độ chính xác, số tin rác lọt qua và số tin thường bị chặn của hai mô hình.',
        'Đọc danh sách tin hai mô hình bất đồng: trong những tin đó, mô hình nào đúng nhiều hơn?',
        'Nhìn bản đồ embedding: các từ nghiêng về spam có nằm gần nhau không?',
      ],
      record: {
        cols: ['Độ chính xác (%)', 'Rác lọt qua', 'Thường bị chặn'],
        rows: [
          { label: 'Self-attention', values: [98.38, 14, 4] },
          { label: 'Naive Bayes', values: [98.83, 8, 5] },
        ],
        tol: [0.006, 0.5, 0.5],
      },
      explain: {
        q: 'Mô hình "hiện đại" không thắng được mô hình đếm từ đơn giản. Đó có phải là thất bại không? Bài học là gì?',
        answer: 'Không phải thất bại, mà là một kết quả trung thực. Tin rác trong bộ dữ liệu này nhận ra được chủ yếu nhờ từ vựng, nên ngữ cảnh không thêm được bao nhiêu, còn mô hình attention nhỏ lại có ít dữ liệu để học embedding. Sức mạnh của attention lộ ra khi nghĩa phụ thuộc vào ngữ cảnh và thứ tự (dịch máy, trả lời câu hỏi, câu dài), với rất nhiều dữ liệu và nhiều tầng. Bài học chung của cả khoá: luôn so với một mốc đơn giản, và chọn mô hình theo bài toán, không theo độ "mới".',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Trong hình ảnh buổi họp lớp, "ghi chú" v của mỗi học sinh tương ứng với gì?', options: ['Thông tin mà token đóng góp cho những token chú ý tới nó', 'Câu hỏi của token', 'Nhãn tên dùng để so khớp'], answer: 0, why: 'q dùng để hỏi, k dùng để được so khớp, v là thứ thật sự được truyền đi. Đầu ra của một token là trung bình các v, có trọng số theo mức khớp q·k.' },
    'tinh-tay': { q: 'q = (1; 2), k = (3; 1), d = 2. Điểm số s = q·k/√d bằng bao nhiêu?', options: ['≈ 3,54', '5', '2,5'], answer: 0, why: 'q·k = 1 × 3 + 2 × 1 = 5; √2 ≈ 1,414; 5/1,414 ≈ 3,54.' },
    'ly-thuyet': { q: 'Bỏ mã hoá vị trí. Attention có phân biệt được "dog bites man" với "man bites dog" không?', options: ['Không', 'Có', 'Tuỳ số chiều d'], answer: 0, why: 'Không có thông tin vị trí, đảo thứ tự token chỉ đảo thứ tự các hàng đầu ra; lấy trung bình thì ra cùng một vector.' },
    'ma-nguon': { q: 'Trong attention.py, vì sao trừ S.max(1, keepdims=True) trước khi lấy exp?', options: ['Để tránh tràn số khi điểm số lớn; kết quả softmax không đổi', 'Để A có giá trị âm', 'Để chạy nhanh hơn'], answer: 0, why: 'e^(s − m)/Σe^(s − m) = e^s/Σe^s: trừ cùng một số ở cả tử và mẫu không đổi kết quả, nhưng tránh được e^1000 tràn số.' },
  },
  codeTasks: [
    {
      title: 'Bỏ chia cho √d',
      task: 'Trong <code>attention.py</code>, đổi <code>S = Q @ K.T / np.sqrt(4)</code> thành <code>S = Q @ K.T</code>. Ma trận A thay đổi thế nào?',
      answer: 'A "gắt" hơn: hàng của "now" từ (0,171; 0,558; 0,271) thành (0,071; 0,752; 0,177) — dồn thêm vào chính nó. Với d = 4 thì chênh chưa nhiều, nhưng với d hàng nghìn như trong mô hình lớn, điểm số không chia sẽ lớn tới mức softmax gần như chọn hẳn một token, và gradient qua softmax gần bằng 0.',
    },
    {
      title: 'Đổi thứ tự token',
      task: 'Thêm vào cuối: <code>P = [2, 0, 1]</code>, tính lại A và H với <code>X[P]</code> (đảo thứ tự ba token), rồi so <code>H</code> mới với <code>H[P]</code>.',
      answer: 'Hai ma trận giống hệt nhau: đảo thứ tự đầu vào chỉ đảo thứ tự các hàng đầu ra. Attention tự nó không biết thứ tự — đó là lý do mô hình trên trang phải cộng mã hoá vị trí vào X.',
      code: `P = [2, 0, 1]
Q2, K2, V2 = X[P] @ Wq, X[P] @ Wk, X[P] @ Wv
S2 = Q2 @ K2.T / np.sqrt(4)
A2 = np.exp(S2 - S2.max(1, keepdims=True)); A2 /= A2.sum(1, keepdims=True)
print(np.allclose(A2 @ V2, H[P]))   # True`,
    },
    {
      title: 'Thêm một token',
      task: 'Thêm một hàng thứ tư vào X, ví dụ <code>[2.0, 0.0, 2.0, 0.0]</code> (gấp đôi "call"). Ma trận A giờ có kích thước bao nhiêu? Mỗi hàng còn cộng lại bằng 1 không?',
      answer: 'A có kích thước 4 × 4, mỗi hàng vẫn cộng bằng 1. Các token cũ phải chia sự chú ý cho thêm một token, nên trọng số cũ nhỏ đi. Ma trận chú ý luôn là L × L với L là số token: chi phí tính tăng theo bình phương độ dài câu — lý do các mô hình lớn có giới hạn độ dài ngữ cảnh.',
    },
  ],
  quiz: [
    { q: 'Một tin nhắn có 10 token. Ma trận chú ý A có kích thước bao nhiêu?', options: ['10 × 8', '10 × 10', '8 × 8'], answer: 1, why: 'Mỗi token (hàng) có một trọng số cho mỗi token (cột): 10 × 10. Số chiều d = 8 không xuất hiện trong kích thước của A.' },
    { q: 'Vì sao chia QKᵀ cho √d?', options: ['Để A có tổng bằng 1', 'Để điểm số không quá lớn khiến softmax bão hoà và gradient biến mất', 'Để giảm số tham số'], answer: 1, why: 'Tích vô hướng của hai vector d chiều có độ lớn tăng theo √d. Chia cho √d giữ điểm số ở mức vừa phải.' },
    { q: 'Bỏ mã hoá vị trí, rồi đảo thứ tự các từ trong tin nhắn. Dự đoán của mô hình ở bài này thay đổi thế nào?', options: ['Không đổi', 'Đổi hoàn toàn', 'Chỉ đổi dấu'], answer: 0, why: 'Không có thông tin vị trí, attention chỉ hoán vị các hàng đầu ra; lấy trung bình thì ra cùng một vector h.' },
    { q: 'Vận dụng: câu có 1.000 token thay vì 100. Bộ nhớ cho ma trận chú ý tăng bao nhiêu lần?', options: ['10 lần', '100 lần', '1.000 lần'], answer: 1, why: 'A có L × L phần tử: 1.000² / 100² = 100. Đó là lý do mô hình ngôn ngữ có giới hạn ngữ cảnh, và có nhiều nghiên cứu làm attention rẻ hơn.' },
    { q: 'Vận dụng: bạn cần lọc tin rác tiếng Việt cho một ứng dụng nhỏ, có 2.000 tin đã gán nhãn. Nên bắt đầu bằng gì?', options: ['Huấn luyện một Transformer từ đầu', 'Naive Bayes hoặc hồi quy logistic trên đếm từ làm mốc, rồi mới thử mô hình phức tạp hơn nếu cần', 'Không làm được với 2.000 tin'], answer: 1, why: 'Như kết quả của chương này: với ít dữ liệu và tín hiệu nằm ở từ vựng, mô hình đơn giản rất khó bị đánh bại. Mô hình lớn huấn luyện sẵn (tinh chỉnh) là bước tiếp theo nếu mốc chưa đủ tốt.' },
  ],
  takeaways: {
    points: [
      'Self-attention: mỗi token tạo <b>q</b> (câu hỏi), <b>k</b> (nhãn tên), <b>v</b> (ghi chú). Điểm khớp s = q·k/√d, softmax theo hàng, đầu ra = trung bình có trọng số của các v.',
      'Nhờ đó, cùng một từ có biểu diễn khác nhau tuỳ ngữ cảnh xung quanh.',
      'Attention tự nó không biết thứ tự: phải cộng <b>mã hoá vị trí</b>. Chia cho <b>√d</b> để softmax không bão hoà.',
      'Ma trận chú ý có kích thước L × L: chi phí tăng theo <b>bình phương</b> độ dài câu.',
      'Trên bài lọc tin rác này, attention (98,4%) không thắng Naive Bayes (98,8%). Luôn so với một <b>mốc đơn giản</b>.',
      'Khép lại khoá học: mọi mô hình — từ đường thẳng chương 1 tới attention — đều học bằng cùng một vòng lặp của chương 0: dự đoán, đo sai, tính gradient, bước một bước nhỏ.',
    ],
    use: [
      'Văn bản, chuỗi, nơi nghĩa phụ thuộc vào ngữ cảnh và thứ tự',
      'Khi có rất nhiều dữ liệu, hoặc có mô hình lớn huấn luyện sẵn để tinh chỉnh',
      'Bài toán cần liên hệ giữa các phần xa nhau trong chuỗi',
    ],
    avoid: [
      'Ít dữ liệu và tín hiệu nằm ở từ vựng: mô hình đếm từ đơn giản thường đủ tốt',
      'Chuỗi rất dài mà tài nguyên hạn chế: chi phí L²',
      'Cần giải thích rõ ràng: ma trận chú ý gợi ý mô hình "nhìn" đâu, nhưng không phải lời giải thích đầy đủ',
    ],
  },
  challenges: [
    {
      level: 1,
      title: 'Attention với hai token',
      task: 'Hai token có q₁ = (1; 0), k₁ = (1; 0), k₂ = (0; 1), v₁ = (2; 0), v₂ = (0; 4), d = 2. Tính hàng đầu tiên của A (token 1 chú ý tới token 1 và 2) và đầu ra h₁.',
      hint: 's₁₁ = q₁·k₁/√2, s₁₂ = q₁·k₂/√2. e^0,707 ≈ 2,03.',
      answer: 's₁₁ = 1/1,414 ≈ 0,707; s₁₂ = 0. Softmax: e^0,707 ≈ 2,03 và e⁰ = 1, tổng 3,03 → A₁ = (0,670; 0,330). h₁ = 0,670 × (2; 0) + 0,330 × (0; 4) = (1,34; 1,32). Token 1 "khớp" với chính nó hơn, nhưng vẫn lấy một phần ba thông tin từ token 2.',
    },
    {
      level: 2,
      title: 'Bản đồ chú ý của một câu bạn chọn',
      task: 'Ở lab bước 4, gõ hai câu cùng chứa "free": "Are you free for dinner tonight?" và "Call now for your free prize". So p(spam), và xem ở mỗi câu, các token chú ý vào đâu.',
      answer: 'Câu hẹn ăn tối: p(spam) gần 0% (khoảng 0,001%). Câu "free prize": khoảng 99,9%. Cùng chữ "free", nhưng xung quanh là "dinner", "tonight" hay "call", "prize" quyết định kết quả — đúng điều attention được thiết kế để làm: biểu diễn của một từ phụ thuộc ngữ cảnh. (Naive Bayes cũng phân biệt được hai câu này, nhưng vì cộng bằng chứng từ các từ khác, không phải vì hiểu "free" theo hai nghĩa.)',
    },
    {
      level: 3,
      title: 'Nhìn lại toàn bộ khoá học',
      task: 'Chọn ba mô hình bạn đã học (ví dụ hồi quy logistic, cây quyết định, attention). Với mỗi mô hình, viết: nó học bằng cách nào, nó giỏi ở đâu, nó dễ sai ở đâu. Rồi trả lời: một bài toán bạn quan tâm nên bắt đầu bằng mô hình nào?',
      hint: 'Dùng phần "Bài học rút ra" và "Nên dùng / cân nhắc cách khác" ở bước 8 của mỗi chương.',
      answer: 'Một câu trả lời tốt có dạng bảng ba dòng. Hồi quy logistic: học bằng Gradient Descent trên cross-entropy; giỏi khi ranh giới gần thẳng và cần xác suất, giải thích được; sai khi quan hệ phức tạp. Cây quyết định: học bằng cách chọn câu hỏi giảm Gini nhiều nhất; giỏi với dữ liệu bảng, dễ đọc; sai khi quá sâu (học thuộc). Attention: học bằng lan truyền ngược qua q, k, v; giỏi với chuỗi có ngữ cảnh và nhiều dữ liệu; sai hoặc lãng phí khi dữ liệu ít. Với bài toán của bạn: gần như luôn bắt đầu bằng mô hình đơn giản nhất làm mốc, đánh giá trung thực (chương 8), rồi chỉ tăng độ phức tạp khi con số cho thấy cần.',
    },
  ],
  reflect: [
    'Bạn có bất ngờ khi mô hình attention không thắng Naive Bayes không? Điều đó thay đổi cách bạn nhìn các tin tức về "AI mới nhất" thế nào?',
    'Giải thích self-attention cho một người bạn bằng hình ảnh buổi họp lớp, trong 3–4 câu.',
    'Nhìn lại cả khoá: chương nào thay đổi cách bạn nghĩ về học máy nhiều nhất? Vì sao?',
  ],
};
