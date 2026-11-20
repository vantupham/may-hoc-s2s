<script lang="ts">
  /** Khám phá dữ liệu: phân phối thu nhập và giá nhà, cùng biểu đồ phân tán 400 khu vực. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { fmt } from '../../lib/ml-core';

  interface Row { id: number; income: number; value: number; age: number; ocean: string; population: number }
  interface Hist { counts: number[]; edges: number[] }
  let { sample, hist, capped, nTotal }: { sample: Row[]; hist: { income: Hist; value: Hist }; capped: number; nTotal: number } = $props();

  let hover = $state<Row | null>(null);
  let showCap = $state(true);

  const W = 560, H = 360, m = { t: 30, r: 14, b: 44, l: 44 };
  const sx = scaleLinear().domain([0, 15.5]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0, 5.3]).range([H - m.b, m.t]);

  const HW = 300, HH = 170, hm = { t: 10, r: 10, b: 36, l: 44 };
  function histGeom(h: Hist) {
    const x = scaleLinear().domain([h.edges[0], h.edges.at(-1)!]).range([hm.l, HW - hm.r]);
    const y = scaleLinear().domain([0, Math.max(...h.counts) * 1.05]).range([HH - hm.b, hm.t]);
    return { x, y };
  }
  const gi = histGeom(hist.income);
  const gv = histGeom(hist.value);
  const oceanVi: Record<string, string> = { INLAND: 'Nội địa', 'NEAR OCEAN': 'Gần biển', '<1H OCEAN': 'Cách biển < 1 giờ', 'NEAR BAY': 'Gần vịnh', ISLAND: 'Đảo' };
</script>

<div class="lab">
  <p class="lab-title">Toàn cảnh dữ liệu</p>
  <p class="lab-hint">Hai biểu đồ cột dùng toàn bộ {nTotal.toLocaleString('vi-VN')} khu vực. Biểu đồ phân tán dùng 400 khu vực chọn ngẫu nhiên. Di chuột lên một điểm để xem chi tiết.</p>
  <div class="hists">
    <figure>
      <svg class="chart" viewBox={`0 0 ${HW} ${HH}`} role="img" aria-label="Phân phối thu nhập">
        <Axis scale={gi.x} orient="bottom" size={0} offset={HH - hm.b} ticks={6} label="Thu nhập (×10.000 USD)" />
        <Axis scale={gi.y} orient="left" size={HW - hm.l - hm.r} offset={hm.l} ticks={4} />
        {#each hist.income.counts as c, i}
          <rect x={gi.x(hist.income.edges[i]) + 0.5} y={gi.y(c)} width={Math.max(0, gi.x(hist.income.edges[i + 1]) - gi.x(hist.income.edges[i]) - 1)} height={gi.y(0) - gi.y(c)} fill="var(--c-x)" opacity="0.75" />
        {/each}
      </svg>
      <figcaption>Thu nhập lệch phải: phần lớn dưới 6, một số ít rất cao.</figcaption>
    </figure>
    <figure>
      <svg class="chart" viewBox={`0 0 ${HW} ${HH}`} role="img" aria-label="Phân phối giá nhà">
        <Axis scale={gv.x} orient="bottom" size={0} offset={HH - hm.b} ticks={6} label="Giá nhà (×100.000 USD)" />
        <Axis scale={gv.y} orient="left" size={HW - hm.l - hm.r} offset={hm.l} ticks={4} />
        {#each hist.value.counts as c, i}
          <rect x={gv.x(hist.value.edges[i]) + 0.5} y={gv.y(c)} width={Math.max(0, gv.x(hist.value.edges[i + 1]) - gv.x(hist.value.edges[i]) - 1)} height={gv.y(0) - gv.y(c)} fill={i === hist.value.counts.length - 1 ? 'var(--c-e)' : 'var(--c-y)'} opacity="0.75" />
        {/each}
      </svg>
      <figcaption>Cột đỏ cao bất thường ở 5,0: <b>{capped}</b> khu vực bị <b>chặn trần</b> 500.001 USD.</figcaption>
    </figure>
  </div>
  <div class="ctrl"><label><input type="checkbox" bind:checked={showCap} /> Tô đỏ các khu vực bị chặn trần</label></div>
  <div class="scatter">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ phân tán thu nhập và giá nhà">
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập x (×10.000 USD)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Giá nhà y (×100.000 USD)" />
      {#each sample as r (r.id)}
        <circle
          cx={sx(r.income)} cy={sy(r.value)} r={hover?.id === r.id ? 6 : 3.5}
          fill={showCap && r.value >= 5 ? 'var(--c-e)' : 'var(--c-y)'} fill-opacity="0.55"
          stroke={hover?.id === r.id ? 'var(--ink)' : 'none'}
          role="presentation"
          onmouseenter={() => (hover = r)} onmouseleave={() => (hover = null)}
        />
      {/each}
    </svg>
    <div class="info">
      {#if hover}
        <p><b>Khu vực #{hover.id}</b></p>
        <p>Thu nhập: <span class="v-x num">{fmt(hover.income, 3)}</span> → {Math.round(hover.income * 10000).toLocaleString('vi-VN')} USD/năm</p>
        <p>Giá nhà: <span class="v-y num">{fmt(hover.value, 3)}</span> → {Math.round(hover.value * 100000).toLocaleString('vi-VN')} USD</p>
        <p>Tuổi nhà trung vị: {hover.age} năm · Dân số: {hover.population.toLocaleString('vi-VN')}</p>
        <p>Vị trí: {oceanVi[hover.ocean] ?? hover.ocean}</p>
        {#if hover.value >= 5}<p class="cap">Giá thật có thể cao hơn — đã bị chặn trần.</p>{/if}
      {:else}
        <p class="muted">Di chuột lên một điểm…</p>
        <p class="muted">Xu hướng: thu nhập cao thì giá nhà cao, nhưng các điểm toả rộng. Ở thu nhập 4, giá dao động từ dưới 1 đến trên 4.</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .hists { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1rem; }
  figure { margin: 0; }
  figcaption { font-size: 0.8rem; color: var(--pencil); margin-top: 0.2rem; }
  .scatter { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 1rem; align-items: start; }
  .info { font-size: 0.86rem; background: var(--paper); border: 1px solid var(--rule); border-radius: 3px; padding: 0.7rem 0.9rem; min-height: 9rem; }
  .info p { margin: 0 0 0.3rem; }
  .muted { color: var(--faint); }
  .cap { color: var(--c-e); font-weight: 600; }
  @media (max-width: 760px) { .hists, .scatter { grid-template-columns: minmax(0, 1fr); } }
</style>
