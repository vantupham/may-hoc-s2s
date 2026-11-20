<script lang="ts">
  /** Hiển thị một phép tính: công thức tổng quát → công thức đã thay số → kết quả, kèm các số hạng. */
  import type { Calc } from '../lib/ml-core/trace';
  import { fmt } from '../lib/ml-core/trace';
  import Tex from './Tex.svelte';

  let { calc, digits = 4 }: { calc: Calc; digits?: number } = $props();
  let showTerms = $state(false);
</script>

<div class="calc">
  <div class="name">{calc.name}</div>
  <div class="row"><span class="tag">công thức</span><Tex tex={calc.formula} display /></div>
  {#if calc.substituted}
    <div class="row"><span class="tag">thay số thật vào</span><Tex tex={calc.substituted} display /></div>
  {/if}
  {#if calc.terms}
    <button class="link" type="button" onclick={() => (showTerms = !showTerms)}>{showTerms ? 'Ẩn' : 'Xem'} từng số hạng ({calc.terms.length})</button>
    {#if showTerms}
      <table class="data terms">
        <thead><tr><th>Số hạng</th><th>Biểu thức</th><th>Giá trị</th></tr></thead>
        <tbody>
          {#each calc.terms as t}
            <tr><td>{t.label}</td><td>{t.expr ?? ''}</td><td>{fmt(t.value, digits)}</td></tr>
          {/each}
          <tr class="sum"><td>Tổng</td><td></td><td>{fmt(calc.terms.reduce((a, t) => a + t.value, 0), digits)}</td></tr>
        </tbody>
      </table>
    {/if}
  {/if}
  {#if calc.note}<p class="note-s">{calc.note}</p>{/if}
</div>

<style>
  .calc { border-top: 1.5px solid var(--ink); padding: 0.7rem 0 0.2rem; background: transparent; }
  .name { font-weight: 700; font-size: 0.98rem; margin-bottom: 0.1rem; }
  .row { margin-top: 0.3rem; }
  .tag { display: block; font-size: 0.8rem; color: var(--faint); font-style: italic; }
  .row :global(.tex-display) { margin: 0.1rem 0; }
  .row :global(.katex-display) { text-align: left; margin: 0; }
  .row :global(.katex-display > .katex) { text-align: left; }
  .row :global(.katex) { font-size: 1em; }
  .link { background: none; border: 0; padding: 0; color: var(--tim); cursor: pointer; font-size: 0.86rem; margin-top: 0.4rem; text-decoration: underline; text-underline-offset: 3px; }
  .terms { margin-top: 0.4rem; }
  .terms td:nth-child(2) { color: var(--pencil); }
  .sum td { font-weight: 700; border-bottom: 0; border-top: 1.5px solid var(--ink); }
  .note-s { font-size: 0.86rem; color: var(--pencil); margin: 0.4rem 0 0; }
</style>
