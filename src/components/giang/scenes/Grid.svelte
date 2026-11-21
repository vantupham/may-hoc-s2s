<script lang="ts">
  /**
   * Một hoặc vài ma trận cạnh nhau: ma trận nhầm lẫn, ma trận chú ý, bộ lọc, ảnh điểm ảnh.
   * kind: 'num' chỉ số; 'heat' tô màu theo giá trị kèm số; 'img' ảnh xám không số.
   * Trạng thái s: n (số ma trận đã hiện), hl ("m,r,c": ô đang nói), win ("m,r,c,h,w": khung trượt)
   */
  import { num, shown } from './reveal';
  interface Mat { title?: string; vals: number[][]; rows?: string[]; cols?: string[]; kind?: 'num' | 'heat' | 'img'; digits?: number; cell?: number; signed?: boolean }
  let { title = '', mats, s = {} }: { title?: string; mats: Mat[]; s?: Record<string, unknown> } = $props();

  const fmt = (v: number, d = 2) => (Number.isInteger(v) && d === 0 ? v.toLocaleString('vi-VN') : v.toFixed(d).replace('.', ',').replace('-', '−'));
  const parse = (v: unknown) => String(v ?? '').split(',').filter((x) => x !== '').map(Number);
  const hl = $derived(parse(s.hl));
  const win = $derived(parse(s.win));
  function bg(m: Mat, v: number) {
    const all = m.vals.flat();
    if (m.kind === 'img') { const lo = Math.min(...all), hi = Math.max(...all); const g = (v - lo) / (hi - lo || 1); return `color-mix(in srgb, var(--ink) ${Math.round(g * 100)}%, var(--sheet))`; }
    if (m.kind !== 'heat') return 'transparent';
    if (m.signed) { const a = Math.max(...all.map(Math.abs)) || 1; const p = Math.round((Math.abs(v) / a) * 70); return `color-mix(in srgb, ${v >= 0 ? 'var(--c-pos)' : 'var(--c-neg)'} ${p}%, var(--sheet))`; }
    const lo = Math.min(...all), hi = Math.max(...all); const p = Math.round(((v - lo) / (hi - lo || 1)) * 75);
    return `color-mix(in srgb, var(--tim) ${p}%, var(--sheet))`;
  }
</script>

<div class="sc">
  {#if title}<h3>{title}</h3>{/if}
  <div class="row">
    {#each mats as m, k}
      {@const cs = m.cell ?? (m.kind === 'img' ? 300 / Math.max(m.vals.length, m.vals[0].length) : Math.min(72, 330 / Math.max(m.vals.length, m.vals[0].length)))}
      <figure style:opacity={shown(s.n ?? mats.length, k)}>
        {#if m.title}<figcaption>{m.title}</figcaption>{/if}
        <div class="mat" style:grid-template-columns={`${m.rows ? 'auto ' : ''}repeat(${m.vals[0].length}, ${cs}px)`}>
          {#if m.cols}{#if m.rows}<span></span>{/if}{#each m.cols as c}<span class="hd">{c}</span>{/each}{/if}
          {#each m.vals as r, i}
            {#if m.rows}<span class="hd rh">{m.rows[i]}</span>{/if}
            {#each r as v, j}
              {@const on = hl[0] === k && hl[1] === i && hl[2] === j}
              {@const inw = win.length === 5 && win[0] === k && i >= win[1] && i < win[1] + win[3] && j >= win[2] && j < win[2] + win[4]}
              <span class="c" class:on class:inw class:img={m.kind === 'img'} style:height={`${cs}px`} style:background={bg(m, v)} style:font-size={`${Math.min(20, cs * 0.34)}px`}>{m.kind === 'img' ? '' : fmt(v, m.digits ?? 2)}</span>
            {/each}
          {/each}
        </div>
      </figure>
    {/each}
  </div>
</div>

<style>
  .sc { padding: 34px 40px 0 130px; }
  h3 { font-size: 34px; margin: 0 0 16px; }
  .row { display: flex; gap: 34px; align-items: flex-start; flex-wrap: wrap; }
  figure { margin: 0; }
  figcaption { font-size: 19px; color: var(--pencil); margin-bottom: 8px; font-family: var(--hand); color: var(--tim); font-size: 23px; }
  .mat { display: grid; gap: 2px; }
  .c { display: grid; place-items: center; font-family: var(--mono); color: var(--ink); border: 1px solid var(--rule); }
  .c.img { border: 0; }
  .c.on { outline: 3px solid var(--le); outline-offset: -2px; position: relative; z-index: 1; }
  .c.inw { box-shadow: inset 0 0 0 2px var(--c-w); }
  .hd { font-size: 16px; color: var(--pencil); text-align: center; align-self: end; padding: 0 2px 4px; }
  .rh { text-align: right; align-self: center; padding-right: 8px; }
</style>
