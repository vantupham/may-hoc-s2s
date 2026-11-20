<script lang="ts">
  /**
   * Trực giác: người học tự kéo hệ số w để đường thẳng ŷ = w·x đi qua 5 căn nhà.
   * Mỗi sai số được vẽ thành một hình vuông — diện tích hình vuông chính là e².
   * Bên phải là đồ thị mất mát L(w): kéo w thì điểm trên đường cong di chuyển theo.
   */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { mse, fmt } from '../../lib/ml-core';

  interface House { income: number; value: number }
  let { houses }: { houses: House[] } = $props();

  const xs = $derived(houses.map((h) => h.income));
  const ys = $derived(houses.map((h) => h.value));
  let w = $state(0.1);
  const errs = $derived(xs.map((x, i) => w * x - ys[i]));
  const loss = $derived(mse(xs, ys, w, 0));

  const W = 420, H = 320, m = { t: 30, r: 14, b: 44, l: 44 };
  const sx = scaleLinear().domain([0, 6.5]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0, 3]).range([H - m.b, m.t]);
  const px = (v: number) => sy(0) - sy(v); // độ dài pixel theo trục y

  const W2 = 320;
  const lw = scaleLinear().domain([0, 1]).range([m.l, W2 - m.r]);
  const curve = $derived(Array.from({ length: 101 }, (_, k) => k / 100).map((v) => [v, mse(xs, ys, v, 0)] as const));
  const maxL = $derived(Math.max(...curve.map((c) => c[1])));
  const ll = $derived(scaleLinear().domain([0, maxL * 1.05]).range([H - m.b, m.t]));
  const path = $derived(curve.map(([a, l], k) => `${k ? 'L' : 'M'}${lw(a)},${ll(l)}`).join(''));
  const best = $derived(curve.reduce((a, c) => (c[1] < a[1] ? c : a)));
</script>

<div class="lab">
  <p class="lab-title">Thử tự tìm đường thẳng tốt nhất</p>
  <p class="lab-hint">Kéo thanh trượt để đổi <span class="v-w">w</span>. Mỗi hình vuông đỏ có cạnh bằng sai số <span class="v-e">e</span>, nên diện tích của nó là <span class="v-e">e²</span>. Mục tiêu: làm tổng diện tích nhỏ nhất.</p>
  <div class="ctrl">
    <label><span class="v-w"><b>w</b></span> = <span class="num v-w">{fmt(w, 3)}</span>
      <input type="range" min="0" max="1" step="0.005" bind:value={w} aria-label="Hệ số w" />
    </label>
    <span>Mất mát <span class="v-L"><b>L</b></span> = <b class="num v-L">{fmt(loss, 4)}</b></span>
    {#if Math.abs(w - best[0]) < 0.011}<span class="good">Rất gần mức thấp nhất!</span>{/if}
  </div>
  <div class="two">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="5 căn nhà và đường dự đoán">
      <defs><clipPath id="sg-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập x (×10.000 USD)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Giá nhà y (×100.000 USD)" />
      <g clip-path="url(#sg-clip)">
        {#each xs as x, i}
          {@const e = errs[i]}
          {@const top = Math.max(w * x, ys[i])}
          <rect x={sx(x)} y={sy(top)} width={px(Math.abs(e))} height={px(Math.abs(e))} fill="var(--c-e)" fill-opacity="0.13" stroke="var(--c-e)" stroke-opacity="0.5" />
          <line x1={sx(x)} x2={sx(x)} y1={sy(ys[i])} y2={sy(w * x)} stroke="var(--c-e)" stroke-width="2" />
        {/each}
        <line x1={sx(0)} y1={sy(0)} x2={sx(6.5)} y2={sy(w * 6.5)} stroke="var(--c-w)" stroke-width="2.5" />
      </g>
      {#each xs as x, i}
        <circle cx={sx(x)} cy={sy(ys[i])} r="5.5" fill="var(--c-y)" stroke="var(--sheet)" stroke-width="1.5" />
      {/each}
    </svg>
    <svg class="chart" viewBox={`0 0 ${W2} ${H}`} role="img" aria-label="Đồ thị mất mát theo w">
      <Axis scale={lw} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={5} label="w" />
      <Axis scale={ll} orient="left" size={W2 - m.l - m.r} offset={m.l} ticks={5} label="L(w)" />
      <path d={path} fill="none" stroke="var(--c-L)" stroke-width="2.5" />
      <line x1={lw(w)} x2={lw(w)} y1={ll(loss)} y2={H - m.b} stroke="var(--c-w)" stroke-dasharray="3 3" />
      <circle cx={lw(w)} cy={ll(loss)} r="7" fill="var(--c-w)" stroke="var(--sheet)" stroke-width="2" />
    </svg>
  </div>
  <div class="sum">
    <span class="v-L">L</span> = (
    {#each errs as e, i}<span class="num v-e">{e < 0 ? `(${fmt(e, 2)})` : fmt(e, 2)}²</span>{i < errs.length - 1 ? ' + ' : ''}{/each}
    ) ÷ 5 = <b class="num v-L">{fmt(loss, 4)}</b>
  </div>
</div>

<style>
  .two { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 1rem; }
  @media (max-width: 700px) { .two { grid-template-columns: minmax(0, 1fr); } }
  .sum { font-size: 0.9rem; color: var(--pencil); margin-top: 0.5rem; line-height: 1.9; }
  .good { color: var(--ok); font-weight: 600; font-size: 0.88rem; }
</style>
