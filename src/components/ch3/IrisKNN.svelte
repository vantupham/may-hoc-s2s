<script lang="ts">
  /**
   * KNN trên hoa Iris: bấm vào đồ thị để đặt một bông hoa mới, xem k láng giềng gần nhất
   * và cách chúng bỏ phiếu. Bật nền để thấy vùng quyết định thay đổi theo k.
   */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { knnPredict, distCalc, fmt } from '../../lib/ml-core';

  interface F { id: number; len: number; wid: number; y: number }
  let { flowers, testIds, species }: { flowers: F[]; testIds: number[]; species: string[] } = $props();
  const testSet = $derived(new Set(testIds));
  const train = $derived(flowers.filter((f) => !testSet.has(f.id)).map((f) => ({ id: f.id, a: f.len, b: f.wid, y: f.y })));

  let q = $state({ a: 4.9, b: 1.6 });
  let k = $state(5);
  let showRegion = $state(false);
  let pickedIdx = $state(0);
  const res = $derived(knnPredict(q, train, k, 3));
  const picked = $derived(res.nb[Math.min(pickedIdx, res.nb.length - 1)]);
  const calc = $derived(distCalc(q, { a: q.a + picked.da, b: q.b + picked.db }, `hoa #${picked.id}`));

  const W = 520, H = 380, m = { t: 30, r: 14, b: 44, l: 44 };
  const sx = scaleLinear().domain([0.5, 7.3]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0, 2.7]).range([H - m.b, m.t]);
  const col = ['var(--k0)', 'var(--k1)', 'var(--k2)'];
  const N = 34;
  const cells = $derived.by(() => {
    if (!showRegion) return [];
    const out = [];
    const cw = (W - m.l - m.r) / N, ch = (H - m.t - m.b) / N;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const a = sx.invert(m.l + (i + 0.5) * cw), b = sy.invert(m.t + (j + 0.5) * ch);
        out.push({ x: m.l + i * cw, y: m.t + j * ch, w: cw, h: ch, c: knnPredict({ a, b }, train, k, 3).pred });
      }
    return out;
  });
  const radius = $derived(res.nb.at(-1)!.dist);

  function place(ev: MouseEvent) {
    const svg = ev.currentTarget as SVGSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    q = { a: Math.max(0.6, Math.min(7.2, sx.invert(p.x))), b: Math.max(0.05, Math.min(2.65, sy.invert(p.y))) };
    pickedIdx = 0;
  }
  function onkey(e: KeyboardEvent) {
    const d = e.shiftKey ? 0.5 : 0.1;
    if (e.key === 'ArrowLeft') q = { ...q, a: q.a - d };
    else if (e.key === 'ArrowRight') q = { ...q, a: q.a + d };
    else if (e.key === 'ArrowUp') q = { ...q, b: q.b + d / 2 };
    else if (e.key === 'ArrowDown') q = { ...q, b: q.b - d / 2 };
    else return;
    e.preventDefault();
  }
</script>

<div class="lab">
  <p class="lab-title">Bông hoa mới thuộc loài nào? Hỏi k bông gần nhất</p>
  <p class="lab-hint">Bấm vào bất kỳ đâu trên đồ thị để đặt bông hoa mới (hoặc chọn đồ thị rồi dùng phím mũi tên). Vòng tròn bao quanh đúng k láng giềng gần nhất trong 120 bông của tập huấn luyện.</p>
  <div class="ctrl">
    <label><b>k</b> = <span class="num">{k}</span><input type="range" min="1" max="25" step="1" bind:value={k} aria-label="Số láng giềng k" /></label>
    <label><input type="checkbox" bind:checked={showRegion} /> Tô vùng quyết định</label>
    <span>Hoa mới: cánh dài <span class="num">{fmt(q.a, 2)}</span> cm, rộng <span class="num">{fmt(q.b, 2)}</span> cm</span>
  </div>
  <div class="lab-grid">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <svg class="chart pick" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Hoa Iris theo kích thước cánh hoa; bấm để đặt hoa mới" onclick={place} onkeydown={onkey} tabindex="0">
      {#each cells as c}<rect x={c.x} y={c.y} width={c.w} height={c.h} fill={col[c.c]} fill-opacity="0.13" shape-rendering="crispEdges" />{/each}
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Chiều dài cánh hoa (cm)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Chiều rộng cánh hoa (cm)" />
      {#each train as p (p.id)}<circle cx={sx(p.a)} cy={sy(p.b)} r="4" fill={col[p.y]} fill-opacity="0.75" />{/each}
      {#each res.nb as n}<line x1={sx(q.a)} y1={sy(q.b)} x2={sx(q.a + n.da)} y2={sy(q.b + n.db)} stroke={col[n.y]} stroke-width="1.2" />{/each}
      <ellipse cx={sx(q.a)} cy={sy(q.b)} rx={sx(q.a + radius) - sx(q.a)} ry={sy(q.b) - sy(q.b + radius)} fill="none" stroke="var(--ink)" stroke-dasharray="4 3" />
      <circle cx={sx(q.a + picked.da)} cy={sy(q.b + picked.db)} r="7" fill="none" stroke="var(--ink)" stroke-width="2" />
      <path d={`M${sx(q.a)},${sy(q.b) - 10}l3,6.5 7,.6-5.3,4.6 1.6,6.9-6.3-3.7-6.3,3.7 1.6-6.9-5.3-4.6 7-.6z`} fill={col[res.pred]} stroke="var(--ink)" stroke-width="1" />
    </svg>
    <div>
      <p class="h">Kết quả bỏ phiếu</p>
      {#each species as s, c}
        <div class="vote"><span class="sp" style={`color:${col[c]}`}>{s}</span><span class="bar"><span style={`width:${(res.votes[c] / k) * 100}%;background:${col[c]}`}></span></span><span class="num">{res.votes[c]}</span></div>
      {/each}
      <p class="verdict">Dự đoán: <b style={`color:${col[res.pred]}`}>{species[res.pred]}</b></p>
      <div class="table-scroll">
        <table class="data">
          <thead><tr><th>#</th><th>Hoa</th><th>Loài</th><th>Khoảng cách</th></tr></thead>
          <tbody>
            {#each res.nb.slice(0, 8) as n, i}
              <tr class:on={i === pickedIdx}>
                <td>{i + 1}</td><td>{n.id}</td>
                <td class="t" style={`color:${col[n.y]}`}>{species[n.y].replace('Iris ', '')}</td>
                <td><button class="val" class:sel={i === pickedIdx} onclick={() => (pickedIdx = i)}>{fmt(n.dist, 3)}</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if k > 8}<p class="more">… và {k - 8} láng giềng nữa.</p>{/if}
      </div>
      <CalcCard {calc} />
    </div>
  </div>
</div>

<style>
  .pick { cursor: crosshair; }
  .h { font-weight: 700; margin: 0 0 0.4rem; }
  .vote { display: grid; grid-template-columns: 8.5rem 1fr 1.5rem; gap: 0.5rem; align-items: center; font-size: 0.88rem; }
  .sp { font-style: italic; }
  .bar { height: 10px; background: var(--paper); border: 1px solid var(--rule); }
  .bar span { display: block; height: 100%; transition: width 0.15s; }
  .verdict { margin: 0.6rem 0 0.8rem; }
  .more { font-size: 0.82rem; color: var(--pencil); margin: 0.2rem 0 0; }
</style>
