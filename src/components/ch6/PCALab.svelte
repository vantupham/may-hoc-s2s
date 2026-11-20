<script lang="ts">
  /** PCA trên 1.797 chữ số viết tay 8×8: từ 64 chiều xuống 2, và dựng lại ảnh từ k thành phần. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import DigitImg from '../DigitImg.svelte';
  import { pca, fmt } from '../../lib/ml-core';

  let { digits }: { digits: { y: number; px: number[] }[] } = $props();
  const X = $derived(digits.map((d) => d.px));
  const P = $derived(pca(X));
  const proj = $derived(X.map((x) => P.project(x, 2)));
  let hover = $state(0);
  let k = $state(5);
  const z = $derived(P.project(X[hover], 64));
  const recon = $derived(P.reconstruct(z.slice(0, k)));
  const cum = $derived(P.ratio.reduce((a: number[], r, i) => [...a, (a[i - 1] ?? 0) + r], []));
  const hue = (d: number) => `hsl(${(d * 36 + 10) % 360} 70% 45%)`;

  const W = 560, H = 420, m = { t: 30, r: 14, b: 44, l: 52 };
  const ext = $derived([Math.min(...proj.map((p) => p[0])), Math.max(...proj.map((p) => p[0])), Math.min(...proj.map((p) => p[1])), Math.max(...proj.map((p) => p[1]))]);
  const sx = $derived(scaleLinear().domain([ext[0] - 1, ext[1] + 1]).range([m.l, W - m.r]));
  const sy = $derived(scaleLinear().domain([ext[2] - 1, ext[3] + 1]).range([H - m.b, m.t]));
  const W2 = 420, H2 = 200, n2 = { t: 30, r: 14, b: 38, l: 48 };
  const cx = scaleLinear().domain([1, 64]).range([n2.l, W2 - n2.r]);
  const cy = scaleLinear().domain([0, 1]).range([H2 - n2.b, n2.t]);
</script>

<div class="lab">
  <p class="lab-title">Nén 64 điểm ảnh xuống vài con số</p>
  <p class="lab-hint">Mỗi ảnh là 64 con số (độ đậm 0–16 của 8×8 ô). PCA tìm những hướng mà dữ liệu biến thiên nhiều nhất. Chiếu lên hai hướng đầu, mỗi ảnh thành một chấm. PCA không hề biết nhãn chữ số; màu chỉ để bạn kiểm tra. Di chuột lên một chấm để chọn ảnh đó.</p>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Chữ số chiếu lên hai thành phần chính đầu tiên">
      <Axis scale={sx} orient="bottom" size={0} offset={H - m.b} label={`Thành phần chính 1 (${fmt(P.ratio[0] * 100, 1)}% phương sai)`} />
      <Axis scale={sy} orient="left" size={0} offset={m.l} label={`Thành phần chính 2 (${fmt(P.ratio[1] * 100, 1)}%)`} />
      {#each proj as p, i}
        <circle cx={sx(p[0])} cy={sy(p[1])} r={i === hover ? 6 : 2.4} fill={hue(digits[i].y)} fill-opacity={i === hover ? 1 : 0.55} stroke={i === hover ? 'var(--ink)' : 'none'} stroke-width="2" role="presentation" onmouseenter={() => (hover = i)} />
      {/each}
      {#each Array.from({ length: 10 }, (_, d) => d) as d}
        {@const pts = proj.filter((_, i) => digits[i].y === d)}
        <text x={sx(pts.reduce((a, p) => a + p[0], 0) / pts.length)} y={sy(pts.reduce((a, p) => a + p[1], 0) / pts.length)} class="dl" fill={hue(d)}>{d}</text>
      {/each}
    </svg>
    <div>
      <div class="pair">
        <figure><DigitImg px={X[hover]} size={96} label="Ảnh gốc" /><figcaption>Ảnh gốc (chữ số {digits[hover].y})</figcaption></figure>
        <figure><DigitImg px={recon} size={96} label="Ảnh dựng lại" /><figcaption>Dựng lại từ {k} con số</figcaption></figure>
      </div>
      <label class="k">Số thành phần k = <span class="num">{k}</span><input type="range" min="0" max="64" bind:value={k} aria-label="Số thành phần" /></label>
      <p class="cap">{k} thành phần giữ <b>{fmt((cum[k - 1] ?? 0) * 100, 1)}%</b> phương sai. Ảnh dựng lại = ảnh trung bình + z₁·v₁ + … + z<sub>k</sub>·v<sub>k</sub>, với z<sub>j</sub> là toạ độ của ảnh theo hướng v<sub>j</sub>.</p>
      <svg class="chart" viewBox={`0 0 ${W2} ${H2}`} role="img" aria-label="Phương sai tích luỹ theo số thành phần">
        <Axis scale={cx} orient="bottom" size={H2 - n2.t - n2.b} offset={H2 - n2.b} ticks={6} label="k" />
        <Axis scale={cy} orient="left" size={W2 - n2.l - n2.r} offset={n2.l} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="Phương sai giữ lại" />
        <path d={cum.map((v, i) => `${i ? 'L' : 'M'}${cx(i + 1)},${cy(v)}`).join('')} fill="none" stroke="var(--tim)" stroke-width="2" />
        {#if k > 0}<circle cx={cx(k)} cy={cy(cum[k - 1])} r="5" fill="var(--tim)" />{/if}
      </svg>
    </div>
  </div>
  <p class="h">Ảnh trung bình và 7 hướng đầu tiên (đỏ: dương, xanh: âm)</p>
  <div class="eig">
    <figure><DigitImg px={P.mu} size={64} label="Ảnh trung bình" /><figcaption>trung bình</figcaption></figure>
    {#each P.vectors.slice(0, 7) as v, i}
      <figure><DigitImg px={v} size={64} diverging label={`Thành phần ${i + 1}`} /><figcaption>v{i + 1}: {fmt(P.ratio[i] * 100, 1)}%</figcaption></figure>
    {/each}
  </div>
</div>

<style>
  .dl { font: 700 18px var(--serif); paint-order: stroke; stroke: var(--sheet); stroke-width: 4px; }
  .pair { display: flex; gap: 1rem; }
  figure { margin: 0; }
  figcaption { font-size: 0.78rem; color: var(--pencil); margin-top: 0.2rem; }
  .k { display: flex; gap: 0.5rem; align-items: center; margin: 0.8rem 0 0.3rem; font-size: 0.9rem; }
  .cap { font-size: 0.88rem; color: var(--pencil); }
  .h { font-weight: 700; margin: 1rem 0 0.4rem; }
  .eig { display: flex; flex-wrap: wrap; gap: 0.8rem; }
</style>
