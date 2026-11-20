<script lang="ts">
  /** Phiếu khám 7 trạm đo: lỗi -999, kẹt số, độ tương quan với các trạm khác, và đường trung bình tháng của từng trạm. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { fmt } from '../../lib/ml-core';
  import type { Air } from '../../lib/khongkhi';

  let { air }: { air: Air } = $props();
  const st = $derived(air.meta.stations);
  const col = ['var(--k0)', 'var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--c-w)', 'var(--c-b)'];
  let on = $state<number | null>(null);

  // Trung bình tháng của từng trạm và của chỉ số Hà Nội
  const months = $derived.by(() => {
    const m = new Map<string, { s: number[][]; pm: number[] }>();
    for (const d of air.days) {
      const k = d.d.slice(0, 7);
      if (!m.has(k)) m.set(k, { s: st.map(() => []), pm: [] });
      const e = m.get(k)!;
      d.st.forEach((v, i) => v !== null && e.s[i].push(v));
      if (d.pm !== null) e.pm.push(d.pm);
    }
    const avg = (v: number[]) => (v.length >= 10 ? v.reduce((a, x) => a + x, 0) / v.length : null);
    return [...m].map(([k, e], i) => ({ k, i, s: e.s.map(avg), pm: avg(e.pm) }));
  });
  const W = 640, H = 300, mg = { t: 30, r: 12, b: 40, l: 44 };
  const sx = $derived(scaleLinear().domain([0, months.length - 1]).range([mg.l, W - mg.r]));
  const sy = scaleLinear().domain([0, 160]).range([H - mg.b, mg.t]);
  const path = (vals: (number | null)[]) => {
    let s = '', pen = false;
    vals.forEach((v, i) => { if (v === null) { pen = false; return; } s += `${pen ? 'L' : 'M'}${sx(i)},${sy(Math.min(v, 160))}`; pen = true; });
    return s;
  };
  const yearTicks = $derived(months.filter((m) => m.k.endsWith('-01')));
</script>

<div class="lab">
  <p class="lab-title">Phiếu khám 7 trạm đo PM2.5 ở Hà Nội</p>
  <p class="lab-hint">Mỗi đường là trung bình tháng của một trạm (chỉ tính tháng có ít nhất 10 ngày đủ số liệu). Đường đen đứt nét là chỉ số Hà Nội: trung vị của các trạm <b>được dùng</b> trong từng ngày. Bấm vào một dòng của bảng để làm nổi trạm đó.</p>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trung bình tháng PM2.5 của từng trạm">
    <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label="PM2.5 (µg/m³)" />
    <line x1={mg.l} x2={W - mg.r} y1={sy(air.meta.thr)} y2={sy(air.meta.thr)} stroke="var(--le)" stroke-dasharray="3 3" />
    <text x={W - mg.r} y={sy(air.meta.thr) - 4} text-anchor="end" class="lbl">ngưỡng {air.meta.thr}</text>
    {#each yearTicks as m}
      <line x1={sx(m.i)} x2={sx(m.i)} y1={mg.t} y2={H - mg.b} stroke="var(--rule)" />
      <text x={sx(m.i) + 3} y={H - mg.b + 16} class="lbl">{m.k.slice(0, 4)}</text>
    {/each}
    {#each st as s, i}
      <path d={path(months.map((m) => m.s[i]))} fill="none" stroke={col[i]} stroke-width={on === i ? 3 : 1.6}
        stroke-opacity={on === null || on === i ? (s.used ? 0.95 : 0.6) : 0.15} stroke-dasharray={s.used ? '' : '2 3'} />
    {/each}
    <path d={path(months.map((m) => m.pm))} fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-dasharray="6 3" opacity={on === null ? 1 : 0.35} />
  </svg>
  <table class="data">
    <thead><tr><th>Trạm</th><th>Có số liệu</th><th>Mã lỗi −999</th><th>Đoạn kẹt số</th><th>r với trạm khác</th><th>Lệch trung vị</th><th>Dùng?</th></tr></thead>
    <tbody>
      {#each st as s, i}
        <tr class:on={on === i} onclick={() => (on = on === i ? null : i)} style="cursor:pointer">
          <td class="t"><span class="sw" style:background={col[i]}></span>{s.name}{#if s.fiveMin}<span class="nt">đo 5 phút/lần</span>{/if}</td>
          <td>{s.first.slice(0, 7)} → {s.last.slice(0, 7)}</td>
          <td>{s.neg}</td>
          <td>{s.stuckRuns}{s.stuckRuns ? ` (${s.stuckHours} giờ)` : ''}</td>
          <td>{fmt(s.r, 2)}</td>
          <td>{s.bias > 0 ? '+' : ''}{fmt(s.bias, 1)}</td>
          <td class="t why">{s.used ? '✓' : `✗ ${s.why}`}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="cap">Quy tắc đã áp dụng trước khi vẽ: bỏ giá trị âm (mã lỗi), bỏ đoạn ≥ {air.meta.rules.stuck} giờ liền cùng một số, bỏ ngày có dưới {air.meta.rules.minHours} giờ, bỏ {air.meta.rules.startupDays} ngày chạy thử đầu tiên của mỗi trạm. Sau đó, một ngày của một trạm còn bị loại nếu lệch quá xa trung vị của ít nhất hai trạm khác: {air.meta.qa.cross} ngày-trạm bị loại theo cách này.</p>
</div>

<style>
  .lbl { font-size: 11px; fill: var(--faint); font-family: var(--mono); }
  .sw { display: inline-block; width: 0.7rem; height: 0.7rem; margin-right: 0.4rem; border-radius: 1px; vertical-align: -0.05rem; }
  .nt { display: block; font-size: 0.76rem; color: var(--faint); padding-left: 1.1rem; }
  .why { white-space: normal; min-width: 9rem; }
  .cap { font-size: 0.86rem; color: var(--pencil); margin-top: 0.8rem; }
</style>
