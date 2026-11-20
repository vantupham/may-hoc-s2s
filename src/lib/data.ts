/**
 * Tải dữ liệu JSON trên trình duyệt, mỗi URL chỉ tải một lần cho cả trang.
 *
 * URL lấy từ `import url from '../data/x.json?url'`: Vite xuất tệp vào _astro/ kèm mã băm,
 * nên dữ liệu không bị nhúng vào HTML và trình duyệt lưu đệm được lâu dài.
 */
const cache = new Map<string, Promise<unknown>>();

export function loadJSON<T = unknown>(url: string): Promise<T> {
  if (!cache.has(url)) {
    const p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Không tải được ${url.split('/').pop()} (${r.status})`);
      return r.json();
    });
    p.catch(() => cache.delete(url)); // lỗi mạng: lần sau thử lại
    cache.set(url, p);
  }
  return cache.get(url) as Promise<T>;
}

/** "url" trả về cả tệp; "url#a.b" trả về trường a.b bên trong. */
export async function loadAt(src: string): Promise<unknown> {
  const h = src.indexOf('#');
  const url = h < 0 ? src : src.slice(0, h);
  const path = h < 0 ? '' : src.slice(h + 1);
  let v: any = await loadJSON(url);
  for (const k of path ? path.split('.') : []) {
    if (v == null || !(k in v)) throw new Error(`Không có trường "${path}" trong ${url.split('/').pop()}`);
    v = v[k];
  }
  return v;
}
