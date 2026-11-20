/**
 * Kho trạng thái học tập dùng chung giữa các island (Mission, Debrief, SelfCheck) trên cùng một trang.
 * Các island là các ứng dụng Svelte riêng nhưng nạp chung module này, nên cùng thấy một $state.
 * Lưu trong localStorage (khoá "s2s-learn"); không có localStorage thì vẫn chạy, chỉ không nhớ sau khi tải lại.
 *
 * Trạng thái chỉ được nạp trong onMount (gọi init()), để HTML dựng sẵn trên máy chủ khớp với lần hydrate đầu.
 */
import { emptyState, type LearnState } from './learn';

const KEY = 's2s-learn';
const store = $state<{ ready: boolean; all: Record<string, LearnState> }>({ ready: false, all: {} });

export function init() {
  if (store.ready) return;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw)) store.all[k] = { ...emptyState(), ...(v as object) };
  } catch { /* bỏ qua dữ liệu hỏng hoặc trình duyệt chặn lưu trữ */ }
  store.ready = true;
}

const EMPTY = emptyState();
/** Trạng thái của một bài (chỉ đọc). Trước khi init(), trả về trạng thái rỗng. */
export const get = (slug: string): LearnState => store.all[slug] ?? EMPTY;

/** Sửa trạng thái của một bài rồi lưu lại. Chỉ gọi trong trình xử lý sự kiện. */
export function update(slug: string, fn: (s: LearnState) => void) {
  if (!store.all[slug]) store.all[slug] = emptyState();
  fn(store.all[slug]);
  try { localStorage.setItem(KEY, JSON.stringify($state.snapshot(store.all))); } catch { /* không lưu được thì thôi */ }
}

export function reset(slug: string) {
  delete store.all[slug];
  try { localStorage.setItem(KEY, JSON.stringify($state.snapshot(store.all))); } catch { /* như trên */ }
}
