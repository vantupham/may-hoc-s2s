<script lang="ts">
  /** Trực giác: tự chỉnh w₁, w₂, b để ranh giới tách hai nhóm bệnh nhân. */
  import ProbMap from './ProbMap.svelte';
  import { sigmoid, bce, fmt } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number }
  let { patients }: { patients: P[] } = $props();
  let w1 = $state(1);
  let w2 = $state(0);
  let b = $state(0);
  const probs = $derived(patients.map((p) => sigmoid(w1 * p.x1 + w2 * p.x2 + b)));
  const loss = $derived(probs.reduce((a, q, i) => a + bce(patients[i].y, q), 0) / patients.length);
  const acc = $derived(probs.filter((q, i) => (q >= 0.5 ? 1 : 0) === patients[i].y).length / patients.length);
</script>

<div class="lab">
  <p class="lab-title">Tự vẽ ranh giới quyết định</p>
  <p class="lab-hint">Nền đỏ: mô hình nghiêng về ác tính; nền xanh: lành tính; màu càng đậm càng chắc chắn. Đường đen là nơi <span class="v-p">p</span> = 0,5. Chấm có viền đen là bệnh nhân bị phân loại sai.</p>
  <div class="ctrl">
    <label><span class="v-w"><b>w₁</b></span> <span class="num">{fmt(w1, 2)}</span><input type="range" min="-3" max="6" step="0.05" bind:value={w1} aria-label="w1" /></label>
    <label><span class="v-w"><b>w₂</b></span> <span class="num">{fmt(w2, 2)}</span><input type="range" min="-3" max="4" step="0.05" bind:value={w2} aria-label="w2" /></label>
    <label><span class="v-b"><b>b</b></span> <span class="num">{fmt(b, 2)}</span><input type="range" min="-4" max="4" step="0.05" bind:value={b} aria-label="b" /></label>
  </div>
  <div class="grid">
    <ProbMap points={patients} w={[w1, w2]} {b} />
    <div class="side">
      <p class="big">Độ chính xác <b class="num">{fmt(acc * 100, 1)}%</b></p>
      <p class="big">Mất mát <span class="v-L">L</span> <b class="num v-L">{fmt(loss, 4)}</b></p>
      <p class="muted">Thử: tăng w₁ thì đường ranh giới xoay và dốc hơn; tăng b thì nó trượt sang trái — nhiều bệnh nhân bị gọi là ác tính hơn. Độ chính xác có thể giữ nguyên trong khi mất mát vẫn giảm: mất mát còn thưởng cho sự <b>tự tin đúng</b>.</p>
      <button class="btn" type="button" onclick={() => { w1 = 3.55; w2 = 0.91; b = -0.71; }}>Gợi ý một lời giải tốt</button>
    </div>
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 1.25rem; align-items: start; }
  @media (max-width: 760px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  .big { font-size: 1.05rem; margin: 0 0 0.4rem; }
  .muted { color: var(--pencil); font-size: 0.88rem; }
</style>
