import { describe, expect, it } from 'vitest';
import ref from './fixtures/ch3.json';
import iris from '../src/data/iris.json';
import sms from '../src/data/sms.json';
import { knnPredict, neighbors } from '../src/lib/ml-core/knn';
import { nbFromCounts, nbScore, nbTrain, tokenize } from '../src/lib/ml-core/nb';

const test = new Set(iris.testIds);
const train = iris.flowers.filter((f) => !test.has(f.id)).map((f) => ({ id: f.id, a: f.len, b: f.wid, y: f.y }));
const testF = iris.flowers.filter((f) => test.has(f.id));

describe('KNN trên Iris', () => {
  it('khớp scikit-learn KNeighborsClassifier (k = 5)', () => {
    const pred = testF.map((f) => knnPredict({ a: f.len, b: f.wid }, train, 5, 3).pred);
    expect(pred).toEqual(ref.knnPred);
  });
  it('láng giềng được sắp theo khoảng cách tăng dần', () => {
    const nb = neighbors({ a: 4.5, b: 1.5 }, train);
    for (let i = 1; i < nb.length; i++) expect(nb[i].dist).toBeGreaterThanOrEqual(nb[i - 1].dist);
  });
});

describe('Naive Bayes trên SMS Spam', () => {
  const m = nbFromCounts(sms.vocab, sms.counts, sms.docs, 1);
  it('log xác suất kết hợp khớp scikit-learn MultinomialNB', () => {
    ref.nbJointLog.forEach((row, i) => {
      const s = nbScore(m, sms.test[i].text);
      expect(Math.abs(s.joint[0] - row[0])).toBeLessThan(1e-9);
      expect(Math.abs(s.joint[1] - row[1])).toBeLessThan(1e-9);
    });
  });
  it('dự đoán trên toàn bộ tập test khớp scikit-learn', () => {
    const pred = sms.test.map((t) => nbScore(m, t.text).pred);
    expect(pred).toEqual(ref.nbPred);
  });
  it('huấn luyện = đếm từ', () => {
    const mini = nbTrain(sms.mini);
    const total = sms.mini.reduce((a, t) => a + tokenize(t.text).length, 0);
    expect(mini.totals[0] + mini.totals[1]).toBe(total);
    expect(mini.docs).toEqual([3, 3]);
  });
});
