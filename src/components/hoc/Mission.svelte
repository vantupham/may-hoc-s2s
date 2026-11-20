<script lang="ts">
  /** Đặt ngay trước một lab: câu dự đoán (khoá lại sau khi chọn) và danh sách nhiệm vụ có ô tích. */
  import { onMount } from 'svelte';
  import { init, get, update } from '../../lib/learn.svelte';
  import type { Mission } from '../../lib/learn';

  let { slug, m }: { slug: string; m: Mission } = $props();
  onMount(init);
  const st = $derived(get(slug));
  const picked = $derived(st.pred[m.id]);
  const done = $derived(st.tasks[m.id] ?? []);
  const nDone = $derived(m.tasks.filter((_, i) => done[i]).length);

  const pick = (j: number) => update(slug, (s) => { s.pred[m.id] = j; });
  const toggle = (i: number, v: boolean) => update(slug, (s) => {
    const t = [...(s.tasks[m.id] ?? [])];
    t[i] = v;
    s.tasks[m.id] = t;
  });
</script>

<div class="mission" data-mission={m.id}>
  <p class="tag hand">Trải nghiệm</p>
  <p class="title">{m.title}</p>
  {#if m.predict}
    <div class="pred">
      <p class="q"><b>① Dự đoán trước khi thử.</b> {m.predict.q}</p>
      <div class="opts" role="radiogroup" aria-label="Dự đoán">
        {#each m.predict.options as opt, j}
          <button type="button" class="opt" class:on={picked === j} role="radio" aria-checked={picked === j}
            disabled={picked !== undefined} onclick={() => pick(j)}>{opt}</button>
        {/each}
      </div>
      {#if picked !== undefined}
        <p class="locked">Đã ghi lại dự đoán. Giờ hãy làm các nhiệm vụ bên dưới, rồi đối chiếu ở cuối lab.</p>
      {/if}
    </div>
  {/if}
  <p class="q"><b>{m.predict ? '②' : '①'} Nhiệm vụ.</b> <span class="cnt">{nDone}/{m.tasks.length} đã làm</span></p>
  <ol class="tasks">
    {#each m.tasks as t, i}
      <li><label><input type="checkbox" checked={!!done[i]} onchange={(e) => toggle(i, e.currentTarget.checked)} /> <span class:struck={done[i]}>{@html t}</span></label></li>
    {/each}
  </ol>
</div>

<style>
  .mission { border-left: 3px solid var(--tim); background: var(--tim-soft); padding: 0.9rem 1.1rem 0.7rem; margin: 1.6rem 0 0.4rem; border-radius: 0 3px 3px 0; }
  .tag { margin: 0; font-size: 1.15rem; }
  .title { font-weight: 700; margin: 0 0 0.6rem; }
  .q { margin: 0.4rem 0; font-size: 0.97rem; }
  .cnt { color: var(--pencil); font-size: 0.85rem; font-weight: 400; margin-left: 0.3rem; }
  .opts { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.4rem 0 0.2rem; }
  .opt { border: 1px solid var(--rule-2); background: var(--sheet); color: var(--ink); border-radius: 3px; padding: 0.35rem 0.75rem; cursor: pointer; font-size: 0.93rem; }
  .opt:hover:not(:disabled) { border-color: var(--tim); }
  .opt:disabled { cursor: default; opacity: 0.55; }
  .opt.on { opacity: 1; border-color: var(--tim); box-shadow: inset 3px 0 0 var(--tim); font-weight: 600; }
  .locked { font-size: 0.88rem; color: var(--pencil); font-style: italic; margin: 0.3rem 0 0.6rem; }
  .tasks { margin: 0.2rem 0 0.3rem; padding-left: 1.4rem; font-size: 0.95rem; }
  .tasks li { margin: 0.3rem 0; }
  .tasks label { display: flex; gap: 0.5rem; align-items: baseline; cursor: pointer; }
  .struck { color: var(--pencil); }
</style>
