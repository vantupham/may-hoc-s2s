/**
 * Bài giảng chương 7: học không giám sát. K-means, DBSCAN trên chim cánh cụt Palmer (mỏ đã chuẩn hoá),
 * PCA trên 1.797 ảnh chữ số 8×8. Số liệu do ml-core tính (kmeans, dbscan, pca).
 */
import peng from '../../data/penguins.json';
import digits from '../../data/digits.json';
import { kmeans, dbscan, pca, fmt, type P2 } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const pc = (v: number, d = 1) => fmt(100 * v, d);
const spc = (v: number, d = 1) => `${sn(100 * v, d)} phần trăm`;

export const unsupPyCode = `import numpy as np, json
from pyodide.http import open_url
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA

p = json.loads(open_url(".../penguins.json").read())
Z = np.array([[b["a"], b["b"]] for b in p["birds"]])        # số đo mỏ đã chuẩn hoá
loai = np.array([b["species"] for b in p["birds"]])

km = KMeans(n_clusters=3, init=Z[p["initIdx"]], n_init=1).fit(Z)
print("K-means hội tụ sau", km.n_iter_, "vòng")

db = DBSCAN(eps=0.28, min_samples=5).fit(Z)
print("DBSCAN:", len(set(db.labels_)) - 1, "cụm,", (db.labels_ == -1).sum(), "điểm nhiễu")

d = json.loads(open_url(".../digits.json").read())
X = np.array([x["px"] for x in d["digits"]], dtype=float)
pca = PCA().fit(X)
print(pca.explained_variance_ratio_.cumsum()[[1, 9, 19]].round(3))`;

export function unsupLecture(): Lecture {
  const B = peng.birds;
  const X = B.map((b) => [b.a, b.b] as P2);
  const species = B.map((b) => b.species);
  const init = peng.initIdx.map((i) => X[i]);
  const steps = kmeans(X, init);
  const last = steps.at(-1)!;
  const xd = [-2.4, 2.9], yd = [-2.3, 2.4];
  const avgSp = (s: number, k: 'len' | 'dep') => { const a = B.filter((b) => b.species === s); return a.reduce((t, b) => t + b[k], 0) / a.length; };
  // Các khung K-means: tâm ban đầu (chưa gán), rồi mỗi vòng gán + tâm
  const kmFrames = [
    { cents: init, read: 'tâm ban đầu' },
    ...steps.flatMap((st, i) => [
      { cls: st.labels, cents: st.centers, read: `vòng <b>${i + 1}</b>: gán   J = <b>${fmt(st.inertia, 1)}</b>` },
      { cls: st.labels, cents: st.newCenters, read: `vòng <b>${i + 1}</b>: dời tâm` },
    ]),
  ];
  // Bảng đối chiếu cụm × loài
  const cross = [0, 1, 2].map((c) => [0, 1, 2].map((s) => B.filter((_, i) => last.labels[i] === c && species[i] === s).length));
  const dbs = [0.2, 0.28, 0.4].map((eps) => { const r = dbscan(X, eps, 5); return { eps, ...r, noise: r.labels.filter((l) => l < 0).length }; });
  const dbFrames = dbs.map((r) => ({ cls: r.labels.map((l) => (l < 0 ? 5 : l)), read: `eps = <b>${fmt(r.eps, 2)}</b>   <b>${r.nClusters}</b> cụm   <b>${r.noise}</b> điểm nhiễu` }));
  const dbAt = (e: number) => dbs.find((r) => r.eps === e)!;

  // PCA trên ảnh chữ số
  const D = digits.digits;
  const P = pca(D.map((d) => d.px));
  const cum = P.ratio.reduce<number[]>((a, r) => [...a, (a.at(-1) ?? 0) + r], []);
  const show = [0, 3, 4, 6];
  const sub = D.map((d, i) => [d, i] as const).filter(([d]) => show.includes(d.y)).filter((_, k) => k % 2 === 0);
  const proj = sub.map(([d]) => P.project(d.px, 2));
  const projCls = sub.map(([d]) => show.indexOf(d.y));
  const pxd = [Math.min(...proj.map((p) => p[0])) - 2, Math.max(...proj.map((p) => p[0])) + 2];
  const pyd = [Math.min(...proj.map((p) => p[1])) - 2, Math.max(...proj.map((p) => p[1])) + 2];
  // Chọn K: khởi tạo xác định, các tâm trải đều theo thứ tự a + b; giữ J nhỏ nhất trong vài cách khởi tạo
  const order = X.map((p, i) => [p[0] + p[1], i] as const).sort((u, v) => u[0] - v[0]).map(([, i]) => i);
  const elbow = [1, 2, 3, 4, 5, 6].map((K) => {
    const tries = [0, 0.25, 0.5].map((sh) => kmeans(X, Array.from({ length: K }, (_, k) => X[order[Math.min(X.length - 1, Math.floor(((k + 0.5 + sh) / (K + sh)) * X.length))]])).at(-1)!.inertia);
    return [K, Math.min(...tries)];
  });
  const match = cross.reduce((a, r) => a + Math.max(...r), 0);
  const ex = D[0];
  const recon = (k: number) => P.reconstruct(P.project(ex.px, k)).map((v) => Math.max(0, Math.min(16, v)));
  const img = (px: number[]) => Array.from({ length: 8 }, (_, r) => px.slice(r * 8, r * 8 + 8));

  return {
    slug: 'khong-giam-sat',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Hai bài toán không có nhãn', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 7', title: 'Học không giám sát', sub: 'tìm cấu trúc khi không ai cho đáp án · chim cánh cụt, chữ số' },
            lines: [
              L('Chương 7: học không giám sát. Từ đầu khoá tới giờ, dữ liệu luôn có nhãn: giá nhà, lành hay ác, sống hay mất. Lần này không có nhãn nào cả.', undefined, { say: 'Chương bảy: học không giám sát. Từ đầu khoá tới giờ, dữ liệu luôn có nhãn: giá nhà, lành hay ác, sống hay mất. Lần này không có nhãn nào cả.' }),
              L(`Bài toán thứ nhất, phân cụm. Từ 2007 đến 2009, nhà sinh thái học Kristen Gorman đo chim cánh cụt trên quần đảo Palmer ở Nam Cực. Giả sử ta chỉ có số đo mỏ của ${B.length} con, không biết loài: liệu có tự chia được chúng thành nhóm?`, undefined, { say: `Bài toán thứ nhất, phân cụm. Từ năm hai nghìn không trăm linh bảy đến năm hai nghìn không trăm linh chín, nhà sinh thái học Kristen Gorman đo chim cánh cụt trên quần đảo Palmer ở Nam Cực. Giả sử ta chỉ có số đo mỏ của ${speakNum(String(B.length))} con, không biết loài: liệu có tự chia được chúng thành nhóm?` }),
              L('Bài toán thứ hai, giảm chiều. Mỗi ảnh chữ số viết tay gồm 64 con số. Không thể vẽ 64 chiều. Có cách nào tóm mỗi ảnh vào 2 con số mà vẫn giữ được phần lớn thông tin?', undefined, { say: 'Bài toán thứ hai, giảm chiều. Mỗi ảnh chữ số viết tay gồm sáu mươi tư con số. Không thể vẽ sáu mươi tư chiều. Có cách nào tóm mỗi ảnh vào hai con số mà vẫn giữ được phần lớn thông tin?' }),
            ],
          },
          {
            view: 'Points', props: { pts: X, cls: species, names: ['Adelie', 'Chinstrap', 'Gentoo'], xlab: 'chiều dài mỏ (đã chuẩn hoá)', ylab: 'độ dày mỏ (đã chuẩn hoá)', xdom: xd, ydom: yd, dot: 5, frames: [{ cls: species.map(() => 5) }, { cls: species }] },
            init: { f: 1 },
            lines: [
              L(`Đây là ${B.length} con chim, tô màu theo loài thật. Adelie mỏ ngắn: trung bình ${fmt(avgSp(0, 'len'), 1)} mm. Gentoo mỏ dài nhưng mỏng. Chinstrap mỏ dài và dày.`, undefined, { say: `Đây là ${speakNum(String(B.length))} con chim, tô màu theo loài thật. Adelie mỏ ngắn: trung bình ${sn(avgSp(0, 'len'), 1)} mi-li-mét. Gentoo mỏ dài nhưng mỏng. Chinstrap mỏ dài và dày.` }),
              L('Không đặc trưng nào một mình tách được ba loài, nhưng cả hai cùng nhau thì có thể. Hai số đo đã được chuẩn hoá, vì mỏ dài khoảng 44 mm mà chỉ dày khoảng 17 mm.', undefined, { say: 'Không đặc trưng nào một mình tách được ba loài, nhưng cả hai cùng nhau thì có thể. Hai số đo đã được chuẩn hoá, vì mỏ dài khoảng bốn mươi bốn mi-li-mét mà chỉ dày khoảng mười bảy mi-li-mét.' }),
              L('Nhưng trong học không giám sát, ta không được biết màu. Thứ ta thật sự có là thế này.', { f: 0 }, { anim: 0.01 }),
            ],
          },
          {
            view: 'Grid', props: { title: 'Mười ảnh chữ số đầu tiên, mỗi ảnh 8 × 8 điểm ảnh', mats: D.slice(0, 10).map((d) => ({ title: String(d.y), vals: img(d.px), kind: 'img', cell: 9 })) },
            init: { n: 0 },
            lines: [
              L('Còn đây là mười ảnh chữ số đầu tiên. Mỗi ảnh có 8 nhân 8 điểm ảnh, độ đậm từ 0 đến 16.', { n: 10 }, { anim: 2, say: 'Còn đây là mười ảnh chữ số đầu tiên. Mỗi ảnh có tám nhân tám điểm ảnh, độ đậm từ không đến mười sáu.' }),
              L(`Toàn bộ có ${D.length.toLocaleString('vi-VN')} ảnh, mỗi ảnh là một điểm trong không gian 64 chiều.`, undefined, { say: `Toàn bộ có ${speakNum(D.length.toLocaleString('vi-VN'))} ảnh, mỗi ảnh là một điểm trong không gian sáu mươi tư chiều.` }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'K-means: cắm cờ', section: 'truc-giac',
        scenes: [
          {
            view: 'Points', props: { pts: X, cls: species.map(() => 5), names: [], xlab: 'chiều dài mỏ', ylab: 'độ dày mỏ', xdom: xd, ydom: yd, dot: 5, frames: kmFrames },
            init: { f: 0, ct: 1 },
            lines: [
              L('K-means giống trò chơi cắm K lá cờ. Cắm 3 lá cờ: dấu nhân.', undefined, { say: 'K-means giống trò chơi cắm K lá cờ. Cắm ba lá cờ: các dấu nhân.' }),
              L('Bước gán: mỗi con chim chạy về lá cờ gần nhất, và mang màu của lá cờ đó.', { f: 1 }, { anim: 0.01 }),
              L('Bước dời tâm: mỗi lá cờ dời về chính giữa đám chim của nó.', { f: 2 }, { anim: 0.01 }),
              L('Lặp lại: gán, rồi dời tâm. Một vài con chim ở vùng giáp ranh đổi màu.', { f: 6 }, { anim: 'line', ease: 'lin' }),
              L('Mỗi vòng, các lá cờ dịch chuyển ít hơn, như những người đi tìm chỗ đứng giữa đám đông của mình.', { f: 12 }, { anim: 'line', ease: 'lin' }),
              L(`Cho tới khi không con nào đổi chỗ nữa. Ở đây cần ${steps.length} vòng.`, { f: kmFrames.length - 1 }, { anim: 'line', ease: 'lin', say: `Cho tới khi không con nào đổi chỗ nữa. Ở đây cần ${speakNum(String(steps.length))} vòng.` }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: tổng bình phương', section: 'tinh-tay',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'K-means tối ưu cái gì?', items: [
              { label: 'Mục tiêu', tex: String.raw`J = \sum_{i=1}^{n} \lVert \cx{x_i} - \mu_{c(i)} \rVert^2` },
              { label: 'Vòng 1', tex: String.raw`J = ${fmt(steps[0].inertia, 3).replace(',', '{,}')}` },
              { label: 'Vòng cuối', tex: String.raw`J = ${fmt(last.inertia, 3).replace(',', '{,}')}` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('K-means tối ưu một con số: tổng bình phương khoảng cách từ mỗi con chim tới tâm cụm của nó.', { n: 1, hl: 0 }),
              L(`Sau bước gán ở vòng 1, tổng đó là ${fmt(steps[0].inertia, 3)}.`, { n: 2, hl: 1 }, { say: `Sau bước gán ở vòng một, tổng đó là ${sn(steps[0].inertia, 3)}.` }),
              L(`Ở vòng cuối, chỉ còn ${fmt(last.inertia, 3)}.`, { n: 3, hl: 2 }, { say: `Ở vòng cuối, chỉ còn ${sn(last.inertia, 3)}.` }),
              L('Bước gán làm J nhỏ đi, vì mỗi con chim chọn tâm gần nhất. Bước dời tâm cũng làm J nhỏ đi, vì trung bình là điểm có tổng bình phương khoảng cách nhỏ nhất.', { hl: -1 }),
              L('J không bao giờ tăng, nên thuật toán chắc chắn dừng. Nhưng nó có thể dừng ở một đáy cục bộ: đổi vị trí cờ ban đầu, kết quả có thể khác.'),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Chọn K: tổng bình phương J theo số cụm', series: [{ name: 'J', pts: elbow, color: 2, dots: true }], xlab: 'số cụm K', ylab: 'J', xdom: [0.5, 6.5], ydom: [0, elbow[0][1] * 1.08], xfmt: 'int', yfmt: 'int', legend: false },
            init: { t: 0, vx: null },
            lines: [
              L('Ta đã chọn K = 3 vì biết có ba loài. Nếu không biết thì sao? Chạy K-means với K từ 1 đến 6 và vẽ J.', { t: 1 }, { anim: 'line', ease: 'lin', say: 'Ta đã chọn K bằng ba vì biết có ba loài. Nếu không biết thì sao? Chạy K-means với K từ một đến sáu và vẽ J.' }),
              L(`Từ 1 lên 2 cụm, J giảm ${fmt(elbow[0][1] - elbow[1][1], 0)}. Từ 2 lên 3, giảm thêm ${fmt(elbow[1][1] - elbow[2][1], 0)}.`, undefined, { say: `Từ một lên hai cụm, J giảm ${sn(elbow[0][1] - elbow[1][1], 0)}. Từ hai lên ba, giảm thêm ${sn(elbow[1][1] - elbow[2][1], 0)}.` }),
              L(`Sau đó mỗi cụm thêm vào chỉ giảm khoảng ${fmt((elbow[2][1] - elbow[5][1]) / 3, 0)}. Đường cong gập lại ở K = 3, như một khuỷu tay.`, { vx: 3 }, { say: `Sau đó mỗi cụm thêm vào chỉ giảm khoảng ${sn((elbow[2][1] - elbow[5][1]) / 3, 0)}. Đường cong gập lại ở K bằng ba, như một khuỷu tay.` }),
              L('J luôn giảm khi tăng K, đến 0 khi mỗi con chim là một cụm. Vì vậy không chọn K nhỏ nhất J, mà chọn chỗ thêm cụm không còn đáng công.', { vx: null }, { say: 'J luôn giảm khi tăng K, đến không khi mỗi con chim là một cụm. Vì vậy không chọn K có J nhỏ nhất, mà chọn chỗ thêm cụm không còn đáng công.' }),
            ],
          },
          {
            view: 'Table',
            props: {
              title: 'Ba cụm so với ba loài thật',
              cols: ['', 'Adelie', 'Chinstrap', 'Gentoo'],
              cls: ['t', '', '', ''],
              rows: cross.map((r, c) => [`Cụm ${c + 1}`, ...r.map(String)]),
            },
            init: { n: 0, hl: -1 },
            lines: [
              L('Giờ mới "gian lận" một chút: so ba cụm với loài thật mà thuật toán chưa từng thấy.', { n: 3 }, { anim: 2 }),
              L('Mỗi cụm phần lớn là một loài. K-means tự tìm ra ba loài chim chỉ từ số đo mỏ.'),
              L(`Cụm 1 có ${cross[0][0]} con Adelie, chỉ lẫn ${cross[0][1] + cross[0][2]} con loài khác. Cụm 3 có ${cross[2][2]} con Gentoo.`, { hl: 0 }, { say: `Cụm một có ${speakNum(String(cross[0][0]))} con Adelie, chỉ lẫn ${speakNum(String(cross[0][1] + cross[0][2]))} con loài khác. Cụm ba có ${speakNum(String(cross[2][2]))} con Gentoo.` }),
              L(`Tính chung, ${match} trên ${B.length} con, tức ${pc(match / B.length)}%, nằm cùng cụm với đa số loài của mình.`, { hl: -1 }, { say: `Tính chung, ${speakNum(String(match))} trên ${speakNum(String(B.length))} con, tức ${spc(match / B.length)}, nằm cùng cụm với đa số loài của mình.` }),
              L('Chỗ nhầm nằm ở vùng Chinstrap giáp Gentoo, đúng nơi hai loài chồng lấn.', { hl: 1 }),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'DBSCAN và PCA', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Points', props: { pts: X, cls: species, names: [], xlab: 'chiều dài mỏ', ylab: 'độ dày mỏ', xdom: xd, ydom: yd, dot: 5, frames: dbFrames },
            init: { f: 1 },
            lines: [
              L('K-means giả định cụm tròn và phải biết trước K. DBSCAN nghĩ khác: cụm là vùng dày đặc điểm.'),
              L('Một điểm là lõi nếu trong bán kính eps quanh nó có ít nhất 5 điểm. Các lõi gần nhau nối thành cụm. Điểm không thuộc cụm nào là nhiễu, tô màu xám.', undefined, { say: 'Một điểm là lõi nếu trong bán kính eps quanh nó có ít nhất năm điểm. Các lõi gần nhau nối thành cụm. Điểm không thuộc cụm nào là nhiễu, tô màu xám.' }),
              L(`Với eps = 0,28: ${dbAt(0.28).nClusters} cụm, ${dbAt(0.28).noise} điểm nhiễu.`, undefined, { say: `Với eps bằng không phẩy hai tám: ${speakNum(String(dbAt(0.28).nClusters))} cụm, ${speakNum(String(dbAt(0.28).noise))} điểm nhiễu.` }),
              L(`Thu nhỏ eps còn 0,20: vỡ thành ${dbAt(0.2).nClusters} cụm, ${dbAt(0.2).noise} điểm nhiễu.`, { f: 0 }, { anim: 0.01, say: `Thu nhỏ eps còn không phẩy hai: vỡ thành ${speakNum(String(dbAt(0.2).nClusters))} cụm, ${speakNum(String(dbAt(0.2).noise))} điểm nhiễu.` }),
              L(`Nới eps lên 0,40: mọi thứ dính thành ${dbAt(0.4).nClusters} cụm duy nhất.`, { f: 2 }, { anim: 0.01, say: `Nới eps lên không phẩy bốn: mọi thứ dính thành ${speakNum(String(dbAt(0.4).nClusters))} cụm duy nhất.` }),
              L('DBSCAN không cần biết trước số cụm và tìm được cụm hình dạng bất kỳ, nhưng rất nhạy với eps.'),
              L('Điểm nhiễu cũng là thông tin: một con chim có số đo lạ hẳn so với mọi con khác đáng được xem lại, có thể đo nhầm, có thể là một trường hợp đặc biệt.'),
            ],
          },
          {
            view: 'Formula',
            props: { title: 'PCA: tìm góc chụp tốt nhất', items: [
              { label: 'Hiệp phương sai', tex: String.raw`S = \frac{1}{n-1}\sum_i (\cx{x_i} - \bar{\cx{x}})(\cx{x_i} - \bar{\cx{x}})^\top \quad (64\times 64)` },
              { label: 'Vector riêng', tex: String.raw`S\,v_k = \lambda_k v_k, \qquad \lambda_1 \ge \lambda_2 \ge \dots` },
              { label: 'Toạ độ mới', tex: String.raw`z_k = v_k \cdot (\cx{x} - \bar{\cx{x}})` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('PCA giống chụp ảnh một vật ba chiều: bạn xoay vật sao cho bức ảnh hai chiều cho thấy nhiều chi tiết nhất. PCA tìm góc chụp đó cho dữ liệu 64 chiều.', undefined, { say: 'PCA giống chụp ảnh một vật ba chiều: bạn xoay vật sao cho bức ảnh hai chiều cho thấy nhiều chi tiết nhất. PCA tìm góc chụp đó cho dữ liệu sáu mươi tư chiều.' }),
              L('Trừ ảnh trung bình, rồi tính ma trận hiệp phương sai 64 nhân 64: mỗi ô cho biết hai điểm ảnh cùng sáng, cùng tối với nhau đến đâu.', { n: 1, hl: 0 }, { say: 'Trừ ảnh trung bình, rồi tính ma trận hiệp phương sai sáu mươi tư nhân sáu mươi tư: mỗi ô cho biết hai điểm ảnh cùng sáng, cùng tối với nhau đến đâu.' }),
              L('Vector riêng ứng với trị riêng lớn nhất là hướng dữ liệu trải rộng nhất. Trị riêng chính là phương sai theo hướng đó.', { n: 2, hl: 1 }),
              L('Các vector riêng vuông góc với nhau, nên mỗi thành phần chính mang một phần thông tin không trùng với các thành phần trước.'),
              L('Toạ độ mới của một ảnh là hình chiếu của nó lên các hướng đó. Giữ 2 hướng đầu, ta có 2 con số thay cho 64.', { n: 3, hl: 2 }, { say: 'Toạ độ mới của một ảnh là hình chiếu của nó lên các hướng đó. Giữ hai hướng đầu, ta có hai con số thay cho sáu mươi tư.' }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'khong_giam_sat.py', code: unsupPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Cả ba thuật toán đều có sẵn trong scikit-learn.'),
              L('K-means với đúng ba tâm khởi tạo của trang này, nên kết quả trùng với hình ta vừa xem.', { a: 10, b: 11 }),
              L('DBSCAN với eps 0,28 và tối thiểu 5 điểm.', { a: 13, b: 14 }, { say: 'DBSCAN với eps không phẩy hai tám và tối thiểu năm điểm.' }),
              L('PCA trên toàn bộ ảnh chữ số, in phần phương sai giữ lại với 2, 10 và 20 thành phần.', { a: 16, b: 19 }, { say: 'PCA trên toàn bộ ảnh chữ số, in phần phương sai giữ lại với hai, mười và hai mươi thành phần.' }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'Chữ số trong hai chiều', section: 'danh-gia',
        scenes: [
          {
            view: 'Points', props: { pts: proj, cls: projCls, names: show.map((d) => `số ${d}`), xlab: 'thành phần chính 1', ylab: 'thành phần chính 2', xdom: pxd, ydom: pyd, dot: 3.5, frames: [{ read: `giữ lại <b>${pc(cum[1])}%</b> phương sai` }] },
            init: { f: 0 },
            lines: [
              L('Chiếu mỗi ảnh xuống hai thành phần chính đầu tiên. Đây là các chữ số 0, 3, 4 và 6.', undefined, { say: 'Chiếu mỗi ảnh xuống hai thành phần chính đầu tiên. Đây là các chữ số không, ba, bốn và sáu.' }),
              L('Chỉ với 2 con số, các chữ số đã tách thành từng đám khá rõ, dù PCA không hề biết nhãn.', undefined, { say: 'Chỉ với hai con số, các chữ số đã tách thành từng đám khá rõ, dù PCA không hề biết nhãn.' }),
              L(`Hai thành phần này giữ lại ${pc(cum[1])}% phương sai của dữ liệu.`, undefined, { say: `Hai thành phần này giữ lại ${spc(cum[1])} phương sai của dữ liệu.` }),
            ],
          },
          {
            view: 'Grid', props: { title: `Tái dựng chữ số ${ex.y} từ vài thành phần chính`, mats: [
              { title: 'gốc: 64 số', vals: img(ex.px), kind: 'img', cell: 18 },
              { title: '2 thành phần', vals: img(recon(2)), kind: 'img', cell: 18 },
              { title: '10 thành phần', vals: img(recon(10)), kind: 'img', cell: 18 },
              { title: '20 thành phần', vals: img(recon(20)), kind: 'img', cell: 18 },
            ] },
            init: { n: 1 },
            lines: [
              L(`Nén được thì phải tái dựng lại được. Đây là ảnh chữ số ${ex.y} đầu tiên trong bộ dữ liệu.`, undefined, { say: `Nén được thì phải tái dựng lại được. Đây là ảnh chữ số ${speakNum(String(ex.y))} đầu tiên trong bộ dữ liệu.` }),
              L('Chỉ giữ 2 con số rồi dựng lại: một vệt mờ, đoán được hình dạng chung nhưng chưa chắc là chữ gì.', { n: 2 }, { say: 'Chỉ giữ hai con số rồi dựng lại: một vệt mờ, đoán được hình dạng chung nhưng chưa chắc là chữ gì.' }),
              L('Giữ 10 con số: nét chữ đã hiện ra.', { n: 3 }, { say: 'Giữ mười con số: nét chữ đã hiện ra.' }),
              L('Giữ 20 con số: gần như không khác ảnh gốc.', { n: 4 }, { say: 'Giữ hai mươi con số: gần như không khác ảnh gốc.' }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Phương sai giữ lại theo số thành phần', series: [{ name: 'tích luỹ', pts: cum.map((v, i) => [i + 1, v]), color: 2 }], xlab: 'số thành phần', ylab: 'phương sai giữ lại', xdom: [0, 64], ydom: [0, 1], xfmt: 'int', yfmt: 'pct', legend: false },
            init: { t: 0, vx: null },
            lines: [
              L('Thêm thành phần thì giữ được nhiều hơn.', { t: 1 }, { anim: 'line', ease: 'lin' }),
              L(`10 thành phần: ${pc(cum[9])}%.`, { vx: 10 }, { say: `Mười thành phần: ${spc(cum[9])}.` }),
              L(`20 thành phần: ${pc(cum[19])}%. Ảnh 64 số có thể nén còn 20 số mà vẫn nhận ra.`, { vx: 20 }, { say: `Hai mươi thành phần: ${spc(cum[19])}. Ảnh sáu mươi tư số có thể nén còn hai mươi số mà vẫn nhận ra.` }),
              L('Chương 9 sẽ dùng chính bộ chữ số này để huấn luyện một mạng nơ-ron.', { vx: null }, { say: 'Chương chín sẽ dùng chính bộ chữ số này để huấn luyện một mạng nơ-ron.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Không chuẩn hoá</b> trước K-means hay PCA.',
              '<b>K-means giả định cụm tròn</b>, cỡ tương đương.',
              '<b>Diễn giải cụm như sự thật</b>: K-means luôn trả về đúng K cụm.',
              '<b>Thành phần chính</b> không nhất thiết là hướng quan trọng cho bài toán.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Học không giám sát khó đánh giá vì không có đáp án. Ở đây ta có nhãn loài để kiểm tra; ngoài đời thường không có.'),
              L('Bốn bẫy thường gặp. Một: không chuẩn hoá. Đặc trưng có số lớn sẽ áp đảo khoảng cách.', { n: 1, hl: 0 }),
              L('Hai: K-means giả định cụm tròn, cỡ tương đương. Cụm dài, cong hay lồng nhau sẽ bị cắt sai; khi đó thử DBSCAN.', { n: 2, hl: 1 }),
              L('Ba: diễn giải cụm như sự thật. K-means luôn trả về đúng K cụm, kể cả khi dữ liệu không có cấu trúc cụm nào.', { n: 3, hl: 2 }),
              L('Bốn: thành phần chính là hướng có phương sai lớn, không nhất thiết là hướng quan trọng cho bài toán của bạn.', { n: 4, hl: 3 }),
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
              '<b>K-means</b>: gán về tâm gần nhất, dời tâm về trung bình, lặp lại.',
              '<b>DBSCAN</b>: cụm là vùng dày đặc; có điểm nhiễu; nhạy với eps.',
              '<b>PCA</b>: chiếu lên hướng phương sai lớn nhất; nén 64 số còn vài số.',
              'Không có đáp án: <b>kiểm tra bằng hiểu biết lĩnh vực</b>.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('K-means gán mỗi điểm về tâm gần nhất, dời tâm về trung bình, và lặp lại cho tới khi đứng yên.', { n: 1, hl: 0 }),
              L('DBSCAN coi cụm là vùng dày đặc, và dám nói một điểm là nhiễu.', { n: 2, hl: 1 }),
              L('PCA chiếu dữ liệu lên những hướng trải rộng nhất, nén nhiều chiều xuống vài chiều.', { n: 3, hl: 2 }),
              L('Và vì không có đáp án, hãy luôn kiểm tra kết quả bằng hiểu biết về lĩnh vực.', { n: 4, hl: 3 }),
              L('Hai kỹ thuật này hay đi cùng nhau: dùng PCA giảm chiều trước, rồi phân cụm trong không gian ít chiều hơn, vừa nhanh vừa bớt nhiễu.', { hl: -1 }),
              L('Chương 8 hỏi một câu quan trọng cho mọi mô hình có giám sát: con số độ chính xác của ta đáng tin đến đâu?', { hl: -1 }, { say: 'Chương tám hỏi một câu quan trọng cho mọi mô hình có giám sát: con số độ chính xác của ta đáng tin đến đâu?' }),
              L('Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương 8.', undefined, { say: 'Giờ hãy cuộn xuống làm các phòng thí nghiệm. Hẹn gặp lại ở chương tám.' }),
            ],
          },
        ],
      },
    ],
  };
}
