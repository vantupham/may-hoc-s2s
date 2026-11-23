/**
 * Sitemap cho máy tìm kiếm: trang chủ, trang giới thiệu và mọi bài đã phát hành.
 * Trang nằm trong thư mục con của github.io nên không đặt được robots.txt ở gốc tên miền;
 * nộp tay địa chỉ /may-hoc-s2s/sitemap.xml trong Google Search Console và Bing Webmaster Tools.
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
