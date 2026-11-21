<script lang="ts">
  /**
   * Cây (hoặc sơ đồ phân tầng) đơn giản: mỗi nút có cha, xếp theo tầng, lá trải đều.
   * Trạng thái s: n (số nút đã hiện theo thứ tự khai báo), hl (id nút đang nói), path (chuỗi id nút trên đường đi)
   */
  import { shown } from './reveal';
  interface Node { id: string; parent?: string; text: string; sub?: string; edge?: string; cls?: number }
  let { title = '', nodes, s = {} }: { title?: string; nodes: Node[]; s?: Record<string, unknown> } = $props();
  const COLORS = ['var(--k0)', 'var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)'];

  const layout = $derived.by(() => {
    const kids = new Map<string, string[]>();
    nodes.forEach((n) => { if (n.parent) kids.set(n.parent, [...(kids.get(n.parent) ?? []), n.id]); });
    const pos = new Map<string, { x: number; d: number }>();
    let leaf = 0, maxD = 0;
    const walk = (id: string, d: number): number => {
      maxD = Math.max(maxD, d);
      const ch = kids.get(id) ?? [];
      const x = ch.length ? ch.map((c) => walk(c, d + 1)).reduce((a, b) => a + b, 0) / ch.length : leaf++;
      pos.set(id, { x, d });
      return x;
    };
    nodes.filter((n) => !n.parent).forEach((r) => walk(r.id, 0));
    return { pos, leaves: Math.max(1, leaf), depth: maxD };
  });
  const W = 900, H = 384;
  /** Ô nút hẹp lại khi cây nhiều lá */
  const bw = $derived(Math.min(184, (W - 120) / layout.leaves - 8));
  const small = $derived(bw < 140);
  const X = (x: number) => 60 + ((W - 120) * (x + 0.5)) / layout.leaves;
  const Y = (d: number) => 36 + (layout.depth ? ((H - 80) * d) / layout.depth : 0);
  const idx = $derived(new Map(nodes.map((n, i) => [n.id, i])));
  const path = $derived(new Set(String(s.path ?? '').split(',').filter(Boolean)));
</script>

<div class="sc">
  {#if title}<h3>{title}</h3>{/if}
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={title || 'Sơ đồ'}>
    {#each nodes as n}
      {#if n.parent && layout.pos.get(n.parent)}
        {@const a = layout.pos.get(n.parent)!}{@const b = layout.pos.get(n.id)!}
        <g opacity={shown(s.n ?? nodes.length, idx.get(n.id)!)}>
          <line x1={X(a.x)} y1={Y(a.d) + 26} x2={X(b.x)} y2={Y(b.d) - 26} stroke={path.has(n.id) ? 'var(--le)' : 'var(--rule-2)'} stroke-width={path.has(n.id) ? 4 : 2} />
          {#if n.edge}<text x={(X(a.x) + X(b.x)) / 2 + (b.x < a.x ? -10 : 10)} y={(Y(a.d) + Y(b.d)) / 2} text-anchor={b.x < a.x ? 'end' : 'start'} class="edge">{n.edge}</text>{/if}
        </g>
      {/if}
    {/each}
    {#each nodes as n}
      {@const p = layout.pos.get(n.id)!}
      {@const on = s.hl === n.id || path.has(n.id)}
      <g opacity={shown(s.n ?? nodes.length, idx.get(n.id)!)} transform={`translate(${X(p.x)},${Y(p.d)})`}>
        <rect x={-bw / 2} y={-26} width={bw} height={n.sub ? 54 : 40} rx="6" fill={n.cls !== undefined ? `color-mix(in srgb, ${COLORS[n.cls]} 22%, var(--sheet))` : 'var(--sheet)'} stroke={on ? 'var(--le)' : 'var(--rule-2)'} stroke-width={on ? 3 : 1.5} />
        <text y={n.sub ? -4 : 0} dy="0.35em" text-anchor="middle" class="t" class:small>{n.text}</text>
        {#if n.sub}<text y="17" dy="0.35em" text-anchor="middle" class="sub" class:small>{n.sub}</text>{/if}
      </g>
    {/each}
  </svg>
</div>

<style>
  .sc { padding: 30px 20px 0 20px; }
  h3 { font-size: 32px; margin: 0 0 0 130px; }
  svg { font-family: var(--serif); }
  .t { font-size: 17px; fill: var(--ink); font-weight: 600; }
  .sub { font-size: 14px; fill: var(--pencil); font-family: var(--mono); }
  .t.small { font-size: 14px; }
  .sub.small { font-size: 12px; }
  .edge { font-size: 15px; fill: var(--tim); font-family: var(--hand); }
</style>
