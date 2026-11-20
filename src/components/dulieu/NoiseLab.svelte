<script lang="ts">
  /** Nhãn sai: lật p% nhãn huấn luyện, đo độ chính xác trên tập test sạch, rồi tìm lại nhãn bị lật bằng confident learning. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import Tex from '../Tex.svelte';
  import { standardize, flipLabels, logregL2, probaOf, oofProba, confidentFlags, chunks, fmt, tex } from '../../lib/ml-core';
  import { loadCancer30, type Cancer30 } from '../../lib/dulieu';

  let bc = $state.raw<Cancer30 | null>(null);
  let err = $state('');
  $effect(() => { loadCancer30().then((c) => (bc = c)).catch((e) => (err = e.message)); });

  const prep = $derived.by(() => {
    if (!bc) return null;
    const test = new Set(bc.testIds);
    const tr = bc.X.map((_, i) => i).filter((i) => !test.has(i));
    const st = bc.features.map((_, j) => standardize([0], tr.map((i) => bc!.X[i][j])));
    const sc = (r: number[]) => r.map((v, j) => (v - st[j].mu) / st[j].sd);
    return { tr, X: tr.map((i) => sc(bc!.X[i])), y: tr.map((i) => bc!.y[i]), Xt: bc.testIds.map((i) => sc(bc!.X[i])), yt: bc.testIds.map((i) => bc!.y[i]) };
  });

  let pct = $state(20);
  let busy = $state(false);
  interface Res { p: number; acc: number; flipped: number[]; flags: number[]; t: number[]; prob: number[]; y: number[] }
  let res = $state.raw<Res | null>(null);
  let history = $state.raw<{ p: number; acc: number; hit: number; flagged: number }[]>([]);

  function run(p: number, d: NonNullable<typeof prep>) {
    const all = d.y.map((_, i) => i);
    const f = flipLabels(d.y, all, p / 100, 11);
    const th = logregL2(d.X, f.y, 1);
    const acc = d.Xt.reduce((a, x, i) => a + ((probaOf(th, x) >= 0.5 ? 1 : 0) === d.yt[i] ? 1 : 0), 0) / d.yt.length;
    const prob = oofProba(d.X, f.y, chunks(all, 5), 1);
    const c = confidentFlags(prob, f.y);
    return { p, acc, flipped: f.flipped, flags: c.flags, t: c.t, prob, y: f.y };
  }
  $effect(() => {
    const d = prep, p = pct;
    if (!d) return;
    busy = true;
    const h = setTimeout(() => {
      const r = run(p, d);
      res = r;
      const fl = new Set(r.flipped);
      history = [...history.filter((q) => q.p !== p), { p, acc: r.acc, hit: r.flags.filter((i) => fl.has(i)).length, flagged: r.flags.length }].sort((a, b) => a.p - b.p);
      busy = false;
    }, 30);
    return () => clearTimeout(h);
  });

  const flippedSet = $derived(new Set(res?.flipped ?? []));
  const hit = $derived(res ? res.flags.filter((i) => flippedSet.has(i)).length : 0);
  let row = $state(0);
  const pick = $derived(res ? res.flags[Math.min(row, res.flags.length - 1)] : undefined);
  const lab = (v: number) => (v === 1 ? 'ác tính' : 'lành tính');

  const W = 520, H = 220, m = { t: 14, r: 14, b: 42, l: 50 };
  const sx = scaleLinear().domain([0, 40]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([0.5, 1]).range([H - m.b, m.t]);
</script>

<div class="lab">
  <p class="lab-title">Nhãn sai: mô hình học sai, rồi chính mô hình tìm ra nhãn sai</p>
  {#if err}<p class="lab-hint">{err}</p>{:else if !prep}<p class="lab-hint">Đang tải 569 mẫu sinh thiết với 30 đặc trưng…</p>{:else}
    <p class="lab-hint">455 mẫu huấn luyện, 114 mẫu test giữ nguyên nhãn đúng. Ta cố ý lật nhãn của p% mẫu huấn luyện (lành thành ác, ác thành lành), học hồi quy logistic trên 30 đặc trưng, rồi đo trên tập test.</p>
    <div class="ctrl"><label>Tỷ lệ nhãn bị lật p = <span class="num">{pct}%</span><input type="range" min="0" max="40" step="5" bind:value={pct} aria-label="Tỷ lệ nhãn bị lật" /></label>{#if busy}<span class="dim">đang học lại 6 mô hình…</span>{/if}</div>
    {#if res}
      <div class="lab-grid">
        <div>
          <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Độ chính xác trên tập test theo tỷ lệ nhãn bị lật">
            <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Tỷ lệ nhãn huấn luyện bị lật (%)" ticks={8} />
            <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Độ chính xác test" ticks={5} />
            <path d={history.map((h, i) => `${i ? 'L' : 'M'}${sx(h.p)},${sy(h.acc)}`).join('')} fill="none" stroke="var(--tim)" stroke-width="2" />
            {#each history as h}<circle cx={sx(h.p)} cy={sy(h.acc)} r={h.p === pct ? 6 : 4} fill={h.p === pct ? 'var(--bad)' : 'var(--tim)'} />{/each}
          </svg>
          <p class="cap">Mỗi lần kéo thanh trượt, một điểm mới được vẽ thêm. Kéo qua vài mức để thấy cả đường.</p>
        </div>
        <div>
          <table class="data">
            <tbody>
              <tr><td>Nhãn bị lật</td><td>{res.flipped.length} / 455</td></tr>
              <tr><td>Độ chính xác trên test sạch</td><td><b>{fmt(100 * res.acc, 1)}%</b></td></tr>
              <tr><td>Bị mô hình "phản đối"</td><td>{res.flags.length}</td></tr>
              <tr><td>…trong đó đúng là bị lật</td><td>{hit}{res.flags.length ? ` (${fmt((100 * hit) / res.flags.length, 0)}%)` : ''}</td></tr>
              <tr><td>Nhãn lật bị bỏ sót</td><td>{res.flipped.length - hit}</td></tr>
            </tbody>
          </table>
          <p class="cap">Ngưỡng tự tin: <Tex tex={String.raw`t_{\text{lành}} = ${tex(res.t[0], 3)},\ t_{\text{ác}} = ${tex(res.t[1], 3)}`} /></p>
        </div>
      </div>
      <h4>Những mẫu bị nghi mang nhãn sai</h4>
      <p class="cap">Mỗi mẫu được chấm bởi một mô hình <b>không thấy nó khi học</b> (chia 5 phần, như cross-validation). Nếu mô hình đó tin mạnh vào lớp kia — mạnh hơn mức tin trung bình mà các mẫu của lớp kia nhận được — thì nhãn của mẫu đáng nghi.</p>
      <div class="lab-grid">
        <table class="data">
          <thead><tr><th>Mẫu</th><th>Nhãn đang ghi</th><th>P(lớp kia)</th><th>Bị lật thật?</th></tr></thead>
          <tbody>
            {#each res.flags.slice(0, 8) as i, k}
              {@const po = res.y[i] === 1 ? 1 - res.prob[i] : res.prob[i]}
              <tr class:on={row === k}><td><button class="val" class:sel={row === k} type="button" onclick={() => (row = k)}>#{prep.tr[i]}</button></td><td>{lab(res.y[i])}</td><td>{fmt(po, 3)}</td><td>{flippedSet.has(i) ? '✓ có' : '✗ không'}</td></tr>
            {/each}
          </tbody>
        </table>
        <div>
          {#if pick !== undefined}
            {@const yv = res.y[pick]}{@const other = 1 - yv}{@const po = other === 1 ? res.prob[pick] : 1 - res.prob[pick]}
            <Tex tex={String.raw`\text{nghi sai} \iff \hat p(\text{${lab(other)}}) \ge t_{\text{${other === 1 ? 'ác' : 'lành'}}}`} display />
            <Tex tex={String.raw`${tex(po, 3)} \ \ge\ ${tex(res.t[other], 3)} \;\Rightarrow\; \text{nghi sai}`} display />
            <p class="cap">Mẫu #{prep.tr[pick]} đang ghi "{lab(yv)}". Ngưỡng t của lớp {lab(other)} là trung bình P({lab(other)}) trên các mẫu đang mang nhãn {lab(other)}.{flippedSet.has(pick) ? ' Đây đúng là một nhãn ta đã lật.' : ' Ta không lật nhãn này: hoặc là ca khó, hoặc nhãn gốc của bộ dữ liệu đã sai sẵn.'}</p>
          {:else}<p class="cap">Không có mẫu nào bị nghi.</p>{/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .cap { font-size: 0.86rem; color: var(--pencil); }
  .dim { color: var(--faint); font-size: 0.85rem; }
  h4 { margin: 1.4rem 0 0.2rem; }
  tr.on td { background: var(--hl); }
</style>
