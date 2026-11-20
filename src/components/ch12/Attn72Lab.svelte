<script lang="ts">
  /**
   * Attention một đầu trên 72 giờ (chương 11): truy vấn là giờ cuối (23 giờ hôm nay), khoá và giá trị là mọi giờ.
   * Mỗi giờ = 4 kênh + giờ trong ngày (sin, cos). Trình duyệt tính lại q, k, điểm, softmax và vector ngữ cảnh.
   */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { attnScoreCalc, fmt } from '../../lib/ml-core';
  import { attn72, fmtDate, type Nets } from '../../lib/khongkhi';

  let { nets }: { nets: Nets } = $props();
  let pick = $state('2026-01-08');
  let avg = $state(false);
  const win = $derived(nets.wins.find((w) => w.d === pick) ?? nets.wins[0]);
  const r = $derived(attn72(nets.attn, win));
  // Trung bình trọng số chú ý theo giờ trên mọi ngày kiểm tra
  const mean = $derived.by(() => {
    const m = new Array(nets.L).fill(0);
    for (const w of nets.wins) attn72(nets.attn, w).weights.forEach((v, t) => (m[t] += v / nets.wins.length));
    return m;
  });
  const shown = $derived(avg ? mean : r.weights);
  let t = $state(71);
  const calc = $derived(attnScoreCalc(r, t, `giờ ${t % 24}h ${t < 24 ? 'hai ngày trước' : t < 48 ? 'hôm qua' : 'hôm nay'}`));
  const top = $derived(shown.map((w, i) => ({ w, i })).sort((a, b) => b.w - a.w).slice(0, 5));
  const last24 = $derived(shown.slice(48).reduce((a, v) => a + v, 0));

  const W = 620, H = 210, mg = { t: 30, r: 10, b: 40, l: 50 };
  const sx = $derived(scaleLinear().domain([-0.5, nets.L - 0.5]).range([mg.l, W - mg.r]));
  const sy = $derived(scaleLinear().domain([0, Math.max(...shown) * 1.1]).range([H - mg.b, mg.t]));
  const pm = $derived(win.x.map((p) => p[0] * 100));
  const sp = $derived(scaleLinear().domain([0, Math.max(...pm, 1)]).range([H - mg.b, mg.t]));
  const hourName = (i: number) => `${i % 24}h ${i < 24 ? 'hai ngày trước' : i < 48 ? 'hôm qua' : 'hôm nay'}`;
</script>

<div class="lab">
  <p class="lab-title">Mô hình nhìn vào những giờ nào?</p>
  <p class="lab-hint">Cột tím là trọng số chú ý của từng giờ trong 72 giờ, tổng bằng 1. Đường xanh lá mờ là PM2.5 của chính những giờ đó. Bấm vào một cột để xem điểm của giờ đó được tính thế nào.</p>
  <div class="ctrl">
    <label>Hôm nay là <select bind:value={pick} aria-label="Ngày" disabled={avg}>{#each nets.wins as w}<option value={w.d}>{fmtDate(w.d)}</option>{/each}</select></label>
    <label><input type="checkbox" bind:checked={avg} /> trung bình trên {nets.wins.length} ngày kiểm tra</label>
    <span>24 giờ cuối chiếm <b class="num">{fmt(last24 * 100, 0)}%</b> sự chú ý</span>
  </div>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trọng số chú ý theo giờ">
    <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label="trọng số" ticks={4} />
    {#if !avg}<path d={pm.map((v, i) => `${i ? 'L' : 'M'}${sx(i)},${sp(v)}`).join('')} fill="none" stroke="var(--c-y)" stroke-width="1.5" opacity="0.5" />{/if}
    {#each shown as w, i}
      <rect x={sx(i) - 3.2} y={sy(w)} width="6.4" height={H - mg.b - sy(w)} fill={i === t ? 'var(--ink)' : 'var(--c-z)'} opacity={i === t ? 1 : 0.7}
        role="button" tabindex="-1" onclick={() => (t = i)} onkeydown={() => {}} style="cursor:pointer" />
    {/each}
    {#each [0, 24, 48] as h}<line x1={sx(h - 0.5)} x2={sx(h - 0.5)} y1={mg.t} y2={H - mg.b} stroke="var(--rule-2)" stroke-dasharray="2 3" />{/each}
    {#each [0, 12, 24, 36, 48, 60, 71] as h}<text x={sx(h)} y={H - mg.b + 14} text-anchor="middle" class="lbl">{h % 24}h</text>{/each}
    <text x={sx(12)} y={H - 6} text-anchor="middle" class="lbl">hai ngày trước</text>
    <text x={sx(36)} y={H - 6} text-anchor="middle" class="lbl">hôm qua</text>
    <text x={sx(60)} y={H - 6} text-anchor="middle" class="lbl">hôm nay</text>
  </svg>
  <div class="lab-grid">
    <div>
      <p class="h">5 giờ được chú ý nhiều nhất{avg ? ' (trung bình)' : ''}</p>
      <table class="data">
        <thead><tr><th>Giờ</th><th>Trọng số</th>{#if !avg}<th>PM2.5 lúc đó</th>{/if}</tr></thead>
        <tbody>{#each top as x}<tr class:on={x.i === t}><td class="t">{hourName(x.i)}</td><td>{fmt(x.w, 3)}</td>{#if !avg}<td>{fmt(pm[x.i], 0)}</td>{/if}</tr>{/each}</tbody>
      </table>
      {#if !avg}
        <p class="cap">Dự báo = vector ngữ cảnh · u ({fmt(r.fromCtx * 100, 1)}) + thời tiết ngày mai · v ({fmt(r.fromTom * 100, 1)}) + hệ số chặn ({fmt(nets.attn.c * 100, 1)}) = <b>{fmt(r.pred, 1)}</b> µg/m³. Thật: {fmt(win.y, 1)}.</p>
      {/if}
    </div>
    <div>
      {#if !avg}
        <CalcCard {calc} digits={3} />
        <p class="cap">Softmax biến 72 điểm thành 72 trọng số: w = e^s / Σ e^s. Giờ này có điểm {fmt(r.scores[t], 3)} và trọng số {fmt(r.weights[t], 4)}.</p>
      {:else}
        <p class="cap">Tính trung bình trên mọi ngày thì sự chú ý dồn vào đâu? Đây là cái mô hình <i>đã học được</i> từ dữ liệu, không phải điều ta dặn nó. Nhưng trọng số chú ý cao không chứng minh giờ đó là <i>nguyên nhân</i> của bụi ngày mai.</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .lbl { font-size: 10.5px; fill: var(--faint); font-family: var(--mono); }
  .h { font-weight: 600; font-size: 0.92rem; margin: 0.6rem 0 0.3rem; }
  .cap { font-size: 0.85rem; color: var(--pencil); }
</style>
