<script lang="ts">
  /** Lan truyền xuôi và ngược trên mạng 2 → 3 → 1, từng phép tính một, với số đo thật của một bệnh nhân. */
  import StepDebugger from '../StepDebugger.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { tinyPass, tinyCalcs, tinyUpdate, fmt, type Tiny } from '../../lib/ml-core';

  interface P { id: number; x1: number; x2: number; y: number; radius: number; texture: number }
  let { patients, init }: { patients: P[]; init: Tiny } = $props();
  let net = $state<Tiny>(JSON.parse(JSON.stringify(init)));
  let pi = $state(0);
  let iter = $state(0);
  let history = $state<number[]>([]);
  const lr = 0.5;
  const pt = $derived(patients[pi]);
  const x = $derived([pt.x1, pt.x2] as [number, number]);
  const r = $derived(tinyPass(net, x, pt.y));
  const calcs = $derived(tinyCalcs(net, x, pt.y, r, lr));
  let cur = $state(0);
  $effect(() => { pi; iter; cur = 0; });
  const c = $derived(calcs[Math.min(cur, calcs.length - 1)]);
  const focus = $derived(new Set(c.focus));
  const back = $derived(c.phase !== 'xuôi');
  const shown = $derived(new Set(calcs.slice(0, cur + 1).map((k) => k.key)));

  function apply() {
    history = [...history, r.loss];
    net = tinyUpdate(net, r, lr);
    iter += 1;
  }
  function reset() { net = JSON.parse(JSON.stringify(init)); iter = 0; history = []; }

  // Bố cục sơ đồ
  const W = 580, H = 360;
  const X0 = 70, X1 = 300, X2 = 500;
  const yIn = [125, 235], yH = [70, 180, 290], yO = 180;
  const val = (v: number) => fmt(v, 3);
</script>

<div class="lab">
  <p class="lab-title">Một mạng nơ-ron nhỏ, từng phép tính một</p>
  <p class="lab-hint">2 đầu vào (bán kính, độ nhám đã chuẩn hoá) → 3 nơ-ron ẩn dùng tanh → 1 đầu ra dùng sigmoid. Bấm ▶ để đi qua từng phép tính: trước tiên là <b>lan truyền xuôi</b> (tính dự đoán), sau đó là <b>lan truyền ngược</b> (tính gradient của từng trọng số). Cuối cùng, cập nhật mọi trọng số.</p>
  <div class="ctrl">
    <label>Bệnh nhân
      <select bind:value={pi} aria-label="Bệnh nhân">{#each patients as p, i}<option value={i}>{i + 1}: {p.y ? 'ác tính' : 'lành tính'}</option>{/each}</select>
    </label>
    <button class="btn primary" type="button" onclick={apply}>Áp dụng cập nhật (η = 0,5)</button>
    <button class="btn" type="button" onclick={reset}>Về trọng số ban đầu</button>
    <span>Đã cập nhật <b class="num">{iter}</b> lần{history.length ? `; mất mát lần trước ${fmt(history.at(-1)!, 4)}` : ''}</span>
  </div>
  <div class="lab-grid">
    <svg class="chart net" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sơ đồ mạng nơ-ron với các giá trị">
      {#each yH as yh, j}
        {#each yIn as yi, i}
          {@const on = focus.has(`e${i}-${j}`)}
          <line x1={X0} y1={yi} x2={X1} y2={yh} stroke={on ? (back ? 'var(--c-g)' : 'var(--c-w)') : 'var(--rule-2)'} stroke-width={on ? 3 : 1.4} />
          <text x={X0 + (X1 - X0) * 0.6} y={yi + (yh - yi) * 0.6 + (i ? 13 : -5)} class="wt" fill={on ? 'var(--ink)' : 'var(--faint)'}>{fmt(net.W1[j][i], 2)}</text>
        {/each}
        {@const on2 = focus.has(`f${j}`)}
        <line x1={X1} y1={yh} x2={X2} y2={yO} stroke={on2 ? (back ? 'var(--c-g)' : 'var(--c-w)') : 'var(--rule-2)'} stroke-width={on2 ? 3 : 1.4} />
        <text x={X1 + (X2 - X1) * 0.5} y={yh + (yO - yh) * 0.5 - 6} class="wt" fill={on2 ? 'var(--ink)' : 'var(--faint)'}>v{j + 1} = {fmt(net.w2[j], 2)}</text>
      {/each}
      {#each yIn as yi, i}
        <g class:on={focus.has(`x${i}`)}>
          <circle cx={X0} cy={yi} r="30" class="node in" />
          <text x={X0} y={yi + 5} class="nv">{fmt(x[i], 2)}</text>
          <text x={X0} y={yi - 38} class="nl">{i ? 'độ nhám x₂' : 'bán kính x₁'}</text>
        </g>
      {/each}
      {#each yH as yh, j}
        <g class:on={focus.has(`h${j}`)}>
          <circle cx={X1} cy={yh} r="38" class="node" />
          {#if back && shown.has(`dz1${j}`)}
            <text x={X1} y={yh - 14} class="sub">δ</text><text x={X1} y={yh + 2} class="nv g">{fmt(r.dz1[j], 3)}</text>
          {:else if shown.has(`a1${j}`)}
            <text x={X1} y={yh - 14} class="sub">a</text><text x={X1} y={yh + 2} class="nv">{val(r.a1[j])}</text>
          {:else if shown.has(`z1${j}`)}
            <text x={X1} y={yh - 14} class="sub">z</text><text x={X1} y={yh + 2} class="nv">{val(r.z1[j])}</text>
          {/if}
          <text x={X1} y={yh + 22} class="sub">tanh</text>
        </g>
      {/each}
      <g class:on={focus.has('o')}>
        <circle cx={X2} cy={yO} r="40" class="node out" />
        {#if back && shown.has('dz2')}
          <text x={X2} y={yO - 14} class="sub">δ</text><text x={X2} y={yO + 2} class="nv g">{fmt(r.dz2, 3)}</text>
        {:else if shown.has('z2')}
          <text x={X2} y={yO - 14} class="sub">p</text><text x={X2} y={yO + 2} class="nv">{val(r.p)}</text>
        {/if}
        <text x={X2} y={yO + 22} class="sub">sigmoid</text>
        <text x={X2} y={yO + 62} class="nl">thật: y = {pt.y} ({pt.y ? 'ác tính' : 'lành tính'})</text>
      </g>
      <text x="8" y={H - 8} class="phase">Đang ở: lan truyền <tspan font-weight="700">{c.phase === 'cập nhật' ? 'xong, chờ cập nhật' : c.phase}</tspan></text>
    </svg>
    <div>
      <CalcCard calc={c} />
      <p class="lossline">Mất mát hiện tại <b class="num v-L">{fmt(r.loss, 4)}</b>, dự đoán p = <b class="num v-p">{fmt(r.p, 4)}</b>.</p>
    </div>
  </div>
  <StepDebugger count={calcs.length} bind:current={cur} label="Phép tính" interval={900} />
</div>

<style>
  .net .node { fill: var(--sheet); stroke: var(--ink); stroke-width: 1.4; }
  .net .node.in { fill: var(--paper); }
  .net g.on .node { stroke: var(--tim); stroke-width: 3; fill: var(--tim-soft); }
  .nv { font: 600 12.5px var(--mono); fill: var(--ink); text-anchor: middle; }
  .nv.g { fill: var(--c-g); }
  .sub { font: italic 11px var(--serif); fill: var(--pencil); text-anchor: middle; }
  .nl { font: 12px var(--serif); fill: var(--pencil); text-anchor: middle; }
  .wt { font: 11px var(--mono); }
  .phase { font: 12.5px var(--serif); fill: var(--pencil); }
  .lossline { font-size: 0.9rem; margin-top: 0.8rem; }
</style>
