<script lang="ts">
  /** Ngoại lai: quy tắc IQR và điểm z trên toàn bộ dữ liệu; kéo một điểm để thấy đường hồi quy bị kéo theo. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { sortNum, iqrBounds, avg, std, fmt, linFit, permutation } from '../../lib/ml-core';
  import { loadCalifornia, oceanVi, type Cal } from '../../lib/dulieu';

  let cal = $state.raw<Cal | null>(null);
  let err = $state('');
  $effect(() => { loadCalifornia().then((c) => (cal = c)).catch((e) => (err = e.message)); });

  const cols = [
    { k: 'pph', name: 'Người mỗi hộ', d: 2, f: (c: Cal, i: number) => c.pop[i] / c.hh[i] },
    { k: 'rph', name: 'Phòng mỗi hộ', d: 2, f: (c: Cal, i: number) => c.rooms[i] / c.hh[i] },
    { k: 'income', name: 'Thu nhập', d: 3, f: (c: Cal, i: number) => c.income[i] },
  ];
  let ci = $state(0);
  let method = $state<'iqr' | 'z'>('iqr');
  let kIqr = $state(1.5);
  let kZ = $state(3);

  const v = $derived(cal ? Array.from({ length: cal.n }, (_, i) => cols[ci].f(cal!, i)) : []);
  const s = $derived(sortNum(v));
  const b = $derived(s.length ? iqrBounds(s, kIqr) : null);
  const mu = $derived(v.length ? avg(v) : 0);
  const sd = $derived(v.length ? std(v, 0) : 1);
  const lo = $derived(method === 'iqr' ? b?.lo ?? 0 : mu - kZ * sd);
  const hi = $derived(method === 'iqr' ? b?.hi ?? 0 : mu + kZ * sd);
  const out = $derived(v.map((x, i) => i).filter((i) => v[i] < lo || v[i] > hi));
  const extremes = $derived([...out].sort((a, z) => v[z] - v[a]).slice(0, 5));

  // Thang log để thấy được cả đuôi dài
  const W = 560, H = 120, m = { l: 14, r: 14 };
  const L = (x: number) => Math.log10(Math.max(x, 1e-3));
  const sx = $derived(scaleLinear().domain(s.length ? [L(s[0]), L(s[s.length - 1])] : [0, 1]).range([m.l, W - m.r]));
  const jitter = $derived(permutation(Math.max(1, v.length), 5));

  // --- Phần kéo điểm ---
  const R = 24;
  const sub = $derived(cal ? permutation(cal.n, 21).filter((i) => cal!.income[i] < 11.5).slice(0, R).map((i) => ({ x: cal!.income[i], y: cal!.value[i] })) : []);
  let drag = $state({ x: 9, y: 0.6 });
  const fitWith = $derived(sub.length ? linFit([...sub, drag].map((p) => [p.x]), [...sub, drag].map((p) => p.y)) : [0, 0]);
  const fitWithout = $derived(sub.length ? linFit(sub.map((p) => [p.x]), sub.map((p) => p.y)) : [0, 0]);
  const W2 = 560, H2 = 320, m2 = { t: 14, r: 14, b: 42, l: 46 };
  const px = scaleLinear().domain([0, 12]).range([m2.l, W2 - m2.r]);
  const py = scaleLinear().domain([-1, 6]).range([H2 - m2.b, m2.t]);
  let svg: SVGSVGElement;
  let down = false;
  function move(e: PointerEvent) {
    if (!down) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    drag = { x: Math.max(0, Math.min(12, px.invert(q.x))), y: Math.max(-1, Math.min(6, py.invert(q.y))) };
  }
  const line = (c: number[]) => `M${px(0)},${py(c[0])}L${px(12)},${py(c[0] + 12 * c[1])}`;
</script>

<div class="lab">
  <p class="lab-title">Ngoại lai: lỗi nhập liệu hay sự thật hiếm gặp?</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !cal}<p class="lab-hint">Đang tải dữ liệu…</p>{:else}
    <p class="lab-hint">Mỗi chấm là một khu vực, trục ngang theo thang log để thấy được cả những giá trị gấp hàng trăm lần trung vị. Vùng tô là vùng "bình thường" theo quy tắc đang chọn.</p>
    <div class="ctrl">
      {#each cols as c, i}<button class="chip" class:sel={ci === i} type="button" onclick={() => (ci = i)}>{c.name}</button>{/each}
    </div>
    <div class="ctrl">
      <label><input type="radio" bind:group={method} value="iqr" /> Quy tắc IQR, k = <span class="num">{fmt(kIqr, 1)}</span><input type="range" min="1" max="5" step="0.5" bind:value={kIqr} disabled={method !== 'iqr'} aria-label="Hệ số k của IQR" /></label>
      <label><input type="radio" bind:group={method} value="z" /> Điểm z, |z| &gt; <span class="num">{fmt(kZ, 1)}</span><input type="range" min="2" max="6" step="0.5" bind:value={kZ} disabled={method !== 'z'} aria-label="Ngưỡng điểm z" /></label>
    </div>
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Các khu vực trên thang log, vùng bình thường được tô">
      <rect x={sx(L(Math.max(lo, s[0])))} y="8" width={Math.max(0, sx(L(Math.min(hi, s[s.length - 1]))) - sx(L(Math.max(lo, s[0]))))} height={H - 40} fill="var(--tim-soft)" />
      {#each v as x, i}
        {#if i % 4 === 0 || x < lo || x > hi}
          <circle cx={sx(L(x))} cy={14 + ((jitter[i] % 997) / 997) * (H - 52)} r={x < lo || x > hi ? 2.4 : 1.2} fill={x < lo || x > hi ? 'var(--bad)' : 'var(--pencil)'} fill-opacity={x < lo || x > hi ? 0.8 : 0.25} />
        {/if}
      {/each}
      {#each [0.1, 1, 10, 100, 1000] as t}
        {#if L(t) >= sx.domain()[0] && L(t) <= sx.domain()[1]}<text x={sx(L(t))} y={H - 12} text-anchor="middle" font-size="11" fill="var(--pencil)">{String(t).replace('.', ',')}</text>{/if}
      {/each}
    </svg>
    <p><b>{out.length.toLocaleString('vi-VN')}</b> khu vực ({fmt((100 * out.length) / cal.n, 1)}%) bị đánh dấu ngoại lai, giới hạn [{fmt(lo, 2)}; {fmt(hi, 2)}]. {method === 'iqr' && b ? `Q1 = ${fmt(b.q1, 3)}, Q3 = ${fmt(b.q3, 3)}, IQR = ${fmt(b.iqr, 3)}.` : `Trung bình ${fmt(mu, 3)}, độ lệch chuẩn ${fmt(sd, 3)}.`}</p>
    <table class="data">
      <thead><tr><th>5 khu vực cực nhất</th><th>{cols[ci].name}</th><th>Dân số</th><th>Số hộ</th><th>Số phòng</th><th>Vị trí</th></tr></thead>
      <tbody>
        {#each extremes as i}<tr><td>dòng {i}</td><td>{fmt(v[i], cols[ci].d)}</td><td>{cal.pop[i]}</td><td>{cal.hh[i]}</td><td>{cal.rooms[i]}</td><td>{oceanVi[cal.cats[cal.ocean[i]]]}</td></tr>{/each}
      </tbody>
    </table>
    <p class="cap">{ci === 0 ? 'Hơn một nghìn người mà chỉ vài hộ: nhiều khả năng là ký túc xá, trại lính hay nhà tù — dữ liệu thật, nhưng không phải "khu dân cư" mà mô hình giá nhà cần học.' : ci === 1 ? 'Hàng chục phòng mỗi hộ thường là khu nghỉ dưỡng có nhiều nhà bỏ trống. Thật, nhưng hiếm.' : 'Thu nhập không có ngoại lai cực đoan nào: đuôi phải bị cắt ở 15,0001 vì dữ liệu đã chặn trần.'} Không có quy tắc nào tự quyết được thay bạn: mỗi điểm bị đánh dấu cần một câu hỏi "vì sao".</p>

    <p class="lab-title sub">Một điểm kéo lệch cả đường thẳng</p>
    <p class="lab-hint">24 khu vực thật (chấm xám) và một khu vực bạn kéo được (chấm đỏ). Thử kéo nó ra xa, ví dụ thu nhập 11, giá 0 — như thể ai đó nhập nhầm giá.</p>
    <div class="lab-grid">
      <svg bind:this={svg} class="chart drag" viewBox={`0 0 ${W2} ${H2}`} role="img" aria-label="Kéo điểm đỏ để xem đường hồi quy thay đổi"
        onpointermove={move} onpointerup={() => (down = false)} onpointerleave={() => (down = false)}>
        <Axis scale={px} orient="bottom" size={H2 - m2.t - m2.b} offset={H2 - m2.b} label="Thu nhập (×10.000 USD)" />
        <Axis scale={py} orient="left" size={W2 - m2.l - m2.r} offset={m2.l} label="Giá nhà (×100.000 USD)" />
        {#each sub as p}<circle cx={px(p.x)} cy={py(p.y)} r="4" fill="var(--pencil)" fill-opacity="0.6" />{/each}
        <path d={line(fitWithout)} stroke="var(--pencil)" stroke-dasharray="5 4" stroke-width="1.5" fill="none" />
        <path d={line(fitWith)} stroke="var(--bad)" stroke-width="2" fill="none" />
        <circle class="handle" cx={px(drag.x)} cy={py(drag.y)} r="9" fill="var(--bad)" fill-opacity="0.85" stroke="var(--paper)" stroke-width="2"
          role="slider" tabindex="0" aria-label="Điểm có thể kéo" aria-valuenow={drag.y}
          onpointerdown={(e) => { down = true; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); }}
          onkeydown={(e) => { const d = { ArrowUp: [0, 0.2], ArrowDown: [0, -0.2], ArrowLeft: [-0.3, 0], ArrowRight: [0.3, 0] }[e.key]; if (d) { e.preventDefault(); drag = { x: Math.max(0, Math.min(12, drag.x + d[0])), y: Math.max(-1, Math.min(6, drag.y + d[1])) }; } }} />
      </svg>
      <table class="data">
        <thead><tr><th></th><th>Hệ số góc w</th><th>Hệ số chặn b</th></tr></thead>
        <tbody>
          <tr><td>24 khu vực thật</td><td>{fmt(fitWithout[1], 3)}</td><td>{fmt(fitWithout[0], 3)}</td></tr>
          <tr><td style="color:var(--bad)">thêm điểm đỏ</td><td>{fmt(fitWith[1], 3)}</td><td>{fmt(fitWith[0], 3)}</td></tr>
        </tbody>
      </table>
    </div>
    <p class="cap">MSE bình phương sai số, nên một điểm xa gấp 5 lần có sức kéo gấp 25 lần. Đó là lý do một lỗi nhập liệu duy nhất có thể làm hỏng cả mô hình hồi quy.</p>
  {/if}
</div>

<style>
  .cap { font-size: 0.88rem; color: var(--pencil); }
  .sub { margin-top: 2rem; }
  .drag { touch-action: none; }
  .handle { cursor: grab; }
</style>
