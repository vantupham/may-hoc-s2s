/**
 * Tạo ảnh BMP 24-bit (không nén) dạng data URL từ một lưới giá trị. Gọn hơn rất nhiều so với vẽ từng ô
 * bằng SVG, và chạy được cả lúc dựng trang tĩnh (Node) lẫn trong trình duyệt.
 */
type RGB = [number, number, number];
const INK: RGB = [29, 31, 44];
const PAPER: RGB = [255, 255, 255];
const POS: RGB = [217, 46, 59];
const NEG: RGB = [37, 86, 224];
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] * (1 - t) + b[i] * t)) as RGB;

function b64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function bitmapURL(px: number[], side: number, opts: { max?: number; diverging?: boolean } = {}): string {
  const { max = 16, diverging = false } = opts;
  const amax = diverging ? Math.max(1e-9, ...px.map(Math.abs)) : max;
  const rowBytes = Math.ceil((side * 3) / 4) * 4;
  const size = 54 + rowBytes * side;
  const buf = new Uint8Array(size);
  const dv = new DataView(buf.buffer);
  buf[0] = 0x42; buf[1] = 0x4d;
  dv.setUint32(2, size, true);
  dv.setUint32(10, 54, true);
  dv.setUint32(14, 40, true);
  dv.setInt32(18, side, true);
  dv.setInt32(22, -side, true); // chiều cao âm: hàng đầu tiên ở trên cùng
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 24, true);
  dv.setUint32(34, rowBytes * side, true);
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      const v = px[r * side + c] ?? 0;
      let col: RGB;
      if (diverging) {
        const t = Math.max(-1, Math.min(1, v / amax));
        col = t >= 0 ? mix(PAPER, POS, t) : mix(PAPER, NEG, -t);
      } else col = mix(PAPER, INK, Math.max(0, Math.min(1, v / amax)));
      const o = 54 + r * rowBytes + c * 3;
      buf[o] = col[2]; buf[o + 1] = col[1]; buf[o + 2] = col[0];
    }
  }
  return `data:image/bmp;base64,${b64(buf)}`;
}
