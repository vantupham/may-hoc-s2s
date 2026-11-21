<script lang="ts">
  /**
   * Điểm 2D có lớp, dùng cho phân loại và phân cụm. Hoạt hình bằng các khung hình tính sẵn (frames),
   * mỗi khung có thể đổi lớp của điểm, tâm cụm, đường quyết định, lề, vùng tô màu và dòng ghi chú.
   * Trạng thái s:
   *   f      khung hình đang xem (làm tròn)
   *   ln, mg, rg, ct   độ hiện của đường quyết định, lề, vùng tô, tâm cụm
   *   hl     chuỗi chỉ số điểm cần khoanh, "3,7"
   *   q      điểm truy vấn [x, y]; qr: bán kính vòng tròn quanh q (đơn vị dữ liệu); nb: chuỗi chỉ số láng giềng
   *   dim    độ mờ các điểm không được khoanh (0–1)
   */
  import { scaleLinear } from 'd3';
  import Axis from '../../Axis.svelte';
  import { num } from './reveal';
  import './chart.css';

  interface Frame { cls?: number[]; cents?: number[][]; line?: number[]; margin?: number; grid?: number[]; note?: string; read?: string }
  let { pts, cls = [], names = [], xlab = '', ylab = '', xdom, ydom, frames = [], gx = 60, gy = 40, dot = 5, size = 'full', s = {} }: {
    pts: number[][]; cls?: number[]; names?: string[]; xlab?: string; ylab?: string; xdom: number[]; ydom: number[];
    frames?: Frame[]; gx?: number; gy?: number; dot?: number; size?: 'full' | 'wide'; s?: Record<string, unknown>;
  } = $props();

  const COLORS = ['var(--k0)', 'var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--faint)'];
  const fi = $derived(Math.max(0, Math.min(frames.length - 1, Math.round(num(s.f)))));
  const fr = $derived<Frame>(frames[fi] ?? {});
  const c = $derived(fr.cls ?? cls);
  const hl = $derived(new Set(String(s.hl ?? '').split(',').filter(Boolean).map(Number)));
  const nb = $derived(String(s.nb ?? '').split(',').filter(Boolean).map(Number));
  const q = $derived(Array.isArray(s.q) ? (s.q as number[]) : null);

  const W = 900, H = 400, m = { t: 14, r: 20, b: 50, l: 60 };
  const sx = $derived(scaleLinear().domain(xdom).range([m.l, W - m.r]));
  const sy = $derived(scaleLinear().domain(ydom).range([H - m.b, m.t]));
  // Đường a·x + b·y + c = 0 cắt khung
  function seg(l: number[], off = 0) {
    const [a, b, cc] = l;
    const c2 = cc - off * Math.hypot(a, b);
    if (Math.abs(b) > 1e-9) { const y = (x: number) => -(a * x + c2) / b; return [xdom[0], y(xdom[0]), xdom[1], y(xdom[1])]; }
    const x = -c2 / a; return [x, ydom[0], x, ydom[1]];
  }
  const cell = $derived({ w: (W - m.l - m.r) / gx, h: (H - m.t - m.b) / gy });
  const gcolor = (v: number) => (v >= 0 && v <= 1 && !Number.isInteger(v) ? null : COLORS[v] ?? COLORS[5]);
</script>

<div class="sc">
  <div class="gread">{#if fr.read}<span>{@html fr.read}</span>{/if}</div>
  <svg class="gchart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`${xlab} và ${ylab}`}>
    <defs><clipPath id="pts-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
    <g clip-path="url(#pts-clip)">
      {#if fr.grid && num(s.rg) > 0}
        <g opacity={0.22 * num(s.rg)}>
          {#each fr.grid as v, k}
            {@const i = k % gx}{@const j = Math.floor(k / gx)}
            <rect x={m.l + i * cell.w} y={H - m.b - (j + 1) * cell.h} width={cell.w + 0.5} height={cell.h + 0.5}
              fill={gcolor(v) ?? (v >= 0.5 ? COLORS[1] : COLORS[0])} fill-opacity={gcolor(v) ? 1 : Math.abs(v - 0.5) * 2} />
          {/each}
        </g>
      {/if}
      {#if fr.line && num(s.mg) > 0 && fr.margin}
        {#each [-1, 1] as sg}{@const p = seg(fr.line, sg)}<line x1={sx(p[0])} y1={sy(p[1])} x2={sx(p[2])} y2={sy(p[3])} stroke="var(--ink)" stroke-dasharray="6 5" opacity={0.6 * num(s.mg)} />{/each}
      {/if}
      {#if fr.line && num(s.ln) > 0}
        {@const p = seg(fr.line)}<line x1={sx(p[0])} y1={sy(p[1])} x2={sx(p[2])} y2={sy(p[3])} stroke="var(--ink)" stroke-width="3" opacity={num(s.ln)} />
      {/if}
      {#if q && nb.length}
        {#each nb as i}<line x1={sx(q[0])} y1={sy(q[1])} x2={sx(pts[i][0])} y2={sy(pts[i][1])} stroke="var(--tim)" stroke-width="1.5" opacity="0.8" />{/each}
      {/if}
      {#each pts as p, i}
        {@const on = hl.has(i) || nb.includes(i)}
        <circle cx={sx(p[0])} cy={sy(p[1])} r={on ? dot + 2.5 : dot} fill={COLORS[c[i] ?? 5]} stroke={on ? 'var(--ink)' : 'var(--sheet)'} stroke-width={on ? 2.5 : 0.8}
          opacity={hl.size && !on ? 1 - 0.75 * num(s.dim) : 0.9} />
      {/each}
      {#if q}
        {#if num(s.qr) > 0}<ellipse cx={sx(q[0])} cy={sy(q[1])} rx={Math.abs(sx(num(s.qr)) - sx(0))} ry={Math.abs(sy(num(s.qr)) - sy(0))} fill="none" stroke="var(--tim)" stroke-dasharray="5 4" />{/if}
        <path d={`M${sx(q[0])},${sy(q[1]) - 11}L${sx(q[0]) + 10},${sy(q[1]) + 7}L${sx(q[0]) - 10},${sy(q[1]) + 7}Z`} fill="var(--tim)" stroke="var(--sheet)" stroke-width="1.5" />
      {/if}
      {#if fr.cents && num(s.ct, 1) > 0}
        {#each fr.cents as ct, k}
          <g opacity={num(s.ct, 1)} transform={`translate(${sx(ct[0])},${sy(ct[1])})`}>
            <path d="M-11,-11L11,11M-11,11L11,-11" stroke="var(--sheet)" stroke-width="8" />
            <path d="M-11,-11L11,11M-11,11L11,-11" stroke={COLORS[k]} stroke-width="4.5" />
          </g>
        {/each}
      {/if}
    </g>
    <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label={xlab} />
    <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label={ylab} />
    {#if names.length}
      <g class="leg">
        {#each names as nm, k}<g transform={`translate(${W - m.r - 10 - (names.length - k) * 150},${m.t + 12})`}><circle r="6" fill={COLORS[k]} /><text x="12" y="5" class="ink">{nm}</text></g>{/each}
      </g>
    {/if}
    {#if fr.note}<text x={m.l + 12} y={m.t + 20} class="ink note">{fr.note}</text>{/if}
  </svg>
</div>

<style>
  .sc { padding: 30px 20px 0 20px; }
  .note { font-size: 17px; }
  .leg text { font-size: 16px; }
</style>
