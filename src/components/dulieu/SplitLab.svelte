<script lang="ts">
  /** Chia train/test: ngẫu nhiên, phân tầng theo giá, hay theo vùng địa lý — và sai số mỗi cách báo cáo. */
  import { randomSplit, stratifiedSplit, groupSplit, standardize, knnRegress, rmse, quantile, sortNum, fmt } from '../../lib/ml-core';
  import { loadCalifornia, block1, pick, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });

  const methods = [
    { k: 'random', name: 'Ngẫu nhiên', why: 'Mỗi khu vực có 20% khả năng vào tập test, độc lập với nhau.' },
    { k: 'strat', name: 'Phân tầng theo giá', why: 'Chia giá nhà thành 5 tầng bằng nhau, rồi lấy đúng 20% mỗi tầng. Phân phối giá ở hai tập khớp nhau tuyệt đối.' },
    { k: 'group', name: 'Theo ô địa lý 1°', why: 'Cả một ô 1° × 1° (khoảng 100 km × 90 km) vào cùng một tập. Tập test là những vùng mô hình chưa từng thấy.' },
  ] as const;
  type K = (typeof methods)[number]['k'];
  let k = $state<K>('random');
  let results = $state.raw<Partial<Record<K, { rmse: number; same: number; meanTr: number; meanTe: number }>>>({});
  let split = $state.raw<{ test: number[]; train: number[] } | null>(null);
  let busy = $state(false);

  $effect(() => {
    const c = cal, m = k;
    if (!c) return;
    busy = true;
    const h = setTimeout(() => {
      const s = sortNum(c.value), cuts = [0.2, 0.4, 0.6, 0.8].map((q) => quantile(s, q));
      const strata = c.value.map((v) => cuts.filter((t) => v > t).length);
      const sp = m === 'random' ? randomSplit(c.n, 0.2, 1) : m === 'strat' ? stratifiedSplit(strata, 0.2, 1) : groupSplit(block1(c), 0.2, 1);
      split = sp;
      if (!results[m]) {
        const cols = [c.lon, c.lat, c.income].map((a) => { const st = standardize(pick(a, sp.train)); return [Float64Array.from(pick(a, sp.train), (v) => (v - st.mu) / st.sd), Float64Array.from(pick(a, sp.test), (v) => (v - st.mu) / st.sd)]; });
        const pred = knnRegress(cols.map((q) => q[0]), pick(c.value, sp.train), cols.map((q) => q[1]), 10);
        const seen = new Set(sp.train.map((i) => `${c.lon[i]},${c.lat[i]}`));
        const same = sp.test.filter((i) => seen.has(`${c.lon[i]},${c.lat[i]}`)).length / sp.test.length;
        const mean = (idx: number[]) => idx.reduce((a, i) => a + c.value[i], 0) / idx.length;
        results = { ...results, [m]: { rmse: rmse(pred, pick(c.value, sp.test)), same, meanTr: mean(sp.train), meanTe: mean(sp.test) } };
      }
      busy = false;
    }, 30);
    return () => clearTimeout(h);
  });

  let canvas = $state<HTMLCanvasElement | null>(null);
  const CW = 520, CH = 560;
  $effect(() => {
    const c = cal, sp = split, cv = canvas;
    if (!c || !sp || !cv) return;
    const ctx = cv.getContext('2d')!;
    const css = getComputedStyle(cv);
    const dpr = window.devicePixelRatio || 1;
    cv.width = CW * dpr; cv.height = CH * dpr; ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, CW, CH);
    const X = (lon: number) => 16 + ((lon + 124.5) / 10.5) * (CW - 32), Y = (lat: number) => CH - 16 - ((lat - 32.4) / 9.7) * (CH - 32);
    ctx.fillStyle = css.getPropertyValue('--faint').trim() || '#999'; ctx.globalAlpha = 0.35;
    for (const i of sp.train) ctx.fillRect(X(c.lon[i]) - 1, Y(c.lat[i]) - 1, 2, 2);
    ctx.fillStyle = css.getPropertyValue('--tim').trim() || '#639'; ctx.globalAlpha = 0.8;
    for (const i of sp.test) ctx.fillRect(X(c.lon[i]) - 1.5, Y(c.lat[i]) - 1.5, 3, 3);
  });
</script>

<div class="lab">
  <p class="lab-title">Ba cách chia, ba con số khác nhau</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else}
    <p class="lab-hint">Mô hình: hồi quy K láng giềng (k = 10) theo kinh độ, vĩ độ và thu nhập — một mô hình rất giỏi "nhớ" vùng lân cận. Chấm tím là khu vực test, chấm xám là khu vực huấn luyện.</p>
    <div class="ctrl">
      {#each methods as m}<button class="chip" class:sel={k === m.k} type="button" onclick={() => (k = m.k)}>{m.name}</button>{/each}
      {#if busy}<span class="dim">đang tính 4.128 × 16.512 khoảng cách…</span>{/if}
    </div>
    <div class="lab-grid">
      <canvas bind:this={canvas} style={`width:100%;max-width:${CW}px;aspect-ratio:${CW}/${CH}`} aria-label="Bản đồ California, khu vực test tô tím"></canvas>
      <div>
        <p class="why">{methods.find((m) => m.k === k)!.why}</p>

        <p class="cap">Bấm cả ba cách để điền đủ bảng. Chia ngẫu nhiên, hơn một nửa số khu vực test có một "anh em sinh đôi" cùng toạ độ trong tập huấn luyện, nên mô hình chỉ cần nhớ. Chia theo vùng, không còn ai để nhớ: sai số tăng mạnh — và đó mới là con số đúng nếu mô hình sẽ được dùng cho vùng chưa có dữ liệu.{#if results.random && results.group} Ở đây: {fmt(results.random.rmse, 3)} so với {fmt(results.group.rmse, 3)}, cao hơn {fmt((100 * (results.group.rmse - results.random.rmse)) / results.random.rmse, 0)}%.{/if}</p>
      </div>
    </div>
    <div class="tw">
        <table class="data">
          <thead><tr><th>Cách chia</th><th>RMSE test</th><th>Test trùng toạ độ với train</th><th>Giá TB train / test</th></tr></thead>
          <tbody>
            {#each methods as m}
              {@const r = results[m.k]}
              <tr class:on={k === m.k}><td>{m.name}</td><td>{r ? fmt(r.rmse, 3) : '—'}</td><td>{r ? `${fmt(100 * r.same, 1)}%` : '—'}</td><td>{r ? `${fmt(r.meanTr, 3)} / ${fmt(r.meanTe, 3)}` : '—'}</td></tr>
            {/each}
          </tbody>
        </table>
    </div>
  {/if}
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
  .dim { color: var(--faint); font-size: 0.85rem; }
  .why { font-size: 0.92rem; border-left: 3px solid var(--tim); padding-left: 0.8rem; margin-top: 0; }
  tr.on td { background: var(--hl); }
  canvas { display: block; }
  .tw { overflow-x: auto; margin-top: 1rem; }
</style>
