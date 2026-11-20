<script lang="ts">
  /** Huấn luyện trên 455 bệnh nhân, đánh giá trên 114 bệnh nhân còn lại; kéo ngưỡng để xem đánh đổi. */
  import ProbMap from './ProbMap.svelte';
  import { logisticRegressionGD, sigmoid, confusion, fmt } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number }
  let { patients, testIds }: { patients: P[]; testIds: number[] } = $props();
  const testSet = $derived(new Set(testIds));
  const train = $derived(patients.filter((p) => !testSet.has(p.id)));
  const test = $derived(patients.filter((p) => testSet.has(p.id)));
  const model = $derived.by(() => {
    const t = logisticRegressionGD(train.map((p) => [p.x1, p.x2] as [number, number]), train.map((p) => p.y), { lr: 1, epochs: 2000, detail: false });
    const s = t.steps.at(-1)!.state;
    return { w: s.wNext, b: s.bNext, loss: s.loss };
  });
  let threshold = $state(0.5);
  const probs = $derived(test.map((p) => sigmoid(model.w[0] * p.x1 + model.w[1] * p.x2 + model.b)));
  const cm = $derived(confusion(test.map((p) => p.y), probs, threshold));
  const pct = (v: number) => `${fmt(v * 100, 1)}%`;
</script>

<div class="lab">
  <p class="lab-title">Mô hình trên toàn bộ dữ liệu — và cái giá của một ngưỡng</p>
  <p class="lab-hint">Huấn luyện bằng Gradient Descent (2.000 vòng, η = 1) trên {train.length} bệnh nhân, ngay trong trình duyệt. Chấm đậm là {test.length} bệnh nhân của tập test; chấm mờ là tập train.</p>
  <div class="ctrl">
    <span class="num">p = σ(<span class="v-w">{fmt(model.w[0], 3)}</span>·x₁ + <span class="v-w">{fmt(model.w[1], 3)}</span>·x₂ <span class="v-b">{model.b < 0 ? '−' : '+'} {fmt(Math.abs(model.b), 3)}</span>)</span>
    <label>Ngưỡng: gọi là ác tính khi p ≥ <b class="num">{fmt(threshold, 2)}</b><input type="range" min="0.05" max="0.95" step="0.01" bind:value={threshold} aria-label="Ngưỡng" /></label>
  </div>
  <div class="lab-grid">
    <ProbMap points={test} faded={train} w={model.w} b={model.b} {threshold} />
    <div>
      <p class="h">Ma trận nhầm lẫn trên tập test</p>
      <div class="cm" role="table" aria-label="Ma trận nhầm lẫn">
        <div></div><div class="hd">Đoán ác tính</div><div class="hd">Đoán lành tính</div>
        <div class="hd row">Thật sự ác tính</div>
        <div class="c good"><b>{cm.tp}</b><span>Đúng — phát hiện được</span></div>
        <div class="c bad big"><b>{cm.fn}</b><span>Bỏ sót (âm tính giả)</span></div>
        <div class="hd row">Thật sự lành tính</div>
        <div class="c bad"><b>{cm.fp}</b><span>Báo động nhầm (dương tính giả)</span></div>
        <div class="c good"><b>{cm.tn}</b><span>Đúng — yên tâm</span></div>
      </div>
      <dl>
        <dt>Độ chính xác (accuracy)</dt><dd>{pct(cm.accuracy)}</dd>
        <dt>Độ nhạy (recall): phát hiện được bao nhiêu ca ác tính</dt><dd>{pct(cm.recall)}</dd>
        <dt>Độ chuẩn (precision): báo ác tính thì đúng bao nhiêu</dt><dd>{pct(cm.precision)}</dd>
      </dl>
      <p class="note warn">Hạ ngưỡng xuống, ví dụ 0,2: ít ca bị <b>bỏ sót</b> hơn, đổi lại nhiều người khoẻ bị gọi đi sinh thiết thêm. Trong y khoa, bỏ sót một ca ung thư thường tệ hơn nhiều so với một lần báo động nhầm.</p>
    </div>
  </div>
</div>

<style>
  .h { font-weight: 650; font-size: 0.9rem; margin: 0 0 0.4rem; }
  .cm { display: grid; grid-template-columns: auto 1fr 1fr; gap: 4px; font-size: 0.8rem; margin-bottom: 0.8rem; }
  .hd { color: var(--pencil); font-size: 0.76rem; text-align: center; align-self: end; }
  .hd.row { text-align: right; align-self: center; padding-right: 0.3rem; }
  .c { border-radius: 2px; padding: 0.5rem; text-align: center; display: flex; flex-direction: column; gap: 0.1rem; }
  .c b { font-family: var(--mono); font-size: 1.4rem; }
  .c span { font-size: 0.72rem; color: var(--pencil); }
  .good { background: color-mix(in srgb, var(--ok) 14%, transparent); }
  .bad { background: color-mix(in srgb, var(--bad) 12%, transparent); }
  .bad.big { outline: 2px solid color-mix(in srgb, var(--bad) 50%, transparent); }
  dl { display: grid; grid-template-columns: 1fr auto; gap: 0.2rem 0.8rem; font-size: 0.85rem; margin: 0; }
  dt { color: var(--pencil); }
  dd { margin: 0; font-family: var(--mono); font-weight: 600; text-align: right; }
</style>
