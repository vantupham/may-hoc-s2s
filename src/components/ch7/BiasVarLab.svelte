<script lang="ts">
  /** Đánh đổi bias–variance: đa thức bậc thấp thì cứng nhắc, bậc cao thì "nhảy múa" theo từng mẫu dữ liệu. */
  import { scaleLinear, scaleLog } from 'd3';
  import Axis from '../Axis.svelte';
  import { polyFit, polyEval, mseOf, crossValPoly, mulberry32, fmt } from '../../lib/ml-core';

  interface R { id: number; income: number; value: number }
  let { sample, testIds }: { sample: R[]; testIds: number[] } = $props();
  const testSet = $derived(new Set(testIds));
  const tr = $derived(sample.filter((r) => !testSet.has(r.id)));
  const te = $derived(sample.filter((r) => testSet.has(r.id)));
  const x = $derived(tr.map((r) => r.income)), y = $derived(tr.map((r) => r.value));
  const xt = $derived(te.map((r) => r.income)), yt = $derived(te.map((r) => r.value));
  const mu = $derived(x.reduce((a, v) => a + v, 0) / x.length);
  const sd = $derived(Math.sqrt(x.reduce((a, v) => a + (v - mu) ** 2, 0) / x.length));

  let d = $state(1);
  const B = 20;
  const boots = $derived.by(() => {
    const r = mulberry32(77);
    return Array.from({ length: B }, () => {
      const idx = Array.from({ length: x.length }, () => Math.floor(r() * x.length));
      return polyFit(idx.map((i) => x[i]), idx.map((i) => y[i]), d, mu, sd);
    });
  });
  const main = $derived(polyFit(x, y, d, mu, sd));
  const table = $derived(Array.from({ length: 10 }, (_, i) => {
    const deg = i + 1;
    const c = polyFit(x, y, deg, mu, sd);
    const cv = crossValPoly(x, y, deg, 5, mu, sd);
    return { deg, train: mseOf(c, x, y, mu, sd), cv: cv.reduce((a, f) => a + f.mse, 0) / 5, test: mseOf(c, xt, yt, mu, sd) };
  }));

  const W = 520, H = 360, m = { t: 30, r: 14, b: 44, l: 44 };
  const sx = scaleLinear().domain([0, 15.5]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([-0.5, 5.6]).range([H - m.b, m.t]);
  const pathOf = (c: number[]) => Array.from({ length: 160 }, (_, i) => 0.3 + i * 0.095).map((v, i) => `${i ? 'L' : 'M'}${sx(v)},${sy(Math.max(-1, Math.min(6.5, polyEval(c, v, mu, sd))))}`).join('');

  const W2 = 440, H2 = 300, n2 = { t: 30, r: 70, b: 40, l: 56 };
  const cx = scaleLinear().domain([1, 10]).range([n2.l, W2 - n2.r]);
  const cy = $derived(scaleLog().domain([0.6, Math.max(2, ...table.map((t) => t.cv)) * 1.2]).range([H2 - n2.b, n2.t]));
  const line = (k: 'train' | 'cv' | 'test') => table.map((t, i) => `${i ? 'L' : 'M'}${cx(t.deg)},${cy(t[k])}`).join('');
</script>

<div class="lab">
  <p class="lab-title">Bias và variance: mô hình thay đổi bao nhiêu khi dữ liệu thay đổi?</p>
  <p class="lab-hint">Đường đen: đa thức học trên cả 320 khu vực. Các đường mờ: cùng mô hình, học trên 20 mẫu lấy lại có lặp (bootstrap) từ chính 320 khu vực đó. Đường mờ toả rộng nghĩa là mô hình rất nhạy với dữ liệu cụ thể — variance cao.</p>
  <div class="ctrl"><label>Bậc đa thức d = <span class="num">{d}</span><input type="range" min="1" max="10" bind:value={d} aria-label="Bậc đa thức" /></label></div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Các đường đa thức trên mẫu bootstrap">
      <defs><clipPath id="bv-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập (×10.000 USD)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Giá nhà (×100.000 USD)" />
      <g clip-path="url(#bv-clip)">
        {#each x as v, i}<circle cx={sx(v)} cy={sy(y[i])} r="2.4" fill="var(--c-y)" fill-opacity="0.35" />{/each}
        {#each boots as c}<path d={pathOf(c)} fill="none" stroke="var(--tim)" stroke-opacity="0.28" stroke-width="1.2" />{/each}
        <path d={pathOf(main)} fill="none" stroke="var(--ink)" stroke-width="2.5" />
      </g>
    </svg>
    <div>
      <svg class="chart" viewBox={`0 0 ${W2} ${H2}`} role="img" aria-label="MSE huấn luyện, cross-validation và test theo bậc đa thức">
        <Axis scale={cx} orient="bottom" size={H2 - n2.t - n2.b} offset={H2 - n2.b} ticks={10} label="Bậc d" />
        <Axis scale={cy as any} orient="left" size={W2 - n2.l - n2.r} offset={n2.l} ticks={4} label="MSE (thang log)" format={(v) => (v >= 10 ? String(Math.round(v)) : String(+v.toFixed(1)).replace('.', ','))} />
        <path d={line('train')} fill="none" stroke="var(--pencil)" stroke-width="2" stroke-dasharray="5 3" />
        <path d={line('test')} fill="none" stroke="var(--k1)" stroke-width="2" />
        <path d={line('cv')} fill="none" stroke="var(--tim)" stroke-width="2.5" />
        <text x={W2 - n2.r + 6} y={cy(table[9].train) + 9} class="lbl">train</text>
        <text x={W2 - n2.r + 6} y={cy(table[9].test) - 6} class="lbl" fill="var(--k1)">test</text>
        <text x={W2 - n2.r + 6} y={cy(table[9].cv)} class="lbl" fill="var(--tim)">CV</text>
        <line x1={cx(d)} x2={cx(d)} y1={n2.t} y2={H2 - n2.b} stroke="var(--ink)" stroke-opacity="0.35" />
      </svg>
      <p class="cap">Bậc {d}: MSE huấn luyện <b class="num">{fmt(table[d - 1].train, 4)}</b>, cross-validation <b class="num">{fmt(table[d - 1].cv, table[d - 1].cv > 100 ? 0 : 4)}</b>, test <b class="num">{fmt(table[d - 1].test, 4)}</b>.</p>
    </div>
  </div>
</div>

<style>
  .lbl { font: italic 12px var(--serif); fill: var(--pencil); dominant-baseline: middle; }
  .cap { font-size: 0.9rem; color: var(--pencil); }
</style>
