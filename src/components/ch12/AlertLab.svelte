<script lang="ts">
  /**
   * Cảnh báo "ngày mai vượt ngưỡng": hồi quy logistic L2 (như scikit-learn) học ngay trên trình duyệt,
   * rồi người học kéo ngưỡng xác suất và gán giá cho báo động giả và bỏ sót.
   */
  import { logregL2, sigmoid, fmt } from '../../lib/ml-core';
  import { buildRows, scaler, auc, type Air } from '../../lib/khongkhi';

  let { air }: { air: Air } = $props();
  const thr = $derived(air.meta.thr);
  const rows = $derived(buildRows(air.days, air.meta));
  const tr = $derived(rows.filter((r) => r.split === 'train'));
  const te = $derived(rows.filter((r) => r.split === 'test'));
  const sc = $derived(scaler(tr.map((r) => r.x)));
  const th = $derived(logregL2(tr.map((r) => sc.z(r.x)), tr.map((r) => (r.y > thr ? 1 : 0)), 1, 30));
  const prob = $derived(te.map((r) => sigmoid(sc.z(r.x).reduce((a, v, j) => a + v * th[j + 1], th[0]))));
  const pos = $derived(te.map((r) => r.y > thr));
  const A = $derived(auc(prob, pos));

  let cut = $state(0.5);
  let costMiss = $state(5);
  const cm = $derived.by(() => {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    prob.forEach((p, i) => { const a = p >= cut; if (a && pos[i]) tp++; else if (a) fp++; else if (pos[i]) fn++; else tn++; });
    return { tp, fp, fn, tn };
  });
  const cost = $derived(cm.fp * 1 + cm.fn * costMiss);
  // Ngưỡng tốt nhất theo chi phí, quét 0,05 … 0,95
  const best = $derived.by(() => {
    let b = { c: 0.5, cost: Infinity };
    for (let c = 0.05; c <= 0.951; c += 0.05) {
      let fp = 0, fn = 0;
      prob.forEach((p, i) => { if (p >= c && !pos[i]) fp++; if (p < c && pos[i]) fn++; });
      const k = fp + fn * costMiss;
      if (k < b.cost) b = { c: Math.round(c * 100) / 100, cost: k };
    }
    return b;
  });
</script>

<div class="lab">
  <p class="lab-title">Có nên phát cảnh báo cho ngày mai?</p>
  <p class="lab-hint">Hồi quy logistic dùng 12 đặc trưng đã chuẩn hoá để ước lượng xác suất PM2.5 ngày mai vượt {thr} µg/m³. Mô hình vừa được học xong ngay trong trình duyệt trên {tr.length} ngày huấn luyện. Bây giờ bạn quyết định: xác suất bao nhiêu thì phát cảnh báo?</p>
  <div class="ctrl">
    <label>Phát cảnh báo khi xác suất ≥ <b class="num">{fmt(cut, 2)}</b><input type="range" min="0.05" max="0.95" step="0.05" bind:value={cut} aria-label="Ngưỡng xác suất" /></label>
    <label>Một lần bỏ sót đắt gấp <b class="num">{costMiss}</b> lần một lần báo nhầm<input type="range" min="1" max="10" step="1" bind:value={costMiss} aria-label="Giá của bỏ sót" /></label>
  </div>
  <div class="lab-grid">
    <table class="data cm">
      <thead><tr><th></th><th>Ngày mai vượt ngưỡng</th><th>Ngày mai không vượt</th></tr></thead>
      <tbody>
        <tr><td class="t"><b>Có cảnh báo</b></td><td class="ok">{cm.tp} đúng</td><td class="bad">{cm.fp} báo nhầm</td></tr>
        <tr><td class="t"><b>Không cảnh báo</b></td><td class="bad">{cm.fn} bỏ sót</td><td class="ok">{cm.tn} đúng</td></tr>
      </tbody>
    </table>
    <div>
      <p>Bắt được <b>{cm.tp}/{cm.tp + cm.fn}</b> ngày ô nhiễm (độ nhạy {fmt((cm.tp / Math.max(1, cm.tp + cm.fn)) * 100, 0)}%). Cứ 10 lần cảnh báo thì {fmt((cm.tp / Math.max(1, cm.tp + cm.fp)) * 10, 1)} lần đúng.</p>
      <p>Tổng chi phí = {cm.fp} × 1 + {cm.fn} × {costMiss} = <b>{cost}</b>. Với giá này, ngưỡng rẻ nhất là <b>{fmt(best.c, 2)}</b> (chi phí {best.cost}).</p>
      <p class="cap">AUC của mô hình = {fmt(A, 3)}, không phụ thuộc vào ngưỡng bạn chọn. Ngưỡng không làm mô hình giỏi lên hay kém đi. Nó chỉ chọn một điểm trên đường ROC (chương 8).</p>
    </div>
  </div>
</div>

<style>
  .cm td { text-align: center; font-family: var(--serif); font-size: 0.92rem; }
  .cm .ok { color: var(--ok); }
  .cm .bad { color: var(--bad); }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
