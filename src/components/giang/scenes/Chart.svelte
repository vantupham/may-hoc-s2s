<script lang="ts">
  /**
   * Đồ thị đường hoặc cột dùng chung (mất mát theo vòng, ROC, đường cong học, chuỗi thời gian, so sánh mô hình).
   * Trạng thái s:
   *   n    số đường/cột đã hiện (nội suy được, hiện dần)
   *   t    phần trục x đã vẽ của các đường (0–1, mặc định 1) — để "vẽ dần" theo lời giảng
   *   hl   chỉ số đường/cột đang nói
   *   vx   vạch dọc tại x (null: không có); hy: vạch ngang tại y
   */
  import { scaleLinear, scaleBand } from 'd3';
  import Axis from '../../Axis.svelte';
  import { num, shown } from './reveal';
  import './chart.css';

  interface Series { name: string; pts: number[][]; color?: number; dash?: boolean; dots?: boolean; line?: boolean; r?: number; faint?: boolean }
  interface Bar { label: string; value: number; color?: number; text?: string }
  let { title = '', series = [], bars = [], xlab = '', ylab = '', xdom = [0, 1], ydom = [0, 1], xfmt, yfmt, legend = true, s = {} }: {
    title?: string; series?: Series[]; bars?: Bar[]; xlab?: string; ylab?: string; xdom?: number[]; ydom?: number[];
    xfmt?: string; yfmt?: string; legend?: boolean; s?: Record<string, unknown>;
  } = $props();

  const COLORS = ['var(--k0)', 'var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--faint)', 'var(--c-w)', 'var(--c-L)'];
  const fmtOf = (k?: string) => (v: number) => k === 'year' ? (Number.isInteger(v) ? String(v) : '') : k === 'pct' ? `${Math.round(v * 100)}%` : k === 'int' ? Math.round(v).toLocaleString('vi-VN') : String(+v.toFixed(3)).replace('.', ',').replace('-', '−');
  const isBar = $derived(bars.length > 0);
  const W = 900, H = title ? 372 : 404, m = { t: 16, r: 24, b: 54, l: 70 };
  const sx = $derived(scaleLinear().domain(xdom).range([m.l, W - m.r]));
  const sb = $derived(scaleBand().domain(bars.map((b) => b.label)).range([m.l, W - m.r]).padding(0.3));
  const sy = $derived(scaleLinear().domain(ydom).range([H - m.b, m.t]));
  const t = $derived(num(s.t, 1));
  const hl = $derived(Math.round(num(s.hl, -1)));
  const cut = (pts: number[][]) => {
    const xe = xdom[0] + (xdom[1] - xdom[0]) * t;
    return pts.filter((p) => p[0] <= xe + 1e-9);
  };
  const path = (pts: number[][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0])},${sy(Math.max(ydom[0], Math.min(ydom[1], p[1])))}`).join('');
  const vx = $derived(typeof s.vx === 'number' ? s.vx : null);
  const hy = $derived(typeof s.hy === 'number' ? s.hy : null);
</script>

<div class="sc">
  {#if title}<h3>{title}</h3>{/if}
  <svg class="gchart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={title || ylab}>
    <defs><clipPath id="ch-clip"><rect x={m.l} y={m.t - 4} width={W - m.l - m.r} height={H - m.t - m.b + 8} /></clipPath></defs>
    {#if isBar}
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label={ylab} format={fmtOf(yfmt)} />
      <line x1={m.l} x2={W - m.r} y1={sy(Math.max(0, ydom[0]))} y2={sy(Math.max(0, ydom[0]))} stroke="var(--ink)" opacity="0.7" />
      {#each bars as b, i}
        {@const o = shown(s.n ?? bars.length, i)}
        {@const y0 = sy(Math.max(0, ydom[0]))}
        <g opacity={o * (hl >= 0 && hl !== i ? 0.45 : 1)}>
          <rect x={sb(b.label)} width={sb.bandwidth()} y={Math.min(y0, sy(b.value))} height={Math.abs(sy(b.value) - y0) * o} fill={COLORS[b.color ?? 0]} />
          <text x={(sb(b.label) ?? 0) + sb.bandwidth() / 2} y={sy(b.value) - 8} text-anchor="middle" class="ink val">{b.text ?? fmtOf(yfmt)(b.value)}</text>
          <text x={(sb(b.label) ?? 0) + sb.bandwidth() / 2} y={H - m.b + 22} text-anchor="middle" class="ink lab">{b.label}</text>
        </g>
      {/each}
    {:else}
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label={xlab} format={fmtOf(xfmt)} />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label={ylab} format={fmtOf(yfmt)} />
      <g clip-path="url(#ch-clip)">
        {#if hy !== null}<line x1={m.l} x2={W - m.r} y1={sy(hy)} y2={sy(hy)} stroke="var(--le)" stroke-dasharray="6 5" />{/if}
        {#if vx !== null}<line x1={sx(vx)} x2={sx(vx)} y1={m.t} y2={H - m.b} stroke="var(--le)" stroke-dasharray="6 5" />{/if}
        {#each series as se, i}
          {@const o = shown(s.n ?? series.length, i)}
          {@const p = cut(se.pts)}
          <g opacity={o * (hl >= 0 && hl !== i ? 0.35 : 1)}>
            {#if se.line !== false}<path d={path(p)} fill="none" stroke={COLORS[se.color ?? i]} stroke-width={se.faint ? 1.2 : hl === i ? 4 : 2.8} stroke-opacity={se.faint ? 0.45 : 1} stroke-dasharray={se.dash ? '7 5' : undefined} />{/if}
            {#if se.dots}{#each p as q}{#if q[1] >= ydom[0] && q[1] <= ydom[1]}<circle cx={sx(q[0])} cy={sy(q[1])} r={se.r ?? 4.5} fill={COLORS[se.color ?? i]} fill-opacity={se.line === false ? 0.55 : 1} />{/if}{/each}{/if}
          </g>
        {/each}
      </g>
      {#if legend && series.filter((x) => !x.faint).length > 1}
        <g>
          {#each series.filter((x) => !x.faint) as se, i}
            <g transform={`translate(${m.l + 16},${m.t + 14 + i * 24})`} opacity={shown(s.n ?? series.length, i)}>
              <line x1="0" x2="26" y1="0" y2="0" stroke={COLORS[se.color ?? i]} stroke-width="3" stroke-dasharray={se.dash ? '7 5' : undefined} />
              <text x="34" y="5" class="ink lg">{se.name}</text>
            </g>
          {/each}
        </g>
      {/if}
    {/if}
  </svg>
</div>

<style>
  .sc { padding: 30px 20px 0 20px; }
  h3 { font-size: 30px; margin: 0 0 4px 130px; }
  .val { font-size: 18px; font-family: var(--mono); }
  .lab { font-size: 16px; }
  .lg { font-size: 16px; }
</style>
