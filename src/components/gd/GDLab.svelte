<script lang="ts">
  /**
   * Tính tay Gradient Descent một biến trên 5 căn nhà.
   * Trái: quả bóng lăn trên đường cong mất mát, đường tiếp tuyến cho thấy đạo hàm là độ dốc.
   * Phải: bảng tính từng dòng và phép tính cập nhật, đọc trực tiếp từ trace của ml-core.
   */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import StepDebugger from '../StepDebugger.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { linearRegressionGD, mse, fmt, calcOf } from '../../lib/ml-core';

  interface House { income: number; value: number }
  let { houses }: { houses: House[] } = $props();
  const xs = $derived(houses.map((h) => h.income));
  const ys = $derived(houses.map((h) => h.value));

  const rates = [0.002, 0.01, 0.03, 0.05, 0.065, 0.07];
  let lr = $state(0.01);
  let w0 = $state(0);
  let current = $state(0);
  let selected = $state('dw');

  const trace = $derived(linearRegressionGD(xs, ys, { lr, w0, epochs: 25, fitIntercept: false }));
  const step = $derived(trace.steps[Math.min(current, trace.steps.length - 1)]);
  const st = $derived(step.state);
  const calc = $derived(calcOf(step, selected) ?? calcOf(step, 'dw')!);
  $effect(() => { lr; w0; current = 0; });

  // Quỹ đạo: (w_k, L_k) và điểm sau cập nhật
  const pts = $derived(trace.steps.map((s) => [s.state.w, s.state.loss] as const));
  const diverged = $derived(pts.length > 3 && pts.at(-1)![1] > pts[0][1] * 1.5);
  const wMin = $derived(Math.max(-2.5, Math.min(-0.2, ...pts.slice(0, current + 2).map((p) => p[0])) - 0.1));
  const wMax = $derived(Math.min(3.5, Math.max(1, ...pts.slice(0, current + 2).map((p) => p[0])) + 0.1));

  const W = 460, H = 340, m = { t: 30, r: 14, b: 44, l: 52 };
  const sw = $derived(scaleLinear().domain([wMin, wMax]).range([m.l, W - m.r]));
  const curve = $derived(Array.from({ length: 121 }, (_, k) => wMin + ((wMax - wMin) * k) / 120).map((v) => [v, mse(xs, ys, v, 0)] as const));
  const sL = $derived(scaleLinear().domain([0, Math.max(...curve.map((c) => c[1])) * 1.05]).range([H - m.b, m.t]));
  const curvePath = $derived(curve.map(([a, l], k) => `${k ? 'L' : 'M'}${sw(a)},${sL(l)}`).join(''));
  const trail = $derived(pts.slice(0, current + 1).map(([a, l], k) => `${k ? 'L' : 'M'}${sw(a)},${sL(l)}`).join(''));
  const tanHalf = $derived((wMax - wMin) * 0.12);

  const pick = (k: string) => () => (selected = k);
</script>

<div class="lab">
  <p class="lab-title">Gradient Descent từng bước trên 5 căn nhà</p>
  <p class="lab-hint">Mỗi vòng lặp: tính dự đoán → tính sai số → tính độ dốc <span class="v-g">∂L/∂w</span> → bước ngược chiều độ dốc. Bấm vào bất kỳ số nào trong bảng để xem nó được tính ra sao.</p>
  <div class="ctrl">
    <label>Tốc độ học <span class="v-eta"><b>η</b></span>
      <select bind:value={lr} aria-label="Tốc độ học">
        {#each rates as r}<option value={r}>{fmt(r, 3)}</option>{/each}
      </select>
    </label>
    <label>Điểm xuất phát <span class="v-w">w₀</span> = <span class="num">{fmt(w0, 2)}</span>
      <input type="range" min="-0.5" max="1.2" step="0.05" bind:value={w0} aria-label="Điểm xuất phát" />
    </label>
  </div>
  {#if diverged}<p class="note warn">Tốc độ học quá lớn: mỗi bước nhảy vượt quá đáy và mất mát <b>tăng</b> dần. Thuật toán đang <b>phân kỳ</b>.</p>{/if}
  <div class="lab-grid">
    <div>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Quả bóng lăn trên đường cong mất mát">
        <defs><clipPath id="gd-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
        <Axis scale={sw} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="w" />
        <Axis scale={sL} orient="left" size={W - m.l - m.r} offset={m.l} label="Mất mát L(w)" />
        <g clip-path="url(#gd-clip)">
          <path d={curvePath} fill="none" stroke="var(--c-L)" stroke-width="2.5" />
          <path d={trail} fill="none" stroke="var(--c-w)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8" />
          {#each pts.slice(0, current) as [a, l]}
            <circle cx={sw(a)} cy={sL(l)} r="3.5" fill="var(--c-w)" opacity="0.45" />
          {/each}
          <line x1={sw(st.w - tanHalf)} y1={sL(st.loss - st.dw * tanHalf)} x2={sw(st.w + tanHalf)} y2={sL(st.loss + st.dw * tanHalf)} stroke="var(--c-g)" stroke-width="2.5" />
          <line x1={sw(st.wNext)} x2={sw(st.wNext)} y1={m.t} y2={H - m.b} stroke="var(--c-w)" stroke-dasharray="2 4" opacity="0.6" />
          <circle cx={sw(st.w)} cy={sL(st.loss)} r="8" fill="var(--c-w)" stroke="var(--sheet)" stroke-width="2" />
        </g>
      </svg>
      <p class="legend"><span class="sw" style="background:var(--c-g)"></span>tiếp tuyến: độ dốc = <span class="v-g">∂L/∂w</span><span class="gap"></span><span class="sw dash"></span>vị trí <span class="v-w">w</span> ở vòng sau</p>
    </div>
    <div>
      <div class="table-scroll">
        <table class="data">
          <thead><tr><th>Căn</th><th><span class="v-x">x</span></th><th><span class="v-y">y</span></th><th><span class="v-yh">ŷ = w·x</span></th><th><span class="v-e">e = ŷ − y</span></th><th><span class="v-e">e</span>·<span class="v-x">x</span></th></tr></thead>
          <tbody>
            {#each xs as x, i}
              <tr>
                <td>{i + 1}</td>
                <td class="v-x">{fmt(x, 2)}</td>
                <td class="v-y">{fmt(ys[i], 3)}</td>
                <td><button class="val v-yh" class:sel={selected === `pred${i}`} onclick={pick(`pred${i}`)}>{fmt(st.preds[i], 3)}</button></td>
                <td><button class="val v-e" class:sel={selected === `err${i}`} onclick={pick(`err${i}`)}>{fmt(st.errors[i], 3)}</button></td>
                <td>{fmt(st.errors[i] * x, 3)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="chips">
        <button class="chip" class:sel={selected === 'loss'} onclick={pick('loss')}><span class="v-L">L</span> = <span class="num">{fmt(st.loss, 4)}</span></button>
        <button class="chip" class:sel={selected === 'dw'} onclick={pick('dw')}><span class="v-g">∂L/∂w</span> = <span class="num">{fmt(st.dw, 4)}</span></button>
        <button class="chip" class:sel={selected === 'wNext'} onclick={pick('wNext')}><span class="v-w">w mới</span> = <span class="num">{fmt(st.wNext, 4)}</span></button>
      </div>
      <CalcCard {calc} />
    </div>
  </div>
  <StepDebugger count={trace.steps.length} bind:current />
</div>

<style>
  .legend { font-size: 0.8rem; color: var(--pencil); margin: 0.3rem 0 0; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
  .sw { display: inline-block; width: 18px; height: 3px; border-radius: 2px; }
  .gap { width: 1rem; }
  .sw.dash { background: repeating-linear-gradient(90deg, var(--c-w) 0 3px, transparent 3px 6px); }
</style>
