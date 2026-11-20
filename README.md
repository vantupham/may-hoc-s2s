# Máy học S2S

Học máy trực quan **từng bước** (step-to-step) với **dữ liệu thật**, bằng tiếng Việt.
Mỗi bài là một dự án nhỏ: từ bảng số liệu thô đến mô hình hoàn chỉnh. Người học có thể
dừng thuật toán ở bất kỳ vòng lặp nào, bấm vào bất kỳ con số nào và xem nó được tính ra như thế nào.

Trang web: https://vantupham.github.io/may-hoc-s2s/

## Các bài học

| Chương | Bài | Dữ liệu |
| --- | --- | --- |
| 0 | Gradient Descent: xuống dốc từng bước | California Housing |
| 1 | Hồi quy tuyến tính | California Housing |
| 2 | Hồi quy logistic | Breast Cancer Wisconsin |
| 3A | Dữ liệu: khám phá và đánh giá (phiếu khám, ngoại lai, tương quan, nhãn sai, lệch phân phối) | California Housing đầy đủ, Breast Cancer 30 đặc trưng |
| 3B | Dữ liệu: xử lý và xây bộ dữ liệu tốt (điền thiếu, mã hoá, rò rỉ, cách chia, đường cong học) | California Housing đầy đủ, Titanic, Breast Cancer |
| 4 | KNN và Naive Bayes | Iris, SMS Spam Collection |
| 5 | Cây quyết định, Random Forest, Gradient Boosting | Titanic |
| 6 | SVM | Breast Cancer Wisconsin |
| 7 | Học không giám sát: K-means, DBSCAN, PCA | Chim cánh cụt Palmer, chữ số viết tay 8×8 |
| 8 | Đánh giá mô hình: cross-validation, bias–variance, ROC | California Housing, Breast Cancer |
| 9 | Mạng nơ-ron và lan truyền ngược | Chữ số viết tay 8×8 |
| 10 | Mạng tích chập (CNN) | Fashion-MNIST |
| 11 | Chuỗi và Attention | SMS Spam Collection |

## Nguyên tắc "hộp kính"

Mọi con số trên trang đều do `src/lib/ml-core` sinh ra. Mỗi thuật toán vừa chạy vừa ghi lại
**trace**: danh sách các bước, mỗi bước gồm trạng thái và các phép tính (`Calc`) với công thức
tổng quát, công thức đã thay số và từng số hạng. Hình vẽ, bảng, công thức đều đọc từ trace nên luôn khớp nhau.

`tests/ml-core.test.ts` đối chiếu ml-core với NumPy và scikit-learn đến 1e-9. GitHub Actions chạy
kiểm thử trước mỗi lần phát hành; nếu toán sai, trang không được phát hành.

## Chạy trên máy

```bash
npm install
npm run dev        # http://localhost:4321/may-hoc-s2s/
npm test           # kiểm thử ml-core
npm run build      # xuất trang tĩnh ra dist/
npm run check      # kiểm tra kiểu TypeScript, Svelte, Astro
npm run test:e2e   # kiểm thử khói trên bản build (lần đầu: npx playwright install chromium)
```

Chuẩn bị lại dữ liệu và kết quả tham chiếu (cần Python 3 với numpy, scikit-learn):

```bash
python3 scripts/prepare_data.py   # chương 0–2
python3 scripts/prep_du_lieu.py   # chương 3A, 3B
for c in 3 4 5 6 7 8 9 10; do python3 scripts/prep_ch$c.py; done
```

Tên tệp `prep_ch3.py` … `prep_ch10.py` và thư mục `components/ch3/` … `ch10/` giữ số cũ, từ trước khi
có chương Dữ liệu: chúng ứng với chương 4–11 hiện nay.

CNN (chương 10) và attention (chương 11) được huấn luyện bằng NumPy thuần trong các script này;
trình duyệt chỉ chạy lan truyền xuôi với trọng số đã lưu.

## Cấu trúc

```text
src/
├── lib/ml-core/        # thuật toán TypeScript có ghi trace: hồi quy, KNN, Naive Bayes, cây, SVM,
│                       #   K-means, DBSCAN, PCA, đánh giá, mạng nơ-ron, CNN, attention,
│                       #   hồ sơ dữ liệu, điền thiếu, biến đổi, chia dữ liệu, nhãn sai
├── lib/katex.ts        # macro màu: \cw{} \cb{} \cx{} \cy{} \cyh{} \ce{} \cL{} \cg{} \ceta{} \cz{} \cp{}
├── lib/lessons.ts      # danh sách chương cho trang chủ và điều hướng
├── components/         # StepDebugger, CalcCard, Axis, PyCell, Quiz, Tex, Lazy
│   ├── gd/ linreg/ logreg/   # phòng thí nghiệm chương 0–2
│   ├── dulieu/               # phòng thí nghiệm chương 3A, 3B
│   └── ch3/ … ch10/          # phòng thí nghiệm chương 4–11 (tên thư mục theo số cũ)
├── layouts/            # Base (khung trang), Lesson (7 phần của một bài)
├── pages/bai-hoc/      # mỗi bài học một trang
└── data/               # JSON sinh bởi scripts/, nơi duy nhất chứa dữ liệu của trang
data/raw/               # dữ liệu gốc
scripts/                # tiền xử lý và sinh kết quả tham chiếu
tests/                  # kiểm thử và fixtures
```

## Viết một bài mới

1. Thêm thuật toán vào `src/lib/ml-core/`, ghi trace theo định dạng trong `trace.ts`.
2. Sinh kết quả tham chiếu bằng NumPy/scikit-learn trong `scripts/prepare_data.py` và thêm kiểm thử.
3. Tạo các phòng thí nghiệm trong `src/components/<bai>/`, dùng lại `StepDebugger`, `CalcCard`, `Axis`.
4. Tạo trang `src/pages/bai-hoc/<slug>.astro` dùng layout `Lesson` với 7 phần:
   bài toán · khám phá dữ liệu · trực giác · tính tay · lý thuyết · mã nguồn · toàn bộ dữ liệu.
5. Đặt `ready: true` cho chương trong `src/lib/lessons.ts`.

Dữ liệu lớn không nhúng vào HTML. Trang lấy URL bằng `import url from '../../data/x.json?url'`
(Vite xuất tệp vào `_astro/` kèm mã băm), rồi bọc phòng thí nghiệm trong `Lazy`:

```astro
<Lazy client:visible view="logreg/FullLogReg"
      data={{ patients: `${cancerUrl}#patients`, testIds: `${cancerUrl}#testIds` }} />
```

`Lazy` chỉ tải mã và JSON khi phòng thí nghiệm sắp hiện lên màn hình, mỗi URL một lần cho cả trang,
rồi truyền vào như props bình thường. Ô Python dùng chung URL đó: `open_url("${cancerUrl}")`.
Dữ liệu nhỏ (vài KB) vẫn có thể truyền thẳng qua props.

Quy ước màu: mỗi đại lượng một màu cố định (CSS `--c-w`, `--c-b`, … trong `src/styles/global.css`),
dùng chung cho hình, công thức, bảng và lời giảng.

## Giấy phép

- Mã nguồn: MIT (xem `LICENSE`).
- Nội dung bài học: CC BY-SA 4.0.
- Dữ liệu (nguồn ghi ở cuối mỗi bài):
  California Housing (U.S. Census 1990, bản CSV trong ageron/handson-ml2);
  Breast Cancer Wisconsin, Iris, chữ số viết tay 8×8 (UCI, bản trong scikit-learn);
  SMS Spam Collection (UCI, CC BY 4.0); Titanic (datasciencedojo/datasets);
  Palmer Penguins (CC0, mwaskom/seaborn-data); Fashion-MNIST (Zalando Research, MIT).

## Thiết kế

Giao diện mô phỏng **trang vở ô ly**: giấy kẻ ô tím nhạt, lề đỏ, chữ in Literata, ghi chú viết tay
(Patrick Hand) bằng mực tím chỉ dùng cho số thứ tự phần và ghi chú lề. Chế độ tối là **bảng đen**.
Font được tự host qua Fontsource (có đủ dấu tiếng Việt), không gọi Google Fonts.
Token màu và nguyên tắc nằm ở đầu `src/styles/global.css`.
