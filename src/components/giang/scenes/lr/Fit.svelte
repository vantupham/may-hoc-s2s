<script lang="ts">
  /**
   * Cảnh chương 1: đám mây điểm (thu nhập, giá nhà) và đường ŷ = w·x + b.
   * Trạng thái s:
   *   w, b     tham số đường thẳng (nội suy được)
   *   line, res, cap, mean, split   độ hiện (0–1): đường thẳng, đoạn sai số, vạch chặn trần 5,0,
   *            điểm trung bình (x̄, ȳ), tô khác tập test
   *   only     'test': chỉ tính MSE trên tập test; mặc định tính trên mọi điểm (hoặc tập train khi split > 0)
   */
  import { scaleLinear } from 'd3';
  import Axis from '../../../Axis.svelte';
  import { mse, fmt } from '../../../../lib/ml-core';
  import { num } from '../reveal';

  let { xs, ys, test = [], xmax = 10, ymax = 5.4, dot = 3, s = {} }: {
    xs: number[]; ys: number[]; test?: number[]; xmax?: number; ymax?: number; dot?: number; s?: Record<string, unknown>;
  } = $props();

  const isTest = $derived(new Set(test));
  const w = $derived(num(s.w)), b = $derived(num(s.b));
  const split = $derived(num(s.split));
  const pick = (which: 'train' | 'test') => {
    const ix = xs.map((_, i) => i).filter((i) => (which === 'test') === isTest.has(i));
    return [ix.map((i) => xs[i]), ix.map((i) => ys[i])] as const;
  };
  const loss = $derived.by(() => {
    if (s.only === 'test') { const [a, c] = pick('test'); return mse(a, c, w, b); }
    if (split > 0.5) { const [a, c] = pick('train'); return mse(a, c, w, b); }
    return mse(xs, ys, w, b);
  });
  const mx = $derived(xs.reduce((a, v) => a + v, 0) / xs.length);
  const my = $derived(ys.reduce((a, v) => a + v, 0) / ys.length);

  const W = 900, H = 392, m = { t: 14, r: 20, b: 50, l: 60 };
  const sx = $derived(scaleLinear().domain([0, xmax]).range([m.l, W - m.r]));
  const sy = $derived(scaleLinear().domain([0, ymax]).range([H - m.b, m.t]));
</script>

<div class="sc">
  <div class="read num">
    <span><span class="v-w">w</span> = <b class="v-w">{fmt(w, 3)}</b></span>
    <span><span class="v-b">b</span> = <b class="v-b">{fmt(b, 3)}</b></span>
    <span>MSE{s.only === 'test' ? ' (test)' : split > 0.5 ? ' (train)' : ''} = <b class="v-L">{fmt(loss, 3)}</b></span>
  </div>
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Thu nhập và giá nhà">
    <defs><clipPath id="fit-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
    <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập x (×10.000 USD)" />
    <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Giá nhà y (×100.000 USD)" />
    <g clip-path="url(#fit-clip)">
      {#if num(s.cap) > 0}
        <rect x={m.l} y={sy(5.08)} width={W - m.l - m.r} height={sy(4.92) - sy(5.08)} fill="var(--bad)" opacity={0.18 * num(s.cap)} />
        <text x={W - m.r - 6} y={sy(5.08) - 6} text-anchor="end" class="note bad" opacity={num(s.cap)}>chặn trần 500.001 USD</text>
      {/if}
      {#if num(s.res) > 0}
        {#each xs as x, i}<line x1={sx(x)} x2={sx(x)} y1={sy(ys[i])} y2={sy(w * x + b)} stroke="var(--c-e)" stroke-width="1" opacity={0.55 * num(s.res)} />{/each}
      {/if}
      {#each xs as x, i}
        {@const t = isTest.has(i) && split > 0}
        {#if t}
          <rect x={sx(x) - dot - 1} y={sy(ys[i]) - dot - 1} width={2 * dot + 2} height={2 * dot + 2} fill="var(--c-yh)" opacity={0.35 + 0.6 * split} />
        {:else}
          <circle cx={sx(x)} cy={sy(ys[i])} r={dot} fill="var(--c-y)" opacity={0.6 - 0.25 * split} />
        {/if}
      {/each}
      <line x1={sx(0)} y1={sy(b)} x2={sx(xmax)} y2={sy(w * xmax + b)} stroke="var(--c-w)" stroke-width="3" opacity={num(s.line)} />
    </g>
    {#if num(s.mean) > 0}
      <g opacity={num(s.mean)}>
        <line x1={sx(mx)} x2={sx(mx)} y1={sy(my)} y2={H - m.b} stroke="var(--pencil)" stroke-dasharray="4 4" />
        <line x1={m.l} x2={sx(mx)} y1={sy(my)} y2={sy(my)} stroke="var(--pencil)" stroke-dasharray="4 4" />
        <circle cx={sx(mx)} cy={sy(my)} r="9" fill="none" stroke="var(--tim)" stroke-width="3" />
        <text x={sx(mx) + 14} y={sy(my) + 26} class="note tim">(x̄, ȳ) = ({fmt(mx, 2)}; {fmt(my, 2)})</text>
      </g>
    {/if}
    {#if split > 0}
      <g opacity={split} class="leg">
        <circle cx={W - 250} cy={m.t + 14} r="5" fill="var(--c-y)" /><text x={W - 238} y={m.t + 19}>train ({xs.length - test.length})</text>
        <rect x={W - 136} y={m.t + 8} width="12" height="12" fill="var(--c-yh)" /><text x={W - 118} y={m.t + 19}>test ({test.length})</text>
      </g>
    {/if}
  </svg>
</div>

<style>
  .sc { padding: 30px 20px 0 20px; }
  .read { display: flex; gap: 30px; justify-content: flex-end; padding-right: 40px; font-size: 22px; color: var(--pencil); height: 34px; }
  svg { font-family: var(--serif); overflow: visible; }
  svg :global(text) { font-size: 15px; fill: var(--pencil); }
  svg :global(.tick text) { font-family: var(--mono); fill: var(--pencil); }
  svg :global(.tick line) { stroke: var(--rule-2); }
  svg :global(.axis-label) { font-style: italic; fill: var(--pencil); }
  svg :global(.domain) { stroke: var(--ink); stroke-opacity: 0.7; }
  .note { font-size: 17px; }
  .bad { fill: var(--bad); }
  .tim { fill: var(--tim); font-family: var(--mono); }
  .leg text { font-size: 16px; fill: var(--ink); }
</style>
