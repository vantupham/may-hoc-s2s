<script lang="ts">
  /** Huấn luyện mạng 64 → 32 → 10 trên 1.437 chữ số viết tay, ngay trong trình duyệt. */
  import { scaleLinear } from 'd3';
  import { untrack } from 'svelte';
  import Axis from '../Axis.svelte';
  import DigitImg from '../DigitImg.svelte';
  import { initMLP, mlpEpoch, mlpForward, mlpPredict, mulberry32, fmt, type MLP } from '../../lib/ml-core';

  let { digits, testIds }: { digits: { y: number; px: number[] }[]; testIds: number[] } = $props();
  const test = $derived(new Set(testIds));
  const tr = $derived(digits.filter((_, i) => !test.has(i)));
  const te = $derived(digits.filter((_, i) => test.has(i)));
  const X = $derived(tr.map((d) => d.px.map((v) => v / 16)));
  const Y = $derived(tr.map((d) => d.y));
  const Xt = $derived(te.map((d) => d.px.map((v) => v / 16)));

  let lr = $state(0.1);
  let seed = $state(1);
  let net: MLP = initMLP(64, 32, 10, 1);
  let version = $state(0);
  let curve = $state<{ ep: number; loss: number; tr: number; te: number }[]>([]);
  let busy = $state(false);
  const acc = (xs: number[][], ys: number[]) => xs.filter((x, i) => mlpPredict(net, x) === ys[i]).length / xs.length;

  function reset() {
    net = initMLP(64, 32, 10, seed);
    curve = [{ ep: 0, loss: NaN, tr: acc(X, Y), te: acc(Xt, te.map((d) => d.y)) }];
    version++;
  }
  $effect(() => { seed; X; untrack(reset); });
  function epoch() {
    const r = mulberry32(seed * 1000 + curve.length);
    const order = Array.from({ length: X.length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const ls = mlpEpoch(net, X, Y, order, 32, lr);
    curve = [...curve, { ep: curve.length, loss: ls.reduce((a, v) => a + v, 0) / ls.length, tr: acc(X, Y), te: acc(Xt, te.map((d) => d.y)) }];
    version++;
  }
  async function run(n: number) {
    busy = true;
    for (let i = 0; i < n; i++) { epoch(); await new Promise((res) => requestAnimationFrame(() => res(null))); }
    busy = false;
  }

  // Kết quả trên tập test (tính lại sau mỗi epoch)
  const preds = $derived.by(() => { version; return Xt.map((x) => mlpForward(net, x).p); });
  const cm = $derived.by(() => {
    const m = Array.from({ length: 10 }, () => new Array(10).fill(0));
    preds.forEach((p, i) => { let b = 0; for (let k = 1; k < 10; k++) if (p[k] > p[b]) b = k; m[te[i].y][b]++; });
    return m;
  });
  const wrong = $derived(preds.map((p, i) => { let b = 0; for (let k = 1; k < 10; k++) if (p[k] > p[b]) b = k; return { i, b, conf: p[b] }; }).filter((w) => w.b !== te[w.i].y).slice(0, 12));
  const hidden = $derived.by(() => { version; return Array.from({ length: 32 }, (_, h) => Array.from(net.W1.slice(h * 64, h * 64 + 64))); });

  // Ô vẽ chữ số 8×8
  let draw = $state<number[]>(new Array(64).fill(0));
  let down = false;
  function paint(i: number, e: PointerEvent) {
    if (e.type === 'pointerdown') down = true;
    if (!down && e.type !== 'pointerdown') return;
    const d = [...draw];
    d[i] = Math.min(16, d[i] + 8);
    [-1, 1, -8, 8].forEach((o) => { const j = i + o; if (j >= 0 && j < 64 && !(o === -1 && i % 8 === 0) && !(o === 1 && i % 8 === 7)) d[j] = Math.min(16, d[j] + 3); });
    draw = d;
  }
  const drawP = $derived.by(() => { version; return draw.some((v) => v > 0) ? mlpForward(net, draw.map((v) => v / 16)).p : null; });

  const W = 440, H = 240, m = { t: 30, r: 14, b: 40, l: 48 };
  const sx = $derived(scaleLinear().domain([0, Math.max(5, curve.length - 1)]).range([m.l, W - m.r]));
  const sy = scaleLinear().domain([0, 1]).range([H - m.b, m.t]);
  const ln = (k: 'tr' | 'te') => curve.map((c, i) => `${i ? 'L' : 'M'}${sx(c.ep)},${sy(c[k])}`).join('');
  const last = $derived(curve.at(-1) ?? { ep: 0, loss: NaN, tr: 0, te: 0 });
</script>

<svelte:window onpointerup={() => (down = false)} />

<div class="lab">
  <p class="lab-title">Huấn luyện mạng nhận dạng chữ số trong trình duyệt của bạn</p>
  <p class="lab-hint">Mạng có 64 × 32 + 32 + 32 × 10 + 10 = 2.410 tham số. Mỗi epoch đi qua 1.437 ảnh huấn luyện theo lô 32 ảnh, mỗi lô một bước Gradient Descent với lan truyền ngược — đúng thuật toán của phòng thí nghiệm phía trên, chỉ có nhiều con số hơn.</p>
  <div class="ctrl">
    <button class="btn primary" type="button" disabled={busy} onclick={() => run(1)}>Huấn luyện 1 epoch</button>
    <button class="btn" type="button" disabled={busy} onclick={() => run(15)}>Huấn luyện 15 epoch</button>
    <button class="btn" type="button" disabled={busy} onclick={() => { seed += 1; }}>Khởi tạo lại</button>
    <label>η <select bind:value={lr} disabled={busy} aria-label="Tốc độ học">{#each [0.01, 0.1, 0.5, 2] as v}<option value={v}>{fmt(v, 2)}</option>{/each}</select></label>
    <span>Epoch <b class="num">{last.ep}</b>: huấn luyện <b class="num">{fmt(last.tr * 100, 1)}%</b>, test <b class="num">{fmt(last.te * 100, 1)}%</b></span>
  </div>
  <div class="lab-grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Độ chính xác theo epoch">
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={6} label="Epoch" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} ticks={5} format={(v) => `${Math.round(v * 100)}%`} label="Độ chính xác" />
      <path d={ln('tr')} fill="none" stroke="var(--pencil)" stroke-width="2" stroke-dasharray="5 3" />
      <path d={ln('te')} fill="none" stroke="var(--tim)" stroke-width="2.5" />
      {#each curve as c}<circle cx={sx(c.ep)} cy={sy(c.te)} r="3" fill="var(--tim)" />{/each}
    </svg>
    <div class="drawbox">
      <p class="h">Tự viết một chữ số</p>
      <div class="pad" role="application" aria-label="Ô vẽ 8×8: giữ chuột và kéo để vẽ">
        {#each draw as v, i}
          <div class="px" style={`background:color-mix(in srgb, var(--ink) ${Math.round((v / 16) * 100)}%, var(--sheet))`} onpointerdown={(e) => paint(i, e)} onpointerenter={(e) => paint(i, e)}></div>
        {/each}
      </div>
      <button class="btn" type="button" onclick={() => (draw = new Array(64).fill(0))}>Xoá</button>
      {#if drawP}
        <div class="bars">
          {#each Array.from(drawP) as p, k}<div class="bar"><span class="d">{k}</span><span class="t"><span style={`width:${p * 100}%`}></span></span><span class="num">{fmt(p * 100, 0)}%</span></div>{/each}
        </div>
      {:else}<p class="cap">Giữ chuột và kéo trên ô 8×8. Ảnh rất thô, nên hãy viết to, chiếm gần hết ô.</p>{/if}
    </div>
  </div>
  <div class="lab-grid res">
    <div>
      <p class="h">Ma trận nhầm lẫn trên 360 ảnh test (hàng: chữ số thật, cột: dự đoán)</p>
      <table class="cmx">
        <thead><tr><th></th>{#each Array.from({ length: 10 }, (_, k) => k) as k}<th>{k}</th>{/each}</tr></thead>
        <tbody>
          {#each cm as row, t}
            <tr><th>{t}</th>{#each row as v, p}<td style={`background:${v ? `color-mix(in srgb, var(${t === p ? '--ok' : '--bad'}) ${Math.min(80, 10 + v * (t === p ? 2 : 15))}%, var(--sheet))` : 'transparent'}`}>{v || ''}</td>{/each}</tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div>
      <p class="h">Một số ảnh test bị đoán sai</p>
      <div class="gal">
        {#each wrong as w}<figure><DigitImg px={te[w.i].px} size={44} label={`Thật ${te[w.i].y}, đoán ${w.b}`} /><figcaption>{te[w.i].y} → <b>{w.b}</b></figcaption></figure>{/each}
        {#if !wrong.length}<p class="cap">Không có ảnh nào bị đoán sai.</p>{/if}
      </div>
    </div>
  </div>
  <p class="h">32 nơ-ron ẩn "nhìn" gì? Trọng số đầu vào của từng nơ-ron, vẽ thành ảnh 8×8 (đỏ: dương, xanh: âm)</p>
  <div class="hid">{#each hidden as w, h}<DigitImg px={w} size={40} diverging label={`Nơ-ron ẩn ${h + 1}`} />{/each}</div>
</div>

<style>
  .h { font-weight: 700; margin: 0 0 0.4rem; font-size: 0.95rem; }
  .cap { font-size: 0.86rem; color: var(--pencil); }
  .drawbox { display: grid; grid-template-columns: auto 1fr; gap: 0.6rem 1rem; align-items: start; }
  .drawbox .h { grid-column: 1 / -1; }
  .pad { display: grid; grid-template-columns: repeat(8, 22px); grid-template-rows: repeat(8, 22px); border: 1.5px solid var(--ink); touch-action: none; cursor: crosshair; user-select: none; }
  .px { border: 0.5px solid var(--rule); }
  .drawbox .btn { grid-column: 1; justify-self: start; }
  .bars { grid-column: 2; grid-row: 2 / span 2; font-size: 0.8rem; }
  .bar { display: grid; grid-template-columns: 1rem 1fr 2.6rem; gap: 0.3rem; align-items: center; }
  .bar .t { height: 8px; background: var(--paper); border: 1px solid var(--rule); }
  .bar .t span { display: block; height: 100%; background: var(--tim); }
  .res { margin-top: 1rem; }
  .cmx { border-collapse: collapse; font: 0.74rem var(--mono); }
  .cmx th { color: var(--pencil); font-weight: 600; padding: 0.15rem 0.3rem; }
  .cmx td { width: 1.9rem; height: 1.6rem; text-align: center; border: 1px solid var(--rule); }
  .gal { display: flex; flex-wrap: wrap; gap: 0.6rem; }
  figure { margin: 0; }
  figcaption { font-size: 0.78rem; color: var(--pencil); text-align: center; }
  .hid { display: flex; flex-wrap: wrap; gap: 0.4rem; }
</style>
