/**
 * Bài giảng chương 10: mạng tích chập trên Fashion-MNIST. Trọng số đã huấn luyện sẵn (fashion-cnn.json);
 * trang chỉ chạy lan truyền xuôi bằng ml-core (conv2d, relu, maxpool, cnnForward), như các lab.
 */
import data from '../../data/fashion-cnn.json';
import { decodeImage, conv2d, relu, maxpool, cnnForward, fmt, type CNN } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const pc = (v: number, d = 1) => fmt(100 * v, d);
const spc = (v: number, d = 1) => `${sn(100 * v, d)} phần trăm`;

export const cnnPyCode = `import numpy as np

# Tích chập bằng tay: ảnh 6×6 có một vạch dọc sáng, bộ lọc "cạnh dọc"
anh = np.zeros((6, 6)); anh[:, 3] = 1.0
loc = np.array([[-1, 0, 1],
                [-1, 0, 1],
                [-1, 0, 1]])

ra = np.zeros((4, 4))
for r in range(4):
    for c in range(4):
        cua_so = anh[r:r + 3, c:c + 3]          # cửa sổ 3×3
        ra[r, c] = (cua_so * loc).sum()         # nhân từng cặp, cộng lại
print("Sau ReLU:"); print(np.maximum(0, ra))

# Max-pool 2×2
pool = np.maximum(0, ra).reshape(2, 2, 2, 2).max(axis=(1, 3))
print("Sau max-pool 2×2:"); print(pool)`;

export function cnnLecture(): Lecture {
  const net = data as unknown as CNN & { names: string[]; nTrain: number; nTest: number; testAcc: number; confusion: number[][]; images: { y: number; b64: string }[] };
  const names = net.names;
  const imgs = net.images.map((im) => ({ y: im.y, px: decodeImage(im.b64) }));
  const grid = (px: number[], n: number) => Array.from({ length: n }, (_, r) => px.slice(r * n, r * n + n));
  const oneOf = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => imgs.find((im) => im.y === c)!);
  const ex = imgs[0];
  const vert = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
  const blur = Array.from({ length: 3 }, () => [1 / 9, 1 / 9, 1 / 9]);
  const r0 = 10, c0 = 10;
  const at = (k: number[][], b: number) => Math.max(0, conv2d(ex.px, 28, k, b)[r0 * 26 + c0]);
  const vals = { vert: at(vert, 0), blur: at(blur, 0), l1: at(net.Wc[0], net.bc[0]), l2: at(net.Wc[1], net.bc[1]) };
  const crop = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => ex.px[(r0 - 1 + i) * 28 + c0 - 1 + j]));
  const mapOf = (k: number[][], b: number) => grid(relu(conv2d(ex.px, 28, k, b)), 26);
  const res = cnnForward(net, ex.px);
  const top = res.p.map((p, k) => ({ p, k })).sort((a, b) => b.p - a.p);
  const pk = (k: number) => res.p[k];
  const K = { coat: names.indexOf('Áo khoác'), shirt: names.indexOf('Áo sơ mi'), tee: names.indexOf('Áo phông') };
  const cm = net.confusion;
  const shirtOk = cm[K.shirt][K.shirt], shirtTee = cm[K.shirt][K.tee];
  // Ví dụ tính tay của ô mã: ảnh 6×6 có vạch sáng ở cột 3, bộ lọc cạnh dọc
  const toy = Array.from({ length: 36 }, (_, i) => (i % 6 === 3 ? 1 : 0));
  const toyMap = conv2d(toy, 6, vert, 0);
  const toyRelu = relu(toyMap);
  const toyPool = maxpool(toyRelu, 4).out;
  const nParams = 6 * 10 + 1014 * 10 + 10;
  const pool = maxpool(relu(conv2d(ex.px, 28, net.Wc[1], net.bc[1])), 26);

  return {
    slug: 'cnn',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 10', title: 'Mạng tích chập', sub: 'bộ lọc 3×3 trượt qua ảnh · Fashion-MNIST' },
            lines: [
              L('Chương 10: mạng tích chập, gọi tắt là CNN.', undefined, { say: 'Chương mười: mạng tích chập, gọi tắt là CNN.' }),
              L('Năm 2017, Zalando, một cửa hàng thời trang trực tuyến ở Đức, công bố Fashion-MNIST: ảnh sản phẩm thật, thu nhỏ còn 28 nhân 28 điểm ảnh xám, thuộc 10 loại. Cho một ảnh, đó là loại gì?', undefined, { say: 'Năm hai nghìn không trăm mười bảy, Zalando, một cửa hàng thời trang trực tuyến ở Đức, công bố Fashion-MNIST: ảnh sản phẩm thật, thu nhỏ còn hai mươi tám nhân hai mươi tám điểm ảnh xám, thuộc mười loại. Cho một ảnh, đó là loại gì?' }),
            ],
          },
          {
            view: 'Grid', props: { title: 'Mười loại sản phẩm', mats: oneOf.map((im) => ({ title: names[im.y], vals: grid(im.px, 28), kind: 'img', cell: 3 })) },
            init: { n: 0 },
            lines: [
              L('Mười loại: áo phông, quần dài, áo len, váy liền, áo khoác, dép, áo sơ mi, giày thể thao, túi xách và bốt.', { n: 10 }, { anim: 3, ease: 'lin' }),
              L(`Mỗi ảnh có 784 điểm ảnh, giá trị từ 0 đến 255; ta chia cho 255. Trang này dùng ${net.nTrain.toLocaleString('vi-VN')} ảnh để huấn luyện và ${net.nTest.toLocaleString('vi-VN')} ảnh để kiểm tra.`, undefined, { say: `Mỗi ảnh có bảy trăm tám mươi tư điểm ảnh, giá trị từ không đến hai trăm năm mươi lăm; ta chia cho hai trăm năm mươi lăm. Trang này dùng ${speakNum(net.nTrain.toLocaleString('vi-VN'))} ảnh để huấn luyện và ${speakNum(net.nTest.toLocaleString('vi-VN'))} ảnh để kiểm tra.` }),
              L('Áo phông, áo sơ mi, áo len và áo khoác trông rất giống nhau ở cỡ ảnh này. Đó sẽ là chỗ khó của mọi mô hình.'),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Vì sao không dùng mạng của chương 9?', items: [
              'Tầng đầu 32 nơ-ron cần <b>784 × 32 = 25.088</b> trọng số.',
              'Mỗi trọng số gắn với <b>đúng một vị trí</b> trong ảnh.',
              'Học "có cạnh ở góc trái trên" không giúp nhận ra <b>cạnh ở giữa ảnh</b>.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Nếu dùng mạng của chương 9, tầng đầu với 32 nơ-ron cần 784 nhân 32, tức hơn 25 nghìn trọng số.', { n: 1, hl: 0 }, { say: 'Nếu dùng mạng của chương chín, tầng đầu với ba mươi hai nơ-ron cần bảy trăm tám mươi tư nhân ba mươi hai, tức hơn hai mươi lăm nghìn trọng số.' }),
              L('Tệ hơn, mỗi trọng số gắn với đúng một vị trí trong ảnh.', { n: 2, hl: 1 }),
              L('Học được "có cạnh ở góc trái trên" không giúp gì cho việc nhận ra một cạnh giống hệt ở giữa ảnh. Mạng phải học lại cùng một thứ ở từng vị trí.', { n: 3, hl: 2 }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: con tem 3×3', section: 'truc-giac',
        scenes: [
          {
            view: 'Grid',
            props: { title: 'Đặt con tem lên ảnh', mats: [
              { title: 'Một góc ảnh 5×5', vals: crop, kind: 'heat', digits: 2, cell: 62 },
              { title: 'Con tem "cạnh dọc"', vals: vert, kind: 'heat', signed: true, digits: 0, cell: 62 },
            ] },
            init: { n: 1, win: '' },
            lines: [
              L('Hãy tưởng tượng một con tem 3 nhân 3 ô có in sẵn các con số.', { n: 2 }, { say: 'Hãy tưởng tượng một con tem ba nhân ba ô có in sẵn các con số.' }),
              L('Đặt con tem lên một góc của ảnh, nhân từng số trên tem với điểm ảnh bên dưới, cộng 9 tích lại: được một con số.', { win: '0,1,1,3,3' }, { say: 'Đặt con tem lên một góc của ảnh, nhân từng số trên tem với điểm ảnh bên dưới, cộng chín tích lại: được một con số.' }),
              L('Dịch tem sang phải một ô, làm lại. Rồi lại dịch. Quét hết ảnh, ta được một bản đồ mới.', { win: '0,1,2,3,3' }),
              L('Con tem này âm bên trái, dương bên phải. Con số sẽ lớn ở những chỗ ảnh chuyển từ tối sang sáng theo chiều ngang: nó là một bộ dò cạnh dọc.', { win: '' }),
              L('Mỗi con tem là một câu hỏi nhỏ, hỏi ở mọi vị trí: ở đây có cạnh dọc không? Có vùng sáng không? Có góc nhọn không?'),
              L('Điều kỳ diệu: CNN không cần ai thiết kế tem. Nó tự học các con số trên tem bằng lan truyền ngược.'),
            ],
          },
          {
            view: 'Grid',
            props: { title: `Một ảnh ${names[ex.y].toLowerCase()}, qua bốn con tem (sau ReLU)`, mats: [
              { title: 'ảnh gốc', vals: grid(ex.px, 28), kind: 'img', cell: 6.2 },
              { title: 'cạnh dọc (tự đặt)', vals: mapOf(vert, 0), kind: 'img', cell: 6.7 },
              { title: 'học được 1', vals: mapOf(net.Wc[0], net.bc[0]), kind: 'img', cell: 6.7 },
              { title: 'học được 2', vals: mapOf(net.Wc[1], net.bc[1]), kind: 'img', cell: 6.7 },
            ] },
            init: { n: 1 },
            lines: [
              L(`Đây là một ảnh ${names[ex.y].toLowerCase()} trong tập test.`, undefined, { say: `Đây là một ảnh ${names[ex.y].toLowerCase()} trong tập test.` }),
              L('Qua con tem cạnh dọc tự đặt: chỉ những mép dọc của chiếc áo sáng lên.', { n: 2 }),
              L('Còn đây là hai bộ lọc mạng tự học được. Một cái sáng ở các mép, giống bộ dò cạnh; một cái sáng ở cả vùng vải.', { n: 4 }, { anim: 2 }),
              L('Mạng tự khám phá lại những gì con người từng thiết kế bằng tay.'),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: một ô', section: 'tinh-tay',
        scenes: [
          {
            view: 'Formula',
            props: { title: `Ô (${r0}, ${c0}) của bản đồ đặc trưng`, items: [
              { label: 'Một ô', tex: String.raw`s_{r,c} = b + \sum_{i=0}^{2}\sum_{j=0}^{2} k_{i,j}\; x_{r+i,\,c+j}, \qquad a_{r,c} = \max(0, s_{r,c})` },
              { label: 'Cạnh dọc', tex: String.raw`a = ${fmt(vals.vert, 3).replace(',', '{,}')}` },
              { label: 'Làm mờ', tex: String.raw`a = ${fmt(vals.blur, 3).replace(',', '{,}')}` },
              { label: 'Học được 1, 2', tex: String.raw`a = ${fmt(vals.l1, 3).replace(',', '{,}')} \qquad a = ${fmt(vals.l2, 3).replace(',', '{,}')}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Mỗi ô của bản đồ đặc trưng là 9 phép nhân, cộng lại, cộng bias, rồi qua ReLU.', { n: 1, hl: 0 }, { say: 'Mỗi ô của bản đồ đặc trưng là chín phép nhân, cộng lại, cộng bias, rồi qua ReLU.' }),
              L(`Tại ô hàng ${r0}, cột ${c0}, nằm giữa vùng vải gần như đều màu: bộ dò cạnh dọc cho ${fmt(vals.vert, 3)}. Không có cạnh nào ở đó.`, { n: 2, hl: 1 }, { say: `Tại ô hàng mười, cột mười, nằm giữa vùng vải gần như đều màu: bộ dò cạnh dọc cho ${sn(vals.vert, 3)}. Không có cạnh nào ở đó.` }),
              L(`Con tem làm mờ, chín ô một phần chín, chỉ lấy trung bình: ${fmt(vals.blur, 3)}.`, { n: 3, hl: 2 }, { say: `Con tem làm mờ, chín ô một phần chín, chỉ lấy trung bình: ${sn(vals.blur, 3)}.` }),
              L(`Bộ lọc học được 1 cho ${fmt(vals.l1, 3)}, bộ lọc 2 cho ${fmt(vals.l2, 3)}: bộ lọc thứ hai phản ứng với vùng vải.`, { n: 4, hl: 3 }, { say: `Bộ lọc học được một cho ${sn(vals.l1, 3)}, bộ lọc hai cho ${sn(vals.l2, 3)}: bộ lọc thứ hai phản ứng với vùng vải.` }),
              L('Ở bước 4, bạn có thể bấm vào bất kỳ ô nào để xem đủ 9 phép nhân.', { hl: -1 }, { say: 'Ở bước bốn, bạn có thể bấm vào bất kỳ ô nào để xem đủ chín phép nhân.' }),
            ],
          },
          {
            view: 'Grid',
            props: { title: 'Tính trọn một ví dụ nhỏ', mats: [
              { title: 'ảnh 6×6', vals: grid(toy, 6), kind: 'heat', digits: 0, cell: 34 },
              { title: 'tích chập', vals: grid(toyMap, 4), kind: 'heat', signed: true, digits: 0, cell: 40 },
              { title: 'ReLU', vals: grid(toyRelu, 4), kind: 'heat', digits: 0, cell: 40 },
              { title: 'max-pool', vals: grid(toyPool, 2), kind: 'heat', digits: 0, cell: 46 },
            ] },
            init: { n: 1, win: '' },
            lines: [
              L('Tính trọn một ví dụ nhỏ: ảnh 6 nhân 6, toàn số 0, trừ một vạch sáng ở cột thứ tư.', undefined, { say: 'Tính trọn một ví dụ nhỏ: ảnh sáu nhân sáu, toàn số không, trừ một vạch sáng ở cột thứ tư.' }),
              L(`Trượt con tem cạnh dọc qua: được bản đồ 4 nhân 4. Cột bên trái vạch cho ${fmt(toyMap[1], 0)}, cột bên phải cho ${fmt(toyMap[3], 0)}.`, { n: 2 }, { say: `Trượt con tem cạnh dọc qua: được bản đồ bốn nhân bốn. Cột bên trái vạch cho ${speakNum(fmt(toyMap[1], 0))}, cột bên phải cho ${speakNum(fmt(toyMap[3], 0))}.` }),
              L('Dương là chỗ chuyển từ tối sang sáng, âm là chỗ chuyển từ sáng sang tối.'),
              L('ReLU giữ phần dương, xoá phần âm.', { n: 3 }),
              L(`Max-pool lấy số lớn nhất trong mỗi ô 2 nhân 2: chỉ còn 4 con số, mà vẫn giữ được điều quan trọng: có một cạnh tối sang sáng, ở nửa bên ${toyPool[0] > 0 ? 'trái' : 'phải'}.`, { n: 4 }, { say: `Max-pool lấy số lớn nhất trong mỗi ô hai nhân hai: chỉ còn bốn con số, mà vẫn giữ được điều quan trọng: có một cạnh tối sang sáng, ở nửa bên ${toyPool[0] > 0 ? 'trái' : 'phải'}.` }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Ba ý tưởng của CNN', items: [
              '<b>Chia sẻ trọng số</b>: 6 bộ lọc chỉ tốn 60 tham số, so với 25.088.',
              '<b>Max-pool 2×2</b>: giữ giá trị lớn nhất, bản đồ nhỏ đi 4 lần.',
              '<b>Gradient của bộ lọc</b> = tổng đóng góp từ mọi vị trí.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Không đệm viền, ảnh 28 nhân 28 cho bản đồ 26 nhân 26.', undefined, { say: 'Không đệm viền, ảnh hai mươi tám nhân hai mươi tám cho bản đồ hai mươi sáu nhân hai mươi sáu.' }),
              L('Mỗi bộ lọc chỉ có 9 trọng số và 1 bias, dùng chung cho mọi vị trí: gọi là chia sẻ trọng số. Sáu bộ lọc chỉ tốn 60 tham số.', { n: 1, hl: 0 }, { say: 'Mỗi bộ lọc chỉ có chín trọng số và một bias, dùng chung cho mọi vị trí: gọi là chia sẻ trọng số. Sáu bộ lọc chỉ tốn sáu mươi tham số.' }),
              L(`Max-pool giữ giá trị lớn nhất trong mỗi ô 2 nhân 2. Bản đồ 26 nhân 26 còn ${Math.sqrt(pool.out.length)} nhân ${Math.sqrt(pool.out.length)}.`, { n: 2, hl: 1 }, { say: `Max-pool giữ giá trị lớn nhất trong mỗi ô hai nhân hai. Bản đồ hai mươi sáu nhân hai mươi sáu còn ${speakNum(String(Math.sqrt(pool.out.length)))} nhân ${speakNum(String(Math.sqrt(pool.out.length)))}.` }),
              L('Mạng vì thế ít nhạy với việc hoạ tiết dịch đi một điểm ảnh. Khi lan truyền ngược, gradient chỉ chảy về đúng ô đã thắng trong mỗi cửa sổ.'),
              L('Vì một trọng số của bộ lọc được dùng ở mọi vị trí, gradient của nó là tổng đóng góp từ mọi vị trí. Bản thân phép tính đó cũng là một phép tích chập.', { n: 3, hl: 2 }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Cả mạng', items: [
              'Ảnh 28×28 → <b>6 bộ lọc 3×3</b> → 6 bản đồ 26×26 → ReLU',
              '→ <b>max-pool 2×2</b> → 6 bản đồ 13×13 → 1.014 con số',
              '→ <b>tầng dense</b> 10 nơ-ron → <b>softmax</b> → 10 xác suất',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ghép lại thành cả mạng. Ảnh đi qua 6 bộ lọc, được 6 bản đồ, qua ReLU.', { n: 1, hl: 0 }, { say: 'Ghép lại thành cả mạng. Ảnh đi qua sáu bộ lọc, được sáu bản đồ, qua ReLU.' }),
              L('Max-pool thu mỗi bản đồ còn 13 nhân 13. Trải phẳng ra: 1.014 con số.', { n: 2, hl: 1 }, { say: 'Max-pool thu mỗi bản đồ còn mười ba nhân mười ba. Trải phẳng ra: một nghìn không trăm mười bốn con số.' }),
              L('Một tầng dense như chương 9 biến chúng thành 10 điểm số, rồi softmax biến thành 10 xác suất.', { n: 3, hl: 2 }, { say: 'Một tầng dense như chương chín biến chúng thành mười điểm số, rồi softmax biến thành mười xác suất.' }),
              L(`Tổng cộng chỉ ${nParams.toLocaleString('vi-VN')} tham số, phần lớn nằm ở tầng dense cuối.`, { hl: -1 }, { say: `Tổng cộng chỉ ${speakNum(nParams.toLocaleString('vi-VN'))} tham số, phần lớn nằm ở tầng dense cuối.` }),
              L('Mạng trên trang được huấn luyện sẵn bằng NumPy; trình duyệt của bạn chỉ chạy phần lan truyền xuôi.'),
              L('Các mạng thật chồng nhiều tầng tích chập. Tầng đầu thấy ô 3 nhân 3, tầng sau thấy tổ hợp của các ô đó, nên vùng nhìn rộng dần: từ cạnh, đến hoạ tiết, đến cả bộ phận như cổ áo hay quai túi.', undefined, { say: 'Các mạng thật chồng nhiều tầng tích chập. Tầng đầu thấy ô ba nhân ba, tầng sau thấy tổ hợp của các ô đó, nên vùng nhìn rộng dần: từ cạnh, đến hoạ tiết, đến cả bộ phận như cổ áo hay quai túi.' }),
              L('Ý tưởng này có từ cuối thập niên 1980. Mạng LeNet của Yann LeCun từng đọc chữ số trên séc ngân hàng ở Mỹ.', undefined, { say: 'Ý tưởng này có từ cuối thập niên tám mươi. Mạng LeNet của Yann LeCun từng đọc chữ số trên séc ngân hàng ở Mỹ.' }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'tich_chap.py', code: cnnPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Tích chập và max-pool viết tay trên một ảnh 6 nhân 6 có một vạch sáng dọc.', { a: 3, b: 3 }, { say: 'Tích chập và max-pool viết tay trên một ảnh sáu nhân sáu có một vạch sáng dọc.' }),
              L('Bộ lọc cạnh dọc.', { a: 4, b: 6 }),
              L('Hai vòng lặp trượt cửa sổ 3 nhân 3 qua ảnh: nhân từng cặp, cộng lại.', { a: 9, b: 12 }, { say: 'Hai vòng lặp trượt cửa sổ ba nhân ba qua ảnh: nhân từng cặp, cộng lại.' }),
              L('Max-pool chỉ một dòng NumPy. Ở bước 6, thử đổi bộ lọc thành bộ dò cạnh ngang rồi đoán kết quả trước khi chạy.', { a: 16, b: 17 }, { say: 'Max-pool chỉ một dòng NumPy. Ở bước sáu, thử đổi bộ lọc thành bộ dò cạnh ngang rồi đoán kết quả trước khi chạy.' }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Cả mạng trên dữ liệu thật', section: 'danh-gia',
        scenes: [
          {
            view: 'Chart',
            props: { title: `Mạng đoán gì về ảnh này? (thật: ${names[ex.y].toLowerCase()})`, bars: res.p.map((p, k) => ({ label: names[k].replace('Áo len chui đầu', 'Áo len').replace('Dép xăng-đan', 'Dép').replace('Giày thể thao', 'Giày').replace('Bốt cổ ngắn', 'Bốt'), value: p, color: k === ex.y ? 1 : 0, text: `${pc(p, 1)}%` })), ylab: 'xác suất', ydom: [0, 1], yfmt: 'pct' },
            init: { n: 0, hl: -1 },
            lines: [
              L('Đưa chính ảnh đó qua cả mạng.', { n: 10 }, { anim: 2.5, ease: 'lin' }),
              L(`Áo khoác: ${pc(pk(K.coat))}%. Áo sơ mi: ${pc(pk(K.shirt))}%.`, { hl: K.coat }, { say: `Áo khoác: ${spc(pk(K.coat))}. Áo sơ mi: ${spc(pk(K.shirt))}.` }),
              L('Xác suất là thông tin hữu ích. Khi mạng không chắc, một hệ thống thật có thể chuyển ảnh đó cho người xem lại thay vì tự quyết.'),
              L(`Mạng ${res.pred === ex.y ? 'đoán đúng' : 'đoán sai'}, nhưng không chắc chắn lắm: hai loại áo này thật sự giống nhau ở 28 nhân 28 điểm ảnh.`, { hl: -1 }, { say: `Mạng ${res.pred === ex.y ? 'đoán đúng' : 'đoán sai'}, nhưng không chắc chắn lắm: hai loại áo này thật sự giống nhau ở hai mươi tám nhân hai mươi tám điểm ảnh.` }),
            ],
          },
          {
            view: 'Grid',
            props: { title: `Ma trận nhầm lẫn trên ${net.nTest.toLocaleString('vi-VN')} ảnh test`, mats: [{ rows: names.map((n) => n.replace('Áo len chui đầu', 'Áo len').replace('Dép xăng-đan', 'Dép').replace('Giày thể thao', 'Giày').replace('Bốt cổ ngắn', 'Bốt')), cols: [...'0123456789'], vals: cm, kind: 'heat', digits: 0, cell: 36 }] },
            init: { n: 1, hl: '' },
            lines: [
              L(`Trên ${net.nTest.toLocaleString('vi-VN')} ảnh test, mạng chỉ với 6 bộ lọc đạt ${pc(net.testAcc)}%.`, undefined, { say: `Trên ${speakNum(net.nTest.toLocaleString('vi-VN'))} ảnh test, mạng chỉ với sáu bộ lọc đạt ${spc(net.testAcc)}.` }),
              L('Quần, túi, giày, dép gần như không nhầm.'),
              L(`Áo sơ mi khó nhất: chỉ ${shirtOk} ảnh đoán đúng, và ${shirtTee} ảnh bị đoán là áo phông.`, { hl: `0,${K.shirt},${K.tee}` }, { say: `Áo sơ mi khó nhất: chỉ ${speakNum(String(shirtOk))} ảnh đoán đúng, và ${speakNum(String(shirtTee))} ảnh bị đoán là áo phông.` }),
              L(`Thêm ${cm[K.shirt][K.coat]} ảnh áo sơ mi bị đoán là áo khoác. Ở 28 nhân 28 điểm ảnh, cổ áo và hàng cúc gần như biến mất.`, { hl: `0,${K.shirt},${K.coat}` }, { say: `Thêm ${speakNum(String(cm[K.shirt][K.coat]))} ảnh áo sơ mi bị đoán là áo khoác. Ở hai mươi tám nhân hai mươi tám điểm ảnh, cổ áo và hàng cúc gần như biến mất.` }),
              L('Các CNN sâu hơn, với nhiều tầng tích chập chồng lên nhau, đạt trên 93% trên Fashion-MNIST.', { hl: '' }, { say: 'Các CNN sâu hơn, với nhiều tầng tích chập chồng lên nhau, đạt trên chín mươi ba phần trăm trên Fashion-MNIST.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Quên chuẩn hoá điểm ảnh</b> về 0–1 → học không ổn định.',
              '<b>Nhầm thứ tự chiều</b> (cao, rộng, kênh) giữa các thư viện.',
              '<b>Kết luận "mạng hiểu quần áo"</b> → nó chỉ học thống kê điểm ảnh.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Ba bẫy thường gặp. Một: quên chuẩn hoá điểm ảnh về khoảng 0 đến 1.', { n: 1, hl: 0 }, { say: 'Ba bẫy thường gặp. Một: quên chuẩn hoá điểm ảnh về khoảng không đến một.' }),
              L('Hai: nhầm thứ tự chiều cao, rộng, kênh giữa các thư viện. Rất nhiều lỗi CNN trong thực tế là lỗi sắp xếp mảng.', { n: 2, hl: 1 }),
              L(`Ba: kết luận rằng mạng hiểu quần áo. Nó chỉ học thống kê điểm ảnh của ${net.nTrain.toLocaleString('vi-VN')} ảnh nền đen, sản phẩm đặt giữa. Ảnh chụp ngoài đời sẽ làm nó lúng túng.`, { n: 3, hl: 2 }, { say: `Ba: kết luận rằng mạng hiểu quần áo. Nó chỉ học thống kê điểm ảnh của ${speakNum(net.nTrain.toLocaleString('vi-VN'))} ảnh nền đen, sản phẩm đặt giữa. Ảnh chụp ngoài đời sẽ làm nó lúng túng.` }),
            ],
          },
        ],
      },
      {
        id: 'tong-ket', title: 'Tổng kết', section: 'tong-ket',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Nhớ gì sau bài này', items: [
              'Bộ lọc 3×3 <b>trượt qua ảnh</b>: 9 phép nhân, cộng, ReLU.',
              '<b>Chia sẻ trọng số</b>: một bộ dò dùng cho mọi vị trí.',
              '<b>Max-pool</b> thu nhỏ bản đồ, bớt nhạy với dịch chuyển.',
              'Mạng <b>tự học</b> bộ dò cạnh, bộ dò vùng.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Một bộ lọc 3 nhân 3 trượt qua ảnh: 9 phép nhân, cộng lại, qua ReLU. Cùng một bộ lọc dùng cho mọi vị trí.', { n: 2, hl: 1 }, { anim: 2, say: 'Một bộ lọc ba nhân ba trượt qua ảnh: chín phép nhân, cộng lại, qua ReLU. Cùng một bộ lọc dùng cho mọi vị trí.' }),
              L('Max-pool thu nhỏ bản đồ và làm mạng bớt nhạy với dịch chuyển.', { n: 3, hl: 2 }),
              L('Và mạng tự học ra các bộ dò cạnh, bộ dò vùng, không cần ai thiết kế.', { n: 4, hl: 3 }),
              L('CNN là nền tảng của nhận dạng ảnh, từ mở khoá điện thoại bằng khuôn mặt đến đọc ảnh y khoa.'),
              L('Chương 11 chuyển từ ảnh sang chuỗi: từng từ trong một tin nhắn nhìn sang các từ khác thế nào. Đó là cơ chế attention, trái tim của các mô hình ngôn ngữ hiện đại.', { hl: -1 }, { say: 'Chương mười một chuyển từ ảnh sang chuỗi: từng từ trong một tin nhắn nhìn sang các từ khác thế nào. Đó là cơ chế attention, trái tim của các mô hình ngôn ngữ hiện đại.' }),
              L('Giờ hãy cuộn xuống, tự trượt bộ lọc qua ảnh. Hẹn gặp lại ở chương 11.', undefined, { say: 'Giờ hãy cuộn xuống, tự trượt bộ lọc qua ảnh. Hẹn gặp lại ở chương mười một.' }),
            ],
          },
        ],
      },
    ],
  };
}
