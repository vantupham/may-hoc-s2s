<script lang="ts">
  /** Ma trận tương quan bấm được; chuyển các cột đếm sang "mỗi hộ" để thấy tương quan giả biến mất. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { pearson, permutation, fmt, tex } from '../../lib/ml-core';
  import type { Calc } from '../../lib/ml-core';
  import { loadCalifornia, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });
  let perHh = $state(false);

  const names = $derived(['thu nhập', 'giá nhà', 'tuổi nhà', perHh ? 'phòng/hộ' : 'số phòng', perHh ? 'phòng ngủ/hộ' : 'số phòng ngủ', perHh ? 'người/hộ' : 'dân số', 'số hộ', 'vĩ độ', 'kinh độ']);
  const cols = $derived.by(() => {
    if (!cal) return [] as (number | null)[][];
    const c = cal, per = (a: (number | null)[]) => a.map((v, i) => (v === null ? null : v / c.hh[i]));
    return [c.income, c.value, c.age, perHh ? per(c.rooms) : c.rooms, perHh ? per(c.bedrooms) : c.bedrooms, perHh ? per(c.pop) : c.pop, c.hh, c.lat, c.lon];
  });
  const M = $derived(cols.map((a) => cols.map((b) => pearson(a, b))));
  let sel = $state<[number, number]>([0, 1]);
  const sample = $derived(cal ? permutation(cal.n, 9).slice(0, 1500) : []);

  const calc = $derived.by((): Calc | null => {
    if (!cal) return null;
    const [a, b] = sel, x = cols[a], y = cols[b];
    let n = 0, sx = 0, sy = 0;
    for (let i = 0; i < x.length; i++) if (x[i] !== null && y[i] !== null) { n++; sx += x[i]!; sy += y[i]!; }
    const mx = sx / n, my = sy / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) if (x[i] !== null && y[i] !== null) { const p = x[i]! - mx, q = y[i]! - my; sxy += p * q; sxx += p * p; syy += q * q; }
    const r = sxy / Math.sqrt(sxx * syy);
    return { key: 'r', name: `Tương quan giữa ${names[a]} và ${names[b]} trên ${n.toLocaleString('vi-VN')} khu vực`, value: r,
      formula: String.raw`r = \frac{\sum_i (x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum_i (x_i-\bar x)^2}\,\sqrt{\sum_i (y_i-\bar y)^2}}`,
      substituted: String.raw`r = \frac{${tex(sxy, 1)}}{\sqrt{${tex(sxx, 1)}}\cdot\sqrt{${tex(syy, 1)}}} = ${tex(r, 3)}`,
      note: `x̄ = ${fmt(mx, 3)}, ȳ = ${fmt(my, 3)}. Phép tính trên 10 dòng ở phần 4 là cùng công thức này.` };
  });

  const C = 34, L = 96;
  const W = 560, H = 300, m = { t: 12, r: 14, b: 42, l: 54 };
  const ext = (a: (number | null)[]) => { const v = sample.map((i) => a[i]).filter((t): t is number => t !== null).sort((p, q) => p - q); return [v[0], v[Math.floor(v.length * 0.99)]]; };
  const sx = $derived(cols.length ? scaleLinear().domain(ext(cols[sel[0]])).nice().range([m.l, W - m.r]) : scaleLinear());
  const sy = $derived(cols.length ? scaleLinear().domain(ext(cols[sel[1]])).nice().range([H - m.b, m.t]) : scaleLinear());
</script>

<div class="lab">
  <p class="lab-title">Tương quan không phải là nhân quả</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else}
    <p class="lab-hint">Mỗi ô là hệ số Pearson r giữa hai cột, tính trên toàn bộ 20.640 khu vực. Màu tím: cùng tăng; màu cam: cái này tăng thì cái kia giảm. Bấm một ô để xem đồ thị và phép tính.</p>
    <div class="ctrl"><label><input type="checkbox" bind:checked={perHh} /> Chia số phòng, phòng ngủ, dân số cho số hộ</label></div>
    <div class="lab-grid">
      <div class="mx-wrap">
        <svg class="mx" viewBox={`0 0 ${L + C * 9 + 40} ${L + C * 9}`} role="img" aria-label="Ma trận tương quan">
          {#each names as nm, i}
            <text x={L - 6} y={L + i * C + C / 2 + 4} text-anchor="end" font-size="11" fill="var(--ink)">{nm}</text>
            <text transform={`translate(${L + i * C + C / 2 + 4},${L - 6}) rotate(-60)`} font-size="11" fill="var(--ink)">{nm}</text>
          {/each}
          {#each M as row, i}
            {#each row as r, j}
              <g role="button" tabindex="0" aria-label={`${names[i]} và ${names[j]}: r = ${fmt(r, 2)}`} onclick={() => (sel = [i, j])} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (sel = [i, j])} class="cell">
                <rect x={L + j * C} y={L + i * C} width={C - 2} height={C - 2} fill={r >= 0 ? 'var(--tim)' : 'var(--c-L)'} fill-opacity={Math.abs(r) * 0.85} stroke={sel[0] === i && sel[1] === j ? 'var(--ink)' : 'none'} stroke-width="2" />
                <text x={L + j * C + C / 2 - 1} y={L + i * C + C / 2 + 3} text-anchor="middle" font-size="10" fill={Math.abs(r) > 0.55 ? 'var(--paper)' : 'var(--ink)'}>{fmt(r, 2).replace('0,', ',')}</text>
              </g>
            {/each}
          {/each}
        </svg>
      </div>
      <div>
        <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Đồ thị ${names[sel[0]]} và ${names[sel[1]]}`}>
          <defs><clipPath id="corr-clip"><rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} /></clipPath></defs>
          <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label={names[sel[0]]} ticks={5} />
          <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label={names[sel[1]]} ticks={5} />
          <g clip-path="url(#corr-clip)">
            {#each sample as i}
              {@const a = cols[sel[0]][i]}{@const b = cols[sel[1]][i]}
              {#if a !== null && b !== null}<circle cx={sx(a)} cy={sy(b)} r="1.8" fill="var(--tim)" fill-opacity="0.3" />{/if}
            {/each}
          </g>
        </svg>
        <p class="cap">1.500 khu vực ngẫu nhiên; 1% giá trị lớn nhất nằm ngoài khung.</p>
      </div>
    </div>
    {#if calc}<CalcCard calc={calc} digits={2} />{/if}
    <p class="cap">{perHh ? 'Sau khi chia cho số hộ, tương quan 0,9 giữa số phòng và dân số gần như biến mất. Chúng chưa từng gây ra nhau: cả hai chỉ cùng lớn lên theo cỡ khu vực.' : 'Số phòng và dân số có r ≈ 0,86. Nhiều phòng không làm đông người hơn, đông người cũng không tạo ra phòng: cả hai cùng tăng theo cỡ của khu vực. Đánh dấu ô phía trên để chia cho số hộ.'}</p>
  {/if}
</div>

<style>
  .mx { width: 100%; max-width: 420px; }
  .cell { cursor: pointer; }
  .cell:focus-visible rect { stroke: var(--tim); }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
