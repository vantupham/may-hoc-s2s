<script lang="ts">
  /** Huấn luyện trên tập train, đánh giá trên tập test, xem biểu đồ phần dư và tự dự đoán. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { ols, r2, fmt } from '../../lib/ml-core';

  interface Row { id: number; income: number; value: number }
  let { sample, testIds }: { sample: Row[]; testIds: number[] } = $props();
  const testSet = $derived(new Set(testIds));
  const train = $derived(sample.filter((r) => !testSet.has(r.id)));
  const test = $derived(sample.filter((r) => testSet.has(r.id)));
  const model = $derived(ols(train.map((r) => r.income), train.map((r) => r.value)));
  const meanTrain = $derived(train.reduce((a, r) => a + r.value, 0) / train.length);

  function metrics(rows: Row[], predict: (x: number) => number) {
    const ys = rows.map((r) => r.value);
    const ps = rows.map((r) => predict(r.income));
    const mse = ys.reduce((a, y, i) => a + (ps[i] - y) ** 2, 0) / ys.length;
    const mae = ys.reduce((a, y, i) => a + Math.abs(ps[i] - y), 0) / ys.length;
    return { mse, rmse: Math.sqrt(mse), mae, r2: r2(ys, ps) };
  }
  const lin = (x: number) => model.w * x + model.b;
  const base = () => meanTrain;
  const mTrain = $derived(metrics(train, lin));
  const mTest = $derived(metrics(test, lin));
  const bTest = $derived(metrics(test, base));

  let income = $state(5);
  const usd = (v: number) => `${Math.round(v * 100).toLocaleString('vi-VN')}.000 USD`;

  const W = 560, H = 300, m = { t: 30, r: 14, b: 44, l: 48 };
  const sx = scaleLinear().domain([0, 7]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([-4, 4]).range([H - m.b, m.t]);
</script>

<div class="lab">
  <p class="lab-title">Huấn luyện trên 320 khu vực, kiểm tra trên 80 khu vực mô hình chưa từng thấy</p>
  <p class="lab-hint">Mô hình học được: <span class="v-yh">ŷ</span> = <span class="v-w num">{fmt(model.w, 4)}</span>·<span class="v-x">x</span> + <span class="v-b num">{fmt(model.b, 4)}</span>. Mọi chỉ số dưới đây được tính lại ngay trong trình duyệt của bạn.</p>
  <div class="table-scroll">
    <table class="data">
      <thead><tr><th>Mô hình</th><th>Tập</th><th>MSE</th><th>RMSE (USD)</th><th>Sai lệch TB (USD)</th><th>R²</th></tr></thead>
      <tbody>
        <tr><td class="t">Hồi quy tuyến tính</td><td class="t">Train (320)</td><td>{fmt(mTrain.mse, 3)}</td><td>{usd(mTrain.rmse)}</td><td>{usd(mTrain.mae)}</td><td>{fmt(mTrain.r2, 3)}</td></tr>
        <tr class="on"><td class="t">Hồi quy tuyến tính</td><td class="t">Test (80)</td><td>{fmt(mTest.mse, 3)}</td><td>{usd(mTest.rmse)}</td><td>{usd(mTest.mae)}</td><td>{fmt(mTest.r2, 3)}</td></tr>
        <tr><td class="t">Luôn đoán giá trung bình</td><td class="t">Test (80)</td><td>{fmt(bTest.mse, 3)}</td><td>{usd(bTest.rmse)}</td><td>{usd(bTest.mae)}</td><td>{fmt(bTest.r2, 3)}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="lab-grid">
    <div>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ phần dư trên tập test và train">
        <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Giá dự đoán ŷ (×100.000 USD)" />
        <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Sai số e = ŷ − y" />
        <line x1={m.l} x2={W - m.r} y1={sy(0)} y2={sy(0)} stroke="var(--faint)" />
        {#each train as r}<circle cx={sx(lin(r.income))} cy={sy(lin(r.income) - r.value)} r="2.5" fill="var(--faint)" fill-opacity="0.35" />{/each}
        {#each test as r}<circle cx={sx(lin(r.income))} cy={sy(lin(r.income) - r.value)} r="3.5" fill={r.value >= 5 ? 'var(--c-e)' : 'var(--c-yh)'} fill-opacity="0.8" />{/each}
        <line x1={sx(0.3)} y1={sy(0.3 - 5)} x2={sx(7)} y2={sy(7 - 5)} stroke="var(--c-e)" stroke-dasharray="4 4" opacity="0.6" />
      </svg>
      <p class="cap">Chấm cam: tập test · chấm xám: tập train · đường đỏ chéo: các khu vực bị chặn trần 5,0 xếp thành một vệt thẳng.</p>
    </div>
    <div class="predict">
      <p><b>Thử dự đoán</b></p>
      <label>Thu nhập trung bình khu vực: <b class="num">{Math.round(income * 10000).toLocaleString('vi-VN')} USD/năm</b>
        <input type="range" min="0.5" max="15" step="0.1" bind:value={income} style="width:100%" />
      </label>
      <p class="big"><span class="v-yh">ŷ</span> = {fmt(model.w, 3)} × {fmt(income, 1)} + {fmt(model.b, 3)} = <b class="v-yh num">{fmt(lin(income), 3)}</b></p>
      <p>→ khoảng <b>{usd(lin(income))}</b>, sai lệch điển hình ± {usd(mTest.rmse)}.</p>
      {#if income > 10}<p class="warn">Cẩn thận: rất ít khu vực có thu nhập cao như vậy, và giá thật đã bị chặn ở 500.001 USD. Mô hình đang <b>ngoại suy</b>.</p>{/if}
    </div>
  </div>
</div>

<style>
  .cap { font-size: 0.8rem; color: var(--pencil); margin: 0.2rem 0 0; }
  .predict { background: var(--paper); border: 1px solid var(--rule); border-radius: 3px; padding: 0.8rem 1rem; font-size: 0.9rem; }
  .predict p { margin: 0 0 0.5rem; }
  .big { font-size: 1rem; }
  .warn { color: var(--c-L); }
</style>
