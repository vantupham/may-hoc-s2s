<script lang="ts">
  /** Tính tay trên 10 khu vực: sắp xếp, tứ phân vị, giới hạn IQR, điểm z, hệ số tương quan. */
  import CalcCard from '../CalcCard.svelte';
  import Tex from '../Tex.svelte';
  import { quantileCalc, sortNum, iqrBounds, pearsonCalc, avg, std, fmt, tex } from '../../lib/ml-core';
  import type { Calc } from '../../lib/ml-core';

  interface R { id: number; income: number; value: number }
  let { rows }: { rows: R[] } = $props();
  const x = $derived(rows.map((r) => r.income));
  const y = $derived(rows.map((r) => r.value));
  const s = $derived(sortNum(x));
  const b = $derived(iqrBounds(s));
  const mu = $derived(avg(x));
  const sd = $derived(std(x, 0));
  const top = $derived(x.indexOf(Math.max(...x)));

  const calcs = $derived.by((): Calc[] => {
    const z = (x[top] - mu) / sd;
    return [
      quantileCalc(s, 0.25, 'Tứ phân vị thứ nhất Q1', 'q1'),
      quantileCalc(s, 0.5, 'Trung vị Q2', 'q2'),
      quantileCalc(s, 0.75, 'Tứ phân vị thứ ba Q3', 'q3'),
      {
        key: 'iqr', name: 'Giới hạn ngoại lai theo quy tắc 1,5·IQR', value: b.hi,
        formula: String.raw`\text{IQR} = Q_3 - Q_1,\quad [\,Q_1 - 1{,}5\,\text{IQR},\; Q_3 + 1{,}5\,\text{IQR}\,]`,
        substituted: String.raw`\text{IQR} = ${tex(b.q3, 4)} - ${tex(b.q1, 4)} = ${tex(b.iqr, 4)},\quad [\,${tex(b.lo, 3)},\; ${tex(b.hi, 3)}\,]`,
        note: `Khu vực có thu nhập ${fmt(x[top], 4)} nằm ${x[top] > b.hi ? 'ngoài' : 'trong'} giới hạn trên ${fmt(b.hi, 3)}.`,
      },
      {
        key: 'z', name: 'Điểm z của khu vực thu nhập cao nhất', value: z,
        formula: String.raw`z = \frac{x - \bar x}{\sigma},\quad \sigma = \sqrt{\tfrac{1}{n}\sum_i (x_i - \bar x)^2}`,
        substituted: String.raw`z = \frac{${tex(x[top], 4)} - ${tex(mu, 4)}}{${tex(sd, 4)}} = ${tex(z, 3)}`,
        note: 'Quy tắc thường dùng: |z| > 3 là ngoại lai. Nhưng chính điểm ngoại lai đã kéo trung bình và độ lệch chuẩn lên, nên với mẫu nhỏ, điểm z dễ "bao che" cho nó.',
      },
      pearsonCalc(x, y, rows.map((r) => `khu ${r.id}`)),
    ];
  });
  let k = $state(0);
</script>

<div class="lab">
  <p class="lab-title">Mười khu vực, tính bằng tay</p>
  <p class="lab-hint">Chín khu vực chọn ngẫu nhiên và một khu vực có thu nhập ghi đúng 15,0001 — con số lớn nhất trong cả bộ dữ liệu. Chọn một phép tính để xem nó dùng những số nào.</p>
  <div class="lab-grid">
    <div>
      <table class="data">
        <thead><tr><th>Khu vực</th><th>Thu nhập x<br />(×10.000 USD)</th><th>Giá nhà y<br />(×100.000 USD)</th><th>Thứ tự của x</th></tr></thead>
        <tbody>
          {#each rows as r, i}
            <tr class:hot={i === top}><td>{r.id}</td><td>{fmt(r.income, 4)}</td><td>{fmt(r.value, 3)}</td><td>{s.indexOf(r.income)}</td></tr>
          {/each}
        </tbody>
      </table>
      <p class="cap">Dãy đã sắp xếp: <span class="num">{s.map((v) => fmt(v, 2)).join('; ')}</span></p>
      <p class="cap">Trung bình <Tex tex={String.raw`\bar x = ${tex(mu, 3)}`} />, trung vị {fmt(quantileCalc(s, 0.5, '').value, 3)}. Một khu vực đã kéo trung bình lệch xa trung vị.</p>
    </div>
    <div>
      <div class="ctrl">
        {#each calcs as c, i}<button class="chip" class:sel={k === i} type="button" onclick={() => (k = i)}>{['Q1', 'Q2', 'Q3', 'IQR', 'z', 'r'][i]}</button>{/each}
      </div>
      <CalcCard calc={calcs[k]} digits={3} />
    </div>
  </div>
</div>

<style>
  .hot td { background: var(--hl); }
  .cap { font-size: 0.86rem; color: var(--pencil); margin: 0.6rem 0 0; }
</style>
