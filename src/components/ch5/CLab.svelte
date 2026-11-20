<script lang="ts">
  /** Toàn bộ dữ liệu: hệ số C đánh đổi giữa lề rộng và ít vi phạm. */
  import MarginPlot from './MarginPlot.svelte';
  import { svmTrain, fmt } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number }
  let { patients, testIds }: { patients: P[]; testIds: number[] } = $props();
  const testSet = $derived(new Set(testIds));
  const train = $derived(patients.filter((p) => !testSet.has(p.id)));
  const test = $derived(patients.filter((p) => testSet.has(p.id)));
  const Cs = [0.001, 0.01, 0.1, 1, 10, 100];
  let ci = $state(3);
  const C = $derived(Cs[ci]);
  const model = $derived(svmTrain(train.map((p) => [p.x1, p.x2] as [number, number]), train.map((p) => (p.y ? 1 : -1)), C, 3000));
  const sv = $derived(new Set(train.filter((_, i) => model.margins[i] <= 1 + 1e-3).map((p) => p.id)));
  const acc = (rs: P[]) => rs.filter((p) => ((model.w[0] * p.x1 + model.w[1] * p.x2 + model.b >= 0 ? 1 : 0) === p.y)).length / rs.length;
  const width = $derived(2 / Math.hypot(...model.w));
</script>

<div class="lab">
  <p class="lab-title">Hệ số C: lề rộng hay ít vi phạm?</p>
  <p class="lab-hint">Huấn luyện ngay trong trình duyệt trên {train.length} bệnh nhân (3.000 bước subgradient). Chấm có viền đen là vector hỗ trợ: những người nằm trên hoặc bên trong dải lề. Chỉ họ quyết định vị trí đường ranh giới.</p>
  <div class="ctrl">
    <label>C = <span class="num">{fmt(C, C < 1 ? 3 : 0)}</span><input type="range" min="0" max={Cs.length - 1} step="1" bind:value={ci} aria-label="Hệ số C" /></label>
  </div>
  <div class="lab-grid">
    <MarginPlot points={train} w={model.w} b={model.b} {sv} />
    <div>
    <dl>
      <dt>Độ rộng dải lề 2/‖w‖</dt><dd class="num">{fmt(width, 3)}</dd>
      <dt>Số vector hỗ trợ</dt><dd class="num">{model.nSV} / {train.length}</dd>
      <dt>Độ chính xác huấn luyện</dt><dd class="num">{fmt(acc(train) * 100, 1)}%</dd>
      <dt>Độ chính xác test ({test.length} người)</dt><dd class="num"><b>{fmt(acc(test) * 100, 1)}%</b></dd>
      <dt>w, b</dt><dd class="num">({fmt(model.w[0], 3)}, {fmt(model.w[1], 3)}), {fmt(model.b, 3)}</dd>
    </dl>
    <p class="cap">C nhỏ: mô hình chịu nhiều vi phạm để giữ lề rộng — gần như mọi bệnh nhân là vector hỗ trợ, đường ranh giới "mềm". C lớn: mỗi vi phạm bị phạt nặng, lề hẹp lại. Hai đặc trưng này chồng lấn, nên không có C nào tách hoàn hảo.</p>
    </div>
  </div>
</div>

<style>
  dl { display: grid; grid-template-columns: 1fr auto; gap: 0.3rem 1rem; margin: 0; font-size: 0.92rem; }
  dt { color: var(--pencil); }
  dd { margin: 0; text-align: right; }
  .cap { font-size: 0.88rem; color: var(--pencil); margin-top: 1rem; }
</style>
