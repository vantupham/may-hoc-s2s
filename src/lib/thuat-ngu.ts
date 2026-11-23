/**
 * Bảng thuật ngữ học máy Anh–Việt cho trang /thuat-ngu/ và mục "Thuật ngữ trong bài" cuối mỗi bài.
 *
 * Mỗi thuật ngữ trỏ tới bài dạy nó. `match` là cụm chữ (viết thường) phải xuất hiện trong bài đó,
 * mặc định là `vi`; e2e kiểm tra điều này để bảng thuật ngữ không trôi khỏi cách bài học thật sự gọi tên.
 */
export interface Term {
  vi: string;
  en: string;
  def: string;
  /** Bài dạy thuật ngữ này */
  slug: string;
  match?: string;
}

export const terms: Term[] = [
  // Chương 0 — Gradient Descent
  { vi: 'Gradient Descent', en: 'gradient descent', slug: 'gradient-descent', def: 'Thuật toán tối ưu: lặp lại việc dịch tham số ngược hướng gradient một đoạn nhỏ, để mất mát giảm dần.' },
  { vi: 'Gradient', en: 'gradient', slug: 'gradient-descent', def: 'Vector gồm đạo hàm của mất mát theo từng tham số; chỉ hướng mà mất mát tăng nhanh nhất.' },
  { vi: 'Đạo hàm', en: 'derivative', slug: 'gradient-descent', def: 'Tốc độ thay đổi của một hàm khi đầu vào nhích đi một chút, tức độ dốc của đồ thị tại một điểm.' },
  { vi: 'Tốc độ học (η)', en: 'learning rate', slug: 'gradient-descent', match: 'tốc độ học', def: 'Độ dài mỗi bước của gradient descent. Quá nhỏ thì học chậm; quá lớn thì nhảy qua đáy và có thể không bao giờ hội tụ.' },
  { vi: 'Hàm mất mát', en: 'loss function', slug: 'gradient-descent', def: 'Con số đo mô hình sai bao nhiêu trên dữ liệu. Huấn luyện là đi tìm bộ tham số làm con số này nhỏ nhất.' },
  { vi: 'Hội tụ', en: 'convergence', slug: 'gradient-descent', def: 'Khi các bước cập nhật nhỏ dần và tham số dừng lại quanh điểm có mất mát nhỏ nhất.' },

  // Chương 1 — Hồi quy tuyến tính
  { vi: 'Hồi quy tuyến tính', en: 'linear regression', slug: 'hoi-quy-tuyen-tinh', def: 'Mô hình dự đoán một con số bằng tổng có trọng số của các đặc trưng cộng một hệ số chặn: ŷ = w·x + b.' },
  { vi: 'Đặc trưng', en: 'feature', slug: 'hoi-quy-tuyen-tinh', def: 'Một thông tin đầu vào của mô hình, thường là một cột trong bảng, ví dụ thu nhập trung vị của một khu vực.' },
  { vi: 'Nhãn', en: 'label, target', slug: 'hoi-quy-tuyen-tinh', def: 'Giá trị mô hình cần dự đoán, ví dụ giá nhà, hay khối u lành hoặc ác.' },
  { vi: 'Hệ số chặn (b)', en: 'bias, intercept', slug: 'hoi-quy-tuyen-tinh', match: 'hệ số chặn', def: 'Hằng số cộng thêm vào dự đoán; là giá trị mô hình đoán khi mọi đặc trưng bằng 0.' },
  { vi: 'MSE', en: 'mean squared error', slug: 'hoi-quy-tuyen-tinh', def: 'Sai số bình phương trung bình giữa dự đoán và giá trị thật. Vì bình phương, một lỗi lớn bị phạt nặng hơn nhiều lỗi nhỏ.' },
  { vi: 'Nghiệm đóng', en: 'closed-form solution', slug: 'hoi-quy-tuyen-tinh', def: 'Công thức tính thẳng ra tham số tối ưu từ dữ liệu, không cần lặp như gradient descent.' },
  { vi: 'R²', en: 'coefficient of determination', slug: 'hoi-quy-tuyen-tinh', def: 'Tỉ lệ biến thiên của nhãn mà mô hình giải thích được: 1 là hoàn hảo, 0 là không hơn việc luôn đoán giá trị trung bình.' },

  // Chương 2 — Hồi quy logistic
  { vi: 'Hồi quy logistic', en: 'logistic regression', slug: 'hoi-quy-logistic', def: 'Mô hình phân loại hai lớp: tính w·x + b rồi đưa qua hàm sigmoid để được xác suất thuộc lớp dương.' },
  { vi: 'Sigmoid', en: 'sigmoid function', slug: 'hoi-quy-logistic', def: 'Hàm σ(z) = 1 / (1 + e⁻ᶻ), ép mọi số thực về khoảng từ 0 đến 1 để đọc như một xác suất.' },
  { vi: 'Cross-entropy', en: 'cross-entropy, log loss', slug: 'hoi-quy-logistic', def: 'Hàm mất mát cho bài toán phân loại; phạt rất nặng khi mô hình tự tin mà đoán sai.' },
  { vi: 'Ngưỡng', en: 'threshold', slug: 'hoi-quy-logistic', def: 'Mức xác suất để quyết định là lớp dương. Hạ ngưỡng thì bắt được nhiều ca dương hơn, nhưng báo nhầm cũng nhiều hơn.' },
  { vi: 'Ranh giới quyết định', en: 'decision boundary', slug: 'hoi-quy-logistic', def: 'Đường (hay mặt) chia không gian đặc trưng thành vùng mô hình đoán lớp này và vùng đoán lớp kia.' },
  { vi: 'Ma trận nhầm lẫn', en: 'confusion matrix', slug: 'hoi-quy-logistic', def: 'Bảng đếm số dự đoán đúng và sai theo từng loại: dương đúng, âm đúng, dương giả và âm giả.' },
  { vi: 'Precision', en: 'precision', slug: 'hoi-quy-logistic', def: 'Trong những ca mô hình báo là dương, bao nhiêu phần thật sự dương.' },
  { vi: 'Recall', en: 'recall, sensitivity', slug: 'hoi-quy-logistic', def: 'Trong những ca thật sự dương, mô hình bắt được bao nhiêu phần.' },

  // Chương 3A — Khám phá dữ liệu
  { vi: 'Giá trị thiếu', en: 'missing value', slug: 'kham-pha-du-lieu', def: 'Ô dữ liệu trống. Cần biết vì sao nó thiếu trước khi quyết định bỏ đi hay điền vào.' },
  { vi: 'Ngoại lai', en: 'outlier', slug: 'kham-pha-du-lieu', def: 'Điểm khác xa phần lớn dữ liệu; có thể là lỗi đo, cũng có thể là một trường hợp hiếm nhưng có thật.' },
  { vi: 'Chặn trần', en: 'capping, censoring', slug: 'kham-pha-du-lieu', def: 'Khi mọi giá trị lớn hơn một mức bị ghi thành đúng mức đó, nên dữ liệu không cho biết giá trị thật cao đến đâu.' },
  { vi: 'IQR', en: 'interquartile range', slug: 'kham-pha-du-lieu', def: 'Khoảng tứ phân vị Q3 − Q1. Quy tắc 1,5 × IQR hay được dùng để đánh dấu điểm ngoại lai.' },
  { vi: 'Tương quan', en: 'correlation', slug: 'kham-pha-du-lieu', def: 'Mức độ hai đại lượng cùng tăng giảm theo nhau. Tương quan không có nghĩa là cái này gây ra cái kia.' },
  { vi: 'Nhãn sai', en: 'label noise', slug: 'kham-pha-du-lieu', def: 'Mẫu bị gán nhầm nhãn trong dữ liệu huấn luyện; mô hình sẽ học theo cả những lỗi này.' },
  { vi: 'Lệch phân phối', en: 'distribution shift', slug: 'kham-pha-du-lieu', def: 'Dữ liệu lúc dùng mô hình khác dữ liệu lúc huấn luyện, khiến mô hình kém đi dù mã không có lỗi.' },

  // Chương 3B — Xử lý dữ liệu
  { vi: 'Điền giá trị thiếu', en: 'imputation', slug: 'xu-ly-du-lieu', def: 'Thay ô trống bằng một giá trị ước lượng, ví dụ trung vị của nhóm tương tự.' },
  { vi: 'Mã hoá one-hot', en: 'one-hot encoding', slug: 'xu-ly-du-lieu', def: 'Biến một cột phân loại có k giá trị thành k cột 0/1, để mô hình không hiểu nhầm các loại là những con số có thứ tự.' },
  { vi: 'Chuẩn hoá', en: 'standardization, scaling', slug: 'xu-ly-du-lieu', def: 'Đưa các đặc trưng về cùng thang đo, thường bằng cách trừ trung bình rồi chia cho độ lệch chuẩn.' },
  { vi: 'Rò rỉ dữ liệu', en: 'data leakage', slug: 'xu-ly-du-lieu', def: 'Thông tin từ tập kiểm tra, hay từ tương lai, lọt vào lúc huấn luyện, làm điểm đánh giá đẹp giả.' },
  { vi: 'Chia phân tầng', en: 'stratified split', slug: 'xu-ly-du-lieu', match: 'phân tầng', def: 'Chia train/test sao cho tỉ lệ các lớp ở mỗi phần giống tỉ lệ trong toàn bộ dữ liệu.' },
  { vi: 'Đường cong học', en: 'learning curve', slug: 'xu-ly-du-lieu', def: 'Đồ thị điểm của mô hình theo số mẫu huấn luyện; cho biết thêm dữ liệu còn giúp được bao nhiêu.' },

  // Chương 4 — KNN và Naive Bayes
  { vi: 'KNN (k láng giềng gần nhất)', en: 'k-nearest neighbors', slug: 'knn-naive-bayes', match: 'láng giềng', def: 'Phân loại một điểm mới theo nhãn chiếm đa số trong k điểm huấn luyện gần nó nhất.' },
  { vi: 'Khoảng cách Euclid', en: 'Euclidean distance', slug: 'knn-naive-bayes', def: 'Khoảng cách theo đường thẳng giữa hai điểm: căn bậc hai của tổng bình phương chênh lệch từng đặc trưng.' },
  { vi: 'Naive Bayes', en: 'naive Bayes', slug: 'knn-naive-bayes', def: 'Bộ phân loại dùng định lý Bayes với giả định “ngây thơ” rằng các đặc trưng độc lập với nhau khi đã biết lớp.' },
  { vi: 'Định lý Bayes', en: "Bayes' theorem", slug: 'knn-naive-bayes', def: 'Công thức đảo xác suất: từ khả năng thấy dữ liệu khi biết lớp, suy ra xác suất của lớp khi đã thấy dữ liệu.' },
  { vi: 'Xác suất tiên nghiệm', en: 'prior probability', slug: 'knn-naive-bayes', def: 'Xác suất của một lớp trước khi nhìn vào đặc trưng nào, ví dụ tỉ lệ tin rác trong toàn bộ tin nhắn.' },

  // Chương 5 — Cây quyết định
  { vi: 'Cây quyết định', en: 'decision tree', slug: 'cay-quyet-dinh', def: 'Mô hình đặt một chuỗi câu hỏi có/không về đặc trưng và dự đoán theo lá cuối cùng.' },
  { vi: 'Chỉ số Gini', en: 'Gini impurity', slug: 'cay-quyet-dinh', match: 'gini', def: 'Độ hỗn tạp của một nhóm: 0 khi mọi mẫu cùng lớp. Cây chọn câu hỏi tách làm Gini giảm nhiều nhất.' },
  { vi: 'Random Forest (rừng ngẫu nhiên)', en: 'random forest', slug: 'cay-quyet-dinh', match: 'rừng ngẫu nhiên', def: 'Nhiều cây quyết định, mỗi cây học trên một mẫu bootstrap và một phần đặc trưng ngẫu nhiên, rồi biểu quyết.' },
  { vi: 'Gradient Boosting', en: 'gradient boosting', slug: 'cay-quyet-dinh', def: 'Xây các cây nhỏ nối tiếp nhau; mỗi cây mới học để sửa phần sai còn lại của các cây trước.' },
  { vi: 'Bootstrap', en: 'bootstrap sample', slug: 'cay-quyet-dinh', def: 'Mẫu lấy có hoàn lại, cùng kích thước với dữ liệu gốc; một số dòng lặp lại, một số dòng không được chọn.' },

  // Chương 6 — SVM
  { vi: 'SVM (máy vector hỗ trợ)', en: 'support vector machine', slug: 'svm', match: 'svm', def: 'Mô hình phân loại tìm ranh giới có lề lớn nhất giữa hai lớp.' },
  { vi: 'Lề', en: 'margin', slug: 'svm', def: 'Khoảng cách từ ranh giới tới những điểm gần nó nhất. Lề rộng thì mô hình chịu được sai số đo tốt hơn.' },
  { vi: 'Vector hỗ trợ', en: 'support vectors', slug: 'svm', def: 'Những điểm nằm trên mép lề hoặc vi phạm lề; chỉ chúng quyết định ranh giới của SVM.' },
  { vi: 'Hinge loss', en: 'hinge loss', slug: 'svm', def: 'Mất mát max(0, 1 − y·f(x)): bằng 0 khi điểm đã nằm đúng phía và ngoài lề, tăng tuyến tính khi lấn vào.' },
  { vi: 'Hệ số C', en: 'regularization parameter C', slug: 'svm', def: 'Mức phạt cho việc vi phạm lề. C lớn bám sát dữ liệu huấn luyện; C nhỏ chịu sai một chút để có lề rộng.' },
  { vi: 'Nhân RBF', en: 'RBF kernel', slug: 'svm', def: 'Hàm đo độ giống nhau giữa hai điểm, giảm dần theo khoảng cách; cho SVM vẽ được ranh giới cong. Hệ số γ quyết định tầm ảnh hưởng của mỗi điểm.' },

  // Chương 7 — Học không giám sát
  { vi: 'K-means', en: 'k-means clustering', slug: 'khong-giam-sat', def: 'Chia dữ liệu thành k cụm: lặp lại việc gán mỗi điểm vào tâm gần nhất rồi dời tâm về trung bình cụm.' },
  { vi: 'DBSCAN', en: 'DBSCAN', slug: 'khong-giam-sat', def: 'Phân cụm theo mật độ: gom những vùng điểm dày đặc thành cụm, để riêng các điểm thưa thớt làm điểm nhiễu.' },
  { vi: 'PCA (phân tích thành phần chính)', en: 'principal component analysis', slug: 'khong-giam-sat', match: 'thành phần chính', def: 'Tìm những hướng giữ được nhiều phương sai nhất của dữ liệu để giảm số chiều mà mất ít thông tin.' },
  { vi: 'Phương sai', en: 'variance', slug: 'khong-giam-sat', def: 'Mức độ các giá trị phân tán quanh trung bình: trung bình bình phương độ lệch.' },

  // Chương 8 — Đánh giá mô hình
  { vi: 'Cross-validation', en: 'cross-validation', slug: 'danh-gia-mo-hinh', def: 'Chia dữ liệu thành k phần, lần lượt giữ một phần để kiểm tra và học trên phần còn lại, rồi lấy trung bình điểm.' },
  { vi: 'Tập kiểm định', en: 'validation set', slug: 'danh-gia-mo-hinh', def: 'Phần dữ liệu dùng để chọn siêu tham số; tách riêng khỏi tập kiểm tra cuối cùng.' },
  { vi: 'Bias–variance', en: 'bias–variance trade-off', slug: 'danh-gia-mo-hinh', match: 'bias', def: 'Mô hình quá đơn giản sai đều (bias cao); mô hình quá phức tạp đổi kết quả theo từng mẫu dữ liệu (variance cao).' },
  { vi: 'Quá khớp', en: 'overfitting', slug: 'danh-gia-mo-hinh', def: 'Mô hình học thuộc cả nhiễu của tập huấn luyện: điểm train rất cao nhưng điểm test kém.' },
  { vi: 'Đường ROC và AUC', en: 'ROC curve, AUC', slug: 'danh-gia-mo-hinh', match: 'auc', def: 'ROC vẽ tỉ lệ bắt đúng theo tỉ lệ báo nhầm ở mọi ngưỡng; AUC là diện tích dưới đường đó, 1 là hoàn hảo, 0,5 là đoán bừa.' },

  // Chương 9 — Mạng nơ-ron
  { vi: 'Nơ-ron', en: 'neuron, unit', slug: 'mang-no-ron', def: 'Đơn vị tính tổng có trọng số của đầu vào cộng hệ số chặn, rồi đưa qua một hàm kích hoạt.' },
  { vi: 'Hàm kích hoạt', en: 'activation function', slug: 'mang-no-ron', def: 'Hàm phi tuyến đặt sau mỗi nơ-ron; thiếu nó, nhiều lớp chồng lên nhau vẫn chỉ là một mô hình tuyến tính.' },
  { vi: 'ReLU', en: 'rectified linear unit', slug: 'mang-no-ron', def: 'Hàm kích hoạt max(0, z): giữ nguyên số dương, đổi số âm thành 0.' },
  { vi: 'Lan truyền xuôi', en: 'forward pass', slug: 'mang-no-ron', def: 'Tính từ đầu vào qua từng lớp tới dự đoán và mất mát.' },
  { vi: 'Lan truyền ngược', en: 'backpropagation', slug: 'mang-no-ron', def: 'Dùng quy tắc chuỗi đi ngược từ mất mát về từng lớp để tính gradient của mọi trọng số.' },
  { vi: 'Softmax', en: 'softmax', slug: 'mang-no-ron', def: 'Biến một vector điểm số thành phân phối xác suất trên các lớp: mọi số dương và cộng lại bằng 1.' },
  { vi: 'Epoch', en: 'epoch', slug: 'mang-no-ron', def: 'Một lượt mô hình đi qua toàn bộ tập huấn luyện.' },

  // Chương 10 — CNN
  { vi: 'Tích chập', en: 'convolution', slug: 'cnn', def: 'Trượt một bộ lọc nhỏ qua ảnh; ở mỗi vị trí nhân từng ô rồi cộng lại thành một số.' },
  { vi: 'Bộ lọc', en: 'filter, kernel', slug: 'cnn', def: 'Ma trận trọng số nhỏ, ví dụ 3×3, mà mạng học được để phát hiện cạnh, góc hay hoa văn.' },
  { vi: 'Bản đồ đặc trưng', en: 'feature map', slug: 'cnn', def: 'Kết quả của một bộ lọc trượt khắp ảnh: chỗ nào sáng là chỗ có mẫu hình mà bộ lọc tìm.' },
  { vi: 'Max-pooling', en: 'max pooling', slug: 'cnn', match: 'max-pool', def: 'Thu nhỏ bản đồ đặc trưng bằng cách chỉ giữ số lớn nhất trong mỗi ô nhỏ, ví dụ 2×2.' },

  // Chương 11 — Attention
  { vi: 'Token', en: 'token', slug: 'attention', def: 'Đơn vị văn bản mà mô hình đọc, thường là một từ hoặc một phần của từ.' },
  { vi: 'Embedding', en: 'embedding', slug: 'attention', def: 'Vector số đại diện cho một token; các token có nghĩa gần nhau có embedding gần nhau.' },
  { vi: 'Mã hoá vị trí', en: 'positional encoding', slug: 'attention', def: 'Vector cộng thêm vào embedding để mô hình biết token đứng ở vị trí nào trong câu.' },
  { vi: 'Q, K, V (truy vấn, khoá, giá trị)', en: 'query, key, value', slug: 'attention', match: 'truy vấn', def: 'Ba vector mỗi token tạo ra: Q hỏi “tôi cần gì”, K trả lời “tôi có gì”, V là nội dung được lấy về.' },
  { vi: 'Ma trận chú ý', en: 'attention matrix', slug: 'attention', def: 'Bảng trọng số cho biết mỗi token chú ý vào từng token khác bao nhiêu; mỗi hàng cộng lại bằng 1.' },
  { vi: 'Transformer', en: 'Transformer', slug: 'attention', def: 'Kiến trúc mạng xây từ các khối attention chồng lên nhau, nền tảng của các mô hình ngôn ngữ lớn.' },

  // Chương 12 — Dự án bụi mịn Hà Nội
  { vi: 'Mốc so sánh', en: 'baseline', slug: 'du-an-khong-khi-a', def: 'Cách dự đoán đơn giản nhất có thể, ví dụ “ngày mai giống hôm nay”; mô hình phải thắng nó mới đáng dùng.' },
  { vi: 'Chuỗi thời gian', en: 'time series', slug: 'du-an-khong-khi-a', def: 'Dữ liệu đo liên tiếp theo thời gian, trong đó thứ tự quan trọng và hôm nay phụ thuộc vào hôm qua.' },
  { vi: 'Cross-validation theo thời gian', en: 'time-series cross-validation', slug: 'du-an-khong-khi-b', def: 'Luôn học trên quá khứ và kiểm tra trên giai đoạn ngay sau đó, không bao giờ dùng tương lai để đoán quá khứ.' },
  { vi: 'MLP', en: 'multilayer perceptron', slug: 'du-an-khong-khi-b', def: 'Mạng nơ-ron gồm các lớp kết nối đầy đủ, mỗi nơ-ron nối với mọi nơ-ron của lớp trước.' },
  { vi: 'Tích chập 1D', en: '1D convolution', slug: 'du-an-khong-khi-b', def: 'Tích chập trượt dọc một chuỗi thời gian thay vì trượt trên ảnh hai chiều.' },
];

/** id dùng làm neo trên trang thuật ngữ, ví dụ "learning-rate" */
export const termId = (t: Term) => t.en.split(',')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
