<script lang="ts">
  /** Công thức hiện dần. s.n: số công thức đã hiện; s.hl: công thức đang nói. */
  import { renderTex } from '../../../lib/katex';
  import { shown, num } from './reveal';
  let { title = '', items, s = {} }: { title?: string; items: { tex: string; label?: string }[]; s?: Record<string, unknown> } = $props();
  const html = $derived(items.map((it) => renderTex(it.tex, true)));
  const hl = $derived(Math.round(num(s.hl, -1)));
  const big = $derived(items.length <= 2);
</script>

<div class="sc" class:big>
  {#if title}<h3>{title}</h3>{/if}
  <div class="list">
    {#each items as it, i}
      <div class="row" class:on={hl === i} class:dim={hl >= 0 && hl !== i} style:opacity={shown(s.n, i) * (hl >= 0 && hl !== i ? 0.45 : 1)}>
        {#if it.label}<span class="flab">{it.label}</span>{/if}
        <div class="f">{@html html[i]}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .sc { padding: 34px 60px 0 150px; height: 100%; }
  h3 { font-size: 36px; margin: 0 0 12px; }
  .list { display: grid; gap: 2px; }
  .row { display: grid; grid-template-columns: 190px 1fr; align-items: center; padding: 2px 12px; border-radius: 4px; transition: background 0.3s; font-size: 22px; }
  .row:not(:has(.flab)) { grid-template-columns: 1fr; }
  .row.on { background: var(--hl); }
  .flab { font-family: var(--hand); color: var(--tim); font-size: 26px; }
  .f :global(.katex-display) { margin: 4px 0; text-align: left; }
  .big .list { margin-top: 70px; gap: 30px; }
  .big .row { font-size: 40px; }
  .big .f :global(.katex-display) { text-align: center; }
</style>
