/** Hồi quy tuyến tính nhiều biến (QR) và hồi quy K láng giềng, dùng cho các thí nghiệm dữ liệu. */
import { lstsq } from './evaluate';

export function linFit(X: number[][], y: number[]): number[] {
  return lstsq(X.map((r) => [1, ...r]), y);
}
export function linPredict(c: number[], X: number[][]): number[] {
  return X.map((r) => r.reduce((a, v, j) => a + v * c[j + 1], c[0]));
}
export function rmse(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}

/** Dự đoán = trung bình y của k điểm huấn luyện gần nhất (Euclid). Đầu vào dạng cột để chạy nhanh. */
export function knnRegress(trainCols: Float64Array[], ty: ArrayLike<number>, testCols: Float64Array[], k: number): number[] {
  const nTr = trainCols[0].length, nTe = testCols[0].length, d = trainCols.length;
  const out = new Array(nTe);
  const bd = new Float64Array(k + 1), bi = new Int32Array(k + 1);
  for (let i = 0; i < nTe; i++) {
    let cnt = 0;
    for (let j = 0; j < nTr; j++) {
      let s = 0;
      for (let c = 0; c < d; c++) { const t = testCols[c][i] - trainCols[c][j]; s += t * t; }
      if (cnt < k || s < bd[cnt - 1]) {
        let p = cnt < k ? cnt++ : k - 1;
        while (p > 0 && bd[p - 1] > s) { bd[p] = bd[p - 1]; bi[p] = bi[p - 1]; p--; }
        bd[p] = s; bi[p] = j;
      }
    }
    let sum = 0;
    for (let q = 0; q < k; q++) sum += ty[bi[q]];
    out[i] = sum / k;
  }
  return out;
}
