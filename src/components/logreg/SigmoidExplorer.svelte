<script lang="ts">
  /** Hàm sigmoid: biến mọi số thực z thành xác suất trong khoảng (0, 1). */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { sigmoid, fmt, tex } from '../../lib/ml-core';
  import Tex from '../Tex.svelte';

  let z = $state(1.5);
  const p = $derived(sigmoid(z));
  const W = 560, H = 260, m = { t: 30, r: 14, b: 40, l: 44 };
  const sx = scaleLinear().domain([-8, 8]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0, 1]).range([H - m.b, m.t]);
  const path = Array.from({ length: 161 }, (_, k) => -8 + k * 0.1).map((v, k) => `${k ? 'L' : 'M'}${sx(v)},${sy(sigmoid(v))}`).join('');
</script>

<div class="lab">
  <p class="lab-title">Hàm sigmoid σ(z)</p>
  <p class="lab-hint">Kéo <span class="v-z">z</span>. Dù z lớn hay nhỏ đến đâu, <span class="v-p">p</span> luôn nằm giữa 0 và 1, và σ(0) = 0,5 đúng bằng ngưỡng phân vân.</p>
  <div class="ctrl">
    <label><span class="v-z"><b>z</b></span> = <span class="num v-z">{fmt(z, 2)}</span><input type="range" min="-8" max="8" step="0.05" bind:value={z} aria-label="Giá trị z" /></label>
  </div>
  <div class="grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đồ thị hàm sigmoid">
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={8} label="z" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} ticks={4} label="p = σ(z)" />
      <line x1={m.l} x2={W - m.r} y1={sy(0.5)} y2={sy(0.5)} stroke="var(--faint)" stroke-dasharray="4 4" />
      <path d={path} fill="none" stroke="var(--c-p)" stroke-width="3" />
      <line x1={sx(z)} x2={sx(z)} y1={sy(0)} y2={sy(p)} stroke="var(--c-z)" stroke-dasharray="3 3" />
      <line x1={m.l} x2={sx(z)} y1={sy(p)} y2={sy(p)} stroke="var(--c-p)" stroke-dasharray="3 3" />
      <circle cx={sx(z)} cy={sy(p)} r="7" fill="var(--c-p)" stroke="var(--sheet)" stroke-width="2" />
    </svg>
    <div class="calc">
      <Tex tex={String.raw`\cp{p} = \frac{1}{1 + e^{-\cz{z}}} = \frac{1}{1 + e^{${tex(-z, 2)}}} = \frac{1}{1 + ${tex(Math.exp(-z), 3)}} = \cp{${tex(p, 4)}}`} display />
      <p>Mô hình nói: xác suất ác tính là <b class="v-p">{fmt(p * 100, 1)}%</b>{p >= 0.5 ? ' → dự đoán ác tính.' : ' → dự đoán lành tính.'}</p>
    </div>
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 1rem; align-items: center; }
  @media (max-width: 760px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  .calc { font-size: 0.92rem; }
</style>
