<script lang="ts">
  /** Tích chập từng ô: trượt cửa sổ 3×3 trên ảnh 28×28, nhân từng cặp số, cộng lại. */
  import DigitImg from '../DigitImg.svelte';
  import CalcCard from '../CalcCard.svelte';
  import { decodeImage, conv2d, relu, convCellCalc, fmt } from '../../lib/ml-core';

  interface Img { y: number; b64: string }
  let { images, names, Wc, bc }: { images: Img[]; names: string[]; Wc: number[][][]; bc: number[] } = $props();
  const handmade = [
    { name: 'Cạnh dọc (tự đặt)', k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], b: 0 },
    { name: 'Cạnh ngang (tự đặt)', k: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], b: 0 },
    { name: 'Làm mờ (tự đặt)', k: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]], b: 0 },
  ];
  const filters = $derived([...handmade, ...Wc.map((k, f) => ({ name: `Bộ lọc học được ${f + 1}`, k, b: bc[f] }))]);
  let ii = $state(0);
  let fi = $state(3);
  let r = $state(10);
  let c = $state(10);
  const img = $derived(decodeImage(images[ii].b64));
  const flt = $derived(filters[fi]);
  const map = $derived(relu(conv2d(img, 28, flt.k, flt.b)));
  const calc = $derived(convCellCalc(img, flt.k, flt.b, r, c));
  const S = 252; // kích thước ảnh lớn
  const cell = S / 28;
  const ocell = S / 26;
  function pickOut(e: MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    c = Math.max(0, Math.min(25, Math.floor(((e.clientX - rect.left) / rect.width) * 26)));
    r = Math.max(0, Math.min(25, Math.floor(((e.clientY - rect.top) / rect.height) * 26)));
  }
</script>

<div class="lab">
  <p class="lab-title">Một bộ lọc 3×3 trượt qua ảnh</p>
  <p class="lab-hint">Chọn ảnh và bộ lọc. Di chuột trên bản đồ đặc trưng bên phải (hoặc dùng thanh trượt) để chọn một ô; khung tím trên ảnh gốc là 9 điểm ảnh tạo ra ô đó. Ba bộ lọc đầu do con người đặt; sáu bộ sau do mạng tự học.</p>
  <div class="thumbs">
    {#each images.slice(0, 12) as im, i}
      <button type="button" class="th" class:sel={i === ii} onclick={() => (ii = i)} aria-label={`Ảnh ${i + 1}: ${names[im.y]}`}><DigitImg px={decodeImage(im.b64)} side={28} max={1} size={42} label={names[im.y]} /></button>
    {/each}
  </div>
  <div class="ctrl">
    <label>Bộ lọc
      <select bind:value={fi} aria-label="Bộ lọc">{#each filters as f, k}<option value={k}>{f.name}</option>{/each}</select>
    </label>
    <label>Hàng <span class="num">{r}</span><input type="range" min="0" max="25" bind:value={r} style="width:6rem" aria-label="Hàng" /></label>
    <label>Cột <span class="num">{c}</span><input type="range" min="0" max="25" bind:value={c} style="width:6rem" aria-label="Cột" /></label>
  </div>
  <div class="row">
    <figure>
      <div class="big" style={`width:${S}px;height:${S}px`}>
        <DigitImg px={img} side={28} max={1} size={S} label={`Ảnh gốc: ${names[images[ii].y]}`} />
        <div class="win" style={`left:${c * cell}px;top:${r * cell}px;width:${3 * cell}px;height:${3 * cell}px`}></div>
      </div>
      <figcaption>Ảnh gốc 28×28: {names[images[ii].y]}</figcaption>
    </figure>
    <div class="mid">
      <p class="h">Cửa sổ 3×3</p>
      <table class="mini"><tbody>{#each [0, 1, 2] as i}<tr>{#each [0, 1, 2] as j}<td>{fmt(img[(r + i) * 28 + c + j], 2)}</td>{/each}</tr>{/each}</tbody></table>
      <p class="op">×</p>
      <p class="h">Bộ lọc</p>
      <table class="mini k"><tbody>{#each flt.k as row}<tr>{#each row as v}<td style={`color:var(${v >= 0 ? '--c-pos' : '--c-neg'})`}>{fmt(v, 2)}</td>{/each}</tr>{/each}</tbody></table>
      <p class="op">= <b class="num">{fmt(Math.max(0, calc.value), 3)}</b></p>
    </div>
    <figure>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="big" style={`width:${S}px;height:${S}px;cursor:crosshair`} onmousemove={pickOut} onclick={pickOut} onkeydown={() => {}}>
        <DigitImg px={map} side={26} max={Math.max(1e-9, ...map)} size={S} label="Bản đồ đặc trưng sau ReLU" />
        <div class="win out" style={`left:${c * ocell}px;top:${r * ocell}px;width:${ocell}px;height:${ocell}px`}></div>
      </div>
      <figcaption>Bản đồ đặc trưng 26×26 (sau ReLU)</figcaption>
    </figure>
  </div>
  <CalcCard {calc} digits={3} />
</div>

<style>
  .thumbs { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.6rem; }
  .th { padding: 2px; border: 2px solid transparent; background: none; cursor: pointer; border-radius: 2px; }
  .th.sel { border-color: var(--tim); }
  .row { display: flex; flex-wrap: wrap; gap: 1.2rem; align-items: flex-start; margin-bottom: 1rem; }
  figure { margin: 0; }
  figcaption { font-size: 0.82rem; color: var(--pencil); margin-top: 0.3rem; }
  .big { position: relative; }
  .win { position: absolute; border: 2.5px solid var(--tim); box-shadow: 0 0 0 1px var(--sheet); pointer-events: none; }
  .win.out { border-width: 2px; }
  .mid { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
  .h { font-weight: 700; font-size: 0.85rem; margin: 0; }
  .mini { border-collapse: collapse; font: 0.74rem var(--mono); }
  .mini td { border: 1px solid var(--rule-2); padding: 0.2rem 0.35rem; text-align: right; }
  .op { margin: 0.1rem 0; font-size: 1.1rem; }
</style>
