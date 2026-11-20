<script lang="ts">
  /**
   * CNN 1D (chương 10, một chiều): 3 bộ lọc dài 6 giờ trượt dọc 72 giờ của 4 kênh (PM2.5, gió, độ ẩm, lớp biên),
   * ReLU, rồi lấy trung bình và giá trị cuối của mỗi bản đồ. Trọng số học bằng NumPy; trình duyệt tính lại từng phép nhân.
   */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { conv1dCalc, fmt } from '../../lib/ml-core';
  import { cnn72, fmtDate, type Nets } from '../../lib/khongkhi';

  let { nets }: { nets: Nets } = $props();
  const chVi = ['PM2.5', 'gió', 'độ ẩm', 'lớp biên'];
  const unit = ['µg/m³', 'm/s', '%', 'm'];
  let pick = $state('2026-01-08');
  const win = $derived(nets.wins.find((w) => w.d === pick) ?? nets.wins[0]);
  const r = $derived(cnn72(nets.cnn, win));
  let f = $state(0);
  let t = $state(60);
  const calc = $derived(conv1dCalc(win.x, nets.cnn.w[f], nets.cnn.b[f], t, chVi));
  // Đổi về đơn vị thật: PM2.5 chỉ chia 100; các kênh khác chuẩn hoá theo tập huấn luyện
  const real = (c: number, v: number) => (c === 0 ? v * 100 : v * nets.hs[c] + nets.hm[c]);
  const col = ['var(--c-y)', 'var(--c-w)', 'var(--c-x)', 'var(--c-b)'];

  const W = 620, RH = 54, mg = { l: 70, r: 10 };
  const sx = $derived(scaleLinear().domain([0, nets.L - 1]).range([mg.l, W - mg.r]));
  const rowY = (c: number) => 8 + c * (RH + 6);
  const lineOf = (c: number) => {
    const v = win.x.map((p) => p[c]), lo = Math.min(...v), hi = Math.max(...v) || 1;
    const sy = scaleLinear().domain([lo, hi === lo ? lo + 1 : hi]).range([rowY(c) + RH, rowY(c) + 4]);
    return v.map((y, i) => `${i ? 'L' : 'M'}${sx(i)},${sy(y)}`).join('');
  };
  const MH = 70;
  const mapTop = 8 + 4 * (RH + 6) + 10;
  const mapY = $derived(scaleLinear().domain([0, Math.max(0.01, ...r.maps[f])]).range([mapTop + MH, mapTop]));
  const H = mapTop + MH + 26;
  const vmax = $derived(Math.max(...nets.cnn.w[f].flat().map(Math.abs)));
  const heat = (v: number) => v >= 0 ? `color-mix(in srgb, var(--c-pos) ${Math.round((v / vmax) * 85)}%, transparent)` : `color-mix(in srgb, var(--c-neg) ${Math.round((-v / vmax) * 85)}%, transparent)`;
</script>

<div class="lab">
  <p class="lab-title">Tích chập 1D: bộ lọc 6 giờ trượt dọc 72 giờ</p>
  <p class="lab-hint">Bốn hàng trên cùng là 72 giờ cuối của ngày đang chọn, kết thúc lúc 23 giờ. Bộ lọc là một bảng 6 giờ × 4 kênh. Đặt nó lên 6 giờ liên tiếp, nhân từng ô với nhau rồi cộng lại, ta được một số. Trượt dần sang phải, ta được bản đồ đặc trưng ở hàng cuối (sau ReLU). Bấm vào bản đồ để chọn vị trí.</p>
  <div class="ctrl">
    <label>Hôm nay là <select bind:value={pick} aria-label="Ngày">{#each nets.wins as w}<option value={w.d}>{fmtDate(w.d)}</option>{/each}</select></label>
    <span>Bộ lọc</span>
    {#each nets.cnn.w as _, k}<button class="chip" class:sel={f === k} type="button" onclick={() => (f = k)}>{k + 1}</button>{/each}
    <label>Vị trí t = <b class="num">{t}</b><input type="range" min="0" max={nets.L - nets.K} bind:value={t} aria-label="Vị trí bộ lọc" /></label>
  </div>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bốn kênh đầu vào và bản đồ đặc trưng">
    {#each chVi as c, k}
      <text x={mg.l - 8} y={rowY(k) + RH / 2 + 4} text-anchor="end" class="lbl">{c}</text>
      <path d={lineOf(k)} fill="none" stroke={col[k]} stroke-width="1.6" />
    {/each}
    <rect x={sx(t) - 3} y={4} width={sx(t + nets.K - 1) - sx(t) + 6} height={4 * (RH + 6)} fill="var(--hl)" opacity="0.45" stroke="var(--ink)" stroke-width="1" />
    {#each [0, 24, 48] as h}<line x1={sx(h)} x2={sx(h)} y1={4} y2={H - 22} stroke="var(--rule-2)" stroke-dasharray="2 3" />{/each}
    <text x={mg.l - 8} y={mapTop + MH / 2 + 4} text-anchor="end" class="lbl">bản đồ {f + 1}</text>
    {#each r.maps[f] as v, i}
      <rect x={sx(i + nets.K - 1) - 3} y={mapY(v)} width="6" height={mapTop + MH - mapY(v)} fill={i === t ? 'var(--ink)' : 'var(--c-z)'} opacity={i === t ? 1 : 0.55}
        role="button" tabindex="-1" onclick={() => (t = i)} onkeydown={() => {}} style="cursor:pointer" />
    {/each}
    {#each [0, 24, 48, 71] as h}<text x={sx(h)} y={H - 8} text-anchor="middle" class="lbl">{h === 71 ? '23h hôm nay' : h === 0 ? '0h, 2 ngày trước' : h === 24 ? '0h hôm qua' : '0h hôm nay'}</text>{/each}
  </svg>
  <div class="lab-grid">
    <div>
      <p class="h">Bộ lọc {f + 1}: 6 giờ × 4 kênh <span class="nt">(đỏ dương, xanh âm)</span></p>
      <table class="data filt">
        <thead><tr><th>giờ</th>{#each chVi as c}<th>{c}</th>{/each}</tr></thead>
        <tbody>
          {#each nets.cnn.w[f] as row, j}
            <tr><td>t+{j}</td>{#each row as v}<td style:background={heat(v)}>{fmt(Math.round(v * 100) / 100, 2)}</td>{/each}</tr>
          {/each}
        </tbody>
      </table>
      <p class="cap">Đầu vào tại vị trí này: PM2.5 {fmt(real(0, win.x[t + nets.K - 1][0]), 0)} {unit[0]}, gió {fmt(real(1, win.x[t + nets.K - 1][1]), 1)} {unit[1]} lúc giờ thứ {t + nets.K - 1}. Các kênh khác PM2.5 đã được chuẩn hoá theo tập huấn luyện. PM2.5 chỉ chia cho 100.</p>
    </div>
    <div>
      <CalcCard {calc} digits={3} />
      <p class="cap">Sau ReLU: max(0; {fmt(calc.value, 3)}) = {fmt(Math.max(0, calc.value), 3)}.</p>
    </div>
  </div>
  <table class="data">
    <thead><tr><th>Từ 3 bộ lọc (trung bình và giá trị cuối)</th><th>Từ thời tiết ngày mai</th><th>Hệ số chặn</th><th>Dự báo</th><th>Thật</th></tr></thead>
    <tbody><tr><td>{fmt(r.fromConv * 100, 1)}</td><td>{fmt(r.fromTom * 100, 1)}</td><td>{fmt(nets.cnn.c * 100, 1)}</td><td><b>{fmt(r.pred, 1)}</b> µg/m³</td><td>{fmt(win.y, 1)}</td></tr></tbody>
  </table>
</div>

<style>
  .lbl { font-size: 10.5px; fill: var(--pencil); font-family: var(--mono); }
  .h { font-weight: 600; font-size: 0.92rem; margin: 0.6rem 0 0.3rem; }
  .nt { font-weight: 400; color: var(--faint); font-size: 0.8rem; }
  .filt td { text-align: center; }
  .cap { font-size: 0.85rem; color: var(--pencil); }
</style>
