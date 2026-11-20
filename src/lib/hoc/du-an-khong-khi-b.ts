/**
 * Phần trải nghiệm của chương 12B (dự án bụi mịn Hà Nội: mạng nơ-ron, đánh giá và triển khai).
 * Con số trong đáp án và bảng ghi lấy từ các lab (ml-core) hoặc scripts/prep_ch12.py; tests/ch12.test.ts kiểm tra lại.
 */
import type { LessonLearn } from '../learn';

export const duAnBLearn: LessonLearn = {
  slug: 'du-an-khong-khi-b',
  minutes: 100,
  goals: [
    { text: 'Đánh giá mô hình chuỗi thời gian bằng cross-validation trượt gốc, và giải thích vì sao k-fold xáo trộn cho con số quá lạc quan (chương 8).', see: 'truc-giac' },
    { text: 'Tính tay một ô của tích chập 1D trên dữ liệu 72 giờ, và nhận ra tích chập là "khớp mẫu cục bộ" trên mọi dữ liệu có trật tự (chương 10).', see: 'tinh-tay' },
    { text: 'Đọc trọng số attention của một mô hình dự báo, và biết giới hạn của việc dùng chúng để giải thích (chương 11).', see: 'tinh-tay' },
    { text: 'Nhận ra quá khớp khi huấn luyện mạng nơ-ron trên ít dữ liệu (chương 9).', see: 'ly-thuyet' },
    { text: 'So sánh toàn bộ mô hình trên một bảng xếp hạng và chọn mô hình theo nhiều tiêu chí, không chỉ sai số.', see: 'danh-gia' },
    { text: 'Phát hiện lệch phân phối sau triển khai và nêu được các giả thuyết cạnh tranh.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Chương 10: một bộ lọc 3×3 trượt trên ảnh 28×28 (không đệm). Bản đồ đặc trưng có kích thước bao nhiêu?', options: ['26×26', '28×28', '9×9'], answer: 0, why: 'Mỗi chiều có 28 − 3 + 1 = 26 vị trí đặt bộ lọc.' },
    { q: 'Chương 11: trọng số attention của một truy vấn có tính chất gì?', options: ['Không âm và cộng lại bằng 1 (sau softmax)', 'Luôn bằng nhau', 'Có thể âm'], answer: 0, why: 'Softmax biến các điểm thành một phân phối xác suất trên các vị trí.' },
  ],
  missions: [
    {
      id: 'cv',
      step: 'truc-giac',
      title: 'Cross-validation theo thời gian và xáo trộn',
      predict: {
        q: 'Cùng mô hình gradient boosting, cùng 638 ngày huấn luyện. Cách nào cho MAE trung bình thấp hơn: 5 phần theo thời gian hay 5 phần xáo trộn?',
        options: ['Theo thời gian', 'Xáo trộn', 'Bằng nhau'],
        answer: 1,
        why: 'Xáo trộn cho 7,74, theo thời gian cho 8,72. Mỗi phần xáo trộn có đủ mọi mùa, và ngày cần đoán luôn có "hàng xóm" hôm trước, hôm sau nằm trong phần học. Khi dùng thật, mô hình không bao giờ có hàng xóm tương lai như vậy.',
      },
      tasks: [
        'Ở chế độ theo thời gian, bấm từng lần gập. Phần tím (kiểm định) luôn nằm ở đâu so với phần xám (học)?',
        'Lần gập nào có MAE lớn nhất? Nó rơi vào mùa nào?',
        'Ở lần gập cuối, mô hình có thắng "ngày mai = hôm nay" không?',
        'Ghi MAE trung bình của hai cách.',
      ],
      record: {
        cols: ['MAE trung bình'],
        rows: [
          { label: 'Theo thời gian', values: [8.72] },
          { label: 'Xáo trộn', values: [7.74] },
        ],
        tol: [0.02],
      },
      explain: {
        q: 'Ở lần gập cuối (7–10/2025), gradient boosting thua mốc "ngày mai = hôm nay" (7,73 so với 7,21). Điều đó có nghĩa là nên bỏ mô hình không?',
        answer: 'Chưa. Mùa hè và đầu thu bụi thấp và ổn định, nên chép lại hôm nay đã rất tốt, khó có gì để học thêm. Mô hình chứng tỏ giá trị ở mùa đông (lần gập 3: 11,71 so với 15,86), đúng lúc cảnh báo quan trọng nhất. Nhìn từng phần, thay vì chỉ nhìn trung bình, cho biết mô hình hữu ích ở đâu.',
      },
    },
    {
      id: 'tich-chap',
      step: 'tinh-tay',
      title: 'Một ô của tích chập 1D',
      predict: {
        q: 'Ảnh quần áo ở chương 10 có 2 chiều (hàng, cột). Ở đây, bộ lọc trượt theo mấy chiều?',
        options: ['1 chiều: thời gian', '2 chiều: thời gian và kênh', '3 chiều'],
        answer: 0,
        why: 'Bộ lọc phủ cả 4 kênh cùng lúc nhưng chỉ trượt dọc trục thời gian. Giống như ở ảnh màu, bộ lọc phủ cả 3 kênh RGB nhưng chỉ trượt theo hàng và cột.',
      },
      tasks: [
        'Chọn hôm nay là 8/1/2026. Kéo vị trí t, xem khung vàng trượt trên 4 kênh và cột đen di chuyển trên bản đồ.',
        'Ở một vị trí bất kỳ, mở "Xem từng số hạng" trong thẻ phép tính: có bao nhiêu số hạng (chưa tính độ lệch)?',
        'Đổi giữa 3 bộ lọc. Bộ lọc nào có trọng số PM2.5 dương ở cả 6 giờ, tức là phản ứng mạnh khi bụi cao suốt 6 giờ liền? Giờ nào trong 6 giờ có trọng số lớn nhất?',
        'Ghi dự báo của CNN cho ngày 9/1/2026 và giá trị thật.',
      ],
      record: {
        cols: ['µg/m³'],
        rows: [
          { label: 'Dự báo của CNN', values: [92.8] },
          { label: 'Thật', values: [107.6] },
        ],
        tol: [0.15],
      },
      explain: {
        q: 'Mạng ở đây chỉ có 3 bộ lọc dài 6 giờ, khoảng 100 tham số. Vì sao nó vẫn thắng gradient boosting 300 cây trên bảng xếp hạng?',
        answer: 'Vì nó được xem dữ liệu khác: 72 giờ gần nhất theo từng giờ, thay vì 3 con số trung bình ngày. Nó thấy được bụi đang tăng hay giảm vào tối nay, gió đổi lúc nào. Thông tin mới quan trọng hơn mô hình mạnh hơn: đây chính là câu hỏi "cải thiện dữ liệu hay cải thiện mô hình" của chương 3.',
      },
    },
    {
      id: 'chu-y',
      step: 'tinh-tay',
      title: 'Mô hình attention nhìn vào đâu?',
      predict: {
        q: 'Tính trung bình trên 142 ngày kiểm tra, 24 giờ gần nhất (hôm nay) chiếm bao nhiêu phần trăm sự chú ý trong 72 giờ?',
        options: ['Khoảng 33%, gần như chia đều', 'Khoảng 70%', 'Gần 100%'],
        answer: 0,
        why: 'Khoảng 33%, gần đúng một phần ba, tức là trung bình thì sự chú ý dàn khá đều trên ba ngày. Từng ngày riêng lẻ thì khác hơn: phần của 24 giờ cuối dao động từ 25% đến 42%. Mô hình học được rằng hình dạng của cả ba ngày đều có ích, chứ không chỉ "lúc này".',
      },
      tasks: [
        'Chọn hôm nay là 8/1/2026. Tìm 5 giờ được chú ý nhiều nhất: chúng có phải những giờ PM2.5 cao không?',
        'Bấm vào cột của giờ cuối (23 giờ hôm nay) và mở phép tính điểm: q · k chia cho √4.',
        'Bật "trung bình trên các ngày kiểm tra". Ghi phần trăm của 24 giờ cuối. Trong mỗi ngày, giờ nào được chú ý nhiều nhất?',
      ],
      record: {
        cols: ['%'],
        rows: [{ label: '24 giờ cuối, trung bình', values: [33] }],
        tol: [1],
      },
      explain: {
        q: 'Một bài báo viết: "AI phát hiện bụi lúc 13 giờ hôm qua là nguyên nhân chính của ô nhiễm hôm nay", dựa trên trọng số attention. Bạn phản biện thế nào?',
        answer: 'Trọng số attention cho biết mô hình lấy thông tin từ đâu để tính vector ngữ cảnh, không cho biết đâu là nguyên nhân vật lý. Mô hình có thể chú ý vào một giờ chỉ vì giờ đó tương quan với điều thật sự quan trọng. Ở đây sự chú ý lại dàn khá đều, nên càng không có "giờ chính" nào. Muốn nói về nguyên nhân cần mô hình khí quyển hoặc thí nghiệm, không chỉ đọc attention.',
      },
    },
    {
      id: 'mlp',
      step: 'ly-thuyet',
      title: 'Mạng nơ-ron học thuộc lòng',
      predict: {
        q: 'Mạng 64 nơ-ron ẩn, huấn luyện 100 epoch trên 638 ngày. AUC trên tập kiểm tra sẽ thế nào khi số epoch tăng?',
        options: ['Tăng mãi theo AUC huấn luyện', 'Tăng lúc đầu, rồi giảm', 'Không đổi từ đầu'],
        answer: 1,
        why: 'Với hạt giống 1 và η = 0,05, AUC kiểm tra đạt khoảng 0,934 ở epoch 5 rồi tụt xuống 0,914 ở epoch 100, trong khi AUC huấn luyện tăng lên 0,991. Khoảng cách đó là quá khớp.',
      },
      tasks: [
        'Chọn 64 nơ-ron, bấm "+20 epoch" năm lần. Theo dõi hai đường.',
        'Ghi epoch có AUC kiểm tra cao nhất.',
        'Chuyển sang 4 nơ-ron và lặp lại. Mạng nhỏ có quá khớp ít hơn không?',
      ],
      explain: {
        q: 'Nêu hai cách chống quá khớp mà bạn đã học ở chương 9, và cách nào dùng được ở đây mà không động tới tập kiểm tra.',
        answer: 'Dừng sớm (early stopping) và điều chuẩn L2 (weight decay), ngoài ra còn có thể dùng mạng nhỏ hơn. Muốn dừng sớm đúng cách, phải tách một phần cuối của tập huấn luyện làm tập kiểm định theo thời gian, rồi dừng khi AUC trên phần đó ngừng tăng. Không được nhìn đường tím của tập kiểm tra để chọn epoch.',
      },
    },
    {
      id: 'bang',
      step: 'danh-gia',
      title: 'Bảng xếp hạng cuối cùng',
      predict: {
        q: 'Trên toàn bộ 14 dòng, mô hình nào có MAE thấp nhất trên mùa đông 2025–2026?',
        options: ['Gradient boosting', 'CNN 1D trên 72 giờ', 'Mạng MLP'],
        answer: 1,
        why: 'CNN 1D đạt 9,71, attention 10,21, gradient boosting 11,16, MLP 11,37. Hai mô hình nhìn 72 giờ theo từng giờ đứng đầu, vì chúng có thêm thông tin, không phải vì chúng "thông minh" hơn.',
      },
      tasks: [
        'Sắp theo MAE, rồi theo AUC. Hai thứ tự có giống nhau không?',
        'Đọc ghi chú của dòng CNN và attention: chúng được chấm trên bao nhiêu ngày? Vì sao không phải 144?',
        'Ghi MAE của bốn mô hình đứng đầu.',
      ],
      record: {
        cols: ['MAE (µg/m³)'],
        rows: [
          { label: 'CNN 1D', values: [9.71] },
          { label: 'Attention', values: [10.21] },
          { label: 'Gradient boosting', values: [11.16] },
          { label: 'MLP', values: [11.37] },
        ],
        tol: [0.05],
      },
      explain: {
        q: 'Nếu phải chọn một mô hình để Sở phát cảnh báo hằng ngày, bạn chọn mô hình nào? Nêu ít nhất ba tiêu chí ngoài MAE.',
        answer: 'Không có đáp án duy nhất. Các tiêu chí nên cân nhắc: (1) dữ liệu đầu vào có sẵn đúng giờ không, vì CNN cần đủ 72 giờ liên tục, thiếu vài giờ là không chạy được, còn hồi quy tuyến tính chỉ cần 3 số trung bình ngày; (2) giải thích được cho người dân và lãnh đạo không; (3) có bền khi thay đổi trạm đo không; (4) chi phí học lại và bảo trì. Một lựa chọn hợp lý là dùng CNN làm dự báo chính và hồi quy tuyến tính làm phương án dự phòng khi thiếu số liệu.',
      },
    },
    {
      id: 'troi',
      step: 'danh-gia',
      title: 'Khi thế giới thay đổi',
      predict: {
        q: 'Gradient boosting chỉ được học trên các tháng 5–9 (mùa sạch), rồi dự báo mùa đông. MAE sẽ thế nào so với mô hình học trên mọi tháng (11,16)?',
        options: ['Gần bằng', 'Tệ hơn khoảng 40%', 'Tốt hơn'],
        answer: 1,
        why: 'MAE là 15,59, tệ hơn 40% và gần bằng mốc "ngày mai = hôm nay". Mô hình chưa từng thấy ngày nào quá 74 µg/m³, trong khi mùa đông có ngày lên 171. Cây quyết định không ngoại suy được ra ngoài vùng đã thấy.',
      },
      tasks: [
        'Đọc bảng thứ nhất: ghi MAE của hai cách học.',
        'Ở biểu đồ sau triển khai, bật "độ lệch". Từ tháng nào độ lệch luôn dương?',
        'So cột "Số trạm TB" trước và sau tháng 7/2026.',
      ],
      record: {
        cols: ['MAE mùa đông'],
        rows: [
          { label: 'Chỉ học tháng 5–9', values: [15.59] },
          { label: 'Học mọi tháng', values: [11.16] },
        ],
        tol: [0.02],
      },
      explain: {
        q: 'Mô hình dự báo cao hơn thực tế đều đặn từ giữa năm 2026. Nêu ba giả thuyết, và với mỗi giả thuyết, cho biết cần dữ liệu gì để kiểm tra.',
        answer: '(1) Không khí sạch hơn thật, ví dụ nếu lộ trình hạn chế xe máy chạy xăng trong Vành đai 1 (Chỉ thị 20/CT-TTg) đã được thực hiện: kiểm tra bằng cách so riêng các trạm trong và ngoài Vành đai 1, và so với các thành phố không có chính sách đó. (2) Thời tiết năm 2026 khác thường: so phân phối gió, mưa, lớp biên với các năm trước. (3) Thay đổi trạm: trạm Nguyễn Văn Cừ ngừng từ tháng 7/2026, nên tính lại chỉ số chỉ từ những trạm có mặt suốt cả giai đoạn. Đây là suy luận nhân quả, khó hơn dự báo rất nhiều: một mô hình dự báo tốt không tự trả lời được câu hỏi "vì sao".',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'TimeSeriesSplit 5 phần trên 638 ngày: phần kiểm định đầu tiên học trên bao nhiêu ngày?', options: ['108 ngày', '510 ngày', 'Toàn bộ 638 ngày'], answer: 0, why: 'Mỗi phần kiểm định có ⌊638/6⌋ = 106 ngày; 5 phần kiểm định chiếm 530 ngày cuối, nên phần đầu học trên 638 − 530 = 108 ngày.' },
    'tinh-tay': { q: 'Cửa sổ 72 giờ, bộ lọc dài 6 giờ, không đệm. Bản đồ đặc trưng dài bao nhiêu?', options: ['67', '72', '12'], answer: 0, why: '72 − 6 + 1 = 67 vị trí.' },
    'ly-thuyet': { q: 'Mạng có AUC huấn luyện 0,99 và AUC kiểm tra 0,91. Điều gì đang xảy ra?', options: ['Quá khớp', 'Chưa khớp', 'Rò rỉ dữ liệu'], answer: 0, why: 'Khoảng cách lớn giữa điểm huấn luyện và điểm kiểm tra là dấu hiệu quá khớp.' },
    'ma-nguon': { q: 'Trong TimeSeriesSplit, tham số gap dùng để làm gì?', options: ['Bỏ một khoảng ngay trước phần kiểm định, để đặc trưng trễ không chồng lên phần kiểm định', 'Tăng số phần', 'Xáo trộn dữ liệu'], answer: 0, why: 'Đặc trưng như "trung bình 7 ngày" của ngày đầu phần kiểm định dùng những ngày nằm trong phần học. Một khoảng trống giúp hai phần tách bạch hơn.' },
  },
  codeTasks: [
    {
      title: 'Cross-validation có khoảng trống',
      task: 'Đổi <code>TimeSeriesSplit(5)</code> thành <code>TimeSeriesSplit(5, gap=7)</code> rồi chạy lại.',
      answer: 'MAE từng phần thay đổi rất ít (dưới 0,5). Với mô hình này, rò rỉ qua đặc trưng trễ 7 ngày ở biên các phần là nhỏ. Nhưng khi đặc trưng dùng cửa sổ dài hơn (30, 90 ngày), khoảng trống trở nên quan trọng.',
    },
    {
      title: 'MLP có dừng sớm',
      task: 'Trong ô mã, MLPRegressor đã bật <code>early_stopping=True</code>. Tắt đi (<code>early_stopping=False</code>) và giữ <code>max_iter=3000</code>. MAE trên tập kiểm tra thay đổi thế nào?',
      answer: 'Bất ngờ: MAE <b>giảm</b> nhẹ, từ 11,37 xuống 11,21. Lý do: mạng đã có điều chuẩn L2 rất mạnh (<code>alpha=1.0</code>), nên dù chạy bao lâu nó cũng không học thuộc được. Dừng sớm và điều chuẩn là hai cách cùng chống quá khớp; có một cách đủ mạnh thì cách kia ít tác dụng. Hãy thử thêm <code>alpha=0.0001</code> để thấy dừng sớm quan trọng trở lại.',
    },
  ],
  quiz: [
    { q: 'Vì sao k-fold xáo trộn cho MAE thấp hơn cross-validation theo thời gian trên cùng dữ liệu?', options: ['Ngày kiểm định có hàng xóm tương lai trong phần học', 'Vì k-fold dùng nhiều dữ liệu hơn', 'Vì k-fold không có mùa đông'], answer: 0, why: 'Bụi hôm trước và hôm sau rất giống nhau; xáo trộn cho mô hình biết cả hai.' },
    { q: 'CNN 1D ở đây dùng hai số từ mỗi bản đồ đặc trưng: trung bình và giá trị cuối. Giá trị cuối tương ứng với giờ nào?', options: ['6 giờ cuối của hôm nay (18–23 giờ)', '6 giờ đầu của cửa sổ', 'Giờ có bụi cao nhất'], answer: 0, why: 'Vị trí cuối của bản đồ là bộ lọc đặt trên 6 giờ cuối cùng của cửa sổ, tức 18–23 giờ hôm nay.' },
    { q: 'Mô hình học chỉ mùa hè dự báo mùa đông kém. Đây là loại vấn đề gì?', options: ['Lệch phân phối giữa train và test', 'Rò rỉ dữ liệu', 'Nhãn sai'], answer: 0, why: 'Dữ liệu dùng thật nằm ngoài vùng mô hình đã học (chương 3A, tiêu chí "đại diện cho nơi sẽ dùng").' },
    { q: 'Vận dụng: bạn triển khai CNN, và một sáng nọ trạm đo mất 5 giờ số liệu đêm qua. Bạn làm gì?', options: ['Dùng mô hình dự phòng chỉ cần số liệu ngày (như hồi quy tuyến tính), và ghi lại sự cố', 'Điền bằng nội suy hai phía', 'Không phát dự báo hôm đó'], answer: 0, why: 'Nội suy hai phía không làm được vì chưa có số liệu sau. Một mô hình dự phòng đơn giản tốt hơn là im lặng đúng lúc người dân cần.' },
    { q: 'Vận dụng: sau một năm, mô hình bắt đầu dự báo cao hơn thực tế đều đặn. Việc đầu tiên nên làm là gì?', options: ['Kiểm tra dữ liệu đầu vào (trạm, cảm biến) trước khi kết luận thế giới đã đổi', 'Huấn luyện mô hình lớn hơn', 'Tuyên bố chính sách thành công'], answer: 0, why: 'Thay đổi trong cách đo thường gặp hơn và dễ kiểm tra hơn thay đổi trong thực tế.' },
  ],
  takeaways: {
    points: [
      'Với chuỗi thời gian, chỉ có <b>cross-validation theo thời gian</b> mô phỏng đúng cách mô hình được dùng. Xem sai số từng phần, đừng chỉ xem trung bình.',
      '<b>Tích chập 1D</b> là khớp mẫu cục bộ dọc thời gian: cùng một ý tưởng với ảnh, chỉ bớt một chiều.',
      '<b>Attention</b> cho biết mô hình lấy thông tin từ đâu, không cho biết nguyên nhân.',
      'Hai mô hình đứng đầu thắng vì <b>được xem dữ liệu chi tiết hơn</b> (theo giờ), không phải vì kiến trúc phức tạp hơn.',
      'Triển khai không phải là kết thúc: <b>theo dõi sai số và độ lệch theo tháng</b>, và kiểm tra dữ liệu đầu vào trước khi kết luận thế giới đã đổi.',
    ],
    use: [
      'CNN 1D: chuỗi đều đặn, mẫu hình cục bộ (tăng dần, sụt nhanh)',
      'Attention: chuỗi dài, cần nối thông tin xa nhau',
      'Mô hình đơn giản làm dự phòng khi dữ liệu chi tiết bị thiếu',
    ],
    avoid: [
      'k-fold xáo trộn cho dữ liệu có thời gian',
      'Mạng lớn trên vài trăm mẫu mà không dừng sớm hay điều chuẩn',
      'Đọc trọng số attention như nguyên nhân, hay đọc sai số giảm như bằng chứng chính sách thành công',
    ],
  },
  challenges: [
    {
      level: 1,
      title: 'Kích thước tham số',
      task: 'Đếm số tham số của CNN trong bài: 3 bộ lọc 6×4, mỗi bộ lọc một độ lệch, lớp cuối nhận 6 đặc trưng tích chập và 7 đặc trưng thời tiết, cộng một hệ số chặn.',
      answer: '3·6·4 = 72 trọng số bộ lọc + 3 độ lệch + 6 hệ số cho đặc trưng tích chập + 7 hệ số thời tiết + 1 hệ số chặn = 89 tham số. Gradient boosting 300 cây sâu 3 lưu tới 300 × (7 ngưỡng + 8 giá trị lá) = 4.500 con số. Mô hình nhỏ hơn 50 lần vẫn thắng, nhờ được xem dữ liệu chi tiết hơn.',
    },
    {
      level: 2,
      title: 'Thử nhiều hạt giống',
      task: 'Trong lab MLP, với 16 nơ-ron, chạy 20 epoch cho 5 hạt giống khác nhau (bấm "Khởi tạo lại"). Ghi AUC kiểm tra cuối cùng của mỗi lần. Khoảng dao động là bao nhiêu, và so với khoảng cách giữa các mô hình trên bảng xếp hạng thì sao?',
      answer: 'Với hạt giống 1 đến 5, AUC kiểm tra sau 20 epoch nằm trong khoảng 0,915–0,929, dao động 0,014. Con số này lớn hơn khoảng cách giữa nhiều dòng của bảng xếp hạng (logistic 0,935, KNN 0,929, boosting 0,929). Bài học: trước khi tuyên bố mô hình A hơn B, hãy chạy lại với nhiều hạt giống và nhiều giai đoạn kiểm tra.',
    },
    {
      level: 3,
      title: 'Phiếu mô hình',
      task: 'Viết "phiếu mô hình" (model card) một trang cho mô hình bạn chọn ở nhiệm vụ "Bảng xếp hạng cuối cùng": mục đích, dữ liệu học, cách đánh giá, kết quả theo mùa, giới hạn, khi nào không nên dùng, ai chịu trách nhiệm theo dõi.',
      hint: 'Phiếu mô hình do Mitchell và cộng sự đề xuất năm 2019, cùng tinh thần với phiếu dữ liệu ở chương 3A.',
      answer: 'Một phiếu tốt phải nêu rõ: chỉ dự báo trung bình toàn thành phố, không dự báo cho từng quận; sai số mùa đông khoảng 10 µg/m³ nhưng đó là với thời tiết ngày mai hoàn hảo; không dùng được khi thiếu số liệu theo giờ; học trên 2023–2025 với số trạm thay đổi theo thời gian; độ lệch dương từ giữa năm 2026 cần được theo dõi; và phải có lịch học lại (ví dụ mỗi đầu mùa đông).',
    },
  ],
  reflect: [
    'Sau 14 chặng, công cụ nào bạn thấy hữu ích nhất cho bài toán này? Công cụ nào hoá ra không cần?',
    'Nếu được thêm một loại dữ liệu, bạn muốn thêm gì: thêm trạm, ảnh vệ tinh, số liệu giao thông, hay số liệu đốt rơm rạ? Vì sao?',
    'Hãy chọn một bài toán ở địa phương bạn có thể làm theo đúng quy trình của chương này. Bước nào sẽ khó nhất?',
  ],
};
