import { type Calc, tex, texp } from './trace';

/**
 * CNN nhỏ: ảnh 28×28 → tích chập 6 bộ lọc 3×3 (không đệm) → ReLU → max-pool 2×2 → dense 10 → softmax.
 * Trọng số được huấn luyện sẵn bằng NumPy (scripts/prep_ch9.py); trình duyệt chạy lan truyền xuôi và ghi lại phép tính.
 */
export interface CNN { Wc: number[][][]; bc: number[]; Wd: number[][]; bd: number[] }

export function decodeImage(b64: string): number[] {
  const bin = atob(b64);
  return Array.from({ length: bin.length }, (_, i) => bin.charCodeAt(i) / 255);
}

/** Tích chập một bộ lọc 3×3 trên ảnh n×n (valid). Trả về bản đồ (n−2)×(n−2) trước ReLU. */
export function conv2d(img: number[], n: number, k: number[][], b: number): number[] {
  const m = n - 2;
  const out = new Array(m * m);
  for (let r = 0; r < m; r++)
    for (let c = 0; c < m; c++) {
      let s = b;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += img[(r + i) * n + c + j] * k[i][j];
      out[r * m + c] = s;
    }
  return out;
}

export const relu = (v: number[]) => v.map((x) => (x > 0 ? x : 0));

/** Max-pool 2×2 bước 2 trên bản đồ m×m (m chẵn). */
export function maxpool(a: number[], m: number) {
  const h = m / 2;
  const out = new Array(h * h);
  const arg = new Array(h * h);
  for (let r = 0; r < h; r++)
    for (let c = 0; c < h; c++) {
      let best = -Infinity, bi = 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const idx = (2 * r + i) * m + 2 * c + j;
        if (a[idx] > best) { best = a[idx]; bi = idx; }
      }
      out[r * h + c] = best; arg[r * h + c] = bi;
    }
  return { out, arg };
}

export function cnnForward(net: CNN, img: number[]) {
  const z = net.Wc.map((k, f) => conv2d(img, 28, k, net.bc[f]));
  const a = z.map(relu);
  const pools = a.map((m) => maxpool(m, 26));
  const flat = pools.flatMap((p) => p.out);
  const logits = net.Wd.map((w, k) => w.reduce((s, v, i) => s + v * flat[i], net.bd[k]));
  const mx = Math.max(...logits);
  const e = logits.map((l) => Math.exp(l - mx));
  const se = e.reduce((s, v) => s + v, 0);
  const p = e.map((v) => v / se);
  return { z, a, pools, flat, logits, p, pred: p.indexOf(Math.max(...p)) };
}

/** Phép tính của một ô trên bản đồ đặc trưng: 9 phép nhân, cộng, cộng bias, ReLU. */
export function convCellCalc(img: number[], k: number[][], b: number, r: number, c: number): Calc {
  const terms = [];
  let s = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const v = img[(r + i) * 28 + c + j];
    terms.push({ label: `(${r + i}, ${c + j})`, expr: `${v.toFixed(3).replace('.', ',')} × ${k[i][j].toFixed(3).replace('.', ',')}`, value: v * k[i][j] });
    s += v * k[i][j];
  }
  const z = s + b;
  const parts = terms.map((t, q) => String.raw`${tex(img[(r + Math.floor(q / 3)) * 28 + c + (q % 3)], 2)}\cdot\cw{${texp(k[Math.floor(q / 3)][q % 3], 2)}}`);
  return {
    key: 'cell', name: `Ô (${r}, ${c}) của bản đồ đặc trưng`,
    formula: String.raw`\cz{z_{r,c}} = \sum_{i=0}^{2}\sum_{j=0}^{2} \cx{x_{r+i,\,c+j}}\,\cw{k_{i,j}} + \cb{b}, \qquad a = \max(0, \cz{z})`,
    substituted: String.raw`\begin{aligned} \cz{z} &= ${parts.slice(0, 3).join(' + ')} \\ &\quad + ${parts.slice(3, 6).join(' + ')} \\ &\quad + ${parts.slice(6).join(' + ')} + \cb{${texp(b, 3)}} \\ &= \cz{${tex(z, 3)}} \;\Rightarrow\; a = ${tex(Math.max(0, z), 3)} \end{aligned}`,
    value: z,
    terms,
  };
}
