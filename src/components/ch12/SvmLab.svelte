<script lang="ts">
  /** SVM nhân RBF (chương 6) trên hai đặc trưng: PM2.5 hôm nay và gió ngày mai. Lưới quyết định tính sẵn bằng scikit-learn. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { fmt } from '../../lib/ml-core';
  import { buildRows, type Air } from '../../lib/khongkhi';

  interface Grid { feats: string[]; mu: number[]; sd: number[]; x: number[]; y: number[]; models: { gamma: number; f: number[][]; trainAcc: number; testAcc: number; nSV: number }[]; logregTest: number }
  let { air, grid }: { air: Air; grid: Grid } = $props();
  const thr = $derived(air.meta.thr);
  const rows = $derived(buildRows(air.days, air.meta));
  let gi = $state(0);
  let set = $state<'train' | 'test'>('test');
  const m = $derived(grid.models[gi]);
  const pts = $derived(rows.filter((r) => r.split === set).map((r) => ({ a: (r.x[0] - grid.mu[0]) / grid.sd[0], b: (r.x[3] - grid.mu[1]) / grid.sd[1], y: r.y > thr })));

  const W = 520, H = 400, mg = { t: 30, r: 12, b: 44, l: 50 };
  const sx = $derived(scaleLinear().domain([grid.x[0], grid.x.at(-1)!]).range([mg.l, W - mg.r]));
  const sy = $derived(scaleLinear().domain([grid.y[0], grid.y.at(-1)!]).range([H - mg.b, mg.t]));
  const cw = $derived((W - mg.l - mg.r) / (grid.x.length - 1)), chh = $derived((H - mg.t - mg.b) / (grid.y.length - 1));
  // Trục ghi theo đơn vị thật
  const toPm = (z: number) => z * grid.sd[0] + grid.mu[0];
  const toWs = (z: number) => z * grid.sd[1] + grid.mu[1];
</script>

<div class="lab">
  <p class="lab-title">SVM nhân RBF: ranh giới giữa ngày ổn và ngày ô nhiễm</p>
  <p class="lab-hint">Mỗi chấm là một ngày dự báo. Chấm đỏ: ngày mai vượt {thr} µg/m³. Nền đỏ nhạt: vùng SVM dự đoán "vượt ngưỡng". Chỉ dùng hai đặc trưng: <b>PM2.5 hôm nay</b> và <b>gió ngày mai</b>. Đổi γ rồi so điểm trên tập huấn luyện với điểm trên tập kiểm tra.</p>
  <div class="ctrl">
    <span>γ =</span>
    {#each grid.models as g, i}<button class="chip" class:sel={gi === i} type="button" onclick={() => (gi = i)}>{String(g.gamma).replace('.', ',')}</button>{/each}
    <span>Điểm:</span>
    <button class="chip" class:sel={set === 'train'} type="button" onclick={() => (set = 'train')}>huấn luyện</button>
    <button class="chip" class:sel={set === 'test'} type="button" onclick={() => (set = 'test')}>kiểm tra</button>
  </div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Vùng quyết định SVM">
      {#each m.f as row, j}
        {#each row as f, i}
          {#if f > 0}<rect x={sx(grid.x[i]) - cw / 2} y={sy(grid.y[j]) - chh / 2} width={cw + 0.5} height={chh + 0.5} fill="var(--le)" opacity={Math.min(0.28, 0.08 + f * 0.08)} shape-rendering="crispEdges" />{/if}
        {/each}
      {/each}
      <Axis scale={sx} orient="bottom" size={H - mg.t - mg.b} offset={H - mg.b} label="PM2.5 hôm nay (µg/m³)" format={(z) => fmt(toPm(z), 0)} />
      <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label="Gió ngày mai (m/s)" format={(z) => fmt(toWs(z), 1)} />
      {#each pts as p}
        <circle cx={sx(Math.min(grid.x.at(-1)!, p.a))} cy={sy(Math.max(grid.y[0], Math.min(grid.y.at(-1)!, p.b)))} r="3.2" fill={p.y ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity="0.75" stroke="var(--sheet)" stroke-width="0.6" />
      {/each}
    </svg>
    <div>
      <table class="data">
        <thead><tr><th>γ</th><th>Đúng (train)</th><th>Đúng (test)</th><th>Vector hỗ trợ</th></tr></thead>
        <tbody>
          {#each grid.models as g, i}<tr class:on={gi === i}><td>{String(g.gamma).replace('.', ',')}</td><td>{fmt(g.trainAcc, 1)}%</td><td>{fmt(g.testAcc, 1)}%</td><td>{g.nSV}</td></tr>{/each}
          <tr><td class="t">logistic</td><td></td><td>{fmt(grid.logregTest, 1)}%</td><td></td></tr>
        </tbody>
      </table>
      <p class="cap">Ranh giới cong, nhưng không cong nhiều: hôm nay càng bẩn thì càng cần gió mạnh mới sạch được vào ngày mai. Tăng γ thì điểm huấn luyện tăng, còn điểm kiểm tra giảm. Khoảng một phần ba số ngày huấn luyện là vector hỗ trợ, vì hai nhóm chồng lấn nhiều.</p>
    </div>
  </div>
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
