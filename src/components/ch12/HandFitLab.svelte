<script lang="ts">
  /**
   * Tính tay: hồi quy PM2.5 ngày mai theo PM2.5 hôm nay trên 5 ngày liên tiếp của tập huấn luyện.
   * Đơn vị "chục µg/m³" để số dễ tính tay. Gradient Descent từng vòng (chương 0–1), rồi so với nghiệm đóng.
   */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import StepDebugger from '../StepDebugger.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { linearRegressionGD, ols, fmt, calcOf } from '../../lib/ml-core';
  import { buildRows, shortDate, type Air } from '../../lib/khongkhi';

  let { air, from }: { air: Air; from: string } = $props();
  const five = $derived(buildRows(air.days, air.meta).filter((r) => r.target >= from).slice(0, 5));
  const xs = $derived(five.map((r) => Math.round(r.x[0]) / 10));
  const ys = $derived(five.map((r) => Math.round(r.y) / 10));
  const rates = [0.005, 0.01, 0.03, 0.045];
  let lr = $state(0.01);
  let current = $state(0);
  let selected = $state('dw');
  const trace = $derived(linearRegressionGD(xs, ys, { lr, epochs: 80 }));
  const step = $derived(trace.steps[Math.min(current, trace.steps.length - 1)]);
  const st = $derived(step.state);
  const calc = $derived(calcOf(step, selected) ?? calcOf(step, 'dw')!);
  const exact = $derived(ols(xs, ys));
  $effect(() => { lr; current = 0; });

  const W = 420, H = 300, mg = { t: 30, r: 12, b: 42, l: 44 };
  const hi = $derived(Math.ceil(Math.max(...xs, ...ys) + 1));
  const sx = $derived(scaleLinear().domain([0, hi]).range([mg.l, W - mg.r]));
  const sy = $derived(scaleLinear().domain([0, hi]).range([H - mg.b, mg.t]));
  const pick = (k: string) => () => (selected = k);
</script>

<div class="lab">
  <p class="lab-title">Tính tay: PM2.5 ngày mai theo PM2.5 hôm nay, 5 ngày</p>
  <p class="lab-hint">Mô hình ŷ = <span class="v-w">w</span>·x + <span class="v-b">b</span>, với x là PM2.5 hôm nay và y là PM2.5 ngày mai, cùng tính bằng <b>chục µg/m³</b> (4,5 nghĩa là 45 µg/m³). Bấm tiến từng vòng và bấm vào các ô để xem phép tính. Đường mờ là nghiệm đóng.</p>
  <div class="ctrl">
    <label>Tốc độ học <span class="v-eta"><b>η</b></span>
      <select bind:value={lr} aria-label="Tốc độ học">{#each rates as r}<option value={r}>{String(r).replace('.', ',')}</option>{/each}</select>
    </label>
  </div>
  <StepDebugger count={trace.steps.length} bind:current label="Vòng" />
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="5 ngày và đường hồi quy">
      <Axis scale={sx} orient="bottom" size={H - mg.t - mg.b} offset={H - mg.b} label="PM2.5 hôm nay (chục µg/m³)" />
      <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label="PM2.5 ngày mai" />
      <line x1={sx(0)} y1={sy(exact.b)} x2={sx(hi)} y2={sy(exact.w * hi + exact.b)} stroke="var(--faint)" stroke-width="5" opacity="0.25" />
      <line x1={sx(0)} y1={sy(st.b)} x2={sx(hi)} y2={sy(st.w * hi + st.b)} stroke="var(--c-yh)" stroke-width="2" />
      {#each xs as x, i}
        <line x1={sx(x)} x2={sx(x)} y1={sy(ys[i])} y2={sy(st.w * x + st.b)} stroke="var(--c-e)" stroke-dasharray="2 2" />
        <circle cx={sx(x)} cy={sy(ys[i])} r="5" fill="var(--c-y)" />
        <text x={sx(x) + 7} y={sy(ys[i]) - 6} class="lbl">{shortDate(five[i].d)}</text>
      {/each}
    </svg>
    <div>
      <table class="data">
        <thead><tr><th>Ngày</th><th class="v-x">x</th><th class="v-y">y</th><th class="v-yh">ŷ</th><th class="v-e">e = ŷ − y</th></tr></thead>
        <tbody>
          {#each xs as x, i}
            <tr><td>{shortDate(five[i].d)}</td><td>{fmt(x, 1)}</td><td>{fmt(ys[i], 1)}</td><td>{fmt(st.w * x + st.b, 3)}</td><td>{fmt(st.w * x + st.b - ys[i], 3)}</td></tr>
          {/each}
        </tbody>
      </table>
      <div class="chips">
        <button class="chip" class:sel={selected === 'loss'} type="button" onclick={pick('loss')}>L = {fmt(st.loss, 4)}</button>
        <button class="chip" class:sel={selected === 'dw'} type="button" onclick={pick('dw')}>∂L/∂w = {fmt(st.dw, 4)}</button>
        <button class="chip" class:sel={selected === 'db'} type="button" onclick={pick('db')}>∂L/∂b = {fmt(st.db, 4)}</button>
        <button class="chip" class:sel={selected === 'wNext'} type="button" onclick={pick('wNext')}>w mới = {fmt(st.wNext, 4)}</button>
      </div>
      <CalcCard {calc} />
      <p class="cap">Nghiệm đóng: <span class="v-w">w</span> = {fmt(exact.w, 4)}, <span class="v-b">b</span> = {fmt(exact.b, 4)}. Vòng {current + 1}: w = {fmt(st.w, 4)}, b = {fmt(st.b, 4)}.</p>
    </div>
  </div>
</div>

<style>
  .lbl { font-size: 10.5px; fill: var(--pencil); font-family: var(--mono); }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
