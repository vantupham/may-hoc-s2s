<script lang="ts">
  /** SVM với nhân RBF: ranh giới cong. Lưới quyết định được tính sẵn bằng scikit-learn. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { fmt } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number }
  interface M { gamma: number; decision: number[]; trainAcc: number; testAcc: number; nSV: number }
  let { patients, testIds, grid }: { patients: P[]; testIds: number[]; grid: { n: number; x: number[]; y: number[]; models: M[] } } = $props();
  const testSet = $derived(new Set(testIds));
  const test = $derived(patients.filter((p) => testSet.has(p.id)));
  const train = $derived(patients.filter((p) => !testSet.has(p.id)));
  let gi = $state(1);
  const mdl = $derived(grid.models[gi]);

  const W = 520, H = 420, m = { t: 30, r: 14, b: 44, l: 48 };
  const sx = scaleLinear().domain([-2.4, 4.2]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([-2.6, 4.8]).range([H - m.b, m.t]);
  const cw = $derived((W - m.l - m.r) / grid.n);
  const chh = $derived((H - m.t - m.b) / grid.n);
</script>

<div class="lab">
  <p class="lab-title">Nhân RBF: khi đường thẳng không đủ</p>
  <p class="lab-hint">Bản đồ quyết định của SVM với nhân RBF (C = 1), tính sẵn bằng scikit-learn trên tập huấn luyện. γ càng lớn, mỗi bệnh nhân chỉ "ảnh hưởng" một vùng càng nhỏ quanh mình. Chấm đậm là tập test.</p>
  <div class="ctrl" role="radiogroup" aria-label="Gamma">
    {#each grid.models as g, i}<label><input type="radio" bind:group={gi} value={i} /> γ = {fmt(g.gamma, g.gamma < 1 ? 1 : 0)}</label>{/each}
  </div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Vùng quyết định của SVM nhân RBF">
      {#each mdl.decision as d, k}
        {@const i = k % grid.n}
        {@const j = Math.floor(k / grid.n)}
        <rect x={m.l + i * cw} y={H - m.b - (j + 1) * chh} width={cw} height={chh} shape-rendering="crispEdges"
          fill={d >= 0 ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity={Math.min(0.3, 0.08 + Math.abs(d) * 0.12)} />
      {/each}
      <Axis scale={sx} orient="bottom" size={0} offset={H - m.b} label="x₁: bán kính (đã chuẩn hoá)" />
      <Axis scale={sy} orient="left" size={0} offset={m.l} label="x₂: độ nhám (đã chuẩn hoá)" />
      {#each train as p}<circle cx={sx(p.x1)} cy={sy(p.x2)} r="2.3" fill={p.y ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity="0.3" />{/each}
      {#each test as p}<circle cx={sx(p.x1)} cy={sy(p.x2)} r="3.8" fill={p.y ? 'var(--c-pos)' : 'var(--c-neg)'} stroke="var(--sheet)" stroke-width="0.8" />{/each}
    </svg>
    <div>
      <dl>
        <dt>Độ chính xác huấn luyện</dt><dd class="num">{fmt(mdl.trainAcc * 100, 1)}%</dd>
        <dt>Độ chính xác test</dt><dd class="num"><b>{fmt(mdl.testAcc * 100, 1)}%</b></dd>
        <dt>Số vector hỗ trợ</dt><dd class="num">{mdl.nSV}</dd>
      </dl>
      <p class="cap">Với γ = 50, ranh giới uốn lượn quanh từng bệnh nhân: điểm huấn luyện tăng, điểm test giảm hẳn. Đó là học thuộc lòng — giống KNN với k = 1 hay cây không giới hạn độ sâu. Với hai đặc trưng này, ranh giới gần thẳng (γ nhỏ) tổng quát hoá tốt nhất.</p>
    </div>
  </div>
</div>

<style>
  dl { display: grid; grid-template-columns: 1fr auto; gap: 0.3rem 1rem; margin: 0 0 0.8rem; font-size: 0.92rem; }
  dt { color: var(--pencil); }
  dd { margin: 0; text-align: right; }
  .cap { font-size: 0.88rem; color: var(--pencil); }
</style>
