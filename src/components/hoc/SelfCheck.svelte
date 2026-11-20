<script lang="ts">
  /**
   * Bước 8: tổng hợp những gì người học đã làm trong bài, tự chấm mức tự tin cho từng mục tiêu,
   * chỉ đường ôn lại mục còn yếu, câu hỏi phản tư, và tải ghi chép về dạng Markdown.
   */
  import { onMount } from 'svelte';
  import { init, get, update, reset } from '../../lib/learn.svelte';
  import { summarize, toMarkdown, CONF_LABELS, CONF_SHORT, type LessonLearn } from '../../lib/learn';

  let { spec, title, labels }: { spec: LessonLearn; title: string; labels: Record<string, string> } = $props();
  onMount(init);
  const st = $derived(get(spec.slug));
  const s = $derived(summarize(spec, st));

  const rate = (i: number, v: number) => update(spec.slug, (x) => { const c = [...x.conf]; c[i] = v; x.conf = c; });
  const setRefl = (i: number, v: string) => update(spec.slug, (x) => { const r = [...x.refl]; r[i] = v; x.refl = r; });

  function download() {
    const blob = new Blob([toMarkdown(title, spec, st)], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ghi-chep-${spec.slug}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function wipe() {
    if (confirm('Xoá toàn bộ dự đoán, số liệu, ghi chép và tự đánh giá của bài này trên trình duyệt này?')) reset(spec.slug);
  }
</script>

<div class="self" data-selfcheck>
  <h3>Bạn đã trải nghiệm những gì</h3>
  <dl class="sum">
    <div><dt>Dự đoán đúng</dt><dd class="num">{s.predRight}/{s.predTotal}</dd>{#if s.predicted < s.predTotal}<span class="sub">đã đoán {s.predicted}</span>{/if}</div>
    <div><dt>Nhiệm vụ đã làm</dt><dd class="num">{s.tasksDone}/{s.tasksTotal}</dd></div>
    <div><dt>Ô số liệu ghi đúng</dt><dd class="num">{s.cellsRight}/{s.cellsTotal}</dd></div>
    <div><dt>Câu đã tự giải thích</dt><dd class="num">{s.explained}/{s.explainTotal}</dd></div>
  </dl>
  {#if s.predTotal && s.predicted === s.predTotal && s.predRight < s.predTotal}
    <p class="muted">Có dự đoán chưa đúng: đó là chỗ trực giác của bạn vừa được điều chỉnh. Hãy ghi lại điều đó ở phần phản tư bên dưới.</p>
  {/if}

  <h3>Tự đánh giá theo mục tiêu</h3>
  <p class="muted">Chấm trung thực — chỉ bạn thấy, lưu trên trình duyệt này.</p>
  <p class="legend">{#each CONF_LABELS as lab, k}<span><b>{k + 1}</b> {lab}</span>{/each}</p>
  <ol class="goals">
    {#each spec.goals as g, i}
      {@const c = st.conf[i] ?? 0}
      <li>
        <p class="gt">{g.text}</p>
        <div class="scale" role="radiogroup" aria-label={`Mức tự tin: ${g.text}`}>
          {#each CONF_LABELS as lab, k}
            <button type="button" role="radio" aria-checked={c === k + 1} class:on={c === k + 1} onclick={() => rate(i, k + 1)} title={lab}>
              <span class="n">{k + 1}</span> {CONF_SHORT[k]}
            </button>
          {/each}
        </div>
      </li>
    {/each}
  </ol>
  {#if s.weak.length}
    <div class="review">
      <p><b>Nên ôn lại:</b></p>
      <ul>{#each s.weak as g}<li><a href={`#${g.see}`}>{labels[g.see] ?? g.see}</a> — {g.text}</li>{/each}</ul>
    </div>
  {:else if s.rated === spec.goals.length}
    <p class="good">Bạn tự tin với mọi mục tiêu. Thử sức với phần Thử thách bên dưới để kiểm chứng.</p>
  {/if}

  <h3>Phản tư</h3>
  {#each spec.reflect as q, i}
    <label class="rq"><span>{q}</span>
      <textarea rows="2" value={st.refl[i] ?? ''} oninput={(e) => setRefl(i, e.currentTarget.value)}></textarea>
    </label>
  {/each}
  <p class="row">
    <button type="button" class="btn primary" onclick={download}>Tải ghi chép (.md)</button>
    <button type="button" class="btn" onclick={wipe}>Xoá ghi chép của bài này</button>
  </p>
  <p class="muted small">Ghi chép gồm dự đoán, số liệu, lời tự giải thích, tự đánh giá và phản tư — có thể nộp cho giáo viên. Dữ liệu chỉ nằm trên trình duyệt này; xoá dữ liệu trang web sẽ mất.</p>
</div>

<style>
  .self { margin: 1rem 0; }
  h3 { margin-top: 1.8rem; }
  .sum { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.6rem; margin: 0.6rem 0; }
  .sum div { border: 1px solid var(--rule-2); border-radius: 3px; padding: 0.5rem 0.7rem; background: var(--sheet); }
  .sum dt { font-size: 0.8rem; color: var(--pencil); }
  .sum dd { margin: 0.1rem 0 0; font-size: 1.3rem; }
  .sub { font-size: 0.75rem; color: var(--faint); }
  .muted { color: var(--pencil); font-size: 0.92rem; }
  .small { font-size: 0.82rem; }
  .good { color: var(--ok); font-size: 0.95rem; }
  .goals { padding-left: 1.3rem; }
  .goals li { margin: 0 0 1rem; }
  .gt { margin: 0 0 0.35rem; }
  .scale { display: grid; grid-template-columns: repeat(4, max-content); gap: 0.3rem; }
  @media (max-width: 560px) { .scale { grid-template-columns: repeat(4, minmax(0, 1fr)); } .scale button { padding: 0.25rem 0.2rem; font-size: 0.78rem; } }
  .scale button { border: 1px solid var(--rule-2); background: var(--sheet); color: var(--pencil); border-radius: 3px; padding: 0.25rem 0.55rem; font-size: 0.82rem; cursor: pointer; }
  .scale button:hover { border-color: var(--tim); color: var(--ink); }
  .scale button.on { border-color: var(--tim); background: var(--tim-soft); color: var(--ink); font-weight: 600; }
  .scale .n { font-family: var(--mono); }
  .legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.1rem 1rem; font-size: 0.82rem; color: var(--pencil); margin: -0.4rem 0 0.8rem; }
  .legend b { font-family: var(--mono); color: var(--tim); }
  .review { border-left: 3px solid var(--c-L); padding: 0.2rem 0 0.2rem 1rem; margin: 0.8rem 0; }
  .review p { margin: 0 0 0.3rem; }
  .review ul { margin: 0; }
  .rq { display: block; margin: 0.8rem 0; }
  .rq span { display: block; font-weight: 600; font-size: 0.95rem; margin-bottom: 0.3rem; }
  textarea { width: 100%; box-sizing: border-box; font: 0.95rem/1.55 var(--serif); padding: 0.5rem 0.7rem; border: 1px solid var(--rule-2); border-radius: 3px; background: var(--sheet); color: var(--ink); resize: vertical; }
  .row { display: flex; flex-wrap: wrap; gap: 0.6rem; margin: 1rem 0 0.4rem; }
</style>
