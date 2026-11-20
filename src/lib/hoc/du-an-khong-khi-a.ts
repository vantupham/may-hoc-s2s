/**
 * Phần trải nghiệm của chương 12A (dự án bụi mịn Hà Nội: dữ liệu và mô hình cổ điển).
 * Mọi con số trong đáp án và bảng ghi lấy từ các lab (ml-core, chạy trên trình duyệt) hoặc từ scripts/prep_ch12.py;
 * tests/ch12.test.ts kiểm tra lại các số này.
 */
import type { LessonLearn } from '../learn';

export const duAnALearn: LessonLearn = {
  slug: 'du-an-khong-khi-a',
  minutes: 120,
  goals: [
    { text: 'Đánh giá chất lượng dữ liệu quan trắc thật: tìm mã lỗi, cảm biến kẹt số, trạm lệch, và ghép nhiều trạm thành một chỉ số đáng tin (chương 3A).', see: 'kham-pha' },
    { text: 'Đặt mốc so sánh trước khi làm mô hình, và giải thích vì sao "ngày mai = hôm nay" khó bị đánh bại (chương 8).', see: 'truc-giac' },
    { text: 'Tính tay Gradient Descent và nghiệm đóng của hồi quy tuyến tính trên số liệu PM2.5 thật (chương 0–1).', see: 'tinh-tay' },
    { text: 'Nhận ra rò rỉ từ tương lai khi điền thiếu dữ liệu chuỗi thời gian (chương 3B).', see: 'ly-thuyet' },
    { text: 'Dùng lại logistic, KNN, cây, SVM, K-means và PCA cho cùng một bài toán, và chọn ngưỡng cảnh báo theo cái giá của sai lầm (chương 2, 4–7).', see: 'ly-thuyet' },
    { text: 'Đọc một bảng xếp hạng mô hình: so mức chênh, so với mốc, và biết con số nào đáng tin (chương 8).', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Chương 3B: vì sao phải tính trung bình và độ lệch chuẩn để chuẩn hoá chỉ trên tập huấn luyện?', options: ['Để tập test không rò thông tin vào quá trình học', 'Để tính nhanh hơn', 'Vì tập test thường nhỏ'], answer: 0, why: 'Mọi con số dùng để học, kể cả trung bình dùng chuẩn hoá, đều phải đến từ tập huấn luyện. Nếu không, mô hình đã "nhìn trộm" tập test.' },
    { q: 'Chương 8: MAE = 12 µg/m³ nghĩa là gì?', options: ['Trung bình mỗi ngày dự báo lệch khoảng 12 µg/m³ so với thật', '12% số ngày dự báo sai', 'Sai số lớn nhất là 12 µg/m³'], answer: 0, why: 'MAE là trung bình của |dự báo − thật|, cùng đơn vị với đại lượng cần dự báo.' },
  ],
  missions: [
    {
      id: 'tram',
      step: 'kham-pha',
      title: 'Khám sức khoẻ 7 trạm đo',
      predict: {
        q: 'Bảy trạm cùng đo PM2.5 ở Hà Nội. Theo bạn, bao nhiêu trạm đủ tin cậy để đưa vào chỉ số chung?',
        options: ['Cả 7', '5 trạm', '2 trạm'],
        answer: 1,
        why: 'Hai trạm bị loại: Vinhomes Ocean Park là cảm biến giá rẻ, đo cao hơn các trạm khác khoảng 12 µg/m³; Minh Khai có tương quan chỉ 0,65 với các trạm khác và từng đo gấp đôi chúng suốt mùa đông 2024–2025. Năm trạm còn lại vẫn có lỗi, nhưng sửa được bằng quy tắc.',
      },
      tasks: [
        'Đọc cột <b>Mã lỗi −999</b>. Trạm nào có nhiều nhất? Nếu không bỏ những giá trị này, trung bình ngày của trạm đó sẽ ra sao?',
        'Bấm vào dòng <b>Minh Khai</b> để làm nổi đường của nó. Tìm mùa đông mà nó đo gấp đôi các trạm khác.',
        'Bấm vào dòng <b>556 Nguyễn Văn Cừ</b>. Trạm này ngừng gửi số liệu từ khi nào?',
        'Ghi số trạm được dùng, số mã lỗi của trạm 7441 và số ngày-trạm bị loại do lệch xa trung vị.',
      ],
      record: {
        cols: ['Giá trị'],
        rows: [
          { label: 'Số trạm được dùng', values: [5] },
          { label: 'Mã lỗi −999 của trạm 7441', values: [3193] },
          { label: 'Ngày-trạm bị loại vì lệch xa trung vị', values: [24] },
        ],
        tol: [0.5],
      },
      explain: {
        q: 'Vì sao chỉ số Hà Nội dùng trung vị của các trạm chứ không dùng trung bình?',
        answer: 'Trung vị không bị kéo lệch bởi một trạm hỏng. Nếu ba trạm đo 50, 55 và 150, trung bình là 85 nhưng trung vị vẫn là 55. Với dữ liệu cảm biến, một trạm đo sai là chuyện thường ngày, nên một thống kê chịu được ngoại lai (chương 3A) an toàn hơn.',
      },
    },
    {
      id: 'gio',
      step: 'kham-pha',
      title: 'Khi nào bụi dày nhất?',
      predict: {
        q: 'Trong tháng 1/2026, giờ nào trong ngày không khí Hà Nội sạch nhất?',
        options: ['Rạng sáng, 3–5 giờ', 'Đầu giờ chiều, 14–16 giờ', 'Nửa đêm'],
        answer: 1,
        why: 'Trung bình tháng 1/2026 thấp nhất lúc 15 giờ (47 µg/m³), cao nhất 6–10 giờ sáng (khoảng 73). Buổi chiều, mặt trời đốt nóng mặt đất, không khí xáo trộn lên cao (lớp biên dày nhất trong ngày) nên bụi loãng ra. Đêm và sáng sớm, lớp không khí sát đất lạnh, nặng, không bốc lên được (nghịch nhiệt), nên bụi của giờ cao điểm sáng bị giữ lại sát mặt đất.',
      },
      tasks: [
        'Chọn tháng 1/2026. Nhìn cột trung bình bên phải: giờ nào đậm màu nhất, giờ nào nhạt nhất? Đỉnh bụi có trùng giờ cao điểm giao thông không?',
        'Chuyển sang tháng 7/2025 và so sánh. Mùa hè khác mùa đông thế nào?',
        'Tìm một chuỗi ngày đỏ liên tiếp trong tháng 12/2025 rồi để ý nó kết thúc đột ngột ra sao.',
      ],
      explain: {
        q: 'Một đợt ô nhiễm thường kết thúc rất đột ngột: một ngày đỏ rồi ngay hôm sau xanh. Điều gì có thể gây ra điều đó, và việc này ảnh hưởng gì đến cách dự báo "ngày mai = hôm nay"?',
        answer: 'Thường là một đợt gió mùa đông bắc hoặc mưa: gió mạnh thổi bụi đi, mưa rửa bụi xuống. Những ngày "đổi chiều" như vậy chính là chỗ "ngày mai = hôm nay" sai nặng nhất, và cũng là chỗ thông tin thời tiết ngày mai giúp được nhiều nhất.',
      },
    },
    {
      id: 'moc',
      step: 'truc-giac',
      title: 'Hai mốc so sánh',
      predict: {
        q: 'Cách nào dự báo mùa đông 2025–2026 tốt hơn: "ngày mai = hôm nay" hay "lấy trung bình cùng tháng của các năm trước"?',
        options: ['"Ngày mai = hôm nay"', 'Trung bình cùng tháng', 'Gần bằng nhau'],
        answer: 0,
        why: '"Ngày mai = hôm nay" có MAE 16,3 µg/m³, còn trung bình cùng tháng là 20,7. Bụi của hôm nay mang rất nhiều thông tin về ngày mai, vì thời tiết và nguồn thải thay đổi chậm. Trung bình tháng chỉ biết "tháng 1 thường bẩn", không biết hôm nay đang bẩn hay sạch.',
      },
      tasks: [
        'Chọn "ngày mai = hôm nay". Đường cam có giống đường xanh dịch sang phải một ngày không?',
        'Tìm những chỗ hai đường lệch nhau nhiều nhất. Đó là những ngày nào?',
        'Ghi MAE của hai mốc.',
      ],
      record: {
        cols: ['MAE (µg/m³)'],
        rows: [
          { label: 'Ngày mai = hôm nay', values: [16.32] },
          { label: 'Trung bình cùng tháng', values: [20.73] },
        ],
        tol: [0.05],
      },
      explain: {
        q: 'Vì sao một dự án học máy nên có mốc so sánh trước khi làm mô hình đầu tiên?',
        answer: 'Không có mốc thì không biết "MAE 12" là tốt hay tệ. Ở đây một mô hình MAE 16 nghe có vẻ được, nhưng thật ra nó không hơn gì việc chép lại số đo hôm nay. Mốc so sánh là mức sàn mà mọi mô hình phải vượt qua thì mới đáng dùng.',
      },
    },
    {
      id: 'tay',
      step: 'tinh-tay',
      title: 'Gradient Descent trên 5 ngày Tết Ất Tỵ',
      predict: {
        q: 'Trên 5 ngày này, hệ số w tốt nhất của mô hình ŷ = w·x + b (x là PM2.5 hôm nay) gần với giá trị nào?',
        options: ['Khoảng 0,7', 'Đúng bằng 1', 'Âm'],
        answer: 0,
        why: 'Nghiệm đóng cho w = 0,693 và b = 0,149 (chục µg/m³). Bụi giảm đều qua kỳ nghỉ Tết, nên ngày mai thường chỉ bằng khoảng 70% hôm nay. w < 1 nghĩa là mô hình kéo dự báo về phía mức thấp hơn hôm nay.',
      },
      tasks: [
        'Ở vòng 1 (w = 0, b = 0), bấm chip <b>∂L/∂w</b>, rồi bấm "Xem từng số hạng". Ngày nào góp nhiều nhất vào đạo hàm?',
        'Chạy tới vòng cuối với η = 0,01. Ghi w và b, so với nghiệm đóng.',
        'Đổi η sang 0,045 rồi chạy lại. Chuyện gì xảy ra với mất mát?',
      ],
      record: {
        cols: ['w', 'b'],
        rows: [{ label: 'Nghiệm đóng', values: [0.693, 0.149] }],
        tol: [0.005, 0.005],
      },
      explain: {
        q: 'Vì sao η = 0,045 làm mất mát tăng vọt, trong khi η = 0,03 vẫn hội tụ?',
        answer: 'x ở đây lên tới 7,8 (chục µg/m³), nên đạo hàm theo w rất lớn: bước cập nhật η·∂L/∂w vượt quá đáy rồi bật sang phía bên kia, mỗi vòng xa hơn vòng trước. Đây đúng là hiện tượng "tốc độ học quá lớn" của chương 0. Chuẩn hoá x trước khi học (chương 3B) là cách chữa thông thường.',
      },
    },
    {
      id: 'ro-ri',
      step: 'ly-thuyet',
      title: 'Điền thiếu bằng quá khứ hay bằng cả tương lai?',
      predict: {
        q: 'Ta coi giá trị vừa điền cho hôm nay là dự báo cho ngày mai. Cách điền nào cho MAE thấp hơn?',
        options: ['ffill (lấy giá trị trước đó)', 'Nội suy giữa hai đầu đoạn thiếu', 'Như nhau'],
        answer: 1,
        why: 'Nội suy cho MAE 4,6, còn ffill cho 18,6. Nhưng 4,6 là ảo giác: nội suy kéo giá trị của ngày thiếu cuối cùng về phía số đo ngày mai, tức chính đáp án. Khi dùng thật, ngày mai chưa xảy ra nên không thể nội suy như vậy.',
      },
      tasks: [
        'Chọn vài đoạn thiếu. Ở ngày thiếu cuối cùng, đường đỏ (nội suy) gần số đo ngày hôm sau hơn hay đường xanh (ffill) gần hơn?',
        'Ghi MAE của hai cách điền.',
      ],
      record: {
        cols: ['MAE dự báo ngày mai'],
        rows: [
          { label: 'ffill', values: [18.6] },
          { label: 'Nội suy hai phía', values: [4.6] },
        ],
        tol: [0.15],
      },
      explain: {
        q: 'Chương 3B cũng có rò rỉ khi điền tuổi Titanic bằng trung vị của cả tập. Rò rỉ ở đây khác gì?',
        answer: 'Ở Titanic, rò rỉ đi từ tập test sang tập huấn luyện qua một con số tổng hợp, nên tác động nhỏ. Ở chuỗi thời gian, rò rỉ đi từ tương lai sang hiện tại ngay trong từng dòng, và giá trị bị lộ lại chính là nhãn cần dự báo, nên điểm số đẹp lên rất nhiều. Quy tắc: với dữ liệu có thời gian, mọi thao tác (điền, chuẩn hoá, trung bình trượt) chỉ được nhìn về quá khứ.',
      },
    },
    {
      id: 'canh-bao',
      step: 'ly-thuyet',
      title: 'Chọn ngưỡng cảnh báo',
      predict: {
        q: 'Giả sử bỏ sót một ngày ô nhiễm đắt gấp 5 lần báo nhầm một ngày sạch. Ngưỡng xác suất tốt nhất sẽ thế nào so với 0,5?',
        options: ['Thấp hơn 0,5', 'Đúng 0,5', 'Cao hơn 0,5'],
        answer: 0,
        why: 'Bỏ sót càng đắt thì càng nên cảnh báo sớm, tức hạ ngưỡng. Trên mùa đông này, với giá gấp 5, ngưỡng rẻ nhất là 0,05: gần như có chút nghi ngờ là cảnh báo.',
      },
      tasks: [
        'Đặt ngưỡng 0,5. Ghi số ngày đúng, báo nhầm và bỏ sót.',
        'Kéo thanh giá bỏ sót từ 1 lên 5. Ngưỡng rẻ nhất dịch về đâu?',
        'Để ý AUC: nó có thay đổi khi bạn kéo ngưỡng không?',
      ],
      record: {
        cols: ['Đúng', 'Báo nhầm', 'Bỏ sót'],
        rows: [{ label: 'Ngưỡng 0,5', values: [51, 10, 10] }],
        tol: [0.5, 0.5, 0.5],
      },
      explain: {
        q: 'Ai nên chọn ngưỡng cảnh báo: người làm mô hình hay cơ quan phát cảnh báo? Vì sao?',
        answer: 'Cơ quan phát cảnh báo, vì ngưỡng phụ thuộc vào cái giá của mỗi loại sai lầm: một ngày học sinh phải nghỉ ngoài trời vô ích, hay một ngày người bệnh hen ra đường mà không được báo trước. Đó là lựa chọn về chính sách và giá trị. Người làm mô hình cung cấp đường ROC và bảng đánh đổi để họ chọn.',
      },
    },
    {
      id: 'cay',
      step: 'ly-thuyet',
      title: 'Cây quyết định thành luật',
      predict: {
        q: 'Cây sâu 1 (chỉ một câu hỏi) và cây sâu 2 (hai câu hỏi). Cây nào đúng nhiều hơn trên tập kiểm tra mùa đông?',
        options: ['Cây sâu 1', 'Cây sâu 2', 'Bằng nhau'],
        answer: 0,
        why: 'Cây sâu 1 đúng 79,2%, cây sâu 2 chỉ đúng 67,4%. Câu hỏi mới của cây sâu 2 là "ngày mai có mưa không", đặt cho những ngày đang bẩn. Ở 2023–2025, chỉ 16/37 ngày "đang bẩn, mai mưa" vượt ngưỡng, nên lá đó trả lời "không cảnh báo". Nhưng ở mùa đông 2025–2026, 24/31 ngày như vậy vẫn vượt ngưỡng. Một quy luật đúng trong quá khứ chưa chắc còn đúng ở mùa sau.',
      },
      tasks: [
        'Ở độ sâu 1, đọc câu hỏi duy nhất của cây. Ngưỡng PM2.5 hôm nay là bao nhiêu?',
        'Tăng lên độ sâu 2 và 3. Câu hỏi thứ hai là về đặc trưng nào?',
        'Ghi độ chính xác test của độ sâu 1 và 2.',
      ],
      record: {
        cols: ['Đúng trên test (%)'],
        rows: [
          { label: 'Độ sâu 1', values: [79.2] },
          { label: 'Độ sâu 2', values: [67.4] },
        ],
        tol: [0.15],
      },
      explain: {
        q: 'Bảng độ quan trọng của gradient boosting cho thấy "PM2.5 hôm nay" chiếm hơn một nửa. Điều đó có nghĩa là bụi hôm nay gây ra bụi ngày mai không?',
        answer: 'Không. Độ quan trọng chỉ cho biết mô hình dựa vào đặc trưng nào để dự báo. Bụi hôm nay và bụi ngày mai cùng có chung nguyên nhân (nguồn thải, thời tiết kéo dài nhiều ngày), nên chúng đi cùng nhau. Muốn biết nguyên nhân cần thí nghiệm hoặc các phương pháp suy luận nhân quả, không chỉ đọc độ quan trọng.',
      },
    },
    {
      id: 'svm',
      step: 'ly-thuyet',
      title: 'SVM trên hai đặc trưng',
      predict: {
        q: 'Tăng γ của nhân RBF từ 0,1 lên 10. Độ chính xác trên tập kiểm tra sẽ thế nào?',
        options: ['Tăng', 'Giảm nhẹ', 'Không đổi'],
        answer: 1,
        why: 'Trên tập huấn luyện, độ chính xác tăng từ 86,7% lên 90,6%. Trên tập kiểm tra, nó giảm từ 82,6% xuống 81,2%. Đây vẫn là hiện tượng quá khớp của chương 6, nhưng nhẹ hơn ung thư vú, vì ở đây có nhiều ngày hơn và ranh giới thật sự gần thẳng.',
      },
      tasks: [
        'Chọn γ = 0,1 rồi γ = 10, xem ranh giới đổi hình.',
        'Chuyển giữa điểm huấn luyện và điểm kiểm tra. Mùa đông 2025–2026 có nhiều chấm đỏ hơn hay ít hơn 2023–2025?',
        'Ghi điểm của γ = 0,1 và γ = 10.',
      ],
      record: {
        cols: ['Huấn luyện (%)', 'Kiểm tra (%)'],
        rows: [
          { label: 'γ = 0,1', values: [86.7, 82.6] },
          { label: 'γ = 10', values: [90.6, 81.2] },
        ],
        tol: [0.15, 0.15],
      },
      explain: {
        q: 'Hồi quy logistic trên cùng hai đặc trưng đạt 81,9% trên tập kiểm tra, gần bằng SVM. Điều này nói gì về hình dạng ranh giới?',
        answer: 'Ranh giới thật gần như thẳng: bụi hôm nay càng cao thì càng cần gió mạnh mới sạch được. Khi ranh giới thẳng, nhân RBF không thêm được gì nhiều. Chương 6 có cùng bài học: mô hình phức tạp hơn không tự động tốt hơn.',
      },
    },
    {
      id: 'kieu-ngay',
      step: 'ly-thuyet',
      title: 'Ba kiểu ngày',
      predict: {
        q: 'Gom các ngày theo hình dạng 24 giờ thành 3 cụm. Cụm có đỉnh bụi về đêm sẽ tập trung vào mùa nào?',
        options: ['Mùa hè', 'Đều quanh năm', 'Mùa thu – đông'],
        answer: 2,
        why: 'Cụm có đỉnh lúc 1 giờ sáng đông nhất vào tháng 10, đúng mùa nghịch nhiệt bắt đầu và mùa đốt rơm rạ sau thu hoạch lúa. Cụm có đỉnh buổi trưa và hình dạng phẳng thì đông nhất vào mùa hè.',
      },
      tasks: [
        'Chạy K-means từng vòng với K = 3 cho đến khi hội tụ. Mất bao nhiêu vòng?',
        'Đọc hình dạng 24 giờ của ba tâm cụm: tìm cụm có đỉnh ban đêm, cụm có đỉnh buổi tối, và cụm gần phẳng.',
        'Bấm "Khởi tạo lại" vài lần. Các cụm có giữ nguyên không?',
      ],
      explain: {
        q: 'K-means không biết nhãn nào cả. Kết quả phân cụm có thể dùng để làm gì cho bài toán dự báo?',
        answer: 'Làm đặc trưng mới: "hôm qua thuộc kiểu ngày nào" là thông tin gọn về hình dạng của 24 giờ, mô hình có giám sát dùng được. Nó cũng giúp kiểm tra dữ liệu: những ngày nằm xa mọi tâm cụm thường là ngày có sự kiện lạ hoặc cảm biến lỗi.',
      },
    },
    {
      id: 'bang-a',
      step: 'danh-gia',
      title: 'Bảng xếp hạng phần A',
      predict: {
        q: 'Trong các mô hình của chương 0–8, mô hình nào có MAE thấp nhất trên mùa đông 2025–2026?',
        options: ['Hồi quy tuyến tính 12 đặc trưng', 'KNN', 'Gradient boosting'],
        answer: 2,
        why: 'Gradient boosting đạt 11,16, rừng ngẫu nhiên 11,76, hồi quy tuyến tính 12,01, KNN 12,35. Mô hình đứng đầu chỉ hơn mô hình tuyến tính 0,85 µg/m³, nhưng hơn mốc "ngày mai = hôm nay" tới 5,2.',
      },
      tasks: [
        'Sắp theo MAE. Những mô hình nào chỉ hơn mốc "ngày mai = hôm nay" chưa tới 2 µg/m³?',
        'Sắp theo AUC. Mô hình đứng đầu theo AUC có trùng với mô hình đứng đầu theo MAE không?',
        'Ghi MAE của gradient boosting và của hồi quy tuyến tính 12 đặc trưng.',
      ],
      record: {
        cols: ['MAE (µg/m³)'],
        rows: [
          { label: 'Gradient boosting', values: [11.16] },
          { label: 'Hồi quy tuyến tính, 12 đặc trưng', values: [12.01] },
        ],
        tol: [0.05],
      },
      explain: {
        q: 'Chênh lệch 0,85 µg/m³ giữa boosting và hồi quy tuyến tính, trên 144 ngày, có đủ để kết luận boosting tốt hơn không?',
        answer: 'Chưa chắc. Chỉ một mùa đông với 144 ngày, nên một vài ngày cực đoan có thể đảo thứ tự. Cross-validation theo thời gian (bài 12B) cho thấy sai số đổi rất nhiều giữa các giai đoạn. Trong thực tế, chênh lệch nhỏ như vậy thường không đáng đổi một mô hình dễ hiểu lấy một mô hình khó giải thích.',
      },
    },
  ],
  checkpoints: {
    'kham-pha': { q: 'Một trạm báo −999 µg/m³ trong 3 giờ. Nên làm gì?', options: ['Coi là ô thiếu', 'Coi là 0', 'Giữ nguyên, vì đó là số đo'], answer: 0, why: '−999 là mã lỗi của thiết bị, không phải nồng độ. Coi nó là số sẽ kéo trung bình ngày xuống âm.' },
    'truc-giac': { q: 'Mô hình A có MAE 15 trên mùa đông, còn "ngày mai = hôm nay" có MAE 16,3. Kết luận nào hợp lý nhất?', options: ['A gần như không có giá trị thêm', 'A rất tốt', 'A tệ hơn mốc'], answer: 0, why: 'A chỉ hơn mốc 1,3 µg/m³, tức là phần lớn những gì nó "biết" đã nằm sẵn trong số đo hôm nay.' },
    'tinh-tay': { q: 'Ở vòng 1, w = 0 và b = 0. ∂L/∂w âm. Bước cập nhật sẽ làm w thế nào?', options: ['Tăng', 'Giảm', 'Không đổi'], answer: 0, why: 'w mới = w − η·∂L/∂w. Trừ đi một số âm tức là cộng thêm, nên w tăng.' },
    'ly-thuyet': { q: 'Với dữ liệu chuỗi thời gian, cách chia train/test nào đúng?', options: ['Theo thời gian: học trên quá khứ, kiểm tra trên tương lai', 'Ngẫu nhiên 80/20', 'Phân tầng theo nhãn'], answer: 0, why: 'Khi dùng thật, ta luôn dự báo tương lai từ quá khứ. Cách chia phải mô phỏng đúng điều đó.' },
    'ma-nguon': { q: 'Trong pandas, phép nào chỉ nhìn về quá khứ?', options: ['shift(1) và rolling(7).mean()', 'interpolate()', 'shift(-1)'], answer: 0, why: 'shift(1) lấy hôm qua, rolling(7) lấy 7 ngày kết thúc hôm nay. interpolate() nhìn cả hai phía, shift(-1) lấy ngày mai.' },
  },
  codeTasks: [
    {
      title: 'Bỏ thời tiết ngày mai',
      task: 'Đặc trưng thời tiết ngày mai ở đây là số liệu ERA5 thật, tức là ta giả định có một bản dự báo thời tiết hoàn hảo. Trong ô mã, bỏ các cột thời tiết ngày mai khỏi <code>feats</code> (chỉ giữ pm0, pm1, pm7, sin, cos) rồi chạy lại.',
      answer: 'MAE của gradient boosting tăng từ 11,16 lên 16,2 µg/m³, ngang mốc "ngày mai = hôm nay" (16,32). Toàn bộ lợi thế của mô hình đến từ thông tin thời tiết ngày mai: chỉ nhìn bụi của những ngày qua thì không đoán được hơn việc chép lại hôm nay. Trong thực tế, bản dự báo thời tiết có sai số, nên con số thật sẽ nằm ở khoảng giữa.',
      code: `feats = ["pm0", "pm1", "pm7", "sin", "cos"]`,
    },
    {
      title: 'Chia ngẫu nhiên',
      task: 'Thay cách chia theo thời gian bằng <code>train_test_split(F, test_size=0.2, random_state=0)</code> rồi tính MAE trên phần test ngẫu nhiên.',
      hint: '<code>from sklearn.model_selection import train_test_split</code>',
      answer: 'MAE thấp hơn hẳn (7,98 µg/m³), nhưng đó không phải bằng chứng mô hình tốt hơn: phần test ngẫu nhiên chứa đủ mọi mùa, trong đó mùa hè sạch nên dễ dự báo. Hai con số trên hai tập test khác nhau thì không so được với nhau.',
      code: `from sklearn.model_selection import train_test_split
a, b = train_test_split(F, test_size=0.2, random_state=0)
m = GradientBoostingRegressor(n_estimators=300, learning_rate=0.03, max_depth=3, subsample=0.8, random_state=0).fit(a[feats], a.y)
print(round(mean_absolute_error(b.y, m.predict(b[feats])), 2))`,
    },
    {
      title: 'Thêm đặc trưng cuối tuần',
      task: 'Thêm cột <code>F["weekend"] = (pd.to_datetime(F.target).dt.dayofweek >= 5).astype(int)</code> vào danh sách đặc trưng rồi chạy lại.',
      answer: 'MAE gần như không đổi (11,22 so với 11,16). Ở Hà Nội, thời tiết lấn át chu kỳ giao thông trong tuần, nên "cuối tuần" mang rất ít thông tin thêm. Một ý tưởng đặc trưng hay chưa chắc đã giúp được gì: phải đo mới biết.',
    },
  ],
  quiz: [
    { q: 'Vì sao chỉ số Hà Nội lấy trung vị của các trạm?', options: ['Để một trạm hỏng không kéo lệch cả chỉ số', 'Vì tính nhanh hơn', 'Vì trung bình luôn sai'], answer: 0, why: 'Trung vị chịu được ngoại lai: một trạm đo gấp đôi không làm trung vị thay đổi nhiều.' },
    { q: 'Mốc "ngày mai = hôm nay" sai nhiều nhất vào những ngày nào?', options: ['Ngày đổi chiều: bụi tăng hoặc giảm mạnh', 'Ngày bụi ổn định', 'Ngày cuối tuần'], answer: 0, why: 'Nó luôn chậm một ngày, nên sai nặng nhất khi bụi đổi chiều.' },
    { q: 'Hạ ngưỡng xác suất cảnh báo từ 0,5 xuống 0,2 thì điều gì xảy ra?', options: ['Ít bỏ sót hơn, nhiều báo nhầm hơn', 'Ít báo nhầm hơn, nhiều bỏ sót hơn', 'AUC tăng'], answer: 0, why: 'Ngưỡng thấp thì cảnh báo dễ hơn: bắt được nhiều ngày ô nhiễm hơn nhưng cũng báo nhầm nhiều hơn. AUC không phụ thuộc ngưỡng.' },
    { q: 'Vận dụng: một đồng nghiệp báo MAE = 4,6 µg/m³ sau khi "điền thiếu bằng interpolate() rồi chia ngẫu nhiên". Bạn nên nói gì?', options: ['Kết quả có rò rỉ từ tương lai, cần làm lại theo thời gian và chỉ điền bằng quá khứ', 'Tuyệt vời, triển khai ngay', 'Cần thêm đặc trưng'], answer: 0, why: 'Cả interpolate() lẫn chia ngẫu nhiên đều cho mô hình nhìn thấy những gì không có lúc dự báo thật.' },
    { q: 'Vận dụng: bạn muốn làm dự án tương tự cho Đà Nẵng nhưng chỉ có một trạm đo. Rủi ro lớn nhất là gì?', options: ['Không có trạm nào để đối chiếu, khó phát hiện cảm biến lỗi', 'Không chạy được gradient boosting', 'Không có thời tiết ERA5'], answer: 0, why: 'Ở Hà Nội, nhiều trạm giúp phát hiện Minh Khai và Nguyễn Văn Cừ hỏng. Chỉ một trạm thì phải dựa vào quy tắc về giá trị và đối chiếu với nguồn khác, ví dụ mô hình CAMS.' },
  ],
  takeaways: {
    points: [
      'Dữ liệu thật luôn có lỗi: <b>mã lỗi, cảm biến kẹt số, trạm lệch, trạm hỏng giữa chừng</b>. Viết quy tắc kiểm soát chất lượng thành mã, đếm số dòng mỗi quy tắc loại bỏ, và công bố kèm kết quả.',
      'Luôn có <b>mốc so sánh</b>. Với chuỗi thời gian, "ngày mai = hôm nay" là đối thủ rất khó thắng.',
      'Với dữ liệu có thời gian, mọi thao tác chỉ được <b>nhìn về quá khứ</b>: điền thiếu, chuẩn hoá, trung bình trượt, cách chia train/test.',
      '<b>Ngưỡng cảnh báo là quyết định chính sách</b>, dựa trên cái giá của báo nhầm và bỏ sót. Mô hình chỉ cung cấp xác suất.',
      'Các mô hình tốt nằm sát nhau trên bảng xếp hạng. Khoảng cách tới mốc so sánh mới là điều quan trọng.',
    ],
    use: [
      'Hồi quy tuyến tính: mốc đầu tiên, dễ giải thích, gần bằng mô hình tốt nhất',
      'Gradient boosting: dữ liệu dạng bảng, nhiều loại đặc trưng',
      'Cây nông: khi cần luật đọc được để giải thích cho người ra quyết định',
    ],
    avoid: [
      'Chia ngẫu nhiên hay nội suy hai phía khi dữ liệu có thứ tự thời gian',
      'Tin vào chênh lệch nhỏ giữa hai mô hình trên một tập kiểm tra ngắn',
      'Đọc độ quan trọng đặc trưng như nguyên nhân',
    ],
    next: { text: 'Bài 12B dùng chính số liệu theo giờ: CNN 1D và attention nhìn 72 giờ gần nhất, cross-validation theo thời gian, và chuyện gì xảy ra khi mô hình chạy tiếp trên dữ liệu 2026.', slug: 'du-an-khong-khi-b', title: 'Dự án (B): mạng nơ-ron, đánh giá và triển khai' },
  },
  challenges: [
    {
      level: 1,
      title: 'Dự báo tay một ngày',
      task: 'Với nghiệm đóng của phần tính tay (w = 0,693; b = 0,149, đơn vị chục µg/m³), hôm nay đo được 85 µg/m³. Dự báo cho ngày mai là bao nhiêu µg/m³? Nếu ngày mai thật là 40 µg/m³ (gió mùa về), sai số là bao nhiêu?',
      answer: 'x = 8,5 chục µg/m³ ⇒ ŷ = 0,693·8,5 + 0,149 ≈ 6,04 chục, tức khoảng 60 µg/m³. Sai số = 60 − 40 = 20 µg/m³. Mô hình chỉ dùng bụi hôm nay thì không thể biết gió mùa đang về. Đó là lý do cần thêm thời tiết ngày mai.',
    },
    {
      level: 2,
      title: 'Đổi ngưỡng cảnh báo',
      task: 'Trong lab "Có nên phát cảnh báo", đặt giá bỏ sót bằng 1 (hai loại sai ngang nhau), rồi bằng 10. Ghi ngưỡng rẻ nhất trong từng trường hợp và giải thích sự khác nhau.',
      answer: 'Với giá 1, ngưỡng rẻ nhất là 0,5: hai loại sai ngang nhau thì chọn lớp có xác suất cao hơn. Với giá 10, ngưỡng tụt xuống mức thấp nhất của thanh trượt: cảnh báo gần như mọi ngày có chút nguy cơ, đổi rất nhiều báo nhầm lấy việc gần như không bỏ sót.',
    },
    {
      level: 3,
      title: 'Viết phiếu dữ liệu',
      task: 'Viết "phiếu dữ liệu" (datasheet, chương 3A) cho chỉ số PM2.5 Hà Nội của chương này: ai thu thập, ở đâu, từ khi nào, đã xử lý gì, những hạn chế nào người dùng cần biết.',
      hint: 'Nhìn lại bảng 7 trạm: số trạm thay đổi theo thời gian, trạm 7441 dừng năm 2025, ba trạm mới bắt đầu tháng 7/2025.',
      answer: 'Một phiếu tốt cần nêu: nguồn là các trạm quan trắc tự động của cơ quan nhà nước, lấy qua kho mở OpenAQ; 7 trạm, dùng 5; các quy tắc kiểm soát chất lượng và số dòng mỗi quy tắc loại bỏ; ngưỡng r ≥ 0,7 là lựa chọn chủ quan. Hạn chế quan trọng nhất: <b>số trạm và vị trí trạm thay đổi theo thời gian</b>. Năm 2023 chỉ có 1 trạm; tháng 12/2025 mỗi ngày chỉ có 2–3 trạm đủ số liệu. Vì vậy "chỉ số" không đo cùng một thứ qua các năm, và một phần thay đổi theo thời gian có thể chỉ do đổi trạm.',
    },
  ],
  reflect: [
    'Bước nào trong dự án tốn nhiều công nhất? Nó có phải là bước "học máy" không?',
    'Nếu chỉ được giữ một mô hình để dùng thật, bạn chọn mô hình nào? Vì sao?',
    'Bài học nào ở chương 3A, 3B lúc trước bạn thấy khô khan, giờ thấy rõ ý nghĩa hơn?',
  ],
};
