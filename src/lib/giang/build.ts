/**
 * Chuẩn bị bài giảng lúc build (chạy trên Node): điền lời đọc và mã băm cho từng câu.
 * Mã băm = sha1(giọng + lời đọc), cùng công thức với scripts/gen_voice.py dùng để đặt tên tệp đệm.
 */
import { createHash } from 'node:crypto';
import { speak } from './speak';
import type { BuiltLecture, Lecture } from './types';

export const lineHash = (voice: string, say: string) => createHash('sha1').update(`${voice}\n${say}`).digest('hex').slice(0, 16);

export function buildLecture(lec: Lecture): BuiltLecture {
  return {
    ...lec,
    chapters: lec.chapters.map((c) => ({
      ...c,
      scenes: c.scenes.map((s) => ({
        ...s,
        lines: s.lines.map((l) => {
          const say = (l.say ?? speak(l.cap)).trim();
          return { ...l, say, h: lineHash(lec.voice, say) };
        }),
      })),
    })),
  };
}
