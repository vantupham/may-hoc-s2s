<script lang="ts">
  /**
   * Sau triển khai: gradient boosting học trên dữ liệu trước 1/11/2025, không học lại,
   * chạy tiếp trên 4–11/2026. Sai số và độ lệch theo tháng, so với mốc "ngày mai = hôm nay" và số trạm góp vào chỉ số.
   */
  import { scaleLinear, scaleBand } from 'd3';
  import Axis from '../Axis.svelte';
  import { fmt } from '../../lib/ml-core';
  import type { Air } from '../../lib/khongkhi';

  interface Live { m: string; n: number; gb: number; persist: number; bias: number; mean: number }
  interface Drift { summerOnly: number; all: number; nSummer: number; maxSummerY: number; maxTestY: number }
  let { air, live, drift, nTrain }: { air: Air; live: Live[]; drift: Drift; nTrain: number } = $props();
  const nSt = $derived(live.map((l) => { const d = air.days.filter((x) => x.d.startsWith(l.m) && x.pm !== null); return d.reduce((a, x) => a + x.n, 0) / Math.max(1, d.length); }));
  const wins = $derived(live.filter((l) => l.gb < l.persist).length);
  const lose = $derived(live.filter((l) => l.gb >= l.persist));
  // Tháng đầu tiên mà từ đó trở đi độ lệch luôn dương
  const posFrom = $derived.by(() => { let k = live.length; while (k > 0 && live[k - 1].bias > 0) k--; return k < live.length - 2 ? live[k].m : null; });
  let show = $state<'mae' | 'bias'>('mae');
  const W = 560, H = 250, mg = { t: 30, r: 12, b: 36, l: 46 };
  const sx = $derived(scaleBand<string>().domain(live.map((l) => l.m)).range([mg.l, W - mg.r]).padding(0.25));
  const sy = $derived(show === 'mae' ? scaleLinear().domain([0, 12]).range([H - mg.b, mg.t]) : scaleLinear().domain([-6, 6]).range([H - mg.b, mg.t]));
  const bw = $derived(sx.bandwidth());
</script>

<div class="lab">
  <p class="lab-title">Mô hình sống trong một thế giới thay đổi</p>
  <p class="lab-hint">Hai thí nghiệm. Thứ nhất: học chỉ bằng dữ liệu các tháng 5–9 rồi dự báo mùa đông. Thứ hai: lấy gradient boosting đã chốt, <b>không học lại</b>, cho chạy tiếp trên dữ liệu 4–11/2026, phần dữ liệu đến sau tập kiểm tra.</p>
  <table class="data">
    <thead><tr><th>Học trên</th><th>Số ngày</th><th>PM2.5 cao nhất đã thấy</th><th>MAE mùa đông 2025–2026</th></tr></thead>
    <tbody>
      <tr><td class="t">Chỉ các tháng 5–9</td><td>{drift.nSummer}</td><td>{fmt(drift.maxSummerY, 0)}</td><td><b>{fmt(drift.summerOnly, 2)}</b></td></tr>
      <tr><td class="t">Mọi tháng</td><td>{nTrain}</td><td>—</td><td>{fmt(drift.all, 2)}</td></tr>
    </tbody>
  </table>
  <p class="cap">Mùa đông có ngày lên tới {fmt(drift.maxTestY, 0)} µg/m³, trong khi mô hình học mùa hè chưa từng thấy ngày nào quá {fmt(drift.maxSummerY, 0)}. Cây quyết định không ngoại suy được: lá cao nhất của nó cũng chỉ bằng những gì đã thấy.</p>
  <div class="ctrl">
    <button class="chip" class:sel={show === 'mae'} type="button" onclick={() => (show = 'mae')}>sai số MAE</button>
    <button class="chip" class:sel={show === 'bias'} type="button" onclick={() => (show = 'bias')}>độ lệch (dự báo − thật)</button>
  </div>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sai số theo tháng sau triển khai">
    <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label={show === 'mae' ? 'MAE (µg/m³)' : 'lệch (µg/m³)'} ticks={6} />
    {#if show === 'bias'}<line x1={mg.l} x2={W - mg.r} y1={sy(0)} y2={sy(0)} stroke="var(--ink)" />{/if}
    {#each live as l}
      {#if show === 'mae'}
        <rect x={sx(l.m)} y={sy(l.gb)} width={bw / 2} height={sy(0) - sy(l.gb)} fill="var(--c-x)" />
        <rect x={sx(l.m)! + bw / 2} y={sy(l.persist)} width={bw / 2} height={sy(0) - sy(l.persist)} fill="var(--le)" opacity="0.55" />
      {:else}
        <rect x={sx(l.m)} y={Math.min(sy(0), sy(l.bias))} width={bw} height={Math.abs(sy(l.bias) - sy(0))} fill={l.bias > 0 ? 'var(--c-pos)' : 'var(--c-neg)'} opacity="0.7" />
      {/if}
      <text x={sx(l.m)! + bw / 2} y={H - mg.b + 15} text-anchor="middle" class="lbl">T{+l.m.slice(5, 7)}</text>
    {/each}
  </svg>
  <div class="table-scroll">
    <table class="data">
      <thead><tr><th>Tháng</th><th>Ngày</th><th>PM2.5 TB</th><th>MAE boosting</th><th>MAE "= hôm nay"</th><th>Độ lệch</th><th>Số trạm TB</th></tr></thead>
      <tbody>{#each live as l, i}<tr><td>{l.m.slice(5, 7)}/{l.m.slice(0, 4)}</td><td>{l.n}</td><td>{fmt(l.mean, 1)}</td><td>{fmt(l.gb, 2)}</td><td>{fmt(l.persist, 2)}</td><td>{l.bias > 0 ? '+' : ''}{fmt(l.bias, 2)}</td><td>{fmt(nSt[i], 1)}</td></tr>{/each}</tbody>
    </table>
  </div>
  <p class="cap">Mô hình thắng mốc so sánh ở {wins}/{live.length} tháng{#if lose.length}, thua ở {lose.map((l) => `T${+l.m.slice(5, 7)}`).join(', ')}{/if}. {#if posFrom}Từ tháng {+posFrom.slice(5, 7)}/{posFrom.slice(0, 4)}, độ lệch luôn dương: mô hình <b>dự báo cao hơn thực tế</b> một cách đều đặn, lệch nhiều nhất {fmt(Math.max(...live.map((l) => l.bias)), 1)} µg/m³.{/if} Có nhiều lời giải thích: không khí sạch hơn thật (lộ trình hạn chế xe máy chạy xăng trong Vành đai 1?), thời tiết khác thường, hoặc chỉ là trạm Nguyễn Văn Cừ ngừng gửi số liệu nên chỉ số được tính từ ít trạm hơn. Dữ liệu này chưa đủ để phân biệt các khả năng đó.</p>
</div>

<style>
  .lbl { font-size: 10.5px; fill: var(--faint); font-family: var(--mono); }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
