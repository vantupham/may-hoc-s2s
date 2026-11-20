<script lang="ts" module>
  // Pyodide chỉ được tải một lần cho cả trang, và chỉ khi người học bấm "Chạy".
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v314.0.8/full/';
  let pyPromise: Promise<any> | null = null;
  function getPy(): Promise<any> {
    if (!pyPromise) {
      pyPromise = import(/* @vite-ignore */ `${PYODIDE}pyodide.mjs`).then((m) => m.loadPyodide({ indexURL: PYODIDE }));
      pyPromise.catch(() => (pyPromise = null));
    }
    return pyPromise;
  }
</script>

<script lang="ts">
  /** Ô mã Python chạy ngay trên trình duyệt bằng Pyodide. Người học có thể sửa mã. */
  let { code, packages = ['numpy'], title = 'Python' }: { code: string; packages?: string[]; title?: string } = $props();

  let src = $state('');
  let out = $state('');
  let status = $state<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle');
  $effect.pre(() => { if (!src) src = code.trim(); });

  async function run() {
    out = '';
    try {
      status = 'loading';
      const py = await getPy();
      await py.loadPackage(packages);
      status = 'running';
      const lines: string[] = [];
      py.setStdout({ batched: (s: string) => lines.push(s) });
      py.setStderr({ batched: (s: string) => lines.push(s) });
      const result = await py.runPythonAsync(src);
      if (result !== undefined && result !== null) lines.push(String(result));
      out = lines.join('\n') || '(không có kết quả in ra)';
      status = 'done';
    } catch (e: any) {
      out = String(e?.message ?? e);
      status = 'error';
    }
  }
  const rows = $derived(Math.min(24, src.split('\n').length + 1));
</script>

<div class="cell">
  <div class="top">
    <span class="t">{title}</span>
    <span class="act">
      <button class="btn" type="button" onclick={() => { src = code.trim(); out = ''; status = 'idle'; }}>Khôi phục</button>
      <button class="btn primary" type="button" onclick={run} disabled={status === 'loading' || status === 'running'}>
        {status === 'loading' ? 'Đang tải Python…' : status === 'running' ? 'Đang chạy…' : '▶ Chạy'}
      </button>
    </span>
  </div>
  <textarea bind:value={src} {rows} wrap="off" spellcheck="false" aria-label="Mã Python, có thể sửa"></textarea>
  {#if status === 'loading'}<p class="hint">Lần đầu cần tải khoảng 10–30 MB (Python + thư viện). Các lần sau sẽ nhanh.</p>{/if}
  {#if out}<pre class:err={status === 'error'}>{out}</pre>{/if}
</div>

<style>
  .cell { border: 1px solid var(--rule-2); border-radius: 3px; overflow: hidden; margin: 1.25rem 0; background: var(--sheet); }
  .top { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.6rem 0.4rem 0.9rem; border-bottom: 1px solid var(--rule-2); }
  .t { font-family: var(--mono); font-size: 0.78rem; color: var(--pencil); }
  .act { display: flex; gap: 0.4rem; }
  textarea { width: 100%; border: 0; resize: vertical; padding: 0.9rem 1rem; font: 0.82rem/1.65 var(--mono); background: var(--sheet); color: var(--ink); tab-size: 4; display: block; white-space: pre; overflow-x: auto; }
  textarea:focus { outline: none; }
  pre { margin: 0; border: 0; border-top: 1px dashed var(--rule-2); border-radius: 0; font-size: 0.8rem; max-height: 22rem; background: var(--paper); }
  pre.err { color: var(--bad); }
  .hint { font-size: 0.82rem; color: var(--pencil); margin: 0; padding: 0.4rem 1rem; border-top: 1px dashed var(--rule-2); font-style: italic; }
</style>
