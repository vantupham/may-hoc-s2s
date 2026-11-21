<script lang="ts">
  /**
   * Cảnh chương 1: bản đồ đồng mức của mất mát L(w, b) và quỹ đạo Gradient Descent xuất phát từ (0, 0).
   * Trạng thái s: eta (chuỗi, đổi ngay), k (số vòng đã chạy, nội suy giữa hai vòng), star (độ hiện của đáy).
   * Bên phải: mất mát theo vòng lặp, để thấy mất mát đã phẳng mà (w, b) vẫn còn xa đáy.
   */
  import { scaleLinear, contours } from 'd3';
  import Axis from '../../../Axis.svelte';
  import { linearRegressionGD, ols, mse, fmt } from '../../../../lib/ml-core';
  import { num } from '../reveal';

  let { xs, ys, dw = [-0.15, 0.9], db = [-0.6, 1.6], epochs = 300, xlab = 'w', note = '', s = {} }: {
    xs: number[]; ys: number[]; dw?: number[]; db?: number[]; epochs?: number; xlab?: string; note?: string; s?: Record<string, unknown>;
  } = $props();

  const eta = $derived(Number(s.eta ?? 0.02));
  const tr = $derived(linearRegressionGD(xs, ys, { lr: eta, epochs, detail: false }));
  const pts = $derived([[0, 0], ...tr.steps.map((st) => [st.state.wNext, st.state.bNext])] as number[][]);
  const losses = $derived([...tr.steps.map((st) => st.state.loss), mse(xs, ys, pts.at(-1)![0], pts.at(-1)![1])]);
  const k = $derived(Math.max(0, Math.min(pts.length - 1, num(s.k))));
  const ki = $derived(Math.floor(k));
  const cur = $derived(ki >= pts.length - 1 ? pts[ki] : [0, 1].map((j) => pts[ki][j] + (pts[ki + 1][j] - pts[ki][j]) * (k - ki)));
  const best = $derived(ols(xs, ys));
  const Lcur = $derived(mse(xs, ys, cur[0], cur[1]));
  const reached = $derived(pts.findIndex(([w, b]) => Math.hypot(w - best.w, b - best.b) < 0.01));

  const W = 560, H = 420, m = { t: 14, r: 14, b: 50, l: 58 };
  const sw = $derived(scaleLinear().domain(dw).range([m.l, W - m.r]));
  const sb = $derived(scaleLinear().domain(db).range([H - m.b, m.t]));
  const NX = 90, NY = 70;
  const paths = $derived.by(() => {
    const g = new Array(NX * NY);
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++) g[j * NX + i] = mse(xs, ys, dw[0] + ((dw[1] - dw[0]) * i) / (NX - 1), db[0] + ((db[1] - db[0]) * j) / (NY - 1));
    const minL = mse(xs, ys, best.w, best.b);
    const levels = Array.from({ length: 14 }, (_, q) => minL * (1 + 0.04 * Math.pow(1.75, q)));
    return contours().size([NX, NY]).thresholds(levels)(g).map((c) =>
      c.coordinates.flatMap((poly) => poly.map((ring) => ring.map(([gx, gy], q) => `${q ? 'L' : 'M'}${sw(dw[0] + ((dw[1] - dw[0]) * (gx - 0.5)) / (NX - 1))},${sb(db[0] + ((db[1] - db[0]) * (gy - 0.5)) / (NY - 1))}`).join('') + 'Z')).join(''),
    );
  });
  const trail = $derived([...pts.slice(0, ki + 1), cur].map(([w, b], q) => `${q ? 'L' : 'M'}${sw(w)},${sb(b)}`).join(''));

  // Mất mát theo vòng
  const W2 = 340;
  const kmax = $derived(Math.max(10, Math.ceil(num(s.kmax, epochs))));
  const lx = $derived(scaleLinear().domain([0, kmax]).range([m.l, W2 - m.r]));
  const ly = $derived(scaleLinear().domain([0, Math.max(...losses.slice(0, 3)) * 1.05]).range([H - m.b, m.t]));
  const lpath = $derived(losses.slice(0, Math.min(ki, kmax) + 1).map((l, q) => `${q ? 'L' : 'M'}${lx(q)},${ly(Math.min(l, ly.domain()[1]))}`).join(''));
</script>

<div class="sc">
  <div class="read num">
    <span><span class="v-w">w</span> = <b class="v-w">{fmt(cur[0], 3)}</b></span>
    <span><span class="v-b">b</span> = <b class="v-b">{fmt(cur[1], 3)}</b></span>
    <span><span class="v-L">L</span> = <b class="v-L">{Lcur > 1000 ? Math.round(Lcur).toLocaleString('vi-VN') : fmt(Lcur, 3)}</b></span>
    <span>vòng <b>{ki}</b></span>
    <span><span class="v-eta">η</span> = <b class="v-eta">{String(eta).replace('.', ',')}</b></span>
  </div>
  <div class="two">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Bản đồ đồng mức của mất mát">
      <defs><clipPath id="ct-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
      <Axis scale={sw} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={6} label={xlab} />
      <Axis scale={sb} orient="left" size={W - m.l - m.r} offset={m.l} ticks={6} label="b" />
      <g clip-path="url(#ct-clip)">
        {#each paths as d, q}<path {d} fill="none" stroke="var(--c-L)" stroke-width="1.3" opacity={0.85 - q * 0.045} />{/each}
        <path d={trail} fill="none" stroke="var(--c-w)" stroke-width="2.2" />
        <circle cx={sw(cur[0])} cy={sb(cur[1])} r="7" fill="var(--c-w)" stroke="var(--sheet)" stroke-width="2" />
      </g>
      <text x={sw(best.w)} y={sb(best.b) + 7} text-anchor="middle" class="star" opacity={num(s.star, 1)}>★</text>
      {#if note}<text x={W - m.r - 6} y={m.t + 18} text-anchor="end" class="nt">{note}</text>{/if}
    </svg>
    <svg viewBox={`0 0 ${W2} ${H}`} width={W2} height={H} role="img" aria-label="Mất mát theo vòng lặp">
      <Axis scale={lx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={4} label="vòng" format={(v) => String(v)} />
      <Axis scale={ly} orient="left" size={W2 - m.l - m.r} offset={m.l} ticks={5} label="L" />
      <path d={lpath} fill="none" stroke="var(--c-L)" stroke-width="2.5" />
      <text x={W2 - m.r} y={m.t + 18} text-anchor="end" class="nt">tới sát đáy: {reached >= 0 ? `${reached} bước` : `> ${epochs} bước`}</text>
    </svg>
  </div>
</div>

<style>
  .sc { padding: 30px 10px 0 20px; }
  .read { display: flex; gap: 26px; justify-content: flex-end; padding-right: 30px; font-size: 21px; color: var(--pencil); height: 34px; }
  .two { display: flex; gap: 6px; }
  svg { font-family: var(--serif); overflow: visible; }
  svg :global(text) { font-size: 15px; fill: var(--pencil); }
  svg :global(.tick text) { font-family: var(--mono); fill: var(--pencil); }
  svg :global(.tick line) { stroke: var(--rule-2); }
  svg :global(.axis-label) { font-style: italic; fill: var(--pencil); }
  svg :global(.domain) { stroke: var(--ink); stroke-opacity: 0.7; }
  .star { font-size: 24px; fill: var(--ok); }
  .nt { font-size: 16px; fill: var(--ink); }
</style>
