<script lang="ts">
  /**
   * Cross-validation theo thời gian (TimeSeriesSplit, 5 phần) so với k-fold xáo trộn, trên tập huấn luyện.
   * Cửa sổ chia tính bằng ml-core rollingOrigin (khớp scikit-learn); MAE của gradient boosting tính sẵn bằng scikit-learn.
   */
  import { rollingOrigin, fmt } from '../../lib/ml-core';
  import { fmtDate } from '../../lib/khongkhi';

  interface Fold { train: number[]; test: number[]; from: string; to: string; mae: number; persist: number }
  let { cvTime, cvRand, cvRandFold, nTrain }: { cvTime: Fold[]; cvRand: number[]; cvRandFold: number[]; nTrain: number } = $props();
  const folds = $derived(rollingOrigin(nTrain, 5));
  let mode = $state<'time' | 'rand'>('time');
  let k = $state(0);
  const meanT = $derived(cvTime.reduce((a, f) => a + f.mae, 0) / cvTime.length);
  const meanR = $derived(cvRand.reduce((a, v) => a + v, 0) / cvRand.length);
  const spread = (v: number[]) => Math.max(...v) - Math.min(...v);
  const W = 620, bh = 16;
  const x = (i: number) => 10 + (i / nTrain) * (W - 20);
</script>

<div class="lab">
  <p class="lab-title">Cross-validation khi dữ liệu có thứ tự thời gian</p>
  <p class="lab-hint">{nTrain} ngày huấn luyện xếp theo thời gian từ trái sang phải. Ở mỗi lần gập, <span class="tr">màu xám</span> là phần mô hình được học, <span class="te">màu tím</span> là phần dùng để chấm điểm. Mô hình: gradient boosting 300 cây.</p>
  <div class="ctrl">
    <button class="chip" class:sel={mode === 'time'} type="button" onclick={() => (mode = 'time')}>theo thời gian (trượt gốc)</button>
    <button class="chip" class:sel={mode === 'rand'} type="button" onclick={() => (mode = 'rand')}>k-fold xáo trộn</button>
  </div>
  <svg class="chart" viewBox={`0 0 ${W} ${5 * (bh + 8) + 4}`} role="img" aria-label="Các lần gập của cross-validation">
    {#each folds as f, i}
      <g transform={`translate(0,${i * (bh + 8)})`} class:dim={mode === 'time' && i !== k} onclick={() => (k = i)} onkeydown={() => {}} role="button" tabindex="-1" style="cursor:pointer">
        {#if mode === 'time'}
          <rect x={x(0)} y="0" width={x(f.train.length) - x(0)} height={bh} fill="var(--faint)" opacity="0.35" />
          <rect x={x(f.test[0])} y="0" width={x(f.test.at(-1)! + 1) - x(f.test[0])} height={bh} fill="var(--tim)" opacity="0.8" />
        {:else}
          <rect x={x(0)} y="0" width={x(nTrain) - x(0)} height={bh} fill="var(--faint)" opacity="0.35" />
          {#each cvRandFold as fo, j}{#if fo === i}<rect x={x(j)} y="0" width={Math.max(0.8, x(1) - x(0))} height={bh} fill="var(--tim)" opacity="0.8" />{/if}{/each}
        {/if}
      </g>
    {/each}
  </svg>
  <div>
    <div class="table-scroll"><table class="data">
      <thead><tr><th>Lần gập</th>{#if mode === 'time'}<th>Kiểm định từ → đến</th><th>Học trên</th><th>MAE mô hình</th><th>MAE "ngày mai = hôm nay"</th>{:else}<th>MAE mô hình</th>{/if}</tr></thead>
      <tbody>
        {#if mode === 'time'}
          {#each cvTime as c, i}<tr class:on={i === k} onclick={() => (k = i)} style="cursor:pointer"><td>{i + 1}</td><td class="t">{fmtDate(c.from)} → {fmtDate(c.to)}</td><td>{folds[i].train.length} ngày</td><td>{fmt(c.mae, 2)}</td><td>{fmt(c.persist, 2)}</td></tr>{/each}
          <tr><td class="t"><b>Trung bình</b></td><td></td><td></td><td><b>{fmt(meanT, 2)}</b></td><td></td></tr>
        {:else}
          {#each cvRand as v, i}<tr><td>{i + 1}</td><td>{fmt(v, 2)}</td></tr>{/each}
          <tr><td class="t"><b>Trung bình</b></td><td><b>{fmt(meanR, 2)}</b></td></tr>
        {/if}
      </tbody>
    </table></div>
    <div>
      <p>Theo thời gian: trung bình {fmt(meanT, 2)}, lần tốt nhất và lần tệ nhất chênh nhau {fmt(spread(cvTime.map((c) => c.mae)), 1)} µg/m³. Xáo trộn: trung bình {fmt(meanR, 2)}, chênh nhau {fmt(spread(cvRand), 1)}.</p>
      <p class="cap">Xáo trộn cho con số đẹp và đều hơn, vì mỗi phần kiểm định chứa đủ mọi mùa, và mô hình đã được học những ngày nằm ngay sát hai bên ngày cần dự báo. Theo thời gian thì sai số dao động mạnh: phần có mùa đông khó hơn hẳn phần chỉ có mùa hè. Đó mới là thứ ta sẽ gặp khi dùng thật.</p>
    </div>
  </div>
</div>

<style>
  .dim { opacity: 0.35; }
  .tr { color: var(--pencil); font-weight: 600; }
  .te { color: var(--tim); font-weight: 600; }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
