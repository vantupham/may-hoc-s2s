<script lang="ts">
  /** Bảng "trước và sau": thêm lần lượt từng bước xử lý, đo sai số bằng cross-validation ngẫu nhiên và theo vùng. */
  import { imputeMedian, permutation, chunks, groupKFold, linFit, linPredict, rmse, fmt } from '../../lib/ml-core';
  import { loadCalifornia, block1, pick, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });

  const steps = [
    { name: 'Chỉ dùng thu nhập, như chương 1', note: '' },
    { name: '+ 7 cột số còn lại, phòng ngủ điền trung vị', note: 'Tuổi nhà, số phòng, phòng ngủ, dân số, số hộ, vĩ độ, kinh độ.' },
    { name: '+ vị trí so với biển, mã hoá one-hot', note: '4 cột 0/1.' },
    { name: '+ đặc trưng tự thiết kế', note: 'log thu nhập, log phòng mỗi hộ, log người mỗi hộ, phòng ngủ mỗi phòng.' },
    { name: '+ bỏ 965 khu vực bị chặn trần giá', note: 'Đổi cả bài toán: mô hình không còn dùng được cho nhà trên 500.000 USD.' },
  ];
  let rows = $state.raw<{ rnd: number; grp: number }[]>([]);
  $effect(() => {
    const c = cal;
    if (!c) return;
    const bed = imputeMedian(c.bedrooms);
    const build = (s: number) => Array.from({ length: c.n }, (_, i) => {
      const r = [c.income[i]];
      if (s >= 1) r.push(c.age[i], c.rooms[i], bed[i], c.pop[i], c.hh[i], c.lat[i], c.lon[i]);
      if (s >= 2) for (let k = 1; k < 5; k++) r.push(c.ocean[i] === k ? 1 : 0);
      if (s >= 3) r.push(Math.log(c.income[i]), Math.log(c.rooms[i] / c.hh[i]), bed[i] / c.rooms[i], Math.log(c.pop[i] / c.hh[i]));
      return r;
    });
    const fold = groupKFold(block1(c), 5), rndF = chunks(permutation(c.n, 42), 5);
    let s = 0, h = 0;
    const tick = () => {
      const X = build(Math.min(s, 3));
      const keep = s === 4 ? (i: number) => c.value[i] < 5.00001 : () => true;
      const cv = (folds: number[][]) => folds.reduce((a, te0) => {
        const inF = new Set(te0), te = te0.filter(keep), tr: number[] = [];
        for (let i = 0; i < c.n; i++) if (!inF.has(i) && keep(i)) tr.push(i);
        return a + rmse(linPredict(linFit(pick(X, tr), pick(c.value, tr)), pick(X, te)), pick(c.value, te));
      }, 0) / folds.length;
      const grpF = [0, 1, 2, 3, 4].map((k) => fold.map((f, i) => (f === k ? i : -1)).filter((i) => i >= 0));
      rows = [...rows, { rnd: cv(rndF), grp: cv(grpF) }];
      if (++s < steps.length) h = window.setTimeout(tick, 20);
    };
    rows = [];
    h = window.setTimeout(tick, 30);
    return () => clearTimeout(h);
  });
</script>

<div class="lab">
  <p class="lab-title">Trước và sau: mỗi bước xử lý đáng bao nhiêu?</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else}
    <p class="lab-hint">Cùng một mô hình hồi quy tuyến tính, chỉ dữ liệu thay đổi. Mỗi dòng thêm một bước vào dòng trên. RMSE trung bình của 5 phần, đơn vị 100.000 USD; cột phải chia phần theo ô địa lý 1° (GroupKFold).</p>
    <table class="data">
      <thead><tr><th>Dữ liệu đưa vào mô hình</th><th>RMSE, chia ngẫu nhiên</th><th>RMSE, chia theo vùng</th><th>Giảm so với dòng trên</th></tr></thead>
      <tbody>
        {#each steps as st, i}
          {@const r = rows[i]}
          <tr>
            <td class="nm">{st.name}{#if st.note}<span>{st.note}</span>{/if}</td>
            <td>{r ? fmt(r.rnd, 4) : '…'}</td><td>{r ? fmt(r.grp, 4) : '…'}</td>
            <td>{r && i > 0 && rows[i - 1] ? `${fmt((100 * (rows[i - 1].rnd - r.rnd)) / rows[i - 1].rnd, 1)}%` : ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">Mô hình không đổi một dòng mã nào, sai số vẫn giảm hơn một phần tư. Cột chia theo vùng luôn cao hơn cột chia ngẫu nhiên: đó là cái giá của việc dự đoán cho vùng chưa từng thấy. Dòng cuối giảm nhiều nhất nhưng là một quyết định về phạm vi, không phải "làm sạch": cần ghi rõ trong phiếu dữ liệu.</p>
  {/if}
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
  td.nm { white-space: normal; font-family: var(--serif); text-align: left; font-size: 0.88rem; }
  td.nm span { display: block; color: var(--pencil); font-size: 0.8rem; }
</style>
