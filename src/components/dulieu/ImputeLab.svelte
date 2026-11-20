<script lang="ts">
  /** So 5 cách xử lý 207 ô thiếu số phòng ngủ: giấu thêm 1.000 ô đã biết để chấm điểm từng cách. */
  import { imputeMean, imputeMedian, imputeGroupMedian, knnImpute, standardize, permutation, chunks, linFit, linPredict, rmse, fmt } from '../../lib/ml-core';
  import type { Cell } from '../../lib/ml-core';
  import { loadCalifornia, houseFeatures, pick, oceanVi, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });

  const methods = [
    { k: 'drop', name: 'Bỏ dòng thiếu', why: 'Mất 207 khu vực. Chỉ an toàn khi dữ liệu thiếu hoàn toàn ngẫu nhiên.' },
    { k: 'mean', name: 'Trung bình', why: 'Một con số cho mọi ô thiếu, bị kéo lên bởi các khu vực rất lớn.' },
    { k: 'median', name: 'Trung vị', why: 'Như trung bình nhưng không bị đuôi dài kéo lệch.' },
    { k: 'group', name: 'Trung vị theo vị trí', why: 'Mỗi loại vị trí một con số. Hợp lý khi việc thiếu phụ thuộc vào nhóm.' },
    { k: 'knn', name: 'KNN, 5 láng giềng', why: 'Tìm 5 khu vực giống nhất về số phòng, số hộ, dân số rồi lấy trung bình phòng ngủ của chúng.' },
  ] as const;
  type K = (typeof methods)[number]['k'];

  interface Res { mae: Record<K, number | null>; cv: Record<K, number>; filled: Record<K, number[]>; nb: Map<number, { idx: number[]; dist: number[] }> }
  let res = $state.raw<Res | null>(null);

  function fillAll(c: Cal, col: Cell[], Z: number[][]) {
    const g = c.ocean.map((o) => c.cats[o]);
    const kn = knnImpute(Z, col, 5);
    return { mean: imputeMean(col), median: imputeMedian(col), group: imputeGroupMedian(col, g), knn: kn.values, nb: kn.neighbours };
  }
  $effect(() => {
    const c = cal;
    if (!c) return;
    const h = setTimeout(() => {
      const Z = [c.rooms, c.hh, c.pop].map((a) => standardize(a).z);
      // 1) Giấu thêm 1.000 ô đã biết rồi đoán lại
      const known = c.bedrooms.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
      const hide = permutation(known.length, 7).slice(0, 1000).map((k) => known[k]);
      const col2 = [...c.bedrooms]; for (const i of hide) col2[i] = null;
      const f2 = fillAll(c, col2, Z);
      const mae = (v: number[]) => hide.reduce((a, i) => a + Math.abs(v[i] - (c.bedrooms[i] as number)), 0) / hide.length;
      // 2) Điền 207 ô thiếu thật, rồi chấm mô hình giá nhà bằng cross-validation 5 phần
      const f = fillAll(c, c.bedrooms, Z);
      const folds = chunks(permutation(c.n, 42), 5);
      const cv = (bed: number[], keep: (i: number) => boolean) => {
        const X = houseFeatures(c, bed);
        let s = 0;
        for (const fo of folds) {
          const te = fo.filter(keep), inF = new Set(fo);
          const tr: number[] = []; for (let i = 0; i < c.n; i++) if (!inF.has(i) && keep(i)) tr.push(i);
          s += rmse(linPredict(linFit(pick(X, tr), pick(c.value, tr)), pick(X, te)), pick(c.value, te));
        }
        return s / folds.length;
      };
      const all = () => true;
      res = {
        mae: { drop: null, mean: mae(f2.mean), median: mae(f2.median), group: mae(f2.group), knn: mae(f2.knn) },
        cv: { drop: cv(f.median, (i) => c.bedrooms[i] !== null), mean: cv(f.mean, all), median: cv(f.median, all), group: cv(f.group, all), knn: cv(f.knn, all) },
        filled: { drop: f.median, mean: f.mean, median: f.median, group: f.group, knn: f.knn },
        nb: f.nb,
      };
    }, 30);
    return () => clearTimeout(h);
  });

  const missing = $derived(cal ? cal.bedrooms.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0) : []);
  let mi = $state(0);
  const row = $derived(missing[mi]);
  const nb = $derived(res && row !== undefined ? res.nb.get(row) : undefined);
</script>

<div class="lab">
  <p class="lab-title">Năm cách xử lý 207 ô thiếu số phòng ngủ</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else if !res}<p class="lab-hint">Đang điền và chấm điểm năm cách (học lại 25 mô hình)…</p>{:else}
    <p class="lab-hint">Ta không biết giá trị thật của 207 ô thiếu, nên không chấm trực tiếp được. Mẹo: giấu thêm 1.000 ô <b>đã biết</b>, cho mỗi cách đoán lại, rồi so với giá trị thật. Cột cuối đo ảnh hưởng lên mô hình giá nhà (RMSE cross-validation 5 phần, đơn vị 100.000 USD).</p>
    <table class="data">
      <thead><tr><th>Cách xử lý</th><th>Sai số trung bình khi đoán<br />1.000 ô bị giấu (phòng)</th><th>RMSE mô hình giá nhà</th><th>Ghi chú</th></tr></thead>
      <tbody>
        {#each methods as m}
          <tr><td>{m.name}</td><td>{res.mae[m.k] === null ? '—' : fmt(res.mae[m.k]!, 1)}</td><td>{fmt(res.cv[m.k], 4)}</td><td class="why">{m.why}</td></tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">KNN đoán từng ô chính xác gấp nhiều lần, vì số phòng ngủ gắn rất chặt với số phòng và số hộ. Nhưng RMSE của mô hình giá nhà gần như không đổi giữa các cách: 207 ô chỉ là 1% dữ liệu, và phòng ngủ không phải đặc trưng quan trọng nhất. Cách điền quan trọng khi tỷ lệ thiếu lớn hoặc khi chính cột đó là thứ cần dùng.</p>

    <h4>Xem một ô thiếu thật</h4>
    <div class="ctrl"><label>Ô thiếu thứ <span class="num">{mi + 1}</span> / 207<input type="range" min="0" max={missing.length - 1} bind:value={mi} aria-label="Chọn ô thiếu" /></label></div>
    <p>Khu vực dòng {row}: {cal.rooms[row]} phòng, {cal.hh[row]} hộ, {cal.pop[row]} người, {oceanVi[cal.cats[cal.ocean[row]]]}. Các cách điền cho ra:
      {#each methods.slice(1) as m, j}<span class="num">{m.name.toLowerCase()} {fmt(res.filled[m.k][row], 1)}</span>{j < 3 ? '; ' : '.'}{/each}</p>
    {#if nb}
      <table class="data">
        <thead><tr><th>Láng giềng</th><th>Số phòng</th><th>Số hộ</th><th>Dân số</th><th>Phòng ngủ</th><th>Khoảng cách</th></tr></thead>
        <tbody>
          {#each nb.idx as j, q}<tr><td>dòng {j}</td><td>{cal.rooms[j]}</td><td>{cal.hh[j]}</td><td>{cal.pop[j]}</td><td>{cal.bedrooms[j]}</td><td>{fmt(nb.dist[q], 4)}</td></tr>{/each}
          <tr class="sum"><td>Trung bình</td><td></td><td></td><td></td><td><b>{fmt(res.filled.knn[row], 1)}</b></td><td></td></tr>
        </tbody>
      </table>
      <p class="cap">Khoảng cách Euclid trên ba cột đã chuẩn hoá (số phòng, số hộ, dân số). Không chuẩn hoá thì cột dân số, với giá trị lớn nhất, sẽ át hai cột kia.</p>
    {/if}
  {/if}
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
  td.why { white-space: normal; font-family: var(--serif); text-align: left; min-width: 14rem; }
  h4 { margin: 1.4rem 0 0.2rem; }
  .sum td { border-top: 1.5px solid var(--ink); }
</style>
