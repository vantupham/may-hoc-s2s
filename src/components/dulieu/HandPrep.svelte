<script lang="ts">
  /** Tính tay các bước xử lý trên 6 khu vực: điền trung vị theo nhóm, one-hot, chuẩn hoá, min-max, log. */
  import CalcCard from '../CalcCard.svelte';
  import { oneHot, fmt } from '../../lib/ml-core';
  import type { Calc } from '../../lib/ml-core';
  import { oceanVi } from '../../lib/dulieu';

  interface R { id: number; rooms: number; bedrooms: number | null; filled: number; pop: number; income: number; ocean: number }
  let { rows, cats, calcs, labels }: { rows: R[]; cats: string[]; calcs: Calc[]; labels: string[] } = $props();
  const oh = $derived(oneHot(rows.map((r) => r.ocean), cats.length));
  let k = $state(0);
</script>

<div class="lab">
  <p class="lab-title">Sáu khu vực đi qua dây chuyền xử lý</p>
  <p class="lab-hint">Hai khu vực thiếu số phòng ngủ. Cột vị trí là chữ, cần đổi thành số. Thu nhập và dân số có thang đo rất khác nhau. Chọn một bước để xem phép tính.</p>
  <table class="data">
    <thead><tr><th>Khu vực</th><th>Số phòng</th><th>Phòng ngủ</th><th>→ sau khi điền</th><th>Dân số</th><th>Thu nhập</th><th>Vị trí</th></tr></thead>
    <tbody>
      {#each rows as r}
        <tr><td>{r.id}</td><td>{r.rooms}</td><td class:miss={r.bedrooms === null}>{r.bedrooms ?? 'trống'}</td><td class:fill={r.bedrooms === null}>{fmt(r.filled, 1)}</td><td>{r.pop}</td><td>{fmt(r.income, 4)}</td><td>{oceanVi[cats[r.ocean]]}</td></tr>
      {/each}
    </tbody>
  </table>
  <p class="cap">One-hot cho cột vị trí: mỗi loại một cột 0/1, đúng một số 1 trên mỗi dòng.</p>
  <div class="oh">
    <table class="data">
      <thead><tr><th>Khu vực</th>{#each cats as c}<th>{oceanVi[c]}</th>{/each}</tr></thead>
      <tbody>
        {#each rows as r, i}<tr><td>{r.id}</td>{#each oh[i] as v}<td class:one={v === 1}>{v}</td>{/each}</tr>{/each}
      </tbody>
    </table>
  </div>
  <div class="ctrl">
    {#each labels as l, i}<button class="chip" class:sel={k === i} type="button" onclick={() => (k = i)}>{l}</button>{/each}
  </div>
  <CalcCard calc={calcs[k]} digits={3} />
</div>

<style>
  .miss { color: var(--bad); font-style: italic; }
  .fill { background: var(--hl); font-weight: 700; }
  .one { background: var(--tim-soft); font-weight: 700; }
  .oh { overflow-x: auto; }
  .cap { font-size: 0.86rem; color: var(--pencil); margin: 1rem 0 0.3rem; }
</style>
