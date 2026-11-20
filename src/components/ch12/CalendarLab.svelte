<script lang="ts">
  /** Bản đồ nhiệt chỉ số PM2.5 Hà Nội theo giờ: mỗi cột một ngày, mỗi hàng một giờ. Ô trống là giờ không có số liệu. */
  import { fmt } from '../../lib/ml-core';

  let { hourly, thr }: { hourly: { start: string; v: (number | null)[] }; thr: number } = $props();
  const t0 = $derived(Date.parse(hourly.start.replace(' ', 'T') + 'Z'));
  const nDays = $derived(Math.floor(hourly.v.length / 24));
  const dayStr = (i: number) => new Date(t0 + i * 864e5).toISOString().slice(0, 10);
  const monthsAll = $derived([...new Set(Array.from({ length: nDays }, (_, i) => dayStr(i).slice(0, 7)))]);
  let month = $state('2026-01');
  let hover = $state<{ d: string; h: number; v: number | null } | null>(null);

  const cells = $derived.by(() => {
    const out: { i: number; d: string }[] = [];
    for (let i = 0; i < nDays; i++) { const d = dayStr(i); if (d.startsWith(month)) out.push({ i, d }); }
    return out;
  });
  // Hồ sơ trung bình theo giờ của tháng đang xem
  const prof = $derived(Array.from({ length: 24 }, (_, h) => {
    const v = cells.map((c) => hourly.v[c.i * 24 + h]).filter((x): x is number => x !== null);
    return v.length ? v.reduce((a, x) => a + x, 0) / v.length : null;
  }));
  const missing = $derived(cells.reduce((a, c) => a + Array.from({ length: 24 }, (_, h) => hourly.v[c.i * 24 + h]).filter((x) => x === null).length, 0));

  const bins = [0, 15, 25, 35, 50, 75, 100, 150];
  const pal = ['#d7efe5', '#a8dcc6', '#f6e7a1', '#f4c36a', '#ec8a4a', '#d9483b', '#a3245c', '#5d1a6b'];
  const color = (v: number | null) => { if (v === null) return 'transparent'; let k = 0; while (k + 1 < bins.length && v >= bins[k + 1]) k++; return pal[k]; };
  const cw = $derived(Math.max(10, Math.min(20, 620 / Math.max(28, cells.length)))), ch = 11;
  const W = $derived(40 + cells.length * cw + 70);
</script>

<div class="lab">
  <p class="lab-title">Hà Nội từng giờ: khi nào bụi mịn dày nhất?</p>
  <p class="lab-hint">Mỗi cột là một ngày, mỗi hàng là một giờ (0 giờ ở trên cùng). Cột bên phải là trung bình từng giờ của cả tháng. Rê chuột lên một ô để xem số đo.</p>
  <div class="ctrl">
    <label>Tháng
      <select bind:value={month} aria-label="Chọn tháng">
        {#each monthsAll as m}<option value={m}>{m.slice(5, 7)}/{m.slice(0, 4)}</option>{/each}
      </select>
    </label>
    <span class="cap">{missing} giờ không có số liệu trong tháng</span>
    {#if hover}<span class="num">{hover.d.slice(8, 10)}/{hover.d.slice(5, 7)}, {hover.h} giờ: <b>{hover.v === null ? 'thiếu' : `${hover.v} µg/m³`}</b></span>{/if}
  </div>
  <div class="scroll">
    <svg class="chart" viewBox={`0 0 ${W} ${24 * ch + 34}`} style:min-width={`${Math.min(W, 520)}px`} role="img" aria-label="Bản đồ nhiệt PM2.5 theo giờ và ngày" onmouseleave={() => (hover = null)}>
      {#each [0, 6, 12, 18, 23] as h}<text x="34" y={h * ch + 9} text-anchor="end" class="lbl">{h}h</text>{/each}
      {#each cells as c, j}
        {#each Array.from({ length: 24 }, (_, h) => h) as h}
          {@const v = hourly.v[c.i * 24 + h]}
          <rect x={40 + j * cw} y={h * ch} width={cw - 1} height={ch - 1} fill={color(v)} stroke={v === null ? 'var(--rule-2)' : 'none'} stroke-width="0.6"
            role="presentation" onmouseenter={() => (hover = { d: c.d, h, v })} />
        {/each}
        {#if j % 5 === 0}<text x={40 + j * cw} y={24 * ch + 12} class="lbl">{+c.d.slice(8, 10)}</text>{/if}
      {/each}
      {#each prof as v, h}
        <rect x={40 + cells.length * cw + 12} y={h * ch} width="18" height={ch - 1} fill={color(v)} />
        {#if h % 3 === 0}<text x={40 + cells.length * cw + 34} y={h * ch + 9} class="lbl">{v === null ? '—' : fmt(v, 0)}</text>{/if}
      {/each}
    </svg>
  </div>
  <div class="legend">
    {#each pal as p, k}<span><i style:background={p}></i>{bins[k]}{k + 1 < bins.length ? `–${bins[k + 1]}` : '+'}</span>{/each}
    <span class="cap">µg/m³ · ngưỡng cảnh báo trung bình ngày: {thr}</span>
  </div>
</div>

<style>
  .scroll { overflow-x: auto; }
  .lbl { font-size: 10px; fill: var(--faint); font-family: var(--mono); }
  .legend { display: flex; flex-wrap: wrap; gap: 0.3rem 0.8rem; font: 0.75rem var(--mono); color: var(--pencil); margin-top: 0.5rem; align-items: center; }
  .legend i { display: inline-block; width: 0.9rem; height: 0.7rem; margin-right: 0.25rem; vertical-align: -0.05rem; }
  .cap { font-size: 0.84rem; color: var(--pencil); font-family: var(--serif); }
</style>
