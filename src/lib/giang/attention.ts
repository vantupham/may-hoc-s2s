/**
 * Bài giảng chương 11: chuỗi và attention trên SMS Spam Collection. Mô hình đã huấn luyện sẵn (attention.json);
 * mọi con số do ml-core tính bằng lan truyền xuôi (attnForward), so sánh với Naive Bayes (nbFromCounts, nbScore).
 */
import model from '../../data/attention.json';
import sms from '../../data/sms.json';
import { attnForward, nbFromCounts, nbScore, fmt, type AttnModel } from '../ml-core';
import { readNumber as speakNum } from './speak';
import type { Lecture, Line, SceneState } from './types';

const VOICE = 'vi-VN-HoaiMyNeural';
const L = (cap: string, set?: SceneState, o: Partial<Line> = {}): Line => ({ cap, ...(set ? { set } : {}), ...o });
const sn = (v: number, d: number) => speakNum(fmt(v, d));
const pc = (v: number, d = 2) => fmt(100 * v, d);
const spc = (v: number, d = 2) => `${sn(100 * v, d)} phần trăm`;

export const attnPyCode = `import numpy as np

# Self-attention bằng tay với 3 token, mỗi token 4 chiều (số nhỏ để dễ theo dõi)
X = np.array([[1.0, 0.0, 1.0, 0.0],    # "call"
              [0.0, 2.0, 0.0, 2.0],    # "now"
              [1.0, 1.0, 1.0, 1.0]])   # "free"
rng = np.random.default_rng(0)
Wq, Wk, Wv = (rng.normal(0, 0.5, (4, 4)) for _ in range(3))

Q, K, V = X @ Wq, X @ Wk, X @ Wv
S = Q @ K.T / np.sqrt(4)                       # điểm số: mỗi hàng là một token đặt câu hỏi
A = np.exp(S - S.max(1, keepdims=True))
A /= A.sum(1, keepdims=True)                   # softmax theo hàng
H = A @ V                                      # mỗi token = trung bình có trọng số của các V

np.set_printoptions(precision=3, suppress=True)
print("Ma trận chú ý A:"); print(A)
print("Đầu ra H:"); print(H)`;

export function attnLecture(): Lecture {
  const m = model as unknown as AttnModel & { testAcc: number };
  const pick = (s: string) => sms.test.find((t) => t.text.startsWith(s))!.text;
  const spamText = pick('You have won ?1,000'), hamText = pick('You have an important customer');
  const rs = attnForward(m, spamText), rh = attnForward(m, hamText);
  const fcn = attnForward(m, 'free call now'), ncf = attnForward(m, 'now call free');
  // Token được chú ý nhiều nhất (cộng theo cột trên toàn câu); bảng hiện đủ các từ tới token đó
  const colSum = rs.toks.map((_, j) => rs.A.reduce((s, r) => s + r[j], 0));
  const topJ = colSum.indexOf(Math.max(...colSum));
  const N = Math.min(rs.toks.length, Math.max(10, topJ + 1));
  const sub = rs.A.slice(0, N).map((r) => r.slice(0, N));
  const words = rs.toks.slice(0, N).map((t) => t.word);
  const argmaxRow = (A: number[][]) => A.map((r) => r.indexOf(Math.max(...r)));
  const maxS = Math.max(...rs.S.flat().map(Math.abs));
  const nb = nbFromCounts(sms.vocab, sms.counts, sms.docs, 1);
  const stat = (f: (t: string) => number) => {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    sms.test.forEach((r) => { const q = f(r.text) >= 0.5; if (q && r.y) tp++; else if (q) fp++; else if (r.y) fn++; else tn++; });
    return { acc: (tp + tn) / sms.test.length, fn, fp };
  };
  const sA = stat((t) => attnForward(m, t).p), sN = stat((t) => nbScore(nb, t).pSpam);
  const nParams = m.E.length * m.d + 3 * m.d * m.d + m.d + 1;
  const f2 = (M: number[][]) => M.map((r) => r.map((v) => +v.toFixed(2)));

  return {
    slug: 'attention',
    voice: VOICE,
    chapters: [
      {
        id: 'bai-toan', title: 'Bài toán', section: 'bai-toan',
        scenes: [
          {
            view: 'Title', props: { no: 'Chương 11', title: 'Chuỗi và Attention', sub: 'mỗi từ nhìn sang các từ khác · SMS Spam' },
            lines: [
              L('Chương 11: chuỗi và attention, cơ chế đứng sau các mô hình ngôn ngữ lớn ngày nay.', undefined, { say: 'Chương mười một: chuỗi và attention, cơ chế đứng sau các mô hình ngôn ngữ lớn ngày nay.' }),
              L('Bài toán vẫn là lọc tin rác của chương 4.', undefined, { say: 'Bài toán vẫn là lọc tin rác của chương bốn.' }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Naive Bayes coi tin nhắn là một túi từ', items: [
              '"call now for free" và "free for now, call" là <b>như nhau</b>.',
              '"free" trong "free prize" và trong "are you free tonight" là <b>như nhau</b>.',
              'Muốn hiểu từ, phải nhìn <b>các từ xung quanh</b>.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Naive Bayes coi tin nhắn là một túi từ. Với nó, "call now for free" và "free for now, call" là như nhau: thứ tự bị bỏ hết.', { n: 1, hl: 0 }),
              L('Nó cũng không biết free trong "free prize", giải thưởng miễn phí, khác với free trong "are you free tonight", tối nay bạn rảnh không.', { n: 2, hl: 1 }),
              L('Muốn hiểu một từ, phải nhìn các từ xung quanh nó. Attention là cách để mỗi từ tự quyết định nên nhìn từ nào.', { n: 3, hl: 2 }),
              L('Bài dùng tin nhắn tiếng Anh vì chưa có bộ câu tiếng Việt với giấy phép rõ ràng để đăng lại. Thuật toán thì không đổi.', { hl: -1 }),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Từ chữ đến số', items: [
              `Tách tin thành từ, giữ tối đa <b>${m.maxLen} từ</b> đầu.`,
              `Từ điển <b>${(m.vocab.length - 1).toLocaleString('vi-VN')} từ</b> hay gặp nhất; từ khác thành &lt;unk&gt;.`,
              `Mỗi từ là một vector <b>${m.d} số</b>: embedding, học được trong lúc huấn luyện.`,
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Mỗi tin nhắn được tách thành từ như chương 4, giữ tối đa ${m.maxLen} từ đầu tiên.`, { n: 1, hl: 0 }, { say: `Mỗi tin nhắn được tách thành từ như chương bốn, giữ tối đa ${speakNum(String(m.maxLen))} từ đầu tiên.` }),
              L(`Từ điển gồm ${(m.vocab.length - 1).toLocaleString('vi-VN')} từ hay gặp nhất; từ khác được thay bằng một ký hiệu "không rõ".`, { n: 2, hl: 1 }, { say: `Từ điển gồm ${speakNum((m.vocab.length - 1).toLocaleString('vi-VN'))} từ hay gặp nhất; từ khác được thay bằng một ký hiệu không rõ.` }),
              L(`Mỗi từ được biểu diễn bằng một vector ${m.d} số, gọi là embedding. Ban đầu chúng là ngẫu nhiên; mô hình tự học chúng trong lúc huấn luyện.`, { n: 3, hl: 2 }, { say: `Mỗi từ được biểu diễn bằng một vector ${speakNum(String(m.d))} số, gọi là embedding. Ban đầu chúng là ngẫu nhiên; mô hình tự học chúng trong lúc huấn luyện.` }),
            ],
          },
        ],
      },
      {
        id: 'truc-giac', title: 'Trực giác: buổi họp lớp', section: 'truc-giac',
        scenes: [
          {
            view: 'Bullets',
            props: { title: 'Mỗi từ cầm ba tấm thẻ', items: [
              '<b>q</b>, câu hỏi: "ai biết về giải thưởng?"',
              '<b>k</b>, nhãn tên: "tôi biết về tiền".',
              '<b>v</b>, ghi chú: điều mình thật sự biết.',
              'So q của mình với k của mọi bạn → <b>trộn v</b> theo mức khớp.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Hình dung một buổi họp lớp. Mỗi học sinh, tức mỗi từ, cầm ba tấm thẻ.'),
              L('Một câu hỏi, gọi là q: ai biết về giải thưởng?', { n: 1, hl: 0 }),
              L('Một nhãn tên, gọi là k: tôi biết về tiền.', { n: 2, hl: 1 }),
              L('Và một ghi chú, gọi là v: nội dung thật sự mình biết.', { n: 3, hl: 2 }),
              L('Mỗi bạn so câu hỏi của mình với nhãn tên của mọi bạn khác. Khớp càng nhiều, càng lắng nghe ghi chú của bạn đó. Rồi trộn các ghi chú theo mức lắng nghe.', { n: 4, hl: 3 }),
              L('Trong các mô hình lớn, mỗi tầng có nhiều nhóm thẻ như vậy chạy song song, gọi là nhiều đầu. Một đầu có thể chuyên tìm chủ ngữ, đầu khác chuyên tìm con số.'),
              L('Kết quả: mỗi từ có một biểu diễn mới đã pha thông tin từ các từ liên quan. Free đứng cạnh prize sẽ mang nghĩa khác free đứng cạnh tonight.', { hl: -1 }),
            ],
          },
        ],
      },
      {
        id: 'tinh-tay', title: 'Tính tay: ma trận chú ý', section: 'tinh-tay',
        scenes: [
          {
            view: 'Grid',
            props: { title: `"${words.slice(0, 4).join(' ')}…": ai nhìn ai?`, mats: [{ rows: words, cols: words, vals: f2(sub), kind: 'heat', digits: 2, bare: N > 8, cell: Math.min(50, Math.floor(330 / N)) }] },
            init: { n: 1, hl: '' },
            lines: [
              L(`Một tin rác thật trong tập test. Mỗi hàng là một từ đặt câu hỏi, mỗi cột là một từ được hỏi. Ô càng đậm, từ ở hàng càng chú ý vào từ ở cột.`),
              L('Mỗi hàng cộng lại đúng bằng 1: đó là cách mỗi từ chia sự chú ý của mình.', undefined, { say: 'Mỗi hàng cộng lại đúng bằng một: đó là cách mỗi từ chia sự chú ý của mình.' }),
              L(`Mô hình này học cách chú ý rất gắt: gần như mọi từ dồn hết sự chú ý vào một hoặc hai từ. Ở tin này, đó là "${rs.toks[topJ].word}".`, { hl: topJ < N ? `0,0,${topJ}` : '' }, { say: `Mô hình này học cách chú ý rất gắt: gần như mọi từ dồn hết sự chú ý vào một hoặc hai từ. Ở tin này, đó là từ ${rs.toks[topJ].word}.` }),
              L(`Vì sao gắt vậy? Các điểm số rất lớn, có cái tới ${fmt(maxS, 0)}, nên softmax gần như chọn hẳn một từ.`, { hl: '' }, { say: `Vì sao gắt vậy? Các điểm số rất lớn, có cái tới ${speakNum(fmt(maxS, 0))}, nên softmax gần như chọn hẳn một từ.` }),
              L(`Cuối cùng, mô hình cho tin này xác suất là rác ${pc(rs.p)}%.`, undefined, { say: `Cuối cùng, mô hình cho tin này xác suất là rác ${spc(rs.p)}.` }),
              L(`Còn một tin thường cũng mở đầu bằng "You have", "You have an important customer service…": chỉ ${pc(rh.p)}%. Cùng hai từ đầu, nhưng các từ sau kéo nghĩa đi chỗ khác.`, undefined, { say: `Còn một tin thường cũng mở đầu bằng you have, you have an important customer service: chỉ ${spc(rh.p)}. Cùng hai từ đầu, nhưng các từ sau kéo nghĩa đi chỗ khác.` }),
            ],
          },
          {
            view: 'Grid',
            props: { title: '"free call now": điểm số và chú ý', mats: [
              { title: 'điểm số S = q·k / √d', rows: fcn.toks.map((t) => t.word), cols: fcn.toks.map((t) => t.word), vals: f2(fcn.S), kind: 'heat', digits: 1, cell: 78 },
              { title: 'chú ý A = softmax từng hàng', rows: fcn.toks.map((t) => t.word), cols: fcn.toks.map((t) => t.word), vals: f2(fcn.A), kind: 'heat', digits: 2, cell: 78 },
            ] },
            init: { n: 1 },
            lines: [
              L('Một ví dụ nhỏ hơn để tính tay: "free call now", ba từ.'),
              L(`Ma trận điểm số: tích của q mỗi từ với k của mọi từ, chia căn của ${m.d}.`, undefined, { say: `Ma trận điểm số: tích của q mỗi từ với k của mọi từ, chia căn của ${speakNum(String(m.d))}.` }),
              L('Softmax từng hàng biến điểm số thành tỷ lệ chú ý, cộng lại bằng 1.', { n: 2 }, { say: 'Softmax từng hàng biến điểm số thành tỷ lệ chú ý, cộng lại bằng một.' }),
              L(`Đọc từng hàng: "${fcn.toks[0].word}" chú ý nhiều nhất vào "${fcn.toks[argmaxRow(fcn.A)[0]].word}", "${fcn.toks[1].word}" vào "${fcn.toks[argmaxRow(fcn.A)[1]].word}", và "${fcn.toks[2].word}" vào "${fcn.toks[argmaxRow(fcn.A)[2]].word}".`, undefined, { say: `Đọc từng hàng: từ ${fcn.toks[0].word} chú ý nhiều nhất vào từ ${fcn.toks[argmaxRow(fcn.A)[0]].word}, từ ${fcn.toks[1].word} vào từ ${fcn.toks[argmaxRow(fcn.A)[1]].word}, và từ ${fcn.toks[2].word} vào từ ${fcn.toks[argmaxRow(fcn.A)[2]].word}.` }),
              L('Một từ hoàn toàn có thể chú ý vào chính nó: không có gì bắt nó phải nhìn sang từ khác.'),
              L('Đầu ra của mỗi từ là trung bình các vector v, theo đúng tỷ lệ đó.'),
              L(`Lấy trung bình đầu ra của cả ba từ, rồi đưa qua hồi quy logistic: p = ${pc(fcn.p)}% là rác.`, undefined, { say: `Lấy trung bình đầu ra của cả ba từ, rồi đưa qua hồi quy logistic: xác suất ${spc(fcn.p)} là rác.` }),
            ],
          },
          {
            view: 'Chart',
            props: { title: 'Thứ tự từ có quan trọng không?', bars: [
              { label: 'free call now', value: fcn.p, color: 1, text: `${pc(fcn.p)}%` },
              { label: 'now call free', value: ncf.p, color: 0, text: `${pc(ncf.p)}%` },
            ], ylab: 'p(rác)', ydom: [0, 1], yfmt: 'pct' },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Đảo thứ tự thành "now call free": cùng ba từ, nhưng p chỉ còn ${pc(ncf.p)}%.`, { n: 2 }, { anim: 2, say: `Đảo thứ tự thành now call free: cùng ba từ, nhưng xác suất chỉ còn ${spc(ncf.p)}.` }),
              L('Naive Bayes sẽ cho hai câu này đúng cùng một con số. Mô hình attention thì phân biệt được, nhờ một chi tiết: mã hoá vị trí.'),
            ],
          },
        ],
      },
      {
        id: 'ly-thuyet', title: 'Lý thuyết', section: 'ly-thuyet',
        scenes: [
          {
            view: 'Formula',
            props: { title: 'Scaled dot-product attention', items: [
              { label: 'Ba phép chiếu', tex: String.raw`Q = XW_q, \quad K = XW_k, \quad V = XW_v` },
              { label: 'Attention', tex: String.raw`\text{Attention}(Q,K,V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt d}\right) V` },
              { label: 'Mã hoá vị trí', tex: String.raw`PE_{t,2i} = \sin\!\big(t / 10000^{2i/d}\big), \quad PE_{t,2i+1} = \cos\!\big(t / 10000^{2i/d}\big)` },
              { label: 'Phân loại', tex: String.raw`h = \tfrac{1}{L}\sum_t H_t, \qquad \cp{p} = \sigma(h\cdot u + c)` },
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('X là ma trận: mỗi hàng là embedding của một từ cộng với mã hoá vị trí. Nhân với ba ma trận trọng số được Q, K, V.', { n: 1, hl: 0 }),
              L('Tích Q với K chuyển vị là ma trận chứa điểm khớp của mọi cặp từ. Chia cho căn của d để điểm số không quá lớn khi d tăng; nếu không, softmax sẽ dồn hết vào một từ.', { n: 2, hl: 1 }),
              L('Vì sao lại là căn d? Tích của hai vector ngẫu nhiên d chiều có độ lớn tăng theo căn d. Chia cho căn d đưa điểm số về cùng một cỡ, dù d là 8 hay 8 nghìn.', undefined, { say: 'Vì sao lại là căn d? Tích của hai vector ngẫu nhiên d chiều có độ lớn tăng theo căn d. Chia cho căn d đưa điểm số về cùng một cỡ, dù d là tám hay tám nghìn.' }),
              L('Attention tự nó không biết thứ tự: hoán đổi hai từ thì hai hàng của đầu ra cũng hoán đổi theo.'),
              L('Để mô hình biết một từ đứng ở vị trí nào, ta cộng vào embedding một vector cố định phụ thuộc vị trí, dựng từ các hàm sin và cos với tần số khác nhau.', { n: 3, hl: 2 }),
              L(`Cuối cùng lấy trung bình các hàng đầu ra, rồi áp hồi quy logistic của chương 2. Toàn bộ mô hình có ${nParams.toLocaleString('vi-VN')} tham số, phần lớn nằm trong bảng embedding.`, { n: 4, hl: 3 }, { say: `Cuối cùng lấy trung bình các hàng đầu ra, rồi áp hồi quy logistic của chương hai. Toàn bộ mô hình có ${speakNum(nParams.toLocaleString('vi-VN'))} tham số, phần lớn nằm trong bảng embedding.` }),
              L('Transformer, kiến trúc của các mô hình ngôn ngữ lớn, chồng hàng chục tầng attention như thế này, mỗi tầng nhiều đầu chạy song song, xen với các mạng dense của chương 9. Bản chất từng phép tính vẫn y như vậy.', { hl: -1 }, { say: 'Transformer, kiến trúc của các mô hình ngôn ngữ lớn, chồng hàng chục tầng attention như thế này, mỗi tầng nhiều đầu chạy song song, xen với các mạng dense của chương chín. Bản chất từng phép tính vẫn y như vậy.' }),
            ],
          },
        ],
      },
      {
        id: 'ma-nguon', title: 'Mã nguồn', section: 'ma-nguon',
        scenes: [
          {
            view: 'Code', props: { title: 'self_attention.py', code: attnPyCode },
            init: { a: 0, b: 0 },
            lines: [
              L('Attention chỉ là vài phép nhân ma trận và một softmax. Ví dụ với 3 từ, mỗi từ 4 chiều.', { a: 4, b: 6 }, { say: 'Attention chỉ là vài phép nhân ma trận và một softmax. Ví dụ với ba từ, mỗi từ bốn chiều.' }),
              L('Ba phép chiếu ra Q, K, V.', { a: 10, b: 10 }),
              L('Điểm số, softmax theo hàng, rồi trộn các vector V.', { a: 11, b: 14 }),
              L('Mô hình trên trang được huấn luyện bằng NumPy thuần, với lan truyền ngược viết tay, và được kiểm tra gradient bằng sai phân hữu hạn trước khi huấn luyện.', { a: 0, b: 0 }),
            ],
          },
        ],
      },
      {
        id: 'danh-gia', title: 'So với Naive Bayes', section: 'danh-gia',
        scenes: [
          {
            view: 'Table',
            props: {
              title: `${sms.test.length.toLocaleString('vi-VN')} tin nhắn test`,
              cols: ['Mô hình', 'Độ chính xác', 'Rác lọt qua', 'Thường bị chặn'],
              cls: ['t', '', '', ''],
              rows: [['Self-attention', `${pc(sA.acc)}%`, String(sA.fn), String(sA.fp)], ['Naive Bayes', `${pc(sN.acc)}%`, String(sN.fn), String(sN.fp)]],
            },
            init: { n: 0, hl: -1 },
            lines: [
              L(`Mô hình attention: đúng ${pc(sA.acc)}%, để lọt ${sA.fn} tin rác, chặn nhầm ${sA.fp} tin thường.`, { n: 1, hl: 0 }, { say: `Mô hình attention: đúng ${spc(sA.acc)}, để lọt ${speakNum(String(sA.fn))} tin rác, chặn nhầm ${speakNum(String(sA.fp))} tin thường.` }),
              L(`Naive Bayes của chương 4: đúng ${pc(sN.acc)}%, lọt ${sN.fn}, chặn nhầm ${sN.fp}. Gần như ngang nhau.`, { n: 2, hl: 1 }, { say: `Naive Bayes của chương bốn: đúng ${spc(sN.acc)}, lọt ${speakNum(String(sN.fn))}, chặn nhầm ${speakNum(String(sN.fp))}. Gần như ngang nhau.` }),
              L(`Hai mô hình sai theo hai kiểu khác nhau: attention để lọt nhiều tin rác hơn, ${sA.fn} so với ${sN.fn}, nhưng chặn nhầm ít hơn một chút.`, { hl: -1 }, { say: `Hai mô hình sai theo hai kiểu khác nhau: attention để lọt nhiều tin rác hơn, ${speakNum(String(sA.fn))} so với ${speakNum(String(sN.fn))}, nhưng chặn nhầm ít hơn một chút.` }),
              L('Tin rác trong bộ dữ liệu này dễ nhận ra chỉ từ từ vựng, nên ngữ cảnh không giúp thêm nhiều.'),
              L('Đây là một bài học quan trọng: mô hình mới hơn, phức tạp hơn, không tự động tốt hơn. Phải đo trên chính bài toán của mình.'),
              L('Sức mạnh của attention hiện ra khi nghĩa của câu thật sự phụ thuộc vào thứ tự và ngữ cảnh: dịch máy, trả lời câu hỏi, tóm tắt văn bản.'),
            ],
          },
          {
            view: 'Bullets',
            props: { title: 'Bẫy thường gặp', items: [
              '<b>Coi trọng số attention là lời giải thích</b> cho dự đoán.',
              '<b>Quên mã hoá vị trí</b> → thành túi từ có trọng số.',
              '<b>Chi phí bình phương</b>: ma trận L × L.',
              '<b>Dùng mô hình phức tạp khi không cần</b>.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Bốn bẫy thường gặp. Một: coi trọng số attention là lời giải thích. Từ được chú ý nhiều chưa chắc là lý do của dự đoán: thông tin còn đi qua V và các tầng khác.', { n: 1, hl: 0 }),
              L('Hai: quên mã hoá vị trí. Mô hình sẽ thành một túi từ có trọng số.', { n: 2, hl: 1 }),
              L(`Ngoài ra, mô hình của ta chỉ đọc ${m.maxLen} từ đầu tiên. Thông tin nằm ở cuối một tin nhắn dài sẽ bị bỏ qua hoàn toàn.`, undefined, { say: `Ngoài ra, mô hình của ta chỉ đọc ${speakNum(String(m.maxLen))} từ đầu tiên. Thông tin nằm ở cuối một tin nhắn dài sẽ bị bỏ qua hoàn toàn.` }),
              L('Ba: chi phí bình phương. Ma trận chú ý có L nhân L ô; với văn bản dài hàng nghìn từ, bộ nhớ và thời gian tăng rất nhanh.', { n: 3, hl: 2 }),
              L('Bốn: dùng mô hình phức tạp khi không cần. Ở đây Naive Bayes, chỉ là một bảng đếm, đã ngang ngửa. Luôn so với một mô hình đơn giản trước.', { n: 4, hl: 3 }),
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
              'Mỗi từ thành <b>embedding</b> cộng <b>mã hoá vị trí</b>.',
              '<b>q · k</b> đo mức khớp; <b>softmax</b> thành tỷ lệ chú ý; <b>trộn v</b>.',
              'Chia <b>√d</b> để softmax không quá gắt.',
              'Mạnh khi <b>ngữ cảnh và thứ tự</b> quan trọng; không phải lúc nào cũng cần.',
            ] },
            init: { n: 0, hl: -1 },
            lines: [
              L('Tóm lại.'),
              L('Mỗi từ thành một vector embedding, cộng mã hoá vị trí để biết mình đứng ở đâu.', { n: 1, hl: 0 }),
              L('Tích q với k đo mức khớp, softmax biến thành tỷ lệ chú ý, rồi trộn các vector v. Chia căn d để softmax không quá gắt.', { n: 3, hl: 2 }, { anim: 2 }),
              L('Attention mạnh khi ngữ cảnh và thứ tự quan trọng, nhưng không phải bài toán nào cũng cần nó.', { n: 4, hl: 3 }),
              L('Mô hình của ta có một tầng, một đầu, vector 8 chiều. Các mô hình ngôn ngữ lớn có hàng chục tầng, hàng chục đầu, vector hàng nghìn chiều, và học trên hàng nghìn tỷ từ. Nhưng từng phép tính bên trong vẫn là những gì ta vừa làm bằng tay.', undefined, { say: 'Mô hình của ta có một tầng, một đầu, vector tám chiều. Các mô hình ngôn ngữ lớn có hàng chục tầng, hàng chục đầu, vector hàng nghìn chiều, và học trên hàng nghìn tỷ từ. Nhưng từng phép tính bên trong vẫn là những gì ta vừa làm bằng tay.' }),
              L('Chương 12 là dự án cuối khoá: dự báo bụi mịn PM2.5 ở Hà Nội, ôn lại toàn bộ những gì ta đã học trên một bài toán Việt Nam đang diễn ra.', { hl: -1 }, { say: 'Chương mười hai là dự án cuối khoá: dự báo bụi mịn PM hai phẩy năm ở Hà Nội, ôn lại toàn bộ những gì ta đã học trên một bài toán Việt Nam đang diễn ra.' }),
              L('Giờ hãy cuộn xuống, tự gõ một tin nhắn và xem các từ nhìn nhau thế nào. Hẹn gặp lại ở chương 12.', undefined, { say: 'Giờ hãy cuộn xuống, tự gõ một tin nhắn và xem các từ nhìn nhau thế nào. Hẹn gặp lại ở chương mười hai.' }),
            ],
          },
        ],
      },
    ],
  };
}
