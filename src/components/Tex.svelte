<script lang="ts">
  import { renderTex } from '../lib/katex';
  let { tex, display = false }: { tex: string; display?: boolean } = $props();
  const html = $derived(renderTex(tex, display));
</script>

{#if display}
  <div class="tex-display">{@html html}</div>
{:else}
  <span class="tex-inline">{@html html}</span>
{/if}

<style>
  .tex-display { margin: 0.6rem 0; }
</style>
