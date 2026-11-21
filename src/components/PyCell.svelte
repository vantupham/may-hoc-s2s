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
  /**
   * Ô mã Python chạy ngay trên trình duyệt bằng Pyodide. Người học có thể sửa mã.
   * Có số dòng và tô màu cú pháp: một lớp <pre> đã tô màu nằm dưới textarea trong suốt,
   * hai lớp cùng phông, cùng lề, và cuộn theo nhau.
   * Lớp tô màu nằm TRÊN textarea (không nhận chuột) để vùng bôi chọn của textarea hiện dưới chữ,
   * không che mất chữ. Chiều cao do riêng textarea quyết định; cột số dòng và lớp tô màu
   * chừa đúng chỗ cho thanh cuộn của textarea để cuộn khớp đến dòng cuối.
   */
  import { highlightPython } from '../lib/pyhl';
  let { code, packages = ['numpy'], title = 'Python' }: { code: string; packages?: string[]; title?: string } = $props();

  // Khởi tạo ngay bằng mã gốc (không chờ effect) để HTML dựng sẵn trên máy chủ đã có mã tô màu,
  // vì Svelte không sửa lại nội dung {@html} lệch khi hydrate.
  // svelte-ignore state_referenced_locally
  let src = $state(code.trim());
  let out = $state('');
  let status = $state<'idle' | 'loading' | 'running' | 'done' | 'error'>('idle');

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
  const nLines = $derived(src.split('\n').length);
  const rows = $derived(Math.min(24, nLines + 1));
  const html = $derived(highlightPython(src) + '\n');
  const digits = $derived(String(nLines).length);
  let hl: HTMLPreElement | undefined = $state();
  let gutter: HTMLPreElement | undefined = $state();
  let ta: HTMLTextAreaElement | undefined = $state();
  // Bề dày thanh cuộn của textarea (0 với thanh cuộn nổi kiểu macOS)
  let sbW = $state(0), sbH = $state(0);
  function measure() {
    if (!ta) return;
    sbW = ta.offsetWidth - ta.clientWidth;
    sbH = ta.offsetHeight - ta.clientHeight;
  }
  function sync() {
    if (!ta) return;
    if (hl) { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }
    if (gutter) gutter.scrollTop = ta.scrollTop;
  }
  $effect(() => {
    if (!ta) return;
    const ro = new ResizeObserver(() => { measure(); sync(); });
    ro.observe(ta);
    return () => ro.disconnect();
  });
  // Nội dung đổi (gõ, Khôi phục) có thể làm thanh cuộn hiện/ẩn
  $effect(() => {
    void html;
    requestAnimationFrame(() => { measure(); sync(); });
  });
  // Tab chèn 4 dấu cách thay vì nhảy sang nút khác; Esc rồi Tab để rời ô mã
  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    const t = e.currentTarget as HTMLTextAreaElement;
    const a = t.selectionStart, b = t.selectionEnd;
    src = src.slice(0, a) + '    ' + src.slice(b);
    requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = a + 4; });
  }
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
  <div class="editor">
    <div class="gutter" style:width={`calc(${digits}ch + 1.3rem)`}>
      <pre bind:this={gutter} style:bottom={`${sbH}px`} aria-hidden="true">{Array.from({ length: nLines }, (_, i) => i + 1).join('\n')}</pre>
    </div>
    <div class="code">
      <textarea bind:this={ta} bind:value={src} {rows} wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off"
        aria-label="Mã Python, có thể sửa" onscroll={sync} onkeydown={onKey}></textarea>
      <pre class="hl" bind:this={hl} style:right={`${sbW}px`} style:bottom={`${sbH}px`} aria-hidden="true"><code>{@html html}</code></pre>
    </div>
  </div>
  {#if status === 'loading'}<p class="hint">Lần đầu cần tải khoảng 10–30 MB (Python + thư viện). Các lần sau sẽ nhanh.</p>{/if}
  {#if out}<pre class="out" class:err={status === 'error'}>{out}</pre>{/if}
</div>

<style>
  .cell { border: 1px solid var(--rule-2); border-radius: 3px; overflow: hidden; margin: 1.25rem 0; background: var(--sheet); }
  .top { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.6rem 0.4rem 0.9rem; border-bottom: 1px solid var(--rule-2); }
  .t { font-family: var(--mono); font-size: 0.78rem; color: var(--pencil); }
  .act { display: flex; gap: 0.4rem; }
  .editor { display: flex; font: 0.82rem/1.65 var(--mono); background: var(--sheet); }
  .gutter pre, .hl, textarea { font: inherit; tab-size: 4; padding-top: 0.9rem; padding-bottom: 0.9rem; margin: 0; }
  /* Cột số dòng: nội dung nằm tuyệt đối nên không kéo dài khung khi mã dài hơn số hàng của textarea */
  .gutter { flex: none; position: relative; min-width: 2.2rem; background: var(--paper); border-right: 1px solid var(--rule); }
  .gutter pre { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; text-align: right; color: var(--faint); background: transparent; border: 0; border-radius: 0; padding-left: 0.7rem; padding-right: 0.6rem; user-select: none; box-sizing: border-box; white-space: pre; }
  .code { position: relative; flex: 1; min-width: 0; }
  .hl { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1; overflow: hidden; pointer-events: none; border: 0; border-radius: 0; background: transparent; color: var(--ink); padding-left: 0.9rem; padding-right: 1rem; white-space: pre; }
  .hl code { font: inherit; background: none; padding: 0; color: inherit; }
  textarea { position: relative; width: 100%; box-sizing: border-box; border: 0; resize: vertical; padding-left: 0.9rem; padding-right: 1rem; background: transparent; color: transparent; -webkit-text-fill-color: transparent; caret-color: var(--ink); display: block; white-space: pre; overflow: auto; }
  /* Vùng chọn vẽ dưới lớp chữ tô màu; màu sáng/tối theo giao diện */
  textarea::selection { background: var(--sel); color: transparent; -webkit-text-fill-color: transparent; }
  .cell { --sel: color-mix(in srgb, var(--tim) 28%, transparent); }
  textarea:focus { outline: none; }
  .cell:focus-within { border-color: var(--tim); }
  pre.out { margin: 0; border: 0; border-top: 1px dashed var(--rule-2); border-radius: 0; font-size: 0.8rem; max-height: 22rem; background: var(--paper); }
  pre.out.err { color: var(--bad); }
  .hint { font-size: 0.82rem; color: var(--pencil); margin: 0; padding: 0.4rem 1rem; border-top: 1px dashed var(--rule-2); font-style: italic; }
</style>
