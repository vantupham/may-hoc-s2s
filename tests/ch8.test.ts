import { describe, expect, it } from 'vitest';
import ref from './fixtures/ch8.json';
import dg from '../src/data/digits.json';
import split from '../src/data/digits-split.json';
import cancer from '../src/data/cancer.json';
import { tinyPass, mlpFromArrays, mlpEpoch, mlpPredict, mlpForward, type Tiny } from '../src/lib/ml-core/nn';

describe('Mạng nhỏ 2-3-1', () => {
  const net: Tiny = { W1: ref.tiny.W1, b1: ref.tiny.b1, w2: ref.tiny.w2, b2: ref.tiny.b2 };
  const p = cancer.mini[0];
  const r = tinyPass(net, [p.x1, p.x2], p.y);
  it('lan truyền xuôi và ngược khớp NumPy', () => {
    expect(r.p).toBeCloseTo(ref.tiny.p, 12);
    expect(r.loss).toBeCloseTo(ref.tiny.loss, 12);
    r.dW1.forEach((row, j) => row.forEach((g, i) => expect(g).toBeCloseTo(ref.tiny.dW1[j][i], 12)));
    r.dw2.forEach((g, j) => expect(g).toBeCloseTo(ref.tiny.dw2[j], 12));
  });
  it('gradient khớp đạo hàm số (sai phân hữu hạn)', () => {
    const h = 1e-6;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) {
      const up = structuredClone(net); up.W1[j][i] += h;
      const dn = structuredClone(net); dn.W1[j][i] -= h;
      const num = (tinyPass(up, [p.x1, p.x2], p.y).loss - tinyPass(dn, [p.x1, p.x2], p.y).loss) / (2 * h);
      expect(Math.abs(num - r.dW1[j][i])).toBeLessThan(1e-8);
    }
  });
});

describe('MLP 64-32-10 trên chữ số 8×8', () => {
  const test = new Set(split.testIds);
  const tr = dg.digits.filter((_, i) => !test.has(i));
  const te = dg.digits.filter((_, i) => test.has(i));
  const X = tr.map((d) => d.px.map((v) => v / 16));
  const Y = tr.map((d) => d.y);
  it('một epoch SGD khớp NumPy (cùng khởi tạo, cùng thứ tự lô)', () => {
    const n = mlpFromArrays(ref.mlp.init.W1, ref.mlp.init.W2);
    const losses = mlpEpoch(n, X, Y, ref.mlp.order, ref.mlp.batch, ref.mlp.lr);
    losses.forEach((l, k) => expect(l).toBeCloseTo(ref.mlp.losses[k], 9));
    expect(n.W1.reduce((a, v) => a + v, 0)).toBeCloseTo(ref.mlp.W1sum, 8);
    const acc = te.filter((d) => mlpPredict(n, d.px.map((v) => v / 16)) === d.y).length / te.length;
    expect(acc).toBeCloseTo(ref.mlp.testAcc, 12);
  });
  it('softmax cộng lại bằng 1', () => {
    const n = mlpFromArrays(ref.mlp.init.W1, ref.mlp.init.W2);
    const p = mlpForward(n, X[0]).p;
    expect(p.reduce((a, v) => a + v, 0)).toBeCloseTo(1, 12);
  });
});
