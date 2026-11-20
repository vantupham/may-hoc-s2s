<script lang="ts">
  /**
   * Trang mở đầu: một phép tính Gradient Descent thật, "viết tay" trên vở ô ly.
   * Quả bóng lăn xuống đáy đường cong mất mát của 5 khu vực California, một lần khi trang tải.
   * Đây là chuyển động duy nhất tự chạy trên toàn trang.
   */
  import { scaleLinear } from 'd3';
  import { linearRegressionGD, mse, fmt } from '../lib/ml-core';

  interface House { income: number; value: number }
  let { houses }: { houses: House[] } = $props();
  const xs = houses.map((h) => h.income);
  const ys = houses.map((h) => h.value);
  const trace = linearRegressionGD(xs, ys, { lr: 0.01, epochs: 8, fitIntercept: false });
  const steps = trace.steps.map((s) => s.state);

  let k = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  function play() {
    clearInterval(timer);
    k = 0;
    timer = setInterval(() => {
      if (k >= steps.length - 1) clearInterval(timer);
      else k += 1;
    }, 650);
  }
  $effect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { k = steps.length - 1; return; }
    const t = setTimeout(play, 500);
    return () => { clearTimeout(t); clearInterval(timer); };
  });

  const W = 440, H = 300, m = { t: 20, r: 16, b: 34, l: 16 };
  const sw = scaleLinear().domain([-0.03, 0.66]).range([m.l, W - m.r]);
  const sL = scaleLinear().domain([0, 2.75]).range([H - m.b, m.t]);
  const curve = Array.from({ length: 81 }, (_, i) => -0.03 + (0.69 * i) / 80)
    .map((w, i) => `${i ? 'L' : 'M'}${sw(w).toFixed(1)},${sL(Math.min(2.7, mse(xs, ys, w, 0))).toFixed(1)}`)
    .join('');
  const st = $derived(steps[k]);
</script>

<figure class="sheet" aria-label="Ví dụ: Gradient Descent tìm hệ số w cho 5 khu vực nhà ở California">
  <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Quả bóng lăn xuống đáy đường cong mất mát">
    <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke="var(--ink)" stroke-opacity="0.6" />
    <text x={W - m.r} y={H - 10} text-anchor="end" class="ax">w</text>
    <text x={W - m.r} y={m.t + 4} text-anchor="end" class="ax">đường cong mất mát L(w)</text>
    <path d={curve} fill="none" stroke="var(--c-L)" stroke-width="2.5" stroke-linecap="round" />
    {#each steps.slice(0, k) as s, i}
      <path d={`M${sw(s.w)},${sL(s.loss)} L${sw(steps[i + 1].w)},${sL(steps[i + 1].loss)}`} stroke="var(--tim)" stroke-width="1.4" stroke-dasharray="3 3" fill="none" />
      <circle cx={sw(s.w)} cy={sL(s.loss)} r="3.5" fill="var(--tim)" opacity="0.5" />
      {#if i < 4}
        <text x={sw(s.w) + (i % 2 ? -8 : 8)} y={sL(s.loss) + (i % 2 ? 18 : -8)} text-anchor={i % 2 ? 'end' : 'start'} class="hw">{fmt(s.w, 2)}</text>
      {/if}
    {/each}
    <circle cx={sw(st.w)} cy={sL(st.loss)} r="9" fill="var(--c-w)" stroke="var(--sheet)" stroke-width="2.5" class="ball" />
  </svg>
  <figcaption>
    <p class="hand line">w ← w − η · ∂L/∂w</p>
    <p class="hand line num-line">w = {fmt(st.w, 3)} − 0,01 × ({fmt(st.dw, 2)}) = <b>{fmt(st.wNext, 3)}</b></p>
    <p class="cap">Vòng {k + 1}/{steps.length}: tìm hệ số <span class="v-w">w</span> sao cho giá nhà ≈ <span class="v-w">w</span> × thu nhập, trên 5 khu vực có thật ở California. Mất mát giảm từ {fmt(steps[0].loss, 2)} xuống <span class="v-L">{fmt(st.loss, 2)}</span>.</p>
    <button class="replay" type="button" onclick={play}>Chạy lại</button>
  </figcaption>
</figure>

<style>
  .sheet { margin: 0; background: var(--sheet); border: 1px solid var(--rule-2); padding: 1rem 1.1rem 0.9rem; transform: rotate(0.6deg); box-shadow: 4px 5px 0 var(--grid-2); }
  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .ax { font: italic 12px var(--serif); fill: var(--pencil); }
  .hw { font: 17px var(--hand); fill: var(--tim); }
  .ball { transition: cx 0.5s cubic-bezier(.3,.7,.4,1), cy 0.5s cubic-bezier(.3,.7,.4,1); }
  figcaption { margin-top: 0.4rem; }
  .line { margin: 0; font-size: 1.3rem; }
  .num-line b { font-weight: 400; background: var(--hl); padding: 0 0.15rem; }
  .cap { font-size: 0.86rem; color: var(--pencil); margin: 0.5rem 0 0.3rem; line-height: 1.55; }
  .replay { background: none; border: 0; padding: 0; color: var(--tim); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; font-size: 0.86rem; }
  @media (prefers-reduced-motion: reduce) { .ball { transition: none; } }
</style>
