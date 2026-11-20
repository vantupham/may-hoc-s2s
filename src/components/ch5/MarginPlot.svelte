<script lang="ts">
  /** Mặt phẳng hai đặc trưng: ranh giới f(x) = 0, hai đường lề f(x) = ±1, vùng lề tô nhạt, vector hỗ trợ có viền. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';

  interface P { id: number; x1: number; x2: number; y: number }
  let {
    points, w, b, sv = new Set<number>(), labels = false, big = false, faded = [], region = true, unitMargin = true,
  }: { points: P[]; w: [number, number]; b: number; sv?: Set<number>; labels?: boolean; big?: boolean; faded?: P[]; region?: boolean; unitMargin?: boolean } = $props();

  const W = 520, H = 420, m = { t: 30, r: 14, b: 44, l: 48 };
  const dx = [-2.4, 4.2], dy = [-2.6, 4.8];
  const sx = scaleLinear().domain(dx).range([m.l, W - m.r]);
  const sy = scaleLinear().domain(dy).range([H - m.b, m.t]);
  // Đường w₁x₁ + w₂x₂ + b = c, cắt bởi khung
  function lineAt(c: number) {
    if (Math.abs(w[1]) > 1e-9) { const f = (x: number) => (c - b - w[0] * x) / w[1]; return [dx[0], f(dx[0]), dx[1], f(dx[1])]; }
    if (Math.abs(w[0]) > 1e-9) { const x = (c - b) / w[0]; return [x, dy[0], x, dy[1]]; }
    return null;
  }
  const L0 = $derived(lineAt(0));
  const Lp = $derived(unitMargin ? lineAt(1) : null);
  const Ln = $derived(unitMargin ? lineAt(-1) : null);
  // Đa giác vùng dương (f > 0) trong khung để tô nền
  const posPoly = $derived.by(() => {
    const corners = [[dx[0], dy[0]], [dx[1], dy[0]], [dx[1], dy[1]], [dx[0], dy[1]]];
    const f = (p: number[]) => w[0] * p[0] + w[1] * p[1] + b;
    const out: number[][] = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], c = corners[(i + 1) % 4];
      const fa = f(a), fc = f(c);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fc >= 0)) { const t = fa / (fa - fc); out.push([a[0] + t * (c[0] - a[0]), a[1] + t * (c[1] - a[1])]); }
    }
    return out.map(([u, v]) => `${sx(u)},${sy(v)}`).join(' ');
  });
  const bandPoly = $derived.by(() => {
    if (!Lp || !Ln) return '';
    return [[Lp[0], Lp[1]], [Lp[2], Lp[3]], [Ln[2], Ln[3]], [Ln[0], Ln[1]]].map(([u, v]) => `${sx(u)},${sy(v)}`).join(' ');
  });
</script>

<svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ranh giới và lề của SVM">
  <defs><clipPath id="mp-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
  <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} fill={region ? 'color-mix(in srgb, var(--c-neg) 7%, transparent)' : 'none'} />
  {#if region && posPoly}<polygon points={posPoly} fill="color-mix(in srgb, var(--c-pos) 8%, transparent)" />{/if}
  <Axis scale={sx} orient="bottom" size={0} offset={H - m.b} label="x₁: bán kính (đã chuẩn hoá)" />
  <Axis scale={sy} orient="left" size={0} offset={m.l} label="x₂: độ nhám (đã chuẩn hoá)" />
  <g clip-path="url(#mp-clip)">
    {#if bandPoly}<polygon points={bandPoly} fill="var(--hl)" fill-opacity="0.45" />{/if}
    {#each faded as p}<circle cx={sx(p.x1)} cy={sy(p.x2)} r="2.4" fill={p.y ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity="0.22" />{/each}
    {#if Lp}<line x1={sx(Lp[0])} y1={sy(Lp[1])} x2={sx(Lp[2])} y2={sy(Lp[3])} stroke="var(--c-pos)" stroke-dasharray="5 4" stroke-width="1.4" />{/if}
    {#if Ln}<line x1={sx(Ln[0])} y1={sy(Ln[1])} x2={sx(Ln[2])} y2={sy(Ln[3])} stroke="var(--c-neg)" stroke-dasharray="5 4" stroke-width="1.4" />{/if}
    {#if L0}<line x1={sx(L0[0])} y1={sy(L0[1])} x2={sx(L0[2])} y2={sy(L0[3])} stroke="var(--ink)" stroke-width="2.5" />{/if}
    {#each points as p, i}
      <circle cx={sx(p.x1)} cy={sy(p.x2)} r={big ? 8 : 3.5} fill={p.y ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity={big ? 0.95 : 0.7}
        stroke={sv.has(p.id) ? 'var(--ink)' : 'var(--sheet)'} stroke-width={sv.has(p.id) ? (big ? 2.5 : 1.4) : 0.5} />
      {#if labels}<text x={sx(p.x1) + 11} y={sy(p.x2) + 4} font-size="12" font-weight="600" fill="var(--ink)">{i + 1}</text>{/if}
    {/each}
  </g>
</svg>
