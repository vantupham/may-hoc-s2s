<script lang="ts">
  /** Điền tuổi trên Titanic theo danh xưng trong tên (Mr, Mrs, Miss, Master). */
  import { median } from '../../lib/ml-core';
  interface P { name: string; age: number; ageMissing: boolean; pclass: number }
  let { people }: { people: P[] } = $props();
  const vi: Record<string, string> = { Mr: 'ông', Mrs: 'bà (đã kết hôn)', Miss: 'cô (chưa kết hôn)', Master: 'cậu bé', khác: 'khác (Dr, Rev, …)' };
  const titleOf = (n: string) => { const t = /,\s*([^.]+)\./.exec(n)?.[1].trim() ?? ''; return ['Mr', 'Mrs', 'Miss', 'Master'].includes(t) ? t : 'khác'; };
  const groups = $derived(['Mr', 'Mrs', 'Miss', 'Master', 'khác'].map((t) => {
    const g = people.filter((p) => titleOf(p.name) === t), known = g.filter((p) => !p.ageMissing).map((p) => p.age);
    return { t, n: g.length, miss: g.length - known.length, med: median(known) };
  }));
  const all = $derived(median(people.filter((p) => !p.ageMissing).map((p) => p.age)));
  const master = $derived(groups.find((g) => g.t === 'Master')!);
</script>

<div class="lab">
  <p class="lab-title">Titanic: 177 hành khách không rõ tuổi</p>
  <p class="lab-hint">Danh xưng trong tên hành khách mang thông tin về tuổi: "Master" là cách gọi bé trai, "Miss" thường là phụ nữ trẻ chưa kết hôn. Điền tuổi theo nhóm danh xưng thay vì một con số chung.</p>
  <table class="data">
    <thead><tr><th>Danh xưng</th><th>Số người</th><th>Không rõ tuổi</th><th>Trung vị tuổi đã biết</th></tr></thead>
    <tbody>
      {#each groups as g}<tr><td>{g.t} — {vi[g.t]}</td><td>{g.n}</td><td>{g.miss}</td><td>{String(g.med).replace('.', ',')}</td></tr>{/each}
      <tr class="sum"><td>Mọi hành khách</td><td>{people.length}</td><td>{people.filter((p) => p.ageMissing).length}</td><td>{String(all).replace('.', ',')}</td></tr>
    </tbody>
  </table>
  <p class="cap">Điền trung vị chung, {master.miss} cậu bé không rõ tuổi sẽ thành người {all} tuổi. Điền theo danh xưng, các em được {String(master.med).replace('.', ',')} tuổi. Với một mô hình đoán ai sống sót — nơi "phụ nữ và trẻ em lên xuồng trước" — khác biệt đó là cả một quy tắc.</p>
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
  .sum td { border-top: 1.5px solid var(--ink); }
</style>
