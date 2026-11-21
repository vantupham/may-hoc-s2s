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
  { slug: 'gradient-descent', short: 'Gradient Descent', no: '0', pos: [0, 1], title: 'Gradient Descent: xuống dốc từng bước', summary: 'Thuật toán tối ưu đứng sau gần như mọi mô hình học máy, tính tay trên 5 căn nhà.', dataset: 'California Housing', ready: true, requires: [], extended: true, lecture: true },
  { slug: 'hoi-quy-tuyen-tinh', short: 'Hồi quy tuyến tính', no: '1', pos: [1, 1], title: 'Hồi quy tuyến tính', summary: 'Dự đoán giá nhà từ thu nhập: MSE, gradient, nghiệm đóng và đánh giá trên dữ liệu thật.', dataset: 'California Housing', ready: true, requires: ['gradient-descent'], extended: true, lecture: true },
  { slug: 'hoi-quy-logistic', short: 'Hồi quy logistic', no: '2', pos: [2, 1], title: 'Hồi quy logistic', summary: 'Phân loại khối u lành hay ác: sigmoid, cross-entropy, ngưỡng và ma trận nhầm lẫn.', dataset: 'Breast Cancer Wisconsin', ready: true, requires: ['hoi-quy-tuyen-tinh'], extended: true, lecture: true },
  { slug: 'kham-pha-du-lieu', short: 'Khám phá dữ liệu', no: '3A', pos: [3, 0.55], title: 'Dữ liệu (A): khám phá và đánh giá', summary: 'Phiếu khám sức khoẻ cho 20.640 khu vực: giá trị thiếu, chặn trần, ngoại lai, tương quan giả, nhãn sai và lệch phân phối.', dataset: 'California Housing đầy đủ, Breast Cancer', ready: true, requires: ['hoi-quy-logistic'], extended: true, lecture: true },
  { slug: 'xu-ly-du-lieu', short: 'Xử lý dữ liệu', no: '3B', pos: [3, 1.65], title: 'Dữ liệu (B): xử lý và xây bộ dữ liệu tốt', summary: 'Điền giá trị thiếu, mã hoá, chuẩn hoá, rò rỉ dữ liệu, cách chia train/test, và câu hỏi: nhiều dữ liệu hơn hay dữ liệu tốt hơn?', dataset: 'California Housing đầy đủ, Titanic, Breast Cancer', ready: true, requires: ['kham-pha-du-lieu'], extended: true, lecture: true },
  { slug: 'knn-naive-bayes', short: 'KNN, Naive Bayes', no: '4', pos: [4, 0], title: 'KNN và Naive Bayes', summary: 'Phân loại hoa bằng láng giềng gần nhất, lọc tin rác bằng cách đếm từ.', dataset: 'Iris, SMS Spam Collection', ready: true, requires: ['xu-ly-du-lieu'], extended: true, lecture: true },
  { slug: 'cay-quyet-dinh', short: 'Cây quyết định', no: '5', pos: [4, 1], title: 'Cây quyết định và tập hợp', summary: 'Ai sống sót trên tàu Titanic? Gini, cây tham lam, rừng ngẫu nhiên và boosting.', dataset: 'Titanic', ready: true, requires: ['xu-ly-du-lieu'], extended: true, lecture: true },
  { slug: 'svm', short: 'SVM', no: '6', pos: [4, 2], title: 'SVM', summary: 'Đường tách xa những ca khó nhất: lề cực đại, hinge loss, hệ số C và nhân RBF.', dataset: 'Breast Cancer Wisconsin', ready: true, requires: ['xu-ly-du-lieu'], extended: true, lecture: true },
  { slug: 'khong-giam-sat', short: 'Không giám sát', no: '7', pos: [1, 2.3], title: 'Học không giám sát', summary: 'Tìm cấu trúc khi không có nhãn: K-means, DBSCAN và PCA.', dataset: 'Chim cánh cụt Palmer, chữ số viết tay', ready: true, requires: ['gradient-descent'], extended: true, lecture: true },
  { slug: 'danh-gia-mo-hinh', short: 'Đánh giá mô hình', no: '8', pos: [5, 1], title: 'Đánh giá mô hình', summary: 'Con số độ chính xác đáng tin đến đâu? Cross-validation, bias–variance, ROC và AUC.', dataset: 'California Housing, Breast Cancer', ready: true, requires: ['knn-naive-bayes', 'cay-quyet-dinh'], extended: true, lecture: true },
  { slug: 'mang-no-ron', short: 'Mạng nơ-ron', no: '9', pos: [6, 1], title: 'Mạng nơ-ron', summary: 'Nơ-ron, hàm kích hoạt, lan truyền ngược từng con số, rồi huấn luyện nhận dạng chữ số trong trình duyệt.', dataset: 'Chữ số viết tay 8×8', ready: true, requires: ['hoi-quy-logistic', 'danh-gia-mo-hinh'], extended: true, lecture: true },
  { slug: 'cnn', short: 'CNN', no: '10', pos: [7, 0.4], title: 'Mạng tích chập (CNN)', summary: 'Bộ lọc 3×3 trượt qua ảnh quần áo, từng phép nhân, max-pool và cả mạng từ điểm ảnh đến dự đoán.', dataset: 'Fashion-MNIST', ready: true, requires: ['mang-no-ron'], extended: true },
  { slug: 'attention', short: 'Attention', no: '11', pos: [7, 1.6], title: 'Chuỗi và Attention', summary: 'Embedding, mã hoá vị trí, Q, K, V và ma trận chú ý với số thật, trên một mô hình lọc tin rác.', dataset: 'SMS Spam Collection', ready: true, requires: ['mang-no-ron'], extended: true },
  { slug: 'du-an-khong-khi-a', short: 'Dự án (A)', no: '12A', pos: [8, 0.4], title: 'Dự án (A): bụi mịn Hà Nội — dữ liệu và mô hình cổ điển', summary: 'Ôn lại chương 0–8 trên một bài toán Việt Nam đang diễn ra: dự báo PM2.5 ngày mai và có nên phát cảnh báo hay không.', dataset: 'Quan trắc PM2.5 Hà Nội (OpenAQ), thời tiết ERA5 (Open-Meteo)', ready: true, requires: ['cnn', 'attention'], extended: true },
  { slug: 'du-an-khong-khi-b', short: 'Dự án (B)', no: '12B', pos: [8, 1.6], title: 'Dự án (B): bụi mịn Hà Nội — mạng nơ-ron, đánh giá và triển khai', summary: 'Ôn lại chương 8–11: cross-validation theo thời gian, MLP, tích chập 1D, attention trên 72 giờ, và mô hình sống trong một thế giới thay đổi.', dataset: 'Quan trắc PM2.5 Hà Nội (OpenAQ), thời tiết ERA5 (Open-Meteo)', ready: true, requires: ['du-an-khong-khi-a'], extended: true },
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
