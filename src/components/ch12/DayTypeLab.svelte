<script lang="ts">
  /**
   * Kiểu ngày (chương 7): hồ sơ 24 giờ của mỗi ngày (chia cho trung bình ngày để chỉ còn hình dạng) → PCA 2 chiều
   * (scikit-learn, học trên các ngày trước 1/11/2025) → K-means chạy ngay trên trình duyệt bằng ml-core.
   */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import StepDebugger from '../StepDebugger.svelte';
  import { kmeans, fmt, type P2 } from '../../lib/ml-core';

  interface Kinds { pca: { mean: number[]; comp: number[][]; var: number[] }; centers: number[][]; profiles: { d: string; k: number; c: number[] }[]; mean24: number[][]; count: number[] }
  let { kinds, test0 }: { kinds: Kinds; test0: string } = $props();
  const pts = $derived(kinds.profiles.filter((p) => p.d < test0));
  const X = $derived(pts.map((p) => p.c as P2));
  let K = $state(3);
  let seed = $state(0);
  // Tâm khởi tạo: K ngày lấy đều trong danh sách, dịch theo "lần chạy"
  const init = $derived(Array.from({ length: K }, (_, k) => X[(Math.floor(((k + 0.5) * X.length) / K) + seed * 37) % X.length]));
  const steps = $derived(kmeans(X, init, 60));
  let cur = $state(0);
  $effect(() => { K; seed; cur = 0; });
  const s = $derived(steps[Math.min(cur, steps.length - 1)]);
  const done = $derived(cur >= steps.length - 1);
  const col = ['var(--k0)', 'var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)'];
  // Số ngày của mỗi cụm theo tháng, tính lại theo nhãn hiện tại
  const months = $derived(Array.from({ length: K }, (_, k) => {
    const m = new Array(12).fill(0);
    pts.forEach((p, i) => { if (s.labels[i] === k) m[+p.d.slice(5, 7) - 1]++; });
    return m;
  }));

  const W = 400, H = 330, mg = { t: 30, r: 10, b: 42, l: 44 };
  const ext = (j: number) => [Math.min(...X.map((p) => p[j])), Math.max(...X.map((p) => p[j]))];
  const sx = $derived(scaleLinear().domain(ext(0)).nice().range([mg.l, W - mg.r]));
  const sy = $derived(scaleLinear().domain(ext(1)).nice().range([H - mg.b, mg.t]));
  // Hình dạng 24 giờ mà mỗi tâm cụm đại diện: mean + c1·comp1 + c2·comp2
  const shape = (c: P2) => kinds.pca.mean.map((m, h) => m + c[0] * kinds.pca.comp[0][h] + c[1] * kinds.pca.comp[1][h]);
  const PW = 400, PH = 200;
  const px = scaleLinear().domain([0, 23]).range([40, PW - 10]);
  const py = scaleLinear().domain([0.4, 1.8]).range([PH - 30, 26]);
</script>

<div class="lab">
  <p class="lab-title">Hà Nội có mấy "kiểu ngày"?</p>
  <p class="lab-hint">Mỗi chấm là một ngày đủ 24 giờ số liệu ({pts.length} ngày trước 1/11/2025). Ta chia 24 số đo cho trung bình của ngày đó, để chỉ còn <b>hình dạng</b> của ngày, rồi dùng PCA nén 24 chiều xuống 2. Hai thành phần chính giữ {fmt((kinds.pca.var[0] + kinds.pca.var[1]) * 100, 0)}% phương sai. Chạy K-means từng bước trên mặt phẳng này.</p>
  <div class="ctrl">
    <label>K = <b class="num">{K}</b><input type="range" min="2" max="5" bind:value={K} aria-label="Số cụm" /></label>
    <button class="btn" type="button" onclick={() => (seed += 1)}>Khởi tạo lại</button>
    <span>inertia = <b class="num">{fmt(s.inertia, 1)}</b>{done ? ' · đã hội tụ' : ''}</span>
  </div>
  <StepDebugger count={steps.length} bind:current={cur} label="Vòng" />
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Các ngày trên hai thành phần chính, tô màu theo cụm">
      <Axis scale={sx} orient="bottom" size={H - mg.t - mg.b} offset={H - mg.b} label="Thành phần chính 1" />
      <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label="Thành phần chính 2" />
      {#each X as p, i}<circle cx={sx(p[0])} cy={sy(p[1])} r="2.4" fill={col[s.labels[i]]} fill-opacity="0.55" />{/each}
      {#each s.centers as c, k}
        <path d={`M${sx(c[0]) - 7},${sy(c[1])}h14M${sx(c[0])},${sy(c[1]) - 7}v14`} stroke="var(--ink)" stroke-width="4" />
        <path d={`M${sx(c[0]) - 6},${sy(c[1])}h12M${sx(c[0])},${sy(c[1]) - 6}v12`} stroke={col[k]} stroke-width="2.2" />
      {/each}
    </svg>
    <div>
      <svg class="chart" viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="Hình dạng 24 giờ của mỗi tâm cụm">
        <Axis scale={py} orient="left" size={PW - 50} offset={40} label="so với TB ngày" ticks={4} />
        {#each [0, 6, 12, 18, 23] as h}<text x={px(h)} y={PH - 12} class="lbl" text-anchor="middle">{h}h</text>{/each}
        <line x1={40} x2={PW - 10} y1={py(1)} y2={py(1)} stroke="var(--rule-2)" />
        {#each s.centers as c, k}
          <path d={shape(c).map((v, h) => `${h ? 'L' : 'M'}${px(h)},${py(v)}`).join('')} fill="none" stroke={col[k]} stroke-width="2.2" />
        {/each}
      </svg>
      <table class="data">
        <thead><tr><th>Cụm</th><th>Số ngày</th><th>Tháng nhiều nhất</th></tr></thead>
        <tbody>
          {#each months as m, k}
            {@const top = m.map((v, i) => [v, i + 1]).sort((a, b) => b[0] - a[0]).slice(0, 3)}
            <tr><td style:color={col[k]}><b>{k + 1}</b></td><td>{s.labels.filter((l) => l === k).length}</td><td>{top.map(([, i]) => `T${i}`).join(', ')}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  <p class="cap">Đường bên phải là hình dạng 24 giờ mà mỗi tâm cụm đại diện, dựng ngược từ PCA: trên 1 là giờ bẩn hơn trung bình của ngày. Hãy tìm cụm có đỉnh về đêm (bụi bị giữ lại khi không khí lạnh đọng sát mặt đất) và cụm có đỉnh giờ cao điểm.</p>
</div>

<style>
  .lbl { font-size: 10.5px; fill: var(--faint); font-family: var(--mono); }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
