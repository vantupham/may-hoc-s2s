<script lang="ts">
  /** Hai mốc so sánh trên mùa đông 2025–2026: "ngày mai = hôm nay" và "trung bình cùng tháng" (tính từ tập huấn luyện). */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { fmt, mae } from '../../lib/ml-core';
  import { buildRows, shortDate, type Air } from '../../lib/khongkhi';

  let { air }: { air: Air } = $props();
  const rows = $derived(buildRows(air.days, air.meta));
  const tr = $derived(rows.filter((r) => r.split === 'train'));
  const te = $derived(rows.filter((r) => r.split === 'test'));
  const clim = $derived.by(() => {
    const s = new Map<number, [number, number]>();
    for (const r of tr) { const m = +r.target.slice(5, 7); const e = s.get(m) ?? [0, 0]; s.set(m, [e[0] + r.y, e[1] + 1]); }
    return (t: string) => { const e = s.get(+t.slice(5, 7))!; return e[0] / e[1]; };
  });
  let show = $state<'persist' | 'clim'>('persist');
  const pred = $derived(te.map((r) => (show === 'persist' ? r.x[0] : clim(r.target))));
  const err = $derived(mae(pred, te.map((r) => r.y)));
  const errP = $derived(mae(te.map((r) => r.x[0]), te.map((r) => r.y)));
  const errC = $derived(mae(te.map((r) => clim(r.target)), te.map((r) => r.y)));
  // Những ngày "đổi chiều": bụi tăng hoặc giảm hơn 30 µg/m³ chỉ sau một ngày
  const jumps = $derived(te.filter((r) => Math.abs(r.y - r.x[0]) > 30).length);
  const thr = $derived(air.meta.thr);
  const missed = $derived(te.filter((r) => r.y > thr && r.x[0] <= thr).length);
  const fa = $derived(te.filter((r) => r.y <= thr && r.x[0] > thr).length);

  const W = 660, H = 290, mg = { t: 30, r: 12, b: 36, l: 44 };
  const sx = $derived(scaleLinear().domain([0, te.length - 1]).range([mg.l, W - mg.r]));
  const sy = scaleLinear().domain([0, 180]).range([H - mg.b, mg.t]);
  const line = (v: number[]) => v.map((y, i) => `${i ? 'L' : 'M'}${sx(i)},${sy(Math.min(180, y))}`).join('');
  const ticks = $derived(te.map((r, i) => ({ i, d: r.target })).filter((t) => t.d.endsWith('-01') || t.d.endsWith('-15')));
</script>

<div class="lab">
  <p class="lab-title">Hai mốc so sánh, chưa cần học máy</p>
  <p class="lab-hint">Đường xanh lá là PM2.5 thật của {te.length} ngày mùa đông 2025–2026. Đường cam là dự báo của mốc đang chọn. Cách "ngày mai = hôm nay" chính là đường thật dịch sang phải một ngày.</p>
  <div class="ctrl">
    <button class="chip" class:sel={show === 'persist'} type="button" onclick={() => (show = 'persist')}>ngày mai = hôm nay</button>
    <button class="chip" class:sel={show === 'clim'} type="button" onclick={() => (show = 'clim')}>trung bình cùng tháng</button>
    <span>MAE = <b class="num">{fmt(err, 2)}</b> µg/m³</span>
  </div>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="PM2.5 thật và dự báo của mốc so sánh">
    <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label="PM2.5 (µg/m³)" />
    {#each ticks as t}<text x={sx(t.i)} y={H - mg.b + 16} class="lbl" text-anchor="middle">{shortDate(t.d)}</text>{/each}
    <line x1={mg.l} x2={W - mg.r} y1={sy(thr)} y2={sy(thr)} stroke="var(--le)" stroke-dasharray="3 3" />
    <path d={line(te.map((r) => r.y))} fill="none" stroke="var(--c-y)" stroke-width="2" />
    <path d={line(pred)} fill="none" stroke="var(--c-yh)" stroke-width="1.6" stroke-dasharray={show === 'clim' ? '' : '4 2'} />
  </svg>
  <table class="data">
    <thead><tr><th>Mốc</th><th>MAE (µg/m³)</th></tr></thead>
    <tbody>
      <tr class:on={show === 'persist'}><td class="t">Ngày mai = hôm nay</td><td>{fmt(errP, 2)}</td></tr>
      <tr class:on={show === 'clim'}><td class="t">Trung bình cùng tháng (học từ các năm trước)</td><td>{fmt(errC, 2)}</td></tr>
    </tbody>
  </table>
  <p class="cap">Mốc "ngày mai = hôm nay" sai nhiều nhất ở những ngày đổi chiều: có {jumps} ngày bụi thay đổi hơn 30 µg/m³ so với hôm trước. Nếu dùng nó để cảnh báo, nó bỏ sót {missed} ngày vượt ngưỡng và báo nhầm {fa} ngày, vì luôn phản ứng chậm một ngày.</p>
</div>

<style>
  .lbl { font-size: 10.5px; fill: var(--faint); font-family: var(--mono); }
  .cap { font-size: 0.88rem; color: var(--pencil); margin-top: 0.7rem; }
</style>
