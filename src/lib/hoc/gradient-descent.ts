/**
 * Phần trải nghiệm của chương 0 (Gradient Descent). Số liệu lấy từ ml-core (linearRegressionGD, mse)
 * trên 5 khu vực housing.mini; tests/learn.test.ts kiểm tra lại các số trong bảng ghi.
 */
import type { LessonLearn } from '../learn';

export const gdLearn: LessonLearn = {
  slug: 'gradient-descent',
  minutes: 45,
  goals: [
    { text: 'Giải thích mất mát MSE đo điều gì, và vì sao ta bình phương sai số.', see: 'kham-pha' },
    { text: 'Tự làm bằng tay một vòng Gradient Descent: dự đoán → sai số → độ dốc → bước xuống dốc.', see: 'tinh-tay' },
    { text: 'Nhận ra tốc độ học η quá nhỏ, vừa phải và quá lớn qua cách mất mát thay đổi.', see: 'tinh-tay' },
    { text: 'Giải thích vì sao bước tự ngắn lại khi gần đáy, và kiểm tra kết quả bằng nghiệm chính xác.', see: 'ly-thuyet' },
  ],
  warmup: [
    { q: 'Hàm f(w) = w². Đạo hàm f′(w) bằng bao nhiêu?', options: ['w', '2w', 'w²/2'], answer: 1, why: 'Quy tắc lũy thừa: đạo hàm của wⁿ là n·wⁿ⁻¹, nên đạo hàm của w² là 2w.' },
    { q: 'Tại một điểm, đạo hàm f′(w) dương. Điều đó nghĩa là gì?', options: ['Tăng w một chút thì f tăng', 'f đang bằng 0', 'Tăng w một chút thì f giảm'], answer: 0, why: 'Đạo hàm là độ dốc: dương nghĩa là đồ thị đi lên khi sang phải. Muốn f nhỏ đi, phải đi sang trái.' },
  ],
  missions: [
    {
      id: 'tay',
      step: 'truc-giac',
      title: 'Tự làm "máy học" bằng tay',
      predict: {
        q: 'Kéo w từ 0 lên 1. Mất mát L sẽ thay đổi thế nào?',
        options: ['Giảm đều suốt', 'Giảm rồi tăng lại — có một điểm thấp nhất', 'Tăng đều suốt'],
        answer: 1,
        why: 'L(w) có hình cái bát: w = 0 cho L = 2,42; thấp nhất L ≈ 0,368 tại w ≈ 0,37; đến w = 1 thì L vọt lên 6,33.',
      },
      tasks: [
        'Đặt w = 0 (kéo hết về trái). Đọc L, và để ý hình vuông đỏ của căn nào to nhất.',
        'Kéo chậm w lên cho tới khi hiện dòng <b>"Rất gần mức thấp nhất!"</b>. Ghi lại w và L vào bảng.',
        'Kéo tiếp tới w = 1. Hình vuông của căn nào to lên nhanh nhất? Vì sao?',
      ],
      record: {
        cols: ['w', 'Mất mát L'],
        rows: [
          { label: 'Lúc xuất phát', values: [0, 2.423] },
          { label: 'Thấp nhất bạn tìm được', values: [0.37, 0.368] },
        ],
        tol: [0.012, 0.005],
      },
      explain: {
        q: 'Vì sao ta bình phương sai số rồi mới cộng, thay vì cộng thẳng các sai số?',
        answer: 'Cộng thẳng thì sai số âm (đoán thấp) và dương (đoán cao) triệt tiêu nhau: một đường sai bét vẫn có thể có tổng bằng 0. Bình phương làm mọi sai số đều dương, và phạt nặng sai số lớn: ở w tốt nhất, căn 2 sai 1,11 đóng góp 1,24 vào tổng, gần gấp 90 lần căn 1 chỉ sai 0,12. Ở bước cuối, căn 5 to lên nhanh nhất vì thu nhập x của nó lớn nhất: sai số w·x − y tăng nhanh nhất theo w.',
      },
    },
    {
      id: 'vong',
      step: 'tinh-tay',
      title: 'Chạy Gradient Descent từng vòng',
      predict: {
        q: 'Ở vòng 1 (w = 0), độ dốc ∂L/∂w là một số âm. Sau bước cập nhật, w sẽ thế nào?',
        options: ['Tăng lên', 'Giảm xuống', 'Giữ nguyên'],
        answer: 0,
        why: '∂L/∂w = −11,11. w mới = 0 − 0,01 × (−11,11) = 0,111: trừ đi một số âm là cộng thêm. Độ dốc âm nghĩa là đi sang phải sẽ xuống dốc.',
      },
      tasks: [
        'Giữ η = 0,01 và w₀ = 0. Ở vòng 1, bấm vào <b>∂L/∂w</b> để xem 5 số hạng được cộng lại thế nào.',
        'Bấm tiến từng vòng. Ghi <b>w mới</b> của vòng 1 và vòng 6 vào bảng. Bước nhảy ngắn dần hay dài dần?',
        'Bấm tới vòng 25. So w mới với nghiệm chính xác 0,3700 ở bước 5.',
      ],
      record: {
        cols: ['w mới'],
        rows: [
          { label: 'Vòng 1', values: [0.1111] },
          { label: 'Vòng 6', values: [0.3266] },
          { label: 'Vòng 25', values: [0.3699] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'Vì sao các bước ngắn dần dù tốc độ học η không đổi?',
        answer: 'Độ dài bước = η × |∂L/∂w|. Càng gần đáy, đường cong càng phẳng nên độ dốc càng nhỏ: vòng 1 bước dài 0,111, đến vòng 6 chỉ còn khoảng 0,019. Thuật toán tự "phanh" khi sắp tới nơi, không cần ai bảo.',
      },
    },
    {
      id: 'eta',
      step: 'tinh-tay',
      title: 'Tốc độ học: chậm, vừa, quá đà',
      predict: {
        q: 'Đổi η từ 0,01 lên 0,07 (gấp 7 lần). Điều gì sẽ xảy ra?',
        options: ['Tới đáy nhanh gấp 7 lần', 'Nhảy qua lại hai bên đáy, ngày càng xa — phân kỳ', 'w đứng yên'],
        answer: 1,
        why: 'Với dữ liệu này, η an toàn phải nhỏ hơn 2/L″ ≈ 0,0666. η = 0,07 vượt ngưỡng: w nhảy 0,78 → −0,08 → 0,87 → −0,18 → …, và sau 25 vòng mất mát lên tới khoảng 220.',
      },
      tasks: [
        'Dùng lại lab ở trên. Đặt η = 0,002, bấm tới vòng 25 và ghi w mới. Còn xa 0,37 không?',
        'Đặt η = 0,03, bấm tới vòng 25 và ghi w mới. Mấy vòng thì gần như chạm đáy?',
        'Đặt η = 0,05 rồi 0,07. Xem quả bóng nhảy qua lại hai bên đáy, và cảnh báo <b>phân kỳ</b> hiện ra.',
      ],
      record: {
        cols: ['w mới ở vòng 25'],
        rows: [
          { label: 'η = 0,002', values: [0.2914] },
          { label: 'η = 0,03', values: [0.37] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'η = 0,03 tới đáy chỉ sau khoảng 4 vòng, còn 0,065 thì dao động mãi. Trong thực tế bạn sẽ chọn η thế nào?',
        answer: 'Thử vài giá trị cách nhau khoảng 3 lần (0,001; 0,003; 0,01; 0,03; …), vẽ mất mát theo vòng lặp và chọn giá trị lớn nhất mà mất mát vẫn giảm đều. Mất mát tăng hoặc nhảy lên xuống: η quá lớn. Giảm đều nhưng rất chậm: η quá nhỏ.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Mất mát L (MSE) đo điều gì?', options: ['Trung bình bình phương sai số giữa dự đoán và giá thật', 'Số căn nhà đoán đúng', 'Độ dốc của đường thẳng'], answer: 0, why: 'L = (1/n)·Σ(ŷᵢ − yᵢ)²: càng nhỏ, đường thẳng càng sát các điểm.' },
    'tinh-tay': { q: 'w = 0,2, η = 0,01 và ∂L/∂w = −5. w mới bằng bao nhiêu?', options: ['0,15', '0,25', '0,2'], answer: 1, why: 'w mới = 0,2 − 0,01 × (−5) = 0,2 + 0,05 = 0,25.' },
    'ly-thuyet': { q: 'Với 5 căn nhà này, vì sao η = 0,07 phân kỳ còn η = 0,065 thì không?', options: ['Vì ngưỡng hội tụ 2/L″ ≈ 0,0666 nằm giữa hai giá trị đó', 'Vì 0,07 là số tròn', 'Vì máy tính làm tròn số'], answer: 0, why: 'Độ cong L″ = (2/n)·Σxᵢ² ≈ 30,03, nên η phải nhỏ hơn 2/30,03 ≈ 0,0666.' },
    'ma-nguon': { q: 'Trong mã, dòng nào là "bước xuống dốc"?', options: ['w = w - eta * dw', 'e = y_hat - y', 'L = np.mean(e ** 2)'], answer: 0, why: 'Đó là quy tắc cập nhật w ← w − η·∂L/∂w. Các dòng kia tính sai số và mất mát.' },
  },
  codeTasks: [
    {
      title: 'Tốc độ học quá lớn',
      task: 'Đổi <code>eta = 0.01</code> thành <code>eta = 0.07</code> rồi chạy lại. Đoán trước: L ở vòng 25 lớn hơn hay nhỏ hơn vòng 1?',
      answer: 'Lớn hơn rất nhiều: w đổi dấu liên tục và ngày càng xa 0,37, mất mát tăng lên hàng trăm. Đúng như cảnh báo phân kỳ của lab ở bước 4.',
    },
    {
      title: 'Xuất phát từ phía bên kia',
      task: 'Đổi <code>w = 0.0</code> thành <code>w = 1.0</code>. Độ dốc dL/dw ở vòng 1 mang dấu gì? Sau 25 vòng w về đâu?',
      answer: 'Ở vòng 1, dL/dw = +18,92 (dương, vì w đang quá lớn) nên w giảm dần. Sau 25 vòng w ≈ 0,3701 — cùng một đáy. Cái bát chỉ có một đáy nên xuất phát ở đâu cũng tới cùng chỗ.',
    },
    {
      title: 'Tự dừng khi đủ gần',
      task: 'Thay vòng <code>for</code> bằng vòng <code>while</code>: dừng khi |dw| &lt; 0,001, rồi in số vòng đã chạy và w.',
      hint: 'Dùng <code>abs(dw) &lt; 0.001</code> để thoát vòng lặp bằng <code>break</code>.',
      answer: 'Cần 27 vòng, w = 0,37. Trong thực tế người ta luôn đặt điều kiện dừng như vậy thay vì đoán trước số vòng.',
      code: `w, k = 0.0, 0
while True:
    e = w * x - y
    dw = 2 / n * np.sum(e * x)
    if abs(dw) < 0.001:
        break
    w = w - eta * dw
    k += 1
print(k, "vòng, w =", round(w, 4))`,
    },
  ],
  quiz: [
    { q: 'Tại vị trí hiện tại, ∂L/∂w = +2,5. Bước tiếp theo, w sẽ thay đổi thế nào?', options: ['Tăng lên', 'Giảm xuống', 'Giữ nguyên'], answer: 1, why: 'w mới = w − η × 2,5. Đạo hàm dương nghĩa là đi sang phải thì L tăng, nên ta đi sang trái (giảm w).' },
    { q: 'Mất mát tăng dần sau mỗi vòng lặp. Nguyên nhân khả dĩ nhất?', options: ['Tốc độ học quá nhỏ', 'Tốc độ học quá lớn', 'Dữ liệu quá ít'], answer: 1, why: 'Bước quá dài nhảy vượt qua đáy sang sườn bên kia, cao hơn chỗ cũ. Lặp lại thì càng ngày càng xa đáy.' },
    { q: 'Vì sao bước cập nhật tự ngắn lại khi gần đáy, dù η không đổi?', options: ['Vì máy tính làm tròn số', 'Vì độ dốc ∂L/∂w gần bằng 0 ở gần đáy', 'Vì số vòng lặp tăng'], answer: 1, why: 'Độ dài bước là η × |∂L/∂w|. Ở đáy bát, đường cong gần như nằm ngang nên đạo hàm nhỏ dần về 0.' },
    { q: 'Vận dụng: bạn huấn luyện một mô hình, sau 1.000 vòng mất mát vẫn giảm đều nhưng rất chậm. Nên thử gì trước?', options: ['Tăng tốc độ học η, ví dụ gấp 3', 'Giảm η', 'Bỏ bớt dữ liệu'], answer: 0, why: 'Giảm đều nghĩa là đang đi đúng hướng nhưng bước quá ngắn. Tăng η từng chút và theo dõi: nếu mất mát bắt đầu nhảy lên xuống thì lùi lại.' },
    { q: 'Vận dụng: đổi đơn vị thu nhập từ "×10.000 USD" sang "USD" (mọi x lớn gấp 10.000 lần), giữ η = 0,01. Chuyện gì dễ xảy ra?', options: ['Không có gì thay đổi', 'Phân kỳ ngay, vì độ cong L″ tăng gấp 10⁸ lần nên ngưỡng an toàn của η nhỏ đi tương ứng', 'Hội tụ nhanh hơn'], answer: 1, why: 'L″ = (2/n)·Σx² tỷ lệ với x². Ngưỡng 2/L″ tụt xuống cỡ 7·10⁻¹⁰. Đây là lý do người ta chuẩn hoá dữ liệu trước khi chạy Gradient Descent (chương 1 và 3B).' },
  ],
  takeaways: {
    points: [
      '"Học" nghĩa là <b>tìm tham số làm mất mát nhỏ nhất</b>. Với bài toán dự đoán con số, mất mát thường là MSE: trung bình bình phương sai số.',
      'Gradient Descent lặp bốn việc: <b>dự đoán → sai số → độ dốc → bước ngược chiều độ dốc</b>: w ← w − η·∂L/∂w.',
      'Độ dài bước = η × |độ dốc|, nên bước <b>tự ngắn lại</b> khi gần đáy.',
      '<b>η quá nhỏ</b>: chậm. <b>η quá lớn</b> (vượt 2/L″): dao động hoặc phân kỳ. Mất mát tăng là dấu hiệu cần giảm η.',
      'Khi có nghiệm chính xác (ở đây w* = Σxy/Σx² = 0,3700), hãy dùng nó để <b>kiểm tra</b> Gradient Descent.',
    ],
    use: [
      'Mô hình có rất nhiều tham số, không có công thức giải trực tiếp (mạng nơ-ron, chương 9–11)',
      'Dữ liệu quá lớn để giải một lần: chạy trên từng phần nhỏ (mini-batch)',
      'Hàm mất mát trơn, tính được đạo hàm',
    ],
    avoid: [
      'Bài toán nhỏ có nghiệm chính xác rẻ, như hồi quy tuyến tính vài đặc trưng: giải thẳng nhanh và chính xác hơn',
      'Mất mát không có đạo hàm, như "số lần đoán sai": cần thay bằng một hàm trơn (chương 2)',
      'Các đặc trưng chênh lệch thang đo lớn: chuẩn hoá trước, nếu không sẽ phải chọn η rất nhỏ',
    ],
    next: { text: 'Mô hình ŷ = w·x buộc đường thẳng đi qua gốc toạ độ. Chương 1 thêm hệ số chặn b, dùng 400 khu vực, và đo xem mô hình dự đoán tốt đến đâu trên dữ liệu chưa từng thấy.', slug: 'hoi-quy-tuyen-tinh', title: 'Chương 1: Hồi quy tuyến tính' },
  },
  challenges: [
    {
      level: 1,
      title: 'Tính tay vòng 2',
      task: 'Sau vòng 1 (η = 0,01), w = 0,1111. Tính 5 sai số eᵢ = w·xᵢ − yᵢ, rồi ∂L/∂w = (2/5)·Σ eᵢxᵢ và w mới. Đối chiếu với lab ở bước 4.',
      hint: 'Thu nhập x = 1,9667; 2,7556; 3,5586; 4,4435; 5,5867. Giá y = 0,846; 2,132; 1,604; 0,976; 1,825.',
      answer: 'e ≈ (−0,628; −1,826; −1,209; −0,482; −1,204). Các tích eᵢxᵢ ≈ (−1,234; −5,031; −4,301; −2,143; −6,728), tổng ≈ −19,437. ∂L/∂w = 0,4 × (−19,437) ≈ −7,775. w mới = 0,1111 − 0,01 × (−7,775) ≈ 0,1889 — khớp với "w mới" của vòng 2 trên lab.',
    },
    {
      level: 2,
      title: 'Thêm hệ số chặn b',
      task: 'Sửa ô mã để mô hình thành ŷ = w·x + b, cập nhật cả w và b (∂L/∂b = (2/n)·Σeᵢ). Chạy 2.000 vòng với η = 0,01, rồi so với <code>np.polyfit(x, y, 1)</code> (trả về [w, b]).',
      answer: 'Sau 2.000 vòng: w ≈ 0,097, b ≈ 1,120, mất mát ≈ 0,229 (thấp hơn hẳn 0,368 khi không có b). Nghiệm chính xác là w = 0,092, b = 1,138: Gradient Descent vẫn chưa tới nơi sau 2.000 vòng! Thêm b làm cái bát dẹt dài theo một hướng, nên đi xuống rất chậm. Chương 1 sửa điều này bằng cách chuẩn hoá x.',
      code: `w, b = 0.0, 0.0
for k in range(2000):
    e = w * x + b - y
    w, b = w - eta * 2 / n * np.sum(e * x), b - eta * 2 / n * np.sum(e)
print(round(w, 4), round(b, 4), np.polyfit(x, y, 1).round(4))`,
    },
    {
      level: 3,
      title: 'Căn 4: lỗi hay thật?',
      task: 'Căn 4 có thu nhập cao thứ hai nhưng giá thấp thứ hai, kéo đường thẳng xuống. Nếu đó là lỗi nhập liệu thì sao? Nếu là thật thì sao? Bạn sẽ xử lý thế nào?',
      hint: 'Thử tính lại w* = Σxy/Σx² khi bỏ căn 4. Nhìn cột "Vị trí" trong bảng ở bước 1.',
      answer: 'Bỏ căn 4 thì w* tăng từ 0,370 lên 0,424 — một điểm làm đường thẳng lệch gần 15%, vì MSE bình phương sai số nên rất nhạy với điểm bất thường. Nhưng xoá là quyết định nguy hiểm: căn 4 nằm sâu trong nội địa, nhà ở đó rẻ thật. Đó không phải lỗi mà là <i>thông tin còn thiếu</i> trong mô hình. Cách đúng: kiểm tra nguồn dữ liệu trước, nếu dữ liệu đúng thì thêm đặc trưng giải thích được nó (vị trí). Chương 3A dạy cách phát hiện và đánh giá điểm ngoại lai một cách có hệ thống.',
    },
  ],
  reflect: [
    'Trước bài này bạn hình dung "máy học" là gì? Giờ bạn sẽ mô tả nó thế nào?',
    'Giải thích Gradient Descent cho một người bạn bằng hình ảnh đi xuống dốc trong sương mù, trong 3 câu.',
    'Điều gì làm bạn bất ngờ khi thay đổi tốc độ học?',
  ],
};
