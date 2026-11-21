<script lang="ts">
  /**
   * Trình phát bài giảng: các cảnh mô phỏng chạy theo lời đọc, kèm phụ đề, chương và bản chép lời.
   *
   *   <Lazy client:visible view="giang/Lecture" data={{ lecture: `${base}/giang/<slug>/kich-ban.json` }}
   *         props={{ slug, audio, timing, vtt }} />
   *
   * Đồng hồ là thời điểm của tệp âm thanh; mọi thứ trên màn hình là hàm của thời điểm đó (timeline.ts),
   * nên tua, nhảy chương hay đổi tốc độ đều cho đúng hình. Chưa có âm thanh khớp kịch bản thì chạy
   * theo đồng hồ nội bộ, chỉ có phụ đề.
   */
  import { onMount, type Component } from 'svelte';
  import { fade } from 'svelte/transition';
  import { makeTimeline, locate, chapterAt, sceneState, clock, type Timeline } from '../../lib/giang/timeline';
  import type { BuiltLecture, Timing } from '../../lib/giang/types';

  let { lecture, slug, audio, timing, vtt }: { lecture: BuiltLecture; slug: string; audio: string; timing: string; vtt: string } = $props();

  const views = import.meta.glob<{ default: Component<any> }>('./scenes/**/*.svelte');
  let comps = $state<Record<string, Component<any>>>({});
  let tl = $state<Timeline>(makeTimeline(lecture, null));
  let t = $state(0);
  let playing = $state(false);
  let started = $state(false);
  let rate = $state(1);
  let cc = $state(true);
  let showText = $state(false);
  let reduced = $state(false);
  let stageW = $state(960);
  let el = $state<HTMLAudioElement>();
  let root = $state<HTMLDivElement>();
  let full = $state(false);
  let error = $state('');

  const KEY = `s2s-giang-${slug}`;
  const idx = $derived(locate(tl, t));
  const cue = $derived(tl.cues[idx]);
  const chap = $derived(cue ? lecture.chapters[cue.ch] : undefined);
  const scene = $derived(chap && cue ? chap.scenes[cue.sc] : undefined);
  const state = $derived(scene && cue ? sceneState(scene, cue.ln, t - cue.start, cue.end - cue.start, reduced) : {});
  const View = $derived(scene ? comps[scene.view] : undefined);
  const ci = $derived(chapterAt(tl, t));
  const k = $derived(stageW / 960);

  onMount(() => {
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) { rate = saved.rate ?? 1; cc = saved.cc ?? true; }
      if (saved?.t) t = saved.t;
    } catch {}
    const need = [...new Set(lecture.chapters.flatMap((c) => c.scenes.map((s) => s.view)))];
    Promise.all(need.map(async (v) => {
      const imp = views[`./scenes/${v}.svelte`];
      if (!imp) throw new Error(`Không có cảnh "${v}"`);
      return [v, (await imp()).default] as const;
    })).then((list) => (comps = Object.fromEntries(list))).catch((e) => (error = String(e?.message ?? e)));
    fetch(timing).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((tm: Timing | null) => {
      tl = makeTimeline(lecture, tm);
      if (t >= tl.total - 2) t = 0;
    });
    const onFs = () => (full = document.fullscreenElement === root);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  });

  // Lưu vị trí, tốc độ, phụ đề (mỗi khi dừng hoặc đổi cài đặt)
  $effect(() => {
    const v = { t: playing ? undefined : t, rate, cc };
    try { localStorage.setItem(KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(KEY) || '{}'), ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined)) })); } catch {}
  });

  $effect(() => { if (el) el.playbackRate = rate; });

  // Đồng hồ
  $effect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      if (tl.audio && el && !el.paused) t = el.currentTime;
      else if (!tl.audio) t = Math.min(tl.total, t + ((now - last) / 1000) * rate);
      last = now;
      if (t >= tl.total - 0.05) { playing = false; el?.pause(); t = tl.total; return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  async function play() {
    if (t >= tl.total - 0.1) seek(0);
    started = true;
    playing = true;
    if (tl.audio && el) {
      try {
        if (el.readyState < 1) {
          await new Promise<void>((res, rej) => {
            el!.addEventListener('loadedmetadata', () => res(), { once: true });
            el!.addEventListener('error', () => rej(new Error('audio')), { once: true });
            el!.load();
          });
        }
        el.currentTime = t;
        el.playbackRate = rate;
        await el.play();
      } catch {
        // Không phát được âm thanh: chạy tiếp bằng phụ đề
        tl = { ...tl, audio: false };
      }
    }
  }
  function pause() { playing = false; el?.pause(); }
  const toggle = () => (playing ? pause() : play());
  function seek(v: number) {
    t = Math.max(0, Math.min(tl.total, v));
    if (tl.audio && el && el.readyState >= 1) el.currentTime = t;
  }
  function seekCue(i: number) { seek(tl.cues[i].start + 0.01); }
  function fs() {
    if (document.fullscreenElement) document.exitFullscreen();
    else root?.requestFullscreen?.().catch(() => {});
  }
  function onkey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'k') { if (tag === 'BUTTON' && e.key === ' ') return; toggle(); e.preventDefault(); }
    else if (e.key === 'ArrowRight' && tag !== 'INPUT') { seek(t + 5); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' && tag !== 'INPUT') { seek(t - 5); e.preventDefault(); }
    else if (e.key === 'c') cc = !cc;
    else if (e.key === 'f') fs();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="player" class:full bind:this={root} onkeydown={onkey} tabindex="0" role="region" aria-label="Bài giảng có lời">
  <div class="stage" bind:clientWidth={stageW} style:height={full ? undefined : `${stageW * 9 / 16}px`}>
    <div class="canvas" style:transform={`scale(${k})`}>
      {#if error}
        <p class="err">{error}</p>
      {:else if View && scene && cue}
        {#key `${cue.ch}-${cue.sc}`}
          <div class="scene" in:fade={{ duration: reduced ? 0 : 280 }}>
            <View {...scene.props} s={state} />
          </div>
        {/key}
      {/if}
      {#if chap}<p class="chap hand">{ci + 1}. {chap.title}</p>{/if}
    </div>
    {#if !started}
      <button class="big" type="button" onclick={play} aria-label="Phát bài giảng">
        <span class="tri">▶</span>
        <span class="bl">{t > 1 ? `Xem tiếp từ ${clock(t)}` : 'Xem bài giảng'}<small>{clock(tl.total)} · có phụ đề</small></span>
      </button>
    {/if}
    {#if cc && cue && started}
      <p class="cap" aria-hidden="true"><span>{cue.cap}</span></p>
    {/if}
  </div>

  <div class="bar">
    <button class="btn primary play" type="button" onclick={toggle} aria-label={playing ? 'Dừng' : 'Phát'}>{playing ? '⏸' : '▶'}</button>
    <span class="time num">{clock(t)} / {clock(tl.total)}</span>
    <div class="seek">
      <input type="range" min="0" max={tl.total} step="0.1" value={t} oninput={(e) => seek(+e.currentTarget.value)} aria-label="Tua bài giảng" />
      <div class="ticks" aria-hidden="true">{#each tl.chapters.slice(1) as c}<i style:left={`${(c.start / tl.total) * 100}%`}></i>{/each}</div>
    </div>
    <label class="spd">
      <span class="sr">Tốc độ</span>
      <select bind:value={rate} aria-label="Tốc độ phát">
        <option value={0.75}>0,75×</option><option value={1}>1×</option><option value={1.25}>1,25×</option><option value={1.5}>1,5×</option>
      </select>
    </label>
    <button class="btn" class:on={cc} type="button" onclick={() => (cc = !cc)} aria-pressed={cc} title="Phụ đề (phím C)">CC</button>
    <button class="btn" class:on={showText} type="button" onclick={() => (showText = !showText)} aria-pressed={showText}>Chép lời</button>
    <button class="btn" type="button" onclick={fs} title="Toàn màn hình (phím F)" aria-label="Toàn màn hình">⛶</button>
  </div>

  {#if !tl.audio}
    <p class="note">Bản này chưa có giọng đọc khớp với kịch bản. Bài giảng chạy theo phụ đề.</p>
  {/if}

  <ol class="chapters">
    {#each tl.chapters as c, i}
      <li class:on={i === ci}>
        <button type="button" onclick={() => { seek(c.start + 0.01); if (!started) play(); }}>
          <span class="no">{i + 1}</span> {c.title} <span class="num tm">{clock(c.start)}</span>
        </button>
        <a href={`#${c.section}`} title="Tới bước này trong bài">↓ trong bài</a>
      </li>
    {/each}
  </ol>

  {#if showText}
    <div class="transcript">
      {#each tl.chapters as c, i}
        <h4>{i + 1}. {c.title}</h4>
        <p>
          {#each tl.cues as q, j}{#if q.ch === i}<button type="button" class:on={j === idx} onclick={() => seekCue(j)}>{q.cap}</button>{' '}{/if}{/each}
        </p>
      {/each}
      <p class="dl"><a href={vtt} download>Tải phụ đề (.vtt)</a></p>
    </div>
  {/if}

  {#if tl.audio}<audio bind:this={el} src={audio} preload="none" onended={() => (playing = false)}></audio>{/if}
</div>

<style>
  .player { margin: 1rem 0 0; outline: none; }
  .player:focus-visible { outline: 2px solid var(--tim); outline-offset: 4px; }
  .stage {
    position: relative; overflow: hidden; border: 1.5px solid var(--ink); border-radius: 4px;
    background-color: var(--paper);
    background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .stage::before { content: ''; position: absolute; top: 0; bottom: 0; left: 6.8%; border-left: 1.5px solid var(--le); opacity: 0.55; }
  .canvas { position: absolute; left: 0; top: 0; width: 960px; height: 540px; transform-origin: 0 0; font-family: var(--serif); color: var(--ink); }
  .scene { position: absolute; inset: 0; }
  .chap { position: absolute; left: 16px; top: 8px; margin: 0; font-family: var(--hand); color: var(--tim); font-size: 21px; opacity: 0.8; }
  .err { padding: 40px 150px; color: var(--bad); font-size: 24px; }
  .big {
    position: absolute; inset: 0; margin: auto; width: fit-content; height: fit-content; display: flex; gap: 0.9rem; align-items: center;
    background: var(--sheet); border: 1.5px solid var(--ink); border-radius: 6px; padding: 0.8rem 1.4rem 0.8rem 1rem; cursor: pointer;
    font: inherit; color: var(--ink); box-shadow: 0 6px 24px rgb(0 0 0 / 0.12);
  }
  .big:hover { border-color: var(--tim); }
  .big .tri { display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: 50%; background: var(--tim); color: var(--paper); font-size: 1.3rem; padding-left: 0.2rem; }
  .big .bl { display: flex; flex-direction: column; text-align: left; font-weight: 650; font-size: 1.05rem; }
  .big small { font-weight: 400; color: var(--pencil); font-size: 0.85rem; }
  .cap { position: absolute; left: 0; right: 0; bottom: 3.5%; margin: 0 auto; text-align: center; padding: 0 6%; pointer-events: none; }
  .cap span {
    display: inline; background: rgb(20 22 32 / 0.84); color: #fff; padding: 0.15em 0.5em; border-radius: 3px;
    font-size: clamp(0.82rem, 2.1cqw, 1.45rem); line-height: 1.55; box-decoration-break: clone; -webkit-box-decoration-break: clone;
  }
  .stage { container-type: inline-size; }
  @container (max-width: 560px) { .cap { bottom: 2%; padding: 0 3%; } }
  .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.7rem; margin-top: 0.6rem; font-size: 0.88rem; }
  .bar .play { min-width: 2.6rem; }
  .bar .on { background: var(--tim-soft); border-color: var(--tim); color: var(--tim); }
  .time { color: var(--pencil); min-width: 6.5rem; }
  .seek { position: relative; flex: 1 1 12rem; display: flex; align-items: center; }
  .seek input { width: 100%; }
  .ticks { position: absolute; inset: 0; pointer-events: none; }
  .ticks i { position: absolute; top: 50%; width: 2px; height: 12px; margin-top: -6px; background: var(--le); opacity: 0.7; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .note { font-size: 0.85rem; color: var(--pencil); font-style: italic; margin: 0.4rem 0 0; }
  .chapters { list-style: none; padding: 0; margin: 0.8rem 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0.15rem 1rem; font-size: 0.88rem; }
  .chapters li { display: flex; align-items: baseline; gap: 0.4rem; border-bottom: 1px dashed var(--rule); }
  .chapters button { flex: 1; text-align: left; background: none; border: 0; padding: 0.3rem 0; font: inherit; color: var(--ink); cursor: pointer; }
  .chapters button:hover { color: var(--tim); }
  .chapters .no { font-family: var(--hand); color: var(--tim); font-size: 1.05rem; margin-right: 0.15rem; }
  .chapters .tm { color: var(--faint); font-size: 0.8rem; margin-left: 0.3rem; }
  .chapters li.on button { font-weight: 650; }
  .chapters a { font-size: 0.78rem; color: var(--pencil); white-space: nowrap; }
  .transcript { margin-top: 0.8rem; max-height: 22rem; overflow-y: auto; border: 1px solid var(--rule-2); border-radius: 3px; padding: 0.4rem 1rem 0.8rem; background: var(--sheet); font-size: 0.93rem; line-height: 1.65; }
  .transcript h4 { margin: 0.8rem 0 0.2rem; font-size: 0.95rem; }
  .transcript button { display: inline; background: none; border: 0; padding: 0; font: inherit; color: var(--ink); cursor: pointer; text-align: left; }
  .transcript button:hover { color: var(--tim); }
  .transcript button.on { background: var(--hl); }
  .dl { font-size: 0.85rem; }
  .player.full { background: var(--paper); display: flex; flex-direction: column; justify-content: center; padding: 1rem; overflow: auto; }
  .player.full .stage { width: min(100%, calc((100vh - 6rem) * 16 / 9)); aspect-ratio: 16 / 9; margin: 0 auto; }
  .player.full .bar { width: min(100%, calc((100vh - 6rem) * 16 / 9)); margin: 0.6rem auto 0; }
  .player.full .chapters, .player.full .transcript, .player.full .note { display: none; }
</style>
