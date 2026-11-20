<script lang="ts">
  /** Tính tay hồi quy logistic trên 6 bệnh nhân thật: z → p → mất mát → gradient → cập nhật. */
  import ProbMap from './ProbMap.svelte';
  import StepDebugger from '../StepDebugger.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { logisticRegressionGD, fmt, calcOf } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number; radius: number; texture: number }
  let { patients }: { patients: P[] } = $props();
  const X = $derived(patients.map((p) => [p.x1, p.x2] as [number, number]));
  const Y = $derived(patients.map((p) => p.y));

  const rates = [0.1, 0.5, 1, 3];
  let lr = $state(1);
  let current = $state(0);
  let selected = $state('gw0');
  const trace = $derived(logisticRegressionGD(X, Y, { lr, epochs: 40 }));
  const step = $derived(trace.steps[Math.min(current, trace.steps.length - 1)]);
  const st = $derived(step.state);
  const calc = $derived(calcOf(step, selected) ?? calcOf(step, 'gw0')!);
  $effect(() => { lr; current = 0; });
  const pick = (k: string) => () => (selected = k);
</script>

<div class="lab">
  <p class="lab-title">Hồi quy logistic từng bước — 6 bệnh nhân thật</p>
  <p class="lab-hint">3 ác tính (<span style="color:var(--c-pos)">đỏ</span>) và 3 lành tính (<span style="color:var(--c-neg)">xanh</span>). Ở vòng 1, mọi trọng số bằng 0 nên mọi <span class="v-p">p</span> = 0,5 — mô hình hoàn toàn phân vân. Bấm vào các số để xem phép tính.</p>
  <div class="ctrl">
    <label>Tốc độ học <span class="v-eta"><b>η</b></span>
      <select bind:value={lr} aria-label="Tốc độ học">{#each rates as r}<option value={r}>{fmt(r, 1)}</option>{/each}</select>
    </label>
    <span class="num"><span class="v-w">w</span> = ({fmt(st.w[0], 3)}, {fmt(st.w[1], 3)}) · <span class="v-b">b</span> = {fmt(st.b, 3)}</span>
  </div>
  <div class="lab-grid">
    <div><ProbMap points={patients} w={st.w} b={st.b} labels big /></div>
    <div>
      <div class="table-scroll">
        <table class="data">
          <thead><tr><th>BN</th><th><span class="v-x">x₁</span></th><th><span class="v-x">x₂</span></th><th><span class="v-y">y</span></th><th><span class="v-z">z</span></th><th><span class="v-p">p</span></th><th><span class="v-L">ℓ</span></th></tr></thead>
          <tbody>
            {#each patients as p, i}
              <tr>
                <td>{i + 1}</td><td class="v-x">{fmt(p.x1, 2)}</td><td class="v-x">{fmt(p.x2, 2)}</td>
                <td style={`color:var(${p.y ? '--c-pos' : '--c-neg'});font-weight:600`}>{p.y}</td>
                <td><button class="val v-z" class:sel={selected === `z${i}`} onclick={pick(`z${i}`)}>{fmt(st.z[i], 2)}</button></td>
                <td><button class="val v-p" class:sel={selected === `p${i}`} onclick={pick(`p${i}`)}>{fmt(st.probs[i], 3)}</button></td>
                <td><button class="val v-L" class:sel={selected === `l${i}`} onclick={pick(`l${i}`)}>{fmt(st.losses[i], 3)}</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="chips">
        <button class="chip" class:sel={selected === 'loss'} onclick={pick('loss')}><span class="v-L">L</span> {fmt(st.loss, 4)}</button>
        <button class="chip" class:sel={selected === 'gw0'} onclick={pick('gw0')}><span class="v-g">∂L/∂w₁</span> {fmt(st.gw[0], 4)}</button>
        <button class="chip" class:sel={selected === 'gw1'} onclick={pick('gw1')}><span class="v-g">∂L/∂w₂</span> {fmt(st.gw[1], 4)}</button>
        <button class="chip" class:sel={selected === 'gb'} onclick={pick('gb')}><span class="v-g">∂L/∂b</span> {fmt(st.gb, 4)}</button>
        <button class="chip" class:sel={selected === 'wNext0'} onclick={pick('wNext0')}><span class="v-w">w₁ mới</span> {fmt(st.wNext[0], 3)}</button>
        <button class="chip" class:sel={selected === 'wNext1'} onclick={pick('wNext1')}><span class="v-w">w₂ mới</span> {fmt(st.wNext[1], 3)}</button>
        <button class="chip" class:sel={selected === 'bNext'} onclick={pick('bNext')}><span class="v-b">b mới</span> {fmt(st.bNext, 3)}</button>
      </div>
      <CalcCard {calc} />
    </div>
  </div>
  <StepDebugger count={trace.steps.length} bind:current interval={500} />
</div>

<style>
</style>
