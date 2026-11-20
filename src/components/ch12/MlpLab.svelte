<script lang="ts">
  /**
   * Mạng nơ-ron 12 → H → 2 (ReLU, softmax; chương 9) cho câu hỏi cảnh báo, huấn luyện ngay trên trình duyệt bằng ml-core.
   * Theo dõi mất mát huấn luyện và AUC trên tập kiểm tra sau mỗi epoch.
   */
  import { scaleLinear } from 'd3';
  import { untrack } from 'svelte';
  import Axis from '../Axis.svelte';
  import { initMLP, mlpEpoch, mlpForward, mulberry32, fmt, type MLP } from '../../lib/ml-core';
  import { buildRows, scaler, auc, type Air } from '../../lib/khongkhi';

  let { air, logregAuc }: { air: Air; logregAuc: number } = $props();
  const thr = $derived(air.meta.thr);
  const rows = $derived(buildRows(air.days, air.meta));
  const tr = $derived(rows.filter((r) => r.split === 'train'));
  const te = $derived(rows.filter((r) => r.split === 'test'));
  const sc = $derived(scaler(tr.map((r) => r.x)));
  const X = $derived(tr.map((r) => sc.z(r.x)));
  const Y = $derived(tr.map((r) => (r.y > thr ? 1 : 0)));
  const Xt = $derived(te.map((r) => sc.z(r.x)));
  const Yt = $derived(te.map((r) => r.y > thr));

  let nH = $state(16);
  let lr = $state(0.05);
  let seed = $state(1);
  let net: MLP = initMLP(12, 16, 2, 1);
  let curve = $state<{ ep: number; loss: number; trA: number; teA: number }[]>([]);
  let busy = $state(false);
  const aucOf = (xs: number[][], ys: boolean[]) => auc(xs.map((x) => mlpForward(net, x).p[1]), ys);

  function reset() {
    net = initMLP(12, nH, 2, seed);
    curve = [{ ep: 0, loss: NaN, trA: aucOf(X, Y.map((v) => v === 1)), teA: aucOf(Xt, Yt) }];
  }
  $effect(() => { nH; seed; X; untrack(reset); });
  function epoch() {
    const r = mulberry32(seed * 1000 + curve.length);
    const order = Array.from({ length: X.length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const ls = mlpEpoch(net, X, Y, order, 16, lr);
    curve = [...curve, { ep: curve.length, loss: ls.reduce((a, v) => a + v, 0) / ls.length, trA: aucOf(X, Y.map((v) => v === 1)), teA: aucOf(Xt, Yt) }];
  }
  async function run(n: number) {
    busy = true;
    for (let i = 0; i < n; i++) { epoch(); if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0)); }
    busy = false;
  }
  const last = $derived(curve.at(-1));
  const best = $derived(curve.reduce((b, c) => (c.teA > b.teA ? c : b), curve[0] ?? { ep: 0, teA: 0 }));

  const W = 560, H = 240, mg = { t: 30, r: 12, b: 40, l: 46 };
  const sx = $derived(scaleLinear().domain([0, Math.max(20, curve.length - 1)]).range([mg.l, W - mg.r]));
  const sy = scaleLinear().domain([0.75, 1]).range([H - mg.b, mg.t]);
  const pathOf = (k: 'trA' | 'teA') => curve.map((c, i) => `${i ? 'L' : 'M'}${sx(c.ep)},${sy(Math.max(0.75, c[k]))}`).join('');
</script>

<div class="lab">
  <p class="lab-title">Huấn luyện một mạng nơ-ron cảnh báo ngay trên trình duyệt</p>
  <p class="lab-hint">Mạng 12 → {nH} → 2: 12 đặc trưng đã chuẩn hoá, một lớp ẩn ReLU, softmax cho hai lớp "vượt / không vượt {thr} µg/m³". Mỗi epoch chạy SGD theo lô 16 ngày qua toàn bộ {tr.length} ngày huấn luyện. Đường đứt nét là AUC của hồi quy logistic trên cùng tập kiểm tra.</p>
  <div class="ctrl">
    <label>Nơ-ron ẩn <select bind:value={nH} aria-label="Số nơ-ron ẩn">{#each [4, 16, 64] as h}<option value={h}>{h}</option>{/each}</select></label>
    <label>η <select bind:value={lr} aria-label="Tốc độ học">{#each [0.01, 0.05, 0.2] as v}<option value={v}>{String(v).replace('.', ',')}</option>{/each}</select></label>
    <button class="btn primary" type="button" disabled={busy} onclick={() => run(1)}>+1 epoch</button>
    <button class="btn" type="button" disabled={busy} onclick={() => run(20)}>+20 epoch</button>
    <button class="btn" type="button" disabled={busy} onclick={() => (seed += 1)}>Khởi tạo lại</button>
  </div>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="AUC theo epoch">
    <Axis scale={sx} orient="bottom" size={H - mg.t - mg.b} offset={H - mg.b} label="epoch" />
    <Axis scale={sy} orient="left" size={W - mg.l - mg.r} offset={mg.l} label="AUC" ticks={5} />
    <line x1={mg.l} x2={W - mg.r} y1={sy(logregAuc)} y2={sy(logregAuc)} stroke="var(--pencil)" stroke-dasharray="5 3" />
    <path d={pathOf('trA')} fill="none" stroke="var(--faint)" stroke-width="2" />
    <path d={pathOf('teA')} fill="none" stroke="var(--tim)" stroke-width="2.2" />
  </svg>
  {#if last}
  <p>Epoch {last.ep}: mất mát huấn luyện {Number.isNaN(last.loss) ? '—' : fmt(last.loss, 3)} · AUC huấn luyện <span class="tr">{fmt(last.trA, 3)}</span> · AUC kiểm tra <b class="te">{fmt(last.teA, 3)}</b> (cao nhất {fmt(best.teA, 3)} ở epoch {best.ep}) · logistic {fmt(logregAuc, 3)}</p>
  {/if}
  <p class="cap">Với 64 nơ-ron và thật nhiều epoch, đường xám tiếp tục đi lên còn đường tím thì không. Mạng đang học thuộc {tr.length} ngày. Với ít dữ liệu như vậy, một mạng nơ-ron hiếm khi vượt xa mô hình tuyến tính.</p>
</div>

<style>
  .tr { color: var(--faint); font-weight: 600; }
  .te { color: var(--tim); }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
