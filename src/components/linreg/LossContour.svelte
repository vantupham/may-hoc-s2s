<script lang="ts">
  /**
   * Bản đồ đường đồng mức của mất mát theo (w, b) trên 400 khu vực, cùng quỹ đạo Gradient Descent.
   * So sánh dữ liệu gốc và dữ liệu đã chuẩn hoá: cùng thuật toán, tốc độ hội tụ khác hẳn.
   */
  import { scaleLinear, contours } from 'd3';
  import Axis from '../Axis.svelte';
  import StepDebugger from '../StepDebugger.svelte';
  import { linearRegressionGD, ols, mse, fmt } from '../../lib/ml-core';

  interface Row { income: number; value: number }
  let { sample }: { sample: Row[] } = $props();

  let scaled = $state(false);
  const rawX = $derived(sample.map((r) => r.income));
  const ys = $derived(sample.map((r) => r.value));
  const mu = $derived(rawX.reduce((a, v) => a + v, 0) / rawX.length);
  const sd = $derived(Math.sqrt(rawX.reduce((a, v) => a + (v - mu) ** 2, 0) / rawX.length));
  const xs = $derived(scaled ? rawX.map((v) => (v - mu) / sd) : rawX);

  const ratesRaw = [0.005, 0.02, 0.04, 0.048];
  const ratesStd = [0.05, 0.2, 0.5, 0.9];
  let lr = $state(0.02);
  $effect(() => { lr = scaled ? 0.2 : 0.02; });
  let current = $state(0);
  const EPOCHS = 300;
  const trace = $derived(linearRegressionGD(xs, ys, { lr, epochs: EPOCHS, detail: false }));
  const best = $derived(ols(xs, ys));
  $effect(() => { lr; scaled; current = 0; });

  const dom = $derived(scaled ? { w: [-0.4, 1.6], b: [-0.4, 2.8] } : { w: [-0.15, 0.9], b: [-0.6, 1.6] });
  const W = 560, H = 380, m = { t: 30, r: 14, b: 44, l: 52 };
  const sw = $derived(scaleLinear().domain(dom.w).range([m.l, W - m.r]));
  const sb = $derived(scaleLinear().domain(dom.b).range([H - m.b, m.t]));

  const NX = 90, NY = 70;
  const grid = $derived.by(() => {
    const vals = new Array(NX * NY);
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++) {
        const w = dom.w[0] + ((dom.w[1] - dom.w[0]) * i) / (NX - 1);
        const b = dom.b[0] + ((dom.b[1] - dom.b[0]) * j) / (NY - 1);
        vals[j * NX + i] = mse(xs, ys, w, b);
      }
    return vals;
  });
  const minL = $derived(mse(xs, ys, best.w, best.b));
  const levels = $derived(Array.from({ length: 14 }, (_, k) => minL * (1 + 0.04 * Math.pow(1.75, k))));
  const paths = $derived(
    contours().size([NX, NY]).thresholds(levels)(grid).map((c, k) => ({
      k,
      d: c.coordinates
        .flatMap((poly) => poly.map((ring) => ring.map(([gx, gy], q) => `${q ? 'L' : 'M'}${sw(dom.w[0] + ((dom.w[1] - dom.w[0]) * (gx - 0.5)) / (NX - 1))},${sb(dom.b[0] + ((dom.b[1] - dom.b[0]) * (gy - 0.5)) / (NY - 1))}`).join('') + 'Z'))
        .join(''),
    })),
  );

  const st = $derived(trace.steps[Math.min(current, trace.steps.length - 1)].state);
  const trail = $derived(trace.steps.slice(0, current + 1).map((s, k) => `${k ? 'L' : 'M'}${sw(s.state.w)},${sb(s.state.b)}`).join(''));
  const dist = $derived(Math.hypot(st.w - best.w, st.b - best.b));
  const reached = $derived(trace.steps.findIndex((s) => Math.hypot(s.state.w - best.w, s.state.b - best.b) < 0.01));
</script>

<div class="lab">
  <p class="lab-title">Bản đồ mất mát: nhìn Gradient Descent từ trên cao</p>
  <p class="lab-hint">Mỗi đường cong nối các cặp (<span class="v-w">w</span>, <span class="v-b">b</span>) có cùng mất mát, giống đường đồng mức trên bản đồ địa hình. Ngôi sao là đáy (nghiệm chính xác). Đường xanh là quỹ đạo Gradient Descent xuất phát từ (0, 0).</p>
  <div class="ctrl">
    <label><input type="checkbox" bind:checked={scaled} /> Chuẩn hoá thu nhập: x' = (x − {fmt(mu, 2)}) / {fmt(sd, 2)}</label>
    <label>Tốc độ học <span class="v-eta"><b>η</b></span>
      <select bind:value={lr} aria-label="Tốc độ học">{#each scaled ? ratesStd : ratesRaw as r}<option value={r}>{fmt(r, 3)}</option>{/each}</select>
    </label>
  </div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đường đồng mức của mất mát và quỹ đạo gradient descent">
      <defs><clipPath id="lc-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
      <Axis scale={sw} orient="bottom" size={0} offset={H - m.b} label={scaled ? "w (với x đã chuẩn hoá)" : 'w'} />
      <Axis scale={sb} orient="left" size={0} offset={m.l} label="b" />
      <g clip-path="url(#lc-clip)">
        {#each paths as p (p.k)}
          <path d={p.d} fill="var(--c-L)" fill-opacity={0.035} stroke="var(--c-L)" stroke-opacity={0.75 - p.k * 0.045} stroke-width="1" />
        {/each}
        <path d={trail} fill="none" stroke="var(--c-w)" stroke-width="2" />
        {#each trace.steps.slice(0, Math.min(current + 1, 40)) as s}
          <circle cx={sw(s.state.w)} cy={sb(s.state.b)} r="2.5" fill="var(--c-w)" />
        {/each}
        <path d={`M${sw(best.w)},${sb(best.b) - 9}l2.6,6.4 6.9,.5-5.3,4.5 1.7,6.7-5.9-3.6-5.9,3.6 1.7-6.7-5.3-4.5 6.9-.5z`} fill="#e3b341" stroke="var(--ink)" stroke-width="0.8" />
        <circle cx={sw(st.w)} cy={sb(st.b)} r="7" fill="var(--c-w)" stroke="var(--sheet)" stroke-width="2" />
      </g>
    </svg>
    <div class="side">
      <dl>
        <dt>Vòng lặp</dt><dd class="num">{current + 1} / {trace.steps.length}</dd>
        <dt><span class="v-w">w</span>, <span class="v-b">b</span> hiện tại</dt><dd class="num">{fmt(st.w, 4)}, {fmt(st.b, 4)}</dd>
        <dt>Đáy (nghiệm chính xác)</dt><dd class="num">{fmt(best.w, 4)}, {fmt(best.b, 4)}</dd>
        <dt>Mất mát <span class="v-L">L</span></dt><dd class="num">{fmt(st.loss, 4)} <span class="muted">(đáy: {fmt(minL, 4)})</span></dd>
        <dt>Khoảng cách tới đáy</dt><dd class="num">{fmt(dist, 4)}</dd>
        <dt>Số bước cập nhật để tới sát đáy (&lt; 0,01)</dt><dd class="num"><b>{reached >= 0 ? reached : `> ${EPOCHS}`}</b></dd>
      </dl>
      {#if !scaled}
        <p class="note warn">Các đường đồng mức là hình elip <b>rất dẹt</b>. Gradient chỉ gần như vuông góc với đường đồng mức, nên quỹ đạo đi zíc zắc rồi bò chậm dọc thung lũng. Thử bật "Chuẩn hoá".</p>
      {:else}
        <p class="note">Sau khi chuẩn hoá, đường đồng mức gần như là <b>hình tròn</b>: gradient chỉ thẳng vào đáy. Với η = 0,5, chỉ cần đúng <b>một bước</b>.</p>
      {/if}
    </div>
  </div>
  <StepDebugger count={trace.steps.length} bind:current interval={120} />
</div>

<style>
  dl { display: grid; grid-template-columns: auto auto; gap: 0.25rem 0.8rem; font-size: 0.86rem; margin: 0 0 0.8rem; }
  dt { color: var(--pencil); }
  dd { margin: 0; text-align: right; }
  .muted { color: var(--faint); }
  .side .note { font-size: 0.86rem; }
</style>
