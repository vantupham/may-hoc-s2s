<script lang="ts">
  /** Tính tay Naive Bayes: "huấn luyện" bằng cách đếm từ trong 6 tin nhắn thật, rồi chấm điểm một tin mới. */
  import CalcCard from '../CalcCard.svelte';
  import { nbTrain, nbScore, tokenize, fmt, tex, type Calc } from '../../lib/ml-core';

  let { mini }: { mini: { y: number; text: string }[] } = $props();
  const model = $derived(nbTrain(mini));
  const samples = ['Call now for your free prize', 'Please call me later', 'You have a new voicemail'];
  let msg = $state(samples[0]);
  const score = $derived(nbScore(model, msg));
  const V = $derived(model.vocab.length);
  let pickTok = $state(0);
  const known = $derived(score.tokens.filter((t) => t.known));
  const tk = $derived(known[Math.min(pickTok, known.length - 1)]);
  const calc = $derived.by((): Calc | null => {
    if (!tk) return null;
    const p = (c: number) => (tk.count[c] + 1) / (model.totals[c] + V);
    return {
      key: 'tok', name: `Xác suất của từ "${tk.token}" trong mỗi lớp`,
      formula: String.raw`P(\text{từ}\mid c) = \frac{\text{số lần từ xuất hiện trong lớp } c + 1}{\text{tổng số từ của lớp } c + |V|}`,
      substituted: String.raw`\begin{aligned} P(\text{${tk.token}}\mid\text{spam}) &= \frac{${tk.count[1]} + 1}{${model.totals[1]} + ${V}} = ${tex(p(1), 4)} \\[4pt] P(\text{${tk.token}}\mid\text{thường}) &= \frac{${tk.count[0]} + 1}{${model.totals[0]} + ${V}} = ${tex(p(0), 4)} \end{aligned}`,
      value: p(1),
    };
  });
</script>

<div class="lab">
  <p class="lab-title">Huấn luyện bằng cách đếm, dự đoán bằng cách nhân</p>
  <p class="lab-hint">Sáu tin nhắn thật: ba tin rác (spam), ba tin bình thường. Mô hình chỉ cần đếm mỗi từ xuất hiện bao nhiêu lần trong mỗi loại.</p>
  <div class="lab-grid">
    <div>
      <table class="data msgs">
        <thead><tr><th>Loại</th><th style="text-align:left">Tin nhắn</th><th>Số từ</th></tr></thead>
        <tbody>
          {#each mini as t}
            <tr><td class="t" style={`color:var(${t.y ? '--c-pos' : '--c-neg'})`}>{t.y ? 'spam' : 'thường'}</td><td class="t">{t.text}</td><td>{tokenize(t.text).length}</td></tr>
          {/each}
        </tbody>
      </table>
      <p class="facts">Từ điển có <b>{V}</b> từ khác nhau. Tổng số từ: spam <b>{model.totals[1]}</b>, thường <b>{model.totals[0]}</b>. Xác suất tiên nghiệm: P(spam) = 3/6 = 0,5.</p>
    </div>
    <div>
      <label class="in">Tin nhắn mới để chấm điểm
        <input type="text" bind:value={msg} oninput={() => (pickTok = 0)} />
      </label>
      <p class="sugg">Thử: {#each samples as s, i}<button class="link" type="button" onclick={() => { msg = s; pickTok = 0; }}>{s}</button>{i < samples.length - 1 ? ', ' : ''}{/each}</p>
      <table class="data">
        <thead><tr><th>Từ</th><th>đếm spam</th><th>đếm thường</th><th>log P(·|spam)</th><th>log P(·|thường)</th></tr></thead>
        <tbody>
          {#each score.tokens as t}
            {#if t.known}
              {@const i = known.indexOf(t)}
              <tr class:on={i === pickTok}>
                <td class="t"><button class="val" class:sel={i === pickTok} onclick={() => (pickTok = i)}>{t.token}</button></td>
                <td>{t.count[1]}</td><td>{t.count[0]}</td><td class="v-L">{fmt(t.logp[1], 3)}</td><td class="v-L">{fmt(t.logp[0], 3)}</td>
              </tr>
            {:else}
              <tr class="unk"><td class="t">{t.token}</td><td colspan="4" class="t">chưa gặp khi huấn luyện, bỏ qua</td></tr>
            {/if}
          {/each}
          <tr class="sum"><td class="t">+ log P(lớp)</td><td></td><td></td><td>{fmt(score.prior[1], 3)}</td><td>{fmt(score.prior[0], 3)}</td></tr>
          <tr class="sum"><td class="t"><b>Tổng</b></td><td></td><td></td><td><b>{fmt(score.joint[1], 3)}</b></td><td><b>{fmt(score.joint[0], 3)}</b></td></tr>
        </tbody>
      </table>
      <p class="verdict">Tổng lớn hơn thắng → <b style={`color:var(${score.pred ? '--c-pos' : '--c-neg'})`}>{score.pred ? 'spam' : 'tin thường'}</b> (P(spam) = {fmt(score.pSpam * 100, 1)}%).</p>
      {#if calc}<CalcCard {calc} />{/if}
    </div>
  </div>
</div>

<style>
  .msgs td.t:nth-child(2) { white-space: normal; font-size: 0.86rem; }
  .facts { font-size: 0.9rem; color: var(--pencil); margin-top: 0.7rem; }
  .in { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.9rem; font-weight: 600; }
  .in input { font-weight: 400; padding: 0.4rem 0.6rem; border: 1px solid var(--rule-2); border-radius: 3px; background: var(--sheet); font-size: 0.95rem; }
  .sugg { font-size: 0.85rem; color: var(--pencil); margin: 0.3rem 0 0.7rem; }
  .link { background: none; border: 0; padding: 0; color: var(--tim); text-decoration: underline; cursor: pointer; font-size: inherit; }
  .unk td { color: var(--faint); font-style: italic; }
  .sum td { border-top: 1px solid var(--rule-2); }
  .verdict { margin: 0.7rem 0; }
</style>
