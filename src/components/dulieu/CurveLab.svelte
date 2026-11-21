<script lang="ts">
  /** Nhiều hơn hay tốt hơn? Đường cong học trên California và bảng "ít mà sạch" so với "nhiều mà nhiễu" trên Breast Cancer. */
  import { scaleLog, scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { imputeMedian, randomSplit, standardize, linFit, linPredict, knnRegress, rmse, permutation, flipLabels, logregL2, probaOf, fmt } from '../../lib/ml-core';
  import { loadCalifornia, loadCancer30, houseFeatures, pick, type Cal, type Cancer30 } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let bc = $state.raw<Cancer30 | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); loadCancer30().then((c) => (bc = c)).catch((e) => (err = e.message)); });

  const NS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 16512];
  let pts = $state.raw<{ n: number; linTr: number; linVa: number; knnVa: number }[]>([]);
  $effect(() => {
    const c = cal;
    if (!c) return;
    const X = houseFeatures(c, imputeMedian(c.bedrooms));
    const sp = randomSplit(c.n, 0.2, 0);
    const yv = pick(c.value, sp.test);
    let k = 0, h = 0;
    const step = () => {
      const n = NS[k], tr = sp.train.slice(0, n), ytr = pick(c.value, tr);
      const coef = linFit(pick(X, tr), ytr);
      const cols = [c.lon, c.lat, c.income].map((a) => { const st = standardize(pick(a, tr)); return [Float64Array.from(pick(a, tr), (v) => (v - st.mu) / st.sd), Float64Array.from(pick(a, sp.test), (v) => (v - st.mu) / st.sd)]; });
      const knn = knnRegress(cols.map((q) => q[0]), ytr, cols.map((q) => q[1]), 10);
      pts = [...pts, { n, linTr: rmse(linPredict(coef, pick(X, tr)), ytr), linVa: rmse(linPredict(coef, pick(X, sp.test)), yv), knnVa: rmse(knn, yv) }];
      if (++k < NS.length) h = window.setTimeout(step, 20);
    };
    pts = [];
    h = window.setTimeout(step, 30);
    return () => clearTimeout(h);
  });

  const SIZES = [50, 100, 200, 455], NOISE = [0, 10, 20, 30];
  let grid = $state.raw<number[][] | null>(null);
  $effect(() => {
    const d = bc;
    if (!d) return;
    const h = setTimeout(() => {
      const test = new Set(d.testIds), tr = d.X.map((_, i) => i).filter((i) => !test.has(i));
      const st = d.features.map((_, j) => standardize(tr.map((i) => d.X[i][j])));
      const sc = (r: number[]) => r.map((v, j) => (v - st[j].mu) / st[j].sd);
      const order = permutation(tr.length, 5).map((k) => tr[k]);
      const Xt = d.testIds.map((i) => sc(d.X[i])), yt = d.testIds.map((i) => d.y[i]);
      grid = SIZES.map((n) => NOISE.map((p) => {
        const idx = order.slice(0, n), X = idx.map((i) => sc(d.X[i]));
        const f = flipLabels(idx.map((i) => d.y[i]), idx.map((_, k) => k), p / 100, 11);
        const th = logregL2(X, f.y, 1);
        return Xt.reduce((a, x, i) => a + ((probaOf(th, x) >= 0.5 ? 1 : 0) === yt[i] ? 1 : 0), 0) / yt.length;
      }));
    }, 60);
    return () => clearTimeout(h);
  });

  const W = 560, H = 292, m = { t: 26, r: 14, b: 44, l: 50 };
  const sx = scaleLog().domain([40, 20000]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0.3, 1.4]).range([H - m.b, m.t]).clamp(true);
  const line = (key: 'linTr' | 'linVa' | 'knnVa') => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.n)},${sy(p[key])}`).join('');
  const series = [{ k: 'linTr', name: 'tuyến tính, sai số huấn luyện', c: 'var(--faint)', dash: '5 4' }, { k: 'linVa', name: 'tuyến tính, sai số kiểm định', c: 'var(--tim)', dash: '' }, { k: 'knnVa', name: 'KNN, sai số kiểm định', c: 'var(--c-L)', dash: '' }] as const;
</script>

<div class="lab">
  <p class="lab-title">Nhiều dữ liệu hơn, hay dữ liệu tốt hơn?</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else}
    <h4>1. Đường cong học</h4>
    <p class="cap">Huấn luyện trên n khu vực đầu tiên của tập huấn luyện (đã xáo trộn), luôn kiểm định trên cùng 4.128 khu vực. Hai mô hình: hồi quy tuyến tính trên 11 đặc trưng như các phòng khác, và KNN theo vị trí và thu nhập.</p>
    <div class="lab-grid">
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sai số theo số mẫu huấn luyện">
        <Axis scale={sx as any} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Số khu vực huấn luyện (thang log)" ticks={10} format={(v) => ([50, 100, 500, 1000, 5000, 10000].includes(Math.round(Number(v))) ? Number(v).toLocaleString('vi-VN') : '')} />
        <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="RMSE (×100.000 USD)" ticks={5} />
        {#each series as s}<path d={line(s.k)} fill="none" stroke={s.c} stroke-width="2" stroke-dasharray={s.dash} />{#each pts as p}<circle cx={sx(p.n)} cy={sy(p[s.k])} r="3" fill={s.c} />{/each}{/each}
      </svg>
      <div>
        <ul class="key">{#each series as s}<li><span style={`background:${s.c}`}></span>{s.name}</li>{/each}</ul>
        <table class="data">
          <thead><tr><th>n</th><th>Tuyến tính</th><th>KNN</th></tr></thead>
          <tbody>{#each pts as p}<tr><td>{p.n.toLocaleString('vi-VN')}</td><td>{fmt(p.linVa, 3)}</td><td>{fmt(p.knnVa, 3)}</td></tr>{/each}</tbody>
        </table>
      </div>
    </div>
    <p class="cap">Đường tuyến tính phẳng hẳn từ khoảng 1.000 khu vực: sai số huấn luyện và kiểm định đã gặp nhau. Thêm 15.000 khu vực nữa cũng không giúp; muốn tốt hơn phải đổi đặc trưng hoặc mô hình. KNN thì vẫn tiếp tục giảm: với mô hình linh hoạt, thêm dữ liệu vẫn còn đáng giá.</p>

    <h4>2. Ít mà sạch, hay nhiều mà nhiễu?</h4>
    <p class="cap">Hồi quy logistic trên 30 đặc trưng sinh thiết. Mỗi ô: độ chính xác trên 114 mẫu test có nhãn đúng, khi học từ n mẫu mà p% nhãn bị lật.</p>
    {#if grid}
      <table class="data heat">
        <thead><tr><th>Số mẫu học \ nhãn bị lật</th>{#each NOISE as p}<th>{p}%</th>{/each}</tr></thead>
        <tbody>
          {#each SIZES as n, i}
            <tr><td>{n}</td>{#each grid[i] as a}<td style={`background:color-mix(in srgb, var(--tim) ${Math.round(Math.max(0, (a - 0.6) / 0.4) * 55)}%, transparent)`}>{fmt(100 * a, 1)}%</td>{/each}</tr>
          {/each}
        </tbody>
      </table>
      <p class="cap">So ô "{SIZES[1]} mẫu, 0%" ({fmt(100 * grid[1][0], 1)}%) với ô "{SIZES[3]} mẫu, 30%" ({fmt(100 * grid[3][3], 1)}%): {grid[1][0] >= grid[3][3] ? 'gấp hơn bốn lần dữ liệu vẫn không bù được cho 30% nhãn sai' : 'ở đây nhiều dữ liệu nhiễu vẫn thắng, nhưng chênh lệch nhỏ hơn nhiều so với công sức thu thập thêm'}. Trước khi đi thu thập thêm, hãy kiểm tra nhãn của những gì đang có.</p>
    {:else}<p class="cap">Đang học 16 mô hình…</p>{/if}
  {/if}
</div>

<style>
  .cap { font-size: 0.88rem; color: var(--pencil); }
  h4 { margin: 1.3rem 0 0.4rem; }
  .key { list-style: none; padding: 0; margin: 0 0 0.6rem; font-size: 0.85rem; }
  .key span { display: inline-block; width: 14px; height: 3px; margin-right: 0.5rem; vertical-align: middle; }
  .heat td { text-align: center; }
</style>
