<script lang="ts">
  /** Các ý hiện dần. s.n: số ý đã hiện; s.hl: ý đang nói (tô nền). Ý có thể chứa HTML đơn giản. */
  import { shown, num } from './reveal';
  let { title = '', items, s = {} }: { title?: string; items: string[]; s?: Record<string, unknown> } = $props();
  const hl = $derived(Math.round(num(s.hl, -1)));
</script>

<div class="sc">
  {#if title}<h3>{title}</h3>{/if}
  <ul>
    {#each items as it, i}
      <li style:opacity={shown(s.n, i)} style:transform={`translateY(${(1 - shown(s.n, i)) * 14}px)`} class:on={hl === i}>{@html it}</li>
    {/each}
  </ul>
</div>

<style>
  .sc { padding: 56px 80px 0 150px; }
  h3 { font-size: 40px; margin: 0 0 30px; }
  ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 20px; }
  li { font-size: 29px; line-height: 1.4; padding: 6px 14px 6px 22px; border-left: 4px solid var(--rule-2); transition: background 0.3s, border-color 0.3s; }
  li.on { background: var(--hl); border-left-color: var(--le); }
</style>
