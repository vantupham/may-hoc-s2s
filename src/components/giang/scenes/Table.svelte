<script lang="ts">
  /**
   * Bảng số hiện dần. s.n: số hàng đã hiện; s.c: số cột đã hiện (mặc định tất cả);
   * s.hl: hàng đang nói; s.hc: cột đang nói; s.foot: độ hiện của dòng tổng kết.
   */
  import { shown, num } from './reveal';
  let { title = '', cols, rows, cls = [], foot = '', s = {} }: {
    title?: string; cols: string[]; rows: string[][]; cls?: string[]; foot?: string; s?: Record<string, unknown>;
  } = $props();
  const c = $derived(num(s.c, cols.length));
  const hl = $derived(Math.round(num(s.hl, -1)));
  const hc = $derived(Math.round(num(s.hc, -1)));
</script>

<div class="sc" class:dense={rows.length > 5} class:wide={cols.length > 5}>
  {#if title}<h3>{title}</h3>{/if}
  <table>
    <thead><tr>{#each cols as h, j}<th class={cls[j]} class:hc={hc === j} style:opacity={shown(c, j)}>{h}</th>{/each}</tr></thead>
    <tbody>
      {#each rows as r, i}
        <tr style:opacity={shown(s.n, i)} class:on={hl === i}>
          {#each r as v, j}<td class={cls[j]} class:hc={hc === j} style:opacity={shown(c, j)}>{v}</td>{/each}
        </tr>
      {/each}
    </tbody>
  </table>
  {#if foot}<p class="foot num" style:opacity={num(s.foot)}>{foot}</p>{/if}
</div>

<style>
  .sc { padding: 44px 60px 0 150px; }
  h3 { font-size: 36px; margin: 0 0 14px; }
  table { border-collapse: collapse; font-size: 24px; }
  th { font-size: 19px; font-weight: 600; color: var(--pencil); text-align: right; padding: 6px 18px; border-bottom: 2px solid var(--ink); max-width: 220px; line-height: 1.25; vertical-align: bottom; }
  td { font-family: var(--mono); text-align: right; padding: 5px 18px; border-bottom: 1px solid var(--rule); }
  th:first-child, td:first-child { text-align: center; }
  td.t, th.t { font-family: var(--serif); text-align: left; }
  td.t { white-space: nowrap; }
  .dense table { font-size: 20px; }
  .dense td { padding: 2px 18px; }
  .dense h3 { font-size: 30px; margin-bottom: 8px; }
  .wide table { font-size: 20px; }
  .wide th { padding: 6px 10px; font-size: 17px; }
  .wide td { padding-left: 10px; padding-right: 10px; }
  tr.on td { background: var(--hl); }
  .hc { background: var(--tim-soft); }
  .foot { font-size: 20px; margin-top: 14px; white-space: nowrap; color: var(--ink); font-family: var(--mono); }
</style>
