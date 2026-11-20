<script lang="ts">
  /** Trục đồ thị đơn giản dùng thang đo d3 (chỉ dùng d3 để tính, Svelte để vẽ). */
  import type { ScaleLinear } from 'd3';

  let {
    scale,
    orient,
    size,
    ticks = 6,
    label = '',
    format = (v: number) => String(+v.toFixed(3)).replace('.', ',').replace('-', '−'),
    offset = 0,
  }: {
    scale: ScaleLinear<number, number>;
    orient: 'bottom' | 'left';
    size: number;
    ticks?: number;
    label?: string;
    format?: (v: number) => string;
    offset?: number;
  } = $props();

  const values = $derived(scale.ticks(ticks));
  const range = $derived(scale.range());
</script>

{#if orient === 'bottom'}
  <g transform={`translate(0,${offset})`}>
    {#each values as v}
      <g class="tick" transform={`translate(${scale(v)},0)`}>
        <line y1="0" y2={-size} />
        <text y="16" text-anchor="middle">{format(v)}</text>
      </g>
    {/each}
    <line class="domain" x1={range[0]} x2={range[1]} />
    {#if label}<text class="axis-label" x={range[1]} y="34" text-anchor="end">{label}</text>{/if}
  </g>
{:else}
  <g transform={`translate(${offset},0)`}>
    {#each values as v}
      <g class="tick" transform={`translate(0,${scale(v)})`}>
        <line x1="0" x2={size} />
        <text x="-8" dy="0.32em" text-anchor="end">{format(v)}</text>
      </g>
    {/each}
    <line class="domain" y1={range[0]} y2={range[1]} />
    {#if label}<text class="axis-label" x="0" y={range[1] - 12} text-anchor="start">{label}</text>{/if}
  </g>
{/if}
