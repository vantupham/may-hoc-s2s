/**
 * Sitemap cho máy tìm kiếm: các trang tĩnh và mọi bài đã phát hành.
 * Site nằm trong thư mục con của github.io, nơi không có robots.txt riêng, nên sitemap được
 * khai báo qua <link rel="sitemap"> trong Base.astro và đăng ký trực tiếp với các công cụ tìm kiếm.
 */
import type { APIRoute } from 'astro';
import { lessons } from '../lib/lessons';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const paths = ['/', '/ve-du-an/', '/thuat-ngu/', '/du-lieu/', ...lessons.filter((l) => l.ready).map((l) => `/bai-hoc/${l.slug}/`)];
  const urls = paths.map((p) => `  <url><loc>${new URL(base + p, site).href}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
