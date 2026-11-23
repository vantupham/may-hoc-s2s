/**
 * Các bộ dữ liệu thật dùng trong bài, cho trang /du-lieu/. Số liệu lấy từ src/data/*.json;
 * nguồn và giấy phép chép từ phần "Nguồn dữ liệu" cuối mỗi bài. Bài dùng bộ nào được suy ra
 * từ trường `dataset` của lessons.ts qua `match` (xem src/pages/du-lieu.astro).
 * Tệp này không import gì để scripts/og.ts đọc được bằng Node trực tiếp.
 */
export interface DataSet {
  id: string;
  name: string;
  /** Một câu: dữ liệu là gì */
  what: string;
  /** Quy mô và những điều đáng chú ý */
  facts: string[];
  source: string;
  license?: string;
  /** Cụm chữ trong lessons[].dataset để biết bài nào dùng bộ này */
  match: string;
}

export const datasets: DataSet[] = [
  {
    id: 'california-housing', name: 'California Housing', match: 'California Housing',
    what: 'Giá nhà trung vị của các khu vực dân cư ở bang California, theo điều tra dân số Mỹ năm 1990.',
    facts: ['20.640 khu vực', 'Kinh độ, vĩ độ, tuổi nhà, số phòng, số phòng ngủ, dân số, số hộ, thu nhập trung vị, vị trí so với biển', '207 khu vực thiếu số phòng ngủ; 965 khu vực có giá bị chặn trần'],
    source: 'U.S. Census 1990; Pace và Barry (1997). Bản CSV trong kho ageron/handson-ml2.',
  },
  {
    id: 'breast-cancer', name: 'Breast Cancer Wisconsin (Diagnostic)', match: 'Breast Cancer',
    what: 'Số đo nhân tế bào trên ảnh mẫu sinh thiết khối u vú, kèm chẩn đoán lành tính hay ác tính.',
    facts: ['569 mẫu sinh thiết: 212 ác tính, 357 lành tính', '30 đặc trưng: bán kính, độ nhám, chu vi, diện tích… của nhân tế bào'],
    source: 'Wolberg, Street và Mangasarian (1995), UCI Machine Learning Repository; bản có sẵn trong scikit-learn.',
  },
  {
    id: 'titanic', name: 'Titanic', match: 'Titanic',
    what: 'Danh sách hành khách tàu Titanic năm 1912 và việc họ có sống sót hay không.',
    facts: ['891 hành khách', 'Bài dùng 5 đặc trưng: giới tính, hạng vé, tuổi, giá vé và số người thân đi cùng', 'Nhiều hành khách không có tuổi'],
    source: 'Encyclopedia Titanica; bản 891 hành khách phổ biến trong giảng dạy, CSV trong kho datasciencedojo/datasets.',
  },
  {
    id: 'iris', name: 'Iris', match: 'Iris',
    what: 'Số đo đài hoa và cánh hoa của ba loài hoa diên vĩ.',
    facts: ['150 bông hoa, 50 bông mỗi loài', 'Gốc có 4 số đo; bài dùng chiều dài và chiều rộng của cánh hoa'],
    source: 'R. A. Fisher (1936), UCI Machine Learning Repository; bản trong scikit-learn.',
  },
  {
    id: 'sms-spam', name: 'SMS Spam Collection', match: 'SMS Spam',
    what: 'Tin nhắn SMS tiếng Anh, mỗi tin được gán nhãn là tin rác hay tin bình thường.',
    facts: ['5.574 tin nhắn, trong đó 747 tin rác'],
    source: 'T. A. Almeida và J. M. Gómez Hidalgo (2011), UCI Machine Learning Repository.',
    license: 'CC BY 4.0',
  },
  {
    id: 'palmer-penguins', name: 'Palmer Penguins', match: 'Palmer',
    what: 'Số đo chim cánh cụt của ba loài trên các đảo gần trạm nghiên cứu Palmer, Nam Cực.',
    facts: ['342 con có đủ số đo, thuộc 3 loài: Adelie, Chinstrap, Gentoo', 'Bài dùng chiều dài và độ dày của mỏ'],
    source: 'Gorman, Williams và Fraser (2014), Palmer Station LTER; CSV trong kho mwaskom/seaborn-data.',
    license: 'CC0',
  },
  {
    id: 'digits', name: 'Chữ số viết tay 8×8', match: 'chữ số viết tay',
    what: 'Ảnh chữ số viết tay từ 0 đến 9, mỗi ảnh thu nhỏ thành lưới 8×8 điểm ảnh.',
    facts: ['1.797 ảnh', '64 điểm ảnh, mỗi điểm có độ đậm từ 0 đến 16'],
    source: 'Optical Recognition of Handwritten Digits, Alpaydin và Kaynak (1998), UCI Machine Learning Repository; bản trong scikit-learn.',
    license: 'CC BY 4.0',
  },
  {
    id: 'fashion-mnist', name: 'Fashion-MNIST', match: 'Fashion-MNIST',
    what: 'Ảnh đen trắng các món đồ thời trang của Zalando: áo, quần, giày, túi…',
    facts: ['Bài dùng 10.000 ảnh của tập t10k: 8.000 để huấn luyện, 2.000 để kiểm tra', '10 loại đồ'],
    source: 'H. Xiao, K. Rasul và R. Vollgraf (2017), Zalando Research.',
    license: 'MIT',
  },
  {
    id: 'pm25-ha-noi', name: 'Bụi mịn PM2.5 Hà Nội', match: 'PM2.5 Hà Nội',
    what: 'Nồng độ bụi mịn PM2.5 theo giờ ở các trạm quan trắc tự động tại Hà Nội, ghép với số liệu thời tiết.',
    facts: ['7 trạm đo, từ 01/01/2023 đến 15/11/2026', '1.415 ngày, 33.960 giờ', 'Thời tiết: gió, độ ẩm, nhiệt độ, mưa, độ cao lớp biên, áp suất'],
    source: 'PM2.5: kho lưu trữ mở của OpenAQ. Thời tiết: tái phân tích ERA5 của ECMWF qua Open-Meteo (CC BY 4.0).',
  },
];
