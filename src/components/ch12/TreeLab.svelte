<script lang="ts">
  /**
   * Cây quyết định (Gini, chương 5) cho câu hỏi "ngày mai có vượt ngưỡng không", học ngay trên trình duyệt,
   * đọc ra thành luật. Bên cạnh: độ quan trọng đặc trưng của gradient boosting 300 cây (scikit-learn).
   */
  import { buildTree, nodes, predictTree, probaTree, fmt, type TreeNode } from '../../lib/ml-core';
  import { buildRows, auc, FEATS, FEAT_VI, type Air } from '../../lib/khongkhi';

  let { air, imp }: { air: Air; imp: Record<string, number> } = $props();
  const thr = $derived(air.meta.thr);
  const rows = $derived(buildRows(air.days, air.meta));
  const tr = $derived(rows.filter((r) => r.split === 'train').map((r) => ({ x: r.x, y: r.y > thr ? 1 : 0 })));
  const te = $derived(rows.filter((r) => r.split === 'test').map((r) => ({ x: r.x, y: r.y > thr ? 1 : 0 })));
  let depth = $state(2);
  const tree = $derived(buildTree(tr, { maxDepth: depth, nFeatures: FEATS.length, minLeaf: 5 }));
  const acc = (rs: typeof tr) => (rs.filter((r) => predictTree(tree, r.x) === r.y).length / rs.length) * 100;
  const A = $derived(auc(te.map((r) => probaTree(tree, r.x)), te.map((r) => r.y === 1)));
  const unit: Record<string, string> = { pm0: ' µg/m³', pm1: ' µg/m³', pm7: ' µg/m³', ws: ' m/s', rh: '%', t: ' °C', rain: ' mm', blh: ' m', north: ' m/s', dp: ' hPa' };
  const fmtThr = (n: TreeNode) => `${fmt(n.thr!, FEATS[n.feature!] === 'blh' ? 0 : 1)}${unit[FEATS[n.feature!]] ?? ''}`;
  const leaves = $derived(nodes(tree).filter((n) => !n.left));
  const impSorted = $derived(Object.entries(imp).sort((a, b) => b[1] - a[1]));
</script>

<div class="lab">
  <p class="lab-title">Cây quyết định đọc được như luật</p>
  <p class="lab-hint">Cây học trên {tr.length} ngày 2023–2025: tại mỗi nút, nó thử mọi đặc trưng và mọi ngưỡng, chọn phép chia làm Gini giảm nhiều nhất. Mỗi lá cần ít nhất 5 ngày. Đọc cây từ trên xuống như một chuỗi câu "nếu… thì…".</p>
  <div class="ctrl">
    <label>Độ sâu tối đa = <b class="num">{depth}</b><input type="range" min="1" max="5" bind:value={depth} aria-label="Độ sâu cây" /></label>
    <span>Đúng trên train {fmt(acc(tr), 1)}% · trên test {fmt(acc(te), 1)}% · AUC test {fmt(A, 3)} · {leaves.length} lá</span>
  </div>
  <div class="lab-grid">
    <div class="tree">
      {#snippet show(n: TreeNode)}
        {#if n.left && n.right}
          <div class="q">{FEAT_VI[FEATS[n.feature!]]} ≤ {fmtThr(n)}? <span class="nt">{n.n} ngày</span></div>
          <div class="br"><span class="yes">có</span>{@render show(n.left)}</div>
          <div class="br"><span class="no">không</span>{@render show(n.right)}</div>
        {:else}
          <div class="leaf" class:alert={n.counts[1] > n.counts[0]}>
            {n.counts[1] > n.counts[0] ? 'CẢNH BÁO' : 'không cảnh báo'} · {n.counts[1]}/{n.n} ngày vượt ngưỡng ({fmt((n.counts[1] / n.n) * 100, 0)}%)
          </div>
        {/if}
      {/snippet}
      {@render show(tree)}
    </div>
    <div>
      <p class="h">Gradient boosting 300 cây: đặc trưng nào được dùng nhiều nhất?</p>
      <table class="data">
        <tbody>
          {#each impSorted as [f, v]}
            <tr><td class="t">{FEAT_VI[f]}</td><td class="bar-c"><span class="bar" style:width={`${(v / impSorted[0][1]) * 100}%`}></span><span class="v">{fmt(v * 100, 1)}%</span></td></tr>
          {/each}
        </tbody>
      </table>
      <p class="cap">Độ quan trọng = phần giảm sai số bình phương mà đặc trưng đó đóng góp, cộng qua mọi nút của 300 cây. Nó cho biết mô hình <i>dựa vào</i> đâu, không cho biết đâu là <i>nguyên nhân</i>.</p>
    </div>
  </div>
</div>

<style>
  .tree { font-size: 0.88rem; }
  .q { font-weight: 600; margin: 0.2rem 0; }
  .nt { font-weight: 400; color: var(--faint); font-size: 0.8rem; }
  .br { border-left: 1.5px solid var(--rule-2); margin-left: 0.4rem; padding-left: 0.8rem; }
  .yes, .no { font: 0.74rem var(--mono); color: var(--pencil); }
  .leaf { margin: 0.15rem 0 0.35rem; padding: 0.15rem 0.4rem; border-radius: 2px; background: var(--tim-soft); font-size: 0.84rem; }
  .leaf.alert { background: color-mix(in srgb, var(--le) 18%, transparent); font-weight: 600; }
  .h { font-weight: 600; font-size: 0.92rem; margin-top: 0; }
  .bar-c { position: relative; min-width: 9rem; text-align: left; }
  .bar { position: absolute; left: 0; top: 25%; height: 50%; background: var(--c-x); opacity: 0.3; }
  .v { position: relative; padding-left: 0.3rem; }
  .cap { font-size: 0.85rem; color: var(--pencil); }
</style>
