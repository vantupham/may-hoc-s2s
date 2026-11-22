export interface Lesson {
  slug: string;
  title: string;
  /** Tên ngắn cho bản đồ lộ trình */
  short: string;
  /** Số chương hiển thị, ví dụ "3A" */
  no: string;
  /** Vị trí trên bản đồ tiên quyết (cột, hàng) */
  pos: [number, number];
  summary: string;
  /** Thẻ <title> (chưa gồm tên trang); nên mở đầu bằng từ khoá người học hay tìm */
  seoTitle: string;
  /** Mô tả cho máy tìm kiếm và thẻ chia sẻ, 120–165 ký tự */
  seoDescription: string;
  /** Tên chủ đề ghép vào tiêu đề các bước 3–6, ví dụ "Tính tay SVM từng bước" */
  topic: string;
  /** Câu hỏi người học hay tìm, hiện ngay dưới tiêu đề bài cùng câu trả lời khoảng 60–75 tiếng */
  question: string;
  answer: string;
  dataset: string;
  ready: boolean;
  /** Các bài cần học trước (theo slug) */
  requires: string[];
  /** Bài đã có khung trải nghiệm đầy đủ: phần "Trước khi học" và bước 8 "Tổng kết" */
  extended?: boolean;
  /** Bài đã có bài giảng có lời (src/lib/giang/<slug>.ts, âm thanh trong public/giang/<slug>/) */
  lecture?: boolean;
}

export const lessons: Lesson[] = [
  { slug: 'gradient-descent', topic: 'Gradient Descent', question: 'Gradient Descent là gì?',
    answer: 'Gradient Descent (hạ gradient) là thuật toán tối ưu tìm bộ tham số làm hàm mất mát nhỏ nhất. Ở mỗi bước, nó tính gradient — hướng mà mất mát tăng nhanh nhất — rồi dịch tham số một đoạn nhỏ theo hướng ngược lại; độ dài đoạn đó do tốc độ học η quyết định. Hầu hết mô hình học máy, kể cả mạng nơ-ron, được huấn luyện theo cách này.',
    seoTitle: 'Gradient Descent là gì? Tính tay từng bước', seoDescription: 'Gradient Descent giải thích trực quan bằng tiếng Việt: đạo hàm, tốc độ học và từng bước xuống dốc, tính tay trên 5 căn nhà thật của bộ dữ liệu California Housing.',
    short: 'Gradient Descent', no: '0', pos: [0, 1], title: 'Gradient Descent: xuống dốc từng bước', summary: 'Thuật toán tối ưu đứng sau gần như mọi mô hình học máy, tính tay trên 5 căn nhà.', dataset: 'California Housing', ready: true, requires: [], extended: true, lecture: true },
  { slug: 'hoi-quy-tuyen-tinh', topic: 'hồi quy tuyến tính', question: 'Hồi quy tuyến tính là gì?',
    answer: 'Hồi quy tuyến tính là mô hình dự đoán một con số, ví dụ giá nhà, bằng tổng có trọng số của các đặc trưng: ŷ = w·x + b. Mô hình học w và b sao cho sai số bình phương trung bình (MSE) giữa dự đoán và giá trị thật nhỏ nhất, bằng gradient descent hoặc bằng nghiệm đóng tính thẳng từ dữ liệu.',
    seoTitle: 'Hồi quy tuyến tính: MSE, gradient, nghiệm đóng', seoDescription: 'Hồi quy tuyến tính từng bước với dữ liệu thật: dự đoán giá nhà California từ thu nhập, hàm mất mát MSE, gradient, nghiệm đóng và chạy Python ngay trên trình duyệt.',
    short: 'Hồi quy tuyến tính', no: '1', pos: [1, 1], title: 'Hồi quy tuyến tính', summary: 'Dự đoán giá nhà từ thu nhập: MSE, gradient, nghiệm đóng và đánh giá trên dữ liệu thật.', dataset: 'California Housing', ready: true, requires: ['gradient-descent'], extended: true, lecture: true },
  { slug: 'hoi-quy-logistic', topic: 'hồi quy logistic', question: 'Hồi quy logistic là gì?',
    answer: 'Hồi quy logistic là mô hình phân loại hai lớp. Nó tính z = w·x + b rồi đưa qua hàm sigmoid để được xác suất thuộc lớp dương, từ 0 đến 1. Mô hình học bằng cách cực tiểu cross-entropy; một ngưỡng, thường là 0,5, biến xác suất thành quyết định, và ma trận nhầm lẫn cho biết mô hình sai theo kiểu nào.',
    seoTitle: 'Hồi quy logistic: sigmoid, cross-entropy, ngưỡng', seoDescription: 'Hồi quy logistic trực quan: phân loại khối u lành hay ác trên dữ liệu Breast Cancer Wisconsin, hàm sigmoid, cross-entropy, chọn ngưỡng và ma trận nhầm lẫn.',
    short: 'Hồi quy logistic', no: '2', pos: [2, 1], title: 'Hồi quy logistic', summary: 'Phân loại khối u lành hay ác: sigmoid, cross-entropy, ngưỡng và ma trận nhầm lẫn.', dataset: 'Breast Cancer Wisconsin', ready: true, requires: ['hoi-quy-tuyen-tinh'], extended: true, lecture: true },
  { slug: 'kham-pha-du-lieu', topic: 'đánh giá dữ liệu', question: 'Khám phá dữ liệu (EDA) là gì?',
    answer: 'Khám phá dữ liệu (EDA, exploratory data analysis) là bước xem xét dữ liệu trước khi huấn luyện mô hình: đếm giá trị thiếu, xem phân phối, tìm ngoại lai và giá trị bị chặn trần, kiểm tra tương quan, nhãn sai và lệch phân phối. Mục tiêu là biết dữ liệu có đáng tin hay không và mô hình sẽ gặp những bẫy nào.',
    seoTitle: 'Khám phá dữ liệu (EDA): giá trị thiếu, ngoại lai, tương quan', seoDescription: 'Khám phá dữ liệu trước khi huấn luyện mô hình: giá trị thiếu, chặn trần, ngoại lai, tương quan giả, nhãn sai và lệch phân phối trên 20.640 khu vực California.',
    short: 'Khám phá dữ liệu', no: '3A', pos: [3, 0.55], title: 'Dữ liệu (A): khám phá và đánh giá', summary: 'Phiếu khám sức khoẻ cho 20.640 khu vực: giá trị thiếu, chặn trần, ngoại lai, tương quan giả, nhãn sai và lệch phân phối.', dataset: 'California Housing đầy đủ, Breast Cancer', ready: true, requires: ['hoi-quy-logistic'], extended: true, lecture: true },
  { slug: 'xu-ly-du-lieu', topic: 'xử lý dữ liệu', question: 'Tiền xử lý dữ liệu là gì?',
    answer: 'Tiền xử lý dữ liệu là biến dữ liệu thô thành đầu vào mô hình dùng được: điền giá trị thiếu, mã hoá biến phân loại thành số, đưa các đặc trưng về cùng thang đo và chia train/test. Mọi phép biến đổi chỉ được học từ tập train; nếu không sẽ gây rò rỉ dữ liệu và cho điểm đánh giá đẹp giả.',
    seoTitle: 'Tiền xử lý dữ liệu: điền thiếu, mã hoá, rò rỉ dữ liệu', seoDescription: 'Tiền xử lý dữ liệu cho học máy: điền giá trị thiếu, mã hoá, chuẩn hoá, rò rỉ dữ liệu, cách chia train/test và đường cong học, trên Titanic và California Housing.',
    short: 'Xử lý dữ liệu', no: '3B', pos: [3, 1.65], title: 'Dữ liệu (B): xử lý và xây bộ dữ liệu tốt', summary: 'Điền giá trị thiếu, mã hoá, chuẩn hoá, rò rỉ dữ liệu, cách chia train/test, và câu hỏi: nhiều dữ liệu hơn hay dữ liệu tốt hơn?', dataset: 'California Housing đầy đủ, Titanic, Breast Cancer', ready: true, requires: ['kham-pha-du-lieu'], extended: true, lecture: true },
  { slug: 'knn-naive-bayes', topic: 'KNN và Naive Bayes', question: 'KNN và Naive Bayes là gì?',
    answer: 'KNN (k láng giềng gần nhất) phân loại một điểm mới theo nhãn chiếm đa số trong k điểm huấn luyện gần nó nhất, gần như không cần huấn luyện. Naive Bayes dùng định lý Bayes với giả định “ngây thơ” rằng các đặc trưng độc lập khi biết lớp, để tính xác suất từng lớp, ví dụ xác suất một tin nhắn là rác từ các từ nó chứa.',
    seoTitle: 'KNN và Naive Bayes: láng giềng gần nhất, lọc tin rác', seoDescription: 'Thuật toán KNN và Naive Bayes giải thích từng bước: phân loại hoa Iris bằng láng giềng gần nhất, lọc tin nhắn rác SMS bằng xác suất và đếm từ.',
    short: 'KNN, Naive Bayes', no: '4', pos: [4, 0], title: 'KNN và Naive Bayes', summary: 'Phân loại hoa bằng láng giềng gần nhất, lọc tin rác bằng cách đếm từ.', dataset: 'Iris, SMS Spam Collection', ready: true, requires: ['xu-ly-du-lieu'], extended: true, lecture: true },
  { slug: 'cay-quyet-dinh', topic: 'cây quyết định', question: 'Cây quyết định là gì?',
    answer: 'Cây quyết định là mô hình đặt một chuỗi câu hỏi có/không về đặc trưng, ví dụ “hành khách là nữ?”, rồi dự đoán theo lá cuối cùng. Mỗi lần tách, cây chọn câu hỏi làm giảm độ hỗn tạp Gini nhiều nhất. Random Forest lấy biểu quyết của nhiều cây ngẫu nhiên; Gradient Boosting xây các cây nối tiếp, cây sau sửa lỗi của các cây trước.',
    seoTitle: 'Cây quyết định, Random Forest và Gradient Boosting', seoDescription: 'Cây quyết định từng bước trên dữ liệu Titanic: chỉ số Gini, cách chọn câu hỏi tách, rừng ngẫu nhiên (Random Forest) và Gradient Boosting, có tính tay và mô phỏng.',
    short: 'Cây quyết định', no: '5', pos: [4, 1], title: 'Cây quyết định và tập hợp', summary: 'Ai sống sót trên tàu Titanic? Gini, cây tham lam, rừng ngẫu nhiên và boosting.', dataset: 'Titanic', ready: true, requires: ['xu-ly-du-lieu'], extended: true, lecture: true },
  { slug: 'svm', topic: 'SVM', question: 'SVM là gì?',
    answer: 'SVM (support vector machine, máy vector hỗ trợ) là mô hình phân loại tìm đường ranh giới có lề lớn nhất, tức cách xa nhất những điểm sát ranh giới của cả hai lớp. Chỉ những điểm đó, gọi là vector hỗ trợ, quyết định mô hình. Hệ số C cho phép một số điểm vi phạm lề; nhân RBF giúp tách dữ liệu bằng đường cong.',
    seoTitle: 'SVM là gì? Lề cực đại, hinge loss, nhân RBF', seoDescription: 'SVM (máy vector hỗ trợ) giải thích từng bước trên dữ liệu ung thư vú thật: lề cực đại, hinge loss, hệ số C và nhân RBF. Có tính tay và mô phỏng tương tác.',
    short: 'SVM', no: '6', pos: [4, 2], title: 'SVM', summary: 'Đường tách xa những ca khó nhất: lề cực đại, hinge loss, hệ số C và nhân RBF.', dataset: 'Breast Cancer Wisconsin', ready: true, requires: ['xu-ly-du-lieu'], extended: true, lecture: true },
  { slug: 'khong-giam-sat', topic: 'K-means, DBSCAN và PCA', question: 'Học không giám sát là gì?',
    answer: 'Học không giám sát là tìm cấu trúc trong dữ liệu không có nhãn. K-means chia dữ liệu thành k cụm quanh k tâm; DBSCAN gom những vùng điểm dày đặc và để riêng điểm nhiễu; PCA (phân tích thành phần chính) tìm vài hướng giữ được nhiều phương sai nhất, giúp giảm số chiều và vẽ dữ liệu nhiều chiều lên mặt phẳng.',
    seoTitle: 'Học không giám sát: K-means, DBSCAN và PCA', seoDescription: 'Học không giám sát trực quan: phân cụm K-means và DBSCAN trên chim cánh cụt Palmer, giảm chiều PCA trên chữ số viết tay, thấy rõ từng vòng lặp và từng con số.',
    short: 'Không giám sát', no: '7', pos: [1, 2.3], title: 'Học không giám sát', summary: 'Tìm cấu trúc khi không có nhãn: K-means, DBSCAN và PCA.', dataset: 'Chim cánh cụt Palmer, chữ số viết tay', ready: true, requires: ['gradient-descent'], extended: true, lecture: true },
  { slug: 'danh-gia-mo-hinh', topic: 'đánh giá mô hình', question: 'Đánh giá mô hình học máy là gì?',
    answer: 'Đánh giá mô hình là ước lượng mô hình sẽ làm tốt đến đâu trên dữ liệu chưa từng thấy. Cross-validation chia dữ liệu thành k phần và lần lượt kiểm tra trên từng phần; bias–variance giải thích vì sao mô hình quá đơn giản hay quá phức tạp đều dự đoán kém; đường ROC và AUC đo khả năng phân loại ở mọi ngưỡng.',
    seoTitle: 'Đánh giá mô hình: cross-validation, bias–variance, ROC, AUC', seoDescription: 'Đánh giá mô hình học máy: cross-validation, đánh đổi bias–variance, đường cong ROC và AUC, minh hoạ bằng dữ liệu thật California Housing và Breast Cancer.',
    short: 'Đánh giá mô hình', no: '8', pos: [5, 1], title: 'Đánh giá mô hình', summary: 'Con số độ chính xác đáng tin đến đâu? Cross-validation, bias–variance, ROC và AUC.', dataset: 'California Housing, Breast Cancer', ready: true, requires: ['knn-naive-bayes', 'cay-quyet-dinh'], extended: true, lecture: true },
  { slug: 'mang-no-ron', topic: 'mạng nơ-ron', question: 'Mạng nơ-ron là gì?',
    answer: 'Mạng nơ-ron là mô hình gồm nhiều lớp nơ-ron; mỗi nơ-ron tính tổng có trọng số của đầu vào rồi đưa qua một hàm kích hoạt phi tuyến như ReLU hay sigmoid. Mạng học bằng lan truyền ngược (backpropagation): dùng quy tắc chuỗi để tính gradient của mất mát theo từng trọng số, rồi cập nhật trọng số bằng gradient descent.',
    seoTitle: 'Mạng nơ-ron và lan truyền ngược (backpropagation)', seoDescription: 'Mạng nơ-ron từ con số đầu tiên: nơ-ron, hàm kích hoạt, lan truyền ngược (backpropagation) tính tay, rồi huấn luyện nhận dạng chữ số viết tay ngay trong trình duyệt.',
    short: 'Mạng nơ-ron', no: '9', pos: [6, 1], title: 'Mạng nơ-ron', summary: 'Nơ-ron, hàm kích hoạt, lan truyền ngược từng con số, rồi huấn luyện nhận dạng chữ số trong trình duyệt.', dataset: 'Chữ số viết tay 8×8', ready: true, requires: ['hoi-quy-logistic', 'danh-gia-mo-hinh'], extended: true, lecture: true },
  { slug: 'cnn', topic: 'CNN', question: 'CNN (mạng tích chập) là gì?',
    answer: 'CNN (convolutional neural network, mạng nơ-ron tích chập) là mạng nơ-ron dành cho ảnh. Thay vì nối mọi điểm ảnh với mọi nơ-ron, nó trượt các bộ lọc nhỏ, ví dụ 3×3, qua ảnh để tìm cạnh, góc và hoa văn ở bất kỳ vị trí nào. Max-pooling thu nhỏ bản đồ đặc trưng, rồi các lớp cuối gộp lại thành dự đoán.',
    seoTitle: 'Mạng tích chập CNN: bộ lọc, tích chập, max-pooling', seoDescription: 'CNN (mạng nơ-ron tích chập) giải thích từng phép nhân: bộ lọc 3×3 trượt qua ảnh quần áo Fashion-MNIST, max-pooling và cả mạng từ điểm ảnh đến dự đoán.',
    short: 'CNN', no: '10', pos: [7, 0.4], title: 'Mạng tích chập (CNN)', summary: 'Bộ lọc 3×3 trượt qua ảnh quần áo, từng phép nhân, max-pool và cả mạng từ điểm ảnh đến dự đoán.', dataset: 'Fashion-MNIST', ready: true, requires: ['mang-no-ron'], extended: true, lecture: true },
  { slug: 'attention', topic: 'attention', question: 'Attention là gì?',
    answer: 'Attention (cơ chế chú ý) cho mỗi từ trong câu tự quyết định nên “nhìn” vào những từ nào khác. Mỗi từ tạo ra ba vector: truy vấn Q, khoá K và giá trị V. Độ khớp giữa Q của từ này với K của các từ khác, qua softmax, thành trọng số chú ý để lấy trung bình các V. Đây là khối nền của Transformer.',
    seoTitle: 'Attention là gì? Q, K, V và ma trận chú ý', seoDescription: 'Cơ chế Attention giải thích bằng số thật: embedding, mã hoá vị trí, Q, K, V, softmax và ma trận chú ý, trên một mô hình lọc tin nhắn rác SMS chạy trong trình duyệt.',
    short: 'Attention', no: '11', pos: [7, 1.6], title: 'Chuỗi và Attention', summary: 'Embedding, mã hoá vị trí, Q, K, V và ma trận chú ý với số thật, trên một mô hình lọc tin rác.', dataset: 'SMS Spam Collection', ready: true, requires: ['mang-no-ron'], extended: true, lecture: true },
  { slug: 'du-an-khong-khi-a', topic: 'dự báo PM2.5', question: 'Dự báo bụi mịn PM2.5 bằng học máy như thế nào?',
    answer: 'Dự báo PM2.5 bằng học máy là học từ số liệu quá khứ — nồng độ bụi đo ở các trạm, gió, độ ẩm, nhiệt độ — để đoán nồng độ ngày mai. Trước khi tin mô hình, phải kiểm tra chất lượng trạm đo, so với một mốc đơn giản như “ngày mai giống hôm nay”, và chia dữ liệu theo thời gian để không rò rỉ thông tin từ tương lai.',
    seoTitle: 'Dự án học máy: dự báo bụi mịn PM2.5 Hà Nội (A)', seoDescription: 'Dự án học máy thực tế: dự báo PM2.5 ngày mai ở Hà Nội từ trạm đo OpenAQ và thời tiết ERA5, kiểm soát chất lượng dữ liệu, mốc so sánh và rò rỉ theo thời gian.',
    short: 'Dự án (A)', no: '12A', pos: [8, 0.4], title: 'Dự án (A): bụi mịn Hà Nội — dữ liệu và mô hình cổ điển', summary: 'Ôn lại chương 0–8 trên một bài toán Việt Nam đang diễn ra: dự báo PM2.5 ngày mai và có nên phát cảnh báo hay không.', dataset: 'Quan trắc PM2.5 Hà Nội (OpenAQ), thời tiết ERA5 (Open-Meteo)', ready: true, requires: ['cnn', 'attention'], extended: true, lecture: true },
  { slug: 'du-an-khong-khi-b', topic: 'mạng nơ-ron dự báo PM2.5', question: 'Dự báo PM2.5 bằng mạng nơ-ron khác gì mô hình cổ điển?',
    answer: 'Mạng nơ-ron có thể đọc thẳng chuỗi số liệu theo giờ: MLP nhận các đặc trưng đã tóm tắt, CNN 1D trượt bộ lọc dọc theo thời gian, attention chọn giờ nào trong 72 giờ qua đáng chú ý. Nhưng chúng chỉ đáng dùng khi thắng mô hình đơn giản trong cross-validation theo thời gian, và vẫn phải được theo dõi khi dữ liệu thay đổi sau triển khai.',
    seoTitle: 'Dự báo PM2.5 Hà Nội bằng MLP, CNN 1D và attention (B)', seoDescription: 'Dự báo bụi mịn PM2.5 Hà Nội bằng mạng nơ-ron: cross-validation theo thời gian, MLP, CNN 1D, attention trên 72 giờ và lệch phân phối sau khi triển khai mô hình.',
    short: 'Dự án (B)', no: '12B', pos: [8, 1.6], title: 'Dự án (B): bụi mịn Hà Nội — mạng nơ-ron, đánh giá và triển khai', summary: 'Ôn lại chương 8–11: cross-validation theo thời gian, MLP, tích chập 1D, attention trên 72 giờ, và mô hình sống trong một thế giới thay đổi.', dataset: 'Quan trắc PM2.5 Hà Nội (OpenAQ), thời tiết ERA5 (Open-Meteo)', ready: true, requires: ['du-an-khong-khi-a'], extended: true, lecture: true },
];

export const sections = [
  { id: 'bai-toan', label: 'Bài toán' },
  { id: 'kham-pha', label: 'Khám phá dữ liệu' },
  { id: 'truc-giac', label: 'Trực giác' },
  { id: 'tinh-tay', label: 'Tính tay' },
  { id: 'ly-thuyet', label: 'Lý thuyết' },
  { id: 'ma-nguon', label: 'Mã nguồn' },
  { id: 'danh-gia', label: 'Toàn bộ dữ liệu' },
];

/** Bước 8, chỉ có ở các bài extended */
export const wrapUp = { id: 'tong-ket', label: 'Tổng kết' };
export const sectionsFor = (l: Lesson) => (l.extended ? [...sections, wrapUp] : sections);
