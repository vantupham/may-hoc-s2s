/**
 * Dòng thời gian của bài giảng: hàm thuần, không phụ thuộc trình duyệt (có kiểm thử).
 * Thời điểm t (giây) → câu đang đọc → cảnh và trạng thái của cảnh.
 */
import type { BuiltLecture, BuiltScene, SceneState, Timing, Val } from './types';

export interface Cue {
  start: number;
  /** Hết lời đọc (chưa gồm khoảng lặng) */
  end: number;
  /** Hết khoảng lặng: câu sau bắt đầu ở đây */
  next: number;
  ch: number;
  sc: number;
  /** Chỉ số câu trong cảnh */
  ln: number;
  cap: string;
}

export interface Timeline {
  cues: Cue[];
  chapters: { start: number; title: string; section: string }[];
  total: number;
  /** true: thời lượng lấy từ tệp âm thanh; false: ước lượng từ độ dài câu (chưa sinh giọng hoặc lệch) */
  audio: boolean;
}

/** Thời lượng ước lượng khi chưa có giọng: khoảng 3,1 âm tiết mỗi giây, giống giọng đọc thật. */
export function estimate(say: string): number {
  const syl = say.split(/\s+/).filter(Boolean).length;
  return Math.max(1.2, syl / 3.1 + 0.25);
}

export const DEFAULT_GAP = 0.36;

/** Âm thanh khớp kịch bản khi số câu và mọi mã băm trùng nhau. */
export function timingMatches(lec: BuiltLecture, timing: Timing | null | undefined): boolean {
  if (!timing || timing.voice !== lec.voice) return false;
  const hs = lec.chapters.flatMap((c) => c.scenes.flatMap((s) => s.lines.map((l) => l.h)));
  return hs.length === timing.lines.length && hs.every((h, i) => timing.lines[i].h === h);
}

export function makeTimeline(lec: BuiltLecture, timing?: Timing | null): Timeline {
  const ok = timingMatches(lec, timing);
  const gap = ok ? timing!.gap : DEFAULT_GAP;
  const cues: Cue[] = [];
  const chapters: Timeline['chapters'] = [];
  let t = 0, k = 0;
  lec.chapters.forEach((c, ch) => {
    chapters.push({ start: t, title: c.title, section: c.section });
    c.scenes.forEach((s, sc) => {
      s.lines.forEach((l, ln) => {
        const d = ok ? timing!.lines[k].d : estimate(l.say);
        cues.push({ start: t, end: t + d, next: t + d + gap, ch, sc, ln, cap: l.cap });
        t += d + gap;
        k++;
      });
    });
  });
  return { cues, chapters, total: t, audio: ok };
}

/** Chỉ số câu đang đọc tại thời điểm t (tìm nhị phân). */
export function locate(tl: Timeline, t: number): number {
  const c = tl.cues;
  if (c.length === 0) return -1;
  if (t <= 0) return 0;
  let lo = 0, hi = c.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (c[mid].start <= t) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/** Chương đang xem tại thời điểm t. */
export function chapterAt(tl: Timeline, t: number): number {
  let i = 0;
  for (let k = 0; k < tl.chapters.length; k++) if (tl.chapters[k].start <= t + 1e-9) i = k;
  return i;
}

const easeIO = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

function lerp(a: Val | undefined, b: Val, p: number): Val {
  if (typeof b === 'number' && typeof a === 'number') return a + (b - a) * p;
  if (Array.isArray(b) && Array.isArray(a) && a.length === b.length) return b.map((v, i) => (a[i] as number) + (v - (a[i] as number)) * p);
  return b;
}

/**
 * Trạng thái cảnh khi đang đọc câu ln, đã đọc được `elapsed` giây của câu đó (câu dài `dur` giây).
 * Các câu trước đã xong chuyển động; câu hiện tại nội suy từ trạng thái trước nó.
 */
export function sceneState(scene: BuiltScene, ln: number, elapsed: number, dur: number, reduced = false): SceneState {
  const st: SceneState = { ...(scene.init ?? {}) };
  for (let i = 0; i < ln && i < scene.lines.length; i++) Object.assign(st, scene.lines[i].set ?? {});
  const line = scene.lines[ln];
  if (!line?.set) return st;
  const span = line.anim === 'line' ? dur : (line.anim ?? 1.2);
  let p = reduced || span <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / span));
  if (line.ease !== 'lin') p = easeIO(p);
  for (const [k, v] of Object.entries(line.set)) st[k] = lerp(st[k], v, p);
  return st;
}

/** Định dạng phút:giây cho thanh tua. */
export function clock(t: number): string {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
