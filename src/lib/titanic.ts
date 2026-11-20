/** Tên và cách đọc các đặc trưng Titanic bằng tiếng Việt. */
export const featName = ['Giới tính', 'Hạng vé', 'Tuổi', 'Giá vé', 'Số người thân'];
export const featUnit = ['', '', ' tuổi', ' bảng', ' người'];

export function condText(f: number, thr: number, left: boolean): string {
  if (f === 0) return left ? 'Nam' : 'Nữ';
  if (f === 1) {
    if (thr < 2) return left ? 'Hạng 1' : 'Hạng 2–3';
    return left ? 'Hạng 1–2' : 'Hạng 3';
  }
  const v = String(+thr.toFixed(2)).replace('.', ',');
  return `${featName[f]} ${left ? '≤' : '>'} ${v}`;
}

export function questionText(f: number, thr: number): string {
  if (f === 0) return 'Nam?';
  if (f === 1) return thr < 2 ? 'Hạng 1?' : 'Hạng 1–2?';
  return `${featName[f]} ≤ ${String(+thr.toFixed(2)).replace('.', ',')}?`;
}
