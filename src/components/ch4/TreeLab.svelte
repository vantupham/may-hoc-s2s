<script lang="ts">
  /** Cây quyết định hoàn chỉnh trên Titanic: chọn độ sâu, chọn một hành khách để xem đường đi của họ. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { buildTree, pathOf, predictTree, fmt, type Row, type TreeNode } from '../../lib/ml-core';
  import { questionText, condText } from '../../lib/titanic';

  interface P { id: number; name: string; survived: number; sex: number; pclass: number; age: number; fare: number; family: number; ageMissing: boolean }
  let { people, testIds, features }: { people: P[]; testIds: number[]; features: string[] } = $props();
  const testSet = $derived(new Set(testIds));
  const toRow = (p: P): Row => ({ x: features.map((f) => (p as any)[f] as number), y: p.survived });
  const train = $derived(people.filter((p) => !testSet.has(p.id)).map(toRow));
  const testP = $derived(people.filter((p) => testSet.has(p.id)));
  const test = $derived(testP.map(toRow));

  let depth = $state(3);
  let pid = $state(0);
  const tree = $derived(buildTree(train, { maxDepth: depth, nFeatures: 5 }));
  const person = $derived(testP[pid]);
  const path = $derived(new Set(pathOf(tree, toRow(person).x).map((n) => n.id)));
  const pred = $derived(predictTree(tree, toRow(person).x));
  const acc = (t: TreeNode, rs: Row[]) => rs.filter((r) => predictTree(t, r.x) === r.y).length / rs.length;
  const curve = $derived(Array.from({ length: 12 }, (_, i) => { const t = buildTree(train, { maxDepth: i + 1, nFeatures: 5 }); return { d: i + 1, tr: acc(t, train), te: acc(t, test) }; }));

  // Bố cục cây: mỗi lá một cột, nút trong nằm giữa các con
  const NW = 132, NH = 52, GX = 10, GY = 48;
  const layout = $derived.by(() => {
    const pos = new Map<number, { x: number; y: number; n: TreeNode }>();
    let col = 0;
    const walk = (n: TreeNode): number => {
      let x: number;
      if (!n.left) { x = col * (NW + GX); col++; }
      else { const a = walk(n.left); const b = walk(n.right!); x = (a + b) / 2; }
      pos.set(n.id, { x, y: n.depth * (NH + GY), n });
      return x;
    };
    walk(tree);
    return { pos: [...pos.values()], width: col * (NW + GX) - GX, height: (depth + 1) * (NH + GY) - GY };
  });
  const byId = $derived(new Map(layout.pos.map((p) => [p.n.id, p])));
  const surv = (n: TreeNode) => n.counts[1] / n.n;

  const W = 420, H = 220, m = { t: 30, r: 14, b: 40, l: 48 };
  const cx = scaleLinear().domain([1, 12]).range([m.l, W - m.r]);
  const cy = scaleLinear().domain([0.75, 0.95]).range([H - m.b, m.t]);
  const line = (k: 'tr' | 'te') => curve.map((c, i) => `${i ? 'L' : 'M'}${cx(c.d)},${cy(Math.max(0.75, c[k]))}`).join('');
</script>

<div class="lab">
  <p class="lab-title">Cây quyết định trên 713 hành khách</p>
  <p class="lab-hint">Mỗi ô là một nút: số hành khách và tỷ lệ sống sót trong nhóm đó; màu càng xanh càng nhiều người sống. Nhánh trái là "đúng", nhánh phải là "sai". Chọn một hành khách của tập test để xem cây hỏi họ những gì.</p>
  <div class="ctrl">
    <label>Độ sâu tối đa <span class="num">{depth}</span><input type="range" min="1" max="4" bind:value={depth} aria-label="Độ sâu" /></label>
    <label>Hành khách
      <select bind:value={pid} aria-label="Hành khách" class="who">
        {#each testP as p, i}<option value={i}>{p.name}</option>{/each}
      </select>
    </label>
  </div>
  <p class="person">
    <b>{person.name}</b>: {person.sex ? 'nữ' : 'nam'}, hạng {person.pclass}, {person.ageMissing ? `không rõ tuổi (điền ${fmt(person.age, 0)})` : `${fmt(person.age, 0)} tuổi`}, vé {fmt(person.fare, 2)} bảng, {person.family} người thân đi cùng.
    Cây đoán <b style={`color:var(${pred ? '--ok' : '--bad'})`}>{pred ? 'sống sót' : 'không qua khỏi'}</b>; thực tế: <b>{person.survived ? 'sống sót' : 'không qua khỏi'}</b>{pred === person.survived ? '.' : ' — cây đoán sai.'}
  </p>
  <div class="tree-wrap">
    <svg viewBox={`-50 -4 ${layout.width + 100} ${layout.height + 8}`} style={`min-width:${Math.min(layout.width, 900)}px`} role="img" aria-label="Sơ đồ cây quyết định">
      {#each layout.pos as p}
        {#if p.n.left}
          {#each [p.n.left, p.n.right!] as ch, j}
            {@const q = byId.get(ch.id)!}
            {@const on = path.has(p.n.id) && path.has(ch.id)}
            <path d={`M${p.x + NW / 2},${p.y + NH} C${p.x + NW / 2},${p.y + NH + GY / 2} ${q.x + NW / 2},${q.y - GY / 2} ${q.x + NW / 2},${q.y}`} fill="none" stroke={on ? 'var(--tim)' : 'var(--rule-2)'} stroke-width={on ? 2.5 : 1.2} />
            <text x={(p.x + q.x) / 2 + NW / 2 + (j ? 4 : -4)} y={p.y + NH + GY / 2 + 4} text-anchor={j ? 'start' : 'end'} class="edge">{condText(p.n.feature!, p.n.thr!, j === 0)}</text>
          {/each}
        {/if}
      {/each}
      {#each layout.pos as p}
        <g class:on={path.has(p.n.id)}>
          <rect x={p.x} y={p.y} width={NW} height={NH} rx="2" fill={`color-mix(in srgb, var(--ok) ${Math.round(surv(p.n) * 55)}%, var(--sheet))`} stroke={path.has(p.n.id) ? 'var(--tim)' : 'var(--rule-2)'} stroke-width={path.has(p.n.id) ? 2.5 : 1} />
          <text x={p.x + NW / 2} y={p.y + 19} text-anchor="middle" class="q">{p.n.left ? questionText(p.n.feature!, p.n.thr!) : 'Lá'}</text>
          <text x={p.x + NW / 2} y={p.y + 38} text-anchor="middle" class="s">{p.n.n} người, {Math.round(surv(p.n) * 100)}% sống</text>
        </g>
      {/each}
    </svg>
  </div>
  <div class="lab-grid acc">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Độ chính xác theo độ sâu của cây">
      <Axis scale={cx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={6} label="Độ sâu tối đa" />
      <Axis scale={cy} orient="left" size={W - m.l - m.r} offset={m.l} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="Độ chính xác" />
      <path d={line('tr')} fill="none" stroke="var(--pencil)" stroke-width="2" stroke-dasharray="5 3" />
      <path d={line('te')} fill="none" stroke="var(--tim)" stroke-width="2.5" />
      <circle cx={cx(depth)} cy={cy(curve[depth - 1].te)} r="5" fill="var(--tim)" />
    </svg>
    <div class="accs">
      <p>Độ sâu {depth}: đúng <b class="num">{fmt(curve[depth - 1].tr * 100, 1)}%</b> trên tập huấn luyện, <b class="num">{fmt(curve[depth - 1].te * 100, 1)}%</b> trên 178 hành khách của tập test.</p>
      <p class="cap">Đường đứt: huấn luyện. Đường liền: test. Cây càng sâu càng thuộc lòng tập huấn luyện; đến độ sâu 12, gần như mọi hành khách huấn luyện đều có lá riêng, nhưng điểm test không tăng theo.</p>
    </div>
  </div>
</div>

<style>
  .who { max-width: 22rem; font-family: var(--serif); font-size: 0.88rem; }
  .person { font-size: 0.92rem; }
  .tree-wrap { overflow-x: auto; padding: 0.5rem 0 1rem; }
  .tree-wrap svg { width: 100%; height: auto; display: block; }
  .q { font: 600 12px var(--serif); fill: var(--ink); }
  .s { font: 10.5px var(--serif); fill: var(--pencil); }
  .edge { font: italic 11px var(--serif); fill: var(--pencil); }
  .acc { margin-top: 0.5rem; align-items: center; }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
