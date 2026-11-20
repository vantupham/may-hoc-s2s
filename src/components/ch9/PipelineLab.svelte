<script lang="ts">
  /** Toàn bộ mạng: ảnh → 6 bản đồ đặc trưng → max-pool → 10 điểm số → xác suất. */
  import DigitImg from '../DigitImg.svelte';
  import { decodeImage, cnnForward, fmt, type CNN } from '../../lib/ml-core';

  interface Img { y: number; b64: string }
  let { net, images, names, testAcc, confusion, nTest }: { net: CNN; images: Img[]; names: string[]; testAcc: number; confusion: number[][]; nTest: number } = $props();
  let ii = $state(0);
  const decoded = $derived(images.map((im) => decodeImage(im.b64)));
  const res = $derived(cnnForward(net, decoded[ii]));
  const shownAcc = $derived(images.filter((im, i) => cnnForward(net, decoded[i]).pred === im.y).length / images.length);
  const order = $derived(res.p.map((p, k) => ({ p, k })).sort((a, b) => b.p - a.p));
</script>

<div class="lab">
  <p class="lab-title">Cả mạng, từ điểm ảnh đến dự đoán</p>
  <p class="lab-hint">Mạng có 6 × 9 + 6 + 1.014 × 10 + 10 = 10.210 tham số, huấn luyện sẵn bằng NumPy trên {fmt(8000, 0)} ảnh (12 epoch). Trình duyệt chạy lại toàn bộ lan truyền xuôi cho ảnh bạn chọn.</p>
  <div class="thumbs">
    {#each images.slice(0, 40) as im, i}
      <button type="button" class="th" class:sel={i === ii} onclick={() => (ii = i)} aria-label={`Ảnh ${i + 1}`}><DigitImg px={decoded[i]} side={28} max={1} size={36} label={names[im.y]} /></button>
    {/each}
  </div>
  <div class="flow">
    <figure class="stage"><DigitImg px={decoded[ii]} side={28} max={1} size={112} label="Ảnh đầu vào" /><figcaption>Đầu vào 28×28<br />{names[images[ii].y]}</figcaption></figure>
    <span class="arr">→</span>
    <div class="stage">
      <div class="maps">{#each res.a as m, f}<DigitImg px={m} side={26} max={Math.max(1e-9, ...m)} size={56} label={`Bản đồ ${f + 1}`} />{/each}</div>
      <p class="cap">6 bản đồ 26×26 sau tích chập và ReLU</p>
    </div>
    <span class="arr">→</span>
    <div class="stage">
      <div class="maps">{#each res.pools as m, f}<DigitImg px={m.out} side={13} max={Math.max(1e-9, ...m.out)} size={42} label={`Bản đồ sau max-pool ${f + 1}`} />{/each}</div>
      <p class="cap">max-pool 2×2: 6 × 13 × 13 = 1.014 số</p>
    </div>
    <span class="arr">→</span>
    <div class="stage probs">
      {#each order as o}
        <div class="pr" class:truth={o.k === images[ii].y}><span class="nm">{names[o.k]}</span><span class="t"><span style={`width:${o.p * 100}%`}></span></span><span class="num">{fmt(o.p * 100, 1)}%</span></div>
      {/each}
    </div>
  </div>
  <p class="verdict">Dự đoán: <b>{names[res.pred]}</b>. Thực tế: <b>{names[images[ii].y]}</b>{res.pred === images[ii].y ? '.' : ' — mạng đoán sai.'}</p>
  <div class="lab-grid">
    <div>
      <p class="h">Ma trận nhầm lẫn trên {fmt(nTest, 0)} ảnh test (tính sẵn bằng NumPy); độ chính xác {fmt(testAcc * 100, 1)}%</p>
      <div class="table-scroll">
        <table class="cmx">
          <thead><tr><th></th>{#each names as _, k}<th>{k}</th>{/each}</tr></thead>
          <tbody>{#each confusion as row, t}<tr><th class="rn">{t} {names[t]}</th>{#each row as v, q}<td style={`background:${v ? `color-mix(in srgb, var(${t === q ? '--ok' : '--bad'}) ${Math.min(85, t === q ? 15 + v / 3 : 8 + v * 2)}%, var(--sheet))` : 'transparent'}`}>{v || ''}</td>{/each}</tr>{/each}</tbody>
        </table>
      </div>
    </div>
    <div>
      <p class="cap">Trên {images.length} ảnh có trong trang, trình duyệt của bạn đoán đúng {fmt(shownAcc * 100, 1)}%. Chỗ nhầm nhiều nhất là giữa áo sơ mi, áo phông, áo len và áo khoác: ở độ phân giải 28×28, chúng có hình dáng gần như giống nhau. Giày, túi và quần thì hiếm khi nhầm.</p>
      <p class="cap">Mạng chỉ có một tầng tích chập. Mạng thật thường xếp chồng hàng chục tầng: tầng đầu bắt cạnh, tầng sau ghép cạnh thành hoạ tiết, tầng sau nữa ghép hoạ tiết thành bộ phận như cổ áo, đế giày.</p>
    </div>
  </div>
</div>

<style>
  .thumbs { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.8rem; }
  .th { padding: 1px; border: 2px solid transparent; background: none; cursor: pointer; }
  .th.sel { border-color: var(--tim); }
  .flow { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
  .stage { margin: 0; }
  .maps { display: grid; grid-template-columns: repeat(3, auto); gap: 4px; }
  .arr { font-size: 1.4rem; color: var(--faint); }
  .cap, figcaption { font-size: 0.82rem; color: var(--pencil); margin: 0.3rem 0 0; }
  .probs { min-width: 15rem; flex: 1; }
  .pr { display: grid; grid-template-columns: 7.5rem 1fr 3rem; gap: 0.4rem; align-items: center; font-size: 0.8rem; }
  .pr.truth .nm { font-weight: 700; }
  .t { height: 8px; background: var(--paper); border: 1px solid var(--rule); }
  .t span { display: block; height: 100%; background: var(--tim); }
  .verdict { margin: 0.8rem 0 1rem; }
  .h { font-weight: 700; font-size: 0.92rem; margin: 0 0 0.4rem; }
  .cmx { border-collapse: collapse; font: 0.7rem var(--mono); }
  .cmx th { color: var(--pencil); font-weight: 500; padding: 0.1rem 0.25rem; }
  .cmx th.rn { text-align: left; font-family: var(--serif); white-space: nowrap; }
  .cmx td { min-width: 1.7rem; height: 1.45rem; text-align: center; border: 1px solid var(--rule); }
</style>
