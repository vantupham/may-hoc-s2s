<script lang="ts">
  /** Rò rỉ dữ liệu: điểm báo cáo trên tập test so với sai số thật khi đem mô hình đi dùng. */
  import { imputeMedian, permutation, linFit, linPredict, rmse, fmt } from '../../lib/ml-core';
  import { loadCalifornia, houseFeatures, pick, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });
  let cellDeg = $state(0.05);

  const scen = [
    { k: 'base', name: 'Mô hình gốc', leak: false, why: 'Mọi bước xử lý chỉ học từ tập huấn luyện.' },
    { k: 'scale', name: 'Chuẩn hoá trên cả tập trước khi chia', leak: true, why: 'Trung bình và độ lệch chuẩn đã "nhìn thấy" tập test. Với hồi quy tuyến tính, đổi thang đo không đổi dự đoán, nên lần này rò rỉ vô hại. Với các bước khác (chọn đặc trưng, điền giá trị thiếu, KNN), nó có thể không vô hại.' },
    { k: 'teOk', name: 'Thêm giá trung bình của ô lưới, tính đúng cách', leak: false, why: 'Mỗi khu vực huấn luyện nhận giá trung bình của các khu vực huấn luyện khác cùng ô (không tính chính nó). Khu vực test nhận giá trung bình của các khu vực huấn luyện trong ô.' },
    { k: 'teLeak', name: 'Thêm giá trung bình của ô lưới, tính trên cả train và test', leak: true, why: 'Giá trung bình đã gồm cả giá của chính khu vực đó. Ô càng nhỏ, cột này càng gần với đáp án. Điểm báo cáo đẹp lên, nhưng khi dùng thật, khu vực mới không có giá để góp vào trung bình.' },
    { k: 'band', name: 'Thêm cột "phân khúc giá" mà đồng nghiệp đã gắn', leak: true, why: 'Cột này được tính từ chính giá nhà. Trong tập test nó vẫn có mặt, nên điểm báo cáo gần như hoàn hảo. Khi dùng thật, phân khúc chưa có vì chưa biết giá: ta đành điền loại phổ biến nhất.' },
  ] as const;

  let res = $state.raw<{ k: string; test: number; future: number }[] | null>(null);
  $effect(() => {
    const c = cal, deg = cellDeg;
    if (!c) return;
    const h = setTimeout(() => {
      const p = permutation(c.n, 3), a = Math.round(c.n * 0.6), b = Math.round(c.n * 0.8);
      const tr = p.slice(0, a), te = p.slice(a, b), fu = p.slice(b);
      const X = houseFeatures(c, imputeMedian(c.bedrooms)), y = c.value;
      const cell = c.lat.map((la, i) => `${Math.floor(la / deg)},${Math.floor(c.lon[i] / deg)}`);
      const sums = (idx: number[]) => { const s = new Map<string, [number, number]>(); for (const i of idx) { const q = s.get(cell[i]) ?? [0, 0]; q[0] += y[i]; q[1]++; s.set(cell[i], q); } return s; };
      const meanOf = (idx: number[]) => idx.reduce((s, i) => s + y[i], 0) / idx.length;
      const enc = (src: Map<string, [number, number]>, i: number, self: boolean, gm: number) => { const q = src.get(cell[i]); if (!q) return gm; const S = q[0] - (self ? y[i] : 0), N = q[1] - (self ? 1 : 0); return N > 0 ? S / N : gm; };
      const run = (extra: (i: number, set: 'tr' | 'te' | 'fu') => number[]) => {
        const row = (i: number, s: 'tr' | 'te' | 'fu') => [...X[i], ...extra(i, s)];
        const coef = linFit(tr.map((i) => row(i, 'tr')), pick(y, tr));
        return { test: rmse(linPredict(coef, te.map((i) => row(i, 'te'))), pick(y, te)), future: rmse(linPredict(coef, fu.map((i) => row(i, 'fu'))), pick(y, fu)) };
      };
      const sTr = sums(tr), sAll = sums([...tr, ...te]), gTr = meanOf(tr), gAll = meanOf([...tr, ...te]);
      const band = (i: number) => Math.min(4, Math.floor(y[i]));
      const counts = [0, 0, 0, 0, 0]; for (const i of tr) counts[band(i)]++;
      const mode = counts.indexOf(Math.max(...counts));
      // Chuẩn hoá trên cả tập: với hồi quy tuyến tính có hệ số chặn, phép biến đổi affine không đổi dự đoán
      const out = [
        { k: 'base', ...run(() => []) },
        { k: 'scale', test: 0, future: 0 },
        { k: 'teOk', ...run((i, s) => [s === 'tr' ? enc(sTr, i, true, gTr) : s === 'te' ? enc(sTr, i, false, gTr) : enc(sAll, i, false, gAll)]) },
        { k: 'teLeak', ...run((i) => [enc(sAll, i, false, gAll)]) },
        { k: 'band', ...run((i, s) => [s === 'fu' ? mode : band(i)]) },
      ];
      // Thực sự chạy lại kịch bản chuẩn hoá trước khi chia để con số đến từ phép tính, không phải từ lập luận
      const d = X[0].length, all = [...tr, ...te, ...fu];
      const mu = Array.from({ length: d }, (_, j) => all.reduce((s, i) => s + X[i][j], 0) / all.length);
      const sd = Array.from({ length: d }, (_, j) => Math.sqrt(all.reduce((s, i) => s + (X[i][j] - mu[j]) ** 2, 0) / all.length) || 1);
      const Z = (i: number) => X[i].map((v, j) => (v - mu[j]) / sd[j]);
      const cz = linFit(tr.map(Z), pick(y, tr));
      out[1] = { k: 'scale', test: rmse(linPredict(cz, te.map(Z)), pick(y, te)), future: rmse(linPredict(cz, fu.map(Z)), pick(y, fu)) };
      res = out;
    }, 30);
    return () => clearTimeout(h);
  });
  let sel = $state(3);
</script>

<div class="lab">
  <p class="lab-title">Rò rỉ dữ liệu: điểm đẹp trên giấy, tệ khi dùng thật</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else}
    <p class="lab-hint">Chia ngẫu nhiên 60% huấn luyện, 20% test, và 20% đóng vai "khu vực mới" khi mô hình đã được đem đi dùng. Mỗi dòng là một cách xây đặc trưng. Cột giữa là con số bạn sẽ báo cáo; cột phải là sự thật. Đơn vị: 100.000 USD. Ngay cả mô hình gốc cũng chênh một chút vì hai tập khác nhau ngẫu nhiên, nên hãy so chênh lệch của mỗi dòng với dòng gốc.</p>
    <div class="ctrl"><label>Cỡ ô lưới cho cột giá trung bình: <span class="num">{fmt(cellDeg, 2)}°</span><input type="range" min="0.05" max="0.5" step="0.05" bind:value={cellDeg} aria-label="Cỡ ô lưới (độ)" /></label></div>
    {#if res}
      <table class="data">
        <thead><tr><th>Cách xây đặc trưng</th><th>RMSE trên test<br />(điểm báo cáo)</th><th>RMSE khi dùng thật</th><th>Chênh lệch</th></tr></thead>
        <tbody>
          {#each scen as s, i}
            {@const r = res[i]}
            <tr class:on={sel === i} class:leak={s.leak}>
              <td><button class="val" class:sel={sel === i} type="button" onclick={() => (sel = i)}>{s.name}</button></td>
              <td>{fmt(r.test, 4)}</td><td>{fmt(r.future, 4)}</td><td class:bad={r.future - r.test > res[0].future - res[0].test + 0.01}>{r.future - r.test >= 0 ? '+' : ''}{fmt(r.future - r.test, 4)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p class="why"><b>{scen[sel].name}.</b> {scen[sel].why}</p>
    {:else}<p class="cap">Đang tính…</p>{/if}
    {#if res}<p class="cap">So hai dòng "giá trung bình của ô lưới": cách rò rỉ báo cáo RMSE {fmt(res[3].test, 3)}, đẹp hơn cách làm đúng ({fmt(res[2].test, 3)}). Khi dùng thật, nó lại {res[3].future > res[2].future ? 'kém hơn' : 'chỉ ngang'} ({fmt(res[3].future, 3)} so với {fmt(res[2].future, 3)}). Kéo cỡ ô lên: ô lớn chứa nhiều khu vực hơn, giá của một khu vực chỉ là một phần nhỏ trong trung bình, nên rò rỉ yếu đi.</p>{/if}
  {/if}
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
  .why { font-size: 0.92rem; border-left: 3px solid var(--tim); padding-left: 0.8rem; }
  tr.on td { background: var(--hl); }
  tr.leak td:first-child::after { content: ' ⚑'; color: var(--bad); }
  td.bad { color: var(--bad); font-weight: 700; }
  td :global(.val) { text-align: left; white-space: normal; }
</style>
