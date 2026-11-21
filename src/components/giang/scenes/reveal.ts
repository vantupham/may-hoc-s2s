/** Độ hiện của mục thứ i khi đã mở n mục (n được nội suy nên mục hiện dần). */
export const shown = (n: unknown, i: number) => Math.max(0, Math.min(1, Number(n ?? 0) - i));
export const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
