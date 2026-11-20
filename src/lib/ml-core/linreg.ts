import { type Calc, type Term, type Trace, fmt, tex, texp, texSum } from './trace';

/**
 * Hồi quy tuyến tính một biến: ŷ = w·x + b, hàm mất mát MSE.
 * Quy ước màu trong công thức: \cw{} trọng số, \cb{} hệ số chặn, \cx{} đầu vào,
 * \cy{} giá trị thật, \cyh{} dự đoán, \ce{} sai số, \cL{} mất mát, \cg{} gradient, \ceta{} tốc độ học.
 */
export interface LinRegState {
  w: number;
  b: number;
  preds: number[];
  errors: number[];
  loss: number;
  dw: number;
  db: number;
  wNext: number;
  bNext: number;
}

export interface LinRegOptions {
  w0?: number;
  b0?: number;
  lr?: number;
  epochs?: number;
  /** false: cố định b = b0 (dùng cho bài Gradient Descent một biến) */
  fitIntercept?: boolean;
  /** Ghi chi tiết từng dòng dữ liệu vào Term (chỉ nên bật khi n nhỏ) */
  detail?: boolean;
}

export function mse(xs: number[], ys: number[], w: number, b: number): number {
  let s = 0;
  for (let i = 0; i < xs.length; i++) {
    const e = w * xs[i] + b - ys[i];
    s += e * e;
  }
  return s / xs.length;
}

/** Một bước gradient descent đầy đủ, kèm các phép tính giải thích. */
export function linregStep(
  xs: number[],
  ys: number[],
  w: number,
  b: number,
  lr: number,
  fitIntercept: boolean,
  detail: boolean,
): { state: LinRegState; calcs: Calc[] } {
  const n = xs.length;
  const preds = xs.map((x) => w * x + b);
  const errors = preds.map((p, i) => p - ys[i]);
  let sse = 0, sex = 0, se = 0;
  for (let i = 0; i < n; i++) {
    sse += errors[i] * errors[i];
    sex += errors[i] * xs[i];
    se += errors[i];
  }
  const loss = sse / n;
  const dw = (2 / n) * sex;
  const db = fitIntercept ? (2 / n) * se : 0;
  const wNext = w - lr * dw;
  const bNext = fitIntercept ? b - lr * db : b;

  const calcs: Calc[] = [];
  if (detail) {
    preds.forEach((p, i) => {
      calcs.push({
        key: `pred${i}`,
        name: `Dự đoán căn ${i + 1}`,
        formula: String.raw`\cyh{\hat y_{${i + 1}}} = \cw{w}\,\cx{x_{${i + 1}}} + \cb{b}`,
        substituted: String.raw`\cyh{\hat y_{${i + 1}}} = \cw{${tex(w)}} \times \cx{${tex(xs[i])}} + \cb{${texp(b)}} = \cyh{${tex(p)}}`,
        value: p,
      });
      calcs.push({
        key: `err${i}`,
        name: `Sai số căn ${i + 1}`,
        formula: String.raw`\ce{e_{${i + 1}}} = \cyh{\hat y_{${i + 1}}} - \cy{y_{${i + 1}}}`,
        substituted: String.raw`\ce{e_{${i + 1}}} = \cyh{${tex(p)}} - \cy{${tex(ys[i])}} = \ce{${tex(errors[i])}}`,
        value: errors[i],
      });
    });
  }

  const lossTerms: Term[] | undefined = detail
    ? errors.map((e, i) => ({ label: `căn ${i + 1}`, expr: `${fmt(e)}²`, value: e * e }))
    : undefined;
  calcs.push({
    key: 'loss',
    name: 'Mất mát MSE',
    formula: String.raw`\cL{L} = \frac{1}{n}\sum_{i=1}^{n} \ce{e_i}^2`,
    substituted: detail
      ? texSum(String.raw`\cL{L}`, String.raw`\frac{1}{${n}}`, errors.map((e) => String.raw`\ce{${texp(e)}}^2`), String.raw`\cL{${tex(loss, 4)}}`, 3)
      : String.raw`\cL{L} = \frac{${tex(sse, 3)}}{${n}} = \cL{${tex(loss, 4)}}`,
    value: loss,
    terms: lossTerms,
  });

  calcs.push({
    key: 'dw',
    name: 'Đạo hàm theo w',
    formula: String.raw`\cg{\frac{\partial L}{\partial w}} = \frac{2}{n}\sum_{i=1}^{n} \ce{e_i}\,\cx{x_i}`,
    substituted: detail
      ? texSum(String.raw`\cg{\frac{\partial L}{\partial w}}`, String.raw`\frac{2}{${n}}`, errors.map((e, i) => String.raw`\ce{${texp(e)}}\cdot\cx{${tex(xs[i])}}`), String.raw`\cg{${tex(dw, 4)}}`, 2)
      : String.raw`\cg{\frac{\partial L}{\partial w}} = \frac{2}{${n}} \times ${texp(sex)} = \cg{${tex(dw, 4)}}`,
    value: dw,
    terms: detail ? errors.map((e, i) => ({ label: `căn ${i + 1}`, expr: `${fmt(e)} × ${fmt(xs[i])}`, value: e * xs[i] })) : undefined,
  });
  if (fitIntercept) {
    calcs.push({
      key: 'db',
      name: 'Đạo hàm theo b',
      formula: String.raw`\cg{\frac{\partial L}{\partial b}} = \frac{2}{n}\sum_{i=1}^{n} \ce{e_i}`,
      substituted: detail
        ? texSum(String.raw`\cg{\frac{\partial L}{\partial b}}`, String.raw`\frac{2}{${n}}`, errors.map((e) => String.raw`\ce{${texp(e)}}`), String.raw`\cg{${tex(db, 4)}}`, 3)
        : String.raw`\cg{\frac{\partial L}{\partial b}} = \frac{2}{${n}} \times ${texp(se)} = \cg{${tex(db, 4)}}`,
      value: db,
      terms: detail ? errors.map((e, i) => ({ label: `căn ${i + 1}`, value: e })) : undefined,
    });
  }
  calcs.push({
    key: 'wNext',
    name: 'Cập nhật w',
    formula: String.raw`\cw{w_{\text{mới}}} = \cw{w} - \ceta{\eta}\,\cg{\frac{\partial L}{\partial w}}`,
    substituted: String.raw`\cw{w_{\text{mới}}} = \cw{${tex(w, 4)}} - \ceta{${tex(lr, 3)}} \times \cg{${texp(dw, 4)}} = \cw{${tex(wNext, 4)}}`,
    value: wNext,
  });
  if (fitIntercept) {
    calcs.push({
      key: 'bNext',
      name: 'Cập nhật b',
      formula: String.raw`\cb{b_{\text{mới}}} = \cb{b} - \ceta{\eta}\,\cg{\frac{\partial L}{\partial b}}`,
      substituted: String.raw`\cb{b_{\text{mới}}} = \cb{${tex(b, 4)}} - \ceta{${tex(lr, 3)}} \times \cg{${texp(db, 4)}} = \cb{${tex(bNext, 4)}}`,
      value: bNext,
    });
  }
  return { state: { w, b, preds, errors, loss, dw, db, wNext, bNext }, calcs };
}

/** Chạy gradient descent và ghi lại toàn bộ trace. */
export function linearRegressionGD(xs: number[], ys: number[], opts: LinRegOptions = {}): Trace<LinRegState> {
  const { w0 = 0, b0 = 0, lr = 0.01, epochs = 50, fitIntercept = true, detail = xs.length <= 12 } = opts;
  const steps = [];
  let w = w0, b = b0;
  for (let k = 0; k < epochs; k++) {
    const { state, calcs } = linregStep(xs, ys, w, b, lr, fitIntercept, detail);
    steps.push({ index: k, title: `Vòng lặp ${k + 1}`, state, calcs });
    w = state.wNext;
    b = state.bNext;
    if (!Number.isFinite(w) || !Number.isFinite(b)) break;
  }
  return { algorithm: 'linear-regression-gd', params: { w0, b0, lr, epochs, fitIntercept }, steps };
}

/** Nghiệm đóng (bình phương tối thiểu) cho hồi quy một biến, kèm phép tính. */
export function ols(xs: number[], ys: number[]): { w: number; b: number; calcs: Calc[] } {
  const n = xs.length;
  const mx = xs.reduce((a, v) => a + v, 0) / n;
  const my = ys.reduce((a, v) => a + v, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const w = sxy / sxx;
  const b = my - w * mx;
  return {
    w,
    b,
    calcs: [
      { key: 'mx', name: 'Trung bình x', formula: String.raw`\bar{\cx{x}} = \frac{1}{n}\sum \cx{x_i}`, substituted: String.raw`\bar{\cx{x}} = \cx{${tex(mx, 4)}}`, value: mx },
      { key: 'my', name: 'Trung bình y', formula: String.raw`\bar{\cy{y}} = \frac{1}{n}\sum \cy{y_i}`, substituted: String.raw`\bar{\cy{y}} = \cy{${tex(my, 4)}}`, value: my },
      {
        key: 'w', name: 'w tối ưu',
        formula: String.raw`\cw{w^*} = \frac{\sum (\cx{x_i}-\bar{\cx{x}})(\cy{y_i}-\bar{\cy{y}})}{\sum (\cx{x_i}-\bar{\cx{x}})^2}`,
        substituted: String.raw`\cw{w^*} = \frac{${tex(sxy, 3)}}{${tex(sxx, 3)}} = \cw{${tex(w, 4)}}`, value: w,
      },
      {
        key: 'b', name: 'b tối ưu',
        formula: String.raw`\cb{b^*} = \bar{\cy{y}} - \cw{w^*}\,\bar{\cx{x}}`,
        substituted: String.raw`\cb{b^*} = \cy{${tex(my, 4)}} - \cw{${tex(w, 4)}} \times \cx{${tex(mx, 4)}} = \cb{${tex(b, 4)}}`, value: b,
      },
    ],
  };
}

/** R² — tỷ lệ phương sai được mô hình giải thích. */
export function r2(ys: number[], preds: number[]): number {
  const my = ys.reduce((a, v) => a + v, 0) / ys.length;
  let ssr = 0, sst = 0;
  for (let i = 0; i < ys.length; i++) {
    ssr += (ys[i] - preds[i]) ** 2;
    sst += (ys[i] - my) ** 2;
  }
  return 1 - ssr / sst;
}
