/** Mọi bài đã có bài giảng. Thêm bài mới vào đây; tests/giang.test.ts tự kiểm tra kịch bản và âm thanh. */
import type { Lecture } from './types';
import { gdLecture } from './gradient-descent';

export const allLectures: Record<string, () => Lecture> = {
  'gradient-descent': gdLecture,
};
