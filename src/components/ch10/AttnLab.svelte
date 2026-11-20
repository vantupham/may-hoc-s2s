<script lang="ts">
  /** Self-attention với số thật: Q, K, V, ma trận chú ý, và cách từng token "nhìn" các token khác. */
  import CalcCard from '../CalcCard.svelte';
  import { attnForward, attnRowCalc, scoreCalc, fmt, type AttnModel } from '../../lib/ml-core';

  let { model, samples }: { model: AttnModel; samples: { y: number; text: string }[] } = $props();
  let msg = $state(samples[0].text);
  const r = $derived(attnForward(model, msg));
  const L = $derived(r.toks.length);
  let sel = $state<{ i: number; j: number | null }>({ i: 0, j: null });
  $effect(() => { msg; sel = { i: 0, j: null }; });
  const calc = $derived(sel.j === null ? attnRowCalc(r, Math.min(sel.i, L - 1), model.d) : scoreCalc(r, Math.min(sel.i, L - 1), Math.min(sel.j, L - 1), model.d));
  const colMean = $derived(r.toks.map((_, j) => r.A.reduce((s, row) => s + row[j], 0) / L));
  let view = $state<'X' | 'Q' | 'K' | 'V'>('Q');
  const mat = $derived({ X: r.X, Q: r.Q, K: r.K, V: r.V }[view]);
  const mmax = $derived(Math.max(1e-9, ...mat.flat().map(Math.abs)));
  const heat = (v: number, max: number) => `color-mix(in srgb, var(${v >= 0 ? '--c-pos' : '--c-neg'}) ${Math.round(Math.min(1, Math.abs(v) / max) * 55)}%, var(--sheet))`;
</script>

<div class="lab">
  <p class="lab-title">Mỗi từ hỏi, mọi từ trả lời</p>
  <p class="lab-hint">Mỗi token có ba vector 8 chiều: <b>q</b> (câu hỏi nó đặt ra), <b>k</b> (nhãn để từ khác tìm đến nó) và <b>v</b> (thông tin nó mang). Ô (i, j) của ma trận chú ý cho biết token i dành bao nhiêu phần trăm sự chú ý cho token j. Bấm một ô để xem điểm số; bấm tên một hàng để xem cả hàng.</p>
  <label class="in">Tin nhắn (tiếng Anh, tối đa {model.maxLen} từ)
    <input type="text" bind:value={msg} />
  </label>
  <p class="sugg">Thử: {#each samples as s, i}<button class="link" type="button" onclick={() => (msg = s.text)}>{s.text.slice(0, 38)}{s.text.length > 38 ? '…' : ''}</button>{i < samples.length - 1 ? ', ' : ''}{/each}</p>
  <div class="toks">
    {#each r.toks as t, j}
      <span class="tk" class:unk={t.id === 0} style={`border-bottom: ${3 + colMean[j] * 30}px solid color-mix(in srgb, var(--tim) ${Math.round(Math.min(1, colMean[j] * L / 3) * 100)}%, transparent)`}>{t.word}</span>
    {/each}
  </div>
  <p class="cap">Độ dày gạch chân: mức chú ý trung bình mà token nhận được từ mọi token khác. Từ xám là từ không có trong từ điển 1.500 từ (thay bằng &lt;unk&gt;).</p>
  <div class="lab-grid">
    <div>
      <p class="h">Ma trận chú ý A (mỗi hàng cộng lại bằng 100%)</p>
      <div class="table-scroll">
        <table class="att">
          <thead><tr><th></th>{#each r.toks as t}<th class="ch"><span>{t.word}</span></th>{/each}</tr></thead>
          <tbody>
            {#each r.A as row, i}
              <tr>
                <th><button class="rowbtn" class:sel={sel.i === i && sel.j === null} type="button" onclick={() => (sel = { i, j: null })}>{r.toks[i].word}</button></th>
                {#each row as a, j}
                  <td style={`background:color-mix(in srgb, var(--tim) ${Math.round(a * 100)}%, var(--sheet));color:${a > 0.45 ? 'var(--sheet)' : 'var(--ink)'}`} class:sel={sel.i === i && sel.j === j}>
                    <button type="button" onclick={() => (sel = { i, j })} aria-label={`Chú ý từ ${r.toks[i].word} tới ${r.toks[j].word}`}>{Math.round(a * 100)}</button>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    <div>
      <CalcCard {calc} digits={3} />
      <div class="out">
        <p>Trung bình các hàng của H → vector h = ({r.h.map((v) => fmt(v, 2)).join('; ')})</p>
        <p>z = h·u + c = <span class="num">{fmt(r.z, 3)}</span>, p(spam) = σ(z) = <b class="num" style={`color:var(${r.p >= 0.5 ? '--c-pos' : '--c-neg'})`}>{fmt(r.p * 100, 2)}%</b></p>
      </div>
    </div>
  </div>
  <p class="h">Các ma trận với số thật ({L} token × 8 chiều)</p>
  <div class="ctrl" role="radiogroup" aria-label="Ma trận">
    {#each [['X', 'X = embedding + vị trí'], ['Q', 'Q = X·Wq'], ['K', 'K = X·Wk'], ['V', 'V = X·Wv']] as [k, lab]}<label><input type="radio" bind:group={view} value={k} /> {lab}</label>{/each}
  </div>
  <div class="table-scroll">
    <table class="mat">
      <thead><tr><th></th>{#each Array.from({ length: model.d }, (_, j) => j + 1) as j}<th>{j}</th>{/each}</tr></thead>
      <tbody>{#each mat as row, i}<tr><th>{r.toks[i].word}</th>{#each row as v}<td style={`background:${heat(v, mmax)}`}>{fmt(v, 2)}</td>{/each}</tr>{/each}</tbody>
    </table>
  </div>
</div>

<style>
  .in { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.9rem; font-weight: 600; }
  .in input { font-weight: 400; padding: 0.45rem 0.6rem; border: 1px solid var(--rule-2); border-radius: 3px; background: var(--sheet); font-size: 0.95rem; }
  .sugg { font-size: 0.84rem; color: var(--pencil); margin: 0.3rem 0 0.6rem; }
  .link { background: none; border: 0; padding: 0; color: var(--tim); text-decoration: underline; cursor: pointer; font-size: inherit; }
  .toks { display: flex; flex-wrap: wrap; gap: 0.4rem 0.5rem; margin: 0.4rem 0; }
  .tk { font-family: var(--mono); font-size: 0.86rem; padding: 0 0.15rem; }
  .tk.unk { color: var(--faint); }
  .cap { font-size: 0.84rem; color: var(--pencil); }
  .h { font-weight: 700; margin: 0.6rem 0 0.4rem; font-size: 0.93rem; }
  .att { border-collapse: collapse; font: 0.72rem var(--mono); }
  .att th { font-weight: 500; color: var(--pencil); padding: 0.1rem 0.25rem; text-align: right; }
  .att th.ch { height: 5.5rem; vertical-align: bottom; padding: 0; }
  .att th.ch span { display: inline-block; writing-mode: vertical-rl; transform: rotate(180deg); padding-bottom: 0.2rem; }
  .att td { border: 1px solid var(--rule); padding: 0; min-width: 1.9rem; height: 1.6rem; text-align: center; }
  .att td button { all: unset; display: block; width: 100%; height: 100%; cursor: pointer; text-align: center; }
  .att td.sel { outline: 2.5px solid var(--hl); outline-offset: -2px; }
  .rowbtn { background: none; border: 0; cursor: pointer; font: inherit; color: var(--ink); padding: 0 0.2rem; }
  .rowbtn.sel { background: var(--hl); }
  .out { font-size: 0.88rem; margin-top: 0.8rem; }
  .out p { margin: 0 0 0.3rem; }
  .mat { border-collapse: collapse; font: 0.72rem var(--mono); }
  .mat th { font-weight: 500; color: var(--pencil); padding: 0.1rem 0.4rem; text-align: right; }
  .mat td { border: 1px solid var(--rule); padding: 0.15rem 0.35rem; text-align: right; }
</style>
