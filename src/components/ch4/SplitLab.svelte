<script lang="ts">
  /** Tìm câu hỏi đầu tiên của cây: thử từng đặc trưng, từng ngưỡng, tính Gini sau khi chia. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { splitCandidates, gini, fmt, tex, type Row, type Calc } from '../../lib/ml-core';
  import { featName, condText } from '../../lib/titanic';

  let { rows }: { rows: Row[] } = $props();
  let f = $state(2);
  const cands = $derived(splitCandidates(rows, f));
  const bestIdx = $derived(cands.reduce((b, c, i) => (c.gini < cands[b].gini - 1e-12 ? i : b), 0));
  let ci = $state(0);
  $effect(() => { f; ci = bestIdx; });
  const c = $derived(cands[Math.min(ci, cands.length - 1)]);
  const tot = $derived([c.left[0] + c.right[0], c.left[1] + c.right[1]]);
  const g0 = $derived(gini(tot[0], tot[1]));
  const n = $derived(rows.length);
  const bestPer = $derived(featName.map((_, k) => { const cs = splitCandidates(rows, k); return cs.reduce((b, x) => (x.gini < b.gini - 1e-12 ? x : b), cs[0]); }));
  let which = $state<'left' | 'right' | 'w'>('w');
  const calc = $derived.by((): Calc => {
    const side = (s: [number, number], name: string): Calc => {
      const m = s[0] + s[1];
      return {
        key: name, name: `Gini nhánh ${name}`,
        formula: String.raw`G = 1 - p_{\text{sống}}^2 - p_{\text{mất}}^2`,
        substituted: String.raw`G = 1 - \left(\tfrac{${s[1]}}{${m}}\right)^2 - \left(\tfrac{${s[0]}}{${m}}\right)^2 = ${tex(gini(s[0], s[1]), 4)}`,
        value: gini(s[0], s[1]),
      };
    };
    if (which === 'left') return side(c.left, 'trái');
    if (which === 'right') return side(c.right, 'phải');
    const nl = c.left[0] + c.left[1], nr = c.right[0] + c.right[1];
    return {
      key: 'w', name: 'Gini sau khi chia (trung bình có trọng số)',
      formula: String.raw`G_{\text{chia}} = \frac{n_{\text{trái}}}{n}\,G_{\text{trái}} + \frac{n_{\text{phải}}}{n}\,G_{\text{phải}}`,
      substituted: String.raw`G_{\text{chia}} = \tfrac{${nl}}{${n}}\times${tex(gini(c.left[0], c.left[1]), 4)} + \tfrac{${nr}}{${n}}\times${tex(gini(c.right[0], c.right[1]), 4)} = ${tex(c.gini, 4)}`,
      value: c.gini,
      note: `Trước khi chia, Gini của cả nút là ${fmt(g0, 4)}. Mức giảm: ${fmt(g0 - c.gini, 4)}.`,
    };
  });

  const W = 520, H = 220, m = { t: 30, r: 14, b: 44, l: 52 };
  const sx = $derived(scaleLinear().domain([cands[0].thr, cands.at(-1)!.thr]).range([m.l, W - m.r]));
  const sy = $derived(scaleLinear().domain([Math.min(...cands.map((x) => x.gini)) - 0.01, g0 + 0.005]).range([H - m.b, m.t]));
  const path = $derived(cands.map((x, i) => `${i ? 'L' : 'M'}${sx(x.thr)},${sy(x.gini)}`).join(''));
  const pct = (s: [number, number]) => (s[0] + s[1] === 0 ? 0 : s[1] / (s[0] + s[1]));
</script>

<div class="lab">
  <p class="lab-title">Câu hỏi nào tách người sống và người mất tốt nhất?</p>
  <p class="lab-hint">{n} hành khách của tập huấn luyện, {tot[1]} người sống sót. Chọn một đặc trưng và một ngưỡng; cây sẽ hỏi "giá trị ≤ ngưỡng?" và chia hành khách thành hai nhánh. Gini đo độ "lẫn lộn" của mỗi nhánh: 0 là thuần một loại, 0,5 là lẫn lộn hoàn toàn.</p>
  <div class="ctrl" role="radiogroup" aria-label="Đặc trưng">
    {#each featName as name, k}<label><input type="radio" bind:group={f} value={k} /> {name}</label>{/each}
  </div>
  {#if cands.length > 1}
    <div class="ctrl"><label>Ngưỡng <input type="range" min="0" max={cands.length - 1} step="1" bind:value={ci} style="width:16rem" aria-label="Ngưỡng" /></label>
      <span class="num">{fmt(c.thr, 2)}</span>
      <button class="btn" type="button" onclick={() => (ci = bestIdx)}>Chọn ngưỡng tốt nhất</button></div>
  {/if}
  <div class="lab-grid">
    <div>
      <div class="split">
        {#each [['left', c.left, true], ['right', c.right, false]] as [key, s, isLeft]}
          {@const ss = s as [number, number]}
          <button class="branch" class:sel={which === key} type="button" onclick={() => (which = key as 'left' | 'right')}>
            <span class="cond">{condText(f, c.thr, isLeft as boolean)}</span>
            <span class="cnt">{ss[0] + ss[1]} người: <b style="color:var(--ok)">{ss[1]} sống</b>, <b style="color:var(--bad)">{ss[0]} mất</b></span>
            <span class="bar"><span style={`width:${pct(ss) * 100}%`}></span></span>
            <span class="g">Gini = <span class="num">{fmt(gini(ss[0], ss[1]), 4)}</span></span>
          </button>
        {/each}
      </div>
      <button class="chip wsum" class:sel={which === 'w'} type="button" onclick={() => (which = 'w')}>Gini sau khi chia = {fmt(c.gini, 4)}</button>
      {#if cands.length > 2}
        <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gini sau khi chia theo ngưỡng">
          <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={6} label={`Ngưỡng ${featName[f].toLowerCase()}`} />
          <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} ticks={4} label="Gini sau khi chia" />
          <path d={path} fill="none" stroke="var(--c-L)" stroke-width="2" />
          <circle cx={sx(cands[bestIdx].thr)} cy={sy(cands[bestIdx].gini)} r="5" fill="none" stroke="var(--ok)" stroke-width="2" />
          <circle cx={sx(c.thr)} cy={sy(c.gini)} r="6" fill="var(--tim)" />
        </svg>
      {/if}
    </div>
    <div>
      <CalcCard {calc} />
      <p class="h">Ngưỡng tốt nhất của từng đặc trưng</p>
      <table class="data">
        <thead><tr><th>Đặc trưng</th><th>Chia thành</th><th>Gini sau chia</th></tr></thead>
        <tbody>
          {#each bestPer as b, k}
            <tr class:on={k === f}><td class="t">{featName[k]}</td><td class="t wrapc">{condText(k, b.thr, true)} | {condText(k, b.thr, false)}</td><td>{fmt(b.gini, 4)}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  .branch { text-align: left; border: 1px solid var(--rule-2); background: var(--sheet); border-radius: 3px; padding: 0.6rem 0.7rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.88rem; color: var(--ink); }
  .branch.sel { border-color: var(--ink); box-shadow: inset 0 -3px 0 var(--hl); }
  .cond { font-weight: 700; font-size: 1rem; }
  .bar { height: 8px; background: color-mix(in srgb, var(--bad) 30%, transparent); }
  .bar span { display: block; height: 100%; background: var(--ok); }
  .g { color: var(--pencil); }
  .wsum { margin: 0.7rem 0; }
  .h { font-weight: 700; margin: 1rem 0 0.3rem; }
  .wrapc { white-space: normal !important; }
</style>
