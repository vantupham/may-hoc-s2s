/**
 * Chuyển phụ đề thành lời đọc tiếng Việt cho máy đọc: số → chữ, ký hiệu → lời.
 * Số viết kiểu Việt: dấu phẩy thập phân (0,37), dấu chấm ngăn nghìn (20.640), dấu − cho số âm.
 */

const DIGIT = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

/** Đọc một nhóm ba chữ số. full = có nhóm đứng trước (đọc đủ "không trăm", "linh"). */
function triple(n: number, full: boolean): string[] {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10;
  const out: string[] = [];
  if (h > 0 || full) out.push(DIGIT[h], 'trăm');
  if (t === 0) {
    if (u > 0) { if (h > 0 || full) out.push('linh'); out.push(DIGIT[u]); }
  } else if (t === 1) {
    out.push('mười');
    if (u === 5) out.push('lăm'); else if (u > 0) out.push(DIGIT[u]);
  } else {
    out.push(DIGIT[t], 'mươi');
    if (u === 1) out.push('mốt'); else if (u === 5) out.push('lăm'); else if (u > 0) out.push(DIGIT[u]);
  }
  return out;
}

/** Đọc số nguyên không âm. */
export function readInt(n: number): string {
  if (!Number.isFinite(n) || n < 0) throw new Error(`readInt: ${n}`);
  n = Math.floor(n);
  if (n === 0) return 'không';
  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const groups: number[] = [];
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
  const out: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    out.push(...triple(g, i < groups.length - 1), units[i]);
  }
  return out.filter(Boolean).join(' ');
}

/**
 * Đọc một số viết kiểu Việt: "−11,11" → "âm mười một phẩy mười một".
 * Phần thập phân bỏ số 0 cuối; một hoặc hai chữ số (không bắt đầu bằng 0) đọc như số, còn lại đọc từng chữ số.
 */
export function readNumber(s: string): string {
  let neg = false;
  if (s[0] === '−' || s[0] === '-') { neg = true; s = s.slice(1); }
  const [ip, dp = ''] = s.split(',');
  const words = [readInt(Number(ip.replace(/\./g, '')))];
  const d = dp.replace(/0+$/, '');
  if (d) {
    words.push('phẩy');
    if (d.length <= 2 && d[0] !== '0') words.push(readInt(Number(d)));
    else words.push(...[...d].map((c) => DIGIT[+c]));
  }
  return (neg ? 'âm ' : '') + words.join(' ');
}

const SUB: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', 'ᵢ': ' i' };

/** Ký hiệu → lời. Thứ tự quan trọng: cụm dài trước. */
const SYMBOLS: [RegExp, string][] = [
  [/∂L\/∂w/g, ' đạo hàm của L theo w '],
  [/∂L\/∂b/g, ' đạo hàm của L theo b '],
  [/∂L\/∂z/g, ' đạo hàm của L theo z '],
  [/L″|L''/g, ' đạo hàm bậc hai của L '],
  [/ŷ/g, ' y mũ '],
  [/η/g, ' ê-ta '],
  [/σ/g, ' xích-ma '],
  [/Σ/g, ' tổng '],
  [/λ/g, ' lăm-đa '],
  [/γ/g, ' gam-ma '],
  [/θ/g, ' tê-ta '],
  [/α/g, ' an-pha '],
  [/β/g, ' bê-ta '],
  [/μ/g, ' muy '],
  [/(\w)\*/g, '$1 sao '],
  [/²/g, ' bình phương '],
  [/³/g, ' lập phương '],
  [/√/g, ' căn '],
  [/≈/g, ' xấp xỉ '],
  [/≠/g, ' khác '],
  [/≤/g, ' nhỏ hơn hoặc bằng '],
  [/≥/g, ' lớn hơn hoặc bằng '],
  [/ < /g, ' nhỏ hơn '],
  [/ > /g, ' lớn hơn '],
  [/←/g, ' được thay bằng '],
  [/→/g, ', '],
  [/=/g, ' bằng '],
  [/×|·/g, ' nhân '],
  [/ \+ /g, ' cộng '],
  [/ [−-] /g, ' trừ '],
  [/ \/ /g, ' chia '],
  [/%/g, ' phần trăm'],
  [/USD/g, 'đô la'],
  [/[()[\]"“”«»]/g, ' '],
  [/…/g, ', '],
];

/** Số kiểu Việt: tuỳ chọn dấu âm, nhóm nghìn bằng dấu chấm, phần thập phân sau dấu phẩy. */
const NUM = /(^|[^\p{L}\p{N}])([−-]?)(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?(?![\p{N}])/gu;

/** Phụ đề → lời đọc. */
export function speak(cap: string): string {
  let s = cap.replace(/<[^>]+>/g, ''); // bỏ thẻ HTML trong phụ đề
  s = s.replace(/[₀-₉ᵢ]/g, (c) => SUB[c]);
  for (const [re, rep] of SYMBOLS) s = s.replace(re, rep);
  s = s.replace(NUM, (_m, pre: string, sign: string, ip: string, dp = '') => `${pre}${readNumber(sign + ip + dp)}`);
  return s.replace(/\s+([,.;:!?])/g, '$1').replace(/,(\s*,)+/g, ',').replace(/,([.;:!?])/g, '$1').replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '').trim();
}
