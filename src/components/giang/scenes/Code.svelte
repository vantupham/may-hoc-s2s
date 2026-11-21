<script lang="ts">
  /** Đoạn mã Python, tô sáng các dòng s.a … s.b (đánh số từ 1; 0 = không tô). */
  import { highlightPython } from '../../../lib/pyhl';
  import { num } from './reveal';
  let { title = '', code, s = {} }: { title?: string; code: string; s?: Record<string, unknown> } = $props();
  const lines = $derived(highlightPython(code).split('\n'));
  /** Cỡ chữ vừa khung: tối đa 15px, nhỏ lại khi mã dài để không chạm phụ đề */
  const fs = $derived(Math.min(15, 400 / (lines.length * 1.36)));
  const a = $derived(Math.round(num(s.a))), b = $derived(Math.round(num(s.b)));
</script>

<div class="sc">
  {#if title}<p class="file">{title}</p>{/if}
  <pre style:font-size={`${fs}px`}><code>{#each lines as l, i}<span class="ln" class:on={a > 0 && i + 1 >= a && i + 1 <= b} class:dim={a > 0 && (i + 1 < a || i + 1 > b)}><span class="no">{i + 1}</span>{@html l || ' '}</span>{/each}</code></pre>
</div>

<style>
  .sc { padding: 38px 40px 0 110px; }
  .file { font-family: var(--mono); font-size: 17px; color: var(--pencil); margin: 0 0 8px; }
  pre { margin: 0; font-family: var(--mono); font-size: 15px; line-height: 1.36; background: var(--sheet); border: 1px solid var(--rule-2); border-radius: 4px; padding: 10px 0; overflow: hidden; }
  .ln { display: block; padding: 0 16px 0 0; transition: opacity 0.3s, background 0.3s; white-space: pre; }
  .ln.on { background: var(--hl); }
  .ln.dim { opacity: 0.38; }
  .no { display: inline-block; width: 44px; text-align: right; margin-right: 18px; color: var(--faint); user-select: none; }
</style>
