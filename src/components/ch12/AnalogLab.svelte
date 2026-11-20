<script lang="ts">
  /** Dự báo bằng "ngày tương tự" (KNN, chương 4): tìm k ngày huấn luyện gần nhất trong không gian 12 đặc trưng đã chuẩn hoá. */
  import { fmt } from '../../lib/ml-core';
  import { buildRows, scaler, fmtDate, FEATS, FEAT_VI, type Air } from '../../lib/khongkhi';

  let { air }: { air: Air } = $props();
  const rows = $derived(buildRows(air.days, air.meta));
  const tr = $derived(rows.filter((r) => r.split === 'train'));
  const te = $derived(rows.filter((r) => r.split === 'test'));
  const sc = $derived(scaler(tr.map((r) => r.x)));
  const trZ = $derived(tr.map((r) => sc.z(r.x)));
  let pick = $state('2026-01-03');
  let k = $state(10);
  let scaled = $state(true);
  const q = $derived(te.find((r) => r.target === pick) ?? te[0]);
  const nb = $derived.by(() => {
    const qz = scaled ? sc.z(q.x) : q.x;
    return tr.map((r, i) => {
      const v = scaled ? trZ[i] : r.x;
      return { r, dist: Math.sqrt(v.reduce((a, x, j) => a + (x - qz[j]) ** 2, 0)) };
    }).sort((a, b) => a.dist - b.dist).slice(0, k);
  });
  const pred = $derived(nb.reduce((a, n) => a + n.r.y, 0) / nb.length);
  // Đặc trưng nào chiếm phần lớn khoảng cách tới láng giềng gần nhất (khi chưa chuẩn hoá: lớp biên, đo bằng mét)
  const share = $derived.by(() => {
    const a = scaled ? sc.z(q.x) : q.x, b = scaled ? sc.z(nb[0].r.x) : nb[0].r.x;
    const d = a.map((v, j) => (v - b[j]) ** 2), s = d.reduce((x, y) => x + y, 0) || 1;
    return d.map((v, j) => ({ f: FEATS[j], p: v / s })).sort((x, y) => y.p - x.p).slice(0, 3);
  });
</script>

<div class="lab">
  <p class="lab-title">Dự báo bằng những ngày tương tự trong quá khứ</p>
  <p class="lab-hint">Chọn một ngày cần dự báo trong mùa đông 2025–2026. KNN tìm k ngày trong 2023–2025 giống nó nhất (khoảng cách Euclid trên 12 đặc trưng), rồi lấy trung bình PM2.5 "ngày mai" của chúng. Các nhà khí tượng gọi đây là dự báo tương tự (analog forecasting).</p>
  <div class="ctrl">
    <label>Ngày dự báo
      <select bind:value={pick} aria-label="Ngày cần dự báo">{#each te as r}<option value={r.target}>{fmtDate(r.target)}</option>{/each}</select>
    </label>
    <label>k = <b class="num">{k}</b><input type="range" min="1" max="30" bind:value={k} aria-label="Số láng giềng" /></label>
    <label><input type="checkbox" bind:checked={scaled} /> chuẩn hoá đặc trưng</label>
  </div>
  <p>Dự báo: <b class="num">{fmt(pred, 1)}</b> µg/m³ · thật: <b class="num">{fmt(q.y, 1)}</b> · sai {fmt(Math.abs(pred - q.y), 1)}. Hôm nay đo được {fmt(q.x[0], 1)}.</p>
  <div class="table-scroll">
    <table class="data">
      <thead><tr><th>#</th><th>Ngày được dự báo</th><th>Khoảng cách</th><th>PM2.5 hôm trước</th><th>Gió (m/s)</th><th>Lớp biên (m)</th><th>PM2.5 thật</th></tr></thead>
      <tbody>
        <tr class="on"><td>—</td><td class="t">{fmtDate(q.target)} (cần dự báo)</td><td>0</td><td>{fmt(q.x[0], 1)}</td><td>{fmt(q.x[3], 1)}</td><td>{fmt(q.x[7], 0)}</td><td>?</td></tr>
        {#each nb.slice(0, 10) as n, i}
          <tr><td>{i + 1}</td><td class="t">{fmtDate(n.r.target)}</td><td>{fmt(n.dist, scaled ? 2 : 0)}</td><td>{fmt(n.r.x[0], 1)}</td><td>{fmt(n.r.x[3], 1)}</td><td>{fmt(n.r.x[7], 0)}</td><td>{fmt(n.r.y, 1)}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="cap">Ba đặc trưng chiếm nhiều nhất trong khoảng cách tới ngày gần nhất: {#each share as s, i}{i ? ', ' : ''}<b>{FEAT_VI[s.f]}</b> {fmt(s.p * 100, 0)}%{/each}.{#if !scaled} Khi chưa chuẩn hoá, lớp biên (hàng trăm mét) lấn át mọi thứ, nên "ngày tương tự" chỉ còn là ngày có lớp biên giống.{/if}</p>
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
