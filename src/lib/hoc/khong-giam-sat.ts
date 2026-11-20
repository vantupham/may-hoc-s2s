/**
 * Phần trải nghiệm của chương 7 (Học không giám sát). Số liệu lấy từ ml-core (kmeans, dbscan, pca)
 * trên penguins.json và digits.json; số dùng scikit-learn ghi rõ trong đáp án.
 */
import type { LessonLearn } from '../learn';

export const unsupLearn: LessonLearn = {
  slug: 'khong-giam-sat',
  minutes: 50,
  goals: [
    { text: 'Chạy tay K-means: gán mỗi điểm vào tâm gần nhất, dời tâm về trung bình, lặp đến khi ổn định.', see: 'tinh-tay' },
    { text: 'Giải thích vì sao K-means luôn dừng nhưng có thể dừng ở lời giải chưa tốt nhất.', see: 'ly-thuyet' },
    { text: 'Chọn số cụm bằng "khuỷu tay", và dùng DBSCAN khi cụm có hình dạng tuỳ ý hoặc có nhiễu.', see: 'danh-gia' },
    { text: 'Dùng PCA để nén dữ liệu nhiều chiều, đọc được tỷ lệ phương sai giữ lại.', see: 'danh-gia' },
  ],
  warmup: [
    { q: 'Mỏ chim dài khoảng 44 mm, dày khoảng 17 mm. Vì sao phải chuẩn hoá trước khi phân cụm theo khoảng cách?', options: ['Để chiều dài không lấn át chiều dày', 'Để có ít chim hơn', 'Để biết loài'], answer: 0, why: 'Chương 3B và 4: khoảng cách cộng chênh lệch của mọi cột, cột có thang đo lớn sẽ quyết định tất cả.' },
    { q: 'Trung bình cộng của các điểm (1; 2), (3; 2), (2; 5) là gì?', options: ['(2; 3)', '(2; 2)', '(3; 5)'], answer: 0, why: '((1 + 3 + 2)/3; (2 + 2 + 5)/3) = (2; 3). K-means dời tâm về đúng điểm như vậy.' },
  ],
  missions: [
    {
      id: 'kmeans',
      step: 'tinh-tay',
      title: 'K-means trên 342 chim cánh cụt',
      predict: {
        q: 'K-means không hề biết loài. Sau khi hội tụ, 3 cụm khớp với 3 loài thật khoảng bao nhiêu phần trăm số chim?',
        options: ['Khoảng 33%, như đoán bừa', 'Khoảng 93%', '100%'],
        answer: 1,
        why: '318/342 con (93%) nằm đúng cụm của loài mình. Chỗ nhầm chủ yếu là Chinstrap: 13 trong 68 con bị xếp chung với Adelie hoặc Gentoo — vùng mà số đo mỏ của các loài giáp nhau.',
      },
      tasks: [
        'Bấm tiến từng pha (gán → cập nhật). Ghi tổng bình phương khoảng cách ở vòng 1 và vòng cuối, và số vòng hội tụ.',
        'Bấm vào một con chim để xem nó được gán vào tâm nào, và phép tính khoảng cách tới từng tâm.',
        'Ở vòng cuối, bật <b>Tô màu theo loài thật</b>: chỗ nhầm nằm ở đâu?',
      ],
      record: {
        cols: ['Giá trị'],
        rows: [
          { label: 'Tổng bình phương khoảng cách, vòng 1', values: [485.831] },
          { label: 'Tổng bình phương khoảng cách, vòng cuối', values: [186.927] },
          { label: 'Số vòng hội tụ', values: [13] },
        ],
        tol: [0.0006],
      },
      explain: {
        q: 'Vì sao tổng bình phương khoảng cách không bao giờ tăng qua các vòng, và vì sao thuật toán chắc chắn dừng?',
        answer: 'Pha gán chuyển mỗi con sang tâm gần hơn (hoặc giữ nguyên), nên tổng không tăng. Pha cập nhật dời tâm về trung bình cụm — chính là điểm làm tổng bình phương khoảng cách trong cụm nhỏ nhất — nên tổng cũng không tăng. Số cách chia 342 con thành 3 cụm là hữu hạn và tổng không bao giờ tăng, nên tới lúc nào đó không ai đổi cụm nữa. Nhưng "dừng" không có nghĩa là "tốt nhất": tuỳ điểm xuất phát, K-means có thể dừng ở một cực tiểu địa phương.',
      },
    },
    {
      id: 'dbscan',
      step: 'danh-gia',
      title: 'DBSCAN: cụm là vùng dày đặc',
      predict: {
        q: 'DBSCAN với eps = 0,28 cho 3 cụm. Tăng eps lên 0,40 thì số cụm thế nào?',
        options: ['Tăng lên', 'Giảm còn 1 cụm', 'Không đổi'],
        answer: 1,
        why: 'Bán kính lớn hơn làm các vùng dày đặc chạm nhau và nối thành một cụm duy nhất (chỉ 10 điểm nhiễu). Ngược lại, eps = 0,20 cho 5 cụm và 89 điểm nhiễu: quá khắt khe, cụm bị vỡ vụn.',
      },
      tasks: [
        'Với mặc định (eps 0,28; minPts 5), ghi số cụm và số điểm nhiễu. Xem bảng: mỗi cụm gồm những loài nào?',
        'Kéo eps về 0,20 rồi lên 0,40, ghi lại.',
        'Nhìn đường "khuỷu tay" bên trái: đường cong gập ở K bằng mấy?',
      ],
      record: {
        cols: ['Số cụm', 'Điểm nhiễu'],
        rows: [
          { label: 'eps = 0,28', values: [3, 38] },
          { label: 'eps = 0,20', values: [5, 89] },
          { label: 'eps = 0,40', values: [1, 10] },
        ],
        tol: [0.5, 0.5],
      },
      explain: {
        q: 'Ở mặc định, DBSCAN gộp gần hết Gentoo với 22 Chinstrap vào một cụm, và tách 34 Chinstrap ra cụm riêng — kém K-means. Vậy khi nào DBSCAN đáng dùng hơn?',
        answer: 'Ba loài chim tạo thành ba đám tròn, kích cỡ tương đương — đúng loại cụm K-means giỏi nhất. DBSCAN mạnh khi cụm có hình dạng tuỳ ý (dài, cong, lồng nhau), khi không biết trước số cụm, và khi dữ liệu có nhiễu cần loại ra (K-means buộc mọi điểm vào một cụm). Điểm yếu: phải chọn eps và minPts, và một eps không hợp với các cụm có mật độ khác nhau. Còn đường khuỷu tay gập ở K = 3: từ 2 lên 3 cụm, tổng giảm 153; từ 3 lên 4 chỉ giảm 39.',
      },
    },
    {
      id: 'pca',
      step: 'danh-gia',
      title: 'Nén 64 điểm ảnh xuống vài con số',
      predict: {
        q: 'Giữ 20 trong 64 thành phần chính. Giữ được khoảng bao nhiêu phần trăm phương sai?',
        options: ['Khoảng 31% (20/64)', 'Gần 90%', '100%'],
        answer: 1,
        why: '89,4%. Các điểm ảnh lân cận rất tương quan (nét bút liền nhau, viền luôn trắng), nên dữ liệu thực ra "sống" trong ít chiều hơn 64 nhiều. Hai thành phần đầu chỉ giữ 28,5% — đủ để vẽ, chưa đủ để nhận ra mọi chữ số.',
      },
      tasks: [
        'Kéo k tới 2, 10 và 20: ghi phần trăm phương sai giữ lại.',
        'Di chuột qua các chấm trên bản đồ 2 chiều: chữ số nào tách rõ, chữ số nào chồng lấn nhau?',
        'Với một ảnh, kéo k từ 0 lên dần: từ khoảng k nào bạn nhận ra được chữ số?',
      ],
      record: {
        cols: ['Phương sai giữ lại (%)'],
        rows: [
          { label: 'k = 2', values: [28.5] },
          { label: 'k = 10', values: [73.8] },
          { label: 'k = 20', values: [89.4] },
        ],
        tol: [0.06],
      },
      explain: {
        q: 'PCA không biết nhãn, vậy vì sao các chữ số 0, 4, 6 lại tách thành vùng riêng trên bản đồ 2 chiều?',
        answer: 'PCA tìm hướng dữ liệu biến thiên nhiều nhất. Mà phần biến thiên lớn nhất giữa các ảnh chính là sự khác nhau về hình dạng nét bút — tức là chữ số nào. Chữ 0 (vòng tròn rỗng giữa) và chữ 4, 6 có hình dạng khác biệt rõ, nên rơi vào vùng riêng. Các chữ giống nhau (như 3, 5, 8) thì chồng lấn. PCA tách được nhãn chỉ khi nhãn trùng với hướng biến thiên lớn — điều không phải lúc nào cũng đúng.',
      },
    },
  ],
  checkpoints: {
    'truc-giac': { q: 'K-means cần biết trước điều gì?', options: ['Số cụm K', 'Nhãn của từng điểm', 'Không cần gì'], answer: 0, why: 'K-means không dùng nhãn, nhưng phải được cho trước K. DBSCAN thì không cần K mà cần eps và minPts.' },
    'tinh-tay': { q: 'Hai tâm ở (0; 0) và (2; 0). Điểm (0,8; 0,5) được gán vào tâm nào?', options: ['(0; 0)', '(2; 0)', 'Cả hai'], answer: 0, why: 'Bình phương khoảng cách: tới (0; 0) là 0,64 + 0,25 = 0,89; tới (2; 0) là 1,44 + 0,25 = 1,69. Gần (0; 0) hơn.' },
    'ly-thuyet': { q: 'Trị riêng λ₁ của PCA có ý nghĩa gì?', options: ['Phương sai của dữ liệu theo hướng v₁', 'Số chiều giữ lại', 'Độ chính xác phân loại'], answer: 0, why: 'λ₁/Σλ chính là tỷ lệ phương sai mà thành phần thứ nhất giữ lại (14,9% với chữ số viết tay).' },
    'ma-nguon': { q: 'Vì sao mã truyền init=Z[p["initIdx"]] và n_init=1 cho KMeans?', options: ['Để dùng đúng các tâm khởi tạo của lab, nên kết quả khớp với lab', 'Để chạy nhanh hơn', 'Vì scikit-learn bắt buộc'], answer: 0, why: 'Mặc định scikit-learn tự chọn tâm (k-means++) và chạy 10 lần lấy lần tốt nhất. Cố định tâm giúp so sánh từng con số với lab.' },
  },
  codeTasks: [
    {
      title: 'Thử K = 2 và K = 4',
      task: 'Thay dòng <code>km = KMeans(…)</code> bằng <code>KMeans(n_clusters=2, n_init=10, random_state=0)</code>, rồi với <code>n_clusters=4</code>. Sửa vòng <code>for c in range(3)</code> cho khớp K. Các loài được chia thế nào?',
      answer: 'K = 2: Adelie đứng riêng (151 con, kèm 8 Chinstrap), còn Chinstrap và Gentoo bị gộp. K = 4: Adelie bị chẻ đôi thành hai cụm khoảng 75 con, còn Chinstrap và Gentoo vẫn tách. K-means luôn tìm đủ K cụm, dù dữ liệu có "muốn" hay không.',
      code: `km = KMeans(n_clusters=4, n_init=10, random_state=0).fit(Z)
for c in range(4):
    print(f"  cụm {c}:", np.bincount(loai[km.labels_ == c], minlength=3))`,
    },
    {
      title: 'DBSCAN chặt tay hơn',
      task: 'Đổi <code>eps=0.28</code> thành <code>eps=0.2</code>. Số cụm và số điểm nhiễu thay đổi thế nào? Có khớp lab không?',
      answer: '5 cụm, 89 điểm nhiễu — khớp hoàn toàn với lab ở bước 7. Bán kính nhỏ làm nhiều vùng thưa bị coi là nhiễu và các loài bị chẻ vụn.',
    },
    {
      title: 'Cần bao nhiêu thành phần?',
      task: 'Thêm dòng in số thành phần cần để giữ 90% và 95% phương sai: <code>PCA(0.9).fit(X).n_components_</code>.',
      answer: '21 thành phần cho 90%, 29 cho 95%. Từ 64 xuống 29 số mà chỉ mất 5% phương sai — nén hơn một nửa.',
      code: `print(PCA(0.90).fit(X).n_components_, PCA(0.95).fit(X).n_components_)`,
    },
  ],
  quiz: [
    { q: 'Sau pha cập nhật, tâm của một cụm nằm ở đâu?', options: ['Tại điểm dữ liệu gần tâm cũ nhất', 'Tại trung bình cộng các điểm trong cụm', 'Tại trung vị của cụm'], answer: 1, why: 'Trung bình cộng là điểm làm tổng bình phương khoảng cách tới các điểm trong cụm nhỏ nhất.' },
    { q: 'Chạy K-means hai lần với khởi tạo khác nhau cho kết quả khác nhau. Vì sao?', options: ['Do lỗi làm tròn', 'K-means chỉ đảm bảo tới một cực tiểu địa phương', 'Do dữ liệu thay đổi'], answer: 1, why: 'Hàm mục tiêu có nhiều "thung lũng". Mỗi khởi tạo có thể rơi vào một thung lũng khác. Thực tế người ta chạy nhiều lần và giữ kết quả tốt nhất.' },
    { q: 'Thành phần chính thứ nhất của PCA là gì?', options: ['Đặc trưng có giá trị lớn nhất', 'Hướng mà dữ liệu có phương sai lớn nhất', 'Hướng phân biệt các lớp tốt nhất'], answer: 1, why: 'PCA không dùng nhãn. Nó chỉ tìm hướng trải rộng nhất — có thể trùng hoặc không trùng với hướng phân biệt các lớp.' },
    { q: 'Vận dụng: cửa hàng phân cụm khách theo số tiền chi tiêu (0–50 triệu đồng) và số lần ghé (0–30) mà không chuẩn hoá. Hệ quả?', options: ['Các cụm gần như chỉ dựa vào số tiền', 'Các cụm cân bằng hai đặc trưng', 'K-means báo lỗi'], answer: 0, why: 'Chênh 1 triệu đồng lớn hơn chênh 30 lần ghé hàng chục nghìn lần. Số lần ghé gần như không ảnh hưởng tới khoảng cách.' },
    { q: 'Vận dụng: bạn dùng PCA giảm 1.000 đặc trưng xuống 50 rồi mới huấn luyện bộ phân loại. PCA nên được học trên đâu?', options: ['Chỉ trên tập huấn luyện', 'Trên cả train và test cho đủ dữ liệu', 'Chỉ trên tập test'], answer: 0, why: 'PCA học trung bình và các hướng từ dữ liệu — đó là tham số. Học trên cả tập test là rò rỉ (chương 3B). Đặt PCA vào pipeline.' },
  ],
  takeaways: {
    points: [
      'Học không giám sát tìm <b>cấu trúc</b> khi không có nhãn: phân cụm (nhóm các điểm giống nhau) và giảm chiều (tóm tắt nhiều cột thành ít cột).',
      '<b>K-means</b>: gán vào tâm gần nhất, dời tâm về trung bình, lặp lại. Luôn dừng, nhưng có thể ở cực tiểu địa phương — hãy chạy nhiều khởi tạo.',
      'Chọn K bằng <b>khuỷu tay</b> và hiểu biết về lĩnh vực. K-means luôn trả về đúng K cụm, dù dữ liệu có cụm hay không.',
      '<b>DBSCAN</b> tìm vùng dày đặc, không cần K, nhận ra nhiễu — nhưng nhạy với eps.',
      '<b>PCA</b> tìm hướng biến thiên lớn nhất: 20 trong 64 thành phần giữ 89% phương sai của ảnh chữ số.',
    ],
    use: [
      'Khám phá dữ liệu chưa có nhãn: phân khúc khách hàng, nhóm tài liệu',
      'Nén dữ liệu nhiều chiều trước khi vẽ hoặc trước khi huấn luyện',
      'Phát hiện điểm bất thường (DBSCAN gắn nhãn nhiễu)',
    ],
    avoid: [
      'Đặc trưng chưa chuẩn hoá: cụm và thành phần chính sẽ bị cột lớn nhất chi phối',
      'Cụm có hình dạng cong, dài: K-means sẽ cắt sai — thử DBSCAN',
      'Coi cụm tìm được là "sự thật": luôn kiểm tra bằng hiểu biết về lĩnh vực',
    ],
    next: { text: 'Đến đây bạn đã gặp nhiều mô hình và nhiều con số đánh giá. Chương 8 hỏi: các con số đó đáng tin đến đâu — và cách đo cho đúng.', slug: 'danh-gia-mo-hinh', title: 'Chương 8: Đánh giá mô hình' },
  },
  challenges: [
    {
      level: 1,
      title: 'K-means trên một trục số',
      task: 'Sáu điểm trên trục số: 1, 2, 3, 10, 11, 12. K = 2, tâm khởi tạo ở 1 và 2. Chạy tay từng vòng (gán, rồi cập nhật) cho tới khi hội tụ. Tổng bình phương khoảng cách cuối cùng bằng bao nhiêu?',
      answer: 'Vòng 1 — gán: 1 về tâm 1; 2, 3, 10, 11, 12 về tâm 2 (vì gần 2 hơn). Cập nhật: tâm 1 = 1; tâm 2 = (2 + 3 + 10 + 11 + 12)/5 = 7,6. Vòng 2 — gán: 1, 2, 3 gần 1 hơn 7,6; 10, 11, 12 gần 7,6. Cập nhật: tâm 1 = 2, tâm 2 = 11. Vòng 3: không ai đổi cụm, dừng. Tổng = (1 + 0 + 1) + (1 + 0 + 1) = 4.',
    },
    {
      level: 2,
      title: 'Vẽ đường khuỷu tay bằng scikit-learn',
      task: 'Trong ô mã, in tổng bình phương khoảng cách (<code>inertia_</code>) của KMeans với K từ 1 đến 6 (<code>n_init=10</code>). Mức giảm mỗi lần thêm một cụm là bao nhiêu?',
      answer: 'K = 1…6: 684,0; 340,2; 186,9; 147,8; 114,1; 94,4. Mức giảm: 343,8; 153,3; 39,1; 33,7; 19,7. Sau K = 3, mỗi cụm thêm chỉ giảm khoảng 20–40 — khuỷu tay ở K = 3, khớp với 3 loài thật và với lab.',
      code: `for K in range(1, 7):
    print(K, round(KMeans(n_clusters=K, n_init=10, random_state=0).fit(Z).inertia_, 1))`,
    },
    {
      level: 3,
      title: 'Cụm "đúng" nghĩa là gì?',
      task: 'Một chuỗi cửa hàng phân cụm khách hàng thành 5 nhóm. Không có nhãn để so. Làm sao biết 5 cụm này "tốt"? Đề xuất ít nhất ba cách kiểm tra.',
      hint: 'Nghĩ tới: chạy lại có ra như cũ không; mỗi cụm có tên gọi dễ hiểu không; cụm có giúp ra quyết định khác nhau không.',
      answer: 'Không có đáp án "đúng" tuyệt đối, chỉ có cụm hữu ích. (1) Ổn định: chạy lại với khởi tạo khác, hoặc trên một nửa dữ liệu — các cụm có giữ nguyên không? (2) Giải thích được: mỗi cụm có đặc điểm rõ, đặt được tên ("mua thường xuyên, giá trị nhỏ")? (3) Hành động được: các cụm có dẫn tới chiến lược khác nhau, và thử nghiệm A/B cho thấy chiến lược theo cụm hiệu quả hơn? (4) Chỉ số nội tại như khuỷu tay hay silhouette — hữu ích nhưng không đủ. Chương này "gian lận" bằng nhãn loài thật để kiểm tra; ngoài đời hiếm khi có điều đó.',
    },
  ],
  reflect: [
    'Thuật toán không biết loài mà vẫn tìm ra 3 nhóm khớp 93%. Điều đó làm bạn nghĩ gì về câu "dữ liệu tự nói lên điều gì đó"?',
    'Giải thích PCA cho một người bạn bằng hình ảnh chụp ảnh một vật thể 3 chiều.',
    'Bạn có một bộ dữ liệu không nhãn nào (ảnh, ghi chép, giao dịch…)? Bạn muốn tìm cấu trúc gì trong đó?',
  ],
};
