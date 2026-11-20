import { describe, expect, it } from 'vitest';
import ref from './fixtures/ch9.json';
import data from '../src/data/fashion-cnn.json';
import { cnnForward, decodeImage, conv2d, maxpool, convCellCalc } from '../src/lib/ml-core/cnn';

// atob có sẵn trong Node 18+
describe('CNN Fashion-MNIST', () => {
  it('logits của 20 ảnh khớp NumPy', () => {
    ref.logits.forEach((row, i) => {
      const r = cnnForward(data, decodeImage(data.images[i].b64));
      row.forEach((v, k) => expect(r.logits[k]).toBeCloseTo(v, 9));
    });
  });
  it('tích chập và max-pool đúng trên ví dụ nhỏ', () => {
    const img = Array.from({ length: 16 }, (_, i) => i);
    const out = conv2d(img, 4, [[0, 0, 0], [0, 1, 0], [0, 0, 0]], 0);
    expect(out).toEqual([5, 6, 9, 10]);
    expect(maxpool([1, 2, 3, 4], 2).out).toEqual([4]);
  });
  it('phép tính của một ô khớp bản đồ đặc trưng', () => {
    const img = decodeImage(data.images[0].b64);
    const r = cnnForward(data, img);
    const c = convCellCalc(img, data.Wc[2], data.bc[2], 10, 12);
    expect(c.value).toBeCloseTo(r.z[2][10 * 26 + 12], 12);
  });
});
