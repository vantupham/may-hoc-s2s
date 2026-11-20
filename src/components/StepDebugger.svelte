<script lang="ts">
  /**
   * Trình gỡ lỗi từng bước: chạy, dừng, lùi, tiến qua các bước của một trace.
   * Phím tắt khi đang chọn: ← → để lùi/tiến, Space để chạy/dừng.
   */
  let {
    count,
    current = $bindable(0),
    interval = 700,
    label = 'Vòng lặp',
  }: { count: number; current?: number; interval?: number; label?: string } = $props();

  let playing = $state(false);
  let speed = $state(1);

  $effect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      if (current >= count - 1) playing = false;
      else current += 1;
    }, interval / speed);
    return () => clearInterval(t);
  });

  $effect(() => {
    if (current > count - 1) current = Math.max(0, count - 1);
  });

  function toggle() {
    if (!playing && current >= count - 1) current = 0;
    playing = !playing;
  }
  function onkey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { current = Math.min(count - 1, current + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { current = Math.max(0, current - 1); e.preventDefault(); }
    else if (e.key === ' ') { toggle(); e.preventDefault(); }
  }
</script>

<div class="dbg" role="toolbar" aria-label="Điều khiển từng bước" tabindex="0" onkeydown={onkey}>
  <div class="buttons">
    <button class="btn" type="button" onclick={() => { playing = false; current = 0; }} title="Về bước đầu" aria-label="Về bước đầu">⏮</button>
    <button class="btn" type="button" onclick={() => { playing = false; current = Math.max(0, current - 1); }} disabled={current === 0} title="Lùi một bước" aria-label="Lùi một bước">◀</button>
    <button class="btn primary play" type="button" onclick={toggle} aria-label={playing ? 'Dừng' : 'Chạy'}>{playing ? '⏸ Dừng' : '▶ Chạy'}</button>
    <button class="btn" type="button" onclick={() => { playing = false; current = Math.min(count - 1, current + 1); }} disabled={current >= count - 1} title="Tiến một bước" aria-label="Tiến một bước">▶</button>
    <button class="btn" type="button" onclick={() => { playing = false; current = count - 1; }} title="Đến bước cuối" aria-label="Đến bước cuối">⏭</button>
  </div>
  <input type="range" min="0" max={Math.max(0, count - 1)} step="1" bind:value={current} aria-label="Chọn bước" oninput={() => (playing = false)} />
  <span class="pos num">{label} <b>{current + 1}</b> / {count}</span>
  <label class="spd">Tốc độ
    <select bind:value={speed} aria-label="Tốc độ chạy">
      <option value={0.5}>0,5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
    </select>
  </label>
</div>

<style>
  .dbg { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1.1rem; padding: 0.8rem 0 0; border-top: 1px dashed var(--rule-2); margin: 1rem 0 0; font-size: 0.88rem; }
  .dbg:focus-visible { outline: 2px solid var(--tim); outline-offset: 4px; }
  .buttons { display: flex; gap: 0.25rem; }
  .buttons :global(.btn) { padding: 0.28rem 0.6rem; }
  .play { min-width: 5.6rem; justify-content: center; }
  input[type='range'] { flex: 1; min-width: 8rem; }
  .pos { color: var(--pencil); font-size: 0.82rem; }
  .spd { display: flex; gap: 0.35rem; align-items: center; color: var(--pencil); }
</style>
