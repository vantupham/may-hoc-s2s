/**
 * Bài giảng có lời: đọc số, dòng thời gian, và mỗi bài lecture: true có kịch bản hợp lệ
 * cùng âm thanh khớp kịch bản (quên chạy scripts/gen_voice.py sau khi sửa lời thì kiểm thử đỏ).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readInt, readNumber, speak } from '../src/lib/giang/speak';
import { makeTimeline, locate, sceneState, timingMatches, chapterAt, DEFAULT_GAP } from '../src/lib/giang/timeline';
import { buildLecture } from '../src/lib/giang/build';
import { allLectures } from '../src/lib/giang/index';
import type { BuiltLecture, Timing } from '../src/lib/giang/types';
import { lessons, sectionsFor } from '../src/lib/lessons';
import { allLearn } from '../src/lib/hoc/index';
import { fmt } from '../src/lib/ml-core';

const ROOT = join(__dirname, '..');

describe('đọc số tiếng Việt', () => {
  it('số nguyên', () => {
    expect(readInt(0)).toBe('không');
    expect(readInt(5)).toBe('năm');
    expect(readInt(15)).toBe('mười lăm');
    expect(readInt(21)).toBe('hai mươi mốt');
    expect(readInt(25)).toBe('hai mươi lăm');
    expect(readInt(105)).toBe('một trăm linh năm');
    expect(readInt(400)).toBe('bốn trăm');
    expect(readInt(1990)).toBe('một nghìn chín trăm chín mươi');
    expect(readInt(20640)).toBe('hai mươi nghìn sáu trăm bốn mươi');
    expect(readInt(1005)).toBe('một nghìn không trăm linh năm');
    expect(readInt(2_000_000)).toBe('hai triệu');
  });
  it('số thập phân, số âm, nhóm nghìn', () => {
    expect(readNumber('0,37')).toBe('không phẩy ba mươi bảy');
    expect(readNumber('0,3700')).toBe('không phẩy ba mươi bảy');
    expect(readNumber('0,05')).toBe('không phẩy không năm');
    expect(readNumber('0,1111')).toBe('không phẩy một một một một');
    expect(readNumber('−11,11')).toBe('âm mười một phẩy mười một');
    expect(readNumber('20.640')).toBe('hai mươi nghìn sáu trăm bốn mươi');
    expect(readNumber('2,0')).toBe('hai');
  });
  it('phụ đề thành lời đọc', () => {
    expect(speak('w = 0 − 0,01 × (−11,11)')).toBe('w bằng không trừ không phẩy không một nhân âm mười một phẩy mười một');
    expect(speak('ŷ = w · x')).toBe('y mũ bằng w nhân x');
    expect(speak('η < 2/L″ ≈ 0,0666')).toContain('ê-ta nhỏ hơn');
    expect(speak('Vòng 2, vòng 3, … tới vòng 6.')).toBe('Vòng hai, vòng ba, tới vòng sáu.');
    expect(speak('5 khu vực, 10.000 USD')).toBe('năm khu vực, mười nghìn đô la');
    expect(speak('<b>đậm</b> và x²')).toBe('đậm và x bình phương');
    expect(speak('S2S')).toBe('S2S'); // chữ số dính chữ cái: để nguyên cho máy đọc
  });
});

const tiny: BuiltLecture = buildLecture({
  slug: 'thu', voice: 'v',
  chapters: [
    { id: 'a', title: 'A', section: 'bai-toan', scenes: [{ view: 'Title', init: { x: 0 }, lines: [{ cap: 'một hai ba', set: { x: 10 }, anim: 2, ease: 'lin' }, { cap: 'bốn', set: { m: 'b' } }] }] },
    { id: 'b', title: 'B', section: 'tinh-tay', scenes: [{ view: 'Title', lines: [{ cap: 'năm sáu' }] }] },
  ],
});

describe('dòng thời gian', () => {
  const timing: Timing = { voice: 'v', gap: 0.5, lines: tiny.chapters.flatMap((c) => c.scenes.flatMap((s) => s.lines.map((l, i) => ({ h: l.h, d: 2 + i })))) };
  const tl = makeTimeline(tiny, timing);
  it('dùng thời lượng của âm thanh khi khớp', () => {
    expect(tl.audio).toBe(true);
    expect(tl.cues.map((c) => c.start)).toEqual([0, 2.5, 6]);
    expect(tl.total).toBeCloseTo(8.5);
    expect(tl.chapters.map((c) => c.start)).toEqual([0, 6]);
  });
  it('rơi về ước lượng khi âm thanh lệch kịch bản', () => {
    const bad = { ...timing, lines: timing.lines.map((l, i) => (i === 1 ? { ...l, h: 'khac' } : l)) };
    expect(timingMatches(tiny, bad)).toBe(false);
    expect(timingMatches(tiny, { ...timing, voice: 'w' })).toBe(false);
    const est = makeTimeline(tiny, bad);
    expect(est.audio).toBe(false);
    expect(est.cues[1].start).toBeCloseTo(est.cues[0].end + DEFAULT_GAP);
  });
  it('tìm câu đang đọc ở biên', () => {
    expect(locate(tl, -1)).toBe(0);
    expect(locate(tl, 0)).toBe(0);
    expect(locate(tl, 2.49)).toBe(0); // khoảng lặng sau câu vẫn thuộc câu đó
    expect(locate(tl, 2.5)).toBe(1);
    expect(locate(tl, 100)).toBe(2);
    expect(chapterAt(tl, 5.99)).toBe(0);
    expect(chapterAt(tl, 6)).toBe(1);
  });
  it('trạng thái cảnh nội suy trong câu và giữ sau câu', () => {
    const sc = tiny.chapters[0].scenes[0];
    expect(sceneState(sc, 0, 0, 2).x).toBe(0);
    expect(sceneState(sc, 0, 1, 2).x).toBeCloseTo(5);
    expect(sceneState(sc, 0, 5, 2).x).toBe(10);
    expect(sceneState(sc, 0, 1, 2, true).x).toBe(10); // giảm chuyển động: nhảy thẳng tới cuối
    expect(sceneState(sc, 1, 0, 1)).toEqual({ x: 10, m: 'b' });
  });
});

/** [id nhiệm vụ, hàng, cột, số chữ số thập phân khi nói] — các số trong bảng ghi mà bài giảng nhắc lại */
const LECTURE_NUMBERS: Record<string, [string, number, number, number][]> = {
  'gradient-descent': [['tay', 0, 1, 3], ['tay', 1, 1, 3], ['vong', 0, 0, 4], ['vong', 1, 0, 3], ['vong', 2, 0, 4], ['eta', 0, 0, 3]],
};

const views = (lec: BuiltLecture) => [...new Set(lec.chapters.flatMap((c) => c.scenes.map((s) => s.view)))];

for (const lesson of lessons.filter((l) => l.lecture)) {
  describe(`bài giảng ${lesson.no}: ${lesson.short}`, () => {
    const make = allLectures[lesson.slug];
    it('có kịch bản', () => expect(make).toBeTypeOf('function'));
    if (!make) return;
    const lec = buildLecture(make());
    const lines = lec.chapters.flatMap((c) => c.scenes.flatMap((s) => s.lines));

    it('chương trỏ tới bước có thật, cảnh có component', () => {
      expect(lec.slug).toBe(lesson.slug);
      const ids = sectionsFor(lesson).map((s) => s.id);
      for (const c of lec.chapters) expect(ids, c.title).toContain(c.section);
      for (const v of views(lec)) expect(existsSync(join(ROOT, 'src/components/giang/scenes', `${v}.svelte`)), v).toBe(true);
    });
    it('câu thoại không rỗng, lời đọc không còn ký hiệu khó đọc', () => {
      for (const l of lines) {
        expect(l.cap.trim().length, l.cap).toBeGreaterThan(0);
        expect(l.say, l.cap).not.toMatch(/[=≈×·∂Σηŷ<>→←]|\d,\d/);
      }
    });
    it('âm thanh và phụ đề khớp kịch bản (chạy lại scripts/gen_voice.py nếu đỏ)', () => {
      const dir = join(ROOT, 'public/giang', lesson.slug);
      const timing: Timing = JSON.parse(readFileSync(join(dir, 'thoi-gian.json'), 'utf8'));
      expect(timingMatches(lec, timing)).toBe(true);
      const tl = makeTimeline(lec, timing);
      expect(tl.total / 60).toBeGreaterThan(8);
      expect(tl.total / 60).toBeLessThan(12.5);
      // MP3 CBR 24 kHz 48 kbps: 144 byte mỗi 24 ms
      expect(statSync(join(dir, 'loi-giang.mp3')).size).toBe(Math.round((tl.total / 0.024) * 144));
      const vtt = readFileSync(join(dir, 'phu-de.vtt'), 'utf8');
      expect(vtt.startsWith('WEBVTT')).toBe(true);
      expect(vtt.split('-->').length - 1).toBe(lines.length);
    });
    // Những số người học ghi vào bảng trải nghiệm phải được nói đúng y như vậy trong bài giảng
    const learn = allLearn.find((l) => l.slug === lesson.slug);
    const spoken = lines.map((l) => l.cap).join(' ');
    const want = (LECTURE_NUMBERS[lesson.slug] ?? []).map(([m, r, c, d]) => fmt(learn!.missions.find((x) => x.id === m)!.record!.rows[r].values[c], d));
    if (want.length) it('số trong lời giảng khớp bảng ghi của bài', () => { for (const s of want) expect(spoken).toContain(s); });
  });
}
