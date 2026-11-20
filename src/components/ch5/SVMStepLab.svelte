<script lang="ts">
  /** Tính tay SVM: mỗi bước, chỉ những bệnh nhân vi phạm lề mới kéo đường ranh giới. */
  import MarginPlot from './MarginPlot.svelte';
  import StepDebugger from '../StepDebugger.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { svmTrace, fmt } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number }
  let { mini }: { mini: P[] } = $props();
  const X = $derived(mini.map((p) => [p.x1, p.x2] as [number, number]));
  const Y = $derived(mini.map((p) => (p.y ? 1 : -1)));
  let C = $state(1);
  let current = $state(0);
  let selected = $state('gw0');
  const trace = $derived(svmTrace(X, Y, C, 60));
  $effect(() => { C; current = 0; });
  const step = $derived(trace[Math.min(current, trace.length - 1)]);
  const st = $derived(step.state);
  const calc = $derived(step.calcs.find((c) => c.key === selected) ?? step.calcs.find((c) => c.key === 'gw0')!);
  const viol = $derived(new Set(mini.filter((_, i) => st.margins[i] < 1).map((p) => p.id)));
</script>

<div class="lab">
  <p class="lab-title">SVM từng bước trên 6 bệnh nhân</p>
  <p class="lab-hint">Mỗi bước tính "lề" mᵢ = yᵢ·f(xᵢ) cho từng người (y = +1 nếu ác tính, −1 nếu lành tính). Người có m &lt; 1 là vi phạm: hoặc nằm sai phía, hoặc nằm trong dải lề. Chỉ họ đóng góp vào gradient. Chấm có viền đen là người đang vi phạm.</p>
  <div class="ctrl">
    <label>C
      <select bind:value={C} aria-label="Hệ số C">{#each [0.1, 1, 10] as c}<option value={c}>{fmt(c, c < 1 ? 1 : 0)}</option>{/each}</select>
    </label>
    <span class="num">w = ({fmt(st.w[0], 3)}, {fmt(st.w[1], 3)}), b = {fmt(st.b, 3)}, mục tiêu J = {fmt(st.obj, 3)}</span>
  </div>
  <div class="lab-grid">
    <MarginPlot points={mini} w={st.w} b={st.b} sv={viol} labels big />
    <div>
      <table class="data">
        <thead><tr><th>BN</th><th>y</th><th>lề m</th><th>hinge = max(0, 1 − m)</th></tr></thead>
        <tbody>
          {#each mini as p, i}
            <tr class:on={st.margins[i] < 1}>
              <td>{i + 1}</td><td style={`color:var(${p.y ? '--c-pos' : '--c-neg'})`}>{p.y ? '+1' : '−1'}</td>
              <td><button class="val" class:sel={selected === `m${i}`} onclick={() => (selected = `m${i}`)}>{fmt(st.margins[i], 3)}</button></td>
              <td class="v-L">{fmt(st.hinge[i], 3)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="chips">
        <button class="chip" class:sel={selected === 'gw0'} onclick={() => (selected = 'gw0')}>g_w₁ {fmt(st.gw[0], 4)}</button>
        <button class="chip" class:sel={selected === 'gb'} onclick={() => (selected = 'gb')}>g_b {fmt(st.gb, 4)}</button>
        <button class="chip" class:sel={selected === 'upd'} onclick={() => (selected = 'upd')}>cập nhật</button>
      </div>
      <CalcCard {calc} />
    </div>
  </div>
  <StepDebugger count={trace.length} bind:current label="Bước" interval={450} />
</div>
