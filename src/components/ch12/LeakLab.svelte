<script lang="ts">
  /**
   * Rò rỉ từ tương lai khi điền thiếu: nội suy hai phía dùng cả PM2.5 của ngày sau ô thiếu, tức chính nhãn cần dự báo.
   * Đo bằng cách coi giá trị điền vào hôm nay là "dự báo" cho ngày mai.
   */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { ffill, interpLinear, gaps, fmt, mae } from '../../lib/ml-core';
  import { shortDate, type Air } from '../../lib/khongkhi';

  let { air }: { air: Air } = $props();
  const pm = $derived(air.days.map((d) => d.pm));
  const ff = $derived(ffill(pm));
  const ip = $derived(interpLinear(pm));
  // Ngày thiếu PM2.5 nhưng ngày mai có số đo, và cả hai cách điền đều có giá trị
  const idx = $derived(pm.map((v, i) => i).filter((i) => pm[i] === null && i + 1 < pm.length && pm[i + 1] !== null && ff[i] !== null && ip[i] !== null));
  const y = $derived(idx.map((i) => pm[i + 1]!));
  const eF = $derived(mae(idx.map((i) => ff[i]!), y));
  const eI = $derived(mae(idx.map((i) => ip[i]!), y));
  const holes = $derived(gaps(pm).filter((g) => g.start > 3 && g.len >= 2 && g.len <= 6));
  let k = $state(0);
  const g = $derived(holes[Math.min(k, holes.length - 1)]);
  const a = $derived(Math.max(0, g.start - 4)), b = $derived(Math.min(pm.length - 1, g.start + g.len + 3));
  const span = $derived(Array.from({ length: b - a + 1 }, (_, j) => a + j));

  const W = 460, H = 250, mg = { t: 30, r: 12, b: 36, l: 44 };
  const sx = $derived(scaleLinear().domain([a, b]).range([mg.l, W - mg.r]));
  const sy = $derived(scaleLinear().domain([0, Math.max(60, ...span.map((i) => Math.max(pm[i] ?? 0, ip[i] ?? 0, ff[i] ?? 0))) * 1.1]).range([H - mg.b, mg.t]));
  const seg = (v: (number | null)[]) => span.filter((i) => i >= g.start - 1 && i <= g.start + g.len).map((i, j) => `${j ? 'L' : 'M'}${sx(i)},${sy(v[i] ?? 0)}`).join('');
</script>

<div class="lab">
  <p class="lab-title">Điền ô thiếu: nhìn quá khứ hay nhìn cả tương lai?</p>
  <p class="lab-hint">Chỉ số Hà Nội có {gaps(pm).reduce((s, q) => s + q.len, 0)} ngày không có số liệu, chia thành {gaps(pm).length} đoạn. Có hai cách điền: <b>lấy giá trị gần nhất trước đó</b> (ffill) hoặc <b>nội suy tuyến tính giữa hai đầu đoạn thiếu</b>. Chọn một đoạn để xem hai cách điền khác nhau thế nào.</p>
  <div class="ctrl">
    <label>Đoạn thiếu
      <select bind:value={k} aria-label="Chọn đoạn thiếu">{#each holes as h, j}<option value={j}>{shortDate(air.days[h.start].d)}/{air.days[h.start].d.slice(2, 4)} ({h.len} ngày)</option>{/each}</select>
    </label>
  </div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Hai cách điền một đoạn thiếu">
      <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label="PM2.5 (µg/m³)" />
      {#each span as i}
        <text x={sx(i)} y={H - mg.b + 15} text-anchor="middle" class="lbl">{+air.days[i].d.slice(8, 10)}</text>
        {#if pm[i] === null}<rect x={sx(i) - 8} y={mg.t} width="16" height={H - mg.t - mg.b} fill="var(--rule)" opacity="0.6" />{/if}
      {/each}
      <path d={seg(ff)} fill="none" stroke="var(--c-w)" stroke-width="2" stroke-dasharray="5 3" />
      <path d={seg(ip)} fill="none" stroke="var(--c-e)" stroke-width="2" />
      {#each span as i}
        {#if pm[i] !== null}<circle cx={sx(i)} cy={sy(pm[i]!)} r="4.5" fill="var(--c-y)" />{/if}
      {/each}
    </svg>
    <div>
      <p class="key"><span class="sw" style="background:var(--c-y)"></span>số đo thật <span class="sw" style="background:var(--c-w)"></span>ffill <span class="sw" style="background:var(--c-e)"></span>nội suy</p>
      <p>Giả sử ta dùng giá trị vừa điền của <b>hôm nay</b> làm dự báo cho <b>ngày mai</b>, trên {idx.length} ngày thiếu số liệu mà ngày hôm sau lại có số đo:</p>
      <table class="data">
        <thead><tr><th>Cách điền</th><th>MAE dự báo ngày mai</th></tr></thead>
        <tbody>
          <tr><td class="t">ffill: chỉ nhìn quá khứ</td><td>{fmt(eF, 1)}</td></tr>
          <tr><td class="t">Nội suy: nhìn cả hai phía</td><td><b>{fmt(eI, 1)}</b></td></tr>
        </tbody>
      </table>
      <p class="cap">MAE {fmt(eI, 1)} tốt hơn mọi mô hình trong bảng xếp hạng. Đó là ảo giác: giá trị nội suy cho ngày cuối của đoạn thiếu được kéo về phía số đo ngày mai, tức là chính đáp án.</p>
    </div>
  </div>
</div>

<style>
  .lbl { font-size: 10.5px; fill: var(--faint); font-family: var(--mono); }
  .key { font-size: 0.85rem; color: var(--pencil); }
  .sw { display: inline-block; width: 0.8rem; height: 0.3rem; margin: 0 0.25rem 0.15rem 0.6rem; }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
