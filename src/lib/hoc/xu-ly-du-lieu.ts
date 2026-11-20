/**
 * Phần trải nghiệm của chương 3B (Xử lý dữ liệu). Số trong bảng ghi tính lại bằng tests/helpers/dulieu-labs.ts,
 * chép đúng logic các lab; số dùng scikit-learn ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const xuLyLearn: LessonLearn = {
  slug: 'xu-ly-du-lieu',
  minutes: 90,
  goals: [
    { text: 'Chọn cách điền giá trị thiếu theo lý do bị thiếu, và đo được cách điền có đáng công không.', see: 'truc-giac' },
    { text: 'Mã hoá cột phân loại bằng one-hot và chọn phép biến đổi thang đo phù hợp (z, min-max, log).', see: 'tinh-tay' },
    { text: 'Nhận ra ba dạng rò rỉ dữ liệu và phòng chúng bằng pipeline.', see: 'ly-thuyet' },
    { text: 'Chọn cách chia train/test mô phỏng đúng nơi mô hình sẽ được dùng.', see: 'danh-gia' },
    { text: 'Đọc đường cong học để quyết định: thêm dữ liệu, làm sạch dữ liệu, hay đổi mô hình.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Người thu nhập rất cao thường không khai thu nhập. Đây là kiểu thiếu nào?', options: ['MCAR', 'MAR', 'MNAR'], answer: 2, why: 'Bài 3A: thiếu phụ thuộc vào chính giá trị bị thiếu là MNAR.' },
    { q: 'Trong bài 3A, mô hình phân biệt hai vùng đạt AUC 0,887. Điều đó nói gì?', options: ['Hai vùng rất khác nhau; đánh giá ở vùng này không dùng được cho vùng kia', 'Mô hình giá nhà rất tốt', 'Cần thêm dữ liệu'], answer: 0, why: 'AUC gần 1 nghĩa là dễ phân biệt hai tập — chúng có phân phối khác nhau.' },
  ],
  missions: [
    {
      id: 'dien',
      step: 'truc-giac',
      title: 'Năm cách điền 207 ô thiếu',
      predict: {
        q: 'Đổi cách điền 207 ô phòng ngủ từ trung vị sang KNN (5 láng giềng). Sai số đoán lại ô thiếu (MAE) và sai số mô hình giá nhà (RMSE) thay đổi thế nào?',
        options: ['Cả hai cùng giảm mạnh', 'MAE giảm gần 8 lần, nhưng RMSE gần như không đổi', 'Cả hai gần như không đổi'],
        answer: 1,
        why: 'MAE giảm từ 272,7 xuống 36,1 phòng — KNN đoán giỏi hơn hẳn. Nhưng RMSE của mô hình giá nhà chỉ từ 0,6699 xuống 0,6631, khoảng 1%.',
      },
      tasks: [
        'Đọc bảng: ghi MAE và RMSE của <b>Trung vị</b> và <b>KNN</b>. So với dòng <b>Bỏ dòng thiếu</b>.',
        'Kéo thanh "Ô thiếu thứ…": xem 5 khu vực láng giềng mà KNN dùng để điền một ô.',
        'Ở lab Titanic: tuổi trung vị của nhóm "cậu bé" (Master) là bao nhiêu, so với cả tàu?',
      ],
      record: {
        cols: ['MAE đoán lại (phòng)', 'RMSE mô hình giá nhà'],
        rows: [
          { label: 'Trung vị', values: [272.7, 0.6699] },
          { label: 'KNN, 5 láng giềng', values: [36.1, 0.6631] },
        ],
        tol: [0.06, 0.0006],
      },
      explain: {
        q: 'KNN đoán số phòng ngủ giỏi gần gấp 8 lần, vậy sao mô hình giá nhà gần như không tốt lên? Khi nào cách điền mới thực sự quan trọng?',
        answer: 'Chỉ 207/20.640 dòng (1%) bị thiếu, và số phòng ngủ tương quan 0,93 với số phòng — một cột mô hình đã có. Điền tốt hay dở thì mô hình cũng không mất mấy thông tin. Cách điền quan trọng khi tỷ lệ thiếu lớn, khi cột thiếu là đặc trưng quan trọng, hoặc khi thiếu không ngẫu nhiên. Ví dụ Titanic: 20% hành khách thiếu tuổi, và điền tuổi chung 28 cho một cậu bé (nhóm Master có trung vị 3,5 tuổi) là sai lệch rất lớn trong một bài toán mà "trẻ em được cứu trước".',
      },
    },
    {
      id: 'mahoa',
      step: 'tinh-tay',
      title: 'Mã hoá vị trí: số thứ tự hay one-hot?',
      predict: {
        q: 'Mã hoá vị trí thành số thứ tự 0–4 thay vì one-hot. So với bỏ hẳn cột vị trí, RMSE thế nào?',
        options: ['Tốt hơn hẳn', 'Gần như bằng khi bỏ cột', 'Tệ hơn nhiều so với bỏ cột'],
        answer: 1,
        why: 'Bỏ cột: 0,6779. Số thứ tự: 0,6774 — gần như vô ích. One-hot: 0,6699. Số thứ tự bịa ra rằng "Gần vịnh" (3) lớn gấp ba "Nội địa" (1), và mô hình tuyến tính buộc giá phải tăng đều theo con số bịa đó.',
      },
      tasks: [
        'Đọc bảng mã hoá: ghi RMSE của ba cách.',
        'Xem ví dụ one-hot của 4 khu vực: mỗi dòng có mấy số 1?',
        'Ở biểu đồ Gradient Descent: thang đo nào hội tụ nhanh nhất? So biểu đồ dân số trước và sau khi lấy log.',
      ],
      record: {
        cols: ['RMSE'],
        rows: [
          { label: 'Bỏ cột vị trí', values: [0.6779] },
          { label: 'Số thứ tự 0–4', values: [0.6774] },
          { label: 'One-hot', values: [0.6699] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'Khi nào dùng số thứ tự là hợp lý, khi nào phải dùng one-hot?',
        answer: 'Số thứ tự hợp lý khi các loại thật sự có thứ tự và khoảng cách gần đều, như mức học vấn hay hạng vé (1, 2, 3). Khi các loại chỉ là tên gọi — vị trí, màu sắc, tỉnh thành — phải dùng one-hot để mỗi loại có trọng số riêng. Với cây quyết định, số thứ tự ít hại hơn vì cây có thể chia nhiều lần, nhưng với mô hình tuyến tính và KNN thì nó bịa ra khoảng cách không tồn tại.',
      },
    },
    {
      id: 'rori',
      step: 'danh-gia',
      title: 'Rò rỉ dữ liệu: điểm đẹp trên giấy',
      predict: {
        q: 'Thêm cột "phân khúc giá" mà đồng nghiệp đã gắn (tính từ chính giá nhà). Điểm báo cáo trên tập test và sai số khi dùng thật sẽ thế nào?',
        options: ['Cả hai đều tốt lên', 'Điểm test đẹp lên rất nhiều, nhưng khi dùng thật còn tệ hơn mô hình gốc', 'Không đổi gì'],
        answer: 1,
        why: 'RMSE test giảm từ 0,648 xuống 0,275 — trông như mô hình tốt gấp đôi. Nhưng khi dùng thật, phân khúc chưa có vì chưa biết giá, và RMSE vọt lên 1,149, gần gấp đôi mô hình gốc (0,701).',
      },
      tasks: [
        'Với cỡ ô 0,05°, ghi RMSE test và RMSE dùng thật của: Mô hình gốc, giá trung bình ô lưới tính trên cả train và test, và cột phân khúc giá.',
        'Bấm từng dòng để đọc vì sao nó rò rỉ — hoặc không.',
        'Kéo cỡ ô lên 0,5°: khoảng chênh của cột giá trung bình rò rỉ thay đổi thế nào? Vì sao?',
      ],
      record: {
        cols: ['RMSE báo cáo (test)', 'RMSE khi dùng thật'],
        rows: [
          { label: 'Mô hình gốc', values: [0.6482, 0.701] },
          { label: 'Giá trung bình ô lưới, tính trên cả train và test', values: [0.4705, 0.5849] },
          { label: 'Cột phân khúc giá', values: [0.2747, 1.1489] },
        ],
        tol: [0.0006, 0.0006],
      },
      explain: {
        q: 'Câu hỏi nào giúp phát hiện rò rỉ trước khi quá muộn? Dấu hiệu nào trong kết quả nên làm bạn nghi ngờ?',
        answer: 'Với từng cột, hỏi: "Lúc cần dự đoán, cột này đã có giá trị chưa?" Phân khúc giá chỉ có sau khi biết giá — rò rỉ. Dấu hiệu trong kết quả: điểm tốt đến khó tin, hoặc một cột mạnh bất thường. Cách phòng: đặt mọi bước học tham số vào pipeline, và nếu được, giữ một tập "tương lai" tách biệt hẳn. Với giá trung bình ô lưới, ô càng nhỏ thì trung bình càng gần chính giá của khu vực đó, nên rò rỉ càng nặng; ô 0,5° gần như không còn chênh.',
      },
    },
    {
      id: 'chia',
      step: 'danh-gia',
      title: 'Ba cách chia, ba con số',
      predict: {
        q: 'Chia train/test theo ô địa lý 1° thay vì ngẫu nhiên. RMSE của mô hình KNN (theo kinh độ, vĩ độ, thu nhập) sẽ thế nào?',
        options: ['Gần như không đổi', 'Tăng khoảng 60%', 'Giảm'],
        answer: 1,
        why: 'Từ 0,555 lên 0,879. Khi chia ngẫu nhiên, 54,5% khu vực test trùng toạ độ với một khu vực train — KNN chỉ cần "nhớ" láng giềng. Chia theo ô thì 0% trùng: tập test là những vùng hoàn toàn mới.',
      },
      tasks: [
        'Bấm lần lượt ba cách chia, ghi RMSE và tỷ lệ khu vực test trùng toạ độ với tập train.',
        'Nhìn bản đồ: ở cách chia theo ô, các khu vực test (chấm tím) nằm thế nào?',
        'Nếu mô hình sẽ dùng để định giá ở một thành phố mới, con số nào trung thực?',
      ],
      record: {
        cols: ['RMSE', 'Trùng toạ độ (%)'],
        rows: [
          { label: 'Ngẫu nhiên', values: [0.555, 54.5] },
          { label: 'Phân tầng theo giá', values: [0.551, 54.4] },
          { label: 'Theo ô địa lý 1°', values: [0.879, 0] },
        ],
        tol: [0.0006, 0.06],
      },
      explain: {
        q: 'Vì sao "phân tầng theo giá" không giải quyết được vấn đề, dù nó làm phân phối giá ở hai tập khớp nhau tuyệt đối?',
        answer: 'Phân tầng chỉ cân bằng tỷ lệ giá, nhưng vẫn để các khu vực "anh em" (cùng toạ độ, sát nhau) rơi vào cả hai tập: tỷ lệ trùng vẫn 54,4%. Vấn đề không phải là phân phối giá, mà là sự phụ thuộc giữa các dòng. Khi dữ liệu có nhóm (cùng nơi, cùng người, cùng thời điểm), phải chia theo nhóm. Mô phỏng nơi dùng thật quan trọng hơn làm hai tập "đẹp".',
      },
    },
    {
      id: 'nhieu',
      step: 'danh-gia',
      title: 'Nhiều dữ liệu hơn hay dữ liệu tốt hơn?',
      predict: {
        q: 'Tăng số mẫu huấn luyện từ 2.000 lên 16.512 (gấp 8 lần). Sai số kiểm định của hồi quy tuyến tính thay đổi thế nào?',
        options: ['Giảm gần một nửa', 'Gần như không đổi', 'Tăng lên'],
        answer: 1,
        why: 'Chỉ từ 0,670 xuống 0,668: sai số huấn luyện và kiểm định đã gặp nhau, mô hình tuyến tính bị giới hạn bởi chính nó. KNN thì khác: từ 0,660 xuống 0,556 — vẫn còn học được từ dữ liệu mới.',
      },
      tasks: [
        'Đọc bảng đường cong học: ghi sai số kiểm định của tuyến tính và KNN ở n = 200 và n = 16.512.',
        'Ở bảng Breast Cancer: so ô "100 mẫu, 0% nhiễu" với ô "455 mẫu, 30% nhiễu".',
        'Kết luận cho từng mô hình: nên đầu tư thêm dữ liệu, làm sạch nhãn, hay thêm đặc trưng?',
      ],
      record: {
        cols: ['Tuyến tính', 'KNN'],
        rows: [
          { label: 'n = 200', values: [0.699, 0.798] },
          { label: 'n = 16.512', values: [0.668, 0.556] },
        ],
        tol: [0.0006, 0.0006],
      },
      explain: {
        q: '100 mẫu sạch đạt 99,1%, còn 455 mẫu với 30% nhãn sai chỉ đạt 89,5%. Bài học là gì?',
        answer: 'Dữ liệu ít mà sạch có thể thắng dữ liệu nhiều gấp 4,5 lần mà bẩn. Mỗi nhãn sai không chỉ vô ích mà còn kéo mô hình đi sai hướng: với 30% nhãn lật, mỗi nhãn chỉ còn mang 1 − 2 × 0,3 = 0,4 phần thông tin. Trước khi thu thập thêm, hãy hỏi: đường cong học còn đi xuống không (nếu đã phẳng thì thêm dữ liệu vô ích), và nhãn hiện có sạch đến đâu.',
      },
    },
    {
      id: 'truocsau',
      step: 'danh-gia',
      title: 'Mỗi bước xử lý đáng bao nhiêu?',
      predict: {
        q: 'Bước nào trong dây chuyền giảm RMSE (chia ngẫu nhiên) nhiều nhất?',
        options: ['Thêm 7 cột số còn lại', 'Mã hoá one-hot vị trí', 'Thêm đặc trưng tự thiết kế'],
        answer: 0,
        why: 'Thêm 7 cột số: 0,837 → 0,698 (−16,7%). One-hot: −1,3%. Đặc trưng tự thiết kế: −3,0%. Bỏ 965 khu vực bị chặn trần giảm thêm 11,3% — nhưng là vì đổi bài toán, không phải vì mô hình giỏi hơn.',
      },
      tasks: [
        'Ghi RMSE ngẫu nhiên và theo vùng của dòng đầu ("Chỉ dùng thu nhập") và dòng thứ tư ("+ đặc trưng tự thiết kế").',
        'Cột "theo vùng" luôn lớn hơn cột "ngẫu nhiên". Vì sao?',
        'Đọc ghi chú của dòng cuối. Bạn có báo cáo con số 0,593 cho sếp không? Kèm điều kiện gì?',
      ],
      record: {
        cols: ['Ngẫu nhiên', 'Theo vùng'],
        rows: [
          { label: 'Chỉ dùng thu nhập', values: [0.8374, 0.8542] },
          { label: '+ đặc trưng tự thiết kế', values: [0.6679, 0.6934] },
        ],
        tol: [0.0006, 0.0006],
      },
      explain: {
        q: 'Cùng một mô hình hồi quy tuyến tính, RMSE giảm từ 0,837 xuống 0,668 chỉ nhờ xử lý dữ liệu. Điều đó trả lời câu hỏi xuyên suốt chương thế nào?',
        answer: 'Với bài toán này, cải thiện dữ liệu (thêm cột phù hợp, mã hoá đúng, thiết kế đặc trưng) giảm sai số 20% mà không đổi một dòng thuật toán. Nhưng các bước không ngang nhau: thêm thông tin mới (7 cột) đáng giá nhất, còn tinh chỉnh cách biểu diễn chỉ thêm vài phần trăm. Và luôn báo cáo con số "theo vùng" nếu mô hình sẽ dùng cho vùng mới; báo con số đẹp hơn là một dạng tự lừa mình.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'Điền ô thiếu bằng trung vị là đang giả định điều gì?', options: ['Ô trống trông giống một khu vực điển hình', 'Ô trống bằng 0', 'Ô trống là lỗi nhập liệu'], answer: 0, why: 'Mọi cách điền là một giả định về lý do ô bị trống. Trung vị giả định "không có gì đặc biệt" về các ô trống.' },
    'tinh-tay': { q: 'Cột vị trí có 5 loại. Mã hoá one-hot, bỏ một loại làm mốc, tạo ra mấy cột?', options: ['1', '4', '5'], answer: 1, why: 'Mỗi loại còn lại một cột 0/1; loại làm mốc được nhận ra khi cả 4 cột đều bằng 0.' },
    'ly-thuyet': { q: 'Bạn chuẩn hoá toàn bộ dữ liệu rồi mới chia train/test. Đó là lỗi gì?', options: ['Rò rỉ: trung bình và độ lệch chuẩn đã "nhìn thấy" tập test', 'Không có lỗi', 'Quá khớp'], answer: 0, why: 'Mọi tham số của bước xử lý phải học từ tập huấn luyện. Với hồi quy tuyến tính, lỗi này tình cờ vô hại, nhưng với nhiều bước khác thì không.' },
    'ma-nguon': { q: 'Vì sao đặt mọi bước xử lý vào Pipeline?', options: ['Để cross-validation học chúng chỉ trên phần huấn luyện của từng lượt', 'Để chạy nhanh hơn', 'Để in kết quả đẹp hơn'], answer: 0, why: 'cross_val_score gọi fit của cả chuỗi trên từng phần huấn luyện, nên trung vị, trung bình, độ lệch chuẩn không bao giờ thấy phần kiểm định.' },
  },
  codeTasks: [
    {
      title: 'Bỏ biến đổi log',
      task: 'Xoá dòng <code>("log", …)</code> trong <code>ColumnTransformer</code> rồi chạy lại. Đoán trước: RMSE tăng nhiều hay ít?',
      answer: 'Tăng rất ít: chia ngẫu nhiên từ 0,6863 lên 0,6886, theo vùng từ 0,7131 lên 0,7149. Log giúp với cột lệch phải, nhưng ở đây thu nhập và dân số đã có trong nhóm "so" — log chỉ thêm một chút đường cong.',
    },
    {
      title: 'Cố ý gây rò rỉ',
      task: 'Thêm <code>df["phan_khuc"] = np.minimum(4, np.floor(y))</code> trước khi tạo <code>xu_ly</code>, và thêm <code>"phan_khuc"</code> vào danh sách <code>so</code>. Chạy lại. Cross-validation có phát hiện được rò rỉ không?',
      answer: 'RMSE tụt xuống khoảng 0,274 (ngẫu nhiên) và 0,277 (theo vùng) — "tốt" gấp hai rưỡi. Cross-validation <b>không</b> phát hiện được, vì cột rò rỉ có mặt ở cả phần huấn luyện lẫn kiểm định. Pipeline chỉ chặn rò rỉ từ bước xử lý; rò rỉ nằm sẵn trong cột thì chỉ con người phát hiện được, bằng câu hỏi "lúc dự đoán, cột này đã có chưa?".',
    },
    {
      title: 'KNN và cách chia',
      task: 'Thay <code>LinearRegression()</code> bằng <code>KNeighborsRegressor(10)</code> (nhớ import từ <code>sklearn.neighbors</code>), và cho <code>xu_ly</code> chỉ chuẩn hoá ba cột <code>["lon", "lat", "income"]</code>. So hai cách chia.',
      answer: 'Chia ngẫu nhiên: 0,560. Theo vùng: 0,757 — chênh 35%, so với chỉ 4% của hồi quy tuyến tính. Mô hình càng giỏi "nhớ láng giềng", chia sai cách càng thổi phồng điểm số. Đúng như lab chia train/test ở bước 7.',
      code: `from sklearn.neighbors import KNeighborsRegressor
xu_ly = ColumnTransformer([("s", StandardScaler(), ["lon", "lat", "income"])])
mo_hinh = make_pipeline(xu_ly, KNeighborsRegressor(10))`,
    },
  ],
  quiz: [
    { q: 'Bạn điền ô thiếu bằng trung vị tính trên toàn bộ dữ liệu, rồi mới chia train/test. Vấn đề là gì?', options: ['Không có vấn đề vì trung vị không bị ngoại lai kéo lệch', 'Trung vị đã dùng thông tin của tập test: một dạng rò rỉ', 'Trung vị làm sai kiểu dữ liệu'], answer: 1, why: 'Mọi tham số của bước xử lý phải học từ tập huấn luyện. Ở đây ảnh hưởng nhỏ, nhưng thói quen này với các bước mạnh hơn (chọn đặc trưng, mã hoá theo nhãn) có thể thổi phồng điểm số rất nhiều.' },
    { q: 'Đường cong học: sai số huấn luyện và kiểm định đã gặp nhau và nằm ngang từ 1.000 mẫu. Nên làm gì?', options: ['Thu thập thêm 100.000 mẫu', 'Thêm đặc trưng tốt hơn hoặc dùng mô hình linh hoạt hơn', 'Giảm số mẫu cho nhanh'], answer: 1, why: 'Hai đường gặp nhau và phẳng nghĩa là mô hình bị giới hạn bởi độ phức tạp của nó (bias). Thêm dữ liệu không thay đổi được điều đó.' },
    { q: 'Dữ liệu ảnh y tế có 3 ảnh cho mỗi bệnh nhân. Chia train/test thế nào?', options: ['Ngẫu nhiên theo ảnh', 'Theo bệnh nhân: cả 3 ảnh của một người vào cùng một tập', 'Phân tầng theo độ sáng ảnh'], answer: 1, why: 'Ba ảnh của cùng một người rất giống nhau. Chia theo ảnh, mô hình có thể nhận ra người thay vì nhận ra bệnh, và điểm test sẽ cao giả tạo.' },
    { q: 'Vận dụng: bạn dự báo doanh số tuần tới của một cửa hàng từ dữ liệu 3 năm. Chia train/test thế nào?', options: ['Ngẫu nhiên 80/20 theo tuần', 'Theo thời gian: học trên các tuần trước, kiểm tra trên các tuần sau', 'Phân tầng theo doanh số'], answer: 1, why: 'Khi dùng thật, mô hình chỉ biết quá khứ. Chia ngẫu nhiên cho phép nó "nhìn thấy" tuần sau để đoán tuần trước — một dạng rò rỉ theo thời gian.' },
    { q: 'Vận dụng: mô hình dự đoán khách hàng rời bỏ dịch vụ đạt độ chính xác 99%. Đặc trưng mạnh nhất là "số ngày kể từ lần đăng nhập cuối". Bạn nên nghi ngờ gì?', options: ['Không có gì đáng ngờ', 'Có thể rò rỉ: khách đã rời bỏ thì tất nhiên không đăng nhập; cần tính đặc trưng tại thời điểm trước khi biết kết quả', 'Mô hình quá đơn giản'], answer: 1, why: 'Điểm tốt đến khó tin là dấu hiệu rò rỉ. Hỏi: tại thời điểm cần dự đoán (trước khi khách rời bỏ), cột này có giá trị như trong dữ liệu không?' },
  ],
  takeaways: {
    points: [
      'Mỗi cách điền ô thiếu là một <b>giả định</b> về lý do bị thiếu. Đo xem nó có đáng công không: KNN đoán giỏi gấp 8 lần nhưng chỉ cải thiện mô hình 1%, vì chỉ 1% dòng bị thiếu.',
      'Cột phân loại không có thứ tự: dùng <b>one-hot</b>. Cột lệch phải: thử <b>log</b>. Gradient Descent: <b>chuẩn hoá</b>.',
      '<b>Rò rỉ dữ liệu</b> làm điểm test đẹp mà dùng thật thì tệ (0,275 trên giấy, 1,149 thực tế). Hỏi "lúc dự đoán, cột này đã có chưa?" và đặt mọi bước vào pipeline.',
      'Tập test phải <b>mô phỏng nơi dùng thật</b>: dữ liệu có nhóm thì chia theo nhóm, dữ liệu theo thời gian thì chia theo thời gian.',
      '<b>Đường cong học</b> cho biết nên làm gì: đã phẳng thì đổi mô hình hoặc thêm đặc trưng; còn dốc thì thêm dữ liệu. Và dữ liệu sạch thường đáng giá hơn dữ liệu nhiều.',
    ],
    use: [
      'Trước mọi lần huấn luyện: chạy qua danh sách kiểm tra 8 điểm ở bước 7',
      'Khi điểm số tốt đến khó tin: kiểm tra rò rỉ trước khi ăn mừng',
      'Khi phải quyết định đầu tư: vẽ đường cong học trước khi đi thu thập thêm',
    ],
    avoid: [
      'Xử lý trên toàn bộ dữ liệu rồi mới chia: hãy chia trước hoặc dùng pipeline',
      'Chia ngẫu nhiên khi dữ liệu có nhóm hoặc có thời gian',
      'Mã hoá số thứ tự cho cột không có thứ tự, với mô hình tuyến tính hoặc KNN',
    ],
    next: { text: 'Dữ liệu đã sẵn sàng. Chương 4 bắt đầu loạt mô hình mới, mở đầu bằng hai ý tưởng đơn giản nhất: hỏi láng giềng (KNN) và đếm (Naive Bayes).', slug: 'knn-naive-bayes', title: 'Chương 4: KNN và Naive Bayes' },
  },
  challenges: [
    {
      level: 1,
      title: 'Ba phép biến đổi bằng tay',
      task: 'Ba khu vực có dân số 400, 1.200 và 20.000. Tính (a) min-max về [0, 1]; (b) chuẩn hoá z, biết trung bình 1.425 và độ lệch chuẩn 1.132 của cả bộ dữ liệu; (c) log tự nhiên. Phép nào làm khu vực 20.000 người bớt "lấn át" nhất?',
      hint: 'min-max: (x − min)/(max − min) với min, max của ba số này. ln 400 ≈ 5,99.',
      answer: '(a) min-max: 0; 800/19.600 ≈ 0,041; 1. Hai khu vực đầu bị dồn sát 0. (b) z: (400 − 1.425)/1.132 ≈ −0,91; (1.200 − 1.425)/1.132 ≈ −0,20; (20.000 − 1.425)/1.132 ≈ 16,4 — vẫn cực đoan. (c) log: 5,99; 7,09; 9,90 — khoảng cách giữa ba khu vực trở nên cân đối. Log là phép duy nhất thay đổi hình dạng phân phối, kéo đuôi dài lại gần.',
    },
    {
      level: 2,
      title: 'Điền tuổi Titanic theo danh xưng',
      task: 'Trên Titanic, điền 177 tuổi thiếu bằng (a) trung vị chung, (b) trung vị theo danh xưng (Mr, Mrs, Miss, Master, khác). Với mỗi nhóm danh xưng, giá trị điền chênh bao nhiêu so với trung vị chung 28?',
      hint: 'Lab Titanic ở bước 3 có bảng trung vị theo nhóm.',
      answer: 'Trung vị theo nhóm: Mr 30, Mrs 35, Miss 21, Master 3,5, khác 44,5. Với 4 cậu bé thiếu tuổi, điền 28 thay vì 3,5 là sai 24,5 năm — biến trẻ em thành người lớn, trong khi "trẻ em được cứu trước" là một quy luật quan trọng của bài toán. 36 cô "Miss" bị điền già hơn 7 năm. Điền theo nhóm tận dụng thông tin có sẵn trong tên: đó là thiết kế đặc trưng.',
    },
    {
      level: 3,
      title: 'Thiết kế quy trình đánh giá cho một bài toán thật',
      task: 'Một trường đại học muốn dự đoán sinh viên năm nhất có nguy cơ bỏ học, dùng dữ liệu 5 khoá gần nhất (điểm đầu vào, điểm từng học kỳ, số buổi vắng, ngành học…). Hãy đề xuất: cách chia train/test, các cột có nguy cơ rò rỉ, và một rủi ro công bằng cần kiểm tra.',
      hint: 'Mô hình sẽ dự đoán khi nào trong năm? Cột nào chỉ có sau thời điểm đó? Sinh viên một ngành có thể khác hẳn ngành khác không?',
      answer: 'Chia theo thời gian: học trên 4 khoá cũ, kiểm tra trên khoá mới nhất — vì mô hình sẽ dùng cho khoá tương lai. Rò rỉ: nếu dự đoán vào giữa học kỳ 1 thì không được dùng điểm cuối kỳ 1, số buổi vắng cả năm, hay cột "đã nhận cảnh báo học vụ" (thường được gắn sau khi đã có nguy cơ). Công bằng: đo sai số riêng theo ngành, giới tính, vùng miền; nếu mô hình bỏ sót nhiều hơn ở một nhóm, nhóm đó sẽ ít được hỗ trợ. Cũng cần hỏi: dự đoán dùng để hỗ trợ sinh viên, hay để loại bớt? Không có đáp án duy nhất, nhưng mọi đáp án tốt đều bắt đầu từ câu hỏi "mô hình sẽ được dùng khi nào, ở đâu, cho ai".',
    },
  ],
  reflect: [
    'Thí nghiệm nào trong bài làm bạn bất ngờ nhất? Nó thay đổi cách bạn sẽ đọc một con số "độ chính xác 95%" thế nào?',
    'Giải thích rò rỉ dữ liệu cho một người bạn bằng một ví dụ ngoài đời (thi cử, thể thao…).',
    'Trong dự án tiếp theo của bạn, bước nào trong danh sách kiểm tra 8 điểm dễ bị bỏ qua nhất?',
  ],
};
