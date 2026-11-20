<script lang="ts">
  /**
   * Đặt ngay sau lab của một Mission: bảng ghi số liệu (đối chiếu với số thật),
   * đối chiếu dự đoán, rồi tự giải thích trước khi xem gợi ý trả lời.
   */
  import { onMount } from 'svelte';
  import { init, get, update } from '../../lib/learn.svelte';
  import { checkRecord, type Mission } from '../../lib/learn';
  import { fmt } from '../../lib/ml-core';

  let { slug, m }: { slug: string; m: Mission } = $props();
  onMount(init);
  const st = $derived(get(slug));
  const picked = $derived(st.pred[m.id]);
  const note = $derived(st.notes[m.id] ?? '');

  let checked = $state(false);
  let showPred = $state(false);
  let showAns = $state(false);
  const marks = $derived(m.record ? checkRecord(m.record, st.rec[m.id]) : []);
  const nRight = $derived(marks.flat().filter((x) => x === true).length);
  const nCells = $derived(marks.flat().length);

  const setCell = (i: number, j: number, v: string) => update(slug, (s) => {
    const r = (s.rec[m.id] ?? []).map((row) => [...row]);
    while (r.length <= i) r.push([]);
    r[i][j] = v;
    s.rec[m.id] = r;
  });
  const setNote = (v: string) => update(slug, (s) => { s.notes[m.id] = v; });
  const show = (v: number, j: number) => fmt(v, Number.isInteger(v) ? 0 : m.record!.tol[j] >= 0.1 ? 1 : 3);
</script>

<div class="debrief" data-debrief={m.id}>
  <p class="tag hand">Đối chiếu và giải thích</p>

  {#if m.record}
    <p class="q"><b>Ghi lại số liệu</b> bạn đọc được trên lab. Có thể dùng dấu phẩy hoặc dấu chấm thập phân.</p>
    <div class="table-scroll">
      <table class="data rec">
        <thead><tr><th></th>{#each m.record.cols as c}<th>{c}</th>{/each}</tr></thead>
        <tbody>
          {#each m.record.rows as r, i}
            <tr>
              <td class="t">{r.label}</td>
              {#each r.values as v, j}
                {@const ok = marks[i][j]}
                <td>
                  <input type="text" inputmode="decimal" aria-label={`${r.label}, ${m.record.cols[j]}`}
                    value={st.rec[m.id]?.[i]?.[j] ?? ''} oninput={(e) => setCell(i, j, e.currentTarget.value)}
                    class:right={checked && ok === true} class:wrong={checked && ok === false} />
                  {#if checked && ok === false}<span class="truth">đúng là {show(v, j)}</span>{/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="row">
      <button type="button" class="btn" onclick={() => (checked = true)}>Đối chiếu số liệu</button>
      {#if checked}<span class="res">Khớp {nRight}/{nCells} ô.{nRight < nCells ? ' Ô đỏ: đọc lại trên lab, hoặc xem số đúng bên cạnh.' : ' Chính xác!'}</span>{/if}
    </p>
  {/if}

  {#if m.predict}
    <p class="q"><b>Dự đoán của bạn có đúng không?</b></p>
    {#if picked === undefined && !showPred}
      <p class="row"><span class="muted">Bạn chưa dự đoán ở phần Trải nghiệm phía trên. Hãy thử đoán trước — sai cũng là cách học tốt.</span>
        <button type="button" class="btn" onclick={() => (showPred = true)}>Vẫn xem kết quả</button></p>
    {:else if !showPred}
      <p class="row"><button type="button" class="btn" onclick={() => (showPred = true)}>Xem kết quả</button></p>
    {:else}
      <p class="verdict" class:good={picked === m.predict.answer} class:bad={picked !== undefined && picked !== m.predict.answer}>
        {#if picked !== undefined}Bạn đoán: <b>{m.predict.options[picked]}</b> — {picked === m.predict.answer ? 'đúng.' : 'chưa đúng.'}<br />{/if}
        Kết quả: <b>{m.predict.options[m.predict.answer]}</b>. {m.predict.why}
      </p>
    {/if}
  {/if}

  {#if m.explain}
    <p class="q"><b>Tự giải thích.</b> {m.explain.q}</p>
    <textarea rows="3" placeholder="Viết bằng lời của bạn, 2–3 câu…" aria-label={m.explain.q}
      value={note} oninput={(e) => setNote(e.currentTarget.value)}></textarea>
    <p class="row">
      <button type="button" class="btn" onclick={() => (showAns = !showAns)}>{showAns ? 'Ẩn gợi ý' : 'Xem gợi ý trả lời'}</button>
      {#if !note.trim() && !showAns}<span class="muted">Viết vài chữ trước khi xem sẽ nhớ lâu hơn.</span>{/if}
    </p>
    {#if showAns}<p class="ans">{m.explain.answer}</p>{/if}
  {/if}
</div>

<style>
  .debrief { border-left: 3px solid var(--c-L); padding: 0.6rem 1.1rem 0.6rem; margin: 0.4rem 0 1.8rem; }
  .tag { margin: 0 0 0.3rem; font-size: 1.15rem; }
  .q { margin: 0.8rem 0 0.4rem; font-size: 0.97rem; }
  .row { display: flex; flex-wrap: wrap; gap: 0.5rem 0.9rem; align-items: center; margin: 0.4rem 0; font-size: 0.9rem; }
  .muted { color: var(--pencil); font-style: italic; }
  .res { color: var(--pencil); }
  .rec td { vertical-align: top; }
  .rec input { width: 5.5rem; font: 0.85rem var(--mono); padding: 0.2rem 0.4rem; border: 1px solid var(--rule-2); border-radius: 3px; background: var(--sheet); color: var(--ink); text-align: right; }
  .rec input.right { border-color: var(--ok); box-shadow: inset 3px 0 0 var(--ok); }
  .rec input.wrong { border-color: var(--bad); box-shadow: inset 3px 0 0 var(--bad); }
  @media (max-width: 560px) { .rec input { width: 4.2rem; } .rec th { white-space: normal; } }
  .truth { display: block; font-size: 0.75rem; color: var(--bad); margin-top: 0.15rem; font-family: var(--serif); }
  .verdict { font-size: 0.95rem; margin: 0.3rem 0; padding: 0.5rem 0.8rem; background: var(--sheet); border: 1px solid var(--rule-2); border-radius: 3px; }
  .verdict.good { box-shadow: inset 3px 0 0 var(--ok); }
  .verdict.bad { box-shadow: inset 3px 0 0 var(--bad); }
  textarea { width: 100%; box-sizing: border-box; font: 0.95rem/1.55 var(--serif); padding: 0.5rem 0.7rem; border: 1px solid var(--rule-2); border-radius: 3px; background: var(--sheet); color: var(--ink); resize: vertical; }
  .ans { font-size: 0.95rem; margin: 0.3rem 0; padding: 0.5rem 0.8rem; background: var(--sheet); border: 1px dashed var(--rule-2); border-radius: 3px; }
</style>
