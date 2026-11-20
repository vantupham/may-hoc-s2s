<script lang="ts">
  /** Khám phá dữ liệu ung thư vú: bán kính trung bình × độ nhám kết cấu, tô màu theo chẩn đoán. */
  import { scaleLinear } from 'd3';
  import Axis from '../Axis.svelte';
  import { fmt } from '../../lib/ml-core';

  interface P { id: number; radius: number; texture: number; y: number }
  let { patients }: { patients: P[] } = $props();
  let hover = $state<P | null>(null);
  let show = $state<'all' | 'pos' | 'neg'>('all');

  const W = 620, H = 380, m = { t: 30, r: 14, b: 44, l: 48 };
  const sx = scaleLinear().domain([6, 29]).range([m.l, W - m.r]);
  const sy = scaleLinear().domain([9, 40]).range([H - m.b, m.t]);
  const pos = $derived(patients.filter((p) => p.y === 1));
  const neg = $derived(patients.filter((p) => p.y === 0));
  const avg = (a: P[], k: 'radius' | 'texture') => a.reduce((s, p) => s + p[k], 0) / a.length;
</script>

<div class="lab">
  <p class="lab-title">569 bệnh nhân, hai đặc trưng</p>
  <p class="lab-hint">Mỗi điểm là một mẫu sinh thiết. Hai đặc trưng được đo từ ảnh hiển vi tế bào: bán kính trung bình của nhân tế bào và độ nhám kết cấu (độ lệch chuẩn của mức xám).</p>
  <div class="ctrl" role="radiogroup" aria-label="Lọc theo chẩn đoán">
    <label><input type="radio" bind:group={show} value="all" /> Tất cả</label>
    <label><input type="radio" bind:group={show} value="pos" /> <span class="dot pos"></span> Ác tính ({pos.length})</label>
    <label><input type="radio" bind:group={show} value="neg" /> <span class="dot neg"></span> Lành tính ({neg.length})</label>
  </div>
  <div class="grid">
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ phân tán bệnh nhân">
      <Axis scale={sx} orient="bottom" size={H - m.t - m.b} offset={H - m.b} label="Bán kính trung bình (µm)" />
      <Axis scale={sy} orient="left" size={W - m.l - m.r} offset={m.l} label="Độ nhám kết cấu" />
      {#each patients as p (p.id)}
        {#if show === 'all' || (show === 'pos') === (p.y === 1)}
          <circle cx={sx(p.radius)} cy={sy(p.texture)} r={hover?.id === p.id ? 6 : 3.5}
            fill={p.y ? 'var(--c-pos)' : 'var(--c-neg)'} fill-opacity="0.5" stroke={hover?.id === p.id ? 'var(--ink)' : 'none'}
            role="presentation" onmouseenter={() => (hover = p)} onmouseleave={() => (hover = null)} />
        {/if}
      {/each}
    </svg>
    <div class="info">
      {#if hover}
        <p><b>Bệnh nhân #{hover.id}</b></p>
        <p>Bán kính: <span class="num">{fmt(hover.radius, 2)}</span> µm</p>
        <p>Độ nhám: <span class="num">{fmt(hover.texture, 2)}</span></p>
        <p>Chẩn đoán: <b style={`color:var(${hover.y ? '--c-pos' : '--c-neg'})`}>{hover.y ? 'Ác tính' : 'Lành tính'}</b></p>
      {:else}
        <table class="data">
          <thead><tr><th>Trung bình</th><th>Ác tính</th><th>Lành tính</th></tr></thead>
          <tbody>
            <tr><td>Bán kính</td><td>{fmt(avg(pos, 'radius'), 2)}</td><td>{fmt(avg(neg, 'radius'), 2)}</td></tr>
            <tr><td>Độ nhám</td><td>{fmt(avg(pos, 'texture'), 2)}</td><td>{fmt(avg(neg, 'texture'), 2)}</td></tr>
          </tbody>
        </table>
        <p class="muted">Khối u ác tính có xu hướng to và nhám hơn, nhưng hai nhóm chồng lấn nhau ở giữa — không có ranh giới hoàn hảo.</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 1rem; align-items: start; }
  @media (max-width: 760px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  .info { font-size: 0.86rem; background: var(--paper); border: 1px solid var(--rule); border-radius: 3px; padding: 0.7rem 0.9rem; }
  .info p { margin: 0 0 0.3rem; }
  .muted { color: var(--faint); margin-top: 0.6rem !important; }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
  .dot.pos { background: var(--c-pos); } .dot.neg { background: var(--c-neg); }
</style>
