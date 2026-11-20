<script lang="ts">
  /** Trực giác: tự kéo w và b để đường thẳng khớp 400 khu vực, rồi so với đường tốt nhất. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { mse, ols, fmt } from '../../lib/ml-core';

  interface Row { income: number; value: number }
  let { sample }: { sample: Row[] } = $props();
  const xs = $derived(sample.map((r) => r.income));
  const ys = $derived(sample.map((r) => r.value));
  const best = $derived(ols(xs, ys));

  let w = $state(0.2);
  let b = $state(0.5);
  let showBest = $state(false);
  let showRes = $state(false);
  const loss = $derived(mse(xs, ys, w, b));
  const bestLoss = $derived(mse(xs, ys, best.w, best.b));

  const W = 860, H = 440, m = { t: 30, r: 14, b: 44, l: 44 };
  const sx = scaleLinear().domain([0, 15.5]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0, 5.3]).range([H - m.b, m.t]);
  const ratio = $derived(loss / bestLoss);
</script>

<div class="lab">
  <p class="lab-title">Kéo đường thẳng ŷ = w·x + b</p>
  <p class="lab-hint">Giờ có hai núm vặn: độ dốc <span class="v-w">w</span> và hệ số chặn <span class="v-b">b</span> (giá trị ŷ khi x = 0, tức là nâng hạ cả đường thẳng).</p>
  <div class="ctrl">
    <label><span class="v-w"><b>w</b></span> <span class="num v-w">{fmt(w, 3)}</span><input type="range" min="-0.2" max="1" step="0.005" bind:value={w} aria-label="Độ dốc w" /></label>
    <label><span class="v-b"><b>b</b></span> <span class="num v-b">{fmt(b, 3)}</span><input type="range" min="-1" max="2.5" step="0.01" bind:value={b} aria-label="Hệ số chặn b" /></label>
    <label><input type="checkbox" bind:checked={showRes} /> Hiện sai số</label>
    <label><input type="checkbox" bind:checked={showBest} /> Hiện đường tốt nhất</label>
  </div>
  <div class="meter">
    <span>MSE của bạn: <b class="num v-L">{fmt(loss, 4)}</b></span>
    {#if showBest}<span>Tốt nhất có thể: <b class="num v-L">{fmt(bestLoss, 4)}</b></span>{/if}
    <span class="bar" aria-hidden="true"><span style={`width:${Math.min(100, 100 / ratio)}%`}></span></span>
    <span class="pct">{ratio < 1.005 ? 'Tối ưu!' : `gấp ${fmt(ratio, 2)} lần mức tốt nhất`}</span>
  </div>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đường thẳng do bạn chọn trên 400 khu vực">
    <defs><clipPath id="lg-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
    <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập x (×10.000 USD)" />
    <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Giá nhà y (×100.000 USD)" />
    <g clip-path="url(#lg-clip)">
      {#if showRes}
        {#each xs as x, i}<line x1={sx(x)} x2={sx(x)} y1={sy(ys[i])} y2={sy(w * x + b)} stroke="var(--c-e)" stroke-opacity="0.35" />{/each}
      {/if}
      {#each xs as x, i}<circle cx={sx(x)} cy={sy(ys[i])} r="3" fill="var(--c-y)" fill-opacity="0.45" />{/each}
      {#if showBest}<line x1={sx(0)} y1={sy(best.b)} x2={sx(15.5)} y2={sy(best.w * 15.5 + best.b)} stroke="var(--faint)" stroke-width="2" stroke-dasharray="6 4" />{/if}
      <line x1={sx(0)} y1={sy(b)} x2={sx(15.5)} y2={sy(w * 15.5 + b)} stroke="var(--c-w)" stroke-width="3" />
      <circle cx={sx(0)} cy={sy(b)} r="5" fill="var(--c-b)" />
    </g>
  </svg>
</div>

<style>
  .meter { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.2rem; font-size: 0.9rem; margin-bottom: 0.5rem; }
  .bar { flex: 1; min-width: 8rem; height: 8px; background: var(--paper); border-radius: 4px; overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--c-L); transition: width 0.15s; }
  .pct { font-size: 0.82rem; color: var(--pencil); }
</style>
