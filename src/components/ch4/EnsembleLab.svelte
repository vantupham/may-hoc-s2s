<script lang="ts">
  /** Nhiều cây tốt hơn một cây: Random Forest (bỏ phiếu) và Gradient Boosting (sửa lỗi nối tiếp). */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { buildTree, predictTree, randomForest, probaForest, gradientBoosting, fmt, type Row } from '../../lib/ml-core';
  import { questionText } from '../../lib/titanic';

  interface P { id: number; survived: number }
  let { people, testIds, features }: { people: P[]; testIds: number[]; features: string[] } = $props();
  const testSet = $derived(new Set(testIds));
  const toRow = (p: P): Row => ({ x: features.map((f) => (p as any)[f] as number), y: p.survived });
  const train = $derived(people.filter((p) => !testSet.has(p.id)).map(toRow));
  const test = $derived(people.filter((p) => testSet.has(p.id)).map(toRow));

  const NT = 100, NS = 150;
  let seed = $state(1);
  const single = $derived.by(() => { const t = buildTree(train, { maxDepth: 8, nFeatures: 5 }); return test.filter((r) => predictTree(t, r.x) === r.y).length / test.length; });
  const forest = $derived(randomForest(train, { nTrees: NT, maxDepth: 8, nFeatures: 5, maxFeatures: 2, seed }));
  const rfCurve = $derived.by(() => {
    const sums = test.map(() => 0);
    return forest.map((t, k) => {
      let ok = 0;
      test.forEach((r, i) => { sums[i] += buildProba(t, r.x); if ((sums[i] / (k + 1) >= 0.5 ? 1 : 0) === r.y) ok++; });
      return ok / test.length;
    });
  });
  function buildProba(t: (typeof forest)[number], x: number[]) { return probaForest([t], x); }
  const gb = $derived(gradientBoosting(train, { nStages: NS, lr: 0.1, maxDepth: 2, nFeatures: 5 }));
  const gbCurve = $derived(Array.from({ length: NS }, (_, k) => test.filter((r) => (gb.proba(r.x, k + 1) >= 0.5 ? 1 : 0) === r.y).length / test.length));

  let nt = $state(50);
  let ns = $state(100);

  const W = 440, H = 240, m = { t: 30, r: 14, b: 40, l: 48 };
  const sy = scaleLinear().domain([0.72, 0.9]).range([H - m.b, m.t]);
  const sxR = scaleLinear().domain([1, NT]).range([m.l, W - m.r]);
  const sxG = scaleLinear().domain([1, NS]).range([m.l, W - m.r]);
  const lineOf = (c: number[], sx: (v: number) => number) => c.map((v, i) => `${i ? 'L' : 'M'}${sx(i + 1)},${sy(Math.max(0.72, Math.min(0.9, v)))}`).join('');
</script>

<div class="lab">
  <p class="lab-title">Rừng cây và cây nối tiếp</p>
  <p class="lab-hint">Mọi mô hình ở đây được huấn luyện ngay trong trình duyệt của bạn trên 713 hành khách và chấm điểm trên 178 hành khách của tập test. Đường ngang đứt là một cây duy nhất sâu 8 tầng: <b class="num">{fmt(single * 100, 1)}%</b>.</p>
  <div class="two">
    <div>
      <p class="h">Random Forest: {NT} cây, mỗi cây học trên một mẫu có lặp lại và chỉ được xét 2 đặc trưng ngẫu nhiên ở mỗi nút</p>
      <div class="ctrl"><label>Số cây <span class="num">{nt}</span><input type="range" min="1" max={NT} bind:value={nt} aria-label="Số cây" /></label>
        <button class="btn" type="button" onclick={() => (seed += 1)}>Trồng lại rừng khác</button></div>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Độ chính xác test theo số cây">
        <Axis scale={sxR} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={5} label="Số cây" />
        <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="Độ chính xác test" />
        <line x1={m.l} x2={W - m.r} y1={sy(single)} y2={sy(single)} stroke="var(--pencil)" stroke-dasharray="5 4" />
        <path d={lineOf(rfCurve, sxR)} fill="none" stroke="var(--k0)" stroke-width="2.2" />
        <circle cx={sxR(nt)} cy={sy(rfCurve[nt - 1])} r="5" fill="var(--k0)" />
      </svg>
      <p>{nt} cây: <b class="num">{fmt(rfCurve[nt - 1] * 100, 1)}%</b>. Câu hỏi đầu tiên của 6 cây đầu: {#each forest.slice(0, 6) as t, i}<span class="q">{t.feature !== undefined ? questionText(t.feature, t.thr!) : 'lá'}</span>{i < 5 ? ', ' : '.'}{/each}</p>
    </div>
    <div>
      <p class="h">Gradient Boosting: mỗi cây nhỏ (2 tầng) học sửa phần sai của tổng các cây trước, với tốc độ học 0,1</p>
      <div class="ctrl"><label>Số vòng <span class="num">{ns}</span><input type="range" min="1" max={NS} bind:value={ns} aria-label="Số vòng" /></label></div>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Độ chính xác test theo số vòng boosting">
        <Axis scale={sxG} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={5} label="Số vòng (số cây)" />
        <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="Độ chính xác test" />
        <line x1={m.l} x2={W - m.r} y1={sy(single)} y2={sy(single)} stroke="var(--pencil)" stroke-dasharray="5 4" />
        <path d={lineOf(gbCurve, sxG)} fill="none" stroke="var(--k1)" stroke-width="2.2" />
        <circle cx={sxG(ns)} cy={sy(gbCurve[ns - 1])} r="5" fill="var(--k1)" />
      </svg>
      <p>{ns} vòng: <b class="num">{fmt(gbCurve[ns - 1] * 100, 1)}%</b>. Mất mát log trên tập huấn luyện giảm từ <span class="num v-L">{fmt(gb.losses[0], 3)}</span> xuống <span class="num v-L">{fmt(gb.losses[ns], 3)}</span>.</p>
    </div>
  </div>
</div>

<style>
  .two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.8rem; }
  @media (max-width: 860px) { .two { grid-template-columns: minmax(0, 1fr); } }
  .h { font-weight: 700; font-size: 0.95rem; line-height: 1.45; margin: 0 0 0.3rem; }
  .q { font-style: italic; }
  p { font-size: 0.92rem; }
</style>
