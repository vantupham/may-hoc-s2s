<script lang="ts">
  /** Độ chính xác trên tập huấn luyện và tập test theo k — chọn k thế nào cho hợp lý. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { knnPredict, fmt } from '../../lib/ml-core';

  interface F { id: number; len: number; wid: number; y: number }
  let { flowers, testIds }: { flowers: F[]; testIds: number[] } = $props();
  const testSet = $derived(new Set(testIds));
  const pts = $derived(flowers.map((f) => ({ id: f.id, a: f.len, b: f.wid, y: f.y })));
  const train = $derived(pts.filter((p) => !testSet.has(p.id)));
  const test = $derived(pts.filter((p) => testSet.has(p.id)));
  const ks = Array.from({ length: 40 }, (_, i) => i + 1);
  const acc = (set: typeof pts, k: number) => set.filter((p) => knnPredict(p, train, k, 3).pred === p.y).length / set.length;
  const rows = $derived(ks.map((k) => ({ k, tr: acc(train, k), te: acc(test, k) })));

  const W = 900, H = 320, m = { t: 30, r: 90, b: 44, l: 48 };
  const sx = scaleLinear().domain([1, 40]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0.8, 1]).range([H - m.b, m.t]);
  const line = (key: 'tr' | 'te') => rows.map((r, i) => `${i ? 'L' : 'M'}${sx(r.k)},${sy(Math.max(0.8, r[key]))}`).join('');
  let hover = $state(5);
  const hv = $derived(rows[hover - 1]);
</script>

<div class="lab">
  <p class="lab-title">Độ chính xác theo k</p>
  <p class="lab-hint">Mỗi điểm trên đường được tính lại ngay trong trình duyệt: phân loại 120 bông của tập huấn luyện và 30 bông của tập test với từng giá trị k.</p>
  <div class="ctrl"><label>Xem k = <span class="num">{hover}</span><input type="range" min="1" max="40" bind:value={hover} aria-label="k" /></label>
    <span>Huấn luyện: <b class="num">{fmt(hv.tr * 100, 1)}%</b></span><span>Test: <b class="num">{fmt(hv.te * 100, 1)}%</b></span></div>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Độ chính xác trên tập huấn luyện và tập test theo k">
    <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} ticks={8} label="k (số láng giềng)" />
    <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} ticks={4} format={(v) => `${Math.round(v * 100)}%`} label="Độ chính xác" />
    <path d={line('tr')} fill="none" stroke="var(--pencil)" stroke-width="2" stroke-dasharray="5 3" />
    <path d={line('te')} fill="none" stroke="var(--tim)" stroke-width="2.5" />
    <text x={W - m.r + 6} y={sy(rows.at(-1)!.tr)} class="lbl" dy="0.32em">huấn luyện</text>
    <text x={W - m.r + 6} y={sy(rows.at(-1)!.te) + 14} class="lbl tim" dy="0.32em">test</text>
    <line x1={sx(hover)} x2={sx(hover)} y1={m.t} y2={H - m.b} stroke="var(--ink)" stroke-opacity="0.4" />
  </svg>
  <p class="cap">Với k = 1, mỗi bông hoa huấn luyện là láng giềng gần nhất của chính nó, nên độ chính xác huấn luyện gần như tuyệt đối — nhưng đó là học thuộc lòng, không phải học. Khi k quá lớn, mô hình bỏ phiếu theo số đông của cả vùng rộng và bắt đầu nhầm.</p>
</div>

<style>
  .lbl { font-size: 12px; fill: var(--pencil); font-style: italic; }
  .lbl.tim { fill: var(--tim); }
  .cap { font-size: 0.9rem; color: var(--pencil); margin: 0.5rem 0 0; }
</style>
