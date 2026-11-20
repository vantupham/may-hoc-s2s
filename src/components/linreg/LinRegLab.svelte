<script lang="ts">
  /** Tính tay hồi quy tuyến tính hai tham số (w, b) trên 5 khu vực, đọc từ trace của ml-core. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import StepDebugger from '../StepDebugger.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { linearRegressionGD, fmt, calcOf } from '../../lib/ml-core';

  interface House { income: number; value: number }
  let { houses }: { houses: House[] } = $props();
  const xs = $derived(houses.map((h) => h.income));
  const ys = $derived(houses.map((h) => h.value));

  const rates = [0.005, 0.02, 0.04, 0.06, 0.065];
  let lr = $state(0.02);
  let current = $state(0);
  let selected = $state('dw');
  const trace = $derived(linearRegressionGD(xs, ys, { lr, epochs: 60 }));
  const step = $derived(trace.steps[Math.min(current, trace.steps.length - 1)]);
  const st = $derived(step.state);
  const calc = $derived(calcOf(step, selected) ?? calcOf(step, 'dw')!);
  $effect(() => { lr; current = 0; });

  const W = 460, H = 300, m = { t: 30, r: 14, b: 44, l: 44 };
  const sx = scaleLinear().domain([0, 6.5]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([-0.5, 3]).range([H - m.b, m.t]);

  const LH = 130, lm = { t: 22, r: 14, b: 30, l: 44 };
  const losses = $derived(trace.steps.map((s) => s.state.loss));
  const lx = $derived(scaleLinear().domain([0, trace.steps.length - 1]).range([lm.l, W - lm.r]));
  const ly = $derived(scaleLinear().domain([0, Math.min(Math.max(...losses), losses[0] * 3)]).range([LH - lm.b, lm.t]));
  const lossPath = $derived(losses.map((l, k) => `${k ? 'L' : 'M'}${lx(k)},${ly(Math.min(l, ly.domain()[1]))}`).join(''));
  const pick = (k: string) => () => (selected = k);
</script>

<div class="lab">
  <p class="lab-title">Hồi quy tuyến tính từng bước — 5 khu vực, 2 tham số</p>
  <p class="lab-hint">Mỗi vòng lặp giờ tính <b>hai</b> đạo hàm, một cho <span class="v-w">w</span>, một cho <span class="v-b">b</span>, rồi cập nhật cả hai cùng lúc. Đường mờ là vị trí ở các vòng trước.</p>
  <div class="ctrl">
    <label>Tốc độ học <span class="v-eta"><b>η</b></span>
      <select bind:value={lr} aria-label="Tốc độ học">{#each rates as r}<option value={r}>{fmt(r, 3)}</option>{/each}</select>
    </label>
    <span>Sau 60 vòng: <span class="v-w">w</span> = <span class="num">{fmt(trace.steps.at(-1)!.state.wNext, 3)}</span>, <span class="v-b">b</span> = <span class="num">{fmt(trace.steps.at(-1)!.state.bNext, 3)}</span></span>
  </div>
  <div class="lab-grid">
    <div>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đường hồi quy qua các vòng lặp">
        <defs><clipPath id="lr-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
        <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập x" />
        <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Giá nhà y" />
        <g clip-path="url(#lr-clip)">
          {#each trace.steps.slice(Math.max(0, current - 8), current) as s, k}
            <line x1={sx(0)} y1={sy(s.state.b)} x2={sx(6.5)} y2={sy(s.state.w * 6.5 + s.state.b)} stroke="var(--c-w)" stroke-opacity={0.08 + 0.04 * k} />
          {/each}
          {#each xs as x, i}
            <line x1={sx(x)} x2={sx(x)} y1={sy(ys[i])} y2={sy(st.preds[i])} stroke="var(--c-e)" stroke-width="2" />
            <circle cx={sx(x)} cy={sy(st.preds[i])} r="4" fill="var(--c-yh)" />
          {/each}
          <line x1={sx(0)} y1={sy(st.b)} x2={sx(6.5)} y2={sy(st.w * 6.5 + st.b)} stroke="var(--c-w)" stroke-width="2.5" />
        </g>
        {#each xs as x, i}
          <circle cx={sx(x)} cy={sy(ys[i])} r="5.5" fill="var(--c-y)" stroke="var(--sheet)" stroke-width="1.5" />
          <text x={sx(x) + 8} y={sy(ys[i]) - 6} font-size="11" fill="var(--faint)">{i + 1}</text>
        {/each}
      </svg>
      <svg class="chart" viewBox={`0 0 ${W} ${LH}`} role="img" aria-label="Mất mát theo vòng lặp">
        <Axis scale={lx} orient="bottom" size={LH - lm.t - lm.b} offset={LH - lm.b} ticks={6} />
        <Axis scale={ly} orient="left" size={W - lm.l - lm.r} offset={lm.l} ticks={3} label="L" />
        <path d={lossPath} fill="none" stroke="var(--c-L)" stroke-width="2" />
        <circle cx={lx(current)} cy={ly(Math.min(st.loss, ly.domain()[1]))} r="5" fill="var(--c-L)" />
      </svg>
    </div>
    <div>
      <div class="table-scroll">
        <table class="data">
          <thead><tr><th>Căn</th><th><span class="v-x">x</span></th><th><span class="v-y">y</span></th><th><span class="v-yh">ŷ</span></th><th><span class="v-e">e</span></th></tr></thead>
          <tbody>
            {#each xs as x, i}
              <tr>
                <td>{i + 1}</td><td class="v-x">{fmt(x, 2)}</td><td class="v-y">{fmt(ys[i], 3)}</td>
                <td><button class="val v-yh" class:sel={selected === `pred${i}`} onclick={pick(`pred${i}`)}>{fmt(st.preds[i], 3)}</button></td>
                <td><button class="val v-e" class:sel={selected === `err${i}`} onclick={pick(`err${i}`)}>{fmt(st.errors[i], 3)}</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="chips">
        <button class="chip" class:sel={selected === 'loss'} onclick={pick('loss')}><span class="v-L">L</span> {fmt(st.loss, 4)}</button>
        <button class="chip" class:sel={selected === 'dw'} onclick={pick('dw')}><span class="v-g">∂L/∂w</span> {fmt(st.dw, 4)}</button>
        <button class="chip" class:sel={selected === 'db'} onclick={pick('db')}><span class="v-g">∂L/∂b</span> {fmt(st.db, 4)}</button>
        <button class="chip" class:sel={selected === 'wNext'} onclick={pick('wNext')}><span class="v-w">w mới</span> {fmt(st.wNext, 4)}</button>
        <button class="chip" class:sel={selected === 'bNext'} onclick={pick('bNext')}><span class="v-b">b mới</span> {fmt(st.bNext, 4)}</button>
      </div>
      <CalcCard {calc} />
    </div>
  </div>
  <StepDebugger count={trace.steps.length} bind:current interval={450} />
</div>

<style>
</style>
