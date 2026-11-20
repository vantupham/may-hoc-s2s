import { describe, expect, it } from 'vitest';
import ref from './fixtures/ch10.json';
import model from '../src/data/attention.json';
import sms from '../src/data/sms.json';
import { attnForward } from '../src/lib/ml-core/attention';

describe('Self-attention trên SMS', () => {
  it('xác suất spam của 60 tin test khớp NumPy', () => {
    ref.probs.forEach((p, i) => expect(attnForward(model, sms.test[i].text).p).toBeCloseTo(p, 4));
  });
  it('ma trận attention khớp và mỗi hàng cộng lại bằng 1', () => {
    const r = attnForward(model, sms.test[0].text);
    r.A.forEach((row, i) => {
      expect(row.reduce((a, v) => a + v, 0)).toBeCloseTo(1, 12);
      row.forEach((v, j) => expect(v).toBeCloseTo(ref.A0[i][j], 4));
    });
  });
});
