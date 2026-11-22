<script lang="ts">
  /**
   * Bản đồ xác suất của hồi quy logistic trên hai đặc trưng đã chuẩn hoá:
   * nền tô màu theo p = σ(w₁x₁ + w₂x₂ + b), đường ranh giới tại p = ngưỡng, các bệnh nhân là chấm.
   */
  import { onMount } from 'svelte';
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { sigmoid } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number }
  let {
    points, w, b, threshold = 0.5, labels = false, big = false, faded = [],
  }: { points: P[]; w: [number, number]; b: number; threshold?: number; labels?: boolean; big?: boolean; faded?: P[] } = $props();

  const W = 520, H = 420, m = { t: 30, r: 14, b: 44, l: 48 };
  const dx = [-2.4, 4.2], dy = [-2.6, 4.8];
  const sx = scaleLinear().domain(dx).range([m.l, W - m.r]);
  const sy = scaleLinear().domain(dy).range([H - m.b, m.t]);
  // Lưới nền 36×36 ô chỉ vẽ trên trình duyệt: dựng sẵn trong HTML thì nặng hơn 200 KB mà không thêm thông tin gì
  let mounted = $state(false);
  onMount(() => { mounted = true; });
  const N = 36;
  const cw = (W - m.l - m.r) / N, ch = (H - m.t - m.b) / N;
  const cells = $derived.by(() => {
    const out: { x: number; y: number; p: number }[] = [];
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const x1 = dx[0] + ((i + 0.5) / N) * (dx[1] - dx[0]);
        const x2 = dy[0] + ((j + 0.5) / N) * (dy[1] - dy[0]);
        out.push({ x: m.l + i * cw, y: H - m.b - (j + 1) * ch, p: sigmoid(w[0] * x1 + w[1] * x2 + b) });
      }
    return out;
  });
  // Ranh giới: w₁x₁ + w₂x₂ + b = logit(ngưỡng)
  const logit = $derived(Math.log(threshold / (1 - threshold)));
  const line = $derived.by(() => {
    if (Math.abs(w[1]) > 1e-9) {
      const f = (x: number) => (logit - b - w[0] * x) / w[1];
      return { x1: dx[0], y1: f(dx[0]), x2: dx[1], y2: f(dx[1]) };
    }
    if (Math.abs(w[0]) > 1e-9) { const x = (logit - b) / w[0]; return { x1: x, y1: dy[0], x2: x, y2: dy[1] }; }
    return null;
  });
</script>

<svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bản đồ xác suất ác tính và ranh giới quyết định">
  <defs><clipPath id="pm-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
  {#if mounted}{#each cells as c}
    <rect x={c.x} y={c.y} width={cw} height={ch} shape-rendering="crispEdges" fill={c.p >= threshold ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity={Math.min(0.32, Math.abs(c.p - threshold) * 0.6)} />
  {/each}{/if}
  <Axis scale={sx} orient="bottom" size={0} offset={H - m.b} label="x₁: bán kính (đã chuẩn hoá)" />
  <Axis scale={sy} orient="left" size={0} offset={m.l} label="x₂: độ nhám (đã chuẩn hoá)" />
  <g clip-path="url(#pm-clip)">
    {#each faded as p}
      <circle cx={sx(p.x1)} cy={sy(p.x2)} r="2.5" fill={p.y ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity="0.25" />
    {/each}
    {#if line}<line x1={sx(line.x1)} y1={sy(line.y1)} x2={sx(line.x2)} y2={sy(line.y2)} stroke="var(--ink)" stroke-width="2.5" />{/if}
    {#each points as p, i}
      {@const pr = sigmoid(w[0] * p.x1 + w[1] * p.x2 + b)}
      {@const wrong = (pr >= threshold ? 1 : 0) !== p.y}
      <circle cx={sx(p.x1)} cy={sy(p.x2)} r={big ? 8 : 3.5} fill={p.y ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity={big ? 0.95 : 0.7}
        stroke={wrong ? 'var(--ink)' : 'var(--sheet)'} stroke-width={wrong ? (big ? 2.5 : 1.5) : big ? 1.5 : 0.5} />
      {#if labels}<text x={sx(p.x1) + 11} y={sy(p.x2) + 4} font-size="12" font-weight="600" fill="var(--ink)">{i + 1}</text>{/if}
    {/each}
  </g>
</svg>
