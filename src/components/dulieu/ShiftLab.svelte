<script lang="ts">
  /** Lệch phân phối: học ở một vùng, dùng ở vùng khác; mô hình "đoán dòng này thuộc tập nào" đo độ lệch bằng AUC. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { histogram, linFit, linPredict, rmse, permutation, oofProba, chunks, rocCurve, fmt } from '../../lib/ml-core';
  import { loadCalifornia, oceanVi, houseFeatures, bedMedian, scaleCols, pick, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });
  const X = $derived(cal ? houseFeatures(cal, bedMedian(cal), 'none', false) : []);

  const regions = [1, 0, 2, 3];
  let a = $state(1);
  let b = $state(3);
  let res = $state.raw<{ inRmse: number; outRmse: number; auc: number; nA: number; nB: number } | null>(null);
  let busy = $state(false);

  $effect(() => {
    const c = cal, ra = a, rb = b, F = X;
    if (!c || ra === rb) { res = null; return; }
    busy = true;
    const h = setTimeout(() => {
      const A = c.ocean.map((o, i) => (o === ra ? i : -1)).filter((i) => i >= 0);
      const B = c.ocean.map((o, i) => (o === rb ? i : -1)).filter((i) => i >= 0);
      const pa = permutation(A.length, 1).map((k) => A[k]), nh = Math.round(A.length * 0.2);
      const hold = pa.slice(0, nh), fit = pa.slice(nh);
      const coef = linFit(pick(F, fit), pick(c.value, fit));
      const inRmse = rmse(linPredict(coef, pick(F, hold)), pick(c.value, hold));
      const outRmse = rmse(linPredict(coef, pick(F, B)), pick(c.value, B));
      // Mô hình phân biệt: tối đa 1.200 dòng mỗi bên
      const sa = permutation(A.length, 2).slice(0, 1200).map((k) => A[k]), sb = permutation(B.length, 3).slice(0, 1200).map((k) => B[k]);
      const rows = [...sa, ...sb], lab = [...sa.map(() => 0), ...sb.map(() => 1)];
      const Z = scaleCols(pick(F, rows), rows.map((_, i) => i));
      const order = permutation(rows.length, 4);
      const p = oofProba(Z, lab, chunks(order, 5), 1);
      res = { inRmse, outRmse, auc: rocCurve(p, lab).auc, nA: A.length, nB: B.length };
      busy = false;
    }, 30);
    return () => clearTimeout(h);
  });

  const dens = (vals: number[], lo: number, hi: number) => { const h = histogram(vals, 30, lo, hi); const s = h.reduce((x, y) => x + y, 0); return h.map((v) => v / s); };
  const pair = $derived.by(() => {
    if (!cal) return null;
    const va = cal.income.filter((_, i) => cal!.ocean[i] === a), vb = cal.income.filter((_, i) => cal!.ocean[i] === b);
    return { a: dens(va, 0, 15.0001), b: dens(vb, 0, 15.0001) };
  });
  const W = 520, H = 220, m = { t: 14, r: 14, b: 42, l: 46 };
  const sx = scaleLinear().domain([0, 15]).range([m.l, W - m.r]);
  const sy = $derived(scaleLinear().domain([0, Math.max(0.01, ...(pair?.a ?? []), ...(pair?.b ?? []))]).nice().range([H - m.b, m.t]));
  const step = (d: number[]) => d.map((v, k) => `${k ? 'L' : 'M'}${sx(k * 0.5)},${sy(v)}H${sx((k + 1) * 0.5)}`).join('');
</script>

<div class="lab">
  <p class="lab-title">Học ở nơi này, dùng ở nơi khác</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else}
    <p class="lab-hint">Hồi quy tuyến tính trên 5 đặc trưng (thu nhập, tuổi nhà, log phòng mỗi hộ, phòng ngủ mỗi phòng, log người mỗi hộ), học trên 80% khu vực của vùng A. Chấm điểm trên 20% còn lại của vùng A và trên toàn bộ vùng B.</p>
    <div class="ctrl"><span>Vùng A (huấn luyện):</span>{#each regions as r}<button class="chip" class:sel={a === r} type="button" onclick={() => (a = r)}>{oceanVi[cal.cats[r]]}</button>{/each}</div>
    <div class="ctrl"><span>Vùng B (dùng thật):</span>{#each regions as r}<button class="chip" class:sel={b === r} type="button" onclick={() => (b = r)} disabled={r === a}>{oceanVi[cal.cats[r]]}</button>{/each}</div>
    <div class="lab-grid">
      <div>
        <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Phân phối thu nhập ở hai vùng">
          <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Thu nhập (×10.000 USD)" ticks={6} />
          <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Tỷ lệ khu vực" ticks={4} />
          {#if pair}
            <path d={step(pair.a)} fill="none" stroke="var(--tim)" stroke-width="2" />
            <path d={step(pair.b)} fill="none" stroke="var(--c-L)" stroke-width="2" stroke-dasharray="5 3" />
          {/if}
          <text x={W - m.r - 4} y={m.t + 12} text-anchor="end" font-size="12" fill="var(--tim)">A: {oceanVi[cal.cats[a]]}</text>
          <text x={W - m.r - 4} y={m.t + 28} text-anchor="end" font-size="12" fill="var(--c-L)">B: {oceanVi[cal.cats[b]]}</text>
        </svg>
      </div>
      <div>
        {#if res}
          <table class="data">
            <tbody>
              <tr><td>Số khu vực A / B</td><td>{res.nA.toLocaleString('vi-VN')} / {res.nB.toLocaleString('vi-VN')}</td></tr>
              <tr><td>RMSE trên phần giữ lại của A</td><td>{fmt(res.inRmse, 3)}</td></tr>
              <tr><td>RMSE trên vùng B</td><td class:bad={res.outRmse > res.inRmse * 1.15}><b>{fmt(res.outRmse, 3)}</b></td></tr>
              <tr><td>AUC "đoán dòng thuộc A hay B"</td><td>{fmt(res.auc, 3)}</td></tr>
            </tbody>
          </table>
          <p class="cap">RMSE tính theo đơn vị 100.000 USD. {busy ? 'Đang tính…' : ''}</p>
        {:else}<p class="cap">{busy ? 'Đang tính…' : 'Chọn hai vùng khác nhau.'}</p>{/if}
      </div>
    </div>
    <p class="cap">Cách đo lệch phân phối thứ hai không cần nhìn giá nhà: gộp hai vùng, gán nhãn 0 cho A, 1 cho B, rồi học một mô hình đoán nhãn đó. AUC gần 0,5 nghĩa là hai vùng trông như nhau; AUC càng gần 1, dữ liệu dùng thật càng khác dữ liệu huấn luyện, và con số RMSE lúc học càng không đáng tin.</p>
  {/if}
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
  td.bad { color: var(--bad); }
</style>
