<script lang="ts">
  /** K-means từng bước trên 342 con chim cánh cụt: gán vào tâm gần nhất, rồi dời tâm về trung bình. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import StepDebugger from '../StepDebugger.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { kmeans, mulberry32, fmt, tex, texp, type P2, type Calc } from '../../lib/ml-core';

  interface B { id: number; len: number; dep: number; a: number; b: number; species: number }
  let { birds, initIdx, species, mean, std }: { birds: B[]; initIdx: number[]; species: string[]; mean: number[]; std: number[] } = $props();
  const X = $derived(birds.map((b) => [b.a, b.b] as P2));
  let K = $state(3);
  let seed = $state(0);
  const init = $derived.by(() => {
    if (seed === 0 && K === 3) return initIdx.map((i) => X[i]);
    const r = mulberry32(seed * 97 + K);
    const idx = new Set<number>();
    while (idx.size < K) idx.add(Math.floor(r() * X.length));
    return [...idx].map((i) => X[i]);
  });
  const steps = $derived(kmeans(X, init));
  // Mỗi vòng có 2 pha: gán (pha chẵn) và cập nhật tâm (pha lẻ)
  let cur = $state(0);
  $effect(() => { steps; cur = 0; });
  const it = $derived(Math.floor(cur / 2));
  const phase = $derived(cur % 2);
  const st = $derived(steps[Math.min(it, steps.length - 1)]);
  const shownCenters = $derived(phase === 0 ? st.centers : st.newCenters);
  let truth = $state(false);
  let pick = $state(0);
  const pb = $derived(birds[pick]);

  // Vẽ theo đơn vị gốc (mm), tâm cụm đổi ngược từ đơn vị chuẩn hoá
  const toMM = (p: P2): [number, number] => [p[0] * std[0] + mean[0], p[1] * std[1] + mean[1]];
  const W = 560, H = 400, m = { t: 30, r: 14, b: 44, l: 48 };
  const sx = scaleLinear().domain([31, 61]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([12.8, 21.8]).range([H - m.b, m.t]);
  const col = ['var(--k0)', 'var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--c-w)'];

  const calc = $derived.by((): Calc => {
    const p = X[pick];
    const ds = st.centers.map((c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2);
    const best = ds.indexOf(Math.min(...ds));
    return {
      key: 'd', name: `Con chim số ${pick}: khoảng cách (bình phương) tới từng tâm`,
      formula: String.raw`d_k^2 = (a - c_{k,a})^2 + (b - c_{k,b})^2, \quad \text{gán vào } \arg\min_k d_k^2`,
      substituted: String.raw`\begin{aligned} ${ds.map((d, k) => `d_${k + 1}^2 &= (${tex(p[0])} - ${texp(st.centers[k][0])})^2 + (${tex(p[1])} - ${texp(st.centers[k][1])})^2 = ${tex(d)}`).join(' \\\\ ')} \end{aligned}`,
      value: best,
      note: `Gần nhất là tâm ${best + 1}. (a, b là chiều dài và độ dày mỏ đã chuẩn hoá.)`,
    };
  });
</script>

<div class="lab">
  <p class="lab-title">K-means từng bước</p>
  <p class="lab-hint">Thuật toán không biết loài của con nào. Nó chỉ có số đo mỏ (đã chuẩn hoá) và số cụm K. Mỗi vòng có hai pha: <b>gán</b> mỗi con vào tâm gần nhất, rồi <b>cập nhật</b> mỗi tâm về trung bình các con trong cụm. Bấm một con chim để xem phép tính khoảng cách.</p>
  <div class="ctrl">
    <label>K = <span class="num">{K}</span><input type="range" min="2" max="6" bind:value={K} aria-label="Số cụm K" /></label>
    <button class="btn" type="button" onclick={() => (seed += 1)}>Khởi tạo tâm khác</button>
    <label><input type="checkbox" bind:checked={truth} /> Tô màu theo loài thật</label>
  </div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Chim cánh cụt theo số đo mỏ và các tâm cụm">
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Chiều dài mỏ (mm)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Độ dày mỏ (mm)" />
      {#each birds as b, i (b.id)}
        <circle cx={sx(b.len)} cy={sy(b.dep)} r={i === pick ? 6 : 3.6} fill={truth ? col[b.species] : col[st.labels[i]]} fill-opacity="0.7"
          stroke={i === pick ? 'var(--ink)' : 'none'} stroke-width="2" role="presentation" onclick={() => (pick = i)} style="cursor:pointer" />
      {/each}
      {#if phase === 1}
        {#each st.centers as c, k}
          {@const a = toMM(c)}
          {@const z = toMM(st.newCenters[k])}
          <line x1={sx(a[0])} y1={sy(a[1])} x2={sx(z[0])} y2={sy(z[1])} stroke={col[k]} stroke-width="2" stroke-dasharray="3 3" />
        {/each}
      {/if}
      {#each shownCenters as c, k}
        {@const a = toMM(c)}
        <g transform={`translate(${sx(a[0])},${sy(a[1])})`}>
          <path d="M-9,-9L9,9M-9,9L9,-9" stroke="var(--sheet)" stroke-width="6" />
          <path d="M-9,-9L9,9M-9,9L9,-9" stroke={col[k]} stroke-width="3.2" />
          <text x="11" y="-8" class="cn">{k + 1}</text>
        </g>
      {/each}
    </svg>
    <div>
      <p class="phase">Vòng {it + 1}, pha <b>{phase === 0 ? 'gán điểm vào tâm gần nhất' : 'dời tâm về trung bình cụm'}</b></p>
      <dl>
        <dt>Tổng bình phương khoảng cách tới tâm</dt><dd class="num v-L">{fmt(st.inertia, 3)}</dd>
        <dt>Số con đổi cụm ở pha gán này</dt><dd class="num">{st.moved}</dd>
        <dt>Hội tụ sau</dt><dd class="num">{steps.length} vòng</dd>
      </dl>
      <p class="sel">Con được chọn: mỏ dài {fmt(pb.len, 1)} mm, dày {fmt(pb.dep, 1)} mm, loài thật <i>{species[pb.species]}</i>.</p>
      <CalcCard {calc} />
    </div>
  </div>
  <StepDebugger count={steps.length * 2} bind:current={cur} label="Pha" interval={700} />
</div>

<style>
  .cn { font: 700 13px var(--serif); fill: var(--ink); }
  .phase { margin: 0 0 0.5rem; }
  dl { display: grid; grid-template-columns: 1fr auto; gap: 0.25rem 1rem; margin: 0 0 0.8rem; font-size: 0.9rem; }
  dt { color: var(--pencil); }
  dd { margin: 0; text-align: right; }
  .sel { font-size: 0.88rem; color: var(--pencil); }
</style>
