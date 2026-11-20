<script lang="ts">
  /** Phiếu khám sức khoẻ dữ liệu: từng cột của 20.640 khu vực, kèm cờ cảnh báo. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { profile, histogram, present, sortNum, quantileCalc, fmt, tex } from '../../lib/ml-core';
  import type { Calc } from '../../lib/ml-core';
  import { loadCalifornia, oceanVi, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });

  const cols = [
    { k: 'income', name: 'Thu nhập trung vị', unit: '×10.000 USD', d: 4 },
    { k: 'value', name: 'Giá nhà trung vị', unit: '×100.000 USD', d: 3 },
    { k: 'age', name: 'Tuổi nhà trung vị', unit: 'năm', d: 1 },
    { k: 'rooms', name: 'Tổng số phòng', unit: 'phòng', d: 0 },
    { k: 'bedrooms', name: 'Tổng số phòng ngủ', unit: 'phòng', d: 0 },
    { k: 'pop', name: 'Dân số', unit: 'người', d: 0 },
    { k: 'hh', name: 'Số hộ', unit: 'hộ', d: 0 },
    { k: 'lat', name: 'Vĩ độ', unit: '°', d: 2 },
    { k: 'lon', name: 'Kinh độ', unit: '°', d: 2 },
    { k: 'ocean', name: 'Vị trí so với biển', unit: '', d: 0 },
  ] as const;
  let ci = $state(0);
  const col = $derived(cols[ci]);

  // Dòng trùng: hoàn toàn và trùng toạ độ (đếm như pandas duplicated: không tính lần xuất hiện đầu)
  const dups = $derived.by(() => {
    if (!cal) return { full: 0, coord: 0 };
    const seenC = new Set<string>(), seenF = new Set<string>();
    let full = 0, coord = 0;
    for (let i = 0; i < cal.n; i++) {
      const c = `${cal.lon[i]},${cal.lat[i]}`;
      const f = [c, cal.age[i], cal.rooms[i], cal.bedrooms[i], cal.pop[i], cal.hh[i], cal.income[i], cal.value[i], cal.ocean[i]].join(',');
      if (seenC.has(c)) coord++; else seenC.add(c);
      if (seenF.has(f)) full++; else seenF.add(f);
    }
    return { full, coord };
  });

  const vals = $derived(cal && col.k !== 'ocean' ? (cal as any)[col.k] as (number | null)[] : null);
  const p = $derived(vals ? profile(vals) : null);
  const sorted = $derived(vals ? sortNum(present(vals)) : []);
  const hist = $derived(p ? histogram(sorted, 40, p.min, p.max) : []);
  const counts = $derived(cal ? cal.cats.map((_, k) => cal!.ocean.filter((o) => o === k).length) : []);

  const flags = $derived.by(() => {
    if (!cal) return [];
    const n = cal.n, out: { bad: boolean; t: string }[] = [];
    if (col.k === 'ocean') {
      const few = counts.findIndex((c) => c < 30);
      out.push({ bad: true, t: `Loại "${oceanVi[cal.cats[few]]}" chỉ có ${counts[few]} khu vực (${fmt((100 * counts[few]) / n, 2)}%). Quá ít để mô hình học được điều gì về nhóm này.` });
      out.push({ bad: false, t: 'Đây là cột dạng chữ. Mô hình chỉ làm việc với số, nên cần mã hoá (bài 3B).' });
      return out;
    }
    if (!p) return out;
    if (p.missing) out.push({ bad: true, t: `Thiếu ${p.missing} ô (${fmt((100 * p.missing) / n, 2)}%).` });
    if (p.atMax > n * 0.002) out.push({ bad: true, t: `${p.atMax} khu vực có đúng giá trị lớn nhất ${fmt(p.max, col.d)}. Một đống dồn ở mép phải là dấu hiệu dữ liệu bị chặn trần: giá trị thật có thể còn lớn hơn.` });
    if (Math.abs(p.skew) > 1) out.push({ bad: true, t: `Lệch phải mạnh (độ lệch ${fmt(p.skew, 2)}): trung bình ${fmt(p.mean, col.d + 1)} lớn hơn trung vị ${fmt(p.median, col.d + 1)}.` });
    if (p.max > p.q3 + 3 * (p.q3 - p.q1)) out.push({ bad: false, t: `Giá trị lớn nhất gấp ${fmt(p.max / p.median, 0)} lần trung vị. Là lỗi hay là khu vực rất lớn? Phòng A2 sẽ xem.` });
    if (!out.length) out.push({ bad: false, t: 'Không thấy dấu hiệu bất thường rõ rệt.' });
    return out;
  });

  let pick = $state<'mean' | 'q1' | 'median' | 'q3'>('median');
  const calc = $derived.by((): Calc | null => {
    if (!p) return null;
    if (pick === 'mean') {
      const sum = sorted.reduce((a, v) => a + v, 0);
      return { key: 'mean', name: 'Trung bình', value: p.mean, formula: String.raw`\bar x = \frac{1}{n}\sum_{i=1}^{n} x_i`,
        substituted: String.raw`\bar x = \frac{${tex(sum, 2)}}{${p.count}} = ${tex(p.mean, 4)}`, note: p.missing ? `n là số ô có giá trị: ${p.count} (bỏ ${p.missing} ô thiếu).` : undefined };
    }
    const q = { q1: 0.25, median: 0.5, q3: 0.75 }[pick];
    return quantileCalc(sorted, q, { q1: 'Tứ phân vị Q1', median: 'Trung vị', q3: 'Tứ phân vị Q3' }[pick]);
  });

  const W = 560, H = 250, m = { t: 14, r: 14, b: 42, l: 50 };
  const sx = $derived(scaleLinear().domain(p ? [p.min, p.max] : [0, 1]).range([m.l, W - m.r]));
  const sy = $derived(scaleLinear().domain([0, Math.max(1, ...hist, ...counts)]).nice().range([H - m.b, m.t]));
</script>

<div class="lab">
  <p class="lab-title">Phiếu khám sức khoẻ cho 20.640 khu vực</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải toàn bộ dữ liệu (khoảng 300 KB)…</p>{:else}
    <p class="lab-hint">{cal.n.toLocaleString('vi-VN')} dòng, 10 cột. Dòng trùng hoàn toàn: <b>{dups.full}</b>. Dòng trùng toạ độ với một dòng khác: <b>{dups.coord.toLocaleString('vi-VN')}</b> — nhiều khu vực điều tra được ghi cùng một điểm trung tâm, điều sẽ gây chuyện khi chia train/test (bài 3B).</p>
    <div class="ctrl" role="group" aria-label="Chọn cột">
      {#each cols as c, i}<button class="chip" class:sel={ci === i} type="button" onclick={() => (ci = i)}>{c.name}</button>{/each}
    </div>
    <div class="lab-grid">
      <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Phân phối của cột ${col.name}`}>
        {#if col.k === 'ocean'}
          {#each counts as c, k}
            {@const bw = (W - m.l - m.r) / counts.length}
            <rect x={m.l + k * bw + 8} y={sy(c)} width={bw - 16} height={H - m.b - sy(c)} fill={c < 30 ? 'var(--bad)' : 'var(--tim)'} fill-opacity="0.75" />
            <text x={m.l + k * bw + bw / 2} y={H - m.b + 16} text-anchor="middle" font-size="12" fill="var(--ink)">{oceanVi[cal.cats[k]]}</text>
            <text x={m.l + k * bw + bw / 2} y={sy(c) - 5} text-anchor="middle" font-size="12" fill="var(--pencil)">{c}</text>
          {/each}
          <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Số khu vực" />
        {:else if p}
          {@const bw = (W - m.l - m.r) / hist.length}
          {#each hist as h, k}
            <rect x={m.l + k * bw} y={sy(h)} width={Math.max(0.5, bw - 1)} height={H - m.b - sy(h)} fill={k === hist.length - 1 && p.atMax > cal.n * 0.002 ? 'var(--bad)' : 'var(--tim)'} fill-opacity="0.7" />
          {/each}
          <line x1={sx(p.median)} x2={sx(p.median)} y1={m.t} y2={H - m.b} stroke="var(--ink)" stroke-dasharray="4 3" />
          <line x1={sx(p.mean)} x2={sx(p.mean)} y1={m.t} y2={H - m.b} stroke="var(--c-L)" stroke-width="1.5" />
          <text x={sx(p.median) - 4} y={m.t + 10} text-anchor="end" font-size="11" fill="var(--ink)">trung vị</text>
          <text x={sx(p.mean) + 4} y={m.t + 24} font-size="11" fill="var(--c-L)">trung bình</text>
          <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label={`${col.name} (${col.unit})`} ticks={5} />
          <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Số khu vực" ticks={4} />
        {/if}
      </svg>
      <div>
        {#if p}
          <table class="data">
            <tbody>
              <tr><td>Số ô có giá trị</td><td>{p.count.toLocaleString('vi-VN')}</td></tr>
              <tr><td>Ô thiếu</td><td class:bad={p.missing > 0}>{p.missing}</td></tr>
              <tr><td>Trung bình</td><td><button class="val" class:sel={pick === 'mean'} type="button" onclick={() => (pick = 'mean')}>{fmt(p.mean, col.d + 1)}</button></td></tr>
              <tr><td>Độ lệch chuẩn</td><td>{fmt(p.std, col.d + 1)}</td></tr>
              <tr><td>Nhỏ nhất</td><td>{fmt(p.min, col.d)}</td></tr>
              <tr><td>Q1 (25%)</td><td><button class="val" class:sel={pick === 'q1'} type="button" onclick={() => (pick = 'q1')}>{fmt(p.q1, col.d + 1)}</button></td></tr>
              <tr><td>Trung vị (50%)</td><td><button class="val" class:sel={pick === 'median'} type="button" onclick={() => (pick = 'median')}>{fmt(p.median, col.d + 1)}</button></td></tr>
              <tr><td>Q3 (75%)</td><td><button class="val" class:sel={pick === 'q3'} type="button" onclick={() => (pick = 'q3')}>{fmt(p.q3, col.d + 1)}</button></td></tr>
              <tr><td>Lớn nhất</td><td>{fmt(p.max, col.d)} <span class="dim">({p.atMax} dòng)</span></td></tr>
              <tr><td>Độ lệch (skew)</td><td>{fmt(p.skew, 2)}</td></tr>
            </tbody>
          </table>
        {:else}
          <table class="data"><thead><tr><th>Loại</th><th>Số khu vực</th></tr></thead><tbody>
            {#each counts as c, k}<tr><td>{oceanVi[cal.cats[k]]}</td><td>{c}</td></tr>{/each}
          </tbody></table>
        {/if}
      </div>
    </div>
    <ul class="flags">
      {#each flags as f}<li class:bad={f.bad}>{f.t}</li>{/each}
    </ul>
    {#if calc}<CalcCard calc={calc} digits={3} />{/if}
  {/if}
</div>

<style>
  .flags { margin: 0.8rem 0 0.4rem; padding-left: 1.2rem; font-size: 0.92rem; }
  .flags li { margin: 0.2rem 0; }
  .flags li.bad::marker { content: '⚑  '; color: var(--bad); }
  td.bad { color: var(--bad); font-weight: 700; }
  .dim { color: var(--faint); }
</style>
