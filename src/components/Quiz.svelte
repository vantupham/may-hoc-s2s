<script lang="ts">
  interface Q { q: string; options: string[]; answer: number; why: string }
  let { questions }: { questions: Q[] } = $props();
  let picked = $state<(number | null)[]>([]);
  $effect.pre(() => { if (picked.length !== questions.length) picked = questions.map(() => null); });
  const score = $derived(picked.filter((p, i) => p === questions[i].answer).length);
  const answered = $derived(picked.filter((p) => p !== null).length);
</script>

<div class="quiz">
  {#each questions as item, i}
    <div class="qbox" role="group" aria-label={`Câu ${i + 1}`}>
      <p class="qq"><span class="n">Câu {i + 1}.</span> {item.q}</p>
      {#each item.options as opt, j}
        {@const chosen = picked[i] === j}
        {@const show = picked[i] !== null}
        <button
          type="button"
          class="opt"
          class:right={show && j === item.answer}
          class:wrong={chosen && j !== item.answer}
          disabled={show}
          onclick={() => (picked[i] = j)}
        >{opt}</button>
      {/each}
      {#if picked[i] !== null}
        <p class="why"><b>{picked[i] === item.answer ? 'Đúng rồi.' : 'Chưa đúng.'}</b> {item.why}</p>
      {/if}
    </div>
  {/each}
  {#if answered === questions.length}
    <p class="score">Bạn trả lời đúng <b>{score}/{questions.length}</b> câu. <button class="btn" type="button" onclick={() => (picked = questions.map(() => null))}>Làm lại</button></p>
  {/if}
</div>

<style>
  .quiz { margin: 1.5rem 0; counter-reset: q; }
  .qbox { padding: 0 0 1.2rem; margin: 0 0 1.2rem; border-bottom: 1px dashed var(--rule-2); }
  .qq { font-weight: 650; margin: 0 0 0.5rem; }
  .n { font-family: var(--hand); color: var(--tim); font-size: 1.25rem; font-weight: 400; margin-right: 0.2rem; }
  .opt { display: block; width: 100%; text-align: left; margin: 0.35rem 0 0; padding: 0.45rem 0.8rem; border: 1px solid var(--rule-2); border-radius: 3px; background: var(--sheet); cursor: pointer; font-size: 0.97rem; color: var(--ink); }
  .opt:hover:not(:disabled) { border-color: var(--tim); }
  .opt:disabled { cursor: default; }
  .opt.right { border-color: var(--ok); box-shadow: inset 3px 0 0 var(--ok); }
  .opt.wrong { border-color: var(--bad); box-shadow: inset 3px 0 0 var(--bad); text-decoration: line-through; text-decoration-color: var(--bad); }
  .why { margin: 0.7rem 0 0; font-size: 0.95rem; color: var(--pencil); }
  .why b { color: var(--ink); }
  .score { font-size: 1rem; display: flex; align-items: center; gap: 1rem; }
</style>
