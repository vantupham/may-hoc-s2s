<script lang="ts">
  /**
   * Bảng xếp hạng xuyên suốt dự án: mọi mô hình chấm trên cùng tập kiểm tra mùa đông 2025–2026.
   * MAE: sai số tuyệt đối trung bình (µg/m³), thấp là tốt. AUC: khả năng xếp ngày vượt ngưỡng lên trên, cao là tốt.
   */
  import type { BoardRow } from '../../lib/khongkhi';
  import { fmt } from '../../lib/ml-core';

  let { board, ids, title = 'Bảng xếp hạng: mùa đông 2025–2026', nTest, thr }: { board: BoardRow[]; ids?: string[]; title?: string; nTest: number; thr: number } = $props();
  let by = $state<'order' | 'mae' | 'auc'>('order');
  const rows = $derived.by(() => {
    const r = ids ? ids.map((id) => board.find((b) => b.id === id)!).filter(Boolean) : board.slice();
    if (by === 'mae') r.sort((a, b) => (a.mae ?? 1e9) - (b.mae ?? 1e9));
    if (by === 'auc') r.sort((a, b) => (b.auc ?? -1) - (a.auc ?? -1));
    return r;
  });
  const maxMae = $derived(Math.max(...rows.map((r) => r.mae ?? 0), 1));
  const persist = $derived(board.find((b) => b.id === 'persist')?.mae ?? 0);
  const bestMae = $derived(Math.min(...rows.map((r) => r.mae ?? 1e9)));
  const bestAuc = $derived(Math.max(...rows.map((r) => r.auc ?? -1)));
</script>

<div class="lab">
  <p class="lab-title">{title}</p>
  <p class="lab-hint">{nTest} ngày dự báo từ 1/11/2025 đến 31/3/2026, chưa mô hình nào được nhìn thấy khi học. <b>MAE</b> là sai số trung bình (µg/m³), càng thấp càng tốt. <b>AUC</b> đo khả năng xếp những ngày vượt {thr} µg/m³ lên trên những ngày không vượt: 0,5 là đoán bừa, 1 là hoàn hảo. Vạch đỏ là mốc "ngày mai = hôm nay".</p>
  <div class="ctrl">
    <span>Sắp xếp:</span>
    <button class="chip" class:sel={by === 'order'} type="button" onclick={() => (by = 'order')}>theo chương</button>
    <button class="chip" class:sel={by === 'mae'} type="button" onclick={() => (by = 'mae')}>MAE thấp nhất</button>
    <button class="chip" class:sel={by === 'auc'} type="button" onclick={() => (by = 'auc')}>AUC cao nhất</button>
  </div>
  <table class="data board">
    <thead><tr><th>Mô hình</th><th>Chương</th><th class="bar-h">MAE (µg/m³)</th><th>AUC</th></tr></thead>
    <tbody>
      {#each rows as r (r.id)}
        <tr class:base={r.note === 'mốc so sánh'}>
          <td class="t">{r.name}{#if r.note && r.note !== 'mốc so sánh'}<span class="nt">{r.note}</span>{/if}</td>
          <td>{r.ch}</td>
          <td class="bar-c">
            {#if r.mae !== undefined}
              <span class="bar" style:width={`${(r.mae / maxMae) * 100}%`} class:best={r.mae === bestMae}></span>
              <span class="persist" style:left={`${(persist / maxMae) * 100}%`}></span>
              <span class="v" class:bold={r.mae === bestMae}>{fmt(r.mae, 2)}</span>
            {:else}<span class="na">chỉ phân loại</span>{/if}
          </td>
          <td class:bold={r.auc === bestAuc}>{r.auc !== undefined ? fmt(r.auc, 3) : '—'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .board td.t { text-align: left; }
  .nt { display: block; font-size: 0.78rem; color: var(--faint); }
  tr.base td.t { font-style: italic; }
  .bar-h { min-width: 12rem; }
  .bar-c { position: relative; text-align: left; min-width: 12rem; }
  .bar { position: absolute; left: 0; top: 22%; height: 56%; background: var(--c-x); opacity: 0.25; border-radius: 1px; }
  .bar.best { opacity: 0.55; }
  .persist { position: absolute; top: 8%; height: 84%; border-left: 2px solid var(--le); }
  .v { position: relative; padding-left: 0.3rem; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 700; }
  .na { color: var(--faint); font-size: 0.85rem; font-style: italic; }
</style>
