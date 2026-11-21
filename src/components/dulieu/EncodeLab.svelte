<script lang="ts">
  /** Mã hoá cột chữ và đưa các cột về cùng thang đo: ảnh hưởng lên sai số và lên tốc độ hội tụ của Gradient Descent. */
  import { scaleLinear, scaleLog } from 'd3';
  import Axis from '../Axis.svelte';
  import { imputeMedian, oneHot, standardize, minMax, log1p, skewness, histogram, permutation, chunks, linFit, linPredict, rmse, fmt } from '../../lib/ml-core';
  import { loadCalifornia, houseFeatures, pick, oceanVi, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });

  // --- Mã hoá ---
  let enc = $state.raw<Record<string, number> | null>(null);
  // --- Thang đo và Gradient Descent ---
  const CAP = 3000;
  let gd = $state.raw<{ k: string; name: string; iters: number; curve: number[] }[] | null>(null);

  $effect(() => {
    const c = cal;
    if (!c) return;
    const h = setTimeout(() => {
      const bed = imputeMedian(c.bedrooms), folds = chunks(permutation(c.n, 42), 5);
      const cv = (X: number[][]) => folds.reduce((s, te) => { const inF = new Set(te), tr = [...Array(c.n).keys()].filter((i) => !inF.has(i)); return s + rmse(linPredict(linFit(pick(X, tr), pick(c.value, tr)), pick(X, te)), pick(c.value, te)); }, 0) / folds.length;
      enc = { onehot: cv(houseFeatures(c, bed, 'onehot')), ordinal: cv(houseFeatures(c, bed, 'ordinal')), none: cv(houseFeatures(c, bed, 'none')) };

      const rows = permutation(c.n, 8).slice(0, 2000);
      const raw = [c.income, c.rooms, c.pop].map((a) => pick(a, rows));
      const y = pick(c.value, rows);
      const variants = [
        { k: 'raw', name: 'giữ nguyên', cols: raw },
        { k: 'mm', name: 'min-max về [0, 1]', cols: raw.map((a) => minMax(a).z) },
        { k: 'z', name: 'chuẩn hoá z', cols: raw.map((a) => standardize(a).z) },
      ];
      gd = variants.map((v) => {
        const n = y.length, d = v.cols.length + 1;
        const A = Array.from({ length: n }, (_, i) => [1, ...v.cols.map((col) => col[i])]);
        // Ma trận Hessian H = (2/n) AᵀA; bước học 1/λmax đảm bảo không phân kỳ
        const H = Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, b) => (2 / n) * A.reduce((s, r) => s + r[a] * r[b], 0)));
        let u = new Array(d).fill(1), lam = 0;
        for (let it = 0; it < 200; it++) { const w = H.map((r) => r.reduce((s, x, j) => s + x * u[j], 0)); lam = Math.hypot(...w); u = w.map((x) => x / lam); }
        const opt = linFit(A.map((r) => r.slice(1)), y), lossOpt = rmse(linPredict(opt, A.map((r) => r.slice(1))), y) ** 2;
        let th = new Array(d).fill(0), iters = CAP;
        const curve: number[] = [];
        for (let it = 0; it < CAP; it++) {
          const g = new Array(d).fill(0); let loss = 0;
          for (let i = 0; i < n; i++) { const r = A[i]; let e = -y[i]; for (let j = 0; j < d; j++) e += th[j] * r[j]; loss += e * e; for (let j = 0; j < d; j++) g[j] += (2 / n) * e * r[j]; }
          loss /= n;
          if (it % 10 === 0) curve.push(Math.max(1e-6, loss - lossOpt));
          if (loss - lossOpt < 1e-3 * lossOpt) { iters = it; curve.push(Math.max(1e-6, loss - lossOpt)); break; }
          th = th.map((t, j) => t - g[j] / lam);
        }
        return { k: v.k, name: v.name, iters, curve };
      });
    }, 30);
    return () => clearTimeout(h);
  });

  const ex = $derived(cal ? (() => { const p = permutation(cal.n, 12); const out: number[] = []; for (const i of p) { if (!out.some((j) => cal!.ocean[j] === cal!.ocean[i]) && cal.ocean[i] !== 4) out.push(i); if (out.length === 4) break; } return out; })() : []);
  const oh = $derived(cal ? oneHot(ex.map((i) => cal!.ocean[i]), cal.cats.length) : []);

  const popRaw = $derived(cal ? cal.pop : []);
  const popLog = $derived(cal ? log1p(cal.pop) : []);
  const hRaw = $derived(cal ? histogram(popRaw, 30, 0, 8000) : []);
  const hLog = $derived(cal ? histogram(popLog, 30, 1, 11) : []);

  const W = 520, H = 242, m = { t: 26, r: 14, b: 42, l: 54 };
  const gx = scaleLinear().domain([0, CAP]).range([m.l, W - m.r]);
  const gy = scaleLog().domain([1e-4, 10]).range([H - m.b, m.t]).clamp(true);
  const col = { raw: 'var(--c-L)', mm: 'var(--ok)', z: 'var(--tim)' } as Record<string, string>;
  const W2 = 260, H2 = 140;
  const bar = (h: number[]) => { const mx = Math.max(...h); return h.map((v, k) => ({ x: 6 + k * ((W2 - 12) / h.length), h: ((H2 - 28) * v) / mx })); };
</script>

<div class="lab">
  <p class="lab-title">Mã hoá và thang đo</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else}
    <h4>1. Cột chữ "vị trí so với biển"</h4>
    <div>
      <div class="tw"><table class="data">
        <thead><tr><th>Vị trí</th><th>Số thứ tự</th>{#each cal.cats.slice(0, 4) as c}<th>{oceanVi[c]}</th>{/each}</tr></thead>
        <tbody>
          {#each ex as i, r}<tr><td>{oceanVi[cal.cats[cal.ocean[i]]]}</td><td>{cal.ocean[i]}</td>{#each oh[r].slice(0, 4) as v}<td class:one={v === 1}>{v}</td>{/each}</tr>{/each}
        </tbody>
      </table></div>
      <div class="encres">
        {#if enc}
          <table class="data">
            <thead><tr><th>Cách mã hoá</th><th>RMSE (CV 5 phần)</th></tr></thead>
            <tbody>
              <tr><td>Bỏ cột vị trí</td><td>{fmt(enc.none, 4)}</td></tr>
              <tr><td>Số thứ tự 0–4</td><td>{fmt(enc.ordinal, 4)}</td></tr>
              <tr><td>One-hot</td><td><b>{fmt(enc.onehot, 4)}</b></td></tr>
            </tbody>
          </table>
        {:else}<p class="cap">Đang tính…</p>{/if}
      </div>
    </div>
    <p class="cap">Đánh số thứ tự bắt mô hình tuyến tính tin rằng "gần vịnh" (3) nằm giữa "gần biển" (2) và "trên đảo" (4), cách "nội địa" (1) đúng hai bước. Thứ tự đó do ta bịa ra, nên mô hình gần như không dùng được cột này: sai số bằng với khi bỏ hẳn cột. One-hot cho mỗi loại một hệ số riêng.</p>

    <h4>2. Thang đo và Gradient Descent</h4>
    <p class="cap">Hồi quy giá nhà theo thu nhập (cỡ 1–15), số phòng (cỡ hàng nghìn) và dân số (cỡ hàng nghìn), trên 2.000 khu vực. Gradient Descent với bước học lớn nhất mà vẫn an toàn, dừng khi mất mát chỉ còn cách tối ưu 0,1%.</p>
    {#if gd}
      <div class="lab-grid">
        <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mất mát còn thừa theo số vòng lặp với ba cách đưa về thang đo">
          <Axis scale={gx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Vòng lặp" ticks={6} />
          <Axis scale={gy as any} orient="left" size={W - m.l - m.r} offset={m.l} label="Mất mát còn thừa (thang log)" ticks={5} format={(v) => (v >= 1 ? String(v) : v.toExponential(0).replace('e', 'e'))} />
          {#each gd as g}
            <path d={g.curve.map((v, i) => `${i ? 'L' : 'M'}${gx(Math.min(g.iters, i * 10))},${gy(v)}`).join('')} fill="none" stroke={col[g.k]} stroke-width="2" />
          {/each}
        </svg>
        <table class="data">
          <thead><tr><th>Thang đo</th><th>Số vòng để hội tụ</th></tr></thead>
          <tbody>
            {#each gd as g}<tr><td style={`color:${col[g.k]}`}>{g.name}</td><td>{g.iters >= CAP ? `chưa xong sau ${CAP}` : g.iters}</td></tr>{/each}
          </tbody>
        </table>
      </div>
      <p class="cap">Khi một cột lớn gấp nghìn lần cột khác, mặt mất mát là một thung lũng hẹp và dài: bước học phải nhỏ để không văng ra khỏi chiều hẹp, nên đi dọc chiều dài mất rất lâu. Chuẩn hoá làm thung lũng tròn lại.</p>
    {:else}<p class="cap">Đang chạy Gradient Descent…</p>{/if}

    <h4>3. Biến đổi log cho cột lệch phải</h4>
    <div class="two">
      <figure>
        <svg viewBox={`0 0 ${W2} ${H2}`} role="img" aria-label="Phân phối dân số gốc">
          {#each bar(hRaw) as b}<rect x={b.x} y={H2 - 22 - b.h} width={(W2 - 12) / 30 - 1} height={b.h} fill="var(--c-L)" fill-opacity="0.7" />{/each}
          <text x="6" y={H2 - 6} font-size="11" fill="var(--pencil)">0</text><text x={W2 - 6} y={H2 - 6} font-size="11" text-anchor="end" fill="var(--pencil)">8.000 người</text>
        </svg>
        <figcaption>Dân số gốc, độ lệch {fmt(skewness(popRaw), 2)}</figcaption>
      </figure>
      <figure>
        <svg viewBox={`0 0 ${W2} ${H2}`} role="img" aria-label="Phân phối log dân số">
          {#each bar(hLog) as b}<rect x={b.x} y={H2 - 22 - b.h} width={(W2 - 12) / 30 - 1} height={b.h} fill="var(--tim)" fill-opacity="0.7" />{/each}
          <text x="6" y={H2 - 6} font-size="11" fill="var(--pencil)">1</text><text x={W2 - 6} y={H2 - 6} font-size="11" text-anchor="end" fill="var(--pencil)">11</text>
        </svg>
        <figcaption>log(1 + dân số), độ lệch {fmt(skewness(popLog), 2)}</figcaption>
      </figure>
    </div>
    <p class="cap">Log biến phép nhân thành phép cộng: khu vực đông gấp 10 lần chỉ cách thêm 2,3 đơn vị. Cái đuôi dài co lại, các khu vực rất đông dân không còn kéo lệch mô hình.</p>
  {/if}
</div>

<style>
  .cap { font-size: 0.88rem; color: var(--pencil); }
  h4 { margin: 1.3rem 0 0.4rem; }
  .one { background: var(--tim-soft); font-weight: 700; }
  .two { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 340px)); gap: 1.5rem; }
  .tw { overflow-x: auto; }
  .encres { max-width: 26rem; margin-top: 0.8rem; }
  figure { margin: 0; }
  figcaption { font-size: 0.85rem; color: var(--pencil); text-align: center; }
</style>
