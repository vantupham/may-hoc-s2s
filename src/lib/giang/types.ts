/**
 * Bài giảng có lời: mỗi bài là các chương (khớp các bước của trang), mỗi chương gồm các cảnh,
 * mỗi cảnh là một component trong src/components/giang/scenes kèm các câu thoại.
 *
 * Mỗi câu thoại có thể đặt lại trạng thái của cảnh (`set`). Trình phát gộp các `set` từ đầu cảnh
 * tới câu hiện tại và nội suy số trong lúc câu đang được đọc, nên cảnh là hàm thuần của thời gian:
 * tua tới đâu cũng thấy đúng hình.
 */

/** Giá trị trạng thái của cảnh. Số và mảng số được nội suy; giá trị khác đổi ngay khi câu bắt đầu. */
export type Val = number | string | boolean | number[] | null;
export type SceneState = Record<string, Val>;

export interface Line {
  /** Phụ đề, có thể chứa ký hiệu và số kiểu Việt (0,37) */
  cap: string;
  /** Lời đọc, nếu khác phụ đề (công thức, ký hiệu). Mặc định: speak(cap) */
  say?: string;
  /** Trạng thái cảnh sau câu này */
  set?: SceneState;
  /** Thời gian chuyển động tính bằng giây (mặc định 1,2), hoặc 'line' = suốt câu */
  anim?: number | 'line';
  /** Kiểu chuyển động: 'io' êm hai đầu (mặc định), 'lin' đều */
  ease?: 'io' | 'lin';
}

export interface Scene {
  /** Đường dẫn component tính từ src/components/giang/scenes, không có đuôi .svelte */
  view: string;
  props?: Record<string, unknown>;
  /** Trạng thái ban đầu của cảnh */
  init?: SceneState;
  lines: Line[];
}

export interface Chapter {
  id: string;
  title: string;
  /** id của bước trong bài (lessons.ts → sections), để nhảy tới phòng thí nghiệm tương ứng */
  section: string;
  scenes: Scene[];
}

export interface Lecture {
  slug: string;
  voice: string;
  chapters: Chapter[];
}

/** Câu thoại đã chuẩn bị xong: có lời đọc và mã băm (để biết âm thanh còn khớp hay không). */
export interface BuiltLine extends Line {
  say: string;
  h: string;
}
export interface BuiltScene extends Omit<Scene, 'lines'> { lines: BuiltLine[] }
export interface BuiltChapter extends Omit<Chapter, 'scenes'> { scenes: BuiltScene[] }
export interface BuiltLecture extends Omit<Lecture, 'chapters'> { chapters: BuiltChapter[] }

/** Tệp thời gian do scripts/gen_voice.py sinh ra cùng tệp âm thanh. */
export interface Timing {
  voice: string;
  /** Khoảng lặng chèn sau mỗi câu, giây (đã nằm sẵn trong tệp âm thanh) */
  gap: number;
  /** Theo đúng thứ tự câu trong bài: mã băm và thời lượng (giây, chưa gồm khoảng lặng) */
  lines: { h: string; d: number }[];
}
