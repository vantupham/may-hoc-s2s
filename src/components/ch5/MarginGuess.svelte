<script lang="ts">
  /** Trực giác: có vô số đường thẳng tách được 6 bệnh nhân. Đường nào cách xa điểm gần nhất nhất? */
  import MarginPlot from './MarginPlot.svelte';
  import { svmTrain, fmt } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number }
  let { mini }: { mini: P[] } = $props();
  let ang = $state(30);
  let off = $state(0);
  const w = $derived([Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)] as [number, number]);
  // Khoảng cách có dấu của từng điểm tới đường thẳng (‖w‖ = 1)
  const dists = $derived(mini.map((p) => (p.y ? 1 : -1) * (w[0] * p.x1 + w[1] * p.x2 + off)));
  const margin = $derived(Math.min(...dists));
  const nearest = $derived(new Set(mini.filter((_, i) => Math.abs(dists[i] - margin) < 1e-9).map((p) => p.id)));
  const best = $derived.by(() => {
    const r = svmTrain(mini.map((p) => [p.x1, p.x2] as [number, number]), mini.map((p) => (p.y ? 1 : -1)), 1000, 6000);
    const nw = Math.hypot(...r.w);
    return { ang: (Math.atan2(r.w[1], r.w[0]) * 180) / Math.PI, off: r.b / nw, margin: 1 / nw };
  });
  // Đường lề vẽ tại khoảng cách = lề hiện tại: dùng w' = w/margin để f = ±1 trùng lề
  const wScaled = $derived(margin > 0 ? ([w[0] / margin, w[1] / margin] as [number, number]) : w);
  const bScaled = $derived(margin > 0 ? off / margin : off);
</script>

<div class="lab">
  <p class="lab-title">Đường nào tách tốt nhất?</p>
  <p class="lab-hint">Xoay và dịch đường thẳng. Dải vàng là "lề": khoảng trống từ đường thẳng tới bệnh nhân gần nhất (các chấm có viền đen). SVM chọn đường thẳng có lề rộng nhất.</p>
  <div class="ctrl">
    <label>Góc <span class="num">{Math.round(ang)}°</span><input type="range" min="-90" max="90" step="0.5" bind:value={ang} aria-label="Góc" /></label>
    <label>Dịch <span class="num">{fmt(off, 2)}</span><input type="range" min="-3" max="3" step="0.01" bind:value={off} aria-label="Dịch" /></label>
    <button class="btn" type="button" onclick={() => { ang = best.ang; off = best.off; }}>Đặt đường có lề lớn nhất</button>
  </div>
  <div class="lab-grid">
    <MarginPlot points={mini} w={wScaled} b={bScaled} sv={margin > 0 ? nearest : new Set()} labels big unitMargin={margin > 0} />
    <div>
      {#if margin > 0}
        <p class="big">Lề hiện tại: <b class="num">{fmt(margin, 3)}</b></p>
        <p>Lề lớn nhất có thể: <b class="num">{fmt(best.margin, 3)}</b> {Math.abs(margin - best.margin) < 0.005 ? '— bạn đã tìm ra!' : ''}</p>
      {:else}
        <p class="big bad">Đường thẳng đang phân loại sai {dists.filter((d) => d < 0).length} bệnh nhân.</p>
      {/if}
      <table class="data">
        <thead><tr><th>BN</th><th>Chẩn đoán</th><th>Khoảng cách có dấu</th></tr></thead>
        <tbody>{#each mini as p, i}<tr class:on={nearest.has(p.id) && margin > 0}><td>{i + 1}</td><td class="t" style={`color:var(${p.y ? '--c-pos' : '--c-neg'})`}>{p.y ? 'ác tính' : 'lành tính'}</td><td class:neg={dists[i] < 0}>{fmt(dists[i], 3)}</td></tr>{/each}</tbody>
      </table>
      <p class="cap">Khoảng cách âm nghĩa là bệnh nhân nằm sai phía. Lề = khoảng cách nhỏ nhất. Hồi quy logistic không quan tâm tới lề: nó chỉ cần xác suất đúng chiều.</p>
    </div>
  </div>
</div>

<style>
  .big { font-size: 1.1rem; margin: 0 0 0.4rem; }
  .bad { color: var(--bad); }
  td.neg { color: var(--bad); }
  .cap { font-size: 0.86rem; color: var(--pencil); margin-top: 0.6rem; }
</style>
