<script lang="ts">
  /** Chọn K bằng "khuỷu tay", và DBSCAN: cụm theo mật độ, có điểm nhiễu. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { kmeans, dbscan, mulberry32, fmt, type P2 } from '../../lib/ml-core';

  interface B { id: number; len: number; dep: number; a: number; b: number; species: number }
  let { birds, species }: { birds: B[]; species: string[] } = $props();
  const X = $derived(birds.map((b) => [b.a, b.b] as P2));
  // Với mỗi K, chạy 10 lần khởi tạo ngẫu nhiên, giữ lần tốt nhất
  const elbow = $derived(Array.from({ length: 8 }, (_, i) => {
    const K = i + 1;
    const r = mulberry32(1000 + K);
    let best = Infinity;
    for (let t = 0; t < 10; t++) {
      const idx = new Set<number>();
      while (idx.size < K) idx.add(Math.floor(r() * X.length));
      best = Math.min(best, kmeans(X, [...idx].map((j) => X[j])).at(-1)!.inertia);
    }
    return best;
  }));
  const W = 420, H = 240, m = { t: 30, r: 14, b: 40, l: 52 };
  const ex = scaleLinear().domain([1, 8]).range([m.l, W - m.r]);
  const ey = $derived(scaleLinear().domain([0, elbow[0] * 1.05]).range([H - m.b, m.t]));

  let eps = $state(0.28);
  let minPts = $state(5);
  const db = $derived(dbscan(X, eps, minPts));
  const W2 = 520, H2 = 380, m2 = { t: 30, r: 14, b: 44, l: 48 };
  const sx = scaleLinear().domain([31, 61]).range([m2.l, W2 - m2.r]);
  const sy = scaleLinear().domain([12.8, 21.8]).range([H2 - m2.b, m2.t]);
  const col = ['var(--k0)', 'var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--c-w)', 'var(--c-b)', 'var(--c-g)'];
  const noise = $derived(db.labels.filter((l) => l < 0).length);
  // Bảng: mỗi cụm DBSCAN gồm bao nhiêu con của từng loài
  const table = $derived(Array.from({ length: db.nClusters }, (_, c) => species.map((_, s) => birds.filter((b, i) => db.labels[i] === c && b.species === s).length)));
</script>

<div class="lab">
  <p class="lab-title">Chọn số cụm, và một cách phân cụm khác</p>
  <div class="lab-grid">
    <div>
      <p class="h">"Khuỷu tay": tổng bình phương khoảng cách theo K</p>
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tổng bình phương khoảng cách tới tâm theo số cụm K">
        <Axis scale={ex} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={8} label="K" />
        <Axis scale={ey} orient="left" size={W - m.l - m.r} offset={m.l} ticks={4} label="Tổng bình phương" />
        <path d={elbow.map((v, i) => `${i ? 'L' : 'M'}${ex(i + 1)},${ey(v)}`).join('')} fill="none" stroke="var(--c-L)" stroke-width="2.2" />
        {#each elbow as v, i}<circle cx={ex(i + 1)} cy={ey(v)} r={i === 2 ? 6 : 3.5} fill={i === 2 ? 'var(--tim)' : 'var(--c-L)'} />{/each}
      </svg>
      <p class="cap">Thêm cụm luôn làm tổng giảm (K = số con thì tổng bằng 0). Ta tìm chỗ đường cong "gập khuỷu": sau K = 3, mỗi cụm thêm chỉ giảm được ít. Tính trong trình duyệt: mỗi K chạy 10 lần khởi tạo, giữ lần tốt nhất.</p>
    </div>
    <div>
      <p class="h">DBSCAN: cụm là vùng dày đặc</p>
      <div class="ctrl">
        <label>eps <span class="num">{fmt(eps, 2)}</span><input type="range" min="0.12" max="0.5" step="0.01" bind:value={eps} aria-label="Bán kính eps" /></label>
        <label>minPts <span class="num">{minPts}</span><input type="range" min="2" max="12" step="1" bind:value={minPts} aria-label="Số điểm tối thiểu" style="width:6rem" /></label>
      </div>
      <svg class="chart" viewBox={`0 0 ${W2} ${H2}`} role="img" aria-label="Kết quả DBSCAN">
        <Axis scale={sx} orient="bottom" size={H2 - m2.t - m2.b} offset={H2 - m2.b} label="Chiều dài mỏ (mm)" />
        <Axis scale={sy} orient="left" size={W2 - m2.l - m2.r} offset={m2.l} label="Độ dày mỏ (mm)" />
        {#each birds as b, i (b.id)}
          {#if db.labels[i] < 0}
            <path d={`M${sx(b.len) - 3},${sy(b.dep) - 3}l6,6m0,-6l-6,6`} stroke="var(--faint)" stroke-width="1.5" />
          {:else}
            <circle cx={sx(b.len)} cy={sy(b.dep)} r={db.core[i] ? 3.8 : 2.6} fill={col[db.labels[i] % col.length]} fill-opacity={db.core[i] ? 0.8 : 0.45} />
          {/if}
        {/each}
      </svg>
      <p class="res">{db.nClusters} cụm, {noise} điểm nhiễu (dấu ×). Chấm lớn là điểm lõi, chấm nhỏ là điểm biên.</p>
      {#if db.nClusters > 0 && db.nClusters <= 6}
        <table class="data">
          <thead><tr><th>Cụm</th>{#each species as s}<th>{s}</th>{/each}</tr></thead>
          <tbody>{#each table as row, c}<tr><td style={`color:${col[c]}`}>{c + 1}</td>{#each row as v}<td>{v}</td>{/each}</tr>{/each}</tbody>
        </table>
      {/if}
    </div>
  </div>
</div>

<style>
  .h { font-weight: 700; margin: 0 0 0.4rem; }
  .cap, .res { font-size: 0.88rem; color: var(--pencil); }
</style>
