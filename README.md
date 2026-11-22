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
| 12A | Dự án bụi mịn Hà Nội (A): kiểm soát chất lượng trạm đo, mốc so sánh, rò rỉ theo thời gian, ôn lại chương 0–8 | PM2.5 7 trạm Hà Nội (OpenAQ), thời tiết ERA5 (Open-Meteo), 2023–2026 |
| 12B | Dự án bụi mịn Hà Nội (B): cross-validation theo thời gian, MLP, CNN 1D và attention trên 72 giờ, lệch phân phối sau triển khai | Như 12A, thêm số liệu theo giờ |

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

Thêm bài hoặc đổi tên bài trong `src/lib/lessons.ts` thì điền `seoTitle`, `seoDescription` (120–165 ký tự)
và sinh lại ảnh chia sẻ 1200×630 vào `public/og/` bằng `npm run og`, rồi commit các ảnh đó.
Sitemap ở `/may-hoc-s2s/sitemap.xml`; trang nằm trong thư mục con của github.io nên không có `robots.txt`,
hãy nộp sitemap tay trong Google Search Console và Bing Webmaster Tools.

Chuẩn bị lại dữ liệu và kết quả tham chiếu (cần Python 3 với numpy, scikit-learn):

```bash
python3 scripts/prepare_data.py   # chương 0–2
python3 scripts/prep_du_lieu.py   # chương 3A, 3B
for c in 3 4 5 6 7 8 9 10; do python3 scripts/prep_ch$c.py; done
python3 scripts/fetch_ch12.py    # chương 12: tải một lần vào data/raw/hanoi/ (đã có sẵn, dữ liệu đóng băng)
python3 scripts/prep_ch12.py     # chương 12: kiểm soát chất lượng, đặc trưng, mọi mô hình (cần pandas, scipy; khoảng 3 phút)
```

Tên tệp `prep_ch3.py` … `prep_ch10.py` và thư mục `components/ch3/` … `ch10/` giữ số cũ, từ trước khi
có chương Dữ liệu: chúng ứng với chương 4–11 hiện nay.

CNN (chương 10) và attention (chương 11) được huấn luyện bằng NumPy thuần trong các script này;
trình duyệt chỉ chạy lan truyền xuôi với trọng số đã lưu.

## Cấu trúc

```text
src/
├── lib/ml-core/        # thuật toán TypeScript có ghi trace: hồi quy, KNN, Naive Bayes, cây, SVM, chuỗi thời gian,
│                       #   K-means, DBSCAN, PCA, đánh giá, mạng nơ-ron, CNN, attention,
│                       #   hồ sơ dữ liệu, điền thiếu, biến đổi, chia dữ liệu, nhãn sai
├── lib/katex.ts        # macro màu: \cw{} \cb{} \cx{} \cy{} \cyh{} \ce{} \cL{} \cg{} \ceta{} \cz{} \cp{}
├── lib/lessons.ts      # danh sách chương cho trang chủ và điều hướng
├── lib/giang/          # kịch bản bài giảng có lời, đọc số tiếng Việt, dòng thời gian
├── components/         # StepDebugger, CalcCard, Axis, PyCell, Quiz, Tex, Lazy
│   ├── gd/ linreg/ logreg/   # phòng thí nghiệm chương 0–2
│   ├── dulieu/               # phòng thí nghiệm chương 3A, 3B
│   ├── ch3/ … ch10/          # phòng thí nghiệm chương 4–11 (tên thư mục theo số cũ)
│   └── ch12/                 # phòng thí nghiệm dự án bụi mịn Hà Nội (12A, 12B)
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
6. Thêm khung trải nghiệm (xem `src/pages/bai-hoc/svm.astro` làm mẫu): viết nội dung trong
   `src/lib/hoc/<slug>.ts` theo kiểu `LessonLearn` (`src/lib/learn.ts`), đặt `extended: true` cho bài,
   rồi ghép các component trong `src/components/hoc/`:
   `Goals` ở đầu bài; `Mission` trước và `Debrief` sau mỗi lab chính; `Checkpoint` cuối bước 3–6;
   `Exercises` ở bước 6; bước 8 là `WrapUp` (gồm `Takeaways`, `Quiz`, `SelfCheck`, `Exercises`).
   Đăng ký nội dung trong `src/lib/hoc/index.ts`. Mọi số trong bảng ghi phải được kiểm thử lại trong
   `tests/learn.test.ts` bằng chính logic của lab.

Dữ liệu lớn không nhúng vào HTML. Trang lấy URL bằng `import url from '../../data/x.json?url'`
(Vite xuất tệp vào `_astro/` kèm mã băm), rồi bọc phòng thí nghiệm trong `Lazy`:

```astro
<Lazy client:visible view="logreg/FullLogReg"
      data={{ patients: `${cancerUrl}#patients`, testIds: `${cancerUrl}#testIds` }} />
```

`Lazy` chỉ tải mã và JSON khi phòng thí nghiệm sắp hiện lên màn hình, mỗi URL một lần cho cả trang,
rồi truyền vào như props bình thường. Ô Python dùng chung URL đó: `open_url("${cancerUrl}")`.
Dữ liệu nhỏ (vài KB) vẫn có thể truyền thẳng qua props.

## Bài giảng có lời

Bài có `lecture: true` trong `src/lib/lessons.ts` có thêm một bài giảng khoảng 10 phút ngay sau phần
"Trước khi học": các cảnh mô phỏng chạy theo giọng đọc, kèm phụ đề, chương và bản chép lời. Đây không phải
tệp video. Trình phát `src/components/giang/Lecture.svelte` dựng hình bằng SVG theo thời điểm của tệp âm
thanh, nên số trên hình vẫn do ml-core tính, và mỗi bài chỉ tốn khoảng 3,6 MB.

1. Viết kịch bản trong `src/lib/giang/<slug>.ts` (mẫu: `gradient-descent.ts`) và đăng ký trong
   `src/lib/giang/index.ts`.
   - Mỗi chương ứng với một bước của bài.
   - Mỗi cảnh là một component trong `src/components/giang/scenes/`. Cảnh dùng chung gồm `Title`,
     `Bullets`, `Formula`, `Table`, `Code`; cảnh riêng của bài đặt trong thư mục con, ví dụ `gd/Bowl`.
   - Mỗi câu thoại có phụ đề `cap`. Lời đọc `say` là tuỳ chọn: mặc định nó được sinh từ phụ đề bằng
     `speak()`, hàm này đổi số và ký hiệu thành chữ. Câu thoại cũng có thể kèm `set` để đổi trạng thái
     cảnh; trạng thái này được nội suy trong lúc câu đang được đọc.
   - Cảnh dùng chung cho đồ thị: `Points` (điểm có lớp, vùng quyết định, tâm cụm), `Chart` (đường, cột),
     `Grid` (ma trận, bản đồ nhiệt, ảnh), `Diagram` (cây).
2. Sinh giọng (cần `pip install edge-tts`):
   ```bash
   npm run build
   python3 scripts/gen_voice.py --only <slug>   # ghi public/giang/<slug>/: loi-giang.mp3, thoi-gian.json, phu-de.vtt
   ```
   Mỗi câu được lưu đệm theo mã băm trong `data/voice-cache/` (không commit), nên sửa một câu thì chỉ
   phải tạo lại câu đó. Dịch vụ đọc hay từ chối ngẫu nhiên; script tự thử lại nhiều lần, nên một bài
   có thể mất vài chục phút.
3. Đặt `lecture: true` và chèn `<LectureSection slug="<slug>" />` ngay sau `<Goals>`.

`tests/giang.test.ts` kiểm tra hai điều:
- âm thanh còn khớp từng câu của kịch bản, nên sửa lời mà quên sinh lại giọng thì CI đỏ;
- các số trong bảng ghi của bài được nói đúng trong bài giảng.

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
- Giọng đọc bài giảng: tổng hợp bằng Microsoft Edge TTS (giọng vi-VN-HoaiMyNeural) qua thư viện edge-tts.

## Thiết kế

Giao diện mô phỏng **trang vở ô ly**: giấy kẻ ô tím nhạt, lề đỏ, chữ in Literata, ghi chú viết tay
(Patrick Hand) bằng mực tím chỉ dùng cho số thứ tự phần và ghi chú lề. Chế độ tối là **bảng đen**.
Font được tự host qua Fontsource (có đủ dấu tiếng Việt), không gọi Google Fonts.
Token màu và nguyên tắc nằm ở đầu `src/styles/global.css`.
