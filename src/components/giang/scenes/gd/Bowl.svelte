<script lang="ts">
  /**
   * Cảnh chương 0: bên trái các căn nhà và đường ŷ = w·x (sai số, hình vuông e²), bên phải cái bát L(w).
   * Trạng thái s:
   *   w        hệ số khi không chạy Gradient Descent
   *   line, res, sq, bowl, lab, star, tan   độ hiện (0–1) của đường thẳng, đoạn sai số, hình vuông, cái bát,
   *            nhãn số căn, mốc w*, tiếp tuyến
   *   hl       căn đang nói (−1: không)
   *   gd       1: w lấy từ Gradient Descent; k = số vòng đã chạy (nội suy giữa hai vòng), eta = tốc độ học (chuỗi)
   */
  import { scaleLinear } from 'd3';
  import Axis from '../../../Axis.svelte';
  import { linearRegressionGD, mse, fmt } from '../../../../lib/ml-core';
  import { num } from '../reveal';

  let { xs, ys, xmax = 6.5, ymax = 3, wmin = -0.3, wmax = 1.1, labels = [], dot = 7, s = {} }: {
    xs: number[]; ys: number[]; xmax?: number; ymax?: number; wmin?: number; wmax?: number; labels?: string[]; dot?: number;
    s?: Record<string, unknown>;
  } = $props();

  const eta = $derived(Number(s.eta ?? 0.01));
  const gd = $derived(num(s.gd) > 0.5);
  /** Vị trí w qua các vòng: ws[0] = điểm xuất phát, ws[k] = sau vòng k */
  const ws = $derived.by(() => {
    if (!gd) return [0];
    const t = linearRegressionGD(xs, ys, { lr: eta, epochs: 120, fitIntercept: false, detail: false });
    return [0, ...t.steps.map((st) => st.state.wNext)];
  });
  const k = $derived(Math.max(0, Math.min(ws.length - 1, num(s.k))));
  const ki = $derived(Math.floor(k));
  const w = $derived(gd ? (ki >= ws.length - 1 ? ws[ki] : ws[ki] + (ws[ki + 1] - ws[ki]) * (k - ki)) : num(s.w));
  const loss = $derived(mse(xs, ys, w, 0));
  const n = $derived(xs.length);
  const slope = $derived((2 / n) * xs.reduce((a, x, i) => a + (w * x - ys[i]) * x, 0));
  const wStar = $derived(xs.reduce((a, x, i) => a + x * ys[i], 0) / xs.reduce((a, x) => a + x * x, 0));
  const hl = $derived(Math.round(num(s.hl, -1)));

  // Khung trái: dữ liệu
  const W = 560, H = 400, m = { t: 20, r: 16, b: 52, l: 58 };
  const sx = $derived(scaleLinear().domain([0, xmax]).range([m.l, W - m.r]));
  const sy = $derived(scaleLinear().domain([0, ymax]).range([H - m.b, m.t]));
  const px = (v: number) => sy(0) - sy(v);

  // Khung phải: cái bát
  const W2 = 370;
  const lw = $derived(scaleLinear().domain([wmin, wmax]).range([m.l, W2 - m.r]));
  const curve = $derived(Array.from({ length: 121 }, (_, i) => wmin + ((wmax - wmin) * i) / 120).map((v) => [v, mse(xs, ys, v, 0)] as const));
  const maxL = $derived(Math.max(...curve.map((c) => c[1])));
  const ll = $derived(scaleLinear().domain([0, maxL * 1.04]).range([H - m.b, m.t]));
  const path = $derived(curve.map(([a, l], i) => `${i ? 'L' : 'M'}${lw(a)},${ll(l)}`).join(''));
  const clampW = (v: number) => Math.max(wmin, Math.min(wmax, v));
  const clampL = (v: number) => ll(Math.min(v, maxL * 1.04));
  const trail = $derived(gd ? [...ws.slice(0, ki + 1), w] : []);
  const off = $derived(w < wmin || w > wmax);
</script>

<div class="sc">
  <div class="read num">
    <span><span class="v-w">w</span> = <b class="v-w">{fmt(w, 4)}</b></span>
    <span><span class="v-L">L</span> = <b class="v-L">{Math.abs(loss) >= 1000 ? Math.round(loss).toLocaleString('vi-VN') : fmt(loss, 3)}</b></span>
    {#if gd}<span>vòng <b>{ki}</b></span><span><span class="v-eta">η</span> = <b class="v-eta">{fmt(eta, 3).replace(/0+$/, '')}</b></span>{/if}
  </div>
  <div class="two">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Dữ liệu và đường dự đoán">
      <defs><clipPath id="bowl-clip-a"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập x (×10.000 USD)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Giá nhà y (×100.000 USD)" />
      <g clip-path="url(#bowl-clip-a)">
        {#if num(s.sq) > 0}
          {#each xs as x, i}
            {@const e = w * x - ys[i]}
            <rect x={sx(x)} y={sy(Math.max(w * x, ys[i]))} width={px(Math.abs(e))} height={px(Math.abs(e))} fill="var(--c-e)" fill-opacity={0.13 * num(s.sq)} stroke="var(--c-e)" stroke-opacity={0.5 * num(s.sq)} />
          {/each}
        {/if}
        {#if num(s.res) > 0}
          {#each xs as x, i}<line x1={sx(x)} x2={sx(x)} y1={sy(ys[i])} y2={sy(w * x)} stroke="var(--c-e)" stroke-width="2" opacity={num(s.res)} />{/each}
        {/if}
        <line x1={sx(0)} y1={sy(0)} x2={sx(xmax)} y2={sy(w * xmax)} stroke="var(--c-w)" stroke-width="3" opacity={num(s.line)} />
      </g>
      {#each xs as x, i}
        <circle cx={sx(x)} cy={sy(ys[i])} r={hl === i ? dot + 4 : dot} fill="var(--c-y)" stroke={hl === i ? 'var(--le)' : 'var(--sheet)'} stroke-width={hl === i ? 3 : dot > 4 ? 1.5 : 0.6} fill-opacity={dot > 4 ? 1 : 0.6} />
        {#if labels[i] && num(s.lab) > 0}<text x={sx(x) + 10} y={sy(ys[i]) - 10} class="ptlab" opacity={num(s.lab)}>{labels[i]}</text>{/if}
      {/each}
    </svg>
    <svg viewBox={`0 0 ${W2} ${H}`} width={W2} height={H} role="img" aria-label="Đồ thị mất mát theo w" style:opacity={num(s.bowl)}>
      <defs><clipPath id="bowl-clip-b"><rect x={m.l} y={m.t - 10} width={W2 - m.l - m.r} height={H - m.t - m.b + 10} /></clipPath></defs>
      <Axis scale={lw} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={5} label="w" />
      <Axis scale={ll} orient="left" size={W2 - m.l - m.r} offset={m.l} ticks={5} label="L(w)" />
      <g clip-path="url(#bowl-clip-b)">
        <path d={path} fill="none" stroke="var(--c-L)" stroke-width="3" />
        {#if num(s.star) > 0}
          <line x1={lw(wStar)} x2={lw(wStar)} y1={m.t} y2={H - m.b} stroke="var(--ok)" stroke-dasharray="5 4" opacity={num(s.star)} />
          <text x={lw(wStar) + 6} y={m.t + 16} class="star" opacity={num(s.star)}>w* = {fmt(wStar, 3)}</text>
        {/if}
        {#if trail.length > 1}
          <polyline points={trail.map((v) => `${lw(clampW(v))},${clampL(mse(xs, ys, v, 0))}`).join(' ')} fill="none" stroke="var(--c-w)" stroke-width="1.6" stroke-dasharray="4 3" opacity="0.8" />
          {#each trail.slice(0, -1) as v}<circle cx={lw(clampW(v))} cy={clampL(mse(xs, ys, v, 0))} r="3.5" fill="var(--c-w)" opacity="0.55" />{/each}
        {/if}
        {#if num(s.tan) > 0 && !off}
          {@const dx = 0.16}
          <line x1={lw(w - dx)} y1={ll(loss - slope * dx)} x2={lw(w + dx)} y2={ll(loss + slope * dx)} stroke="var(--c-g)" stroke-width="2.5" opacity={num(s.tan)} />
        {/if}
        <circle cx={lw(clampW(w))} cy={clampL(loss)} r="9" fill="var(--c-w)" stroke="var(--sheet)" stroke-width="2.5" />
      </g>
      {#if off}<text x={w > wmax ? W2 - m.r - 4 : m.l + 4} y={m.t + 4} text-anchor={w > wmax ? 'end' : 'start'} class="off">{w > wmax ? 'vượt khỏi khung →' : '← vượt khỏi khung'}</text>{/if}
    </svg>
  </div>
</div>

<style>
  .sc { padding: 30px 10px 0 18px; }
  .read { display: flex; gap: 30px; justify-content: flex-end; padding-right: 40px; font-size: 22px; color: var(--pencil); height: 34px; }
  .read b { font-weight: 650; }
  .two { display: flex; gap: 6px; }
  .ptlab { font-family: var(--hand); font-size: 22px; fill: var(--tim); }
  .star { font-size: 16px; fill: var(--ok); font-family: var(--mono); }
  .off { font-size: 15px; fill: var(--bad); }
  /* Trục vẽ bằng Axis.svelte: màu lấy từ token để đọc rõ cả trên giấy trắng lẫn bảng đen */
  svg { font-family: var(--serif); overflow: visible; }
  svg :global(text) { font-size: 15px; fill: var(--pencil); }
  svg :global(.tick text) { font-family: var(--mono); fill: var(--pencil); }
  svg :global(.tick line) { stroke: var(--rule-2); }
  svg :global(.axis-label) { font-style: italic; fill: var(--pencil); }
  svg :global(.domain) { stroke: var(--ink); stroke-opacity: 0.7; }
</style>
