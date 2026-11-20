/**
 * Phần trải nghiệm của chương 9 (Mạng nơ-ron). Số liệu lấy từ ml-core (tinyPass, tinyUpdate, initMLP,
 * mlpEpoch) đúng như các lab; số của ô mã NumPy chạy lại bằng NumPy và ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const nnLearn: LessonLearn = {
  slug: 'mang-no-ron',
  minutes: 75,
  goals: [
    { text: 'Giải thích một nơ-ron làm gì, và vì sao mạng cần hàm kích hoạt phi tuyến.', see: 'truc-giac' },
    { text: 'Lần theo lan truyền xuôi và lan truyền ngược trên một mạng nhỏ, từng con số một.', see: 'tinh-tay' },
    { text: 'Viết được công thức δ ở đầu ra (p − y) và cách nó đi lùi qua từng tầng.', see: 'ly-thuyet' },
    { text: 'Huấn luyện mạng nhận dạng chữ số, đọc đường học, và nhận ra tốc độ học hỏng.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Trong hồi quy logistic, gradient của mất mát theo trọng số wⱼ là gì?', options: ['(p − y)·xⱼ', 'p(1 − p)', '−ln p'], answer: 0, why: 'Chương 2. Ở chương này, đúng đại lượng p − y sẽ là điểm xuất phát của lan truyền ngược.' },
    { q: 'Quy tắc dây chuyền: nếu L phụ thuộc u và u phụ thuộc w, thì dL/dw bằng gì?', options: ['(dL/du) · (du/dw)', '(dL/du) + (du/dw)', 'dL/du'], answer: 0, why: 'Lan truyền ngược chỉ là quy tắc dây chuyền, áp dụng lặp lại từ tầng cuối về tầng đầu.' },
  ],
  missions: [
    {
      id: 'lantruyen',
      step: 'tinh-tay',
      title: 'Lan truyền ngược trên mạng 2 → 3 → 1',
      predict: {
        q: 'Bạn cập nhật trọng số 6 lần, chỉ dựa trên bệnh nhân 1 (ác tính). Mất mát của bệnh nhân 4 (lành tính) sẽ thế nào?',
        options: ['Giảm theo', 'Tăng lên', 'Không đổi'],
        answer: 1,
        why: 'Mất mát của bệnh nhân 1 giảm từ 0,505 xuống 0,127, nhưng của bệnh nhân 4 tăng gấp đôi, từ 0,816 lên 1,652. Mạng chỉ "nghe" một người nên chỉnh trọng số theo hướng có lợi cho người đó — và có hại cho người khác. Đó là lý do mỗi bước cập nhật dùng gradient trung bình trên cả một lô.',
      },
      tasks: [
        'Chọn bệnh nhân 4 (lành tính), ghi "Mất mát hiện tại". Quay về bệnh nhân 1, ghi mất mát, rồi bấm tiến từng bước qua pha xuôi và pha ngược.',
        'Bấm <b>Áp dụng cập nhật</b> 6 lần (vẫn bệnh nhân 1). Ghi mất mát hiện tại sau lần thứ 6.',
        'Đổi sang bệnh nhân 4, <b>không</b> bấm "Về trọng số ban đầu". Ghi mất mát.',
      ],
      record: {
        cols: ['Mất mát'],
        rows: [
          { label: 'Bệnh nhân 4, trọng số ban đầu', values: [0.8161] },
          { label: 'Bệnh nhân 1, trọng số ban đầu', values: [0.5053] },
          { label: 'Bệnh nhân 1, sau 6 lần cập nhật', values: [0.1268] },
          { label: 'Bệnh nhân 4, sau 6 lần cập nhật cho bệnh nhân 1', values: [1.6522] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'Ở pha ngược, gradient của một trọng số tầng đầu là tích của bốn thừa số. Đó là những thừa số nào, và vì sao lại là tích?',
        answer: 'δ ở đầu ra (p − y) × trọng số v nối nơ-ron ẩn tới đầu ra × đạo hàm của tanh tại nơ-ron ẩn (1 − a²) × đầu vào x. Đó là quy tắc dây chuyền: mất mát phụ thuộc p, p phụ thuộc tổng ở đầu ra, tổng đó phụ thuộc a qua v, a phụ thuộc z qua tanh, z phụ thuộc trọng số qua x. Mỗi mắt xích đóng góp một thừa số. Nếu một thừa số gần 0 (tanh bão hoà, hoặc v rất nhỏ), trọng số đó gần như không học — đó là gốc của "gradient biến mất".',
      },
    },
    {
      id: 'huanluyen',
      step: 'danh-gia',
      title: 'Huấn luyện mạng nhận dạng chữ số',
      predict: {
        q: 'Mạng 64 → 32 → 10 huấn luyện 15 epoch với η = 0,1. Độ chính xác trên 360 ảnh test khoảng bao nhiêu?',
        options: ['Khoảng 60%', 'Khoảng 96%', '100%'],
        answer: 1,
        why: '95,8% (huấn luyện 97,1%). Sau epoch đầu tiên mới chỉ 57%; sau 5 epoch là 90%. Toàn bộ quá trình chạy trong trình duyệt của bạn, vài giây.',
      },
      tasks: [
        'Bấm <b>Huấn luyện 15 epoch</b> ngay khi mở lab (η = 0,1). Ghi độ chính xác huấn luyện và test.',
        'Xem ma trận nhầm lẫn và các ảnh bị đoán sai: chữ số nào hay bị nhầm với nhau? Tự vẽ một chữ số vào ô vẽ.',
        'Bấm <b>Khởi tạo lại</b>, chọn η = 2, huấn luyện 15 epoch và ghi lại. Rồi thử lại với η = 0,01.',
      ],
      record: {
        cols: ['Huấn luyện (%)', 'Test (%)'],
        rows: [
          { label: 'η = 0,1, sau 15 epoch', values: [97.1, 95.8] },
          { label: 'η = 2, sau 15 epoch', values: [10.6, 8.3] },
        ],
        tol: [0.06, 0.06],
      },
      explain: {
        q: 'Với η = 2, độ chính xác tụt về khoảng 10% — bằng đoán bừa một trong 10 chữ số — và mất mát kẹt quanh 2,32. Chuyện gì đã xảy ra bên trong mạng?',
        answer: 'Bước quá lớn đẩy trọng số văng xa ngay vài bước đầu. Nhiều nơ-ron ReLU nhận z âm với mọi ảnh, nên "chết": đầu ra 0, gradient 0, không bao giờ hồi phục. Mạng còn lại chỉ đoán gần như một lớp cho mọi ảnh, với xác suất đều nhau — mất mát ≈ ln 10 ≈ 2,30, đúng mức "không biết gì" của 10 lớp. Với η = 0,01 thì ngược lại: mạng học được nhưng rất chậm, sau 15 epoch mới khoảng 85%. Giống hệt quả bóng ở chương 0, chỉ là trên một mặt mất mát có hàng nghìn chiều.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Bỏ hết hàm kích hoạt khỏi một mạng nhiều tầng. Mạng còn làm được gì hơn hồi quy tuyến tính?', options: ['Không: tích của các phép tuyến tính vẫn là tuyến tính', 'Có: nhiều tầng thì mạnh hơn', 'Tuỳ số nơ-ron'], answer: 0, why: 'W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂): vẫn là một phép tuyến tính. Các "khúc gập" của hàm kích hoạt mới tạo ra sức mạnh.' },
    'tinh-tay': { q: 'δ ở đầu ra bằng −0,4. Nơ-ron ẩn h có đầu ra a = 0,5 và nối tới đầu ra bằng trọng số v. ∂L/∂v bằng bao nhiêu?', options: ['−0,2', '−0,4', '0,5'], answer: 0, why: '∂L/∂v = δ × a = −0,4 × 0,5 = −0,2. Âm nên v sẽ tăng.' },
    'ly-thuyet': { q: 'Một epoch trên 1.437 ảnh, mỗi lô 32 ảnh, có khoảng bao nhiêu bước cập nhật?', options: ['1', '45', '1.437'], answer: 1, why: '1.437/32 ≈ 45 lô, mỗi lô một bước. Nhiều bước nhỏ, hơi nhiễu, thường học nhanh hơn một bước lớn trên toàn bộ dữ liệu.' },
    'ma-nguon': { q: 'Trong mã NumPy, dòng nào là lan truyền ngược qua ReLU?', options: ['g1 = (g2 @ W2) * (z1 > 0)', 'a1 = np.maximum(0, z1)', 'p /= p.sum(1, keepdims=True)'], answer: 0, why: 'g2 @ W2 đưa δ lùi một tầng; nhân với (z1 > 0) là nhân với đạo hàm của ReLU: 1 nếu z > 0, ngược lại 0.' },
  },
  codeTasks: [
    {
      title: 'Bao nhiêu nơ-ron ẩn là đủ?',
      task: 'Đổi <code>H = 32</code> thành <code>H = 8</code>, chạy, rồi thử <code>H = 128</code>. So độ chính xác test ở epoch 15.',
      answer: 'H = 8: khoảng 93,3%. H = 32: khoảng 97,5%. H = 128: khoảng 96,9%. Từ 8 lên 32 nơ-ron giúp rõ rệt; từ 32 lên 128 không thêm gì với bộ dữ liệu nhỏ này — mạng lớn hơn không tự động tốt hơn.',
    },
    {
      title: 'Khởi tạo mọi trọng số bằng 0',
      task: 'Thêm <code>W1[:] = 0; W2[:] = 0</code> ngay sau dòng khởi tạo W2, rồi chạy. Đoán trước: mạng học được không?',
      answer: 'Không: độ chính xác kẹt quanh 8–9%. Với ReLU và trọng số 0, mọi nơ-ron ẩn ra 0, nên gradient của W1 và W2 đều bằng 0; chỉ hệ số chặn b2 học được — mạng chỉ biết đoán lớp phổ biến. (Với tanh, các nơ-ron sẽ nhận cùng gradient và mãi mãi giống nhau.) Khởi tạo ngẫu nhiên là để phá vỡ sự đối xứng đó.',
      code: `W1[:] = 0; W2[:] = 0   # thử nghiệm: khởi tạo bằng 0`,
    },
    {
      title: 'Bỏ chuẩn hoá đầu vào',
      task: 'Đổi <code>/ 16.0</code> thành <code>/ 1.0</code> (giữ độ đậm 0–16). Chạy và quan sát độ chính xác qua các epoch.',
      answer: 'Độ chính xác nhảy lung tung trong khoảng 20–45%, không hội tụ. Đầu vào lớn gấp 16 lần làm tổng có trọng số lớn, gradient lớn, và η = 0,1 trở thành quá lớn — đúng bài học chuẩn hoá của chương 1, giờ ở 64 chiều.',
    },
  ],
  quiz: [
    { q: 'Bỏ hết hàm kích hoạt khỏi một mạng 5 tầng. Mạng mới tương đương với gì?', options: ['Một mạng 5 tầng yếu hơn một chút', 'Một mô hình tuyến tính duy nhất', 'Một cây quyết định'], answer: 1, why: 'Tích của các ma trận vẫn là một ma trận. Không có phi tuyến, độ sâu không mang lại gì.' },
    { q: 'Ở tầng đầu ra softmax với cross-entropy, ∂L/∂z bằng gì?', options: ['p − y (y viết dạng one-hot)', 'p(1 − p)', '−ln p'], answer: 0, why: 'Giống hồi quy logistic, đạo hàm của softmax và cross-entropy triệt tiêu nhau thành dạng "dự đoán trừ thật".' },
    { q: 'Một nơ-ron ReLU có z < 0 với mọi ảnh huấn luyện. Điều gì xảy ra với trọng số vào nơ-ron đó?', options: ['Chúng được cập nhật rất nhanh', 'Chúng không bao giờ được cập nhật, vì gradient qua ReLU bằng 0', 'Chúng bị đặt lại ngẫu nhiên'], answer: 1, why: 'Đó là nơ-ron "chết". Tốc độ học quá lớn có thể làm nhiều nơ-ron chết cùng lúc — như thí nghiệm η = 2.' },
    { q: 'Vận dụng: mạng đạt 99,8% trên tập huấn luyện nhưng 88% trên tập test, và khoảng cách tăng dần qua các epoch. Nên làm gì?', options: ['Huấn luyện thêm nhiều epoch', 'Dừng sớm ở epoch có điểm kiểm định cao nhất, thêm điều chuẩn, hoặc thêm dữ liệu', 'Tăng số nơ-ron'], answer: 1, why: 'Khoảng cách train–test tăng dần là quá khớp (chương 8). Huấn luyện thêm hay mạng lớn hơn chỉ làm nặng thêm.' },
    { q: 'Vận dụng: mất mát huấn luyện đứng yên ở khoảng 2,30 từ epoch đầu với bài toán 10 lớp. Nghi ngờ đầu tiên của bạn?', options: ['Mạng đã học xong', 'Mạng không học được gì: đang dự đoán đều 10 lớp (ln 10 ≈ 2,30) — kiểm tra tốc độ học, khởi tạo, chuẩn hoá đầu vào', 'Dữ liệu quá ít'], answer: 1, why: 'Mất mát ln(số lớp) là dấu hiệu "không biết gì". Ba nghi phạm quen thuộc: η quá lớn (nơ-ron chết), khởi tạo bằng 0, đầu vào chưa chuẩn hoá.' },
  ],
  takeaways: {
    points: [
      'Một nơ-ron = tổng có trọng số + <b>hàm kích hoạt</b> phi tuyến. Không có phi tuyến, mạng nhiều tầng chỉ là một mô hình tuyến tính.',
      '<b>Lan truyền ngược</b> là quy tắc dây chuyền áp dụng lặp lại: δ ở đầu ra = p − y, rồi nhân dần các thừa số khi lùi qua từng tầng.',
      'Học trên một mẫu có thể làm hỏng mẫu khác: cập nhật theo bệnh nhân 1 làm mất mát của bệnh nhân 4 tăng gấp đôi. Vì vậy dùng gradient trung bình trên <b>lô</b>.',
      'Mạng 64 → 32 → 10 đạt khoảng 96% sau 15 epoch. <b>Tốc độ học</b> sai làm hỏng tất cả: η = 2 kẹt ở 10%.',
      'Dấu hiệu chẩn đoán: mất mát ≈ ln(số lớp) là "không học gì"; khoảng cách train–test tăng dần là quá khớp.',
    ],
    use: [
      'Dữ liệu thô nhiều chiều mà khó tự thiết kế đặc trưng: ảnh, âm thanh, văn bản',
      'Có nhiều dữ liệu có nhãn và đủ sức tính toán',
      'Quan hệ phức tạp, phi tuyến giữa đầu vào và đầu ra',
    ],
    avoid: [
      'Dữ liệu bảng nhỏ: Gradient Boosting (chương 5) thường tốt hơn và dễ dùng hơn',
      'Cần giải thích rõ từng quyết định: mạng nơ-ron khó giải thích',
      'Rất ít dữ liệu: mạng dễ học thuộc',
    ],
    next: { text: 'Mạng ở chương này coi ảnh là 64 số rời rạc, không biết ô nào nằm cạnh ô nào. Chương 10 thêm hiểu biết đó vào mạng bằng phép tích chập.', slug: 'cnn', title: 'Chương 10: Mạng tích chập (CNN)' },
  },
  challenges: [
    {
      level: 1,
      title: 'Một lần lan truyền xuôi bằng tay',
      task: 'Mạng ở bước 4 có trọng số W1 = [[0,72; −0,36], [1,11; −0,25], [−0,45; 0,79]], b1 = 0, v = (−0,24; −0,20; 0,73), b2 = 0, hàm kích hoạt ẩn tanh, đầu ra sigmoid. Với x = (1; 0), tính z và a của 3 nơ-ron ẩn, rồi p ở đầu ra.',
      hint: 'tanh(0,72) ≈ 0,617; tanh(1,11) ≈ 0,804; tanh(−0,45) ≈ −0,422.',
      answer: 'Với x = (1; 0), z của mỗi nơ-ron ẩn chính là cột đầu của W1: z = (0,72; 1,11; −0,45), nên a = (0,617; 0,804; −0,422). Tổng ở đầu ra: −0,24 × 0,617 − 0,20 × 0,804 + 0,73 × (−0,422) ≈ −0,148 − 0,161 − 0,308 = −0,617. p = σ(−0,617) ≈ 0,350. Mạng nghiêng về "lành tính" cho điểm này.',
    },
    {
      level: 2,
      title: 'Theo dõi khoảng cách train–test',
      task: 'Sửa ô mã để in cả độ chính xác huấn luyện ở mỗi epoch, và chạy 40 epoch thay vì 15. Khoảng cách giữa hai con số có lớn dần không?',
      hint: 'Tính độ chính xác trên <code>X[tr]</code> giống dòng tính trên <code>X[te]</code>.',
      answer: 'Độ chính xác huấn luyện tiến dần tới gần 100%, trong khi test dừng quanh 97% rồi dao động. Khoảng cách lớn dần chậm — dấu hiệu quá khớp nhẹ. Với dữ liệu nhỏ và mạng 32 nơ-ron, mức quá khớp này chấp nhận được; nếu khoảng cách vượt vài điểm, hãy dừng sớm ở epoch có điểm kiểm định cao nhất.',
      code: `acc_tr = ((np.maximum(0, X[tr] @ W1.T + b1) @ W2.T + b2).argmax(1) == Y[tr]).mean()
print(f"epoch {epoch + 1:2d}: huấn luyện {acc_tr:.3f}, test {acc:.3f}")`,
    },
    {
      level: 3,
      title: 'Mạng có "hiểu" chữ số không?',
      task: 'Ở ô vẽ của lab bước 7, vẽ một chữ số lệch hẳn sang một góc, hoặc rất mảnh, hoặc vẽ một hình không phải chữ số. Mạng trả lời thế nào? Điều đó nói gì về cái mạng thực sự học được?',
      hint: 'Mạng đã thấy chữ số ở những vị trí và độ đậm nào? Softmax có cho phép trả lời "không biết" không?',
      answer: 'Chữ số lệch góc hoặc quá mảnh thường bị đoán sai, có khi với độ tự tin rất cao; một hình vô nghĩa vẫn được gán cho một chữ số nào đó. Mạng không học "khái niệm chữ số" mà học các mẫu điểm ảnh của 1.437 ảnh đã căn giữa, chuẩn cỡ. Softmax luôn chia 100% cho 10 lớp, nên không có cách nói "đây không phải chữ số". Đây là lệch phân phối (chương 3A) ở dạng ảnh. CNN ở chương 10 giảm bớt vấn đề vị trí, nhưng không xoá được nó.',
    },
  ],
  reflect: [
    'Điều gì làm bạn bất ngờ hơn: lan truyền ngược chỉ là quy tắc dây chuyền, hay việc học trên một bệnh nhân làm hại bệnh nhân khác?',
    'Giải thích cho một người bạn vì sao mạng nơ-ron cần hàm kích hoạt.',
    'Bạn từng dùng một ứng dụng nào có mạng nơ-ron bên trong? Bạn đoán nó dễ sai trong tình huống nào?',
  ],
};
