/**
 * Dự án chương 12: kiểu dữ liệu và cách dựng đặc trưng từ chỉ số PM2.5 Hà Nội theo ngày.
 * Khớp từng chữ số với hàm features() trong scripts/prep_ch12.py (kiểm thử: tests/ch12.test.ts).
 */
import { lag, rollingMean, cyclic, conv1d, attnLast } from './ml-core';
import type { Cell } from './ml-core';

export interface Station { id: number; name: string; lat: number; lon: number; first: string; last: string; neg: number; stuckRuns: number; stuckHours: number; fiveMin: boolean; r: number; bias: number; kind: 'gov' | 'lowcost'; used: boolean; why: string }
export interface Day { d: string; pm: number | null; n: number; ws: number | null; rh: number | null; t: number | null; rain: number | null; blh: number | null; p: number | null; north: number | null; cams: number | null; st: (number | null)[]; kind: number }
export interface AirMeta { start: string; end: string; test0: string; test1: string; thr: number; rules: { stuck: number; minHours: number; startupDays: number; rmin: number }; stations: Station[]; qa: Record<string, number>; feats: string[] }
export interface Air { meta: AirMeta; days: Day[] }

export interface BoardRow { id: string; name: string; ch: string; note: string; mae?: number; auc?: number; alertAcc?: number; mae72?: number }

/** 12 đặc trưng cho ngày dự báo d+1, chỉ dùng số liệu đến hết ngày d (và thời tiết ngày mai thay cho bản tin dự báo). */
export const FEATS = ['pm0', 'pm1', 'pm7', 'ws', 'rh', 't', 'rain', 'blh', 'north', 'dp', 'sin', 'cos'] as const;
export const FEAT_VI: Record<string, string> = {
  pm0: 'PM2.5 hôm nay', pm1: 'PM2.5 hôm qua', pm7: 'TB 7 ngày', ws: 'gió ngày mai', rh: 'độ ẩm ngày mai', t: 'nhiệt độ ngày mai',
  rain: 'mưa ngày mai', blh: 'lớp biên ngày mai', north: 'gió bắc ngày mai', dp: 'áp suất tăng', sin: 'mùa (sin)', cos: 'mùa (cos)',
};

export interface Row { d: string; target: string; x: number[]; y: number; split: 'train' | 'test' | 'live' }

const nextDay = (d: string) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };
export const dayOfYear = (d: string) => { const t = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)); return Math.round((t - Date.UTC(+d.slice(0, 4), 0, 1)) / 864e5) + 1; };

/** Dựng các dòng có đủ đặc trưng và có nhãn y = PM2.5 ngày mai. pmCol cho phép thay chuỗi PM2.5 (ví dụ đã điền thiếu). */
export function buildRows(days: Day[], meta: Pick<AirMeta, 'test0' | 'test1'>, pmCol?: Cell[]): Row[] {
  const pm: Cell[] = pmCol ?? days.map((d) => d.pm);
  const pm1 = lag(pm, 1), pm7 = rollingMean(pm, 7);
  const rows: Row[] = [];
  for (let i = 0; i + 1 < days.length; i++) {
    const a = days[i], b = days[i + 1], y = pm[i + 1];
    if (pm[i] === null || pm1[i] === null || y === null) continue;
    const w = [b.ws, b.rh, b.t, b.rain, b.blh, b.north];
    if (w.some((v) => v === null) || a.p === null || b.p === null || pm7[i] === null) continue;
    const target = nextDay(a.d);
    const [s, c] = cyclic(dayOfYear(target), 365.25);
    const x = [pm[i]!, pm1[i]!, pm7[i]!, ...(w as number[]), b.p - a.p, s, c];
    rows.push({ d: a.d, target, x, y: y!, split: target < meta.test0 ? 'train' : target < meta.test1 ? 'test' : 'live' });
  }
  return rows;
}

/** Chuẩn hoá theo trung bình và độ lệch chuẩn (ddof = 0) của tập huấn luyện. */
export function scaler(train: number[][]) {
  const d = train[0].length, n = train.length;
  const mu = Array.from({ length: d }, (_, j) => train.reduce((a, r) => a + r[j], 0) / n);
  const sd = Array.from({ length: d }, (_, j) => Math.sqrt(train.reduce((a, r) => a + (r[j] - mu[j]) ** 2, 0) / n));
  return { mu, sd, z: (r: number[]) => r.map((v, j) => (v - mu[j]) / sd[j]) };
}

/** AUC = xác suất một ngày vượt ngưỡng ngẫu nhiên có điểm cao hơn một ngày không vượt (tính hạng, hoà tính nửa). */
export function auc(score: number[], pos: boolean[]): number {
  const idx = score.map((s, i) => [s, i] as const).sort((a, b) => a[0] - b[0]);
  const rank = new Array(score.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) rank[idx[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  const nP = pos.filter(Boolean).length, nN = pos.length - nP;
  const sumP = pos.reduce((a, p, i) => a + (p ? rank[i] : 0), 0);
  return (sumP - (nP * (nP + 1)) / 2) / (nP * nN);
}

// ---------------------------------------------------------------- Mạng trên cửa sổ 72 giờ (chương 10, 11)
export interface CnnW { w: number[][][]; b: number[]; u: number[]; v: number[]; c: number }
export interface AttW { Wq: number[][]; Wk: number[][]; Wv: number[][]; u: number[]; v: number[]; c: number }
export interface Win { d: string; x: number[][]; tom: number[]; y: number }
export interface Nets { L: number; K: number; ch: string[]; tom: string[]; hm: number[]; hs: number[]; cnn: CnnW; attn: AttW; wins: Win[]; pCnn: number[]; pAtt: number[] }

/** CNN 1D: mỗi bộ lọc trượt dọc 72 giờ → ReLU → [trung bình, giá trị cuối] → cộng với thời tiết ngày mai. Đơn vị đầu ra: µg/m³. */
export function cnn72(net: CnnW, win: Win) {
  const maps = net.w.map((f, k) => conv1d(win.x, f, net.b[k]).map((z) => Math.max(0, z)));
  const feat = [...maps.map((a) => a.reduce((s, v) => s + v, 0) / a.length), ...maps.map((a) => a[a.length - 1])];
  const fromConv = feat.reduce((s, v, i) => s + v * net.u[i], 0);
  const fromTom = win.tom.reduce((s, v, i) => s + v * net.v[i], 0);
  return { maps, feat, fromConv, fromTom, pred: (fromConv + fromTom + net.c) * 100 };
}

/** Thêm giờ trong ngày (sin, cos) vào mỗi bước, như mã hoá vị trí. Cửa sổ kết thúc lúc 23 giờ. */
export function withHour(x: number[][]): number[][] {
  return x.map((r, t) => { const h = t % 24; return [...r, Math.sin((2 * Math.PI * h) / 24), Math.cos((2 * Math.PI * h) / 24)]; });
}

/** Attention: truy vấn là giờ cuối cùng (23 giờ hôm nay), nhìn lại cả 72 giờ. */
export function attn72(net: AttW, win: Win) {
  const r = attnLast(withHour(win.x), net.Wq, net.Wk, net.Wv);
  const fromCtx = r.ctx.reduce((s, v, i) => s + v * net.u[i], 0);
  const fromTom = win.tom.reduce((s, v, i) => s + v * net.v[i], 0);
  return { ...r, fromCtx, fromTom, pred: (fromCtx + fromTom + net.c) * 100 };
}

export const fmtDate = (d: string) => `${+d.slice(8, 10)}/${+d.slice(5, 7)}/${d.slice(0, 4)}`;
export const shortDate = (d: string) => `${+d.slice(8, 10)}/${+d.slice(5, 7)}`;
