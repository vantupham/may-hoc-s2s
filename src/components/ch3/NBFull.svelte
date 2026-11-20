<script lang="ts">
  /** Bộ lọc thư rác đầy đủ: học từ 4.460 tin, thử trên 1.114 tin; gõ tin của bạn để xem từng từ "kéo" về phía nào. */
  import { nbFromCounts, nbScore, fmt } from '../../lib/ml-core';

  interface Sms { vocab: string[]; counts: number[][]; docs: number[]; test: { y: number; text: string }[] }
  let { sms }: { sms: Sms } = $props();
  const model = $derived(nbFromCounts(sms.vocab, sms.counts, sms.docs, 1));
  let msg = $state('Congratulations! You have won a free ticket. Call now to claim');
  const s = $derived(nbScore(model, msg));
  const preds = $derived(sms.test.map((t) => ({ ...t, r: nbScore(model, t.text) })));
  const cm = $derived.by(() => {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    preds.forEach((p) => { if (p.r.pred && p.y) tp++; else if (p.r.pred) fp++; else if (p.y) fn++; else tn++; });
    return { tp, fp, tn, fn, acc: (tp + tn) / preds.length };
  });
  const wrong = $derived(preds.filter((p) => p.r.pred !== p.y));
  const top = $derived.by(() => {
    const V = model.vocab.length;
    const r = model.vocab.map((w, j) => ({
      w, n: model.counts[0][j] + model.counts[1][j],
      lr: Math.log((model.counts[1][j] + 1) / (model.totals[1] + V)) - Math.log((model.counts[0][j] + 1) / (model.totals[0] + V)),
    })).filter((x) => x.n >= 10);
    r.sort((a, b) => b.lr - a.lr);
    return { spam: r.slice(0, 12), ham: r.slice(-12).reverse() };
  });
  const maxAbs = $derived(Math.max(1, ...s.tokens.map((t) => Math.abs(t.logp[1] - t.logp[0]))));
</script>

<div class="lab">
  <p class="lab-title">Bộ lọc thư rác trên toàn bộ dữ liệu</p>
  <p class="lab-hint">Từ điển {model.vocab.length.toLocaleString('vi-VN')} từ, học từ {(sms.docs[0] + sms.docs[1]).toLocaleString('vi-VN')} tin nhắn. Gõ một tin nhắn tiếng Anh: thanh đỏ là từ kéo về phía spam, thanh xanh kéo về phía tin thường, độ dài là log P(từ|spam) − log P(từ|thường).</p>
  <input class="msg" type="text" bind:value={msg} aria-label="Tin nhắn để kiểm tra" />
  <p class="verdict">Xác suất spam: <b class="num" style={`color:var(${s.pred ? '--c-pos' : '--c-neg'})`}>{fmt(s.pSpam * 100, 2)}%</b> → {s.pred ? 'spam' : 'tin thường'}</p>
  <div class="toks">
    {#each s.tokens as t}
      {@const d = t.logp[1] - t.logp[0]}
      <div class="tok" class:unk={!t.known}>
        <span class="w">{t.token}</span>
        {#if t.known}
          <span class="track"><span class="bar" style={`${d > 0 ? 'left:50%' : `right:50%`};width:${(Math.abs(d) / maxAbs) * 50}%;background:var(${d > 0 ? '--c-pos' : '--c-neg'})`}></span></span>
          <span class="num">{d > 0 ? '+' : ''}{fmt(d, 2)}</span>
        {:else}<span class="track"></span><span class="num">chưa gặp</span>{/if}
      </div>
    {/each}
  </div>
  <div class="lab-grid res">
    <div>
      <p class="h">Trên {sms.test.length.toLocaleString('vi-VN')} tin nhắn của tập test</p>
      <table class="data cm">
        <thead><tr><th></th><th>Đoán spam</th><th>Đoán thường</th></tr></thead>
        <tbody>
          <tr><td class="t">Thật là spam</td><td>{cm.tp}</td><td class="bad">{cm.fn}</td></tr>
          <tr><td class="t">Thật là tin thường</td><td class="bad">{cm.fp}</td><td>{cm.tn}</td></tr>
        </tbody>
      </table>
      <p>Độ chính xác <b class="num">{fmt(cm.acc * 100, 2)}%</b>. {cm.fp} tin thường bị chặn nhầm, {cm.fn} tin rác lọt qua.</p>
      <details>
        <summary>Xem {wrong.length} tin bị phân loại sai</summary>
        <ul class="wrong">
          {#each wrong as w}<li><b style={`color:var(${w.y ? '--c-pos' : '--c-neg'})`}>{w.y ? 'spam' : 'thường'}</b>, đoán {fmt(w.r.pSpam * 100, 0)}% spam: {w.text}</li>{/each}
        </ul>
      </details>
    </div>
    <div class="topw">
      <div><p class="h">Từ "đậm chất" spam nhất</p><p>{#each top.spam as t, i}<span style="color:var(--c-pos)">{t.w}</span>{i < top.spam.length - 1 ? ', ' : ''}{/each}</p></div>
      <div><p class="h">Từ "đậm chất" tin thường nhất</p><p>{#each top.ham as t, i}<span style="color:var(--c-neg)">{t.w}</span>{i < top.ham.length - 1 ? ', ' : ''}{/each}</p></div>
      <p class="cap">Chỉ xét từ xuất hiện ít nhất 10 lần.</p>
    </div>
  </div>
</div>

<style>
  .msg { width: 100%; padding: 0.5rem 0.7rem; border: 1px solid var(--rule-2); border-radius: 3px; background: var(--sheet); font-size: 1rem; }
  .verdict { margin: 0.6rem 0; }
  .toks { display: grid; gap: 0.15rem; margin-bottom: 1.2rem; }
  .tok { display: grid; grid-template-columns: 8rem 1fr 4.5rem; gap: 0.6rem; align-items: center; font-size: 0.86rem; }
  .tok .w { font-family: var(--mono); font-size: 0.82rem; text-align: right; }
  .tok.unk .w, .tok.unk .num { color: var(--faint); }
  .track { position: relative; height: 10px; border-left: 1px solid transparent; background: linear-gradient(to right, transparent calc(50% - 0.5px), var(--rule-2) calc(50% - 0.5px), var(--rule-2) calc(50% + 0.5px), transparent calc(50% + 0.5px)); }
  .bar { position: absolute; top: 0; bottom: 0; }
  .h { font-weight: 700; margin: 0 0 0.4rem; }
  .cm td.bad { background: color-mix(in srgb, var(--bad) 12%, transparent); }
  .res { margin-top: 0.5rem; }
  .topw p { font-size: 0.9rem; }
  .cap { color: var(--faint); font-size: 0.8rem !important; font-style: italic; }
  details { font-size: 0.88rem; }
  summary { cursor: pointer; color: var(--tim); }
  .wrong { max-height: 14rem; overflow-y: auto; padding-left: 1.1rem; }
</style>
