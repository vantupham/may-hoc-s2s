<script lang="ts">
  /** Cross-validation 5 phần: lần lượt giấu từng phần, học trên 4 phần còn lại, chấm trên phần bị giấu. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { crossValPoly, polyEval, fmt } from '../../lib/ml-core';

  interface R { id: number; income: number; value: number }
  let { sample, testIds }: { sample: R[]; testIds: number[] } = $props();
  const testSet = $derived(new Set(testIds));
  const tr = $derived(sample.filter((r) => !testSet.has(r.id)));
  const x = $derived(tr.map((r) => r.income));
  const y = $derived(tr.map((r) => r.value));
  const mu = $derived(x.reduce((a, v) => a + v, 0) / x.length);
  const sd = $derived(Math.sqrt(x.reduce((a, v) => a + (v - mu) ** 2, 0) / x.length));
  let d = $state(3);
  let f = $state(0);
  const cv = $derived(crossValPoly(x, y, d, 5, mu, sd));
  const fold = $derived(new Set(cv[f].fold));
  const avg = $derived(cv.reduce((a, c) => a + c.mse, 0) / cv.length);
  const col = ['var(--k0)', 'var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)'];

  const W = 560, H = 360, m = { t: 30, r: 14, b: 44, l: 44 };
  const sx = scaleLinear().domain([0, 15.5]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([-0.5, 5.6]).range([H - m.b, m.t]);
  const curve = $derived(Array.from({ length: 160 }, (_, i) => 0.3 + i * 0.095).map((v, i) => `${i ? 'L' : 'M'}${sx(v)},${sy(Math.max(-0.5, Math.min(5.6, polyEval(cv[f].coef, v, mu, sd))))}`).join(''));
</script>

<div class="lab">
  <p class="lab-title">Cross-validation 5 phần trên 320 khu vực huấn luyện</p>
  <p class="lab-hint">Mô hình: đa thức bậc d của thu nhập. Ta chia 320 khu vực thành 5 phần, mỗi phần 64 khu vực. Lần lượt giấu một phần, học trên 4 phần kia, rồi đo MSE trên phần bị giấu. Tập test 80 khu vực vẫn không được động tới.</p>
  <div class="ctrl">
    <label>Bậc đa thức d = <span class="num">{d}</span><input type="range" min="1" max="10" bind:value={d} aria-label="Bậc đa thức" /></label>
    <span>Phần đang giấu:</span>
    {#each cv as _, k}<button class="chip" class:sel={k === f} type="button" onclick={() => (f = k)} style={`color:${col[k]}`}>phần {k + 1}</button>{/each}
  </div>
  <div class="strip" aria-hidden="true">
    {#each cv as c, k}<span style={`flex:${c.fold.length};background:${col[k]};opacity:${k === f ? 1 : 0.25}`}></span>{/each}
  </div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đường đa thức học trên 4 phần, chấm điểm trên phần bị giấu">
      <defs><clipPath id="cv-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập (×10.000 USD)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Giá nhà (×100.000 USD)" />
      <g clip-path="url(#cv-clip)">
        {#each x as v, i}
          <circle cx={sx(v)} cy={sy(y[i])} r={fold.has(i) ? 4 : 2.5} fill={fold.has(i) ? col[f] : 'var(--faint)'} fill-opacity={fold.has(i) ? 0.9 : 0.35} />
        {/each}
        <path d={curve} fill="none" stroke="var(--ink)" stroke-width="2.2" />
      </g>
    </svg>
    <div>
      <table class="data">
        <thead><tr><th>Phần giấu</th><th>Thu nhập lớn nhất trong phần</th><th>MSE kiểm định</th></tr></thead>
        <tbody>
          {#each cv as c, k}
            <tr class:on={k === f}><td style={`color:${col[k]}`}>{k + 1}</td><td>{fmt(Math.max(...c.fold.map((i) => x[i])), 2)}</td><td>{fmt(c.mse, c.mse > 100 ? 0 : 4)}</td></tr>
          {/each}
          <tr class="sum"><td class="t"><b>Trung bình</b></td><td></td><td><b>{fmt(avg, avg > 100 ? 0 : 4)}</b></td></tr>
        </tbody>
      </table>
      <p class="cap">Tăng d lên 6 hoặc 9 rồi xem phần nào có MSE khổng lồ. Khu vực có thu nhập cao nhất nằm trong phần đó: khi nó bị giấu, đa thức bậc cao phải <b>ngoại suy</b> ra ngoài vùng đã thấy, và đuôi đa thức vọt lên hoặc cắm xuống.</p>
    </div>
  </div>
</div>

<style>
  .strip { display: flex; height: 10px; gap: 2px; margin: 0.3rem 0 1rem; }
  .strip span { display: block; }
  .sum td { border-top: 1.5px solid var(--ink); }
  .cap { font-size: 0.88rem; color: var(--pencil); }
</style>
