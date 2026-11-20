<script lang="ts">
  /**
   * Bọc một phòng thí nghiệm cần dữ liệu lớn: chỉ khi phòng thí nghiệm sắp hiện lên màn hình
   * mới tải mã của nó và các tệp JSON, rồi truyền vào như props bình thường.
   *
   *   <Lazy client:visible view="logreg/FullLogReg"
   *         data={{ patients: `${cancerUrl}#patients`, testIds: `${cancerUrl}#testIds` }}
   *         props={{ ... props nhỏ ... }} />
   *
   * view: đường dẫn component tính từ src/components, không có đuôi .svelte.
   * data: tên prop → "url" (cả tệp) hoặc "url#trường.con".
   */
  import type { Component } from 'svelte';
  import { onMount } from 'svelte';
  import { loadAt } from '../lib/data';

  const views = import.meta.glob<{ default: Component<any> }>('./**/*.svelte');

  let {
    view,
    data = {},
    props = {},
    minHeight = '24rem',
  }: { view: string; data?: Record<string, string>; props?: Record<string, unknown>; minHeight?: string } = $props();

  let View = $state<Component<any> | null>(null);
  let loaded = $state<Record<string, unknown>>({});
  let error = $state('');

  async function start() {
    error = '';
    try {
      const imp = views[`./${view}.svelte`];
      if (!imp) throw new Error(`Không tìm thấy phòng thí nghiệm "${view}"`);
      const entries = Object.entries(data);
      const [mod, ...vals] = await Promise.all([imp(), ...entries.map(([, src]) => loadAt(src))]);
      loaded = Object.fromEntries(entries.map(([k], i) => [k, vals[i]]));
      View = (mod as { default: Component<any> }).default;
    } catch (e: any) {
      error = String(e?.message ?? e);
    }
  }
  onMount(start);
</script>

{#if View}
  <View {...props} {...loaded} />
{:else}
  <div class="ph" style:min-height={minHeight} aria-busy={!error}>
    {#if error}
      <p class="err">{error}</p>
      <button class="btn" type="button" onclick={start}>Thử lại</button>
    {:else}
      <p>Đang tải dữ liệu…</p>
    {/if}
  </div>
{/if}

<style>
  .ph { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; border: 1px dashed var(--rule-2); border-radius: 3px; color: var(--pencil); font-size: 0.9rem; font-style: italic; margin: 1rem 0; }
  .ph p { margin: 0; }
  .err { color: var(--bad); font-style: normal; }
</style>
