<script lang="ts">
  /** Đánh giá trên toàn bộ tập test, so với Naive Bayes của chương 4, và bản đồ embedding của các từ. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { attnForward, nbFromCounts, nbScore, pca, fmt, type AttnModel } from '../../lib/ml-core';

  interface Sms { vocab: string[]; counts: number[][]; docs: number[]; test: { y: number; text: string }[] }
  let { model, sms }: { model: AttnModel; sms: Sms } = $props();
  const nb = $derived(nbFromCounts(sms.vocab, sms.counts, sms.docs, 1));
  const rows = $derived(sms.test.map((t) => ({ ...t, pa: attnForward(model, t.text).p, pn: nbScore(nb, t.text).pSpam })));
  const stats = (key: 'pa' | 'pn') => {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    rows.forEach((r) => { const q = r[key] >= 0.5; if (q && r.y) tp++; else if (q) fp++; else if (r.y) fn++; else tn++; });
    return { tp, fp, fn, tn, acc: (tp + tn) / rows.length };
  };
  const A = $derived(stats('pa'));
  const N = $derived(stats('pn'));
  const disagree = $derived(rows.filter((r) => (r.pa >= 0.5) !== (r.pn >= 0.5)).slice(0, 10));

  // Bản đồ embedding: PCA của 8 chiều xuống 2 cho 70 từ thường gặp nhất
  const words = $derived(model.vocab.slice(1, 71));
  const P = $derived(pca(model.E.slice(1, 71)));
  const pts = $derived(model.E.slice(1, 71).map((e) => P.project(e, 2)));
  // Từ "nghiêng spam": lấy từ bảng đếm của chương 4
  const lean = $derived(words.map((w) => {
    const j = nb.index.get(w);
    if (j === undefined) return 0;
    const V = nb.vocab.length;
    return Math.log((nb.counts[1][j] + 1) / (nb.totals[1] + V)) - Math.log((nb.counts[0][j] + 1) / (nb.totals[0] + V));
  }));
  const W = 620, H = 440, m = { t: 30, r: 20, b: 40, l: 44 };
  const sx = $derived(scaleLinear().domain([Math.min(...pts.map((p) => p[0])) - 0.2, Math.max(...pts.map((p) => p[0])) + 0.2]).range([m.l, W - m.r]));
  const sy = $derived(scaleLinear().domain([Math.min(...pts.map((p) => p[1])) - 0.2, Math.max(...pts.map((p) => p[1])) + 0.2]).range([H - m.b, m.t]));
</script>

<div class="lab">
  <p class="lab-title">Trên {sms.test.length.toLocaleString('vi-VN')} tin nhắn của tập test</p>
  <p class="lab-hint">Cả hai mô hình chạy lại ngay trong trình duyệt của bạn. Mô hình attention có {(model.E.length * model.d + 3 * model.d * model.d + model.d + 1).toLocaleString('vi-VN')} tham số; Naive Bayes của chương 4 chỉ là bảng đếm.</p>
  <table class="data cmp">
    <thead><tr><th>Mô hình</th><th>Độ chính xác</th><th>Tin rác lọt qua</th><th>Tin thường bị chặn nhầm</th></tr></thead>
    <tbody>
      <tr><td class="t">Self-attention (chương này)</td><td>{fmt(A.acc * 100, 2)}%</td><td>{A.fn}</td><td>{A.fp}</td></tr>
      <tr><td class="t">Naive Bayes (chương 4)</td><td>{fmt(N.acc * 100, 2)}%</td><td>{N.fn}</td><td>{N.fp}</td></tr>
    </tbody>
  </table>
  <details>
    <summary>Những tin hai mô hình bất đồng ({disagree.length} tin đầu)</summary>
    <ul class="dis">{#each disagree as d}<li><b style={`color:var(${d.y ? '--c-pos' : '--c-neg'})`}>{d.y ? 'spam' : 'thường'}</b>: attention {fmt(d.pa * 100, 0)}%, Naive Bayes {fmt(d.pn * 100, 0)}% — {d.text}</li>{/each}</ul>
  </details>
  <p class="h">Embedding đã học của 70 từ thường gặp nhất, chiếu từ 8 chiều xuống 2 bằng PCA</p>
  <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bản đồ embedding của các từ">
    <Axis scale={sx} orient="bottom" size={0} offset={H - m.b} label="thành phần chính 1" />
    <Axis scale={sy} orient="left" size={0} offset={m.l} label="thành phần chính 2" />
    {#each pts as p, i}
      <text x={sx(p[0])} y={sy(p[1])} class="w" fill={lean[i] > 0.7 ? 'var(--c-pos)' : lean[i] < -0.7 ? 'var(--c-neg)' : 'var(--pencil)'}>{words[i]}</text>
    {/each}
  </svg>
  <p class="cap">Màu theo bảng đếm của chương 4: đỏ là từ hay gặp trong tin rác, xanh là từ hay gặp trong tin thường. Mô hình attention không hề được cho biết điều này, nhưng các từ đỏ tự tụ về một phía: embedding đã học được "nghĩa" theo cách nó cần cho bài toán.</p>
</div>

<style>
  .cmp { margin-bottom: 0.8rem; }
  details { font-size: 0.86rem; margin-bottom: 1rem; }
  summary { cursor: pointer; color: var(--tim); }
  .dis { padding-left: 1.1rem; }
  .h { font-weight: 700; margin: 0.6rem 0 0.4rem; font-size: 0.93rem; }
  .w { font: 12px var(--mono); text-anchor: middle; paint-order: stroke; stroke: var(--sheet); stroke-width: 3px; }
  .cap { font-size: 0.86rem; color: var(--pencil); }
</style>
