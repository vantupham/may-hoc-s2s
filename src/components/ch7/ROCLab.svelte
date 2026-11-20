<script lang="ts">
  /** Đường ROC: mọi ngưỡng cùng lúc. So hai mô hình logistic trên dữ liệu ung thư vú. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { logisticRegressionGD, sigmoid, rocCurve, confusion, fmt } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number }
  let { patients, testIds }: { patients: P[]; testIds: number[] } = $props();
  const testSet = $derived(new Set(testIds));
  const tr = $derived(patients.filter((p) => !testSet.has(p.id)));
  const te = $derived(patients.filter((p) => testSet.has(p.id)));
  function fit(useRadius: boolean) {
    const X = tr.map((p) => [useRadius ? p.x1 : 0, p.x2] as [number, number]);
    const s = logisticRegressionGD(X, tr.map((p) => p.y), { lr: 1, epochs: 2000, detail: false }).steps.at(-1)!.state;
    return te.map((p) => sigmoid(s.wNext[0] * (useRadius ? p.x1 : 0) + s.wNext[1] * p.x2 + s.bNext));
  }
  const pA = $derived(fit(true));
  const pB = $derived(fit(false));
  const yt = $derived(te.map((p) => p.y));
  const A = $derived(rocCurve(pA, yt));
  const Bc = $derived(rocCurve(pB, yt));
  let thr = $state(0.5);
  const cm = $derived(confusion(yt, pA, thr));
  const fpr = $derived(cm.fp / (cm.fp + cm.tn));

  const W = 420, H = 400, m = { t: 30, r: 16, b: 44, l: 52 };
  const sx = scaleLinear().domain([0, 1]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0, 1]).range([H - m.b, m.t]);
  const path = (r: typeof A) => r.pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.fpr)},${sy(p.tpr)}`).join('');
  const area = (r: typeof A) => `${path(r)}L${sx(1)},${sy(0)}L${sx(0)},${sy(0)}Z`;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
</script>

<div class="lab">
  <p class="lab-title">Đường ROC và diện tích dưới đường (AUC)</p>
  <p class="lab-hint">Hai mô hình logistic học ngay trong trình duyệt: <b style="color:var(--tim)">A</b> dùng bán kính và độ nhám, <b style="color:var(--k1)">B</b> chỉ dùng độ nhám. Mỗi điểm trên đường ROC là một ngưỡng: trục ngang là tỷ lệ người lành bị báo nhầm, trục dọc là tỷ lệ ca ác tính bắt được. Kéo ngưỡng để di chuyển chấm trên đường A.</p>
  <div class="ctrl"><label>Ngưỡng của A: <span class="num">{fmt(thr, 2)}</span><input type="range" min="0.01" max="0.99" step="0.01" bind:value={thr} aria-label="Ngưỡng" style="width:14rem" /></label></div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đường ROC của hai mô hình">
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={5} format={pct} label="Tỷ lệ báo nhầm (FPR)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} ticks={5} format={pct} label="Tỷ lệ bắt được (TPR, recall)" />
      <path d={area(A)} fill="var(--tim)" fill-opacity="0.08" />
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--faint)" stroke-dasharray="4 4" />
      <path d={path(Bc)} fill="none" stroke="var(--k1)" stroke-width="2" />
      <path d={path(A)} fill="none" stroke="var(--tim)" stroke-width="2.5" />
      <circle cx={sx(fpr)} cy={sy(cm.recall)} r="7" fill="var(--tim)" stroke="var(--sheet)" stroke-width="2" />
      <text x={sx(0.55)} y={sy(0.4)} class="lbl">đoán bừa (AUC = 0,5)</text>
    </svg>
    <div>
      <dl>
        <dt><b style="color:var(--tim)">AUC mô hình A</b></dt><dd class="num">{fmt(A.auc, 4)}</dd>
        <dt><b style="color:var(--k1)">AUC mô hình B</b></dt><dd class="num">{fmt(Bc.auc, 4)}</dd>
      </dl>
      <p class="h">Mô hình A tại ngưỡng {fmt(thr, 2)}</p>
      <table class="data">
        <thead><tr><th></th><th>Đoán ác tính</th><th>Đoán lành tính</th></tr></thead>
        <tbody>
          <tr><td class="t">Thật ác tính ({A.P})</td><td>{cm.tp}</td><td>{cm.fn}</td></tr>
          <tr><td class="t">Thật lành tính ({A.N})</td><td>{cm.fp}</td><td>{cm.tn}</td></tr>
        </tbody>
      </table>
      <p class="cap">TPR = {cm.tp}/{A.P} = {pct(cm.recall)}, FPR = {cm.fp}/{A.N} = {pct(fpr)}. AUC là xác suất mô hình cho một ca ác tính ngẫu nhiên điểm cao hơn một ca lành tính ngẫu nhiên; nó không phụ thuộc vào việc chọn ngưỡng nào.</p>
    </div>
  </div>
</div>

<style>
  .lbl { font: italic 12px var(--serif); fill: var(--faint); }
  dl { display: grid; grid-template-columns: 1fr auto; gap: 0.3rem 1rem; margin: 0 0 1rem; }
  dd { margin: 0; text-align: right; }
  .h { font-weight: 700; margin: 0 0 0.3rem; }
  .cap { font-size: 0.88rem; color: var(--pencil); }
</style>
