<script lang="ts">
  /** Thẻ mở đầu bài giảng. */
  let { no = '', title, sub = '' }: { no?: string; title: string; sub?: string; s?: Record<string, unknown> } = $props();
</script>

<div class="title">
  {#if no}<p class="no hand">{no}</p>{/if}
  <h2>{title}</h2>
  {#if sub}<p class="sub">{sub}</p>{/if}
</div>

<style>
  .title { height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 0 0 150px; }
  .no { font-family: var(--hand); color: var(--tim); font-size: 46px; margin: 0; transform: rotate(-3deg); transform-origin: left; }
  h2 { font-size: 64px; line-height: 1.1; margin: 10px 0 18px; color: var(--ink); }
  .sub { font-size: 26px; color: var(--pencil); margin: 0; font-style: italic; }
</style>
